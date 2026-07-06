import json
from app.core.ai import query_gemini

class FeedbackAnalyzer:
    @staticmethod
    def analyze_feedback(notes: str) -> dict:
        if not notes or len(notes.strip()) < 5:
            return {
                "recommendation": "Borderline",
                "score": 50,
                "summary": "Insufficient interview notes provided. Schedule an additional screening round to gather more candidate data."
            }

        prompt = f"""
        You are an expert Interview Performance Evaluator. Evaluate the candidate based on these interview notes.
        
        Interview Evaluation Notes:
        {notes}
        
        Provide the response as a JSON object with the following fields:
        1. "recommendation": A string representation of the fit ("Strong Hire", "Hire", "Borderline", "No Hire").
        2. "score": An integer score between 0 and 100 representing their technical and behavioral performance match.
        3. "summary": A detailed summary explaining the rationale, highlights of strengths, and gaps to note.
        
        Ensure you only return valid JSON. Do not prefix with markdown formatting.
        """
        
        raw_res = query_gemini(prompt, json_mode=True)
        fallback = {
            "recommendation": "Borderline",
            "score": 50,
            "summary": "Mixed reviews based on preliminary notes review."
        }
        
        if not raw_res:
            return fallback
            
        try:
            parsed = json.loads(raw_res)
            try:
                parsed["score"] = int(parsed.get("score", 50))
            except:
                parsed["score"] = 50
            return parsed
        except Exception:
            return fallback
