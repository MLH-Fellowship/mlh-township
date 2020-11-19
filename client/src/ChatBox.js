import { Component } from 'react';
import { formatDistance } from 'date-fns';

import './ChatBox.css';

class ChatBox extends Component {

    constructor(props) {
        super(props);
        this.state = {
            messages: [
                {
                    "from": { "username": "zerefwayne" },
                    "message": "Hello how are you",
                    "at": new Date()
                }
            ],
            conn: props.conn,
            inputText: "Hello",
            room: props.room,
            isRoomActive: props.isRoomActive
        }
        this.renderMessages = this.renderMessages.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.joinRoom = this.joinRoom.bind(this);
        this.createRoom = this.createRoom.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        this.state.conn.on('town/chat', (req) => {
            this.setState({ messages: [...this.state.messages, req] });
        });

        this.state.conn.on('room/chat', (req) => {
            console.log('room/chat');
            this.setState({ messages: [...this.state.messages, req] });
        });

        this.state.conn.on('room/chat', (req) => {
            console.log('room/chat');
            this.setState({messages: [...this.state.messages, req]});
        });
    }

    renderMessages() {
        return this.state.messages.map((message, index) => {
            return (
                <p key={index} >
                    <span style={{ color: "#C0C0C0", fontSize: "1.25rem", fontWeight: "bolder" }}>{message.from.username} {">"} </span>
                    {message.message}
                    <sub style={{ color: "#A0A0A0" }}> {formatDistance(new Date(message.at), new Date(), { addSuffix: true })}</sub>
                </p>
            )
        })
    }

    sendMessage() {
        if (this.state.inputText) {
            this.state.conn.emit(this.state.isRoomActive() ? 'room/chat' : 'town/chat', this.state.inputText);
            this.setState({ inputText: "" });
        }
    }


    handleChange(event) {
        this.setState({ inputText: event.target.value });
    }

    render() {
        return (
            <div className="app-chatbox">
                <div className="header">
                    MLH Township
                </div>
                <div className="chatWindow">
                    <ul>
                        {this.renderMessages()}
                    </ul>
                </div>
                <div className="messageBox">
                    <textarea className="messageInput" value={this.state.inputText} onChange={this.handleChange}></textarea>
                    <button style={{ marginRight: '.5rem', marginLeft: '.5rem' }} onClick={() => { this.sendMessage() }} ><img alt="lo bhai" src="send.png" /></button>
                </div>
            </div>
        )
    }

}

export default ChatBox;
