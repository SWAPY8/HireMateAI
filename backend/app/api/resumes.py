from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import aiofiles
import random
import logging

logger = logging.getLogger("app.api.resumes")

from app.core.database import get_db
from app.core.config import settings
from app.api.auth import get_current_user
from app.models.models import User, CandidateProfile, Application, Job, Notification
from app.agents.resume_parser import ResumeParser
from app.agents.ats_analyzer import ATSAnalyzer
from app.agents.ranking_agent import CandidateRankingAgent

router = APIRouter(prefix="/resumes", tags=["resumes"])

# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

def format_list_or_objects(val):
    if not val:
        return ""
    if isinstance(val, list):
        items = []
        for item in val:
            if isinstance(item, dict):
                parts = []
                for k, v in item.items():
                    parts.append(f"{k.replace('_', ' ').title()}: {v}")
                items.append("\n".join(parts))
            else:
                items.append(str(item))
        return "\n\n".join(items)
    return str(val)

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can upload resumes to their profile.")
        
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
    # Save file
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"resume_{current_user.id}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    async with aiofiles.open(file_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)
        
    # Reset read pointer
    await file.seek(0)
    
    import json

    def coerce_to_string(val) -> str:
        if val is None:
            return ""
        if isinstance(val, (list, dict)):
            return format_list_or_objects(val)
        return str(val)

    def coerce_to_json_string(val) -> str:
        if val is None:
            return "[]"
        if isinstance(val, str):
            try:
                json.loads(val)
                return val
            except:
                return json.dumps([val] if val.strip() else [])
        if isinstance(val, (list, dict)):
            return json.dumps(val)
        return json.dumps([str(val)])

    # Parse resume using parser agent with the dedicated candidate API key
    try:
        parsed_data = ResumeParser.parse(file.filename, content, api_key=settings.CANDIDATE_AI_API_KEY)
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error during resume parsing: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail="The resume analyzer is temporarily unavailable due to high API demand. Please wait a moment and try uploading again."
        )
    
    # Update candidate profile with parsed info
    profile.resume_path = file_path
    profile.resume_text = coerce_to_string(parsed_data.get("raw_text", ""))
    profile.bio = coerce_to_string(parsed_data.get("summary", ""))
    profile.skills = coerce_to_string(parsed_data.get("skills", ""))
    profile.experience = format_list_or_objects(parsed_data.get("experience") or parsed_data.get("internships"))
    profile.education = format_list_or_objects(parsed_data.get("education"))
    profile.linkedin_url = coerce_to_string(parsed_data.get("linkedin", ""))
    profile.portfolio_url = coerce_to_string(parsed_data.get("portfolio", ""))
    profile.phone = coerce_to_string(parsed_data.get("phone", ""))
    profile.location = coerce_to_string(parsed_data.get("location", ""))
    profile.dob = coerce_to_string(parsed_data.get("dob", ""))
    profile.github_url = coerce_to_string(parsed_data.get("github", ""))
    profile.projects = format_list_or_objects(parsed_data.get("projects"))
    profile.certifications = format_list_or_objects(parsed_data.get("certifications"))
    profile.preferred_role = coerce_to_string(parsed_data.get("preferred_role", ""))
    profile.expected_salary = coerce_to_string(parsed_data.get("expected_salary", ""))
    profile.preferred_location = coerce_to_string(parsed_data.get("preferred_location", ""))
    profile.work_preference = coerce_to_string(parsed_data.get("work_preference", "Remote"))
    profile.notice_period = coerce_to_string(parsed_data.get("notice_period", ""))
    
    # Save parsed resume ATS analytics fields
    profile.ats_score = parsed_data.get("ats_score", 70)
    profile.resume_quality_score = parsed_data.get("resume_quality_score", 65)
    profile.keyword_match = coerce_to_string(parsed_data.get("keyword_match", "Good fit keywords."))
    profile.missing_skills = coerce_to_json_string(parsed_data.get("missing_skills", []))
    profile.skill_gap_analysis = coerce_to_string(parsed_data.get("skill_gap_analysis", ""))
    profile.formatting_issues = coerce_to_json_string(parsed_data.get("formatting_issues", []))
    profile.quantifiable_achievement_suggestions = coerce_to_json_string(parsed_data.get("quantifiable_achievement_suggestions", []))
    profile.recruiter_impression = coerce_to_string(parsed_data.get("recruiter_impression", ""))
    profile.salary_estimate = coerce_to_string(parsed_data.get("salary_estimate", ""))
    profile.interview_readiness_score = parsed_data.get("interview_readiness_score", 70)
    profile.improvement_roadmap = coerce_to_string(parsed_data.get("improvement_roadmap", ""))
    profile.strengths = coerce_to_json_string(parsed_data.get("strongest_sections", []))
    profile.weaknesses = coerce_to_json_string(parsed_data.get("weakest_sections", []))
    
    # Update user's name
    if parsed_data.get("name"):
        current_user.full_name = parsed_data.get("name")
        
    # Generate AI Resume Improvement Suggestions
    improvement_suggestions = parsed_data.get("suggestions", [])
    if not improvement_suggestions:
        improvement_suggestions = [
            "Quantify achievements: Replace generic task descriptions with measurable results.",
            "Include links to live projects or demo videos in your portfolio section.",
            "Ensure your experience section lists roles in reverse chronological order with clear dates."
        ]
        
    profile.suggestions = coerce_to_json_string(improvement_suggestions)
        
    db.commit()
    db.refresh(profile)
    
    # Include all parsed ATS analysis fields
    return {
        "message": "Resume uploaded and parsed successfully",
        "parsed_profile": {
            "name": current_user.full_name,
            "skills": profile.skills,
            "experience": profile.experience,
            "education": profile.education,
            "bio": profile.bio,
            "phone": profile.phone,
            "location": profile.location,
            "dob": profile.dob,
            "linkedin_url": profile.linkedin_url,
            "portfolio_url": profile.portfolio_url,
            "github_url": profile.github_url,
            "projects": profile.projects,
            "certifications": profile.certifications,
            "preferred_role": profile.preferred_role,
            "expected_salary": profile.expected_salary,
            "preferred_location": profile.preferred_location,
            "work_preference": profile.work_preference,
            "notice_period": profile.notice_period,
            
            # ATS Analysis fields
            "ats_score": profile.ats_score,
            "resume_quality_score": profile.resume_quality_score,
            "keyword_match": profile.keyword_match,
            "missing_skills": parsed_data.get("missing_skills", []),
            "skill_gap_analysis": profile.skill_gap_analysis,
            "strongest_sections": parsed_data.get("strongest_sections", []),
            "weakest_sections": parsed_data.get("weakest_sections", []),
            "strengths": parsed_data.get("strongest_sections", []),
            "weaknesses": parsed_data.get("weakest_sections", []),
            "formatting_issues": parsed_data.get("formatting_issues", []),
            "grammar_suggestions": parsed_data.get("grammar_suggestions", []),
            "quantifiable_achievement_suggestions": parsed_data.get("quantifiable_achievement_suggestions", []),
            "recruiter_impression": profile.recruiter_impression,
            "salary_estimate": profile.salary_estimate,
            "interview_readiness_score": profile.interview_readiness_score,
            "improvement_roadmap": profile.improvement_roadmap
        },
        "suggestions": improvement_suggestions
    }



