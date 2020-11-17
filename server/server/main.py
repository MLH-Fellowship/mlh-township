from flask import current_app as app
from flask import request
from flask_socketio import emit

from . import socketio
from .active_players import ActivePlayers
from .player import Player

ACTIVE_PLAYERS = ActivePlayers()


@app.route('/')
def home():
    return {"hello": "connected"}


@socketio.on('connect')
def on_connect():
    socket_id = str(request.sid)
    player = Player(socket_id=socket_id)
    ACTIVE_PLAYERS.add_player(player)
    emit('town/join', {"player": player.__dict__()})


@socketio.on('disconnect')
def on_disconnect():
    socket_id = str(request.sid)
    ACTIVE_PLAYERS.remove_player(socket_id)


@socketio.on('init')
def on_init(json):
    socket_id = str(request.sid)
    player = ACTIVE_PLAYERS.get_player(socket_id)
    player.username = json['username']
    player.update_axes(json['x'], json['y'])
    emit('init', {'activePlayers': ACTIVE_PLAYERS.get_list()})
