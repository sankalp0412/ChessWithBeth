import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from app.utils.error_handling import log_debug, log_success, log_error
from fastapi import HTTPException
import urllib.parse
import asyncio
from pymongo.server_api import ServerApi

load_dotenv()


async def get_mongo_client():
    try:
        username = urllib.parse.quote_plus(os.getenv("MONGO_DB_USERNAME", None))
        password = urllib.parse.quote_plus(os.getenv("MONGO_DB_PASSWORD", None))

        if not username or not password:
            raise HTTPException(
                f"Mongo db Username and Password not present in env file"
            )

        host = os.getenv("MONGO_DB_HOST", "127.0.0.1")
        uri = f"mongodb+srv://{username}:{password}@{host}?retryWrites=true&w=majority&appName=Cluster-SD"

        mongo_client = AsyncIOMotorClient(
            uri, server_api=ServerApi("1"), tlsAllowInvalidCertificates=True
        )
        return mongo_client
    except Exception as e:
        log_error(f"Error while connecting to mongo db:{e}")
        raise HTTPException(f"Error while connecting to mongo client: {e}")
