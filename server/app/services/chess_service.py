import chess
import chess.engine
from stockfish import Stockfish
import random

class ChessGame:
    """Handles the game state and Stockfish engine."""
    def __init__(self):
        self.stockfish_engine = Stockfish(path='/opt/homebrew/opt/stockfish/bin/stockfish', depth=15)
        self.stockfish_engine.update_engine_parameters({"Hash": 2048, "UCI_Chess960": "true"})
        self.board = chess.Board()
        
    def setup_stockfish_elo(self, user_elo: int):
        """Sets the Stockfish engine's ELO rating."""
        self.stockfish_engine.set_elo_rating(user_elo)
        
    def reset(self):
        """Resets the game."""
        self.board = chess.Board()
    
    def make_user_move(self, move: str):
        """Applies the user's move."""
        chess_move = chess.Move.from_uci(move)
        if chess_move in self.board.legal_moves:
            print("chess_move", chess_move)
            self.board.push(chess_move)
            #Also make move in stockfish
            self.stockfish_engine.make_moves_from_current_position([chess_move])
            # return self.stockfish_engine.get_board_visual()
        else:
            raise ValueError("Illegal move")
    
    def convert_to_uci(board, move_notation):
        """Convert algebraic notation to UCI format using python-chess."""
        try:
            move = board.parse_san(move_notation)
            return move.uci()
        except ValueError:
            return None
        
    def get_engine_move(self):
        """Gets Stockfish's best move and applies it."""
        if self.board.is_game_over():
            return None
        candidate_moves = [move["Move"] for move in self.stockfish_engine.get_top_moves(3)]
        print("candidate_moves", candidate_moves)
        result = random.choice(candidate_moves)
        #Make move in stockfish
        self.stockfish_engine.make_moves_from_current_position([result])
        #Make move in board

        move = chess.Move.from_uci(result)
        # print("move", move)
        self.board.push(move) #this is error
        # print(self.stockfish_engine.get_board_visual())
        return move.uci()

    def get_fen(self):
        """Returns the board state in FEN notation."""
        return self.board.fen()

    def is_game_over(self):
        """Checks if the game is over."""
        return self.board.is_game_over()

    def quit_engine(self):
        """Stops the Stockfish engine."""
        self.stockfish_engine.set_position([])
        self.reset()

# Dependency Injection to provide a game instance
def get_chess_game():
    return ChessGame()