import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import api from '../../api';
import { 
  Upload, 
  Search, 
  Mail, 
  FileText, 
  X,
  Sparkles,
  ChevronRight,
  TrendingUp,
  UserPlus
} from 'lucide-react';
import styles from './Founder.module.css';

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Splitscreen Resume/Analysis state
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Upload Form State
  const [jobId, setJobId] = useState('');
  const [candName, setCandName] = useState('');
  const [candEmail, setCandEmail] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Filtering
  const [search, setSearch] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState('');

  const fetchData = async () => {
    try {
      const candRes = await api.get('/candidates');
      const jobsRes = await api.get('/jobs');
      setCandidates(candRes.data);
      setJobs(jobsRes.data);
      if (jobsRes.data.length > 0) {
        setJobId(jobsRes.data[0].id.toString());
      }
    } catch (err) {
      setError('Failed to load candidates database.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!file || !jobId || !candName || !candEmail) {
      setUploadError('All fields including the resume file are required.');
      return;
    }
    setUploadError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('candidate_name', candName);
    formData.append('candidate_email', candEmail);
    formData.append('file', file);

    try {
      await api.post('/resumes/upload-for-job', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setIsModalOpen(false);
      // Reset form
      setCandName('');
      setCandEmail('');
      setFile(null);
      fetchData(); // Reload list
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Failed to upload and parse resume.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchSearch = 
      c.candidate.user.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.candidate.user.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.candidate.skills && c.candidate.skills.toLowerCase().includes(search.toLowerCase()));
      
    const matchJob = selectedJobFilter ? c.job_id.toString() === selectedJobFilter : true;
    return matchSearch && matchJob;
  });

  return (
    <PageWrapper 
      title="Candidates Database" 
      subtitle="View, search, rank, and upload applicant profiles parsed by AI."
      actions={
        <button 
          className="btn btn-primary" 
          onClick={() => setIsModalOpen(true)}
          disabled={jobs.length === 0}
          title={jobs.length === 0 ? 'Create a job first' : ''}
        >
          <Upload size={18} />
          <span>Upload Candidate Resume</span>
        </button>
      }
    >
      {/* Filters Bar */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div className={styles.inputWrapper}>
            <Search size={18} className={styles.inputIcon} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search candidates by name, email, or skills..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          
          <select 
            className="form-input"
            value={selectedJobFilter}
            onChange={(e) => setSelectedJobFilter(e.target.value)}
          >
            <option value="">All Jobs</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loadingSpinner">Loading candidates...</div>
      ) : error ? (
        <div className={styles.errorMessage}>{error}</div>
      ) : filteredCandidates.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Users size={48} style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }} />
          <h3>No Candidates Found</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem' }}>
            Try adjusting your filters, searching for something else, or uploading a resume file.
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className={styles.tableContainer}>
            <table className={styles.candidateTable}>
              <thead>
                <tr>
                  <th>Rank & Candidate</th>
                  <th>Applied Position</th>
                  <th>ATS Match Score</th>
                  <th>Status</th>
                  <th>Key Skills</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className={styles.candidateInfo}>
                        <div className={styles.candidateAvatar}>
                          {c.ranking || '#'}
                        </div>
                        <div>
                          <div className={styles.candidateName}>{c.candidate.user.full_name}</div>
                          <div className={styles.candidateEmail}>{c.candidate.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 500 }}>{c.job.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{c.job.department}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.atsProgressWrapper}>
                        <div className={styles.atsProgressBar}>
                          <div 
                            className={styles.atsProgressFill} 
                            style={{ 
                              width: `${c.ats_score}%`,
                              backgroundColor: c.ats_score >= 80 ? 'var(--color-success)' : c.ats_score >= 55 ? 'var(--color-warning)' : 'var(--color-danger)'
                            }}
                          ></div>
                        </div>
                        <span className={styles.atsScoreNum}>{c.ats_score}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.candidate.skills || 'None extracted'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title="View ATS Analysis & Resume Split Screen"
                          onClick={() => {
                            setSelectedCandidate(c);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Sparkles size={14} />
                          <span>View Analysis</span>
                        </button>
                        <a 
                          href={c.resume_path ? `http://localhost:8000/${c.resume_path.replace(/\\/g, '/')}` : '#'} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          title="Open original resume PDF in new tab"
                          onClick={(e) => {
                            if (!c.resume_path) {
                              e.preventDefault();
                              alert('No uploaded file path available for this candidate.');
                            }
                          }}
                        >
                          <FileText size={16} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} />
                <h2>Add Candidate Resume</h2>
              </div>
              <button onClick={() => { setIsModalOpen(false); setUploadError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleUploadResume}>
              <div className={styles.modalBody}>
                {uploadError && <div className={styles.errorMessage}>{uploadError}</div>}
                
                <div className="form-group">
                  <label className="form-label">Position *</label>
                  <select 
                    className="form-input" 
                    value={jobId} 
                    onChange={(e) => setJobId(e.target.value)}
                    required
                  >
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>{job.title} ({job.department})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Candidate Full Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="E.g. Sarah Jenkins"
                    value={candName}
                    onChange={(e) => setCandName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Candidate Email *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="sarah.jenkins@example.com"
                    value={candEmail}
                    onChange={(e) => setCandEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Resume PDF/DOCX Document *</label>
                  <div style={{ border: '2px dashed var(--color-border)', borderRadius: '12px', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--color-bg)' }}>
                    <input 
                      type="file" 
                      id="resume-file" 
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      accept=".pdf,.docx,.doc,.txt"
                      required
                    />
                    <label htmlFor="resume-file" style={{ cursor: 'pointer' }}>
                      <Upload size={32} style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }} />
                      <div style={{ fontWeight: 600 }}>{file ? file.name : 'Choose a file'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>PDF, DOCX, or TXT up to 5MB</div>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  <Sparkles size={16} />
                  <span>{uploading ? 'Processing with AI...' : 'Parse & Rank Resume'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Splitscreen ATS & PDF Detail Modal */}
      {isDetailsOpen && selectedCandidate && (
        <div className={styles.modalOverlay} style={{ zIndex: 1100 }}>
          <div className={styles.modalContent} style={{ maxWidth: '90vw', width: '90vw', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
            <div className={styles.modalHeader} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                  {selectedCandidate.candidate.user.full_name[0].toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{selectedCandidate.candidate.user.full_name}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Applying for <strong>{selectedCandidate.job.title}</strong> • {selectedCandidate.candidate.user.email}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setIsDetailsOpen(false); setSelectedCandidate(null); }} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--color-text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', flex: 1, overflow: 'hidden' }}>
              {/* Left Side: Original PDF Resume Viewer */}
              <div style={{ borderRight: '1px solid var(--color-border)', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#525659' }}>
                {selectedCandidate.resume_path ? (
                  <iframe 
                    src={`http://localhost:8000/${selectedCandidate.resume_path.replace(/\\/g, '/')}`} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none', flex: 1 }}
                    title="Original Resume PDF Document"
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', padding: '2rem', textAlign: 'center' }}>
                    <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No uploaded PDF resume document path found for this candidate.</p>
                  </div>
                )}
              </div>
              
              {/* Right Side: AI matching results & profile details */}
              <div style={{ padding: '1.5rem 2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: 'var(--color-bg)' }}>
                {/* Header Match Score Metrics */}
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: 'linear-gradient(135deg, var(--color-primary-light) 0%, rgba(255,255,255,0.05) 100%)' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-main)' }}>ATS Alignment Fit</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Generated by HireMate AI Recruiter Agent</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
                        {/* Background track circle */}
                        <circle 
                          cx="30" 
                          cy="30" 
                          r="25" 
                          fill="none" 
                          stroke="var(--color-border)" 
                          strokeWidth="4" 
                        />
                        {/* Animated progress circle */}
                        <circle 
                          cx="30" 
                          cy="30" 
                          r="25" 
                          fill="none" 
                          stroke={selectedCandidate.ats_score >= 80 ? 'var(--color-success)' : selectedCandidate.ats_score >= 55 ? 'var(--color-warning)' : 'var(--color-danger)'}
                          strokeWidth="4" 
                          strokeDasharray="157"
                          strokeDashoffset={157 - (157 * selectedCandidate.ats_score) / 100}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                        />
                      </svg>
                      <span style={{ 
                        position: 'absolute', 
                        fontSize: '0.85rem', 
                        fontWeight: 800, 
                        color: 'var(--color-text-main)'
                      }}>
                        {selectedCandidate.ats_score}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recruiter Impression */}
                {selectedCandidate.candidate.recruiter_impression && (
                  <div>
                    <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>AI Recruiter Impression</h3>
                    <div style={{ fontSize: '0.88rem', lineHeight: '1.5', color: 'var(--color-text-main)', backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      {selectedCandidate.candidate.recruiter_impression}
                    </div>
                  </div>
                )}

                {/* Strengths & Weaknesses */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ backgroundColor: 'rgba(40, 167, 69, 0.05)', border: '1px solid rgba(40, 167, 69, 0.2)', padding: '1rem', borderRadius: '10px' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>✓ Core Strengths</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', lineHeight: '1.4' }}>
                      {selectedCandidate.candidate.strengths && Array.isArray(JSON.parse(selectedCandidate.candidate.strengths || '[]')) && JSON.parse(selectedCandidate.candidate.strengths || '[]').length > 0 ? (
                        JSON.parse(selectedCandidate.candidate.strengths || '[]').map((s, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>{s}</li>
                        ))
                      ) : (
                        <li>Solid overall matching capabilities.</li>
                      )}
                    </ul>
                  </div>

                  <div style={{ backgroundColor: 'rgba(220, 53, 69, 0.05)', border: '1px solid rgba(220, 53, 69, 0.2)', padding: '1rem', borderRadius: '10px' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>✗ Areas of Concern</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', lineHeight: '1.4' }}>
                      {selectedCandidate.candidate.weaknesses && Array.isArray(JSON.parse(selectedCandidate.candidate.weaknesses || '[]')) && JSON.parse(selectedCandidate.candidate.weaknesses || '[]').length > 0 ? (
                        JSON.parse(selectedCandidate.candidate.weaknesses || '[]').map((w, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>{w}</li>
                        ))
                      ) : (
                        <li>No major concerns identified.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Missing Skills & Formatting */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Missing Job Skills</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {selectedCandidate.candidate.missing_skills && Array.isArray(JSON.parse(selectedCandidate.candidate.missing_skills || '[]')) && JSON.parse(selectedCandidate.candidate.missing_skills || '[]').length > 0 ? (
                        JSON.parse(selectedCandidate.candidate.missing_skills || '[]').map((skill, idx) => (
                          <span key={idx} className="badge badge-rejected" style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}>
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>No critical missing skills.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>Resume Format Issues</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', lineHeight: '1.4' }}>
                      {selectedCandidate.candidate.formatting_issues && Array.isArray(JSON.parse(selectedCandidate.candidate.formatting_issues || '[]')) && JSON.parse(selectedCandidate.candidate.formatting_issues || '[]').length > 0 ? (
                        JSON.parse(selectedCandidate.candidate.formatting_issues || '[]').map((f, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>{f}</li>
                        ))
                      ) : (
                        <li style={{ color: 'var(--color-text-secondary)' }}>Perfect resume formatting structure.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Skill Gap Analysis */}
                {selectedCandidate.candidate.skill_gap_analysis && (
                  <div>
                    <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>AI Skill Gap Analysis</h3>
                    <div style={{ fontSize: '0.85rem', lineHeight: '1.55', color: 'var(--color-text-secondary)' }}>
                      {selectedCandidate.candidate.skill_gap_analysis}
                    </div>
                  </div>
                )}

                {/* Action Items / Roadmap */}
                {selectedCandidate.candidate.improvement_roadmap && (
                  <div>
                    <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--color-text-main)' }}>Suggested Improvement Roadmap</h3>
                    <div style={{ fontSize: '0.85rem', lineHeight: '1.55', color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                      {selectedCandidate.candidate.improvement_roadmap}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Candidates;
