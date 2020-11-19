import { Component, createRef } from 'react';
import * as keyboardjs from 'keyboardjs';
import { Stage, Sprite } from '@inlet/react-pixi';
import Peer from 'peerjs';

import './Town.css';

import bunny from './bunny.png';

import ChatBox from './ChatBox';

class Town extends Component {

    constructor(props) {
        super(props);
        this.videoRef = createRef();
        var wWidth = Math.floor(window.innerWidth);
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
            peer: null,
            peerId: "",
            messages: [],
            room: {
                isActive: false,
                name: "",
                members: [],
                calls: {}
            },
            myStream: null,
        }
    }

    isRoomActive() {
        return this.state.room.isActive;
    }

    // 167993

    // Is invoked when everything is set up and ready to launch
    componentDidMount = async () => {

        console.log(this.videoRef);

        let peer = new Peer({
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stun4.l.google.com:19302' },
                ]
            }
        });

        peer.on('open', (peerId) => {
            this.setState({ peedId: peerId });
            this.state.conn.emit('user/peer', peerId);
        });

        peer.on('disconnected', async () => {
            console.log("Peer disconnected!");
            await peer.reconnect();
            console.log(peer.disconnected);
        });

        this.setState({ peer: peer });

        let name = "zerefwayne";

        this.state.conn.emit('init', { username: name, x: this.state.x, y: this.state.y });

        this.state.conn.on('room/update', ({ members }) => {
            this.setState({ room: { ...this.state.room, "members": members } });

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
            this.state.peer.disconnect();
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

    addVideoStream(videoEl, stream) {
        videoEl.srcObject = stream;
        videoEl.addEventListener('loadedmetadata', () => {
            videoEl.play()
        });
        this.videoRef.current.append(videoEl);
    }

    joinRoom = async () => {

        

        let roomName = prompt("Kaunsa vaala join karna hai: ");
        if (roomName) {
            // await this.state.peer.reconnect();
            this.state.conn.emit('room/join', { "name": roomName });
            this.setState({ room: { ...this.state.room, isActive: true, name: roomName } });
            window.navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            }).then(stream => {
                const myVideo = document.createElement('video');
                this.addVideoStream(myVideo, stream);
                myVideo.muted = true;

                this.setState({ myStream: stream });

                console.log(this.state.peer);

                this.state.peer.on('call', call => {

                    console.log("Recieving call", call);

                    call.answer(stream);
                    const video = document.createElement('video');
                    call.on('stream', userVideoStream => {
                        console.log(userVideoStream);
                        console.log(video);
                        this.addVideoStream(video, userVideoStream);
                    });
                });

                this.state.conn.on('room/join', ({ member }) => {
                    this.setState({ room: { ...this.state.room, members: [this.state.room.members, member] } });
                    console.log(member, "ka call aa raha hai");
                    const call = this.state.peer.call(member.peerId, this.state.myStream);
                    const video = document.createElement('video');
                    call.on('stream', userVideoStream => {
                        console.log("Call aa raha hai", userVideoStream);
                        this.addVideoStream(video, userVideoStream);
                    });
                    call.on('close', () => {
                        video.remove();
                    });
                    // this.state.room.calls[member.peerId] = call;
                });
        
                this.state.conn.on('room/leave', ({ member }) => {
                    // this.state.room.calls[member.peerId].close();
                    let newArray = this.state.room.members.filter((m) => {
                        return m.socketId !== member.socketId;
                    });
                    this.setState({ room: { ...this.state.room, members: newArray } });
                });

                

            });

        }
    }

    createRoom = async () => {
        let roomName = prompt("Room ka naam bata bhai: ");
        if (roomName) {
            // await this.state.peer.reconnect();
            this.state.conn.emit('room/create', { "name": roomName });
            this.setState({ room: { ...this.state.room, isActive: true, name: roomName } });

            window.navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            }).then(stream => {

                this.setState({ myStream: stream });
                const myVideo = document.createElement('video');
                myVideo.muted = true;
                this.addVideoStream(myVideo, stream);

                this.state.peer.on('call', call => {
                    call.answer(stream);
                    const video = document.createElement('video');
                    call.on('stream', userVideoStream => {
                        console.log(userVideoStream);
                        console.log(video);
                        this.addVideoStream(video, userVideoStream);
                    });
                });

                this.state.conn.on('room/join', ({ member }) => {
                    this.setState({ room: { ...this.state.room, members: [this.state.room.members, member] } });
                    console.log(member, "ka call aa raha hai");
                    const call = this.state.peer.call(member.peerId, this.state.myStream);
                    const video = document.createElement('video');
                    call.on('stream', userVideoStream => {
                        console.log("Call aa raha hai", userVideoStream);
                        this.addVideoStream(video, userVideoStream);
                    });
                    call.on('close', () => {
                        video.remove();
                    });
                    console.log(this.state.room);
                    // this.state.room.calls[member.peerId] = call;
                });
        
                this.state.conn.on('room/leave', ({ member }) => {
                    // this.state.room.calls[member.peerId].close();
                    let newArray = this.state.room.members.filter((m) => {
                        return m.socketId !== member.socketId;
                    });
                    this.setState({ room: { ...this.state.room, members: newArray } });
                });

            });

        }
    }

    leaveRoom() {
        this.state.conn.emit('room/leave', { "roomName": this.state.room.name });
        this.setState({ room: { members: [], isActive: false, name: "" } });
        // this.state.peer.disconnect();
        window.navigator.getUserMedia({audio: true}, (stream) => {
            stream.getTracks((track) => {
                stream.removeTrack(track);
            })
        })
    }

    render() {
        return (
            <div className="app-town">

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
                                <div>
                                    <button onClick={() => { this.leaveRoom() }}>Leave Room</button>
                                </div>
                                <h2>{this.state.room.name}</h2>
                                {/* <ul>
                                    {
                                        this.state.room.members.map((member, index) => {
                                            return (
                                                <li key={index} style={{ marginBottom: '1rem' }}><img alt="Bunny" src={bunny}></img> {member.username}: {member.socketId}</li>
                                            )
                                        })
                                    }
                                </ul> */}
                                <div id="video-grid" ref={this.videoRef}>
                                </div>
                                <div id="overlay">
                                    <div className="app-chat">
                                        <ChatBox conn={this.state.conn} room={this.state.room} isRoomActive={this.isRoomActive} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div>
                                    <button onClick={() => { this.joinRoom() }} >Join Room</button>
                                    <button onClick={() => { this.createRoom() }}>Create Room</button>
                                </div>
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
                                    <div id="overlay">
                                        <div className="app-chat">
                                            <ChatBox conn={this.state.conn} room={this.state.room} isRoomActive={this.isRoomActive} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                }

            </div>
        );
    }


}

export default Town;
