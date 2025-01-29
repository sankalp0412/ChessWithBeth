from fastapi import APIRouter
from app.api.models.start_game import User_elo, User_move
from app.game import game_init, gameplay

router = APIRouter()

@router.get("/")
async def read_root():
    return {"message": "Welcome to Chess With Beth!"}

@router.post("/start_game")
async def start_game(user_elo: User_elo):
    response = game_init.initialize_game(user_elo.user_elo)
    return {"message": response}

@router.post("/play-user-move")
async def play_move(user_move: User_move):
    response = gameplay.play_user_move(user_move.user_move)
    return {"message": response}