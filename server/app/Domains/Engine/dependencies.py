from fastapi import Request, Depends
from app.Domains.Engine.engine_manager import EngineManager


def get_engine_manager(request: Request) -> EngineManager:
    return request.app.state.engine_manager
