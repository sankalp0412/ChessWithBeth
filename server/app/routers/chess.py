from fastapi import APIRouter, Request, Depends, HTTPException
from app.models.chess_models import MoveInput
from app.services.chess_service import ChessGame, get_chess_game
from app.utils.voice_to_move_llm import voice_to_move

chess_router = APIRouter()

@chess_router.post("/start_game/")
def start_new_game(request: Request, user_elo: int = 1200, game: ChessGame = Depends(get_chess_game)):
    """Start a new chess game."""
    game.reset()
    print(f"User ELO: {user_elo}")
    game.setup_stockfish_elo(user_elo)
    return {"message": "New game started", "board_fen": game.get_fen(), "StockFish_Elo": game.stockfish_engine.get_parameters()["UCI_Elo"]}

@chess_router.post("/play_move/")
def play_user_move(move_input: MoveInput, request: Request, game: ChessGame = Depends(get_chess_game)):
    """Handles user move and gets Stockfish's response."""
    try:
        game.make_user_move(move_input.move)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid or illegal move")

    if game.is_game_over():
        return {"message": "Game over!", "result": game.board.result()}

    stockfish_move,stockfish_move_san = game.get_engine_move()
    
    return {
        "message": "Move played",
        "user_move": move_input.move,
        "stockfish_move": stockfish_move,
        "stockfish_san": stockfish_move_san,
        "board_fen": game.get_fen(),
    }

@chess_router.post("/end_game/")
def end_game(request: Request, game: ChessGame = Depends(get_chess_game)):
    """Ends the game and stops the engine."""
    game.quit_engine()
    request.app.current_game = None  # Reset the game state
    return {"message": "Game ended."}


@chess_router.post("/undo_move/")
def undo_move(request: Request, game: ChessGame = Depends(get_chess_game)):
    """Undo the last move."""
    fen_after_undo = game.undo_move()
    return {"message": "Move undone", "board_fen_after_undo": fen_after_undo}


@chess_router.post("/voice_to_move_san/")
def voice_to_move_san(user_input:str,request: Request, game: ChessGame = Depends(get_chess_game)):
    """Converts voice input to move in SAN format using LLM."""
    print("User Input:",user_input)
    response = voice_to_move(user_input)
    return {"message": response}
