from pydantic import BaseModel, Field
from typing import Optional
from bson import ObjectId
from datetime import datetime
from enum import Enum


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)


class Color(str, Enum):
    white = "white"
    black = "black"
    none = "none"  # for ongoing games


class Game(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    game_id: str
    created_at: datetime = Field(default_factory=datetime.now)
    modified_at: datetime = Field(default_factory=datetime.now)
    fen: str = Field(..., description="FEN string representing board state")
    is_over: bool = False
    win_color: Color = Field(default=Color.none)
    user_elo: str | int
    user_id: str = Field(default="")

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
