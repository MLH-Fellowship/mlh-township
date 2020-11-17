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
            width: window.innerWidth
        }
    }

    // Is invoked when everything is set up and ready to launch
    componentDidMount() {
        this.state.conn.emit('init', {username: "zerefwayne", x: this.state.x, y: this.state.y});
        
        this.state.conn.on('init', (message) => {
          console.log(message);
        })
        
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
            this.state.conn.emit('event/move', { x: this.state.x, y: this.state.y });
        });
    }

    componentWillUnmount() {
        keyboardjs.stop();
    }

    render() {
        return (
            <Stage width={this.state.width} height={this.state.height} options={{ backgroundColor: 0x222222, antialias: true }}>
                <Sprite image="./bunny.png" x={this.state.x} y={this.state.y} />
            </Stage>
        );
    }


}

export default Town;