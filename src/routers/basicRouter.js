const router = require('express').Router()
const User = require('../models/user')
const auth = require('../middleware/auth')

// Create user
router.post('/users/createUser', async (req, res) => {
    user = new User(req.body)
    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch(err) {
        if(err.code === 11000)
            return res.status(400).send({err: 'Username taken'})
        res.status(400).send({err: err.message})
    }
})

// Read user
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
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
    try{
        await req.user.remove()
        res.send(req.user)
    } catch (err){
        res.status(400).send({err})
    }
})

module.exports = router