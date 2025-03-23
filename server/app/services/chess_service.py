import chess
import chess.engine
from stockfish import Stockfish
import random
from fastapi import Request
from app.services.redis.redis_services import redis_get_game_data_by_id
from app.services.redis.redis_setup import get_redis_client

redis_client = get_redis_client()


class ChessGame:
    """Handles the game state and Stockfish engine."""

    elo_level = None

    def __init__(self, game_id: str):
        self.stockfish_engine = Stockfish(
            path="/opt/homebrew/opt/stockfish/bin/stockfish", depth=15
        )
        self.stockfish_engine.update_engine_parameters(
            {"Hash": 2048, "UCI_Chess960": "false", "Skill Level": 0}
        )
        self.board = chess.Board()
        self.game_id = game_id

    def setup_stockfish_elo(self, user_elo: int):
        """Sets the Stockfish engine's ELO rating."""
        self.stockfish_engine.set_elo_rating(user_elo)
        self.elo_level = user_elo

    def to_dict(self):
        """Converts game object to serializable Dictionary"""
        return {
            "game_id": self.game_id,
            "fen": self.get_fen(),
            "stockfish_elo": self.elo_level,
        }

    @classmethod
    def from_dict(cls, data):
        game = cls(data["game_id"])
        game.set_board_from_fen(data["fen"], data["stockfish_elo"])
        return game

    def set_board_from_fen(self, fen: str, stockfish_elo: str | None):
        self.board = chess.Board(fen=fen)
        self.stockfish_engine.set_fen_position(fen, send_ucinewgame_token=False)
        if stockfish_elo:
            self.setup_stockfish_elo(user_elo=stockfish_elo)

    def reset(self):
        """Resets the game."""
        self.board = chess.Board()
        self.stockfish_engine.set_position([])

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
                # Stockish needs the move in Full algebraic notation
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
        candidate_moves = [
            move["Move"] for move in self.stockfish_engine.get_top_moves(3)
        ]
        # print("candidate_moves", candidate_moves)
        # result = random.choice(candidate_moves)
        result = candidate_moves[0]  # Pick the best move
        # Make move in stockfish
        self.stockfish_engine.make_moves_from_current_position([result])
        # Make move in board

        move = chess.Move.from_uci(result)  # this move is a Move object
        # print("move", move)
        move_san = self.board.san(move)
        self.board.push(move)
        # print(self.stockfish_engine.get_board_visual())
        # also return san move
        return move.uci(), move_san

    def undo_move(self):
        """Undo the last move."""
        self.board.pop()  # Engine move undone
        self.board.pop()  # User move undone
        self.stockfish_engine.set_fen_position(
            self.board.fen(), send_ucinewgame_token=False
        )
        return self.board.fen()

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
def create_and_get_new_chess_game(game_id: str) -> ChessGame:
    return ChessGame(game_id=game_id)
