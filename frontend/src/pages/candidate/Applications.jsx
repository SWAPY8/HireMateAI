import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import api from '../../api';
import { GitBranch, Calendar, MapPin, Video, Sparkles, CheckCircle } from 'lucide-react';
import styles from './Candidate.module.css';

const Applications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await api.get('/candidates/my-applications');
        setApps(response.data);
      } catch (err) {
        setError('Failed to load application history logs.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const stages = ['Applied', 'Screening', 'Interviewing', 'Selected'];

  const getStageIndex = (status) => {
    if (status === 'Rejected') return -1;
    return stages.indexOf(status);
  };

  return (
    <PageWrapper 
      title="Application Tracker" 
      subtitle="Examine status, interview stages progress, and recruiter evaluation reports."
    >
      {loading ? (
        <div className="loadingSpinner">Loading application records...</div>
      ) : error ? (
        <div className="founder_errorMessage__3HlQ_">{error}</div>
      ) : apps.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <GitBranch size={42} style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }} />
          <h3>No Application Logs</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>You haven't submitted any job applications yet.</p>
        </div>
      ) : (
        <div className={styles.timelineWrapper}>
          {apps.map(app => {
            const currentStageIdx = getStageIndex(app.status);
            const isRejected = app.status === 'Rejected';
            
            return (
              <div key={app.id} className={styles.timelineItem}>
                {/* Left side: status badge */}
                <div className={styles.timelineStatusBlock}>
                  <span className={`badge badge-${app.status.toLowerCase()}`} style={{ fontSize: '0.85rem' }}>
                    {app.status}
                  </span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    ATS Match: <strong>{app.ats_score}%</strong>
                  </div>
                </div>

                <div className={styles.timelineDivider}></div>

                {/* Middle details */}
                <div className={styles.timelineDetails}>
                  <h3 className={styles.timelineJob}>{app.job.title}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                    {app.job.department} • {app.job.location}
                  </div>
                  
                  {/* Status Progression Bar */}
                  {!isRejected ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '1rem', maxWidth: '500px' }}>
                      {stages.map((stage, idx) => {
                        const active = idx <= currentStageIdx;
                        return (
                          <div key={stage} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ height: '6px', borderRadius: '3px', backgroundColor: active ? 'var(--color-primary)' : 'var(--color-border)' }}></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: active ? 'var(--color-text-main)' : 'var(--color-text-secondary)' }}>{stage}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                      Application was reviewed and archived by the hiring team.
                    </div>
                  )}

                  {/* Interview notes detail summary if selected */}
                  {app.feedback && (
                    <div style={{ marginTop: '1rem', backgroundColor: 'var(--color-bg)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.82rem', lineHeight: 1.4 }}>
                      <strong>Feedback Report:</strong>
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{app.feedback}</pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
};

export default Applications;
