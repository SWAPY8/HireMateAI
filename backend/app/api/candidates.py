from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, CandidateProfile, Application, Job, Notification, Interview
from app.models.schemas import CandidateProfileCreate, CandidateProfileOut, ApplicationOut, ApplicationCreate, ApplicationUpdateStatus
from app.agents.ats_analyzer import ATSAnalyzer
from app.agents.ranking_agent import CandidateRankingAgent

router = APIRouter(prefix="/candidates", tags=["candidates"])

@router.get("", response_model=List[ApplicationOut])
def get_all_candidates_for_founder(
    job_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Only founders can view the candidates database.")
        
    query = db.query(Application).join(Job, Application.job_id == Job.id).filter(Job.founder_id == current_user.id)
    if job_id:
        query = query.filter(Application.job_id == job_id)
        
    # Order by ATS score
    return query.order_by(Application.ranking.asc()).all()

@router.get("/profile", response_model=CandidateProfileOut)
def get_candidate_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates have candidate profiles.")
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile", response_model=CandidateProfileOut)
def update_candidate_profile(
    profile_in: CandidateProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can update their profiles.")
        
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)
        
    data = profile_in.model_dump(exclude_unset=True)
    if "name" in data:
        current_user.full_name = data.pop("name")
        db.add(current_user)
        
    for field, val in data.items():
        setattr(profile, field, val)
        
    db.commit()
    db.refresh(profile)
    return profile

@router.post("/apply", response_model=ApplicationOut)
def apply_to_job(
    app_in: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can apply to jobs.")
        
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Candidate profile must be created first.")
        
    if not profile.resume_path:
        raise HTTPException(
            status_code=400,
            detail="Please upload and analyze your resume before applying for jobs."
        )
        
    # Check if already applied
    existing_app = db.query(Application).filter(
        Application.job_id == app_in.job_id,
        Application.candidate_id == profile.id
    ).first()
    if existing_app:
        raise HTTPException(status_code=400, detail="You have already applied to this job.")
        
    job = db.query(Job).filter(Job.id == app_in.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Run ATS analysis using Candidate API key
    from app.core.config import settings
    analysis = ATSAnalyzer.analyze(profile.skills, job.requirements, api_key=settings.CANDIDATE_AI_API_KEY)
    
    # Create application
    db_app = Application(
        job_id=app_in.job_id,
        candidate_id=profile.id,
        resume_path=profile.resume_path,
        ats_score=analysis["score"],
        status="Applied"
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    
    # Re-rank applications for this job
    all_apps = db.query(Application).filter(Application.job_id == app_in.job_id).all()
    apps_data = [{"id": a.id, "ats_score": a.ats_score} for a in all_apps]
    ranked = CandidateRankingAgent.rank_candidates(apps_data)
    
    for r in ranked:
        db_app_to_rank = db.query(Application).filter(Application.id == r["id"]).first()
        if db_app_to_rank:
            db_app_to_rank.ranking = r["ranking"]
    db.commit()
    db.refresh(db_app)
    
    # Create notification for founder
    founder_notif = Notification(
        user_id=job.founder_id,
        message=f"New application received for {job.title} from {current_user.full_name}. ATS Match Score: {analysis['score']}%."
    )
    db.add(founder_notif)
    db.commit()
    
    return db_app

@router.get("/my-applications", response_model=List[ApplicationOut])
def get_candidate_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can view their applications.")
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        return []
    return db.query(Application).filter(Application.candidate_id == profile.id).all()

@router.put("/applications/{app_id}/status", response_model=ApplicationOut)
def update_application_status(
    app_id: int,
    status_update: ApplicationUpdateStatus,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Only founders can update application status.")
        
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    old_status = app.status
    app.status = status_update.status
    db.commit()
    
    # Generate mock email notification draft if it moves to positive status
    # Create notification for the candidate
    candidate_user = app.candidate.user
    message = f"Your application status for {app.job.title} has changed to: {status_update.status}."
    
    notif = Notification(
        user_id=candidate_user.id,
        message=message
    )
    db.add(notif)
    db.commit()
    db.refresh(app)
    return app
