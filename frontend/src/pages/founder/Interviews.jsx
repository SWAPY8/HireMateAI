import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import api from '../../api';
import { sendInterviewEmail } from '../../services/emailService';
import { 
  Calendar, 
  MapPin, 
  Video, 
  Plus, 
  X, 
  Sparkles, 
  HelpCircle, 
  CheckCircle,
  FileText,
  Clock,
  Trash2
} from 'lucide-react';
import styles from './Founder.module.css';

const Interviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selection
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Interview Form
  const [appId, setAppId] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [locationType, setLocationType] = useState('Online');
  const [details, setDetails] = useState('');
  
  // Feedback note recording
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);

  const fetchData = async () => {
    try {
      const intRes = await api.get('/interviews');
      const appRes = await api.get('/candidates');
      setInterviews(intRes.data);
      // Only show applications that aren't already selected/rejected to schedule new
      const activeApps = appRes.data.filter(a => a.status !== 'Selected' && a.status !== 'Rejected');
      setApplications(activeApps);
      if (activeApps.length > 0) {
        setAppId(activeApps[0].id.toString());
      }
    } catch (err) {
      setError('Failed to load interviews information.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInterview = async (e) => {
    e.preventDefault();
    if (!appId || !dateTime) {
      alert('Please fill in candidate and date & time.');
      return;
    }
    try {
      await api.post('/interviews', {
        application_id: parseInt(appId),
        date_time: dateTime,
        location_type: locationType,
        details
      });

      // Automatic EmailJS Interview Invitation Send
      const app = applications.find(a => a.id.toString() === appId);
      if (app && app.candidate && app.candidate.user) {
        const candidateEmail = app.candidate.user.email;
        const candidateName = app.candidate.user.full_name;
        const jobTitle = app.job.title;

        const mailSubject = `Interview Invitation: ${jobTitle} at HireMate AI`;
        const mailMessage = `Hello ${candidateName},

We are pleased to invite you to an interview for the "${jobTitle}" position.

Details of the meeting:
- Date & Time: ${new Date(dateTime).toLocaleString()}
- Location Format: ${locationType}
- Meeting/Location Details: ${details || 'None specified.'}

Please be prepared at the scheduled time.

Warm regards,
HireMate Recruiting Team`;

        const emailRes = await sendInterviewEmail({
          toEmail: candidateEmail,
          toName: candidateName,
          companyName: 'HireMate AI',
          jobRole: jobTitle,
          interviewDate: new Date(dateTime).toLocaleDateString(),
          interviewTime: new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          interviewMode: locationType,
          meetingLink: details || '',
          message: mailMessage
        });
        if (emailRes.success) {
          console.log(`Automatic EmailJS interview invitation sent successfully to ${candidateEmail}`);
        } else {
          console.error('Failed to send interview invitation email:', emailRes.error);
        }
      }

      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      alert('Failed to book interview slot.');
      console.error(err);
    }
  };

  const handleDeleteInterview = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this scheduled interview?')) return;
    try {
      await api.delete(`/interviews/${id}`);
      alert('Interview cancelled and deleted successfully.');
      setInterviews(prev => prev.filter(meet => meet.id !== id));
      if (selectedInterview?.id === id) {
        setSelectedInterview(null);
      }
    } catch (err) {
      alert('Failed to delete scheduled interview.');
      console.error(err);
    }
  };

  const handleAnalyzeFeedback = async (id) => {
    if (!feedbackNotes) {
      alert('Please enter evaluation notes first.');
      return;
    }
    setSavingFeedback(true);
    try {
      const response = await api.put(`/interviews/${id}`, {
        status: 'Completed',
        feedback: feedbackNotes
      });
      setSelectedInterview(response.data);
      setFeedbackNotes('');
      fetchData();
      alert('AI Agent successfully analyzed notes and updated candidate evaluation score.');
    } catch (err) {
      alert('Failed to record candidate review.');
      console.error(err);
    } finally {
      setSavingFeedback(false);
    }
  };

  const resetForm = () => {
    setDateTime('');
    setLocationType('Online');
    setDetails('');
  };

  return (
    <PageWrapper 
      title="Interviews Scheduler" 
      subtitle="Organize online or on-site candidate review meetings with automated AI questions panels."
      actions={
        <button 
          className="btn btn-primary" 
          onClick={() => setIsModalOpen(true)}
          disabled={applications.length === 0}
          title={applications.length === 0 ? 'No active candidates' : ''}
        >
          <Plus size={18} />
          <span>Book Interview</span>
        </button>
      }
    >
      {loading ? (
        <div className={styles.loadingSpinner}>Loading interviews...</div>
      ) : error ? (
        <div className={styles.errorMessage}>{error}</div>
      ) : (
        <div className={styles.splitLayout}>
          {/* Left panel: List */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '70vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Upcoming & Past Meetings</h2>
            {interviews.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>No interviews booked yet.</p>
            ) : (
              interviews.map(meet => (
                <div 
                  key={meet.id} 
                  className={`kanbanCard ${selectedInterview?.id === meet.id ? 'glass-card' : ''}`}
                  onClick={() => {
                    setSelectedInterview(meet);
                    setFeedbackNotes('');
                  }}
                  style={{ cursor: 'pointer', borderLeft: selectedInterview?.id === meet.id ? '4px solid var(--color-primary)' : '1px solid var(--color-border)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{meet.application.candidate.user.full_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge badge-${meet.status.toLowerCase()}`}>{meet.status}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteInterview(meet.id);
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-danger)',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px'
                        }}
                        title="Cancel & Delete Interview"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '0.25rem 0' }}>
                    {meet.application.job.title}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Calendar size={12} />
                      <span>{new Date(meet.date_time).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <Clock size={12} />
                      <span>{new Date(meet.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      {meet.location_type === 'Online' ? <Video size={12} /> : <MapPin size={12} />}
                      <span>{meet.location_type}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right panel: Details & AI Q&A */}
          <div>
            {selectedInterview ? (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.3rem' }}>{selectedInterview.application.candidate.user.full_name}</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                    Interviewing for <strong>{selectedInterview.application.job.title}</strong>
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>Location & Instructions</h4>
                  <div style={{ fontSize: '0.88rem', backgroundColor: 'var(--color-bg)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    {selectedInterview.details}
                  </div>
                </div>

                {/* AI generated questions */}
                {selectedInterview.questions && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Sparkles size={16} style={{ color: '#8aa810' }} />
                      <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>AI Interview Agent Questions</h4>
                    </div>
                    <div className={styles.qaContainer} style={{ maxHeight: '200px', overflowY: 'auto', fontSize: '0.85rem' }}>
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--color-text-main)' }}>
                        {selectedInterview.questions}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Record Feedback (Only if scheduled/completed) */}
                {selectedInterview.status === 'Scheduled' && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Sparkles size={16} style={{ color: '#8aa810' }} />
                      <h4 style={{ fontSize: '0.9rem' }}>Record Notes & Let AI Analyze Feedback</h4>
                    </div>
                    
                    <textarea 
                      className="form-input" 
                      rows={3} 
                      placeholder="Write feedback notes (e.g. 'Strong react developer, solved algorithmic puzzle with optimal time, excellent communication, minor confusion in docker layers')"
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      style={{ marginBottom: '0.75rem' }}
                    />
                    
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleAnalyzeFeedback(selectedInterview.id)}
                      disabled={savingFeedback}
                      style={{ width: '100%' }}
                    >
                      <Sparkles size={16} />
                      <span>{savingFeedback ? 'AI Analyzing...' : 'Analyze & Complete Interview'}</span>
                    </button>
                  </div>
                )}

                {/* Show recorded feedback details */}
                {selectedInterview.application.feedback && (
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }}>AI Decision Summary</h4>
                    <div style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-text-main)', border: '1px solid var(--color-success)', borderRadius: '8px', padding: '0.85rem', fontSize: '0.85rem', lineHeight: 1.4 }}>
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{selectedInterview.application.feedback}</pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '260px', color: 'var(--color-text-secondary)' }}>
                <Calendar size={32} style={{ marginBottom: '0.5rem' }} />
                <p>Select a meeting item to view questions list and evaluation report.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Schedule Candidate Interview</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateInterview}>
              <div className={styles.modalBody}>
                <div className="form-group">
                  <label className="form-label">Select Candidate Profile *</label>
                  <select 
                    className="form-input" 
                    value={appId} 
                    onChange={(e) => setAppId(e.target.value)}
                    required
                  >
                    {applications.map(app => (
                      <option key={app.id} value={app.id}>
                        {app.candidate.user.full_name} — {app.job.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    className="form-input" 
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Location Type *</label>
                  <select 
                    className="form-input" 
                    value={locationType} 
                    onChange={(e) => setLocationType(e.target.value)}
                    required
                  >
                    <option>Online</option>
                    <option>On-site</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Meeting Notes / Details</label>
                  <textarea 
                    className="form-input" 
                    rows={2} 
                    placeholder="E.g. Technical Coding Round"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                  />
                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Meeting</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Interviews;
