 #This the file where the game will be initialized once the start game 
#command is received from the client.

from stockfish import Stockfish
import chess
import chess.engine
import os

def initialize_game(user_elo):
    return "game initialized with the stockfirst engine of elo: " + str(user_elo)