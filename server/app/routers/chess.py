from fastapi import APIRouter, Request, Depends, HTTPException
from app.models.chess_models import MoveInput
from app.services.chess_service import (
    ChessGame,
    create_and_get_new_chess_game,
    ChessServiceError,
)
from app.utils.voice_to_move_llm import voice_to_move
from app.services.redis.redis_setup import (
    get_redis_client,
)
from app.services.redis.redis_services import (
    redis_get_game_data_by_id,
    redis_create_new_game_id,
    redis_set_game_by_id,
    RedisServiceError,
    redis_delete_game_by_id,
)

from app.utils.error_handling import log_error, log_success, ChessGameError, log_debug

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

        stockfish_move, stockfish_move_san, is_game_over = game.get_engine_move()

        if not stockfish_move or not stockfish_move_san:
            return {
                "message": "Game Over after user Move",
                "user_move": move_input.move,
                "stockfish_move": None,
                "stockfish_san": None,
                "board_fen": game.get_fen(),
                "game_id": game.game_id,
                "is_game_over": True,
                "winner": "User",
            }

        if is_game_over:
            # Game over after engine move
            return {
                "message": "Game Over after Engine Move",
                "user_move": move_input.move,
                "stockfish_move": stockfish_move,
                "stockfish_san": stockfish_move_san,
                "board_fen": game.get_fen(),
                "game_id": game.game_id,
                "is_game_over": True,
                "winner": "Computer",
            }

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
            "is_game_over": False,
        }
    except RedisServiceError as e:
        log_error(f"Redis operation failed:{str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as v:
        raise HTTPException(status_code=400, detail=f"Invalid or illegal move {v}")


@chess_router.post("/end_game/")
def end_game(request: Request, game_id: str):
    """Ends the game and stops the engine."""

    try:
        redis_client = request.app.state.redis_client
        if not redis_client:
            log_error("Redis Connection Failed")
            raise HTTPException(status_code=500, detail="Redis Connection Failed")

        game_data = redis_get_game_data_by_id(
            game_id=game_id, redis_client=redis_client
        )

        log_success(
            f"Game data from redis before playing user_move for id {game_id}: {game_data} "
        )
        # reconstruct game instance using the game_data
        game = ChessGame.from_dict(game_data)
        log_success(f"Game after recreation:{game}")

        game.quit_engine()

        # delete game from redis
        message = redis_delete_game_by_id(game_id=game_id, redis_client=redis_client)
        return {"message": message}

    except RedisServiceError as re:
        raise HTTPException(status_code=500, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ending game:{e}")


@chess_router.post("/undo_move/")
def undo_move(request: Request, game_id: str):
    """Undo the last move."""
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

        fen_after_undo = game.undo_move()

        # Now also update redis

        redis_set_game_by_id(
            game_id=game_id, redis_client=redis_client, data=game.to_dict()
        )
        log_success(f"Game state updated in redis after takeback")

        return {
            "message": "Move undone",
            "board_fen_after_undo": fen_after_undo,
            "game_id": game_id,
        }
    except RedisServiceError as re:
        log_error(f"Redis operation failed: {str(re)}")
        raise HTTPException(status_code=500, detail=str(re))
    except ChessServiceError as c:
        log_error(f"Chess service error: {str(c)}")
        raise HTTPException(status_code=500, detail=str(c))


@chess_router.post("/voice_to_move_san/")
def voice_to_move_san(user_input: str, request: Request, game_id: str):
    """Converts voice input to move in SAN format using LLM."""

    response = voice_to_move(user_input)
    return {"message": response.strip()}
