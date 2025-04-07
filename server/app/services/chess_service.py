import os
import chess
import chess.engine
from stockfish import Stockfish, StockfishException
import random
from fastapi import Request
from app.services.redis.redis_services import redis_get_game_data_by_id
from app.services.redis.redis_setup import get_redis_client
from app.services.engine.engine_manager import EngineManager
from app.utils.error_handling import log_error, log_success, ChessGameError, log_debug
from chess import InvalidMoveError, Move
from typing import List
from dotenv import load_dotenv


redis_client = get_redis_client()
load_dotenv()


class ChessServiceError(ChessGameError):
    pass


class ChessGame:
    """Handles the game state and Stockfish engine."""

    def __init__(
        self, game_id: str, engine_manager: EngineManager, elo_level: str = 1320
    ):
        try:
            self.engine = engine_manager.create_or_get_engine(
                game_id=game_id, elo_level=elo_level
            )
            self.board = chess.Board()
            self.move_stack = (
                []
            )  # Required to recreate board move by move for the undo functionality
            self.elo_level = elo_level
            self.game_id = game_id
            log_success(
                f"Chess Game instances created for game ID: {game_id} and Engine initialized Successfully : {self.engine}"
            )

        except Exception as e:
            log_error(f"Failed to initialize chess game: {str(e)}")
            raise ChessServiceError(f"Chess game initialization failed: {str(e)}")

    def setup_stockfish_elo(self, user_elo: int):
        """Sets the Stockfish engine's ELO rating."""
        self.stockfish_engine.update_engine_parameters(
            {"UCI_LimitStrength": True, "UCI_Elo": user_elo}
        )
        self.elo_level = user_elo

    def to_dict(self):
        """Converts game object to serializable Dictionary"""
        return {
            "game_id": self.game_id,
            "fen": self.get_fen(),
            "elo_level": self.elo_level,
            "move_stack": self.move_stack,
        }

    @classmethod
    def from_dict(cls, data):
        try:
            game = cls(data["game_id"])
            game.set_board_from_fen(
                data["fen"], data["stockfish_elo"], data["move_stack"]
            )
            log_success(f"Created new Game instance from data:{game}")
            return game
        except Exception as e:
            log_error(f"Error Creating Game from dictionary  data: {str(e)}")
            raise ChessServiceError(
                f"Error Creating Game from dictionary data:{str(e)}"
            )

    def set_board_from_fen(
        self, fen: str, stockfish_elo: str | None, move_stack: List[chess.Move]
    ):
        for move in move_stack:
            self.board.push(move)
        self.move_stack = move_stack
        self.stockfish_engine.set_fen_position(fen, send_ucinewgame_token=False)
        if stockfish_elo:
            self.setup_stockfish_elo(user_elo=stockfish_elo)
            self.engine.configure({"UCI_Elo": stockfish_elo})

    def make_user_move(self, move: str):
        """Applies the user's move (in SAN notation)."""
        log_debug(f"User chess move as coming from frontend: {move}")
        log_debug(f"Move Stack before making user move:\n {self.move_stack}")
        try:
            # Convert SAN to a Move object
            chess_move = self.board.parse_san(move)
            log_debug(f"chess_move after converting from SAN: {chess_move}")

            # Check if the move is legal
            if chess_move in self.board.legal_moves:
                # Push the move to the board
                self.board.push(chess_move)
                self.move_stack.append(chess_move)
                log_debug(f"Move Stack after user move: \n {self.move_stack}")
                print("Board after pushing the move\n", self.board)
                # Also make the move in Stockfish (using UCI notation)
                # Stockish needs the move in Full algebraic notation
                self.stockfish_engine.make_moves_from_current_position([chess_move])
            else:
                raise ValueError("Illegal move")
        except ValueError as e:
            print(f"Error processing move: {e}")
            raise ValueError("Invalid or illegal move")

    async def get_engine_move(self):
        """Gets Stockfish's best move and applies it."""
        if self.board.is_game_over():
            return None
        candidate_moves = [
            move["Move"] for move in self.stockfish_engine.get_top_moves(3)
        ]
        # print("candidate_moves", candidate_moves)
        # result = random.choice(candidate_moves)
        log_debug(f"Stockfish Max Candidate Moves: {candidate_moves}")
        new_result = self.engine.play(self.board, chess.engine.Limit(time=2))
        log_debug(f"Play Result from Self.engine:{new_result}")
        # candidate_moves_using_engine = await self.get_top_moves(
        #     self.engine, self.board, 3
        # )
        # log_debug(f"Candidate Moves from self.engine: {candidate_moves_using_engine}")

        # result = candidate_moves[0]  # Pick the best move
        # pick the result based on chess.engine configured as per elo
        result = new_result.move.uci()
        # Make move in stockfish
        try:
            self.stockfish_engine.make_moves_from_current_position([result])
            # Make move in board
            move = chess.Move.from_uci(result)  # this move is a Move object
            move_san = self.board.san(move)
            self.board.push(move)
            self.move_stack.append(move)
            # also return san move
            log_success(f"Board after engine move: \n {self.board}")
            is_game_over = self.board.is_game_over()
            return move.uci(), move_san, is_game_over
        except InvalidMoveError as e:
            log_error(f"Invalid Move , UCI String invalid: {e}")
            raise ChessServiceError(f"Invalid Move , UCI String invalid: {e}")
        except StockfishException as s:
            log_error(f"Stockfish Exception while making engine move: {s}")
            raise ChessServiceError(
                f"Stockfish Exception while making engine move: {s}"
            )
        except Exception as e:
            log_error(f"Engine Error: {e}")
            raise ChessServiceError(f"Engine Error: {e}")

    # async def get_top_best_stockfish_moves(self, engine: chess.engine, board: chess.Board, n=3):
    #     """Get top moves using the engine analysis."""
    #     top_moves = []
    #     analysis = engine.analyse(board, chess.engine.Limit(time=3.0), multipv=3)
    #     log_debug(f"Options:{engine.options}")
    #     multipv = analysis[0]["pv"]
    #     for i in range(3):
    #         top_moves.append(multipv[i].uci())

    #     return top_moves

    def undo_move(self):
        """Undo the last move."""
        try:
            log_success(f"Board before undoing: \n{self.board}")
            log_debug(f"Board move stack before undo:\n {self.board.move_stack}")
            self.board.pop()  # Engine move undone
            self.board.pop()  # User move undone
            self.move_stack.pop()
            self.move_stack.pop()
            self.stockfish_engine.set_fen_position(
                self.board.fen(), send_ucinewgame_token=False
            )
            # self.engine.TODO: check if engine update is required
            return self.board.fen()
        except IndexError as i:
            log_error(f"Index error while takeback , move Stack empty:{i}")
            raise ChessServiceError(
                f"Index error while takeback , move Stack empty:{i}"
            )
        except StockfishException as s:
            log_error(f"Stockfish Exception while takeback : {s}")
            raise ChessServiceError(f"Stockfish Exception while takeback : {s}")

    def get_fen(self):
        """Returns the board state in FEN notation."""
        return self.board.fen()

    def is_game_over(self):
        """Checks if the game is over."""
        return self.board.is_game_over()

    def quit_game(self):
        """Stops the Stockfish engine."""
        self.stockfish_engine.set_position([])
        self.engine.quit()
        self.board = chess.Board()


# Dependency Injection to provide a game instance
def create_and_get_new_chess_game(
    game_id: str, elo_level: str | int, engine_manager: EngineManager
) -> ChessGame:
    return ChessGame(
        game_id=game_id, elo_level=elo_level, engine_manager=engine_manager
    )
