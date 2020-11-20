const express = require('express');
const { v4: uuidv4 } = require('uuid');
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
    constructor(socketId, peerId = null, avatar="bunny", username = null, xAxis = 0, yAxis = 0) {
        super();
        this.socketId = socketId;
        this.username = username;
        this.xAxis = xAxis;
        this.yAxis = yAxis;
        this.avatar = avatar;
    }

    updateAxes(xAxis, yAxis) {
        this.xAxis = xAxis;
        this.yAxis = yAxis;
    }

    updateUsername(username) {
        this.username = username
    }

    updatePeerId(peerId) {
        this.peerId = peerId
    }

    updateAvatar(avatar) {
        this.avatar = avatar;
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

class Room extends Object {
    constructor(name) {
        super(name);
        this.id = uuidv4();
        this.name = name;
        this.members = []
    }

    addMember(player) {
        this.members.push(player);
    }

    removeMember(player) {
        this.members = this.members.filter((member) => {
            return member.socketId !== player.socketId;
        })
    }

    getMembersList() {
        return this.members;
    }
    // static
}

class ActiveRooms extends Object {
    addRoom(room) {
        this[room.name] = room;
    }

    removeRoom(roomName) {
        try {
            delete this[roomName]
        } catch (err) {
            throw error;
        }
    }
    // TODO: check if room exists
    getRoom(roomName) {
        try {
            return this[roomName];
        } catch (error) {
            throw error;
        }
    }

    getList() {
        // return Object.values(this).filter((room) => room.name !== null)
        return Object.values(this);
    }
}

// ===============================================
// Constants
// ===============================================

let ACTIVE_PLAYERS = new ActivePlayers();
let ACTIVE_ROOMS = new ActiveRooms();

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
        });
        console.log("-- Removing user from all rooms --")
        let player = ACTIVE_PLAYERS.getPlayer(socketId);
        if (player === undefined) {
            return;
        }
        console.log("town/leave", player);
        socket.rooms.forEach((room) => {
            if (socket.id === room) {
                return;
            }
            ACTIVE_ROOMS.getRoom(room).removeMember(player)
            io.to(room).emit('room/leave', {
                player: player
            });
        })
    });

    socket.on('init', (message) => {
        let socketId = String(socket.id);
        let player = ACTIVE_PLAYERS.getPlayer(socketId);
        player.updateUsername(message.username);
        player.updateAxes(message.x, message.y);
        player.updateAvatar(message.avatar);
        console.log("town/join", player);
        socket.emit('init', {
            'activePlayers': ACTIVE_PLAYERS.getList()
        });
        io.emit('town/join', {
            "player": player
        });
    });

    socket.on('town/move', (message) => {
        // console.log('town/move', socket.id, message);
        let socketId = String(socket.id),
            player = ACTIVE_PLAYERS.getPlayer(socketId);
        player.updateAxes(message.x, message.y);
    });

    socket.on('town/chat', (message) => {
        let socketId = String(socket.id),
            player = ACTIVE_PLAYERS.getPlayer(socketId);
        io.emit('town/chat', {
            "from": player,
            "message": message,
            "at": new Date(),
        });
    });

    socket.on('user/peer', (peerId) => {
        let plater = ACTIVE_PLAYERS.getPlayer(socket.id);
        player.updatePeerId(peerId);
        console.log('- Peer ID updated -', player)
    });

    socket.on('room/create', (message) => {
        console.log("Wants to create room", message);
        let room, name = message.name;

        // Create room only if does not exists
        room = ACTIVE_ROOMS.getRoom(name);
        if (room === undefined) {
            room = new Room(name);
            ACTIVE_ROOMS.addRoom(room);
            console.log(`Room ${name} doesn't exist. Creating new room!`);
            room = ACTIVE_ROOMS.getRoom(name);
        } else {
            console.log(`Room ${name} already exists. Joining the room.`);
        }

        io.emit('new_room', { "room_name": name }); //tell everyone about the new room // TODO - Receive it on the frontend
        socket.join(name); // joins the socket to new room
        room.addMember(ACTIVE_PLAYERS.getPlayer(socket.id)) //adds member to js room
        io.to(name).emit('room/join', {
            "member": player
        });
    });

    socket.on('room/join', (message) => {
        // roomname = message.name
        let roomName = message.name;
        let room;

        try {
            // sets the room, errors out if room doesn't exist.
            room = ACTIVE_ROOMS.getRoom(roomName);
        }
        catch (error) {
            socket.emit('error', { message: `room ${roomName} doesn't exist` });
            console.log("Room doesn't exist!");
            return;
        }
        // Join user to a new room
        socket.join(roomName);
        let player = ACTIVE_PLAYERS.getPlayer(socket.id);
        room.addMember(player);
        console.log(room.id, room.members.length);

        console.log(roomName, "informing join", player);
        io.to(roomName).emit('room/join', {
            "member": player
        });
    });

    socket.on('room/leave', (message) => {
        let roomName = message.roomName;
        let player = ACTIVE_PLAYERS.getPlayer(socket.id); 
        let room = ACTIVE_ROOMS.getRoom(roomName);
        if (room === undefined) {
            socket.emit('error', {message: `invalid room. cannot leave. ${roomName}`});
            return;
        } 
        // room exists
        socket.leave(roomName);
        room.removeMember(player);
        io.to(roomName).emit('room/leave', {
            member: player
        });
        console.log("HEADED OUT=========================")
    });

    socket.on('room/chat', (message) => {
        let room;
        socket.rooms.forEach((socket_room) => {
            if (socket_room === socket.id) {
                return;
            }
            room = socket_room;
        });
        io.to(room).emit('room/chat', {
            'message': message,
            'from': ACTIVE_PLAYERS.getPlayer(socket.id),
            'at': new Date()
        });
    });
});