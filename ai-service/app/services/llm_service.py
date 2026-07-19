import requests
import logging
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)

def generate_answer(prompt: str) -> str:
    """
    Sends a stateless prompt to the Groq API and returns the generated answer.
    """
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "stream": False
    }
    
    try:
        logger.info(f"Sending prompt to Groq ({settings.GROQ_MODEL})")
        response = requests.post(url, headers=headers, json=payload, timeout=30.0)
        response.raise_for_status()
        
        data = response.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        
    except requests.exceptions.Timeout:
        logger.error("Groq service timed out.")
        raise HTTPException(status_code=504, detail="LLM service Gateway Timeout")
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to communicate with Groq: {e}")
        raise HTTPException(status_code=502, detail="LLM service Bad Gateway")
