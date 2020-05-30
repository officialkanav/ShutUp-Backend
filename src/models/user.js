const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reqSent: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    reqReceived: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
})

userSchema.statics.findByCredentials = async (username, password) => {
    const user = await User.findOne({username})
    if(!user)
        throw new Error('No user found')
    const isMatch = await bcrypt.compare(password, user.password)
    if(!isMatch)
        throw new Error('Invalid Credentials')
    return user
}

userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({_id: user.id.toString()}, process.env.jwtString)

    user.tokens = user.tokens.concat({token})
    await user.save()
    
    return token
}

userSchema.methods.toJSON = function(){
    const user = this
    const publicUser = user.toObject()
    delete publicUser.password
    delete publicUser.tokens
    delete publicUser.avatar
    return publicUser
}

userSchema.pre('save', async function (next){
    const user = this
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

const User = mongoose.model('User', userSchema)
module.exports = User