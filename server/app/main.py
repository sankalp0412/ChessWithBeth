from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.chess import chess_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(chess_router, prefix="/api")
app.current_game = None