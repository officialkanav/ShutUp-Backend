const express = require('express')
require('./db/mongoose')
const basicRouter = require('./routers/basicRouter')
const loggingRouter = require('./routers/loggingRouter')
const friendReqRouter = require('./routers/friendReqRouter')
const http = require('http')
const socketio = require('socket.io')

const app = express()
app.use(express.json())
app.use(basicRouter)
app.use(loggingRouter)
app.use(friendReqRouter)

const server = http.createServer(app)
const io = socketio(server)
const port = process.env.PORT


const users = {}
io.on('connection', (socket) => {
    try {
        socket.on('join', (username) => {
            users[username] = socket.id
        })
        socket.on('send_message', (messageObject) => {
            if(users[messageObject.toUser]){
                io.to(users[messageObject.toUser]).emit('get_message', messageObject);
            } else{
                io.to(users[messageObject.fromUser]).emit('notOnlineError');
            }
        })
        socket.on('status', (username, callback) => {
            if(users[username])
                callback(true)
            else
                callback(false)
        })
        socket.on('exit', (username) => {
            users[username] = null
        })
    } catch (err){
        console.log(err.message)
    }
})


server.listen(port, () => {
    console.log('Express up on port:'+port)
})
