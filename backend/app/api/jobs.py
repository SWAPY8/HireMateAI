from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, Job
from app.models.schemas import JobCreate, JobOut, JobUpdate, JDGenerateRequest
from app.agents.jd_agent import JobDescriptionAgent

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("", response_model=List[JobOut])
def get_jobs(
    db: Session = Depends(get_db),
    department: Optional[str] = None,
    search: Optional[str] = None
):
    query = db.query(Job)
    if department:
        query = query.filter(Job.department.ilike(f"%{department}%"))
    if search:
        query = query.filter(
            (Job.title.ilike(f"%{search}%")) | 
            (Job.description.ilike(f"%{search}%")) |
            (Job.requirements.ilike(f"%{search}%"))
        )
    return query.all()

@router.get("/my-listings", response_model=List[JobOut])
def get_my_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Only founders can access their job listings.")
    return db.query(Job).filter(Job.founder_id == current_user.id).all()

@router.post("", response_model=JobOut)
def create_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Only founders can create job listings.")
    
    db_job = Job(
        title=job_in.title,
        department=job_in.department,
        location=job_in.location,
        type=job_in.type,
        salary_range=job_in.salary_range,
        description=job_in.description,
        requirements=job_in.requirements,
        founder_id=current_user.id
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.post("/generate-jd")
def generate_job_description(
    req: JDGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Only founders can generate job descriptions.")
    return JobDescriptionAgent.generate(
        title=req.title,
        department=req.department,
        requirements_summary=req.requirements_summary,
        experience_level=req.experience_level
    )

@router.get("/{job_id}", response_model=JobOut)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.put("/{job_id}", response_model=JobOut)
def update_job(
    job_id: int,
    job_in: JobUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.founder_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to modify this job")
        
    for field, val in job_in.model_dump(exclude_unset=True).items():
        setattr(job, field, val)
        
    db.commit()
    db.refresh(job)
    return job

@router.delete("/{job_id}")
def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.founder_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this job")
        
    db.delete(job)
    db.commit()
    return {"message": "Job deleted successfully"}
