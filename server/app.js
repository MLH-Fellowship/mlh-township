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
    constructor(socketId, peerId=null, username = null, xAxis = 0, yAxis = 0) {
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

    updatePeerId(peerId) {
        this.peerId = peerId
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
            io.to(room).emit('room/update', {
                members: room.getMembersList()
            });
        })

    });

    socket.on('init', (message) => {
        let socketId = String(socket.id);
        let player = ACTIVE_PLAYERS.getPlayer(socketId);
        player.updateUsername(message.username);
        player.updateAxes(message.x, message.y);
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
        console.log('- Peer ID updated -',player)
    });

    socket.on('room/create', (message) => {
        console.log("Wants to create room", message);
        let room, name = message.name;

        // Create room only if does not exists
        room = ACTIVE_ROOMS.getRoom(name);
        if (room === undefined) {
            room = new Room(name);
            ACTIVE_ROOMS.addRoom(room);
        }
        io.emit('new_room', { "room_name": name }); //tell everyone about the new room
        socket.join(name); // joins the socket to new room
        room.addMember(ACTIVE_PLAYERS.getPlayer(socket.id)) //adds member to js room
        console.log("ROOM CREATED", room);
        // socket.emit('room/update', {
        //     members: room.getMembersList()
        // });
        // socket.emit('room/join', {
        //     "member": player
        // });
        try {
            socket.rooms.forEach((roomID) => {
                if (roomID === socket.id) {
                    return;
                }
                // socket.to(roomID).emit('room/update', {
                //     members: room.getMembersList()
                // });
                io.to(roomID).emit('room/join', {
                    "member": player
                });
            })
        }
        catch (error) {
            console.log(error)
            return
        }

    });

    socket.on('room/join', (message) => {
        try {
            // ensures room exists
            let room = ACTIVE_ROOMS.getRoom(message.name);
        }
        catch (error) {
            console.log("Room doesn't exist!");
            return;
        }

        // Leave currently joined rooms
        try {
            socket.rooms.forEach((room) => {
                if (room === socket.id) {
                    return;
                }
                socket.leave(room);
                ACTIVE_ROOMS.getRoom(
                    room
                ).removeMember(ACTIVE_PLAYERS.getPlayer(socket.id));
            })
        }
        catch (error) {
            console.log(error)
            return
        }

        // Join user to a new room
        try {
            socket.join(message.name);
        }
        catch (err) {
            console.log(err)
        }
        finally {
            let room = ACTIVE_ROOMS.getRoom(message.name),
                player = ACTIVE_PLAYERS.getPlayer(socket.id);
            if (room === undefined) {
                socket.emit('error', { message: 'Room does not exists' })
                return;
            }
            room.addMember(player);
            console.log(room.id, room.members.length);
            try {
                socket.rooms.forEach((roomID) => {
                    if (roomID === socket.id) {
                        return;
                    }
                    // socket.to(roomID).emit('room/update', {
                    //     members: room.getMembersList()
                    // });
                    console.log(roomID, "informing join", player);
                    io.to(roomID).emit('room/join', {
                        "member": player
                    });
                })
            }
            catch (error) {
                console.log(error)
                return
            }
            // socket.emit('room/update', {}
        }
    });

    socket.on('room/leave', (message) => {
        let player = ACTIVE_PLAYERS.getPlayer(socket.id);
        try {
            socket.rooms.forEach((roomID) => {
                if (socket.id === roomID) {
                    return;
                }
                socket.leave(roomID);
                let room = ACTIVE_ROOMS.getRoom(
                    message.roomName
                )
                room.removeMember(player);
                // socket.to(roomID).emit('room/update', {
                //     members: room.getMembersList()
                // });
                io.to(roomID).emit('room/leave', {
                    member: player
                });
                // socket.to('room/userLeft').broadcast.emit({
                //     'leftUserPeerId': player.peerId
                // })
            });
        }
        catch (error) {
            console.log(error)
        }
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