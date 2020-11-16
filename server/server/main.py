from flask import current_app as app
from . import socketio
from flask import render_template

locations = {}

@app.route('/')
def home():
   return render_template('test.html', sync_mode=socketio.async_mode)

@socketio.on('move')
def handle_message(message):
    # deserialize the json request data