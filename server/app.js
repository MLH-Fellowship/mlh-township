const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());

const server = app.listen(5000);

const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["*"],
        credentials: true
    }
});

// ===============================================
// Models
// ===============================================

class Player extends Object {
    constructor(socketId, username = null, xAxis = 0, yAxis = 0) {
        super();
        this.socketId = socketId;
        this.username = username;
        this.xAxis = xAxis;
        this.yAxis = yAxis;
    }

    updateAxes(xAxis, yAxis) {
        this.xAxis = xAxis;
        this.yAxis = yAxis;
    }

    updateUsername(username) {
        this.username = username
    }

}


class ActivePlayers extends Object {
    addPlayer(player) {
        this[player.socketId] = player;
    }

    removePlayer(socketId) {
        try {
            delete this[socketId]
        } catch (err) {
            throw error;
        }
    }

    getPlayer(socketId) {
        try {
            return this[socketId];
        } catch (error) {
            throw error;
        }
    }

    getList() {
        return Object.values(this).filter((player) => player.username !== null)
    }
}

// ===============================================
// Constants
// ===============================================

let ACTIVE_PLAYERS = new ActivePlayers();

setInterval(() => {
    io.emit('town/update', {
        "players": ACTIVE_PLAYERS.getList()
    })
}, 100);

// ===============================================
// socketIO routes
// ===============================================

io.on("connection", (socket) => {

    let socketId = String(socket.id),
        player = new Player(socketId);
    ACTIVE_PLAYERS.addPlayer(player);
    // console.log("added new player", ACTIVE_PLAYERS);

    socket.once('disconnect', () => {
        let socketId = String(socket.id);
        ACTIVE_PLAYERS.removePlayer(socketId)
        io.emit('town/leave', {
            "socketId": socketId
        })
    })

    socket.on('init', (message) => {
        let socketId = String(socket.id);
        let player = ACTIVE_PLAYERS.getPlayer(socketId);
        player.updateUsername(message.username);
        player.updateAxes(message.x, message.y);
        socket.emit('init', {
            'activePlayers': ACTIVE_PLAYERS.getList()
        });
        io.emit('town/join', {
            "player": player
        });
    });

    socket.on('town/move', (message) => {
        console.log('town/move', socket.id, message);
        let socketId = String(socket.id),
            player = ACTIVE_PLAYERS.getPlayer(socketId);
        player.updateAxes(message.x, message.y);
    })
});
