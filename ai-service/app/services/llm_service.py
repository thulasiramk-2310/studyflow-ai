import requests
import logging
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)

def generate_answer(prompt: str) -> str:
    """
    Sends a stateless prompt to the local Ollama instance and returns the generated answer.
    Raises HTTPException (504) if the LLM service hangs or fails.
    """
    url = f"{settings.OLLAMA_URL}/api/generate"
    payload = {
        "model": settings.OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False
    }
    
    try:
        # 120 second timeout to prevent hanging forever
        logger.info(f"Sending prompt to Ollama ({settings.OLLAMA_MODEL})")
        response = requests.post(url, json=payload, timeout=120.0)
        response.raise_for_status()
        
        data = response.json()
        return data.get("response", "").strip()
        
    except requests.exceptions.Timeout:
        logger.error("Ollama service timed out.")
        raise HTTPException(status_code=504, detail="LLM service Gateway Timeout")
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to communicate with Ollama: {e}")
        raise HTTPException(status_code=502, detail="LLM service Bad Gateway")
