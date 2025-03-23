import redis
import uuid
import pickle
import json


def redis_get_game_data_by_id(game_id: str, redis_client: redis.Redis) -> dict:
    game_data = redis_client.get(name=game_id)
    return pickle.loads(game_data)


def redis_create_new_game_id(redis_client: redis.Redis) -> str:
    game_id = uuid.uuid4()
    return str(game_id)


def redis_set_game_by_id(game_id: str, redis_client: redis.Redis, data: dict):
    redis_client.set(name=game_id, value=pickle.dumps(data))
