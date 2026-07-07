from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "founder" or "candidate"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    profile = relationship("CandidateProfile", back_populates="user", uselist=False)
    jobs = relationship("Job", back_populates="founder")
    notifications = relationship("Notification", back_populates="user")

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    department = Column(String, nullable=True)
    location = Column(String, nullable=True)
    type = Column(String, nullable=True)  # "Full-time", "Part-time", "Contract", "Remote"
    salary_range = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    status = Column(String, default="Active")  # "Active", "Closed"
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    founder_id = Column(Integer, ForeignKey("users.id"))
    founder = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    bio = Column(Text, nullable=True)
    resume_path = Column(String, nullable=True)
    resume_text = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)  # Comma separated
    experience = Column(Text, nullable=True)
    education = Column(Text, nullable=True)
    portfolio_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    projects = Column(Text, nullable=True)
    certifications = Column(Text, nullable=True)
    preferred_role = Column(String, nullable=True)
    expected_salary = Column(String, nullable=True)
    preferred_location = Column(String, nullable=True)
    work_preference = Column(String, default="Remote")
    notice_period = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Parsed Resume ATS report columns
    ats_score = Column(Integer, nullable=True)
    resume_quality_score = Column(Integer, nullable=True)
    keyword_match = Column(Text, nullable=True)
    missing_skills = Column(Text, nullable=True)  # Store as JSON list string
    skill_gap_analysis = Column(Text, nullable=True)
    formatting_issues = Column(Text, nullable=True)  # Store as JSON list string
    quantifiable_achievement_suggestions = Column(Text, nullable=True)  # Store as JSON list string
    recruiter_impression = Column(Text, nullable=True)
    salary_estimate = Column(String, nullable=True)
    interview_readiness_score = Column(Integer, nullable=True)
    improvement_roadmap = Column(Text, nullable=True)
    strengths = Column(Text, nullable=True)  # Store as JSON list string
    weaknesses = Column(Text, nullable=True)  # Store as JSON list string
    suggestions = Column(Text, nullable=True)  # Store as JSON list string
    
    user = relationship("User", back_populates="profile")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")

    @property
    def name(self):
        return self.user.full_name if self.user else ""



class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    candidate_id = Column(Integer, ForeignKey("candidate_profiles.id"))
    resume_path = Column(String, nullable=True)
    ats_score = Column(Float, default=0.0)
    ranking = Column(Integer, nullable=True)
    status = Column(String, default="Applied")  # "Applied", "Screening", "Interviewing", "Selected", "Rejected"
    applied_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    feedback = Column(Text, nullable=True)
    interview_questions = Column(Text, nullable=True)
    
    job = relationship("Job", back_populates="applications")
    candidate = relationship("CandidateProfile", back_populates="applications")
    interviews = relationship("Interview", back_populates="application", cascade="all, delete-orphan")

class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"))
    date_time = Column(DateTime, nullable=False)
    location_type = Column(String, nullable=False)  # "Online", "On-site"
    details = Column(Text, nullable=True)
    status = Column(String, default="Scheduled")  # "Scheduled", "Completed", "Cancelled"
    feedback = Column(Text, nullable=True)
    questions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    application = relationship("Application", back_populates="interviews")

class EmailLog(Base):
    __tablename__ = "email_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    recipient_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    type = Column(String, default="Manual")  # "Automated", "Manual"

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = relationship("User", back_populates="notifications")
