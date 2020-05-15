const express = require('express')
require('./db/mongoose')
const basicRouter = require('./routers/basicRouter')
const loggingRouter = require('./routers/loggingRouter')
const friendReqRouter = require('./routers/friendReqRouter')

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(basicRouter)
app.use(loggingRouter)
app.use(friendReqRouter)

app.listen(port, () => {
    console.log('Express up on port:'+port)
})
