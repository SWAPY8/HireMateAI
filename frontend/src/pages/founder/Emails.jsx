import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import api from '../../api';
import { Mail, Sparkles, Send, History, AlertCircle, CheckCircle } from 'lucide-react';
import { sendGeneralEmail } from '../../services/emailService';
import styles from './Founder.module.css';

const Emails = () => {
  const [logs, setLogs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Send Form State
  const [selectedCandIds, setSelectedCandIds] = useState([]);
  const [draftStatus, setDraftStatus] = useState('Screening');
  const [additionalDetails, setAdditionalDetails] = useState('');
  
  // Custom inputs
  const [recipientEmail, setRecipientEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    try {
      const logsRes = await api.get('/emails/logs');
      const candRes = await api.get('/candidates');
      setLogs(logsRes.data);
      setCandidates(candRes.data);
      if (candRes.data.length > 0) {
        setSelectedCandIds([candRes.data[0].id.toString()]);
        setRecipientEmail(candRes.data[0].candidate.user.email);
      }
    } catch (err) {
      setError('Failed to load email logs history.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCandidateSelection = (candId) => {
    let updated;
    if (selectedCandIds.includes(candId)) {
      updated = selectedCandIds.filter(id => id !== candId);
    } else {
      updated = [...selectedCandIds, candId];
    }
    setSelectedCandIds(updated);
    
    // Auto-update Recipient Email field
    const emails = candidates
      .filter(c => updated.includes(c.id.toString()))
      .map(c => c.candidate.user.email);
    setRecipientEmail(emails.join(', '));
  };

  const handleSelectAll = () => {
    if (selectedCandIds.length === candidates.length) {
      setSelectedCandIds([]);
      setRecipientEmail('');
    } else {
      const allIds = candidates.map(c => c.id.toString());
      setSelectedCandIds(allIds);
      const emails = candidates.map(c => c.candidate.user.email);
      setRecipientEmail(emails.join(', '));
    }
  };

  const handleGenerateDraft = async () => {
    const candidateId = selectedCandIds[0] || (candidates[0] && candidates[0].id.toString());
    const app = candidates.find(c => c.id.toString() === candidateId);
    if (!app) {
      alert('Please select at least one candidate to generate draft.');
      return;
    }
    
    setGenerating(true);
    try {
      const response = await api.post('/emails/generate-draft', {
        candidate_name: app.candidate.user.full_name,
        job_title: app.job.title,
        status: draftStatus,
        additional_details: additionalDetails
      });
      setSubject(response.data.subject);
      setBody(response.data.body);
    } catch (err) {
      alert('Failed to generate AI email template.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!recipientEmail || !subject || !body) {
      alert('Please fill in Send To, Subject, and Message Body.');
      return;
    }

    const emailList = recipientEmail
      .split(',')
      .map(email => email.trim())
      .filter(Boolean);

    if (emailList.length === 0) {
      alert('Recipient email list is empty. Please select or enter a recipient email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      alert(`Invalid email format(s): ${invalidEmails.join(', ')}`);
      return;
    }

    setSending(true);

    try {
      // Loop over and send via EmailJS to each recipient
      for (const email of emailList) {
        const cand = candidates.find(c => c.candidate.user.email === email);
        const candName = cand ? cand.candidate.user.full_name : 'Candidate';

        const emailRes = await sendGeneralEmail({
          toEmail: email,
          toName: candName,
          subject: subject,
          message: body,
          companyName: 'HireMate AI',
          senderName: 'Founder Recruiter Team'
        });

        if (!emailRes.success) {
          console.error(`Failed to send email via EmailJS to ${email}:`, emailRes.error);
        }

        // Record log in backend db
        await api.post('/emails/send', {
          recipient_email: email,
          subject,
          body
        });
      }

      setSubject('');
      setBody('');
      setAdditionalDetails('');
      fetchData(); // Reload logs

      const isConfigured = !!(import.meta.env.VITE_EMAILJS_SERVICE_ID && import.meta.env.VITE_EMAILJS_TEMPLATE_ID && import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
      if (isConfigured) {
        alert('Email(s) sent successfully via EmailJS!');
      } else {
        alert('Email log saved successfully. Add EmailJS credentials to your environment variables to enable delivery.');
      }
    } catch (err) {
      alert(`Failed to send email. Details: ${err.message || err.text || err}`);
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <PageWrapper 
      title="Email Automation" 
      subtitle="Draft personalized updates using the Email Agent and manage sent communications logs."
    >
      {loading ? (
        <div className={styles.loadingSpinner}>Loading email engine...</div>
      ) : error ? (
        <div className={styles.errorMessage}>{error}</div>
      ) : (
        <div className={styles.splitLayout}>
          {/* Left panel: Compose */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={20} />
              <span>Compose Email</span>
            </h2>

            {candidates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                <AlertCircle size={24} style={{ marginBottom: '0.5rem' }} />
                <p>No active candidate profiles to email.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {!(import.meta.env.VITE_EMAILJS_SERVICE_ID && import.meta.env.VITE_EMAILJS_PUBLIC_KEY && import.meta.env.VITE_EMAILJS_GENERAL_TEMPLATE && import.meta.env.VITE_EMAILJS_INTERVIEW_TEMPLATE) ? (
                  <div style={{ backgroundColor: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', padding: '0.85rem', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--color-danger)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <strong>EmailJS Configuration Status: Unconfigured</strong>
                    <div>Please configure the missing keys in your .env file:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                      <div>{import.meta.env.VITE_EMAILJS_SERVICE_ID ? '✓' : '✗'} Service ID</div>
                      <div>{import.meta.env.VITE_EMAILJS_PUBLIC_KEY ? '✓' : '✗'} Public Key</div>
                      <div>{import.meta.env.VITE_EMAILJS_GENERAL_TEMPLATE ? '✓' : '✗'} General Template</div>
                      <div>{import.meta.env.VITE_EMAILJS_INTERVIEW_TEMPLATE ? '✓' : '✗'} Interview Template</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ backgroundColor: 'var(--color-success-light)', border: '1px solid var(--color-success)', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={16} />
                    <span>EmailJS initialized successfully. Outgoing emails will be actively delivered.</span>
                  </div>
                )}
                {/* AI Assistant draft helper */}
                <div className={styles.jdGeneratorWrapper} style={{ borderStyle: 'solid' }}>
                  <div className={styles.jdGeneratorHeader}>
                    <Sparkles size={16} />
                    <span>AI Email Draft Generator</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Select Recipients ({selectedCandIds.length} selected)</span>
                        <button 
                          type="button" 
                          onClick={handleSelectAll} 
                          style={{ background: 'none', border: 'none', color: 'var(--color-primary-hover)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                        >
                          {selectedCandIds.length === candidates.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </label>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', backgroundColor: 'var(--color-bg)' }}>
                        {candidates.map(c => (
                          <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedCandIds.includes(c.id.toString())}
                              onChange={() => toggleCandidateSelection(c.id.toString())}
                            />
                            <span>{c.candidate.user.full_name} ({c.job.title}) - {c.candidate.user.email}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Email Context</label>
                      <select 
                        className="form-input" 
                        value={draftStatus}
                        onChange={(e) => setDraftStatus(e.target.value)}
                      >
                        <option value="Applied">Application Confirmed</option>
                        <option value="Screening">Review Update</option>
                        <option value="Interviewing">Interview Invite</option>
                        <option value="Selected">Offer Letter</option>
                        <option value="Rejected">Application Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label className="form-label">Extra Info (e.g. date, interview details)</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="E.g. next Tuesday at 3:00 PM PST"
                      value={additionalDetails}
                      onChange={(e) => setAdditionalDetails(e.target.value)}
                    />
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-dark" 
                    onClick={handleGenerateDraft}
                    disabled={generating}
                    style={{ width: '100%' }}
                  >
                    <Sparkles size={16} />
                    <span>{generating ? 'Drafting...' : 'Generate AI Email Draft'}</span>
                  </button>
                </div>

                {/* Actual compose form */}
                <form onSubmit={handleSendEmail}>
                  <div className="form-group">
                    <label className="form-label">Send To</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Subject</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Subject Line"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Message Body</label>
                    <textarea 
                      className="form-input" 
                      rows={6}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      required 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={sending}
                    style={{ width: '100%', gap: '0.5rem' }}
                  >
                    <Send size={16} />
                    <span>{sending ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right panel: History logs */}
          <div className="glass-card" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={20} />
              <span>Sent Logs</span>
            </h2>
            
            {logs.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>No emails sent yet.</p>
            ) : (
              <div className={styles.emailLogsList}>
                {logs.map(log => (
                  <div key={log.id} className={styles.emailLogCard}>
                    <div className={styles.emailLogHeader}>
                      <div className={styles.emailLogMeta}>
                        <div className={styles.emailLogSubject}>{log.subject}</div>
                        <div className={styles.emailLogTo}>To: {log.recipient_email}</div>
                      </div>
                      <div className={styles.emailLogTime}>
                        {new Date(log.sent_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={styles.emailLogBody}>{log.body}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Emails;
