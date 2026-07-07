from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

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
    generated_qs = InterviewQuestionGenerator.generate(
        job_title=app.job.title,
        candidate_skills=app.candidate.skills if app.candidate.skills else "Python, React",
        experience_level=app.job.type if app.job.type else "Mid Level"
    )
    
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
        analysis = FeedbackAnalyzer.analyze_feedback(int_up.feedback)
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
    raw_res = query_gemini(prompt, json_mode=True)
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
    raw_res = query_gemini(prompt, json_mode=True)
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
    
    from app.core.ai import query_gemini
    
    # Decide turn logic
    # We want a total of 4 questions from the AI
    if not req.history:
        # First turn: Ask the first question
        prompt = f"""
        You are an expert technical interviewer. Start a mock interview for the role '{job_title}' with candidate {current_user.full_name}.
        
        Candidate Details:
        - Skills: {skills}
        - Experience: {experience}
        - Projects: {projects}
        - Education: {education}
        - Certifications: {certifications}
        
        Generate the first technical or situational interview question tailored to their skills and projects. 
        Keep your response brief and go straight to the question. Do not include introductory text like "Sure, here is your question".
        """
        question = query_gemini(prompt)
        if not question:
            raise HTTPException(status_code=503, detail="AI Service is currently unavailable. Please verify API key.")
        return {
            "text": question.strip(),
            "status": "ongoing",
            "evaluation": None
        }
    
    elif ai_questions_count < 4:
        # Ask follow-up question
        prompt = f"""
        You are an expert technical interviewer conducting a mock interview for the role '{job_title}' with candidate {current_user.full_name}.
        
        Candidate Details:
        - Skills: {skills}
        - Experience: {experience}
        - Projects: {projects}
        
        Here is the chat transcript so far:
        {history_text}
        
        Based on their latest response and past answers, ask a relevant technical follow-up question or transition to another core tech stack item in their resume.
        Keep the question challenging and specific. Do not write conversational fillers. Write ONLY the question.
        """
        question = query_gemini(prompt)
        if not question:
            raise HTTPException(status_code=503, detail="AI Service is currently unavailable. Please verify API key.")
        return {
            "text": question.strip(),
            "status": "ongoing",
            "evaluation": None
        }
        
    else:
        # Interview is complete (user has answered the 4th question)
        # Generate full evaluation report
        prompt = f"""
        You are an expert technical interviewer evaluating candidate {current_user.full_name} for the role '{job_title}'.
        
        Candidate Details:
        - Skills: {skills}
        
        Here is the full interview transcript:
        {history_text}
        
        Generate a detailed performance evaluation report.
        
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
        
        raw_res = query_gemini(prompt, json_mode=True)
        if not raw_res:
            raise HTTPException(status_code=503, detail="AI Service is currently unavailable. Evaluation failed.")
            
        try:
            parsed = json.loads(raw_res)
            try:
                parsed["score"] = int(parsed.get("score", 70))
            except:
                parsed["score"] = 70
            
            # Save the evaluation to the application's feedback and change status
            app.feedback = f"Mock Interview Recommendation: {parsed.get('hiring_recommendation')} (Score: {parsed['score']}/100).\nDetails: {parsed.get('technical_knowledge')}"
            db.commit()
            
            return {
                "text": "Thank you for completing the interview! Your report is ready.",
                "status": "completed",
                "evaluation": parsed
            }
        except Exception as e:
            raise HTTPException(status_code=502, detail="Invalid response structure from AI evaluator.")



