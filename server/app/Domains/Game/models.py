from pydantic import BaseModel


class MoveInput(BaseModel):
    move: str  # User move in UCI notation (e.g., "e2e4")


class EngineMoveResult(BaseModel):
    engine_move: str | None
    move_san: str | None
    is_game_over: bool | None
