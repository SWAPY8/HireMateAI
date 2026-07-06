import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import api from '../../api';
import { ChevronLeft, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import styles from './Founder.module.css';

const COLUMNS = ['Applied', 'Screening', 'Interviewing', 'Selected', 'Rejected'];

const Pipeline = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [jobFilter, setJobFilter] = useState('');

  const fetchData = async () => {
    try {
      const appRes = await api.get('/candidates');
      const jobsRes = await api.get('/jobs');
      setApplications(appRes.data);
      setJobs(jobsRes.data);
    } catch (err) {
      setError('Failed to fetch applications.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const moveStatus = async (appId, currentStatus, direction) => {
    const currentIndex = COLUMNS.indexOf(currentStatus);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= COLUMNS.length) return;
    
    const nextStatus = COLUMNS[nextIndex];
    try {
      // Optimistic Update
      setApplications(prev => prev.map(app => {
        if (app.id === appId) {
          return { ...app, status: nextStatus };
        }
        return app;
      }));
      
      await api.put(`/candidates/applications/${appId}/status`, {
        status: nextStatus
      });
      fetchData(); // Sync database changes
    } catch (err) {
      alert('Failed to update stage status.');
      fetchData(); // Rollback
    }
  };

  const filteredApps = applications.filter(app => {
    return jobFilter ? app.job_id.toString() === jobFilter : true;
  });

  return (
    <PageWrapper 
      title="Hiring Pipeline" 
      subtitle="Track and transition candidates through screening, interviews, and final selection stages."
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Filter Job:</span>
          <select 
            className="form-input" 
            value={jobFilter} 
            onChange={(e) => setJobFilter(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="">All Jobs</option>
            {jobs.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>
        </div>
      }
    >
      {loading ? (
        <div className={styles.loadingSpinner}>Loading pipeline phases...</div>
      ) : error ? (
        <div className={styles.errorMessage}>{error}</div>
      ) : (
        <div className={styles.kanbanBoard}>
          {COLUMNS.map(col => {
            const columnApps = filteredApps.filter(app => app.status === col);
            return (
              <div key={col} className={styles.kanbanColumn}>
                <div className={styles.kanbanColumnHeader}>
                  <span className={styles.kanbanColumnTitle}>{col}</span>
                  <span className={styles.kanbanColumnBadge}>{columnApps.length}</span>
                </div>
                
                <div className={styles.kanbanCardList}>
                  {columnApps.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '2rem 1rem', fontSize: '0.8rem', border: '1px dashed var(--color-border)', borderRadius: '12px' }}>
                      No candidates in {col.toLowerCase()}
                    </div>
                  ) : (
                    columnApps.map(app => (
                      <div key={app.id} className={styles.kanbanCard}>
                        <div className={styles.kanbanCardTitle}>{app.candidate.user.full_name}</div>
                        <div className={styles.kanbanCardJob}>{app.job.title}</div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <span className={styles.kanbanAtsBadge}>
                            {app.ats_score}% ATS Match
                          </span>
                        </div>

                        <div className={styles.kanbanCardFooter}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.5rem', borderRadius: '6px' }}
                            onClick={() => moveStatus(app.id, app.status, -1)}
                            disabled={col === COLUMNS[0]}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          
                          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                            Move Stage
                          </span>

                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.5rem', borderRadius: '6px' }}
                            onClick={() => moveStatus(app.id, app.status, 1)}
                            disabled={col === COLUMNS[COLUMNS.length - 1]}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    ))
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

export default Pipeline;
