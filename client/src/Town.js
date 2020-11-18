import { Component } from 'react';
import * as keyboardjs from 'keyboardjs';
import { Stage, Sprite } from '@inlet/react-pixi';

import './Town.css';

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
        this.state = {
            conn: props.conn,
            x: Math.floor(xSpawn),
            y: Math.floor(ySpawn),
            height: wHeight,
            width: wWidth,
            users: {}
        }
    }

    // Is invoked when everything is set up and ready to launch
    componentDidMount() {

        // let name = prompt("What should we call you?", "???")
        let name = "zerefwayne";

        this.state.conn.emit('init', { username: name, x: this.state.x, y: this.state.y });

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
            console.log('join', player.username);
        });

        this.state.conn.on('town/leave', ({ socketId }) => {
            console.log(socketId);
            let newUsers = this.state.users;
            delete newUsers[socketId]
            this.setState({ ...this.state, users: newUsers });
            console.log('leave', socketId);
        });

        this.state.conn.on('town/update', ({players}) => {
            let newUsers = {};
            console.log('town/update', players);
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
            // console.log(user);
            return (<Sprite key={index} image="./bunny.png" x={user.xAxis} y={user.yAxis} />)
        });
    }

    componentWillUnmount() {
        keyboardjs.stop();
    }

    render() {
        return (
            <div className="app-town">
                <div className="app-pixi" style={{backgroundImage: "url(" + "map.png" + ")",
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        }}>
                    <Stage width={this.state.width} height={this.state.height} options={{ transparent: true, antialias: true }}>
                        <Sprite image="./bunny.png" x={this.state.x} y={this.state.y} />
                        {this.renderUsers()}
                    </Stage>
                </div>
                <div className="app-chat">
                    <ChatBox />
                </div>
            </div>
        );
    }


}

export default Town;
