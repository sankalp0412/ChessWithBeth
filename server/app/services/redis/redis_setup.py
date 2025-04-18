import redis
import os


def get_redis_client():
    redis_client = None  # Ensure it's always defined
    try:
        if "DOCKER" in os.environ:
            host = "redis"
        else:
            host = "localhost"
        redis_client = redis.Redis(host=host, port=6379, db=0, decode_responses=False)
        redis_client.ping()  # Check if Redis is reachable
    except Exception as e:
        print(f"Error connecting to Redis: {e}")
        redis_client = None  # Explicitly set to None in case of failure
    return redis_client


if __name__ == "__main__":
    client = get_redis_client()
    if client:
        print("Connected to Redis successfully!")
    else:
        print("Failed to connect to Redis.")
