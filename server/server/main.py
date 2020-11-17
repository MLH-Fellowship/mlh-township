from flask import current_app as app

from . import socketio

locations = {}


@app.route('/')
def home():
    return {"hello": "connected"}


@socketio.on('message')
def handle_message(message):
    print('received message: ', message)
