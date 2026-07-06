import json
from app.core.ai import query_gemini

class EmailAgent:
    @staticmethod
    def generate_draft(candidate_name: str, job_title: str, status: str, additional_details: str = None) -> dict:
        prompt = f"""
        You are an automated Recruiting Communication Agent. Write a highly personalized, professional email to a candidate.
        
        Email Context:
        - Recipient: {candidate_name}
        - Job Title: {job_title}
        - Stage Status: {status}
        - Extra Details: {additional_details or "None provided"}
        
        Provide the response as a JSON object with the following fields:
        1. "subject": An engaging, professional email subject line.
        2. "body": A complete email body saluting {candidate_name}, explaining the stage status update, providing necessary context or dates (if details are given), and signing off from the HireMate Recruiting Team.
        
        Ensure you only return valid JSON. Do not prefix with markdown formatting.
        """
        
        raw_res = query_gemini(prompt, json_mode=True)
        fallback = {
            "subject": f"Update on your application for {job_title}",
            "body": f"Dear {candidate_name},\n\nYour application status is: {status}.\n\nBest regards,\nHireMate Recruiting Team"
        }
        
        if not raw_res:
            return fallback
            
        try:
            parsed = json.loads(raw_res)
            return {
                "subject": parsed.get("subject", fallback["subject"]),
                "body": parsed.get("body", fallback["body"])
            }
        except Exception:
            return fallback
