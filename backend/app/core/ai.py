import urllib.request
import urllib.error
import json
import ssl
import time
import logging
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger("app.ai")

from typing import Optional

def query_gemini(prompt: str, json_mode: bool = False, model: str = "gemini-2.5-flash", max_retries: int = 3, api_key: Optional[str] = None) -> str:
    """
    Sends a request to the Google Gemini developer API.
    Uses direct REST API endpoints via urllib to support clean Python 3.13 deployments.
    Implements robust error handling, exponential backoff, and backup API key failover.
    """
    keys_to_try = []
    
    if api_key:
        api_key_stripped = api_key.strip('\"\'')
        if api_key_stripped:
            keys_to_try.append(api_key_stripped)
            
    if not keys_to_try:
        primary_key = settings.AI_API_KEY.strip('\"\'') if settings.AI_API_KEY else ""
        backup_key = settings.BACKUP_AI_API_KEY.strip('\"\'') if settings.BACKUP_AI_API_KEY else ""
        if primary_key:
            keys_to_try.append(primary_key)
        if backup_key:
            keys_to_try.append(backup_key)
        
    if not keys_to_try:
        logger.error("[Gemini Core] No Gemini API keys are configured in environment variables.")
        raise HTTPException(
            status_code=503,
            detail="AI Service configuration issue: No API keys configured in environment."
        )

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
    payload_size = len(data_bytes)
    token_estimate = len(prompt) // 4  # 1 token is roughly 4 characters
    logger.info(f"[Gemini Core] Request payload size: {payload_size} bytes | Estimated tokens: {token_estimate}")
    
    ssl_context = ssl._create_unverified_context()
    last_error = "No requests made yet."

    for key_idx, api_key in enumerate(keys_to_try):
        key_label = "primary" if key_idx == 0 else "backup"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        
        logger.info(f"[Gemini Core] Attempting API call using {key_label} API key.")
        
        for attempt in range(1, max_retries + 1):
            start_time = time.time()
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
                    duration = time.time() - start_time
                    logger.info(f"[Gemini Core] Successful request using {key_label} API key. Response time: {duration:.2f}s")
                    return text_out.strip()
                    
            except urllib.error.HTTPError as he:
                status_code = he.code
                err_msg = he.read().decode("utf-8", errors="ignore")
                duration = time.time() - start_time
                logger.error(
                    f"[Gemini Core] HTTP Error {status_code} on {key_label} key (Attempt {attempt}/{max_retries}) [Time: {duration:.2f}s]: {err_msg}"
                )
                last_error = f"HTTP Error {status_code}: {err_msg}"
                
                # If we get 429 (rate limit/quota), failover immediately
                if status_code == 429:
                    logger.warning(f"[Gemini Core] Quota exceeded on {key_label} API key. Failing over.")
                    break  # Break out of attempts for this key, move to backup key
                
                # Apply backoff for server errors (500, 502, 503)
                if status_code in [500, 502, 503]:
                    backoff_sec = 2.0 * attempt
                    logger.info(f"[Gemini Core] Sleeping for {backoff_sec}s (exponential backoff) before retry...")
                    time.sleep(backoff_sec)
                    continue
                
                # Other HTTP errors: standard backoff
                time.sleep(1.5 * attempt)
                
            except urllib.error.URLError as ue:
                # E.g. network timeout or connection issue
                duration = time.time() - start_time
                logger.error(
                    f"[Gemini Core] Network Error on {key_label} key (Attempt {attempt}/{max_retries}) [Time: {duration:.2f}s]: {ue.reason}"
                )
                last_error = f"Network Error: {ue.reason}"
                backoff_sec = 2.0 * attempt
                time.sleep(backoff_sec)
                
            except Exception as e:
                duration = time.time() - start_time
                logger.error(
                    f"[Gemini Core] Request Exception on {key_label} key (Attempt {attempt}/{max_retries}) [Time: {duration:.2f}s]: {str(e)}"
                )
                last_error = str(e)
                time.sleep(1.5 * attempt)

    # If all keys and retries failed
    logger.error(f"[Gemini Core] Failed to get response from Gemini. Last error: {last_error}")
    raise HTTPException(
        status_code=503,
        detail=f"AI Engine query failed on all configured channels. Details: {last_error}"
    )
