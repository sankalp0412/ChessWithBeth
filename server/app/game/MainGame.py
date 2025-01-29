import chess
import chess.engine
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from stockfish import Stockfish
import random

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class ChessGame:
    """Handles the game state and Stockfish engine."""
    def __init__(self):
        self.stockfish_engine = Stockfish(path='/opt/homebrew/opt/stockfish/bin/stockfish', depth=15)
        self.stockfish_engine.update_engine_parameters({"Hash": 2048, "UCI_Chess960": "true"})
        self.board = chess.Board()
        
    def setup_stockfish_elo(self, user_elo: int):
        """Sets the Stockfish engine's ELO rating."""
        self.stockfish_engine.set_elo_rating(user_elo)
        
    def reset(self):
        """Resets the game."""
        self.board = chess.Board()
    
    def make_user_move(self, move: str):
        """Applies the user's move."""
        chess_move = chess.Move.from_uci(move)
        if chess_move in self.board.legal_moves:
            print("chess_move", chess_move)
            self.board.push(chess_move)
            #Also make move in stockfish
            self.stockfish_engine.make_moves_from_current_position([chess_move])
            # return self.stockfish_engine.get_board_visual()
        else:
            raise ValueError("Illegal move")
    
    def convert_to_uci(board, move_notation):
        """Convert algebraic notation to UCI format using python-chess."""
        try:
            move = board.parse_san(move_notation)
            return move.uci()
        except ValueError:
            return None
        
    def get_engine_move(self):
        """Gets Stockfish's best move and applies it."""
        if self.board.is_game_over():
            return None
        candidate_moves = [move["Move"] for move in self.stockfish_engine.get_top_moves(3)]
        print("candidate_moves", candidate_moves)
        result = random.choice(candidate_moves)
        #Make move in stockfish
        self.stockfish_engine.make_moves_from_current_position([result])
        #Make move in board



        move = chess.Move.from_uci(result)
        # print("move", move)
        self.board.push(move) #this is error
        # print(self.stockfish_engine.get_board_visual())
        return move.uci()

    def get_fen(self):
        """Returns the board state in FEN notation."""
        return self.board.fen()

    def is_game_over(self):
        """Checks if the game is over."""
        return self.board.is_game_over()

    def quit_engine(self):
        """Stops the Stockfish engine."""
        self.stockfish_engine.set_position([])
        self.reset()

# Dependency Injection to provide a game instance
def get_chess_game():
    return ChessGame()

class MoveInput(BaseModel):
    move: str  # User move in UCI notation (e.g., "e2e4")

@app.post("/start_game/")
def start_new_game(game: ChessGame = Depends(get_chess_game), user_elo: int = 1200):
    """Start a new chess game."""
    game.reset()
    game.setup_stockfish_elo(user_elo)
    return {"message": "New game started", "board_fen": game.get_fen(), "StockFish_Elo": game.stockfish_engine.get_parameters()["UCI_Elo"]}

@app.post("/play_move/")
def play_user_move(move_input: MoveInput, game: ChessGame = Depends(get_chess_game)):
    """Handles user move and gets Stockfish's response."""
    try:
        game.make_user_move(move_input.move)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid or illegal move")

    if game.is_game_over():
        return {"message": "Game over!", "result": game.board.result()}

    stockfish_move = game.get_engine_move()
    
    return {
        "message": "Move played",
        "user_move": move_input.move,
        "stockfish_move": stockfish_move,
        "board_fen": game.get_fen()
    }

@app.post("/end_game/")
def end_game(game: ChessGame = Depends(get_chess_game)):
    """Ends the game and stops the engine."""
    game.quit_engine()
    return {"message": "Game ended."}


if __name__ == "__main__":
    game = ChessGame()
    game.setup_stockfish_elo(1200)
    game.make_user_move(move ="e2e4")
    res = game.get_engine_move()
    print(res)
    game.quit_engine()
