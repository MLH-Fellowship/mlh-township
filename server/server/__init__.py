from flask import Flask
from flask_socketio import SocketIO

socketio = SocketIO()

def init_app():
    app = Flask(__name__)
    app.config.from_object("config")
    socketio.init_app(app, cors_allowed_origins="*")

    with app.app_context():
        from . import main

    return app
