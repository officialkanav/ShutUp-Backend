const Chats = require("../models/chats");

async function getChats(user) {
  const chats = await Chats.findOne({ username: user.username });
  return chats.chats;
}

module.exports = {
  getChats,
};
