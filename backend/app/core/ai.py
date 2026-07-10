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

def query_groq(prompt: str, json_mode: bool = False, max_retries: int = 3) -> str:
    """
    Sends a request to the Groq API.
    Uses direct REST API endpoints via urllib to support clean Python 3.13 deployments.
    """
    api_key = settings.GROQ_API_KEY.strip('\"\' ')
    if not api_key:
        raise ValueError("Groq API key is not configured.")

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    data_bytes = json.dumps(payload).encode("utf-8")
    ssl_context = ssl._create_unverified_context()
    last_error = ""

    for attempt in range(1, max_retries + 1):
        start_time = time.time()
        try:
            req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
            with urllib.request.urlopen(req, context=ssl_context, timeout=30) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                choices = res_data.get("choices", [])
                if not choices:
                    raise ValueError("No response choices returned from Groq.")
                
                text_out = choices[0].get("message", {}).get("content", "")
                duration = time.time() - start_time
                logger.info(f"[Groq Core] Successful request using model {settings.GROQ_MODEL}. Response time: {duration:.2f}s")
                return text_out.strip()
        except urllib.error.HTTPError as he:
            status_code = he.code
            err_msg = he.read().decode("utf-8", errors="ignore")
            duration = time.time() - start_time
            logger.error(
                f"[Groq Core] HTTP Error {status_code} (Attempt {attempt}/{max_retries}) [Time: {duration:.2f}s]: {err_msg}"
            )
            last_error = f"HTTP Error {status_code}: {err_msg}"
            if status_code in [500, 502, 503]:
                time.sleep(2.0 * attempt)
                continue
            time.sleep(1.5 * attempt)
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"[Groq Core] Request Exception (Attempt {attempt}/{max_retries}) [Time: {duration:.2f}s]: {str(e)}"
            )
            last_error = str(e)
            time.sleep(1.5 * attempt)

    raise ValueError(f"Groq API call failed after {max_retries} attempts. Last error: {last_error}")

def _execute_gemini_query(prompt: str, json_mode: bool = False, model: str = "gemini-1.5-flash", max_retries: int = 3, api_key: Optional[str] = None) -> str:
    """
    Underlying query executor for Google Gemini endpoints.
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
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
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
    last_error = "No requests made yet."

    for key_idx, current_key in enumerate(keys_to_try):
        key_label = "primary" if key_idx == 0 else "backup"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={current_key}"
        
        logger.info(f"[Gemini Core] Attempting API call using {key_label} API key.")
        
        for attempt in range(1, max_retries + 1):
            start_time = time.time()
            try:
                req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")
                with urllib.request.urlopen(req, context=ssl_context, timeout=30) as response:
                    res_data = json.loads(response.read().decode("utf-8"))
                    
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
                
                if status_code == 429:
                    logger.warning(f"[Gemini Core] Quota exceeded on {key_label} API key. Failing over.")
                    break
                
                if status_code in [500, 502, 503]:
                    backoff_sec = 2.0 * attempt
                    logger.info(f"[Gemini Core] Sleeping for {backoff_sec}s (exponential backoff) before retry...")
                    time.sleep(backoff_sec)
                    continue
                
                time.sleep(1.5 * attempt)
                
            except urllib.error.URLError as ue:
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

    raise ValueError(f"Gemini API call failed after exhaustion of all keys. Last error: {last_error}")

def query_gemini(prompt: str, json_mode: bool = False, model: str = "gemini-1.5-flash", max_retries: int = 3, api_key: Optional[str] = None) -> str:
    """
    Sends a request to the configured AI API.
    Routes between Gemini and Groq based on configuration and implements fallback mechanics.
    """
    primary_provider = settings.PRIMARY_AI_PROVIDER.lower().strip()
    
    # Route to Groq first if it's primary and Groq API key is present
    if primary_provider == "groq" and settings.GROQ_API_KEY.strip('\"\' '):
        try:
            return query_groq(prompt, json_mode, max_retries)
        except Exception as e:
            logger.warning(f"[AI Routing] Primary Groq engine failed: {str(e)}. Falling back to Gemini...")
            # If Groq fails, fall back to executing the Gemini logic below
    
    # Execute Gemini Logic
    try:
        return _execute_gemini_query(prompt, json_mode, model, max_retries, api_key)
    except Exception as gemini_err:
        # If Gemini is primary but failed, try Groq fallback if configured
        if primary_provider != "groq" and settings.GROQ_API_KEY.strip('\"\' '):
            try:
                logger.warning(f"[AI Routing] Gemini engine failed. Attempting fallback to Groq...")
                return query_groq(prompt, json_mode, max_retries)
            except Exception as groq_err:
                logger.error(f"[AI Routing] Groq fallback failed as well: {str(groq_err)}")
                raise HTTPException(
                    status_code=503,
                    detail=f"All configured AI engines (Gemini and Groq fallback) failed. Gemini error: {str(gemini_err)} | Groq error: {str(groq_err)}"
                )
        
        # If no Groq fallback available or we already tried it, re-raise
        if isinstance(gemini_err, HTTPException):
            raise gemini_err
        raise HTTPException(status_code=503, detail=str(gemini_err))
