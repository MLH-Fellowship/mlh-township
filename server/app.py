from server import init_app
from server import socketio

app = init_app()

if __name__ == "__main__":
    socketio.run(app, host="localhost", debug=True)
