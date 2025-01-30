from pydantic import BaseModel

class MoveInput(BaseModel):
    move: str  # User move in UCI notation (e.g., "e2e4")