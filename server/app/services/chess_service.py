import chess
import chess.engine
from stockfish import Stockfish
import random
from fastapi import Request
class ChessGame:
    """Handles the game state and Stockfish engine."""
    def __init__(self):
        self.stockfish_engine = Stockfish(path='/opt/homebrew/opt/stockfish/bin/stockfish', depth=15)
        self.stockfish_engine.update_engine_parameters({"Hash": 2048, "UCI_Chess960": "false", "Skill Level": 0})
        self.board = chess.Board()
        
    def setup_stockfish_elo(self, user_elo: int):
        """Sets the Stockfish engine's ELO rating."""
        self.stockfish_engine.set_elo_rating(user_elo)
        
    def reset(self):
        """Resets the game."""
        self.board = chess.Board()
    
    def make_user_move(self, move: str):
        """Applies the user's move (in SAN notation)."""
        print("User chess move as coming from frontend", move)
        
        try:
            # Convert SAN to a move object
            chess_move = self.board.parse_san(move)
            print("chess_move after converting from SAN", chess_move)
            
            # Check if the move is legal
            if chess_move in self.board.legal_moves:
                # Push the move to the board
                self.board.push(chess_move)
                print("board after pushing the move", self.board)
                # Also make the move in Stockfish (using UCI notation)
                #Stockish needs the move in Full algebraic notation
                self.stockfish_engine.make_moves_from_current_position([chess_move])
            else:
                raise ValueError("Illegal move")
        except ValueError as e:
            print(f"Error processing move: {e}")
            raise ValueError("Invalid or illegal move")
    
        
    def get_engine_move(self):
        """Gets Stockfish's best move and applies it."""
        if self.board.is_game_over():
            return None
        candidate_moves = [move["Move"] for move in self.stockfish_engine.get_top_moves(3)]
        # print("candidate_moves", candidate_moves)
        # result = random.choice(candidate_moves)
        result = candidate_moves[0] #Pick the best move
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
def get_chess_game(request: Request):
    if request.app.current_game is None:
        request.app.current_game = ChessGame()
    return request.app.current_game