from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.chess import chess_router
from app.services.redis.redis_setup import get_redis_client
from contextlib import asynccontextmanager
from app.utils.error_handling import log_success, log_error
from app.services.engine.engine_manager import EngineManager
from app.services.mongodb.mongo_setup import get_mongo_client

# app = FastAPI()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up...")

    # Initialize Redis client as centralized state
    app.state.redis_client = get_redis_client()
    try:
        pong = app.state.redis_client.ping()
        if pong:
            log_success("Redis connected.")
    except Exception as e:
        log_error(f"Error connecting to Redis: {e}")

    # Engine Manager
    app.state.engine_manager = EngineManager()
    log_success("EngineManager initialized.")

    # Mongo client
    try:
        app.state.mongo_client = await get_mongo_client()
        mongo_client = app.state.mongo_client
        if mongo_client is not None:
            mongo_client.admin.command("ping")
        log_success("Pinged your deployment. You successfully connected to MongoDB!")
    except Exception as e:
        log_error(f"Error while connecting to mongo client:{e}")

    yield

    app.state.redis_client.close()
    app.state.engine_manager.clean_up()
    app.state.mongo_client.close()
    log_success("Redis disconnected.")
    log_success("Mongo Client closed")
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
