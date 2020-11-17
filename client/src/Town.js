import { Component } from 'react';
import * as keyboardjs from 'keyboardjs';
import { Stage, Sprite } from '@inlet/react-pixi';

class Town extends Component {

    constructor(props) {
        super(props);
        // Set random spawn position within a circle 
        var radius = 100;
        var xCenter = window.innerWidth / 2, yCentre = window.innerHeight / 2, theta = 2 * Math.PI * Math.random(), r = Math.sqrt(Math.random());
        var xSpawn = xCenter + radius * r * Math.cos(theta), ySpawn = yCentre + radius * r * Math.sin(theta);
        // Initial state of the canvas
        this.state = {
            conn: props.conn,
            x: Math.floor(xSpawn),
            y: Math.floor(ySpawn),
            height: window.innerHeight,
            width: window.innerWidth,
            users: {}
        }
    }

    // Is invoked when everything is set up and ready to launch
    componentDidMount() {

        // let name = prompt("What should we call you?", "???")
        let name = "zerefwayne";

        this.state.conn.emit('init', { username: name, x: this.state.x, y: this.state.y });

        this.state.conn.on('init', ({ activePlayers }) => {
            console.log(activePlayers);
            let newUsers = {};
            activePlayers.forEach(player => {
                if (player.socket_id !== this.state.conn.id) {
                    newUsers[player.socket_id] = player;
                }
            });
            this.setState({ ...this.state, users: { ...this.state.users, ...newUsers } });
        })

        this.state.conn.on('town/join', ({ player }) => {
            if (player.socket_id !== this.state.conn.id) {
                this.setState({ ...this.state, users: { ...this.state.users, [player.socket_id]: player } });
            }
            console.log('join', player.username);
        });

        this.state.conn.on('town/leave', ({ socket_id }) => {
            let newUsers = this.state.users;
            delete newUsers[socket_id]
            this.setState({ ...this.state, users: newUsers });
            console.log('leave', socket_id);
        });

        this.state.conn.on('town/update', ({player}) => {
            if(player.socket_id === this.state.conn.id) {
                return;
            }
            let user = this.state.users[player.socket_id];
            user.coordinates = player.coordinates;
            this.setState({ ...this.state, users: { ...this.state.users, [player.socket_id]: user } });
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
            return (<Sprite key={index} image="./bunny.png" x={user.coordinates[0]} y={user.coordinates[1]} />)
        });
    }

    componentWillUnmount() {
        keyboardjs.stop();
    }

    render() {
        return (
            <Stage width={this.state.width} height={this.state.height} options={{ backgroundColor: 0x222222, antialias: true }}>
                <Sprite image="./bunny.png" x={this.state.x} y={this.state.y} />
                {this.renderUsers()}
            </Stage>
        );
    }


}

export default Town;