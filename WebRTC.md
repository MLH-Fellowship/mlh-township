# WebRTC


- User opens the application, a Peer object is created

- User creates a room, in this request it also sends the Peer.id
- Store this peer ID in ``peers_list`` of Room object


- User joins a room
- Server sends message to the room: new user has joined: ``user_joined``
- user_joined received on client, 
- other clients call new user on this peer id
- On receiving user_joined

