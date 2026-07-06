from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.models import User, EmailLog
from app.models.schemas import EmailSend, EmailLogOut, AIEmailDraftRequest
from app.agents.email_agent import EmailAgent

router = APIRouter(prefix="/emails", tags=["emails"])

@router.get("/logs", response_model=List[EmailLogOut])
def get_email_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Only founders can view email logs.")
    return db.query(EmailLog).filter(EmailLog.sender_id == current_user.id).order_by(EmailLog.sent_at.desc()).all()

@router.post("/send", response_model=EmailLogOut)
def send_email(
    email_in: EmailSend,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Only founders can send automated emails.")
        
    db_log = EmailLog(
        sender_id=current_user.id,
        recipient_email=email_in.recipient_email,
        subject=email_in.subject,
        body=email_in.body,
        type="Manual"
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.post("/generate-draft")
def generate_draft(
    req: AIEmailDraftRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "founder":
        raise HTTPException(status_code=403, detail="Only founders can generate automated drafts.")
    return EmailAgent.generate_draft(
        candidate_name=req.candidate_name,
        job_title=req.job_title,
        status=req.status,
        additional_details=req.additional_details
    )
