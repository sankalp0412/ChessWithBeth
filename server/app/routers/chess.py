from fastapi import APIRouter, Request, Depends, HTTPException
from app.models.chess_models import MoveInput
from app.services.chess_service import ChessGame, create_and_get_new_chess_game
from app.utils.voice_to_move_llm import voice_to_move
from app.services.redis.redis_setup import (
    get_redis_client,
)
from app.services.redis.redis_services import (
    redis_get_game_data_by_id,
    redis_create_new_game_id,
    redis_set_game_by_id,
    RedisServiceError,
)

from app.utils.error_handling import log_error, log_success, ChessGameError

chess_router = APIRouter()

# redis_client = get_redis_client()


@chess_router.post("/start_game/")
def start_new_game(
    request: Request,
    user_elo: int = 1200,
    # game: ChessGame = Depends(get_chess_game),  # remove the depends line
):
    """Start a new chess game."""

    redis_client = request.app.state.redis_client
    if not redis_client:
        log_error("Redis Connection Failed")
        raise HTTPException(status_code=500, detail="Redis Connection Failed")

    # Create a new redis state and get the unique game id
    try:
        game_id = redis_create_new_game_id(redis_client=redis_client)
        # now we create a new ChessGame instance
        game = create_and_get_new_chess_game(game_id=game_id)

        # update elo
        game.setup_stockfish_elo(user_elo)

        # now we insert this in redis
        redis_set_game_by_id(
            game_id=game_id, redis_client=redis_client, data=game.to_dict()
        )
        # game.reset()
        return {
            "message": "New game started",
            "board_fen": game.get_fen(),
            "game_id": game_id,
            "StockFish_Elo": game.stockfish_engine.get_parameters()["UCI_Elo"],
        }

    except RedisServiceError as e:
        log_error(f"Redis operation failed:{str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        log_error(f"Failed to start game: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to start new game: {str(e)}"
        )


@chess_router.post("/play_move/")
def play_user_move(
    move_input: MoveInput,
    request: Request,
    game_id: str,
):
    """Handles user move and gets Stockfish's response."""

    try:
        redis_client = request.app.state.redis_client
        if not redis_client:
            log_error("Redis Connection Failed")
            raise HTTPException(status_code=500, detail="Redis Connection Failed")

        game_data = redis_get_game_data_by_id(
            game_id=game_id, redis_client=redis_client
        )

        log_success(f"Game data from reds for id {game_id}: {game_data} ")
        # reconstruct game instance using the game_data
        game = ChessGame.from_dict(game_data)
        log_success(f"Game after recreation:{game}")
        # make move
        game.make_user_move(move_input.move)

        if game.is_game_over():
            return {"message": "Game over!", "result": game.board.result()}

        stockfish_move, stockfish_move_san = game.get_engine_move()

        # Now update back in redis
        redis_set_game_by_id(
            game_id=game_id, redis_client=redis_client, data=game.to_dict()
        )
        log_success(f"Game state updated in redis")

        return {
            "message": "Move played",
            "user_move": move_input.move,
            "stockfish_move": stockfish_move,
            "stockfish_san": stockfish_move_san,
            "board_fen": game.get_fen(),
            "game_id": game.game_id,
        }
    except RedisServiceError as e:
        log_error(f"Redis operation failed:{str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as v:
        raise HTTPException(status_code=400, detail=f"Invalid or illegal move {v}")


# @chess_router.post("/end_game/")
# def end_game(request: Request, game: ChessGame = Depends(get_chess_game)):
#     """Ends the game and stops the engine."""
#     game.quit_engine()
#     request.app.current_game = None  # Reset the game state
#     return {"message": "Game ended."}


# @chess_router.post("/undo_move/")
# def undo_move(request: Request, game: ChessGame = Depends(get_chess_game)):
#     """Undo the last move."""
#     fen_after_undo = game.undo_move()
#     return {"message": "Move undone", "board_fen_after_undo": fen_after_undo}


# @chess_router.post("/voice_to_move_san/")
# def voice_to_move_san(
#     user_input: str, request: Request, game: ChessGame = Depends(get_chess_game)
# ):
#     """Converts voice input to move in SAN format using LLM."""
#     print("User Input:", user_input)
#     response = voice_to_move(user_input)
#     return {"message": response.strip()}
