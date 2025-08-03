from pydantic import BaseModel


class TopStockfishMoves(BaseModel):
    move: str
    score: str | float
