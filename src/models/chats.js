const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    chats: {
        type: Object
    }
})

const Chats = mongoose.model('Chats', chatSchema)
module.exports = Chats