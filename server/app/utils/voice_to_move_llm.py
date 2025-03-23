import requests
import json
import os
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()
DIFY_API_KEY = os.getenv("DIFY_APP_API")

def voice_to_move(user_input):
    if user_input is None:
        raise HTTPException(status_code=400, detail="User input is required")

    """Converts voice input to move in SAN format using LLM."""
    url = "https://api.dify.ai/v1/chat-messages"

    headers = {
        'Authorization': 'Bearer ' + DIFY_API_KEY,
        'Content-Type': 'application/json',
    }

    data = {
        "query": user_input,
        "response_mode": "blocking",
        "user": "da2014c7-d229-461a-a162-4da16ac6b2b3",
        "inputs" :{
            "user_input" : "Start"
        }   
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(data))

        # If status code is not 200, try to extract error details
        if response.status_code != 200:
            try:
                error_info = response.json()  # Try to get detailed error from the response body
                error_message = error_info.get('message', 'Unknown error')
                error_code = error_info.get('code', 'Unknown code')
                raise HTTPException(status_code=response.status_code, detail=f"Error from DIFY LLM API: {error_message} (Code: {error_code})")
            except ValueError:
                # If the response body isn't JSON or doesn't contain error details
                raise HTTPException(status_code=500, detail=f"Error in DIFY LLM API: {response.text}")
        
        # If no error, proceed with the successful response
        json_response = response.json()
        print("JSON REsponse:",json_response)
        llm_move = json_response["answer"]
        return llm_move

    except requests.exceptions.RequestException as e:
        # Catch network-related issues, e.g., connection problems
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")

    except Exception as e:
        # Handle any other exceptions that are not related to the request
        raise HTTPException(status_code=500, detail=f"Error converting voice to move: {str(e)}")


if __name__ == "__main__": 
    print(voice_to_move("Knight to E5"))