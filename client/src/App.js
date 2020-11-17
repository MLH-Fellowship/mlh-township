import './App.css';
import Town from './Town';
import { Component } from 'react';
import io from 'socket.io-client';
class App extends Component {
  constructor() {
    super();
    this.state = {
      socketConn: null,
      activeUsers: [{
        avatar: "./bunny.png",
        x: 40,
        y: 30
      },
      {
        avatar: "./bunny.png",
        x: 200,
        y: 60
      },
      {
        avatar: "./bunny.png",
        x: 100,
        y: 80
      },]
    }
  }

  componentDidMount() {
    const socket = io("http://localhost:5000/");
    this.setState({ socketConn: socket });
  }

  render() {
    return (
      this.state.socketConn ? <Town conn={this.state.socketConn} /> : "Loading.."
    )
  }
}

export default App;
