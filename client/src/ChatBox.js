import { Component } from 'react';

import './ChatBox.css';

class ChatBox extends Component {

    constructor(props) {
        super(props);
        this.state = {
            messages: [
            ],
            conn: props.conn,
            inputText: "",
            room: props.room,
            isRoomActive: props.isRoomActive,
            getRoomName: props.getRoomName
        }
        this.renderMessages = this.renderMessages.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
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
    }

    renderMessages() {
        return this.state.messages.map((message, index) => {
            return (
                <li key={index} style={{width: '100%', wordWrap: 'break-word'}} >
                    <span style={{ fontSize: "1rem", fontWeight: "bolder" }}>{`${message.from.username}:`} </span>
                    {message.message}
                    {/* <sub style={{ color: "#A0A0A0" }}> {formatDistance(new Date(message.at), new Date(), { addSuffix: true })}</sub> */}
                </li>
                
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
            <div className={this.state.isRoomActive() ? "app-chatbox app-chatbox-dark" : "app-chatbox"}>
                <div className="header">
                    <p>
                        MLH Township
                    </p>
                    <p style={{fontSize: '1.5rem'}}>
                        {this.state.isRoomActive() ? `Room: ${this.state.getRoomName()}` : ""}
                    </p>

                </div>
                <div className="chatWindow">
                    <ul>
                        {this.renderMessages()}
                    </ul>
                </div>
                <form className="messageBox" onSubmit={(e) => { e.preventDefault(); this.sendMessage() }}>
                    <textarea placeholder="Send a message" className="messageInput" value={this.state.inputText} onChange={this.handleChange}></textarea>
                    <button style={{ backgroundColor: "white", borderRadius: '5px', marginRight: '.5rem', marginLeft: '.5rem' }} type="submit"><img alt="lo bhai" src="send.png" /></button>
                </form>
            </div>
        )
    }

}

export default ChatBox;
