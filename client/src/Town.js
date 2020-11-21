import { Component, createRef } from 'react';
import * as keyboardjs from 'keyboardjs';
import * as PIXI from 'pixi.js';
import { Stage, Sprite, AnimatedSprite, Container, Text } from '@inlet/react-pixi';
// eslint-disable-next-line
import Peer from 'peerjs';

import './Town.css';
import joinIcon from './join.png';
import createIcon from './create.png';

// import bunny from './bunny.png';

import ChatBox from './ChatBox';
import { id } from 'date-fns/locale';

// Sprite animation stuff
let bdText = PIXI.Texture.from("./map.png");
let texture = {};


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
        this.getRoomName = this.getRoomName.bind(this);
        this.handleUserinput = this.handleUserinput.bind(this);
        this.handleAvatarinput = this.handleAvatarinput.bind(this);
        this.onSubmitForm = this.onSubmitForm.bind(this);
        this.displayRoom = this.displayRoom.bind(this);
        this.renderTown = this.renderTown.bind(this);
        this.showOptions = false;

        this.state = {
            isLoaded: true,
            isMoving: true,
            direction: 0,
            conn: props.conn,
            x: Math.floor(xSpawn),
            y: Math.floor(ySpawn),
            height: wHeight,
            width: wWidth,
            inputUsername: "",
            inputAvatar: "biker",
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
            isInited: false,
        }
    }

    isRoomActive() {
        return this.state.room.isActive;
    }

    getRoomName() {
        return this.state.room.name;
    }

    handleUserinput(event) {
        this.setState({ inputUsername: event.target.value });
    }

    handleAvatarinput(event) {
        this.setState({ inputAvatar: event.target.value });
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
            this.setState({ ...this.state, users: { ...this.state.users, ...newUsers }, isInited: true });
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
            this.setState({ ...this.state, isMoving: true });
            switch (e.code) {
                case "ArrowLeft":
                    this.setState({ ...this.state, x: Math.max(0, this.state.x - (e.shiftKey ? 7 : 3)) });
                    this.setState({...this.state, direction: 2});
                    break;
                case "ArrowRight":
                    this.setState({ ...this.state, x: Math.min(this.state.width - 25, this.state.x + (e.shiftKey ? 7 : 3)) });
                    this.setState({...this.state, direction: 3});
                    break;
                case "ArrowUp":
                    this.setState({ ...this.state, y: Math.max(0, this.state.y - (e.shiftKey ? 7 : 3)) });
                    this.setState({...this.state, direction: 0});
                    break;
                case "ArrowDown":
                    this.setState({ ...this.state, y: Math.min(this.state.height - 25, this.state.y + (e.shiftKey ? 7 : 3)) });
                    this.setState({...this.state, direction: 1});
                    break;
                default:
            }
            // Send final location to backend
            this.state.conn.emit('town/move', { x: this.state.x, y: this.state.y, lastDirection: this.state.direction});
            this.state.conn.emit('player/move', true);
            this.displayRoom();
        }, () => {
            this.setState({ ...this.state, isMoving: false });
            this.state.conn.emit('player/move', false);
        });
    }

    setTexture(sprite) {

        let textureArray = []

        var mov = {
            0: [`./mov/${sprite}/u_0.png`, `./mov/${sprite}/u_1.png`, `./mov/${sprite}/u_2.png`],
            1: [`./mov/${sprite}/d_0.png`, `./mov/${sprite}/d_1.png`, `./mov/${sprite}/d_2.png`],
            2: [`./mov/${sprite}/l_0.png`, `./mov/${sprite}/l_1.png`, `./mov/${sprite}/l_2.png`],
            3: [`./mov/${sprite}/r_0.png`, `./mov/${sprite}/r_1.png`, `./mov/${sprite}/r_2.png`]
        };

        console.log(sprite);
        for (let i = 0; i < 4; i++) {
            textureArray[i] = [];
            for (let j = 0; j < 3; j++) {
                let text = PIXI.Texture.from(mov[i][j]);
                textureArray[i][j] = text;
            }
        }

        return textureArray;
    }

    displayRoom() {
        let xc = this.state.width / 2, yc = 0;
        let radius = 250;
        let dist = Math.sqrt((this.state.x - xc) * (this.state.x - xc) + (this.state.y - yc) * (this.state.y - yc));
        // this.setState({ ...this.state, showOptions: dist < radius });
        this.showOptions = dist < radius;
    }


    renderUsers() {
        return Object.keys(this.state.users).map((userkey, index) => {
            const user = this.state.users[userkey];
            console.log(user);
            if (!texture[user.avatar]) texture[user.avatar] = this.setTexture(user.avatar);

            if (texture[user.avatar][user.lastDirection]) {
                return (
                    <Container position={[user.xAxis, user.yAxis]}>
                        <Text text={user.username} anchor={0.5} x={0} y={-40}
                            style={
                                {
                                    align: 'center',
                                    fontFamily: 'Helvetica',
                                    fontSize: 20,
                                    fontWeight: 'bold',
                                    fontVariant: 'small-caps',
                                    wordWrap: true,
                                    wordWrapWidth: 40,
                                    color: 'white',
                                }
                            } />
                        <AnimatedSprite
                            key={index}
                            position={[0, 0]}
                            anchor={0.5}
                            textures={texture[user.avatar][user.lastDirection]}
                            isPlaying={user.isMoving}
                            initialFrame={1}
                            animationSpeed={0.1}
                        />
                    </Container>
                )
            } else {
                return (
                    <Container position={[user.xAxis, user.yAxis]}>
                        <Text text={user.username} anchor={0.5} x={0} y={-40}
                            style={
                                {
                                    align: 'center',
                                    fontFamily: 'Helvetica',
                                    fontSize: 20,
                                    fontWeight: 'bold',
                                    fontVariant: 'small-caps',
                                    wordWrap: true,
                                    wordWrapWidth: 40,
                                    color: 'white',
                                }
                            } />
                        <Sprite image={`./mov/${user.avatar}/u_1.png`} x={0} y={0} />
                    </Container>
                );
            }
        });
    }

    renderUs() {
        if (!texture[this.state.inputAvatar]) texture[this.state.inputAvatar] = this.setTexture(this.state.inputAvatar);

        console.log(this.state);

        if (texture[this.state.inputAvatar][this.state.direction])
            return (
                <AnimatedSprite
                    position={[this.state.x, this.state.y]}
                    anchor={0.5}
                    textures={texture[this.state.inputAvatar][this.state.direction]}
                    isPlaying={this.state.isMoving}
                    initialFrame={1}
                    animationSpeed={0.1}
                />
            );
        return (
            <Sprite image={`./mov/${this.state.inputAvatar}/u_1.png`} x={this.state.x} y={this.state.y} />
        );
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

        let v = this.videoRef.current;
        if (v != null) {
            v.append(videoEl);
        } else {
            console.log("cannot find videoRef");
        }
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
                    try {
                        const el = document.getElementById(member.peerId);
                        if (el) {
                            el.remove()
                        }
                    }
                    catch (error) {
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
                const el = document.getElementById(member.peerId);
                if (el) {
                    el.remove()
                }

            });

        });

    }

    joinRoom = async () => {

        let roomName = prompt("Please enter the room name: ");
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
                        const el = document.getElementById(member.peerId);
                        if (el) {
                            el.remove()
                        }
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
                    if (el) {
                        el.remove();
                    }
                });
            });

        }
    }

    onSubmitForm(e) {
        e.preventDefault();
        let name = this.state.inputUsername || "unknown";
        let avatar = this.state.inputAvatar || "biker";
        let user = { username: name, x: this.state.x, y: this.state.y, avatar: avatar };
        console.log("making user object", user);
        this.state.conn.emit('init', user);
    }

    leaveRoom() {
        this.state.conn.emit('room/leave', { "roomName": this.state.room.name });
        this.setState({ room: { ...this.state.room, members: [], isActive: false, name: "" } });
        this.state.myStream.getTracks().forEach(function (track) {
            console.log('-stop-', track);
            track.stop();
        });
        [...(document.getElementsByTagName('video'))].forEach((element) => {
            element.remove();
        });
    }

    renderTown() {
        return (
            <div className="app-pixi" style={{
                backgroundImage: 'url(map.png)',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
            }}>
                <Stage width={this.state.width} height={this.state.height} options={{ transparent: true, antialias: true }}>
                    {this, this.renderUs()}
                    {this.renderUsers()}
                </Stage>
                {
                    this.showOptions ? (
                        <div className="options-overlay">
                            <button className="mr-10" onClick={this.joinRoom} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', outline: 'none' }}>
                                <img alt="Join Room" src={joinIcon}></img>
                                <p>Join Room</p>
                            </button>
                            <button onClick={this.createRoom} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', outline: 'none' }}>
                                <img alt="Create Room" src={createIcon}></img>
                                <p>Create Room</p>
                            </button>
                        </div>
                    ) : ""
                }
                <div id="overlay">
                    <div className="app-chat">
                        <ChatBox conn={this.state.conn} getRoomName={this.getRoomName} room={this.state.room} isRoomActive={this.isRoomActive} />
                    </div>
                </div>
            </div>
        )
    }

    render() {
        if (this.state.isInited) {
            return (
                <div className="app-town">
                    {this.state.room.isActive ? (
                        <div className="app-room" style={{
                            backgroundColor: "#222222",
                            backgroundPosition: 'center',
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            color: 'white',
                        }}>
                            <div>
                                <button className="m-2 bg-red-500 p-2 px-3" onClick={() => { this.leaveRoom() }}>Leave Room</button>
                            </div>
                            <div id="video-grid" ref={this.videoRef}>
                            </div>
                            <div id="overlay">
                                <div className="app-chat">
                                    <ChatBox getRoomName={this.getRoomName} conn={this.state.conn} room={this.state.room} isRoomActive={this.isRoomActive} />
                                </div>
                            </div>
                        </div>
                    ) : this.renderTown()}
                </div>
            )
        } else {
            // landing page
            return (
                <div class="app-landing">
                    <div class="form-container">
                        <form class="app-join-form" onSubmit={this.onSubmitForm}>
                            <h2 className="align-center text-3xl mb-5" style={{ textAlign: 'center', }}>Welcome!</h2>
                            <input onChange={this.handleUserinput} value={this.state.inputUsername} className="mt-3 p-1" placeholder="What should we call you?"></input>
                            <label className="mt-3" for="avatar-select">Select your avatar:&nbsp;</label>
                            <select value={this.state.inputAvatar} onChange={this.handleAvatarinput} className="mt-3 p-1 bg-white" id="avatar-select">
                                {/* <option value="bunny">Bunny</option> */}
                                <option value="bald">Bald</option>
                                <option value="biker">Biker</option>
                                <option value="dragon">Dragon</option>
                                <option value="girl">Girl</option>
                            </select>
                            <img alt="this will be you uwu :)" src={`./mov/${this.state.inputAvatar}/d_1.png`} className="my-3" width="50px" />
                            <button className="mt-3 bg-blue-500 p-2 rounded-md text-white" type="submit">Join!</button>
                        </form>
                    </div>
                </div>
            )
        }
    }
}

export default Town;
