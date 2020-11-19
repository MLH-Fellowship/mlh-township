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

class Room extends Object {
    constructor(name) {
        super(name);
        this.id = uuidv4();
        this.name = name;
        this.members = []
    }

    addMember(socketId){
        this.members.push(socketId);
    }

    removeMember(socketId){
        try{
            index = this.members.indexOf(socketId);
            if (index != -1){
                this.members.splice(index, 1);
            }
        }
        catch(error){
            throw error;
        }
    }

    getMembersList(){
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

    getRoom(roomName) {
        try {
            return this[roomName];
        } catch (error) {
            throw error;
        }
    }

    getList() {
        return Object.values(this).filter((room) => room.name !== null)
    }
}

// ===============================================
// Constants
// ===============================================

let ACTIVE_PLAYERS = new ActivePlayers();
let ACTIVE_ROOMS = new ActiveRooms()
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
    });

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

    socket.on('room/create', (message) => {
        let name = message.name,
            room = new Room(name);
        ACTIVE_ROOMS.addRoom(room);
        io.emit('new_room', {"room_name": name}); //tell everyone about the new room
        socket.join(name); // joins the socket to new room
        room.addMember(ACTIVE_PLAYERS.getPlayer(socket.id)) //adds member to js room
        console.log(room)
    });

    socket.on('room/join', (message) => {
        try{
            let room = ACTIVE_ROOMS.getRoom(message.name);
        }
        catch(error){
            return;
        }

        // Leave currently joined rooms
        try{
            socket.rooms.forEach((room) => {
                socket.leave(room);
                ACTIVE_ROOMS.getRoom(
                    room
                ).removeMember(socket.id);
            })
        }
        catch(error){
            console.log(error)
            return
        }

        // Join user to a new room
        try {
            socket.join(message.name);
        }
        catch(err){
            console.log(err)
        }
        finally{
            room.addMember(ACTIVE_PLAYERS.getPlayer(socket.id));
        }
    });

    socket.on('room/leave', (message) => {
        let room = ACTIVE_ROOMS.getRoom(message.name);

        // Leave currently joined rooms
        try{
            socket.rooms.forEach((room) => {
                socket.leave(room);
                ACTIVE_ROOMS.getRoom(
                    room
                ).removeMember(socket.id);
            })
        }
        catch(error){
            console.log(error)
        }
    });

    socket.on('room/chat', (message) => {
        let room = socket.rooms.keys().next().value;
        console.log("in room message", room, message)
        socket.to(room).emit('room/chat', {
            'message': message.message,
            'from': ACTIVE_PLAYERS.getPlayer(socket.id),
            'at': new Date()
        });
    });
});

        /*
    routes needed:
        create new room: socket.on('new_room') -> new room name
        join room: socket.on('{room_name}/join)
        room chat: socket.on('{room_name}/chat)
        leave room: socket.on('{room_name}/leave)
        */

