import { Component } from 'react';
import * as keyboardjs from 'keyboardjs';
import { Stage, Sprite } from '@inlet/react-pixi';

import './Town.css';
import bunny from './bunny.png';

import ChatBox from './ChatBox';

class Town extends Component {

    constructor(props) {
        super(props);

        var wWidth = Math.floor(0.8 * window.innerWidth);
        var wHeight = Math.floor(window.innerHeight);
        // Set random spawn position within a circle
        var radius = 50;
        var xCenter = wWidth / 2, yCentre = wHeight / 2, theta = 2 * Math.PI * Math.random(), r = Math.sqrt(Math.random());
        var xSpawn = xCenter + radius * r * Math.cos(theta), ySpawn = yCentre + radius * r * Math.sin(theta);
        // Initial state of the canvas
        this.joinRoom = this.joinRoom.bind(this);
        this.createRoom = this.createRoom.bind(this);
        this.leaveRoom = this.leaveRoom.bind(this);
        this.isRoomActive = this.isRoomActive.bind(this);
        this.state = {
            conn: props.conn,
            x: Math.floor(xSpawn),
            y: Math.floor(ySpawn),
            height: wHeight,
            width: wWidth,
            users: {},
            messages: [],
            room: {
                isActive: false,
                name: "",
                members: [{
                    username: "zerefwayne",
                    socketId: "iybiybiy",
                    avatar: "bunny"
                }, {
                    username: "zerefwayne1",
                    socketId: "iybiybiy",
                    avatar: "bunny"
                }, {
                    username: "zerefwayne2",
                    socketId: "iybiybiy",
                    avatar: "bunny"
                }]
            }
        }
    }

    isRoomActive() {
        return this.state.room.isActive;
    }

    // 167993

    // Is invoked when everything is set up and ready to launch
    componentDidMount() {

        // let name = prompt("What should we call you?", "???")
        let name = "zerefwayne";

        this.state.conn.emit('init', { username: name, x: this.state.x, y: this.state.y });

        this.state.conn.on('room/update', ({ members }) => {
            this.setState({ room: { ...this.state.room, "members": members } })
        })

        this.state.conn.on('init', ({ activePlayers }) => {
            let newUsers = {};
            activePlayers.forEach(player => {
                if (player.socketId !== this.state.conn.id) {
                    newUsers[player.socketId] = player;
                }
            });
            this.setState({ ...this.state, users: { ...this.state.users, ...newUsers } });
        })

        this.state.conn.on('town/join', ({ player }) => {
            if (player.socketId !== this.state.conn.id) {
                this.setState({ ...this.state, users: { ...this.state.users, [player.socketId]: player } });
            }
        });

        this.state.conn.on('town/leave', ({ socketId }) => {
            let newUsers = this.state.users;
            delete newUsers[socketId]
            this.setState({ ...this.state, users: newUsers });
        });

        this.state.conn.on('town/update', ({ players }) => {
            let newUsers = {};
            players.forEach(player => {
                if (player.socketId !== this.state.conn.id) {
                    newUsers[player.socketId] = player;
                }
            });
            this.setState({ ...this.state, users: { ...this.state.users, ...newUsers } });
        });

        // starts watching for keypresses
        keyboardjs.watch();
        keyboardjs.bind('', (e) => {
            switch (e.code) {
                case "ArrowLeft":
                    this.setState({ ...this.state, x: Math.max(0, this.state.x - (e.shiftKey ? 7 : 3)) });
                    break;
                case "ArrowRight":
                    this.setState({ ...this.state, x: Math.min(this.state.width - 25, this.state.x + (e.shiftKey ? 7 : 3)) });
                    break;
                case "ArrowUp":
                    this.setState({ ...this.state, y: Math.max(0, this.state.y - (e.shiftKey ? 7 : 3)) });
                    break;
                case "ArrowDown":
                    this.setState({ ...this.state, y: Math.min(this.state.height - 25, this.state.y + (e.shiftKey ? 7 : 3)) });
                    break;
                default:
            }
            // Send final location to backend
            this.state.conn.emit('town/move', { x: this.state.x, y: this.state.y });
        });
    }

    renderUsers() {
        return Object.keys(this.state.users).map((userkey, index) => {
            const user = this.state.users[userkey];
            return (<Sprite key={index} image="./bunny.png" x={user.xAxis} y={user.yAxis} />)
        });
    }

    setRoomDetails(name, members) {
        this.setState({ roomName: name, roomMembers: members });
    }

    componentWillUnmount() {
        keyboardjs.stop();
    }

    joinRoom() {
        let roomName = prompt("Kaunsa vaala join karna hai: ");
        if (roomName) {
            this.state.conn.emit('room/join', { "name": roomName });
            this.setState({ room: { ...this.state.room, isActive: true, name: roomName } });
        }
    }

    createRoom() {
        let roomName = prompt("Room ka naam bata bhai: ");
        if (roomName) {
            this.state.conn.emit('room/create', { "name": roomName });
            this.setState({ room: { ...this.state.room, isActive: true, name: roomName } });
        }
    }

    leaveRoom() {
        this.state.conn.emit('room/leave', { "roomName": this.state.room.name });
        this.setState({ room: { members: [], isActive: false, name: "" } });
    }

    render() {
        return (
            <div className="app-town">
                <div>
                    <button onClick={() => { this.joinRoom() }} >Join Room</button>
                    <button onClick={() => { this.createRoom() }}>Create Room</button>
                    <button onClick={() => { this.leaveRoom() }}>Leave Room</button>
                </div>
                {
                    this.state.room.isActive ?
                        (
                            <div className="app-room" style={{
                                backgroundColor: "#222222",
                                backgroundPosition: 'center',
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                                color: 'white',
                            }}>
                                <h2>{this.state.room.name}</h2>
                                <ul>
                                    {
                                        this.state.room.members.map((member, index) => {
                                            return (
                                                <li key={index} style={{ marginBottom: '1rem' }}><img alt="Bunny" src={bunny}></img> {member.username}: {member.socketId}</li>
                                            )
                                        })
                                    }
                                </ul>

                            </div>
                        ) : (
                            <div className="app-pixi" style={{
                                backgroundImage: 'url(map.png)',
                                backgroundPosition: 'center',
                                backgroundSize: 'cover',
                                backgroundRepeat: 'no-repeat',
                            }}>
                                <Stage width={this.state.width} height={this.state.height} options={{ transparent: true, antialias: true }}>
                                    <Sprite image="./bunny.png" x={this.state.x} y={this.state.y} />
                                    {this.renderUsers()}
                                </Stage>

                            </div>
                        )
                }
                <div className="app-chat">
                    <ChatBox conn={this.state.conn} room={this.state.room} isRoomActive={this.isRoomActive} />
                </div>
            </div>
        );
    }


}

export default Town;
