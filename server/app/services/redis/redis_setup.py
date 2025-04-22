import redis
import os
from app.utils.error_handling import log_debug, log_error, log_success
from dotenv import load_dotenv

load_dotenv()


def get_redis_client():
    redis_client = None
    try:
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            log_debug("Connecting to Redis Cloud using URL")
            redis_client = redis.from_url(redis_url, decode_responses=False)
        elif "DOCKER" in os.environ:
            # Docker-compose environment
            host = "redis"
            log_debug(f"Connecting to Redis in Docker at: {host}:6379")
            redis_client = redis.Redis(
                host=host, port=6379, db=0, decode_responses=False
            )
        else:
            # Local development
            log_debug("Connecting to Redis on localhost:6379")
            redis_client = redis.Redis(
                host="localhost", port=6379, db=0, decode_responses=False
            )
        redis_client.ping()  # Check if Redis is reachable
    except Exception as e:
        log_error(f"Error connecting to Redis: {e}")
        redis_client = None  # Explicitly set to None in case of failure
    return redis_client


if __name__ == "__main__":
    rc = get_redis_client()
    print(rc)
