const router = require('express').Router()
const User = require('../models/user')
const auth = require('../middleware/auth')

// Login
router.post('/users/login', async (req, res) => {
    try{
        const user = await User.findByCredentials(req.body.username, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user, token})
    } catch(err){
        res.status(400).send({err: err.message})
    }
})

// Logout
router.post('/users/logout/', auth, async (req, res) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.send('Logged out')
    } catch(err) {
        res.status(400).send({err: err.message})
    }
})

// Logout All
router.post('/users/logoutAll/', auth, async (req, res) => {
    try{
        req.user.tokens = []
        await req.user.save()
        res.send('Logged out from all devices')
    } catch(err) {
        res.status(400).send({err: err.message})
    }
})

module.exports = router