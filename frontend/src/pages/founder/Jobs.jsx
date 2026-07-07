import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import api from '../../api';
import { 
  Plus, 
  MapPin, 
  Building, 
  IndianRupee, 
  Clock, 
  Sparkles, 
  X, 
  AlertCircle,
  FileText,
  Trash2,
  Briefcase
} from 'lucide-react';
import styles from './Founder.module.css';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Full-time');
  const [salaryRange, setSalaryRange] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  
  // AI JD Form State
  const [aiKeywords, setAiKeywords] = useState('');
  const [aiExpLevel, setAiExpLevel] = useState('Mid Level');
  const [generatingJd, setGeneratingJd] = useState(false);
  const [aiError, setAiError] = useState('');

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/my-listings');
      setJobs(response.data);
    } catch (err) {
      setError('Failed to load jobs listings.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleGenerateJD = async () => {
    if (!title || !department || !aiKeywords) {
      setAiError('Please fill in Job Title, Department, and Skills Summary first.');
      return;
    }
    setAiError('');
    setGeneratingJd(true);
    try {
      const response = await api.post('/jobs/generate-jd', {
        title,
        department,
        requirements_summary: aiKeywords,
        experience_level: aiExpLevel
      });
      setDescription(response.data.description);
      setRequirements(response.data.requirements);
    } catch (err) {
      setAiError('Failed to generate Job Description. Please try again.');
      console.error(err);
    } finally {
      setGeneratingJd(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/jobs', {
        title,
        department,
        location,
        type,
        salary_range: salaryRange,
        description,
        requirements
      });
      setIsModalOpen(false);
      resetForm();
      fetchJobs();
    } catch (err) {
      setError('Failed to create job. Check inputs.');
      console.error(err);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job listing?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      fetchJobs();
    } catch (err) {
      alert('Failed to delete job.');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDepartment('');
    setLocation('');
    setType('Full-time');
    setSalaryRange('');
    setDescription('');
    setRequirements('');
    setAiKeywords('');
    setAiExpLevel('Mid Level');
    setAiError('');
  };

  return (
    <PageWrapper 
      title="Jobs Manager" 
      subtitle="Create listings and use AI agents to generate structured JDs."
      actions={
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Post a Job</span>
        </button>
      }
    >
      {loading ? (
        <div className="loadingSpinner">Loading jobs...</div>
      ) : error ? (
        <div className={styles.errorMessage}>{error}</div>
      ) : jobs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Briefcase size={48} style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }} />
          <h3>No Job Listings Created</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Get started by posting your first job opportunity. You can generate professional templates automatically.
          </p>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Post your first job</span>
          </button>
        </div>
      ) : (
        <div className={styles.jobsGrid}>
          {jobs.map((job) => (
            <div key={job.id} className={`${styles.jobCard} glass-card`}>
              <div>
                <div className={styles.jobCardHeader}>
                  <h3>{job.title}</h3>
                  <span className={`badge ${job.status === 'Active' ? 'badge-active' : 'badge-closed'}`}>
                    {job.status}
                  </span>
                </div>
                
                <div className={styles.jobMeta}>
                  <div className={styles.jobMetaItem}>
                    <Building size={14} />
                    <span>{job.department}</span>
                  </div>
                  <div className={styles.jobMetaItem}>
                    <MapPin size={14} />
                    <span>{job.location}</span>
                  </div>
                  <div className={styles.jobMetaItem}>
                    <Clock size={14} />
                    <span>{job.type}</span>
                  </div>
                  {job.salary_range && (
                    <div className={styles.jobMetaItem}>
                      <IndianRupee size={14} />
                      <span>{job.salary_range}</span>
                    </div>
                  )}
                </div>
                
                <div className={styles.jobDescSnippet}>
                  {job.description.replace(/[#*`]/g, '')}
                </div>
              </div>

              <div className={styles.jobCardFooter}>
                <span className={styles.jobStats}>
                  Active applications
                </span>
                <div className={styles.jobActions}>
                  <button 
                    onClick={() => handleDeleteJob(job.id)} 
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem', color: 'var(--color-danger)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Job Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Post a New Job</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateJob}>
              <div className={styles.modalBody}>
                {/* AI Assistant Section */}
                <div className={styles.jdGeneratorWrapper}>
                  <div className={styles.jdGeneratorHeader}>
                    <Sparkles size={16} />
                    <span>AI Job Description Agent</span>
                  </div>
                  <p className={styles.jdGeneratorDesc}>
                    Type a title, department, experience level, and a few target keywords (e.g. React, Node, AWS), then let the AI draft it!
                  </p>
                  
                  {aiError && <div className={styles.errorMessage} style={{ margin: '0.5rem 0' }}>{aiError}</div>}
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Required Experience</label>
                      <select 
                        className="form-input" 
                        value={aiExpLevel} 
                        onChange={(e) => setAiExpLevel(e.target.value)}
                      >
                        <option>Junior Level</option>
                        <option>Mid Level</option>
                        <option>Senior Level</option>
                        <option>Lead / Manager</option>
                      </select>
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Core Skills / Keywords</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="React, AWS, SQL" 
                        value={aiKeywords}
                        onChange={(e) => setAiKeywords(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    className="btn btn-dark" 
                    onClick={handleGenerateJD}
                    disabled={generatingJd}
                    style={{ width: '100%', gap: '0.5rem' }}
                  >
                    <Sparkles size={16} />
                    <span>{generatingJd ? 'Generating Draft...' : 'Generate Job Description'}</span>
                  </button>
                </div>

                {/* Form Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Job Title *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Senior Full Stack Engineer" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Department *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Engineering" 
                      value={department} 
                      onChange={(e) => setDepartment(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="San Francisco, CA or Remote" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)} 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Salary Range</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="₹6,00,000 - ₹12,00,000" 
                      value={salaryRange} 
                      onChange={(e) => setSalaryRange(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Job Description *</label>
                  <textarea 
                    className="form-input" 
                    rows={6}
                    placeholder="Describe roles, day-to-day duties, and team environment..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Required Skills (Comma separated list) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Python, React, AWS, FastAPI"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Post Job Listing</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Jobs;
