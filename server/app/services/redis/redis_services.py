import redis
import uuid
import pickle
import json
from app.utils.error_handling import log_error, log_success, ChessGameError


class RedisServiceError(ChessGameError):
    """Specific exception for Redis service operations"""

    pass


def redis_create_new_game_id(redis_client: redis.Redis) -> str:
    try:
        game_id = str(uuid.uuid4())
        log_success(f"Created game ID: {game_id}")
        return game_id
    except Exception as e:
        log_error(str(e))
        raise RedisServiceError(f"Failed to create game ID: {str(e)}")


def redis_set_game_by_id(game_id: str, redis_client: redis.Redis, data: dict):
    try:
        serialized_data = pickle.dumps(data, protocol=pickle.HIGHEST_PROTOCOL)
        redis_client.set(name=game_id, value=serialized_data)
    except Exception as e:
        log_error(str(e))
        raise RedisServiceError(f"Failed to save game: {str(e)}")


def redis_get_game_data_by_id(game_id: str, redis_client: redis.Redis) -> dict:
    try:
        game_data = redis_client.get(name=game_id)
        if not game_data:
            log_error(f"Game with ID {game_id} not found")
            raise RedisServiceError(f"Game not found: {game_id}")

        try:
            if not isinstance(game_data, bytes):
                log_error(f"Deserialized data is not a dictionary: {type(data)}")
                raise RedisServiceError("Invalid game data format")

            # Add error handling for deserialization
            data = pickle.loads(game_data)
            if not isinstance(data, dict):
                raise RedisServiceError("Invalid game data format")
            return data
        except pickle.UnpicklingError as pe:
            log_error(f"Failed to deserialize game data: {str(pe)}")
            raise RedisServiceError(f"Failed to deserialize game data: {str(pe)}")

    except redis.RedisError as re:
        log_error(f"Redis operation failed: {str(re)}")
        raise RedisServiceError(f"Redis operation failed: {str(re)}")


def redis_delete_game_by_id(game_id: str, redis_client: redis.Redis) -> str:
    try:
        redis_client.delete(game_id)
        return "Game Ended"
    except redis.RedisError as re:
        log_error(f"Redis delte operation failed: {re}")
        raise RedisServiceError(f"Redis delete operation failed")
