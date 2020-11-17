import logging

logger = logging.Logger(__name__)


class ActivePlayers(dict):
    def add_player(self, player):
        self.update({player.socket_id: player})

    def remove_player(self, socket_id):
        try:
            self.pop(socket_id)
        except KeyError:
            logger.error(f'Player with socket id: {socket_id} does not exist')

    def get_list(self):
        return [player.__dict__() for player in self.values()]

    def get_player(self, socket_id):
        try:
            return self[socket_id]
        except KeyError:
            logger.error(f'Player with socket id: {socket_id} does not exist')
