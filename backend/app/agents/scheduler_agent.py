from datetime import datetime, timedelta, timezone
import random

class InterviewSchedulerAgent:
    @staticmethod
    def suggest_slots() -> list:
        # Generates a list of suggested time slots over the next few working days
        slots = []
        now = datetime.now(timezone.utc)
        
        # Next 3 days
        for i in range(1, 4):
            target_date = now + timedelta(days=i)
            # Skip weekends
            if target_date.weekday() >= 5:
                continue
            
            # Suggest 10:00 AM and 2:00 PM for each day
            slot1 = target_date.replace(hour=10, minute=0, second=0, microsecond=0)
            slot2 = target_date.replace(hour=14, minute=0, second=0, microsecond=0)
            
            slots.append(slot1.strftime("%Y-%m-%d %I:%M %p UTC"))
            slots.append(slot2.strftime("%Y-%m-%d %I:%M %p UTC"))
            
        return slots

    @staticmethod
    def generate_meeting_details(location_type: str) -> str:
        if location_type.lower() == "online":
            meeting_id = "".join(random.choices("abcdefghijklmnopqrstuvwxyz", k=9))
            meeting_link = f"https://meet.hiremate.ai/{meeting_id[:3]}-{meeting_id[3:6]}-{meeting_id[6:]}"
            return f"Virtual Google Meet Link: {meeting_link}"
        else:
            return "Headquarters: Suite 400, 100 Innovation Way, San Francisco, CA"
