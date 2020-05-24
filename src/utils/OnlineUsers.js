class OnlineUsers {
    constructor(){}
    users = {}
    getUser(username) {
        if(this.users[username])
          return this.users[username]
        return null
    }
    addUser(username, socketId = null) {
        this.users[username] = socketId
    }
}

module.exports = OnlineUsers