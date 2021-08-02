const router = require("express").Router();
const User = require("../models/user");
const Chats = require("../models/chats");
const auth = require("../middleware/auth");
const { getFriends } = require("../utils/friendsHelper");
const {
  getPendingRequests,
  getSentRequests,
} = require("../utils/requestsHelper");
const { getChats } = require("../utils/chatsHelper");

router.get("/users/friends", auth, async (req, res) => {
  try {
    const user = req.user;
    const friends = await getFriends(user);
    res.send(friends);
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});

router.post("/sendRequest", auth, async (req, res) => {
  const io = req.app.get("socketio");
  const onlineUsers = req.app.get("onlineUsers");
  try {
    const requestedUser = await User.findOne({ username: req.body.username });
    // errors
    req.user.reqSent.forEach((id) => {
      if (requestedUser._id.equals(id))
        throw new Error("Request already sent!");
    });
    req.user.reqReceived.forEach((id) => {
      if (requestedUser._id.equals(id))
        throw new Error("Check pending requests!");
    });
    req.user.friends.forEach((id) => {
      if (requestedUser._id.equals(id))
        throw new Error("You are already friends!");
    });
    if (!requestedUser) return res.status(404).send("No user found");
    // changing req received and req sent
    requestedUser.reqReceived.push(req.user._id);
    await requestedUser.save();
    req.user.reqSent.push(requestedUser._id);
    await req.user.save();

    // socket
    const reciever = onlineUsers.getUser(req.body.username);
    if (reciever) io.to(reciever).emit("request_received", req.user);
    res.send({ message: "Request sent!" });
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});

router.post("/removeFriend", auth, async (req, res) => {
  try {
    const friend = await User.findOne({ username: req.body.username });

    if (!friend) return res.status(404).send("No user found");
    friend.friends = friend.friends.filter((friend) => {
      return !req.user._id.equals(friend);
    });
    await friend.save();

    req.user.friends = req.user.friends.filter((fr) => {
      return !friend._id.equals(fr);
    });
    await req.user.save();
    res.send({ message: "Friend removed" });
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});

router.post("/acceptRequest", auth, async (req, res) => {
  const io = req.app.get("socketio");
  const onlineUsers = req.app.get("onlineUsers");
  try {
    const acceptedUser = await User.findOne({ username: req.body.username });
    // handling request sender
    if (!acceptedUser) return res.status(404).send("No user found");
    acceptedUser.reqSent = acceptedUser.reqSent.filter((_id) => {
      return !_id.equals(req.user._id);
    });
    acceptedUser.friends.push(req.user._id);
    await acceptedUser.save();
    // hangling req accepting user
    req.user.reqReceived = req.user.reqReceived.filter((_id) => {
      return !_id.equals(acceptedUser._id);
    });
    req.user.friends.push(acceptedUser._id);
    await req.user.save();
    // changing chat collection
    const chatOfAcceptedUser = await Chats.findOne({
      username: acceptedUser.username,
    });
    if (!chatOfAcceptedUser.chats) {
      chatOfAcceptedUser.chats = {};
    }
    chatOfAcceptedUser.chats[req.user.username] = [];
    chatOfAcceptedUser.markModified("chats");
    await chatOfAcceptedUser.save();
    const chatOfRequestAcceptor = await Chats.findOne({
      username: req.user.username,
    });
    if (!chatOfRequestAcceptor.chats) {
      chatOfRequestAcceptor.chats = {};
    }
    chatOfRequestAcceptor.chats[acceptedUser.username] = [];
    chatOfRequestAcceptor.markModified("chats");
    await chatOfRequestAcceptor.save();
    // request Accept socket
    const sender = onlineUsers.getUser(acceptedUser.username);
    if (sender) {
      io.to(sender).emit("request_accepted", req.user);
    }
    res.send({ message: "Request accepted!" });
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});

router.post("/rejectRequest", auth, async (req, res) => {
  try {
    const rejectedUser = await User.findOne({ username: req.body.username });
    if (!rejectedUser) return res.status(404).send("No user found");
    rejectedUser.reqSent = rejectedUser.reqSent.filter((_id) => {
      return !_id.equals(req.user._id);
    });
    await rejectedUser.save();
    req.user.reqReceived = req.user.reqReceived.filter((_id) => {
      return !_id.equals(rejectedUser._id);
    });
    await req.user.save();
    res.send({ message: "Request rejected!" });
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});

router.get("/users/pendingRequests", auth, async (req, res) => {
  try {
    const user = req.user;
    const pendingRequests = await getPendingRequests(user);
    res.send(pendingRequests);
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});

router.get("/users/sentRequests", auth, async (req, res) => {
  try {
    const user = req.user;
    const sentRequests = await getSentRequests(user);
    res.send(sentRequests);
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});

router.get("/users/chats", auth, async (req, res) => {
  try {
    const chats = await getChats(req.user);
    res.send(chats);
  } catch (err) {
    res.status(400).send({ err: err.message });
  }
});

module.exports = router;
