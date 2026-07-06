from typing import List

class CandidateRankingAgent:
    @staticmethod
    def rank_candidates(applications: List[dict]) -> List[dict]:
        """
        Takes a list of candidate applications with a key 'ats_score' and ranks them.
        Updates the 'ranking' field dynamically.
        """
        # Sort candidates descending by ATS score
        sorted_apps = sorted(applications, key=lambda x: x.get("ats_score", 0.0), reverse=True)
        
        # Assign rankings starting from 1
        for idx, app in enumerate(sorted_apps):
            app["ranking"] = idx + 1
            
        return sorted_apps
