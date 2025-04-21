from app.utils.error_handling import log_debug, log_success, log_error, ChessGameError
import asyncio
from app.services.mongodb.models.mongo_models import Game
from fastapi import HTTPException
from pymongo import InsertOne, DeleteOne, ReplaceOne
from motor.motor_asyncio import AsyncIOMotorClient
from app.services.mongodb.mongo_setup import get_mongo_client
from datetime import datetime

db_name = "chess-with-beth"


class MongoServiceError(ChessGameError):
    """Exceptions for Mongo Services"""

    pass


async def mongo_create_game(mongo_client: AsyncIOMotorClient, data: Game):
    try:
        insert_data = data.model_dump(by_alias=True)

        if insert_data.get("_id") is None:
            insert_data.pop("_id", None)

        if "game_id" not in insert_data:
            raise MongoServiceError(
                "Missing required field: 'game_id' must be present in the data"
            )
        db = mongo_client[db_name]
        collection = db["games"]
        result = await collection.insert_one(insert_data)
        return result
    except Exception as e:
        log_error(f"Error Creating game in MongoDB: {e}")
        raise MongoServiceError(
            f"Failed to create game for game_id: {data.game_id} : {e}"
        )


async def mongo_update_game_by_game_id(
    game_id: str, mongo_client: AsyncIOMotorClient, update_data: Game
):
    try:
        if not update_data:
            raise MongoServiceError("Update data cannot be empty")

        db = mongo_client[db_name]
        collection = db["games"]

        result = await collection.update_one(
            {"game_id": game_id},
            {
                "$set": (
                    update_data.model_dump(by_alias=True)
                    if isinstance(update_data, Game)
                    else update_data
                )
            },
        )

        if result.matched_count == 0:
            raise MongoServiceError(f"No game found with game_id: {game_id}")

        log_success(f"Updated game with game_id: {game_id}")
        return result
    except Exception as e:
        log_error(f"Error updating game with game_id: {game_id}: {e}")
        raise MongoServiceError(f"Error updating game with game_id: {game_id}: {e}")


async def mongo_delete_game_by_game_id(game_id: str, mongo_client: AsyncIOMotorClient):
    try:
        db = mongo_client[db_name]
        collection = db["games"]

        result = await collection.delete_one({"game_id": game_id})

        log_success(f"Deleted game with game_id from Mongo: {game_id}")
        return result
    except Exception as e:
        log_error(f"Error while delete game with game_id : {game_id}")
        raise MongoServiceError(f"Error while delete game with game_id : {game_id}")
