import json
from app.core.ai import query_gemini

class HiringRecommendationAgent:
    @staticmethod
    def get_dashboard_recommendations(jobs_count: int, applications_count: int, top_candidates: list) -> list:
        fallback = [{
            "title": "ATS Match Engine Active",
            "description": "Your AI agent pipeline is running optimally. Upload resumes to match against active job listings.",
            "type": "status",
            "priority": "Low"
        }]

        prompt = f"""
        You are an AI recruiting consultant. Provide actionable, high-value hiring recommendations for the founder.
        
        Recruiting Funnel Metrics:
        - Open job listings count: {jobs_count}
        - Total applicant volume: {applications_count}
        - Top-performing candidates list (name, job, ATS match score): {json.dumps(top_candidates)}
        
        Provide the response as a JSON array of recommendation objects. Each object must have these fields:
        - "title": A short action-oriented heading (e.g. "Schedule Interview with John").
        - "description": A details summary paragraph explaining why this action is recommended (e.g. "John scored 92% on React/FastAPI. Screen him before competitors do.").
        - "type": category ("candidate", "pipeline", "action", "status")
        - "priority": Level ("High", "Medium", "Low")
        
        Ensure you only return valid JSON. Do not prefix with markdown formatting.
        """
        
        try:
            raw_res = query_gemini(prompt, json_mode=True)
        except Exception:
            return fallback
            
        if not raw_res:
            return fallback
            
        try:
            parsed = json.loads(raw_res)
            if isinstance(parsed, list):
                return parsed
            elif isinstance(parsed, dict) and "recommendations" in parsed:
                return parsed["recommendations"]
            return fallback
        except Exception:
            return fallback
