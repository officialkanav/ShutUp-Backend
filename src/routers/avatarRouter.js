const router = require('express').Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')

const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/))
            return cb(new Error('Please upload an image'))
        cb(undefined, true) //success
    }
})

router.get('/users/:id/avatar', async (req, res) => {
    const user = await User.findById(req.params.id)
    try{
        if(!user || !user.avatar){
            throw new Error('Not found')
        }
        res.set('Content-Type', 'image/jpg')
        res.send(user.avatar)
    } catch(e) {
        res.status(404).send('Not found')
    }
})

router.post('/users/me/avatar', [auth, upload.single('paramKey')], async (req, res) => {
    req.user.avatar = req.file.buffer
    await req.user.save()
    res.send('Success')
}, (error, req, res, next) => {
    res.status(400).send(error.message)
})

router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send(req.user)
})

module.exports = router
