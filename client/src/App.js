import './App.css';
import { Stage, Sprite } from '@inlet/react-pixi';
import { Component } from 'react';
import * as keyboardjs from 'keyboardjs';

class App extends Component {

  constructor(props) {
    super(props);
    // Initial state of the canvas
    this.state = {
      x: 50,
      y: 100,
      height: window.innerHeight,
      width: window.innerWidth
    }
  }

  // Is invoked when everything is set up and ready to launch
  componentDidMount() {
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

export default App;
