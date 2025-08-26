# flake8: noqa
import os
import asyncio
import bisect
import chess.engine
from chess.engine import (
    EngineError,
    EngineTerminatedError,
    PlayResult,
    InfoDict,
    Cp,
    Mate,
    Score,
)
from typing import Dict
from dotenv import load_dotenv
from fastapi import HTTPException
from app.utils.error_handling import log_debug, log_success, log_error, ChessGameError
from app.Domains.Engine.models import TopStockfishMoves


class EngineError(ChessGameError):
    pass


if "DOCKER" not in os.environ:
    load_dotenv()

# Get the Stockfish path - prioritize environment variable
STOCKFISH_PATH = os.environ.get("STOCKFISH_PATH")

if not STOCKFISH_PATH:
    log_error("STOCKFISH_PATH is not set. Please check your environment.")
    raise EngineError("STOCKFISH_PATH is not set. Please check your environment.")

log_debug(f"STOCKFISH_PATH loaded: {STOCKFISH_PATH}")

# Centralized engine class


class StockfishEngine:
    # This will hold the single instance of the class
    _instance = None
    _skill_elo_map = [
        {"skill": "0", "elo": "1347"},
        {"skill": "1", "elo": "1490"},
        {"skill": "2", "elo": "1597"},
        {"skill": "3", "elo": "1694"},
        {"skill": "4", "elo": "1785"},
        {"skill": "5", "elo": "1871"},
        {"skill": "6", "elo": "1954"},
        {"skill": "7", "elo": "2035"},
        {"skill": "8", "elo": "2113"},
        {"skill": "9", "elo": "2189"},
        {"skill": "10", "elo": "2264"},
        {"skill": "11", "elo": "2337"},
        {"skill": "12", "elo": "2409"},
        {"skill": "13", "elo": "2480"},
        {"skill": "14", "elo": "2550"},
        {"skill": "15", "elo": "2619"},
        {"skill": "16", "elo": "2686"},
        {"skill": "17", "elo": "2754"},
        {"skill": "18", "elo": "2820"},
        {"skill": "19", "elo": "2886"},
    ]

    def __new__(cls):
        if not cls._instance:
            cls._instance = super(StockfishEngine, cls).__new__(cls)
        return cls._instance

    def __init__(self):

        if hasattr(self, "_initialized") and self._initialized:
            return

        try:
            self.engine: chess.engine.SimpleEngine = (
                chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)
            )
            self.engine.configure(
                {
                    "Hash": 128,
                }
            )
            self._initialized = True
            log_success(f"Stockfish central engine initialized:{self.engine}")
        except EngineError as ee:
            log_error(f"Error creating engine: {ee}")
            raise EngineError(f"Error initializing engine: {ee}")

    def quit_engine(self):
        if hasattr(self, "engine") and self.engine is not None:
            try:
                self.engine.quit()
                self.engine = None
                self._initialized = False
                log_success("Stockfish engine successfully shut down.")
            except Exception as e:
                raise EngineError(f"Error while quitting Stockfish engine: {e}")

    def get_engine_move(self, board: chess.Board, user_elo: str | int) -> PlayResult:
        """Get stockfish engine move for the current board and given elo strength"""
        user_elo_int = int(user_elo)
        idx = bisect.bisect_left(
            [int(item["elo"]) for item in self._skill_elo_map], user_elo_int
        )

        stockfish_skill = self._skill_elo_map[idx]["skill"]

        result = self.engine.play(
            board=board,
            limit=chess.engine.Limit(time=2),
            options={
                "UCI_LimitStrength": True,
                "Skill Level": stockfish_skill,
            },
        )

        return result

    def get_top_stockfish_moves(self, board: chess.Board) -> list[TopStockfishMoves]:
        top_moves = []
        n = min(
            3, len(list(board.legal_moves))
        )  # number of moves to return back for AI analysis
        log_debug(f"Number of moves analysing = {n}")
        try:
            possible_moves: list[InfoDict] = self.engine.analyse(
                board=board,
                limit=chess.engine.Limit(time=3.0),
                options={"UCI_Elo": 3000},
                multipv=n,
            )

            for p_move in possible_moves:
                move = p_move["pv"][0].uci()
                abs_score: Score = p_move[
                    "score"
                ].white()  # evalutation always from whites perspective
                score = (
                    abs_score.score() / 100
                    if not abs_score.is_mate()
                    else f"Mate in {abs_score.mate()}"
                )
                top_moves.append({"move": move, "score": str(score)})
        except Exception as e:
            raise EngineError(f"Error while getting top moves from stockfish:{e}")
        # sort temp moves in the order of decreasing score
        top_moves.sort(key=lambda x: x["score"], reverse=True)
        return top_moves


if __name__ == "__main__":
    se = StockfishEngine()

    board = chess.Board(
        fen="r2qkbnr/pp2pppp/n2p2b1/2p5/Q3P3/2P2NP1/PP1P1P1P/RNB1KB1R b KQkq - 2 6"
    )
    em = se.get_engine_move(board=board, user_elo="2000")
    top_moves = se.get_top_stockfish_moves(board)
    log_debug(f"Top Moves:{top_moves}")
    se.quit_engine()
