from fastapi import APIRouter
from app.api.models import start_game
from app.game import game_init

router = APIRouter()

@router.get("/")
async def read_root():
    return {"message": "Welcome to Chess With Beth!"}

@router.post("/start_game")
async def start_game(user_elo: start_game.User_elo):
    response = game_init.initialize_game(user_elo.user_elo)
    return {"message": response}
    