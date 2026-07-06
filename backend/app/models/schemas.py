from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str  # "founder" or "candidate"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None

# Job Schemas
class JobCreate(BaseModel):
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None  # "Full-time", "Part-time", "Remote", etc.
    salary_range: Optional[str] = None
    description: str
    requirements: Optional[str] = None

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None
    salary_range: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    status: Optional[str] = None

class JobOut(BaseModel):
    id: int
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None
    salary_range: Optional[str] = None
    description: str
    requirements: Optional[str] = None
    status: str
    created_at: datetime
    founder_id: int
    
    class Config:
        from_attributes = True

# Candidate Profile Schemas
class CandidateProfileCreate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    portfolio_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    dob: Optional[str] = None
    github_url: Optional[str] = None
    projects: Optional[str] = None
    certifications: Optional[str] = None
    preferred_role: Optional[str] = None
    expected_salary: Optional[str] = None
    preferred_location: Optional[str] = None
    work_preference: Optional[str] = "Remote"
    notice_period: Optional[str] = None
    profile_photo: Optional[str] = None

class CandidateProfileOut(BaseModel):
    id: int
    user_id: int
    name: Optional[str] = None
    bio: Optional[str] = None
    resume_path: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    portfolio_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    dob: Optional[str] = None
    github_url: Optional[str] = None
    projects: Optional[str] = None
    certifications: Optional[str] = None
    preferred_role: Optional[str] = None
    expected_salary: Optional[str] = None
    preferred_location: Optional[str] = None
    work_preference: Optional[str] = "Remote"
    notice_period: Optional[str] = None
    profile_photo: Optional[str] = None
    user: UserOut
    
    class Config:
        from_attributes = True

# Application Schemas
class ApplicationCreate(BaseModel):
    job_id: int

class ApplicationOut(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    resume_path: Optional[str] = None
    ats_score: float
    ranking: Optional[int] = None
    status: str
    applied_at: datetime
    feedback: Optional[str] = None
    interview_questions: Optional[str] = None
    job: JobOut
    candidate: CandidateProfileOut
    
    class Config:
        from_attributes = True

class ApplicationUpdateStatus(BaseModel):
    status: str

# Interview Schemas
class InterviewCreate(BaseModel):
    application_id: int
    date_time: datetime
    location_type: str  # "Online" or "On-site"
    details: Optional[str] = None

class InterviewOut(BaseModel):
    id: int
    application_id: int
    date_time: datetime
    location_type: str
    details: Optional[str] = None
    status: str
    feedback: Optional[str] = None
    questions: Optional[str] = None
    created_at: datetime
    application: ApplicationOut
    
    class Config:
        from_attributes = True

class InterviewUpdate(BaseModel):
    status: Optional[str] = None
    feedback: Optional[str] = None

# Email Schemas
class EmailSend(BaseModel):
    recipient_email: str
    subject: str
    body: str

class EmailLogOut(BaseModel):
    id: int
    recipient_email: str
    subject: str
    body: str
    sent_at: datetime
    type: str
    
    class Config:
        from_attributes = True

# Notification Schemas
class NotificationOut(BaseModel):
    id: int
    message: str
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# AI Agent Specific Schemas
class JDGenerateRequest(BaseModel):
    title: str
    department: str
    requirements_summary: str
    experience_level: str

class AIQuestionGenerateRequest(BaseModel):
    job_title: str
    candidate_skills: str
    experience_level: str

class AIEmailDraftRequest(BaseModel):
    candidate_name: str
    job_title: str
    status: str  # e.g., "Screening", "Interview", "Offer", "Rejection"
    additional_details: Optional[str] = None

class MockInterviewStartRequest(BaseModel):
    application_id: int

class MockInterviewAnswerItem(BaseModel):
    question: str
    answer: str

class MockInterviewEvaluateRequest(BaseModel):
    application_id: int
    answers: List[MockInterviewAnswerItem]

class MockChatHistoryItem(BaseModel):
    sender: str
    text: str

class MockInterviewChatRequest(BaseModel):
    application_id: int
    history: List[MockChatHistoryItem]


