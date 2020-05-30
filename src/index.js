const express = require('express')
require('./db/mongoose')
const basicRouter = require('./routers/basicRouter')
const loggingRouter = require('./routers/loggingRouter')
const friendReqRouter = require('./routers/friendReqRouter')
const Chats = require('./models/chats')
const http = require('http')
const socketio = require('socket.io')
const OnlineUsers = require('./utils/OnlineUsers')

const app = express()
app.use(express.json())
app.use(basicRouter)
app.use(loggingRouter)
app.use(friendReqRouter)

const server = http.createServer(app)
const io = socketio(server)
const port = process.env.PORT
const onlineUsers = new OnlineUsers()
app.set('socketio', io);
app.set('onlineUsers', onlineUsers);

const saveChats = async (messageObject) => {
    const chatSender = await Chats.findOne({username: messageObject.sender})
    const chatReceiver = await Chats.findOne({username: messageObject.toUser})

    chatSender.chats[messageObject.toUser] = [messageObject, ...chatSender.chats[messageObject.toUser]]
    chatSender.markModified('chats');
    await chatSender.save()
    chatReceiver.chats[messageObject.sender] = [messageObject, ...chatReceiver.chats[messageObject.sender]]
    chatReceiver.markModified('chats');
    await chatReceiver.save()
}

io.on('connection', (socket) => {
    try {
        socket.on('join', (username) => {
            onlineUsers.addUser(username, socket.id)
            io.emit('user_joined', username)
        })
        socket.on('send_message', async (messageObject) => {
            const user = onlineUsers.getUser(messageObject.toUser)
            if(user){
                await saveChats(messageObject)
                io.to(user).emit('get_message', messageObject);
            } else{
                const sender = onlineUsers.getUser(messageObject.sender)
                if (sender) {
                    io.to(sender).emit('notOnlineError', messageObject.toUser);
                }
            }
        })
        socket.on('status', (username, callback) => {
            const user = onlineUsers.getUser(username)
            if(user)
                callback(true)
            else
                callback(false)
        })
        socket.on('exit', (username) => {
            onlineUsers.addUser(username)
            io.emit('user_left', username)
        })
    } catch (err){
        
    }
})

server.listen(port, () => {
    console.log('Express up on port:'+port)
})
