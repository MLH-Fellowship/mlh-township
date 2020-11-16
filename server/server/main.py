from flask import current_app as app
from . import socketio
from flask import render_template

locations = {}

@app.route('/')
def home():
   return render_template('test.html', sync_mode=socketio.async_mode)

@socketio.on('message')
def handle_message(message):
   print('received message: ' + message)
