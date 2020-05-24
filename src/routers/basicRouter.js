const router = require('express').Router()
const User = require('../models/user')
const Chats = require('../models/chats')
const auth = require('../middleware/auth')

// Create user
router.post('/users/createUser', async (req, res) => {
    const user = new User(req.body)
    const chats = new Chats({
        username: req.body.username,
        chats: {}
    })
    try {
        await user.save()
        await chats.save()
        const token = await user.generateAuthToken()
        const onlineUsers = req.app.get('onlineUsers')
        onlineUsers.addUser(req.body.username)
        res.send({user, token})
    } catch(err) {
        if(err.code === 11000)
            return res.status(400).send({err: 'Username taken'})
        res.status(400).send({err: err.message})
    }
})

// Read user(Login in app)
router.get('/users/me', auth, async (req, res) => {
    try{
        // const io = req.app.get('socketio');
        res.send(req.user)
        // io.on('login_socket', socket => {
        //     io.emit('new_user', req.user.username)
        // })
    } catch(err){
        res.status(400).send({err: err.message})
    }
})

//Read other user(basic details only)
router.post('/users/searchUser', auth, async (req, res) => {
    try{
        const user = await User.findOne({username: req.body.username})
        if(!user)
            throw new Error('No user found')
        const responseUser = {username: user.username, name: user.name, _id: user._id}
        res.send(responseUser)
    } catch(err){
        res.status(400).send({err: err.message})
    }
})

// Update user
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    // because the following doesnt allow middleware(that we use to hash passwords)
    // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true})
    try{
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (err){
        res.send({err})
    }
})

// Delete user
router.delete('/users/me', auth,  async (req, res) => {
    const chat = Chats.findOne({username: req.user.username})
    try{
        await req.user.remove()
        await chat.remove()
        res.send(req.user)
    } catch (err){
        res.status(400).send({err})
    }
})

module.exports = router