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
)

chess_router = APIRouter()

redis_client = get_redis_client()


@chess_router.post("/start_game/")
def start_new_game(
    request: Request,
    user_elo: int = 1200,
    # game: ChessGame = Depends(get_chess_game),  # remove the depends line
):
    """Start a new chess game."""
    # Verify redis

    if not redis_client:
        raise HTTPException(status_code=500, detail="Redis Connection Failed")

    # Create a new redis state and get the unique game id

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
        "StockFish_Elo": game.stockfish_engine.get_parameters()["UCI_Elo"],
    }


# @chess_router.post("/play_move/")
# def play_user_move(
#     move_input: MoveInput,
#     request: Request,
#     game_id: str,
# ):
#     """Handles user move and gets Stockfish's response."""

#     try:
#         game.make_user_move(move_input.move)
#     except ValueError:
#         raise HTTPException(status_code=400, detail="Invalid or illegal move")

#     if game.is_game_over():
#         return {"message": "Game over!", "result": game.board.result()}

#     stockfish_move, stockfish_move_san = game.get_engine_move()

#     return {
#         "message": "Move played",
#         "user_move": move_input.move,
#         "stockfish_move": stockfish_move,
#         "stockfish_san": stockfish_move_san,
#         "board_fen": game.get_fen(),
#     }


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
