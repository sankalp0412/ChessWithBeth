from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.chess import chess_router
from app.services.redis.redis_setup import get_redis_client
from contextlib import asynccontextmanager
from app.utils.error_handling import log_success
from app.services.engine.engine_manager import EngineManager

# app = FastAPI()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")

    # Initialize Redis client as centralized state
    app.state.redis_client = get_redis_client()
    log_success("Redis connected.")

    # Engine Manager
    app.state.engine_manager = EngineManager()
    log_success("EngineManager initialized.")

    yield

    app.state.redis_client.close()
    app.state.engine_manager.clean_up()
    log_success("Redis disconnected.")
    log_success("Engine Manager Closed, All Stockfish instances closed")


app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(chess_router, prefix="/api")
app.current_game = None
