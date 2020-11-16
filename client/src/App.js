import './App.css';
import { Stage, Sprite } from '@inlet/react-pixi';
import { Component } from 'react';

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      x: 50,
      y: 100
    }
    setInterval(() => {
      this.movePlayer();
    }, 500)
  }

  movePlayer() {

    let newX = Math.floor(Math.random() * (window.innerWidth));
    let newY = Math.floor(Math.random() * (window.innerHeight));

    this.setState({ x: newX, y: newY });

  }

  render() {
    return (
      <Stage width={window.innerWidth} height={window.innerHeight + 4} options={{ backgroundColor: 0xEEEEEE, antialias: true }}>
        <Sprite image="./bunny.png" x={this.state.x} y={this.state.y} />
      </Stage>
    );
  }
}

export default App;
