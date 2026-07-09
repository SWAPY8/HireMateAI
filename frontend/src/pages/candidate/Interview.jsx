import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { sendGeneralEmail } from '../../services/emailService';
import { Send, Sparkles, Laptop, Shield, Award, HelpCircle, AlertCircle } from 'lucide-react';
import styles from './Candidate.module.css';

const Interview = () => {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [profile, setProfile] = useState(null);
  
  // Chat States
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [evaluationReport, setEvaluationReport] = useState(null);
  
  const [questionsList, setQuestionsList] = useState([]);
  const [answersList, setAnswersList] = useState([]);
  const [evaluating, setEvaluating] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, evaluating]);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const response = await api.get('/candidates/my-applications');
        setApps(response.data);
        if (response.data.length > 0) {
          setSelectedAppId(response.data[0].id.toString());
        }
        
        const profileRes = await api.get('/candidates/profile');
        setProfile(profileRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const handleStartInterview = async () => {
    if (!profile || !profile.resume_path) {
      alert("Please upload and analyze your resume before starting a mock interview.");
      return;
    }
    const app = apps.find(a => a.id.toString() === selectedAppId);
    if (!app) {
      alert('Please select an active role first.');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/interviews/mock/chat', {
        application_id: parseInt(selectedAppId),
        history: []
      });
      setInterviewStarted(true);
      setMessages([
        {
          sender: 'ai',
          text: response.data.text
        }
      ]);
      setEvaluationReport(null);
    } catch (err) {
      alert('Failed to start mock interview. Make sure your profile has skills filled in.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || evaluating) return;

    const currentUserInput = userInput;
    const userMsg = { sender: 'user', text: currentUserInput };
    const updatedHistory = [...messages, userMsg];
    
    setMessages(updatedHistory);
    setUserInput('');
    setEvaluating(true);

    try {
      const response = await api.post('/interviews/mock/chat', {
        application_id: parseInt(selectedAppId),
        history: updatedHistory.map(m => ({ sender: m.sender, text: m.text }))
      });
      
      setMessages(prev => [
        ...prev,
        { 
          sender: 'ai', 
          text: response.data.text 
        }
      ]);
      
      if (response.data.status === "completed") {
        const report = response.data.evaluation;
        setEvaluationReport(report);

        // Auto-email the report via EmailJS
        if (user && user.email) {
          const strengthsText = report.strengths ? report.strengths.join(', ') : 'None listed';
          const weaknessesText = report.weaknesses ? report.weaknesses.join(', ') : 'None listed';
          const improvementsText = report.suggested_improvements ? report.suggested_improvements.join('\n• ') : 'None';
          const resourcesText = report.recommended_resources ? report.recommended_resources.join('\n• ') : 'None';

          const mailSubject = `Mock Interview Evaluation Report - HireMate AI`;
          const mailMessage = `Hello ${user.full_name},

Thank you for completing your HireMate AI Mock Interview. Our AI Interviewer agent has compiled your feedback report details:

Overview Match Score: ${report.score}%
Hiring Decision Recommendation: ${report.hiring_recommendation || report.recommendation}

Skills Competence:
- Technical Knowledge: ${report.technical_knowledge}
- Communication Capability: ${report.communication}
- Confidence & Style: ${report.confidence}
- Logical Problem Solving: ${report.problem_solving}

Key Highlights:
- Strengths: ${strengthsText}
- Weaknesses: ${weaknessesText}

Suggested Action Items:
• ${improvementsText}

Suggested Learning Resources:
• ${resourcesText}

Keep up the great training!

Best regards,
HireMate AI Training Team`;

            const emailRes = await sendGeneralEmail({
              toEmail: user.email,
              toName: user.full_name,
              subject: mailSubject,
              message: mailMessage,
              companyName: 'HireMate AI',
              senderName: 'HireMate AI Training Team'
            });
            if (emailRes.success) {
              console.log(`Automatic EmailJS mock interview report sent successfully to ${user.email}`);
            } else {
              console.error('Failed to send mock interview report email:', emailRes.error);
            }
        }
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { 
          sender: 'ai', 
          text: `Failed to continue interview due to a network connection issue. Please retry.` 
        }
      ]);
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };



  return (
    <PageWrapper 
      title="AI Mock Interview Trainer" 
      subtitle="Practice mock coding and behavioral interviews with custom agent-guided feedback results."
    >
      {loading ? (
        <div className="loadingSpinner">Loading interview environment...</div>
      ) : (
        <div className={styles.interviewGrid}>
          {/* Chat Window */}
          <div className={styles.chatWrapper}>
            <div className={styles.chatHeader}>
              <Laptop size={18} />
              <span>Agent Conversation Room</span>
            </div>

            {interviewStarted ? (
              <>
                 <div className={styles.chatBody}>
                  {messages.map((m, idx) => (
                    <div 
                      key={idx} 
                      className={`${styles.chatBubble} ${m.sender === 'ai' ? styles.bubbleAi : styles.bubbleUser}`}
                    >
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>{m.text}</pre>
                    </div>
                  ))}
                  {evaluating && (
                    <div className={`${styles.chatBubble} ${styles.bubbleAi}`} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--color-text-secondary)', padding: '0.75rem 1rem' }}>
                      <Sparkles size={14} style={{ animation: 'spin 2.5s linear infinite' }} />
                      <span style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>Interviewer is formulating next response...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                <form onSubmit={handleSendMessage} className={styles.chatInputArea}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Type your response here..." 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={evaluating || evaluationReport !== null}
                  />
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem' }}>
                    <Send size={18} />
                  </button>
                </form>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', backgroundColor: 'var(--color-bg)' }}>
                {!profile || !profile.resume_path ? (
                  <>
                    <Laptop size={48} style={{ color: 'var(--color-danger)', marginBottom: '1.25rem' }} />
                    <h3 style={{ color: 'var(--color-danger)', fontSize: '1.1rem', marginBottom: '0.75rem' }}>Resume Required</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '350px', lineHeight: 1.4 }}>
                      Please upload and analyze your resume before starting a mock interview.
                    </p>
                    <Link to="/candidate/resume" className="btn btn-primary" style={{ gap: '0.5rem' }}>
                      <Sparkles size={16} />
                      <span>Upload Resume</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Laptop size={48} style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }} />
                    <h3>Select Role to Begin Training</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '350px' }}>
                      Pick a position you applied to and let our AI Interview Agent test your skills with role-based questions.
                    </p>

                    {apps.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-danger)' }}>You must apply to at least one job listing first.</p>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.75rem', width: '100%', maxWidth: '350px' }}>
                        <select 
                          className="form-input" 
                          value={selectedAppId} 
                          onChange={(e) => setSelectedAppId(e.target.value)}
                        >
                          {apps.map(app => (
                            <option key={app.id} value={app.id}>{app.job.title}</option>
                          ))}
                        </select>
                        
                        <button className="btn btn-primary" onClick={handleStartInterview}>
                          <span>Start</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Feedback & Score Panel */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Award size={20} style={{ color: '#8aa810' }} />
              <span>AI Evaluation Report</span>
            </h2>

            {evaluationReport ? (
              <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '72vh', paddingRight: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 600 }}>Hiring Decision:</span>
                  <span className="badge badge-selected" style={{ fontSize: '0.8rem' }}>{evaluationReport.hiring_recommendation || evaluationReport.recommendation}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 600 }}>Overall AI Score:</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)' }}>{evaluationReport.score}%</span>
                </div>

                {/* Score Breakdown */}
                <div style={{ backgroundColor: 'var(--color-bg)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h4 style={{ fontWeight: 700, margin: 0, fontSize: '0.85rem' }}>Skills Competence</h4>
                  <div><strong>Technical Knowledge:</strong> {evaluationReport.technical_knowledge}</div>
                  <div><strong>Communication Capability:</strong> {evaluationReport.communication}</div>
                  <div><strong>Confidence & Style:</strong> {evaluationReport.confidence}</div>
                  <div><strong>Logical Problem Solving:</strong> {evaluationReport.problem_solving}</div>
                </div>

                {/* Strengths & Weaknesses */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 700, marginBottom: '0.25rem' }}>Strengths</h4>
                    {evaluationReport.strengths && evaluationReport.strengths.map((s, idx) => (
                      <div key={idx} style={{ fontSize: '0.78rem', backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', padding: '0.3rem', borderRadius: '4px', marginBottom: '0.25rem' }}>✓ {s}</div>
                    ))}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 700, marginBottom: '0.25rem' }}>Weaknesses</h4>
                    {evaluationReport.weaknesses && evaluationReport.weaknesses.map((w, idx) => (
                      <div key={idx} style={{ fontSize: '0.78rem', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '0.3rem', borderRadius: '4px', marginBottom: '0.25rem' }}>⚠ {w}</div>
                    ))}
                  </div>
                </div>

                {/* Suggested Improvements */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem' }}>Suggested Action Items</h4>
                  <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
                    {evaluationReport.suggested_improvements && evaluationReport.suggested_improvements.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Resources */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', color: '#8aa810' }}>Suggested Learning Resources</h4>
                  <ul style={{ paddingLeft: '1rem', margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
                    {evaluationReport.recommended_resources && evaluationReport.recommended_resources.map((res, idx) => (
                      <li key={idx} style={{ marginBottom: '0.25rem', color: 'var(--color-text-secondary)' }}>{res}</li>
                    ))}
                  </ul>
                </div>
              </div>

            ) : (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                Complete the mock chat questions to automatically trigger the evaluator agent and generate key summaries.
              </p>
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Interview;
