# flake8: noqa
import os
from datetime import datetime
import asyncio
import chess
import chess.engine
from chess.engine import AnalysisResult, AnalysisComplete
from stockfish import Stockfish, StockfishException
import random
from fastapi import Request
from app.services.redis.redis_services import (
    redis_delete_game_by_id,
    redis_get_game_data_by_id,
)
from app.Domains.Engine.engine_manager import EngineManager, EngineManagerError
from app.utils.error_handling import log_error, log_success, ChessGameError, log_debug
from chess import InvalidMoveError, Move
from typing import List
from dotenv import load_dotenv
import redis
from motor.motor_asyncio import AsyncIOMotorClient
from app.services.mongodb.mongo_services import (
    mongo_get_stale_game_ids,
    mongo_update_game_by_game_id,
)

load_dotenv()


class ChessServiceError(ChessGameError):
    pass


class ChessGame:
    """Handles the game state and Stockfish engine."""

    def __init__(
        self, game_id: str, engine_manager: EngineManager, elo_level: str | int
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
                f"Chess Game instances created for game ID: {game_id} and Engine initialized Successfully : {self.engine}, with elo_level: {self.elo_level}"
            )
        except EngineManagerError as eme:
            log_error(f"EngineManagerError while initializing chess game: {str(eme)}")
            raise ChessServiceError(f"EngineManagerError: {str(eme)}")

        except Exception as e:
            log_error(f"Failed to initialize chess game: {str(e)}")
            raise ChessServiceError(f"Chess game initialization failed: {str(e)}")

    def to_dict(self):
        """Converts game object to serializable Dictionary"""
        return {
            "game_id": self.game_id,
            "fen": self.get_fen(),
            "elo_level": self.elo_level,
            "move_stack": self.move_stack,
        }

    @classmethod
    def from_dict(cls, data, engine_manager: EngineManager):
        try:
            game = cls(
                data["game_id"],
                engine_manager=engine_manager,
                elo_level=data["elo_level"],
            )
            game.set_board_from_fen(data["fen"], data["move_stack"])
            return game
        except Exception as e:
            log_error(f"Error Creating Game from dictionary  data: {str(e)}")
            raise ChessServiceError(
                f"Error Creating Game from dictionary data:{str(e)}"
            )

    def set_board_from_fen(self, fen: str, move_stack: List[chess.Move]):
        try:
            for move in move_stack:
                self.board.push(move)
            self.move_stack = move_stack
        except Exception as e:
            log_error("Error updating board state:{e}")
            raise ChessServiceError(f"Error Updating board state:{e}")

    def make_user_move(self, move: str):
        """Applies the user's move (in SAN notation)."""
        try:
            # Convert SAN to a Move object
            chess_move = self.board.parse_san(move)

            # Check if the move is legal
            if chess_move in self.board.legal_moves:
                # Push the move to the board
                self.board.push(chess_move)
                self.move_stack.append(chess_move)
            else:
                raise ValueError("Illegal move by User")
        except Exception as e:
            log_error(f"Error playing user move: {e}")
            raise ChessServiceError(f"Error playing user move: {e}")

    async def get_engine_move(self):
        """Gets Stockfish's best move and applies it."""
        # Check if game is over after user move
        if self.board.is_game_over():
            return None, None, None
        try:
            result = self.engine.play(self.board, chess.engine.Limit(time=2))
            engine_move = result.move.uci()
            # Make move in board
            move = chess.Move.from_uci(engine_move)  # this move is a Move object
            move_san = self.board.san(move)
            self.board.push(move)
            self.move_stack.append(move)
            # also return san move
            is_game_over = self.board.is_game_over()
            return engine_move, move_san, is_game_over
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

    async def get_top_stockfish_moves(self):
        """Get top moves using the engine analysis."""
        try:
            if self.is_game_over():
                return []
            n = min(3, len(list(self.board.legal_moves)))

            # top_moves = newEngineManager.get_top_stockfish_moves() add this after new engine functionality
            with self.engine.analysis(
                board=self.board,
                options={"UCI_Elo": 3000},  # Use full engine strength for analysis
                limit=chess.engine.Limit(depth=25),
            ) as analysis:
                top_moves = []
                seen_moves = set()  # Track unique moves
                # analysis.wait()  # Let the analysis finish

                for info in analysis:
                    if "pv" in info and len(top_moves) < n:
                        move = info["pv"][0]
                        if move.uci() not in seen_moves:  # Check for duplicates
                            seen_moves.add(move.uci())  # Add to the set
                            score = info["score"].relative
                            top_moves.append(
                                {
                                    "move": move.uci(),
                                    "score": (
                                        score.score() / 100
                                        if not score.is_mate()
                                        else f"Mate in {score.mate()}"
                                    ),
                                }
                            )
                        if len(top_moves) >= n:
                            break
                log_success(f"Top Moves: {top_moves}")
                return top_moves
        except Exception as e:
            log_error(f"Error while fetching top moves:{e}")
            raise ChessServiceError(f"Error while fetching top moves:{e}")

    def undo_move(self):
        """Undo the last move."""
        try:
            self.board.pop()  # Engine move undone
            self.board.pop()  # User move undone
            self.move_stack.pop()
            self.move_stack.pop()
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

    def quit_game(self, engine_manager: EngineManager):
        """Stops the Stockfish engine."""
        # remove game from engine manger
        engine_manager.close_engine_by_id(game_id=self.game_id)
        # reset board state
        self.board = chess.Board()


# Dependency Injection to provide a game instance
def create_and_get_new_chess_game(
    game_id: str, elo_level: str | int, engine_manager: EngineManager
) -> ChessGame:
    return ChessGame(
        game_id=game_id, elo_level=elo_level, engine_manager=engine_manager
    )


async def close_stale_games(
    app, mongo_client: AsyncIOMotorClient, redis_client: redis.Redis, engine_manager
):
    while True:
        try:
            log_debug("Running Stale Game Removal Service....")
            stale_game_ids: List[str] = await mongo_get_stale_game_ids(
                mongo_client=mongo_client
            )
            for game_id in stale_game_ids:
                game: ChessGame = ChessGame.from_dict(
                    redis_get_game_data_by_id(
                        game_id=game_id, redis_client=redis_client
                    ),
                    engine_manager=engine_manager,
                )

                # Free the engine instance
                game.quit_game(engine_manager=engine_manager)
                # delte from redis
                redis_delete_game_by_id(game_id=game_id, redis_client=redis_client)
                # Mark game as over in mongo
                result = await mongo_update_game_by_game_id(
                    game_id=game_id,
                    mongo_client=mongo_client,
                    update_data={
                        "is_over": True,
                        "modified_at": datetime.now(),
                    },
                )
                log_success(
                    f"Removed stale game engine instance for game_id: {game_id}"
                )
        except Exception as e:
            log_error(f"Error while removing stale games: {e}")
        await asyncio.sleep(1800)  # Every half hour
