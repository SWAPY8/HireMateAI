import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { sendGeneralEmail } from '../../services/emailService';
import { Upload, Sparkles, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import styles from './Candidate.module.css';

const Resume = () => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [successData, setSuccessData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [tips, setTips] = useState([]);
  const [error, setError] = useState('');

  const fetchTips = async () => {
    try {
      const response = await api.get('/resumes/suggestions');
      setTips(response.data.suggestions);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadProfileAndTips = async () => {
      setProfileLoading(true);
      try {
        await fetchTips();
        const res = await api.get('/candidates/profile');
        if (res.data.resume_path && res.data.ats_score !== null) {
          setSuccessData({
            name: res.data.name || res.data.user.full_name,
            skills: res.data.skills,
            experience: res.data.experience,
            education: res.data.education,
            bio: res.data.bio,
            phone: res.data.phone,
            location: res.data.location,
            dob: res.data.dob,
            linkedin_url: res.data.linkedin_url,
            portfolio_url: res.data.portfolio_url,
            github_url: res.data.github_url,
            projects: res.data.projects,
            certifications: res.data.certifications,
            preferred_role: res.data.preferred_role,
            expected_salary: res.data.expected_salary,
            preferred_location: res.data.preferred_location,
            work_preference: res.data.work_preference,
            notice_period: res.data.notice_period,
            ats_score: res.data.ats_score,
            resume_quality_score: res.data.resume_quality_score,
            keyword_match: res.data.keyword_match,
            missing_skills: res.data.missing_skills || [],
            skill_gap_analysis: res.data.skill_gap_analysis,
            strengths: res.data.strengths || [],
            weaknesses: res.data.weaknesses || [],
            formatting_issues: res.data.formatting_issues || [],
            quantifiable_achievement_suggestions: res.data.quantifiable_achievement_suggestions || [],
            recruiter_impression: res.data.recruiter_impression,
            salary_estimate: res.data.salary_estimate,
            interview_readiness_score: res.data.interview_readiness_score,
            improvement_roadmap: res.data.improvement_roadmap
          });
          if (res.data.suggestions) {
            setSuggestions(res.data.suggestions);
          }
        }
      } catch (err) {
        console.error("Failed to load candidate profile details:", err);
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfileAndTips();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSuccessData(null);
    setError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setError('');
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const parsedData = response.data.parsed_profile;
      const suggestionsList = response.data.suggestions;
      setSuccessData(parsedData);
      setSuggestions(suggestionsList);
      fetchTips(); // Refresh recommendations tips

      // Automatic EmailJS Resume Optimization Report Send
      if (user && user.email) {
        const mailSubject = `Resume Optimization Analysis Report - HireMate AI`;
        const mailMessage = `Hello ${user.full_name},

Your resume document has been parsed and optimized by the HireMate AI Parser Agent.

Here is a summary of your resume analysis results:
- ATS Match Compatibility: ${parsedData.ats_score}%
- Document Structure Quality: ${parsedData.resume_quality_score}%
- Interview Readiness Rating: ${parsedData.interview_readiness_score}%
- Estimated Recruiter Salary Filter: ${parsedData.salary_estimate || 'Not specified'}

Key Gaps & Missing Skills:
- Missing Skills: ${parsedData.missing_skills ? parsedData.missing_skills.join(', ') : 'None detected.'}
- Target Job Roles: ${parsedData.recommended_roles ? parsedData.recommended_roles.join(', ') : 'Software Developer'}

Format & Action Item Roadmap:
${parsedData.improvement_roadmap}

Suggestions:
${suggestionsList ? suggestionsList.join('\n') : 'No recommendations.'}

Please log into your HireMate AI candidate account to edit and save your pre-populated profile details!

Warm regards,
HireMate AI Team`;

        const emailRes = await sendGeneralEmail({
          toEmail: user.email,
          toName: user.full_name,
          subject: mailSubject,
          message: mailMessage,
          companyName: 'HireMate AI',
          senderName: 'HireMate AI Team'
        });
        if (emailRes.success) {
          console.log(`Automatic EmailJS resume analysis report sent successfully to ${user.email}`);
        } else {
          console.error('Failed to send resume analysis report email:', emailRes.error);
        }
      }

      alert('Resume parsed and profile updated!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to parse resume document.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (profileLoading) {
    return (
      <PageWrapper 
        title="AI Resume Optimizer" 
        subtitle="Parse your resume credentials using our parser agent and view optimization suggestions."
      >
        <div className="loadingSpinner">Loading resume analysis data...</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper 
      title="AI Resume Optimizer" 
      subtitle="Parse your resume credentials using our parser agent and view optimization suggestions."
    >
      <div className={styles.profileGrid} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Left Side: Upload & Results */}
        <div>
          <form onSubmit={handleUpload} className="glass-card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} />
              <span>Upload Resume Document</span>
            </h2>

            {error && <div className="errorMessage">{error}</div>}

            <div className={styles.uploadBox}>
              <input 
                type="file" 
                id="resume-upload" 
                onChange={handleFileChange} 
                style={{ display: 'none' }}
                accept=".pdf,.docx,.doc,.txt"
              />
              <label htmlFor="resume-upload" style={{ cursor: 'pointer' }}>
                <Upload size={40} style={{ color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }} />
                <div className={styles.uploadTitle}>{file ? file.name : 'Choose your resume file'}</div>
                <div className={styles.uploadSubtitle}>Supports PDF, DOCX, or TXT up to 5MB</div>
              </label>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={uploading || !file}
              style={{ width: '100%', gap: '0.5rem' }}
            >
              <Sparkles size={16} />
              <span>{uploading ? 'Processing with AI...' : 'Parse & Update Profile'}</span>
            </button>
          </form>

          {/* Parsed Output Result */}
          {successData ? (
            <div className="glass-card fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifycontent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-success)', margin: 0 }}>
                  <CheckCircle size={18} />
                  <span>AI Resume Analysis Complete</span>
                </h3>
              </div>

              {/* Core Quality Scores */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>ATS Score</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: successData.ats_score >= 80 ? 'var(--color-success)' : successData.ats_score >= 55 ? 'var(--color-warning)' : 'var(--color-danger)', marginTop: '0.25rem' }}>
                    {successData.ats_score}%
                  </div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Quality Score</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: successData.resume_quality_score >= 80 ? 'var(--color-success)' : successData.resume_quality_score >= 55 ? 'var(--color-warning)' : 'var(--color-danger)', marginTop: '0.25rem' }}>
                    {successData.resume_quality_score}%
                  </div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Readiness Score</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: successData.interview_readiness_score >= 80 ? 'var(--color-success)' : successData.interview_readiness_score >= 55 ? 'var(--color-warning)' : 'var(--color-danger)', marginTop: '0.25rem' }}>
                    {successData.interview_readiness_score}%
                  </div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Est. Salary</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.45rem' }}>
                    {successData.salary_estimate || "₹9,00,000"}
                  </div>
                </div>
              </div>
              
              {/* Profile Details summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                <div><strong>Extracted Name:</strong> {successData.name}</div>
                <div><strong>Phone / Contact:</strong> {successData.phone || "Not specified"}</div>
                <div><strong>Location / Country:</strong> {successData.location || "Not specified"}</div>
                <div><strong>GitHub / LinkedIn:</strong> {successData.github_url || "None"} | {successData.linkedin_url || "None"}</div>
                <div><strong>Skills Match List:</strong> {successData.skills}</div>
              </div>

              {/* Strengths & Weaknesses Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 700, marginBottom: '0.5rem' }}>Strengths Identified</h4>
                  {successData.strengths && successData.strengths.length > 0 ? (
                    successData.strengths.map((s, idx) => (
                      <div key={idx} style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem', backgroundColor: 'var(--color-success-light)', borderRadius: '6px', marginBottom: '0.4rem', color: 'var(--color-success)', border: '1px solid rgba(16,185,129,0.1)' }}>
                        ✓ {s}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>No highlights listed.</div>
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 700, marginBottom: '0.5rem' }}>Weaknesses / Gaps</h4>
                  {successData.weaknesses && successData.weaknesses.length > 0 ? (
                    successData.weaknesses.map((w, idx) => (
                      <div key={idx} style={{ fontSize: '0.78rem', padding: '0.4rem 0.6rem', backgroundColor: 'var(--color-danger-light)', borderRadius: '6px', marginBottom: '0.4rem', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.1)' }}>
                        ⚠ {w}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>No major structural flaws identified.</div>
                  )}
                </div>
              </div>

              {/* Formatting & Quantifiable suggestions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 700, marginBottom: '0.5rem' }}>Layout / Formatting Issues</h4>
                  {successData.formatting_issues && successData.formatting_issues.length > 0 ? (
                    successData.formatting_issues.map((f, idx) => (
                      <div key={idx} style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>• {f}</div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>✓ Format looks professional.</div>
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 700, marginBottom: '0.5rem' }}>Add Quantifiable Achievements</h4>
                  {successData.quantifiable_achievement_suggestions && successData.quantifiable_achievement_suggestions.length > 0 ? (
                    successData.quantifiable_achievement_suggestions.map((q, idx) => (
                      <div key={idx} style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }}>• {q}</div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Include project sizes, metrics, or speeds.</div>
                  )}
                </div>
              </div>

              {/* ATS Keyword gap analysis */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 700, marginBottom: '0.4rem' }}>ATS Match & Gap Analysis</h4>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  <p><strong>Keyword Match:</strong> {successData.keyword_match}</p>
                  <p style={{ marginTop: '0.5rem' }}><strong>Skill Gap Analysis:</strong> {successData.skill_gap_analysis}</p>
                </div>
              </div>

              {/* Missing Skills and Target Roles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 700, marginBottom: '0.5rem' }}>Missing Target Skills</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {successData.missing_skills && successData.missing_skills.length > 0 ? (
                      successData.missing_skills.map((s, idx) => (
                        <span key={idx} className={styles.jobTag} style={{ backgroundColor: 'var(--color-border)', fontSize: '0.75rem' }}>
                          {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>None detected.</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', fontWeight: 700, marginBottom: '0.5rem' }}>Recommended Job Roles</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {successData.recommended_roles && successData.recommended_roles.length > 0 ? (
                      successData.recommended_roles.map((r, idx) => (
                        <div key={idx} style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                          • {r}
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>General Software Engineer</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Roadmap & Impressions */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <strong>Recruiter's AI Impression:</strong>
                  <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>{successData.recruiter_impression}</p>
                </div>
                <div>
                  <strong>Improvement Roadmap Checklist:</strong>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', color: 'var(--color-text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {successData.improvement_roadmap}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card fade-in-up" style={{ textAlign: 'center', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={48} style={{ color: 'var(--color-text-secondary)', marginBottom: '0.5rem' }} />
              <h3 style={{ margin: 0 }}>No Resume Analysis Found</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto', lineHeight: 1.4 }}>
                You have not uploaded or analyzed a resume document yet. Upload your resume above to calculate your structural score and view AI improvements.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: AI Suggestions */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} style={{ color: '#8aa810' }} />
            <span>AI Feedback & Suggestions</span>
          </h2>
          
          <div className={styles.suggestionsWrapper}>
            {suggestions.length > 0 ? (
              suggestions.map((s, idx) => (
                <div key={idx} className={styles.suggestionCard}>
                  <Sparkles size={16} className={styles.suggestionIcon} />
                  <div className={styles.suggestionText}>{s}</div>
                </div>
              ))
            ) : tips.length > 0 ? (
              tips.map((t, idx) => (
                <div key={idx} className={styles.suggestionCard}>
                  <Sparkles size={16} className={styles.suggestionIcon} />
                  <div className={styles.suggestionText}>{t}</div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                Upload a resume file above to view tailored, agent-generated formatting recommendations.
              </p>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Resume;
