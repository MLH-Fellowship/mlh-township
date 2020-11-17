import json


class Player(object):
    def __init__(self, socket_id: str, username=None, x_axis=0, y_axis=0):
        self.socket_id = socket_id
        self.username = username
        self.x_axis = x_axis
        self.y_axis = y_axis

    def __str__(self):
        return str(self.socket_id)

    def __repr__(self):
        return json.dumps(self)

    @property
    def user_name(self):
        return self.username

    def update_axes(self, x, y):
        self.x_axis = x
        self.y_axis = y

    def __dict__(self):
        return {
            'username': self.username,
            'socket_id': self.socket_id,
            'coordinates': (self.x_axis, self.y_axis),
        }

    def to_object(self):
        return dict(
            {
                'username': str(self.username),
                'socket_id': str(self.socket_id),
                'coordinates': [int(self.x_axis), int(self.y_axis)],
            }
        )
