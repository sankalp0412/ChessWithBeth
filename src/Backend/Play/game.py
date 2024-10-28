from stockfish import Stockfish, StockfishException
import chess
import chess.engine
from .inputMove import InputUserVoice

stockfish_path = '/opt/homebrew/opt/stockfish/bin/stockfish'
stockfish = Stockfish(path='/opt/homebrew/opt/stockfish/bin/stockfish', depth=15)
stockfish.update_engine_parameters({"Hash": 2048, "UCI_Chess960": "true"})


def convert_to_uci(board, move_notation):
    """Convert algebraic notation to UCI format using python-chess."""
    try:
        move = board.parse_san(move_notation)
        return move.uci()
    except ValueError:
        return None


def begin_game():
    board = chess.Board()
    with chess.engine.SimpleEngine.popen_uci(stockfish_path) as engine:
        while not board.is_game_over():
            print(board)
            #undo previous move
            if board.turn == chess.WHITE:
                print("Your move (in UCI format, e.g., 'e2e4')")
                print("To exit, say 'Exit':")
                try:
                    last_move = board.peek()
                    print(f'Previous Move -> {last_move}')
                    print("To Undo previous move, say 'Undo':")
                except IndexError:
                    pass
                #here we will use the voice functionality#######
                # instead of input() we will call the function that will take the voice
                # that function will take the input as a board pos.
                # user_move = input()
                user_move = InputUserVoice().input_move(board)
                if user_move.lower() == 'undo':
                    try:
                        last_move = board.peek()
                        print(f'{last_move} Undo Complete')
                        board.pop()  # will undo computers move
                        board.pop()  # will undo users move
                        continue
                    except IndexError:
                        print("Invalid, No Move available to Undo")
                        continue
                elif user_move.lower() == 'exit':
                    break

                uci_move = convert_to_uci(board, user_move)
                if uci_move:
                    move = chess.Move.from_uci(uci_move)
                else:
                    try:
                        move = chess.Move.from_uci(user_move)
                    except:
                        print("Invalid format. Try again.")
                        continue

                if move in board.legal_moves:
                    print(f'Playing move: {move}')
                    board.push(move)
                else:
                    print("Invalid move. Try again.")
                    continue
            #computers turn
            else:
                engine_move = engine.play(board, chess.engine.Limit(time=2.0))
                board.push(engine_move.move)
                print("Play move:", engine_move.move.uci())
        print("Game over")



