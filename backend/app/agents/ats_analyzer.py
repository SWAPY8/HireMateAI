import json
from app.core.ai import query_gemini

class ATSAnalyzer:
    @staticmethod
    def analyze(resume_skills: str, jd_requirements: str, api_key: str = None) -> dict:
        if not resume_skills or not jd_requirements:
            return {
                "score": 50.0,
                "matching_skills": [],
                "missing_skills": [],
                "feedback": "Unable to perform full analysis. Please check that both candidate skills and job requirements are specified."
            }

        prompt = f"""
        You are an expert ATS Matching Engine. Evaluate the candidate's skills against the job requirements.
        
        Candidate Skills:
        {resume_skills}
        
        Job Requirements:
        {jd_requirements}
        
        Provide the response as a JSON object with the following fields:
        1. "score": A float score between 0.0 and 100.0 indicating how well the candidate matches the requirements.
        2. "matching_skills": A list of skills from the requirements that the candidate possesses.
        3. "missing_skills": A list of skills from the requirements that the candidate is missing.
        4. "feedback": A detailed feedback summary explaining the match quality, highlighting gaps, and providing recommendations.
        
        Ensure you only return valid JSON. Do not prefix with markdown formatting.
        """
        
        raw_res = query_gemini(prompt, json_mode=True, api_key=api_key)
        fallback = {
            "score": 50.0,
            "matching_skills": [],
            "missing_skills": [],
            "feedback": "Lacks full keyword comparison results."
        }
        
        if not raw_res:
            return fallback
            
        try:
            parsed = json.loads(raw_res)
            # Ensure float score
            try:
                parsed["score"] = float(parsed.get("score", 50.0))
            except:
                parsed["score"] = 50.0
            return parsed
        except Exception:
            return fallback
