import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import api from '../../api';
import { 
  Briefcase, 
  CheckCircle, 
  Calendar, 
  Bell, 
  Sparkles, 
  ChevronRight,
  User,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './Candidate.module.css';

const Dashboard = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    const fetchCandidateDashboard = async () => {
      try {
        const appsRes = await api.get('/candidates/my-applications');
        setApps(appsRes.data);
        
        const profileRes = await api.get('/candidates/profile');
        setProfile(profileRes.data);
        
        setNotifs([
          { id: 1, message: "Welcome to HireMate AI! Build your candidate profile to match open job listings.", time: "Just now", unread: true },
          { id: 2, message: "Upload a PDF resume to instantly evaluate your structural formatting and keyword ATS scores.", time: "1 hour ago", unread: false }
        ]);
      } catch (err) {
        setError('Failed to load dashboard metrics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCandidateDashboard();
  }, []);

  const appliedCount = apps.length;
  const interviewingCount = apps.filter(a => a.status === 'Interviewing').length;
  const offersCount = apps.filter(a => a.status === 'Selected').length;

  return (
    <PageWrapper 
      title="Candidate Center" 
      subtitle="Track your applications, update your AI resume, and participate in mock interview training sessions."
    >
      {/* Stats Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'var(--color-info-light)', color: 'var(--color-info)' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Total Applications</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{appliedCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'rgba(147, 51, 234, 0.1)', color: 'rgb(147, 51, 234)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Interviews Scheduled</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{interviewingCount}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Hiring Offers</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{offersCount}</div>
          </div>
        </div>
      </div>

      <div className={styles.profileGrid}>
        {/* Core Quick Links & Resume Status */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} style={{ color: '#8aa810' }} />
            <span>AI Resume Optimization</span>
          </h2>
          {profile && profile.resume_path && profile.ats_score !== null ? (
            <>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                Your resume document is analyzed! Your current ATS match score is **{profile.ats_score}%**. View detailed breakdown of formatting and keyword recommendations.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '0.25rem 0' }}>
                <div style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>ATS Compatibility</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '0.1rem' }}>{profile.ats_score}%</div>
                </div>
                <div style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Formatting Quality</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.1rem' }}>{profile.resume_quality_score}%</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <Link to="/candidate/resume" className="btn btn-primary" style={{ gap: '0.5rem' }}>
                  <span>View Full Analysis</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/candidate/jobs" className="btn btn-secondary">
                  Browse Positions
                </Link>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                No resume analyzed yet. Upload your resume now to instantly calculate your ATS compatibility score and extract missing skills.
              </p>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <Link to="/candidate/resume" className="btn btn-primary" style={{ gap: '0.5rem' }}>
                  <span>Upload Resume</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/candidate/jobs" className="btn btn-secondary">
                  Browse Open Positions
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Notices */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={20} />
            <span>Recent Updates</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {notifs.map(n => (
              <div 
                key={n.id} 
                style={{ 
                  padding: '0.85rem', 
                  borderRadius: '8px', 
                  border: '1px solid var(--color-border)', 
                  backgroundColor: n.unread ? 'var(--color-primary-light)' : 'var(--color-bg)',
                  fontSize: '0.85rem',
                  lineHeight: 1.4
                }}
              >
                <div>{n.message}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{n.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