@router.post("/upload-for-job")
async def upload_resume_for_job(
    job_id: int = Form(...),
    candidate_name: str = Form(...),
    candidate_email: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Founders can upload candidate resumes directly to jobs.")
        
    # Check if job exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job listing not found.")
        
    # Read file and save
    file_ext = os.path.splitext(file.filename)[1]
    import uuid
    safe_filename = f"parsed_{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    async with aiofiles.open(file_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)
        
    # Parse resume
    parsed_data = ResumeParser.parse(file.filename, content)
    
    # Check if a user with that email already exists or create a temp one
    user = db.query(User).filter(User.email == candidate_email).first()
    if not user:
        # Create candidate user
        from app.core.security import get_password_hash
        user = User(
            email=candidate_email,
            full_name=candidate_name,
            hashed_password=get_password_hash("password123"), # Default
            role="candidate"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create profile
        profile = CandidateProfile(
            user_id=user.id,
            bio=parsed_data["bio"],
            resume_path=file_path,
            resume_text=parsed_data["raw_text"],
            skills=parsed_data["skills"] if parsed_data["skills"] else "Python, React",
            experience=parsed_data["experience"],
            education=parsed_data["education"]
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    else:
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user.id).first()
        if not profile:
            profile = CandidateProfile(
                user_id=user.id,
                bio=parsed_data["bio"],
                resume_path=file_path,
                resume_text=parsed_data["raw_text"],
                skills=parsed_data["skills"],
                experience=parsed_data["experience"],
                education=parsed_data["education"]
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)
            
    # Check if application already exists
    app = db.query(Application).filter(
        Application.job_id == job_id,
        Application.candidate_id == profile.id
    ).first()
    
    # Calculate ATS score
    analysis = ATSAnalyzer.analyze(profile.skills, job.requirements)
    
    if not app:
        app = Application(
            job_id=job_id,
            candidate_id=profile.id,
            resume_path=file_path,
            ats_score=analysis["score"],
            status="Applied"
        )
        db.add(app)
        db.commit()
        db.refresh(app)
    else:
        app.resume_path = file_path
        app.ats_score = analysis["score"]
        db.commit()
        
    # Re-rank applications for this job
    all_apps = db.query(Application).filter(Application.job_id == job_id).all()
    apps_data = [{"id": a.id, "ats_score": a.ats_score} for a in all_apps]
    ranked = CandidateRankingAgent.rank_candidates(apps_data)
    
    for r in ranked:
        db_app = db.query(Application).filter(Application.id == r["id"]).first()
        if db_app:
            db_app.ranking = r["ranking"]
    db.commit()
    
    # Create notification for candidate
    notif = Notification(
        user_id=user.id,
        message=f"Your profile has been added to {job.title} by the recruiter. Current ATS match: {analysis['score']}%."
    )
    db.add(notif)
    db.commit()
    
    return {
        "message": "Candidate resume uploaded and ranked successfully.",
        "application_id": app.id,
        "ats_score": analysis["score"],
        "ranking": app.ranking
    }

@router.get("/suggestions")
def get_resume_suggestions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can view profile tips.")
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile or not profile.skills:
        return {
            "suggestions": [
                "Upload a resume to get personalized, AI-driven improvement tips.",
                "Build your skill list inside the profile tab to get matched with jobs."
            ]
        }
        
    # Dynamic suggestions based on skills
    skills_list = [s.strip() for s in profile.skills.split(",")]
    skills_str = ", ".join(skills_list[:3])
    
    suggestions = [
        f"Your resume highlights strong skills in {skills_str}. Try adding specific numbers of years of experience for each.",
        "Verify formatting: Make sure you use a single column layout to help automated parsers extract text accurately.",
        "Improve action verbs: Start bullet points in your experience section with verbs like 'Led', 'Optimized', or 'Designed'.",
        "Add a personal summary at the top summarizing your core expertise and target role."
    ]
    return {"suggestions": suggestions}
