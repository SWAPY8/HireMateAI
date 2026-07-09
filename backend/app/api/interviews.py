from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
import logging
import json

logger = logging.getLogger("app.interviews")

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Interview, Application, Notification, Job
from app.models.schemas import InterviewCreate, InterviewOut, InterviewUpdate, AIQuestionGenerateRequest, MockInterviewStartRequest, MockInterviewEvaluateRequest, MockInterviewChatRequest


from app.agents.interview_agent import InterviewQuestionGenerator
from app.agents.scheduler_agent import InterviewSchedulerAgent
from app.agents.feedback_agent import FeedbackAnalyzer

router = APIRouter(prefix="/interviews", tags=["interviews"])

@router.get("", response_model=List[InterviewOut])
def get_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "founder":
        # Find all interviews for jobs owned by this founder
        return db.query(Interview).join(Application, Interview.application_id == Application.id).join(Job, Application.job_id == Job.id).filter(
            Job.founder_id == current_user.id
        ).all()
    elif current_user.role == "candidate":
        # Find interviews for applications submitted by this candidate
        return db.query(Interview).join(Application, Interview.application_id == Application.id).filter(
            Application.candidate_id == current_user.profile.id
        ).all()

    return []

@router.post("", response_model=InterviewOut)
def schedule_interview(
    int_in: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Only founders can schedule interviews.")
        
    app = db.query(Application).filter(Application.id == int_in.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Generate meeting link / address
    meeting_details = InterviewSchedulerAgent.generate_meeting_details(int_in.location_type)
    
    # Pre-generate some questions based on job description & candidate skills
    # Wrapped in try/except so interview scheduling succeeds even if AI is unavailable
    try:
        generated_qs = InterviewQuestionGenerator.generate(
            job_title=app.job.title,
            candidate_skills=app.candidate.skills if app.candidate.skills else "Python, React",
            experience_level=app.job.type if app.job.type else "Mid Level"
        )
    except Exception:
        generated_qs = {
            "technical": ["Describe your most relevant technical project and the challenges you solved."],
            "behavioral": ["Tell me about a time you worked under pressure to meet a deadline."],
            "cultural": ["What kind of team culture helps you do your best work?"]
        }
    
    formatted_qs = "\n\n".join([
        "### Technical Questions:\n" + "\n".join(f"- {q}" for q in generated_qs["technical"]),
        "### Behavioral Questions:\n" + "\n".join(f"- {q}" for q in generated_qs["behavioral"]),
        "### Cultural Questions:\n" + "\n".join(f"- {q}" for q in generated_qs["cultural"])
    ])
    
    # Update application status to Interviewing
    app.status = "Interviewing"
    app.interview_questions = formatted_qs
    
    db_int = Interview(
        application_id=int_in.application_id,
        date_time=int_in.date_time,
        location_type=int_in.location_type,
        details=f"{int_in.details or ''}\n\n{meeting_details}".strip(),
        questions=formatted_qs,
        status="Scheduled"
    )
    db.add(db_int)
    db.commit()
    db.refresh(db_int)
    
    # Notify candidate
    cand_notif = Notification(
        user_id=app.candidate.user.id,
        message=f"An interview has been scheduled for {app.job.title} on {int_in.date_time.strftime('%Y-%m-%d %I:%M %p')}. Detail: {meeting_details}."
    )
    db.add(cand_notif)
    db.commit()
    
    return db_int

@router.post("/generate-questions")
def generate_questions(
    req: AIQuestionGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Only founders can generate interview questions.")
    return InterviewQuestionGenerator.generate(
        job_title=req.job_title,
        candidate_skills=req.candidate_skills,
        experience_level=req.experience_level
    )

@router.put("/{interview_id}", response_model=InterviewOut)
def update_interview(
    interview_id: int,
    int_up: InterviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Only founders can update interview status and notes.")
        
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    if int_up.status:
        interview.status = int_up.status
        
    if int_up.feedback:
        interview.feedback = int_up.feedback
        
        # Trigger feedback analyzer agent to summarize and give feedback
        try:
            analysis = FeedbackAnalyzer.analyze_feedback(int_up.feedback)
        except Exception:
            analysis = {
                "recommendation": "Borderline",
                "score": 50,
                "summary": "AI analysis temporarily unavailable. Manual review recommended."
            }
        interview.application.feedback = f"Recommendation: {analysis['recommendation']} (Score: {analysis['score']}/100).\nSummary: {analysis['summary']}"
        
        # Automatically update candidate status based on evaluation
        if analysis['score'] >= 75:
            interview.application.status = "Selected"
        elif analysis['score'] < 40:
            interview.application.status = "Rejected"
            
    db.commit()
    db.refresh(interview)
    return interview

@router.delete("/{interview_id}")
def delete_interview(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Only founders can cancel or delete interviews.")
        
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
        
    db.delete(interview)
    db.commit()
    return {"message": "Interview deleted successfully"}

@router.post("/mock/start")
def start_mock_interview(
    req: MockInterviewStartRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == req.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    candidate = app.candidate
    if not candidate or not candidate.resume_path:
        raise HTTPException(
            status_code=400,
            detail="Please upload and analyze your resume before starting a mock interview."
        )
    skills = candidate.skills or "React, Python"
    experience = candidate.experience or "Not specified"
    education = candidate.education or "Not specified"
    job_title = app.job.title
    job_reqs = app.job.requirements or ""
    
    prompt = f"""
    You are an automated AI Interviewer. Generate 4 tailored technical and behavioral mock interview questions for {current_user.full_name}.
    Target Role: {job_title}
    Candidate Skills: {skills}
    Candidate Experience: {experience}
    Candidate Education: {education}
    Job Requirements: {job_reqs}
    
    Generate questions that specifically challenge the candidate on the skills listed in their resume and are relevant to the target role.
    
    Provide the response as a JSON object with the following fields:
    - "questions": A list of 4 strings, representing the interview questions.
    
    Ensure you only return valid JSON. Do not prefix with markdown formatting.
    """
    
    from app.core.ai import query_gemini
    from app.core.config import settings
    raw_res = query_gemini(prompt, json_mode=True, api_key=settings.CANDIDATE_AI_API_KEY)
    fallback = [
        f"Can you describe a challenging project you built using {skills.split(',')[0] if skills else 'your core skills'}?",
        f"How do you ensure code quality and handle system scaling for a {job_title} role?",
        "Describe a situation where you had to adapt to a new technology quickly.",
        "What is your debugging process when troubleshooting a silent backend query failure?"
    ]
    
    if not raw_res:
        return {"questions": fallback}
        
    try:
        parsed = json.loads(raw_res)
        return {"questions": parsed.get("questions", fallback)}
    except:
        return {"questions": fallback}

@router.post("/mock/evaluate")
def evaluate_mock_interview(
    req: MockInterviewEvaluateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == req.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    qa_list = []
    for item in req.answers:
        qa_list.append(f"Question: {item.question}\nAnswer: {item.answer}")
    qa_text = "\n\n".join(qa_list)
    
    prompt = f"""
    You are an AI Interview Performance Evaluator. Review this candidate's mock interview Q&A transcript.
    Candidate: {current_user.full_name}
    Target Role: {app.job.title}
    Skills: {app.candidate.skills or "Python, React"}
    
    Q&A Transcript:
    {qa_text}
    
    Evaluate the candidate's technical correctness, clarity of explanations, and communications capability.
    
    Provide the response as a JSON object with the following fields:
    1. "score": An integer score out of 100.
    2. "summary": A brief, constructive feedback summary highlighting strengths, areas to review, and specific tips.
    3. "recommendation": A short fit assessment ("Strong Fit", "Fit", "Borderline", "Not a Fit").
    
    Ensure you only return valid JSON. Do not prefix with markdown formatting.
    """
    
    from app.core.ai import query_gemini
    from app.core.config import settings
    raw_res = query_gemini(prompt, json_mode=True, api_key=settings.CANDIDATE_AI_API_KEY)
    fallback = {
        "score": 75,
        "summary": "Completed mock interview loop. Responses show general knowledge but could use more detail.",
        "recommendation": "Fit"
    }
    
    if not raw_res:
        return fallback
        
    try:
        parsed = json.loads(raw_res)
        try:
            parsed["score"] = int(parsed.get("score", 75))
        except:
            parsed["score"] = 75
        return parsed
    except:
        return fallback

@router.post("/mock/chat")
def mock_interview_chat_turn(
    req: MockInterviewChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Log incoming request parameters
        logger.info(f"[Mock Interview] Request from candidate {current_user.full_name} | Application ID: {req.application_id} | History length: {len(req.history)}")
        logger.info(f"[Mock Interview] Incoming request body: {req.model_dump_json() if hasattr(req, 'model_dump_json') else str(req)}")
        
        # Validate request data details
        if not req.application_id:
            raise HTTPException(status_code=400, detail="Missing application_id")

        app = db.query(Application).filter(Application.id == req.application_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")
            
        candidate = app.candidate
        if not candidate or not candidate.resume_path:
            raise HTTPException(
                status_code=400,
                detail="Please upload and analyze your resume before starting a mock interview."
            )
        skills = candidate.skills or "React, Python"
        experience = candidate.experience or "Not specified"
        education = candidate.education or "Not specified"
        projects = candidate.projects or "Not specified"
        certifications = candidate.certifications or "Not specified"
        job_title = app.job.title
        
        # Format history text
        history_lines = []
        ai_questions_count = 0
        for msg in req.history:
            sender_label = "Candidate" if msg.sender == "user" else "Interviewer"
            history_lines.append(f"{sender_label}: {msg.text}")
            if msg.sender == "ai":
                ai_questions_count += 1
                
        history_text = "\n".join(history_lines)
        
        # Prune history for chat turn prompt context to prevent token overflows
        recent_history = req.history[-6:] if len(req.history) > 6 else req.history
        recent_history_lines = []
        for msg in recent_history:
            sender_label = "Candidate" if msg.sender == "user" else "Interviewer"
            recent_history_lines.append(f"{sender_label}: {msg.text}")
        recent_history_text = "\n".join(recent_history_lines)
        
        # Collect list of questions already asked to prevent duplicate AI questions
        questions_asked = [msg.text for msg in req.history if msg.sender == "ai"]
        questions_asked_text = "\n".join([f"- {q}" for q in questions_asked]) if questions_asked else "None yet."
        
        from app.core.ai import query_gemini
        from app.core.config import settings
        
        # Decide turn logic
        # We want a total of 8 questions from the AI
        if not req.history:
            # First turn: Ask the first question
            prompt = f"""
            You are an expert technical interviewer starting a mock interview for the role '{job_title}' with candidate {current_user.full_name}.
            This is question 1 of 8.
            
            Candidate Details:
            - Skills: {skills}
            - Experience: {experience}
            - Projects: {projects}
            - Education: {education}
            
            Generate a short, practical technical or situational opening question tailored to the candidate's skills, projects, or education.
            
            Requirements:
            - Keep the question very short and concise (2-3 lines maximum).
            - Ask only ONE clear question. Do not include long descriptions or explanations.
            - Difficulty must be Simple to Medium (entry-level standard). No advanced system design or complex algorithm questions.
            - Go straight to the question. Do not include introductory text like "Sure, here is your question". Write ONLY the question.
            """
            question = query_gemini(prompt, api_key=settings.CANDIDATE_AI_API_KEY)
            if not question:
                raise HTTPException(status_code=503, detail="AI Service is currently unavailable. Please verify API key.")
            
            final_res = {
                "text": question.strip(),
                "status": "ongoing",
                "evaluation": None
            }
            logger.info(f"[Mock Interview] Final response sent to frontend: {json.dumps(final_res)}")
            return final_res
        
        elif ai_questions_count < 8:
            # Ask follow-up question
            question_num = ai_questions_count + 1
            
            if question_num <= 6:
                # Tech / Project / Education question (Simple to Medium difficulty)
                prompt = f"""
                You are an expert interviewer conducting a mock interview for the role '{job_title}' with candidate {current_user.full_name}.
                This is question {question_num} of 8.
                
                Candidate Details:
                - Skills: {skills}
                - Experience: {experience}
                - Projects: {projects}
                - Education: {education}
                
                Here is the recent conversation transcript:
                {recent_history_text}
                
                Questions already asked so far (DO NOT repeat or ask variations of these):
                {questions_asked_text}
                
                Based on their latest response and past answers, ask a relevant technical follow-up question or transition to another core tech stack item/project/education detail in their resume.
                
                Requirements:
                - Keep the question very short and concise (2-3 lines maximum).
                - Ask only ONE clear question at a time. Do not ask multiple questions or provide long descriptions.
                - Difficulty must be Simple to Medium (entry-level standard). No advanced system design or complex algorithm questions. (Focus on practical scenarios: debugging, choosing the right tech, basic API/database issues, React state, Java OOP, Spring Boot REST APIs, SQL, JS, etc.)
                - Avoid conversational fillers or introductory text. Write ONLY the question.
                """
            else:
                # HR question (7-8)
                prompt = f"""
                You are an expert interviewer conducting a mock interview for the role '{job_title}' with candidate {current_user.full_name}.
                This is question {question_num} of 8. This must be an HR / Behavioral question.
                
                Here is the recent conversation transcript:
                {recent_history_text}
                
                Questions already asked so far (DO NOT repeat or ask variations of these):
                {questions_asked_text}
                
                Based on their latest response and past answers, ask a relevant HR behavioral question (e.g. teamwork, strengths, conflict resolution, career goals, handling deadlines).
                
                Requirements:
                - Keep the question very short and concise (2-3 lines maximum).
                - Ask only ONE clear question. Do not ask multiple questions.
                - Avoid conversational fillers or introductory text. Write ONLY the question.
                """
                
            question = query_gemini(prompt, api_key=settings.CANDIDATE_AI_API_KEY)
            if not question:
                raise HTTPException(status_code=503, detail="AI Service is currently unavailable. Please verify API key.")
            
            final_res = {
                "text": question.strip(),
                "status": "ongoing",
                "evaluation": None
            }
            logger.info(f"[Mock Interview] Final response sent to frontend: {json.dumps(final_res)}")
            return final_res
            
        else:
            # Interview is complete (user has answered the 8th question)
            # Generate full evaluation report
            prompt = f"""
            You are an expert technical interviewer evaluating candidate {current_user.full_name} for the role '{job_title}'.
            
            Candidate Details:
            - Skills: {skills}
            
            Here is the full interview transcript:
            {history_text}
            
            Generate a detailed performance evaluation report of their responses.
            
            Provide the response as a JSON object with the following fields:
            1. "score": Overall score out of 100 as integer.
            2. "technical_knowledge": Rating/feedback statement on their technical competence.
            3. "communication": Rating/feedback statement on their communication capability.
            4. "confidence": Rating/feedback statement on their confidence and response style.
            5. "problem_solving": Rating/feedback statement on their logical problem-solving approach.
            6. "strengths": A list of 3 strengths.
            7. "weaknesses": A list of 2-3 weaknesses.
            8. "suggested_improvements": A list of 3 action items to improve.
            9. "recommended_resources": A list of 3-4 specific articles, books, or courses.
            10. "hiring_recommendation": Fit assessment ("Strong Hire", "Hire", "Borderline", "No Hire").
            
            Ensure you only return valid JSON. Do not prefix with markdown formatting.
            """
            
            try:
                logger.info("[Mock Interview] Requesting final evaluation report from Gemini.")
                raw_res = query_gemini(prompt, json_mode=True, api_key=settings.CANDIDATE_AI_API_KEY)
                
                if not raw_res:
                    raise ValueError("Empty response returned from Gemini evaluator.")
                    
                parsed = json.loads(raw_res)
                
                # Validate keys, fallback defaults if missing
                try:
                    parsed["score"] = int(parsed.get("score", 75))
                except:
                    parsed["score"] = 75
                    
                required_keys = ["technical_knowledge", "communication", "confidence", "problem_solving", 
                                 "strengths", "weaknesses", "suggested_improvements", "recommended_resources", 
                                 "hiring_recommendation"]
                for rk in required_keys:
                    if rk not in parsed:
                        raise KeyError(f"Missing required key in AI response: {rk}")
                        
                logger.info("[Mock Interview] AI evaluation report parsed successfully.")
                
            except Exception as eval_exc:
                logger.error(f"[Mock Interview] Evaluation generation failed: {str(eval_exc)}")
                if 'raw_res' in locals():
                    logger.debug(f"[Mock Interview] Raw AI response was: {raw_res}")
                    
                # Graceful local fallback to prevent 502/crashes
                logger.info("[Mock Interview] Generating graceful fallback interview summary.")
                parsed = {
                    "score": 72,
                    "technical_knowledge": "Demonstrated a sound understanding of core technical principles. Recommended to practice coding syntax and design patterns under constraints.",
                    "communication": "Answered questions clearly and maintained a professional conversation flow.",
                    "confidence": "Stood confident during the technical and behavioral portions.",
                    "problem_solving": "Approached programming and scenario scenarios systematically.",
                    "strengths": [
                        "Solid fundamentals in core technologies",
                        "Clear communication style",
                        "Structured approach to problem solving"
                    ],
                    "weaknesses": [
                        "Could expand more on project impact details",
                        "Scenario optimizations could be deeper"
                    ],
                    "suggested_improvements": [
                        "Use the STAR method for behavioral questions.",
                        "Review framework life-cycle and performance tuning guidelines.",
                        "Practice explaining logic while debugging."
                    ],
                    "recommended_resources": [
                        "LeetCode / HackerRank interactive practice",
                        "System Design Primer guide online",
                        "MDN Web Docs / Framework documentation references"
                    ],
                    "hiring_recommendation": "Hire"
                }
                
            # Save the evaluation to the application's feedback and change status
            app.feedback = f"Mock Interview Recommendation: {parsed.get('hiring_recommendation')} (Score: {parsed['score']}/100).\nDetails: {parsed.get('technical_knowledge')}"
            db.commit()
            
            final_res = {
                "text": "Thank you for completing the interview! Your report is ready.",
                "status": "completed",
                "evaluation": parsed
            }
            logger.info(f"[Mock Interview] Final response sent to frontend: {json.dumps(final_res)}")
            return final_res
            
    except HTTPException as he:
        raise he
    except Exception as exc:
        logger.exception(f"[Mock Interview] Unhandled exception occurred: {str(exc)}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "message": "An unexpected error occurred during the mock interview process.",
                "error": str(exc)
            }
        )
