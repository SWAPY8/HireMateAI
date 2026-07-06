import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import api from '../../api';
import { 
  Search, 
  MapPin, 
  Building, 
  Clock, 
  IndianRupee, 
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import styles from './Candidate.module.css';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selection
  const [selectedJob, setSelectedJob] = useState(null);
  const [applying, setApplying] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const jobsRes = await api.get('/jobs');
      const appsRes = await api.get('/candidates/my-applications');
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
      if (jobsRes.data.length > 0 && !selectedJob) {
        setSelectedJob(jobsRes.data[0]);
      }
    } catch (err) {
      setError('Failed to fetch job listings.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (jobId) => {
    setApplying(true);
    try {
      await api.post('/candidates/apply', { job_id: jobId });
      await fetchData(); // Reload apps
      alert('Application submitted successfully! Our AI agent has computed your ATS match score.');
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit application.');
    } finally {
      setApplying(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    return job.title.toLowerCase().includes(search.toLowerCase()) ||
           (job.department && job.department.toLowerCase().includes(search.toLowerCase())) ||
           (job.requirements && job.requirements.toLowerCase().includes(search.toLowerCase()));
  });

  const getApplicationStatus = (jobId) => {
    return applications.find(app => app.job_id === jobId);
  };

  return (
    <PageWrapper 
      title="Browse Positions" 
      subtitle="Find open roles and use your parsed resume to instantly submit applications."
    >
      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <div className="inputWrapper" style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search roles by title, team, or skills..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="founder_loadingSpinner__3HlQ_">Loading job listings...</div>
      ) : error ? (
        <div className="founder_errorMessage__3HlQ_">{error}</div>
      ) : filteredJobs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Building size={42} style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }} />
          <h3>No Job Listings Found</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Try clearing your search term.</p>
        </div>
      ) : (
        <div className={styles.jobSearchGrid}>
          {/* Left panel: List */}
          <div className={styles.jobsList}>
            {filteredJobs.map(job => {
              const app = getApplicationStatus(job.id);
              const isSelected = selectedJob?.id === job.id;
              return (
                <div 
                  key={job.id} 
                  className={`${styles.candidateJobCard} ${isSelected ? styles.activeJobCard : ''}`}
                  onClick={() => setSelectedJob(job)}
                >
                  <h3 className={styles.jobTitle}>{job.title}</h3>
                  <div className={styles.jobMetaRow}>
                    <span>{job.department}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span className={styles.jobTag}>{job.type}</span>
                    {app && (
                      <span className={`badge badge-${app.status.toLowerCase()}`}>
                        {app.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right panel: Details */}
          <div>
            {selectedJob ? (
              <div className={styles.jobDetailPanel}>
                <div className={styles.jobDetailHeader}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{selectedJob.title}</h2>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      <span>{selectedJob.department}</span>
                      <span>•</span>
                      <span>{selectedJob.location}</span>
                    </div>
                  </div>
                  
                  {/* Apply action buttons */}
                  {(() => {
                    const app = getApplicationStatus(selectedJob.id);
                    if (app) {
                      return (
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge badge-${app.status.toLowerCase()}`} style={{ fontSize: '0.85rem' }}>
                            Applied
                          </span>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.4rem' }}>
                            ATS Match Score: <strong>{app.ats_score}%</strong>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleApply(selectedJob.id)}
                        disabled={applying}
                      >
                        <Sparkles size={16} />
                        <span>{applying ? 'Applying...' : 'Quick Apply'}</span>
                      </button>
                    );
                  })()}
                </div>

                {/* ATS Analysis breakdown if applied */}
                {(() => {
                  const app = getApplicationStatus(selectedJob.id);
                  if (app && app.ats_score > 0) {
                    return (
                      <div style={{ backgroundColor: 'var(--color-primary-light)', border: '1px solid var(--color-primary)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Sparkles size={14} style={{ color: '#8aa810' }} />
                          <span>AI Recruiter Engine Screening Score</span>
                        </div>
                        <div>Your ATS keyword matching analysis results score: <strong>{app.ats_score}%</strong>.</div>
                        {app.feedback && <div style={{ marginTop: '0.5rem', color: 'var(--color-text-secondary)' }}>{app.feedback}</div>}
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className={styles.jobDetailSection}>
                  <h3>Required Skills & Technologies</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {selectedJob.requirements ? selectedJob.requirements.split(',').map(s => (
                      <span key={s} className={styles.jobTag} style={{ backgroundColor: 'var(--color-border)' }}>{s.strip ? s.strip() : s}</span>
                    )) : <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>None specified</span>}
                  </div>
                </div>

                <div className={styles.jobDetailSection}>
                  <h3>Full Description</h3>
                  <div style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)', fontSize: '0.92rem', marginTop: '0.5rem' }}>
                    {selectedJob.description}
                  </div>
                </div>

                {selectedJob.salary_range && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <IndianRupee size={18} style={{ color: 'var(--color-text-secondary)' }} />

                    <span>Estimated Salary: <strong>{selectedJob.salary_range}</strong></span>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '260px', color: 'var(--color-text-secondary)' }}>
                <Building size={32} style={{ marginBottom: '0.5rem' }} />
                <p>Select a job on the left list to view requirements details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Jobs;
