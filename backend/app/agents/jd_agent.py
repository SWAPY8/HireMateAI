import json
from app.core.ai import query_gemini

class JobDescriptionAgent:
    @staticmethod
    def generate(title: str, department: str, requirements_summary: str, experience_level: str) -> dict:
        prompt = f"""
        You are an expert HR Recruitment Agent. Generate a professional and compelling job description listing.
        
        Job Details:
        - Title: {title}
        - Department: {department}
        - Key Skills/Keywords: {requirements_summary}
        - Experience Level: {experience_level}
        
        Provide the response as a JSON object with the following fields:
        1. "description": A detailed markdown-formatted job description including role overview, key responsibilities, requirements, and company benefits. Use Indian Rupees (₹) for any salary or benefit representation.
        2. "requirements": A clean, comma-separated string of the core technical requirements/skills (e.g. "React, FastAPI, Docker").
        
        Ensure you only return valid JSON. Do not prefix with markdown formatting like ```json.
        """
        
        raw_res = query_gemini(prompt, json_mode=True)
        if not raw_res:
            # Fallback in case of failure
            return {
                "description": f"# {title}\nDepartment: {department}\nExperience Level: {experience_level}\n\nFallback JD description.",
                "requirements": requirements_summary
            }
            
        try:
            parsed = json.loads(raw_res)
            return {
                "description": parsed.get("description", ""),
                "requirements": parsed.get("requirements", requirements_summary)
            }
        except Exception:
            return {
                "description": raw_res,
                "requirements": requirements_summary
            }
