import google.generativeai as genai
import os
import warnings
from dotenv import load_dotenv

warnings.filterwarnings("ignore")  # Ignore warnings


#Load API key

load_dotenv()
api_key = os.getenv("API_KEY")
genai.configure(api_key=api_key)


def get_move_from_gemini(heard_move):
    prompt = f""" You are a chess assistant that converts natural language descriptions of chess moves into standard algebraic notation (SAN).
    Your task is to interpret the following phrase -> "{heard_move}" and provide the corresponding chess move in UCI format (e.g., "e2e4").
    Give just the chess move as the output, nothing else.

    **Examples:**
    1. Input: "Knight to C6"
       Output: "Nc6"

    2. Input: "Pawn to E4"
       Output: "e2e4"

    3. Input: "Move Bishop to B3"
       Output: "Bb3"

    4. Input: "Bishop to A6"
       Output: "Ba6"

    5. Input: "Castle Kingside"
       Output: "0-0"

    6. Input: "Queen to D7"
       Output: "Qd7"

    7. Input: "Knight F3"
       Output: "Nf3"

    8. Input: "Rook to C1"
       Output: "Rc1"

    9. Input: "Bishop to F5"
       Output: "Bf5"

    10. Input: "Bob to B3"
        Output: "Bb3" (Note: "Bob" is an informal reference for Bishop)
        
    11. Input: "Castle Queenside"
        Output: "0-0-0
        
    12. Input: "Put the Knight on B5"
        Output: "Nb5" (Note: Informal reference for Knight)


    13. Input: "Cat C4"
        Output: "c4" (Note: Informal reference to the C pawn (c for Cat)
    """
    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)
    return response.text.strip()


if __name__ == "__main__":
    heard_move = "Knight to C6"
    move = get_move_from_gemini(heard_move)
    print("Interpreted move:", move)