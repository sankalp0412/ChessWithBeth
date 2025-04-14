from typing import List
import chess
import requests
import os
import json
from dotenv import load_dotenv
from fastapi import HTTPException
from app.utils.error_handling import log_debug, log_error, ChessGameError

load_dotenv()
DIFY_API_KEY = os.getenv("DIFY_BETH_APP_KEY")


class DifyServiceError(ChessGameError):
    pass


def run_ai_analysis(top_moves: str, fen: str, turn: chess.Color) -> str:
    print(f"Top Moves: {top_moves}")
    to_play = "White" if turn else "Black"
    url = "https://api.dify.ai/v1/chat-messages"

    headers = {
        "Authorization": "Bearer " + DIFY_API_KEY,
        "Content-Type": "application/json",
    }

    data = {
        "query": "Help",
        "response_mode": "blocking",
        "user": "da2014c7-d229-461a-a162-4da16ac6b2b3",
        "inputs": {"fen_Notation": fen, "top_3_moves": top_moves, "turn": to_play},
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))

        if response.status_code != 200:
            try:
                error_info = (
                    response.json()
                )  # Try to get detailed error from the response body
                error_message = error_info.get("message", "Unknown error")
                error_code = error_info.get("code", "Unknown code")
                raise DifyServiceError(
                    f"Error from DIFY LLM API: {error_message} (Code: {error_code})",
                )
            except ValueError:
                # If the response body isn't JSON or doesn't contain error details
                raise DifyServiceError(f"Error in DIFY LLM API: {response.text}")

        json_response = response.json()
        log_debug(f"JSON Response from DIFY BETH : {json_response}")
        analysis = json_response["answer"]
        return analysis

    except requests.exceptions.RequestException as e:
        # Catch network-related issues, e.g., connection problems
        raise HTTPException(
            status_code=500, detail=f"Network error while connecting to DIFY: {str(e)}"
        )

    except Exception as e:
        # Handle any other exceptions that are not related to the request
        log_error(f"Error fetching analysis from DIFY: {str(e)}")
        raise DifyServiceError(f"Error fetching analysis from DIFY: {str(e)}")


if __name__ == "__main__":
    analysis = run_ai_analysis(
        top_moves="""[
            {"move": "c2c4", "score": 0.07},
            {"move": "c1f4", "score": 0.41},
            {"move": "b1c3", "score": 0.73},
        ]""",
        fen="r1bqkbnr/pppnpppp/8/3p4/3P4/5N2/PPP1PPPP/RNBQKB1R w KQkq - 2 3",
        turn=True,  # True for White, False for Black
    )
    print(analysis)
