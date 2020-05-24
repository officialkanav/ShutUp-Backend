const router = require('express').Router()
const User = require('../models/user')
const Chats = require('../models/chats')
const auth = require('../middleware/auth')

router.get('/users/friends', auth, async (req, res) => {
    try{
        const user = req.user
        await user.populate('friends').execPopulate()
        res.send(user.friends)
    } catch (err){
        res.status(400).send({err: err.message})
    }
})

router.post('/sendRequest', auth, async (req, res) => {
    try{
        const requestedUser = await User.findOne({ username: req.body.username })
        // errors
        req.user.reqSent.forEach((id) => {
            if(requestedUser._id.equals(id))
                throw new Error('Request already sent!')
        })
        req.user.reqReceived.forEach((id) => {
            if(requestedUser._id.equals(id))
                throw new Error('Check pending requests!')
        })
        req.user.friends.forEach((id) => {
            if(requestedUser._id.equals(id))
                throw new Error('You are already friends!')
        })
        if(!requestedUser)
            return res.status(404).send('No user found')
        // changing req received and req sent
        requestedUser.reqReceived.push(req.user._id)
        await requestedUser.save()
        req.user.reqSent.push(requestedUser._id)
        await req.user.save()

        res.send({message: 'Request sent!'})
    } catch (err){
        res.status(400).send({err: err.message})
    }
})

router.post('/acceptRequest', auth, async (req, res) => {
    try{
        const acceptedUser = await User.findOne({username: req.body.username})
        // handling request sender
        if(!acceptedUser)
            return res.status(404).send('No user found')
        acceptedUser.reqSent = acceptedUser.reqSent.filter((_id) => {
            return !(_id.equals(req.user._id))
        })
        acceptedUser.friends.push(req.user._id)
        await acceptedUser.save()
        // hangling req accepting user
        req.user.reqReceived = req.user.reqReceived.filter((_id) => {
            return !(_id.equals(acceptedUser._id))
        })
        req.user.friends.push(acceptedUser._id)
        await req.user.save()
        // changing chat collection
        const chatOfAcceptedUser = await Chats.findOne({username: acceptedUser.username})
        if (!chatOfAcceptedUser.chats) {
            chatOfAcceptedUser.chats = {}
        }
        chatOfAcceptedUser.chats[req.user.username] = []
        chatOfAcceptedUser.markModified('chats')
        await chatOfAcceptedUser.save()
        const chatOfRequestAcceptor = await Chats.findOne({username: req.user.username})
        if (!chatOfRequestAcceptor.chats) {
            chatOfRequestAcceptor.chats = {}
        }
        chatOfRequestAcceptor.chats[acceptedUser.username] = []
        chatOfRequestAcceptor.markModified('chats')
        await chatOfRequestAcceptor.save()
        // sending response
        res.send({message: 'Request accepted!'})
    } catch (err){
        console.log(err.message)
        res.status(400).send({err: err.message})
    }
})

router.post('/rejectRequest', auth, async (req, res) => {
    try{
        const rejectedUser = await User.findOne({username: req.body.username})
        if(!rejectedUser)
            return res.status(404).send('No user found')
        rejectedUser.reqSent = rejectedUser.reqSent.filter((_id) => {
            return !(_id.equals(req.user._id))
        })
        await rejectedUser.save()
        req.user.reqReceived = req.user.reqReceived.filter((_id) => {
            return !(_id.equals(rejectedUser._id))
        })
        await req.user.save()
        res.send({message: 'Request rejected!'})
    } catch (err){
        res.status(400).send({err: err.message})
    }
})

router.get('/users/pendingRequests', auth, async (req, res) => {
    try{
        const user = req.user
        await user.populate('reqReceived').execPopulate()
        res.send(user.reqReceived)
    } catch (err){
        res.status(400).send({err: err.message})
    }
})

router.get('/users/chats', auth, async (req, res) => {
    try{
        const chats = await Chats.findOne({username: req.user.username})
        res.send(chats.chats)
    } catch (err){
        res.status(400).send({err: err.message})
    }
})

module.exports = router