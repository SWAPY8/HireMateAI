import urllib.request
import json
import ssl
import time
import logging
from app.core.config import settings

logger = logging.getLogger("app.ai")

def query_gemini(prompt: str, json_mode: bool = False, model: str = "gemini-2.5-flash", max_retries: int = 3) -> str:
    """
    Sends a request to the Google Gemini developer API.
    Uses direct REST API endpoints via urllib to support clean Python 3.13 deployments.
    """
    api_key = settings.AI_API_KEY
    if not api_key:
        logger.error("AI_API_KEY is not configured in environment variables.")
        return ""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    
    headers = {
        "Content-Type": "application/json"
    }

    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }]
    }

    if json_mode:
        payload["generationConfig"] = {
            "responseMimeType": "application/json"
        }

    data_bytes = json.dumps(payload).encode("utf-8")
    ssl_context = ssl._create_unverified_context()

    for attempt in range(1, max_retries + 1):
        try:
            req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
            with urllib.request.urlopen(req, context=ssl_context, timeout=30) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                
                # Extract text output
                candidates = res_data.get("candidates", [])
                if not candidates:
                    raise ValueError("No response candidates returned from Gemini.")
                
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                if not parts:
                    raise ValueError("Empty response parts returned from Gemini.")
                
                text_out = parts[0].get("text", "")
                return text_out.strip()
                
        except Exception as e:
            logger.warning(f"Gemini API request failed (Attempt {attempt}/{max_retries}): {e}")
            if attempt == max_retries:
                logger.error("Max retries reached for Gemini API. Returning empty response.")
                # Return basic fallback to prevent total crashes
                return ""
            time.sleep(1.5 * attempt)  # Exponential backoff

    return ""
