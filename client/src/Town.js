import { Component, createRef } from 'react';
import * as keyboardjs from 'keyboardjs';
import { Stage, Sprite } from '@inlet/react-pixi';
import Peer from 'peerjs';
import * as PIXI from 'pixi.js';

import './Town.css';

import bunny from './bunny.png';

import ChatBox from './ChatBox';
import { id } from 'date-fns/locale';

// Sprite animation stuff
var mov = ["up", "down", "left", "right"];
const loader = PIXI.Loader.shared;


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
        this.app = new PIXI.Application({ width: wHeight, height: wWidth });
        this.idle = {};
        this.state = {
            isLoaded: false,
            animated: {},
            isMoving: true,
            direction: 0, 
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
                    // { urls: 'stun:stun1.l.google.com:19302' },
                    // { urls: 'stun:stun2.l.google.com:19302' },
                    // { urls: 'stun:stun3.l.google.com:19302' },
                    // { urls: 'stun:stun4.l.google.com:19302' },
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

        document.body.appendChild(this.app.view);

        // Initialize pixi sprites
        loader.add("./girlSpriteSheet.json").load((loader, resources) => {
            let sheet = resources["./girlSpriteSheet.json"].spritesheet;
            let anim = {};

            mov.forEach(element => {
                anim[element] = new PIXI.AnimatedSprite(sheet.animations[element[0]], true);
                console.log(this.anim[element]);
                anim[element].animationSpeed = 0.15;
                anim[element].updateAnchor = true;
            });
            this.setState({...this.state, isLoaded: true, animated: anim});
            
        }

        );

        this.state.animated["up"].position.set(this.x, this.y);
        this.state.animated["up"].gotoAndPlay(2);
        this.app.stage.addChild(this.animated["up"]);
        this.app.ticker.add(() => {
            this.state.animated.up.position.y -= 1;
        })


        // let name = prompt("What should we call you?", "???")
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
                    this.direction = 2;
                    break;
                case "ArrowRight":
                    this.setState({ ...this.state, x: Math.min(this.state.width - 25, this.state.x + (e.shiftKey ? 7 : 3)) });
                    this.direction = 3;
                    break;
                case "ArrowUp":
                    this.setState({ ...this.state, y: Math.max(0, this.state.y - (e.shiftKey ? 7 : 3)) });
                    this.direction = 0;
                    break;
                case "ArrowDown":
                    this.setState({ ...this.state, y: Math.min(this.state.height - 25, this.state.y + (e.shiftKey ? 7 : 3)) });
                    this.direction = 1;
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
            if(user.isMoving){
                user.animated[mov[this.direction]].gotoAndPlay(2);
                user.animated[mov[this.direction]].position.set(user.xAxis, user.yAxis);                
            }
            else  
                user.animated[mov[this.direction]].gotoAndStop(2);
            // TODO: if previous move wasn't same, hide/remove child
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

    createRoom = async () => {

        let roomName = prompt("Enter new room name: ");

        if (!roomName) {
            window.alert("Please enter a valid room name.");
            return;
        }

        // await this.state.peer.reconnect();
        this.state.conn.emit('room/create', { "name": roomName });
        this.setState({ room: { ...this.state.room, isActive: true, name: roomName } });

        window.navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        }).then(stream => {

            console.log("Obtained your stream", stream);
            this.setState({ myStream: stream });

            // HTML VIDEO ELEMENT START =======================

            const myVideo = document.createElement('video');
            myVideo.setAttribute('id', this.state.peer.id);
            myVideo.muted = true;
            this.addVideoStream(myVideo, stream);

            // HTML VIDEO ELEMENT END =======================
            
            console.log("Current Peer condition", this.state.peer);

            this.state.peer.on('call', call => {
                console.log("Set on call connector", call);
                call.answer(stream);

                const video = document.createElement('video');
                video.setAttribute("id", call.peer);
                
                call.on('stream', userVideoStream => {
                    console.log("Streaming started!");
                    // console.log(userVideoStream);
                    // console.log(video);
                    this.addVideoStream(video, userVideoStream);
                });

                call.on('close', () => {
                    console.log("Someone closed their call", call);
                })
            });

            this.state.conn.on('room/join', async ({ member }) => {

                this.setState({ room: { ...this.state.room, members: [this.state.room.members, member] } });
                console.log(member, "ka call aa raha hai");

                const call = this.state.peer.call(member.peerId, this.state.myStream);

                const video = document.createElement('video');
                video.setAttribute("id", member.peerId);

                console.log("Creating new video element!", video);

                call.on('stream', userVideoStream => {
                    console.log("room/join user video stream recieved", userVideoStream);
                    this.addVideoStream(video, userVideoStream);
                });

                call.on('close', () => {
                    console.log("Call kiya tha par band ho gaya");
                    try{
                        document.getElementById(member.peerId).remove();
                        video.remove();
                    }
                    catch(error){
                        console.error(error)
                    }
                });
                console.log(this.state.room);
                this.state.room.calls[member.peerId] = call;

                console.log('-caals-', this.state.room.calls)
            });

            this.state.conn.on('room/leave', ({ member }) => {
                console.log('Heading out ===============')
                this.state.room.calls[member.peerId].close();
                console.log("Leaving room", member);
                let newArray = this.state.room.members.filter((m) => {
                    return m.socketId !== member.socketId;
                });
                this.setState({ room: { ...this.state.room, members: newArray } });
                document.getElementById(member.peerId).remove();
                
            });

        });

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
                    video.setAttribute("id", call.peer);
                    call.on('stream', userVideoStream => {
                        this.addVideoStream(video, userVideoStream);
                    });
                });

                this.state.conn.on('room/join', async ({ member }) => {

                    this.setState({ room: { ...this.state.room, members: [this.state.room.members, member] } });
                    console.log(member, "ka call aa raha hai");
    
                    const call = await this.state.peer.call(member.peerId, this.state.myStream);
    
                    const video = document.createElement('video');
                    video.setAttribute("id", member.peerId);
    
                    call.on('stream', userVideoStream => {
                        console.log("room/join user video stream recieved", userVideoStream);
                        this.addVideoStream(video, userVideoStream);
                    });
    
                    call.on('close', () => {
                        console.log("Call kiya tha par band ho gaya");
                        // video.remove();
                        document.getElementById(member.peerId).remove();
                    });
    
                    console.log(this.state.room);
                    // this.state.room.calls[member.peerId] = call;
                });
    
                this.state.conn.on('room/leave', ({ member }) => {
                    // this.state.room.calls[member.peerId].close();
                    // TODO: Remove video element
                    console.log("Leaving room", member);
                    let newArray = this.state.room.members.filter((m) => {
                        return m.socketId !== member.socketId;
                    });
                    this.setState({ room: { ...this.state.room, members: newArray } });

                    const el = document.getElementById(member.peerId);
                    if(el) {
                        el.remove();
                    }
                });
            });

        }
    }

    leaveRoom() {
        this.state.conn.emit('room/leave', { "roomName": this.state.room.name });
        this.setState({ room: { ...this.state.room, members: [], isActive: false, name: "" } });
        this.state.myStream.getTracks().forEach(function(track) {
            console.log('-stop-', track);
            track.stop();
        });
    }

    render() {
        return (
            this.state.isLoaded ? (
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
            ): (
                <div>
                    Loading
                </div>
            )
        );
    }
}

export default Town;
