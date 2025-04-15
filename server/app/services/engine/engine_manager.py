import chess.engine
from chess.engine import EngineError, EngineTerminatedError
from app.utils.error_handling import log_debug, log_success, log_error, ChessGameError
from typing import Dict
import os
from dotenv import load_dotenv
from fastapi import HTTPException


class EngineManagerError(ChessGameError):
    pass


load_dotenv()

STOCKFISH_PATH = os.getenv("STOCKFISH_PATH")

if not STOCKFISH_PATH:
    log_error("STOCKFISH_PATH is not set. Please check your .env file.")
    raise EngineManagerError("STOCKFISH_PATH is not set. Please check your .env file.")

log_debug(f"STOCKFISH_PATH loaded: {STOCKFISH_PATH}")


class EngineManager:

    _engine_map: Dict[str, chess.engine.SimpleEngine] = {}

    def __init__(self):
        pass

    def create_or_get_engine(
        self, game_id: str, elo_level: str | int
    ) -> chess.engine.SimpleEngine:
        try:
            if game_id not in self._engine_map:
                self._engine_map[game_id] = self.create_engine(elo_level)
                log_success(f"Created new engine instance for game_id:{game_id}")
            else:
                log_success(f"Engine Instance already present for game_id : {game_id}")
            return self._engine_map[game_id]
        except EngineError as ee:
            log_error(f"Engine Error while initializing for Game ID : {game_id} : {ee}")
            raise EngineManagerError(
                f"Engine Error while initializing for Game ID : {game_id} : {ee}"
            )
        except Exception as e:
            log_error(f" Error while initializing for Game ID : {game_id} : {ee}")
            raise EngineManagerError(
                f" Error while initializing for Game ID : {game_id} : {ee}"
            )

    def create_engine(self, elo_level: str | int) -> chess.engine.SimpleEngine:
        """Creates a new instance of the chess engine."""
        try:
            engine: chess.engine.SimpleEngine = chess.engine.SimpleEngine.popen_uci(
                STOCKFISH_PATH
            )
            engine.configure(
                {
                    "UCI_LimitStrength": True,
                    "UCI_Elo": elo_level,
                    "Hash": 1024,
                }
            )
            return engine
        except EngineError as ee:
            log_error(f"Error creating engine: {ee}")
            raise EngineManagerError(f"Error creating engine: {ee}")

    def close_engine_by_id(self, game_id: str):
        """Closes the engine associated with a given game ID."""
        engine = self._engine_map.get(game_id)
        if engine:
            try:
                engine.quit()
                del self._engine_map[game_id]
                log_success(f"Engine for Game ID {game_id} closed successfully.")
            except EngineTerminatedError:
                log_error(f"Engine for Game ID {game_id} already terminated.")
            except Exception as e:
                log_error(f"Error closing engine for Game ID {game_id}: {e}")
        else:
            log_error(f"No engine found for Game ID {game_id}.")

    def clean_up(self):
        """Cleans up all engines by closing them."""
        for game_id, engine in list(self._engine_map.items()):
            try:
                engine.quit()
                del self._engine_map[game_id]
                log_success(f"Engine for Game ID {game_id} closed during cleanup.")
            except EngineTerminatedError:
                log_error(
                    f"Engine for Game ID {game_id} already terminated during cleanup."
                )
            except Exception as e:
                log_error(f"Error cleaning up engine for Game ID {game_id}: {e}")


if __name__ == "__main__":
    em = EngineManager()
    em.clean_up()
    em.create_or_get_engine(game_id="123", elo_level=1400)
    log_debug(em._engine_map.get("123").options.get("UCI_Elo"))
    em.clean_up()
