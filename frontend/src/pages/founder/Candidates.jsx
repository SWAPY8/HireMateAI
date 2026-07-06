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
        <div className={styles.loadingSpinner}>Loading candidates...</div>
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
                        <a 
                          href={c.resume_path ? `http://localhost:8000/${c.resume_path.replace(/\\/g, '/')}` : '#'} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-secondary" 
                          style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                          title="View parsed resume document"
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
    </PageWrapper>
  );
};

export default Candidates;
