import speech_recognition as sr
from .gemini import get_move_from_gemini


class InputUserVoice:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()

    def _hear_move(self):
        with self.microphone as source:
            print("Listening for your move...")
            audio = self.recognizer.listen(source)

        try:
            text = self.recognizer.recognize_google(audio)
            print(f"You said: {text}")
            if text and text.lower() == 'exit' or text.lower() == 'undo':
                return text.lower()
            move = get_move_from_gemini(text)
            print(f"Interpreted move: {move}")
            return move
        except sr.UnknownValueError:
            print("Sorry, I could not understand the audio.")
            return None
        except sr.RequestError as e:
            print(f"Could not request results from Google Speech Recognition service; {e}")
            return None

    def confirm_move(self):
        print("Do you want to proceed with this move? (yes/no): ")
        with self.microphone as source:
            print("Listening for confirmation...")
            audio = self.recognizer.listen(source)
        try:
            text = self.recognizer.recognize_google(audio)
            print(f"You said: {text}")
        except sr.UnknownValueError:
            print("Sorry, I could not understand the audio.")
            text = None
        except sr.RequestError as e:
            print(f"Could not request results from Google Speech Recognition service; {e}")
            text = None
        return text.lower() == 'yes'

    def is_legal_move(self, board, move):
        try:
            uci_move = board.parse_san(move)
            return uci_move in board.legal_moves
        except ValueError:
            return False

    def input_move(self, board):
        while True:
            move = self._hear_move()
            if move == 'exit' or move == 'undo':
                return move
            elif move and self.is_legal_move(board, move):
                if self.confirm_move():
                    return move
                else:
                    print("Move not confirmed. Please try again.")
            else:
                print("Invalid move. Please try again.")
