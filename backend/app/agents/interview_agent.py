import json
from app.core.ai import query_gemini

class InterviewQuestionGenerator:
    @staticmethod
    def generate(job_title: str, candidate_skills: str, experience_level: str) -> dict:
        prompt = f"""
        You are an expert Interviewing Agent. Generate tailored, highly personalized interview questions for a candidate.
        
        Job Position:
        - Target Role: {job_title}
        - Experience Level: {experience_level}
        
        Candidate Profile:
        - Skills: {candidate_skills}
        
        Provide the response as a JSON object with the following fields:
        1. "technical": A list of 4 challenging, role-specific technical questions designed to test their experience in {candidate_skills}.
        2. "behavioral": A list of 3 behavioral questions evaluating problem solving, collaboration, and situational engineering.
        3. "cultural": A list of 2 cultural fit questions.
        
        Ensure you only return valid JSON. Do not prefix with markdown formatting.
        """
        
        raw_res = query_gemini(prompt, json_mode=True)
        fallback = {
            "technical": ["Explain your experience in scaling web backends."],
            "behavioral": ["Tell me about a technical disagreement you resolved."],
            "cultural": ["Why do you want to join our startup?"]
        }
        
        if not raw_res:
            return fallback
            
        try:
            parsed = json.loads(raw_res)
            return {
                "technical": parsed.get("technical", fallback["technical"]),
                "behavioral": parsed.get("behavioral", fallback["behavioral"]),
                "cultural": parsed.get("cultural", fallback["cultural"])
            }
        except Exception:
            return fallback
