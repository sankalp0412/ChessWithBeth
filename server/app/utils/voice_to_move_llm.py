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

    response = requests.post(url, headers=headers, data=json.dumps(data))

    json_response = response.json()
    print("JSON REsponse:",json_response)
    llm_move = json_response["answer"]
    return llm_move


if __name__ == "__main__": 
    print(voice_to_move("Knight to E5"))