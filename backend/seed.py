from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.models import User, Job, CandidateProfile, Application, Notification, Interview
from app.core.security import get_password_hash
from datetime import datetime, timedelta, timezone

def seed_data():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if users already exist
        if db.query(User).filter(User.email == "founder@example.com").first():
            print("Database already seeded.")
            return

        print("Seeding database...")
        
        # 1. Create Founder User
        founder = User(
            email="founder@example.com",
            full_name="Alice Vance",
            hashed_password=get_password_hash("password123"),
            role="founder"
        )
        db.add(founder)
        
        # 2. Create Candidate User
        candidate = User(
            email="candidate@example.com",
            full_name="John Doe",
            hashed_password=get_password_hash("password123"),
            role="candidate"
        )
        db.add(candidate)
        
        # 3. Create Additional Mock Candidate Users for Recruiter dashboards
        candidate2 = User(
            email="sarah.j@example.com",
            full_name="Sarah Jenkins",
            hashed_password=get_password_hash("password123"),
            role="candidate"
        )
        db.add(candidate2)

        candidate3 = User(
            email="robert.k@example.com",
            full_name="Robert Kincaid",
            hashed_password=get_password_hash("password123"),
            role="candidate"
        )
        db.add(candidate3)
        
        db.commit()
        
        # Reload users to get IDs
        db.refresh(founder)
        db.refresh(candidate)
        db.refresh(candidate2)
        db.refresh(candidate3)
        
        # 4. Create Job Listings
        job1 = Job(
            title="Senior Full Stack Engineer",
            department="Engineering",
            location="San Francisco, CA (Hybrid)",
            type="Full-time",
            salary_range="₹1,40,000 - ₹1,75,000 / month",
            description="""We are looking for a Senior Full Stack Engineer to lead design and development of our key core dashboard frameworks. You will build user-facing web applications using React/TypeScript and scalable, secure backend systems in Python/FastAPI.

Key Responsibilities:
- Design and scale service layers and database entities.
- Collaborate with designers to translate Figma layouts into responsive components.
- Write robust integration and unit testing modules.

Required skills: Python, React, FastAPI, PostgreSQL, Docker, AWS.""",
            requirements="Python, React, FastAPI, PostgreSQL, Docker, AWS",
            status="Active",
            founder_id=founder.id
        )
        db.add(job1)
        
        job2 = Job(
            title="UI/UX Designer",
            department="Product",
            location="Remote",
            type="Contract",
            salary_range="₹90,000 - ₹1,10,000 / month",
            description="""Looking for a creative UI/UX designer to refresh our visual language across mobile and web. You will take ownership of client discovery research, component library UI details, and mock interactive animations.
            
Required skills: Figma, Design Systems, Typography, Framer, User Testing.""",
            requirements="Figma, Design Systems, Typography, Framer, User Testing",
            status="Active",
            founder_id=founder.id
        )
        db.add(job2)
        
        db.commit()
        db.refresh(job1)
        db.refresh(job2)
        
        # 5. Create Candidate Profiles
        profile1 = CandidateProfile(
            user_id=candidate.id,
            bio="Passionate web engineer with expertise in frontend rendering patterns. Highly focused on clean components styling and React context state design.",
            skills="React, JavaScript, CSS Modules, Git, HTML5, Webpack",
            experience="Frontend Dev at StartupStudio (2 years) - Refactored legacy UI components leading to a 30% reduction in bundle size.",
            education="B.S. in Computer Science, State University",
            linkedin_url="https://linkedin.com/in/johndoe",
            portfolio_url="https://github.com/johndoe",
            resume_path="uploads/dummy_resume.pdf"
        )
        db.add(profile1)

        profile2 = CandidateProfile(
            user_id=candidate2.id,
            bio="Senior developer with extensive backend design expertise. Strong skillset across database query tuning, containerized deployment, and high-concurrency routers.",
            skills="Python, FastAPI, Docker, AWS, PostgreSQL, Redis, React",
            experience="Backend Dev at FintechGroup (3 years) - Built and deployed multi-tenant credit transaction microservices using container pipelines.",
            education="M.S. in Software Systems, Georgia Tech",
            linkedin_url="https://linkedin.com/in/sarahjenkins",
            portfolio_url="https://github.com/sarahjenkins",
            resume_path="uploads/dummy_resume.pdf"
        )
        db.add(profile2)

        profile3 = CandidateProfile(
            user_id=candidate3.id,
            bio="Product designer obsessed with visual storytelling and atomic systems. Focused on crafting accessible, delightful software interfaces.",
            skills="Figma, Typography, Design Systems, CSS Grid, Framer, Prototyping",
            experience="UI Designer at CreativeStudio (1.5 years) - Collaborated on building 10+ web portfolios and company design tokens.",
            education="BFA in Graphic Design, RISD",
            linkedin_url="https://linkedin.com/in/robertkincaid",
            portfolio_url="https://behance.net/robertkincaid",
            resume_path="uploads/dummy_resume.pdf"
        )
        db.add(profile3)
        
        db.commit()
        db.refresh(profile1)
        db.refresh(profile2)
        db.refresh(profile3)
        
        # 6. Create Applications
        # John Doe applies to Senior Full Stack Engineer (moderate match)
        app1 = Application(
            job_id=job1.id,
            candidate_id=profile1.id,
            ats_score=55.5,
            ranking=3,
            status="Applied"
        )
        db.add(app1)
        
        # Sarah Jenkins applies to Senior Full Stack (high match)
        app2 = Application(
            job_id=job1.id,
            candidate_id=profile2.id,
            ats_score=85.0,
            ranking=1,
            status="Screening"
        )
        db.add(app2)
        
        # Robert Kincaid applies to UI/UX Designer (high match)
        app3 = Application(
            job_id=job2.id,
            candidate_id=profile3.id,
            ats_score=92.5,
            ranking=1,
            status="Applied"
        )
        db.add(app3)
        
        db.commit()
        db.refresh(app1)
        db.refresh(app2)
        db.refresh(app3)
        
        # 7. Create Scheduled Interview for Sarah Jenkins
        interview_time = datetime.now() + timedelta(days=2)
        meet = Interview(
            application_id=app2.id,
            date_time=interview_time,
            location_type="Online",
            details="Technical coding loop. Virtual Meeting Link: https://meet.hiremate.ai/jkl-iop-qwe",
            status="Scheduled",
            questions="### Technical Questions:\n- Can you explain a complex project where you used Python and React and what design tradeoffs you had to make?\n- How do you handle performance optimization and debugging in containerized AWS setups?\n\n### Behavioral Questions:\n- Describe a situation where you had a technical disagreement with a teammate."
        )
        db.add(meet)
        
        # Update Sarah's status to Interviewing
        app2.status = "Interviewing"
        
        # 8. Create Notifications
        notif1 = Notification(
            user_id=candidate.id,
            message="Welcome to HireMate AI! Build your profile and upload a resume to get matched.",
            is_read=False
        )
        db.add(notif1)

        notif2 = Notification(
            user_id=candidate2.id,
            message="Your technical interview for Senior Full Stack Engineer has been scheduled.",
            is_read=False
        )
        db.add(notif2)
        
        db.commit()
        print("Mock datasets seeded successfully!")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
