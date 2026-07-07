import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import api from '../../api';
import { User, Save, Link as LinkIcon, Sparkles, Phone, MapPin, Calendar, Briefcase, DollarSign, Clock, FileText } from 'lucide-react';
import styles from './Candidate.module.css';

const Profile = () => {
  // Base states
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  
  // Extended profile builder states
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [dob, setDob] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [projects, setProjects] = useState('');
  const [certifications, setCertifications] = useState('');
  const [preferredRole, setPreferredRole] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [workPreference, setWorkPreference] = useState('Remote');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/candidates/profile');
        const data = response.data;
        setName(data.name || '');
        setBio(data.bio || '');
        setSkills(data.skills || '');
        setExperience(data.experience || '');
        setEducation(data.education || '');
        setPortfolioUrl(data.portfolio_url || '');
        setLinkedinUrl(data.linkedin_url || '');
        setPhone(data.phone || '');
        setLocation(data.location || '');
        setDob(data.dob || '');
        setGithubUrl(data.github_url || '');
        setProjects(data.projects || '');
        setCertifications(data.certifications || '');
        setPreferredRole(data.preferred_role || '');
        setExpectedSalary(data.expected_salary || '');
        setPreferredLocation(data.preferred_location || '');
        setWorkPreference(data.work_preference || 'Remote');
        setNoticePeriod(data.notice_period || '');
        setProfilePhoto(data.profile_photo || '');
      } catch (err) {
        setError('Failed to load profile details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/candidates/profile', {
        name,
        bio,
        skills,
        experience,
        education,
        portfolio_url: portfolioUrl,
        linkedin_url: linkedinUrl,
        phone,
        location,
        dob,
        github_url: githubUrl,
        projects,
        certifications,
        preferred_role: preferredRole,
        expected_salary: expectedSalary,
        preferred_location: preferredLocation,
        work_preference: workPreference,
        notice_period: noticePeriod,
        profile_photo: profilePhoto
      });
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update candidate profile details.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper 
      title="Profile Builder" 
      subtitle="Complete your profile credentials to match with target job descriptions."
    >
      {loading ? (
        <div className="loadingSpinner">Loading profile...</div>
      ) : error ? (
        <div className="founder_errorMessage__3HlQ_">{error}</div>
      ) : (
        <div className={styles.profileGrid} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <form onSubmit={handleSaveProfile} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <User size={20} />
              <span>Personal Credentials</span>
            </h2>

            {/* Basic Info */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile Photo" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-border)' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👤</div>
              )}
              <div className="form-group" style={{ flex: 1, margin: 0 }}>
                <label className="form-label">Profile Photo URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://example.com/photo.jpg" 
                  value={profilePhoto}
                  onChange={(e) => setProfilePhoto(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="+91 98765 43210" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Location (City, Country)</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Bangalore, India" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="DD/MM/YYYY" 
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <h3 style={{ fontSize: '1rem', margin: '0.5rem 0 0 0', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>Websites & Profiles</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <div style={{ position: 'relative' }}>
                  <LinkIcon size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://linkedin.com/in/..."
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">GitHub URL</label>
                <div style={{ position: 'relative' }}>
                  <LinkIcon size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://github.com/..."
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Portfolio URL</label>
                <div style={{ position: 'relative' }}>
                  <LinkIcon size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://example.com"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
            </div>

            {/* Job Preferences */}
            <h3 style={{ fontSize: '1rem', margin: '0.5rem 0 0 0', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>Job & Hiring Preferences</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Preferred Job Role</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Senior React Developer" 
                    value={preferredRole}
                    onChange={(e) => setPreferredRole(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Expected Salary (₹ / Year)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 600, color: 'var(--color-text-secondary)' }}>₹</span>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="12,00,000" 
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Preferred Job Location</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Remote / Bangalore" 
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Work Preference</label>
                <select 
                  className="form-input" 
                  value={workPreference}
                  onChange={(e) => setWorkPreference(e.target.value)}
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notice Period</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Immediate / 30 Days" 
                  value={noticePeriod}
                  onChange={(e) => setNoticePeriod(e.target.value)}
                />
              </div>
            </div>

            {/* Profile Credentials */}
            <h3 style={{ fontSize: '1rem', margin: '0.5rem 0 0 0', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>Detailed Credentials</h3>
            <div className="form-group">
              <label className="form-label">Professional Summary / Bio</label>
              <textarea 
                className="form-input" 
                rows={3} 
                placeholder="A passionate Full Stack Engineer specializing in React, Node, and Python..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Core Skills (Comma separated list)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Python, React, AWS, FastAPI, CSS Modules"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Work Experience Details</label>
              <textarea 
                className="form-input" 
                rows={4} 
                placeholder="TechCorp - Senior Engineer (2022 - Present)&#10;• Built live API systems...&#10;&#10;Innovate Ltd - Developer (2020 - 2022)"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Education details</label>
              <textarea 
                className="form-input" 
                rows={2} 
                placeholder="Georgia Tech - M.S. in Computer Science (2018 - 2020)&#10;VTU University - B.E. (2014 - 2018)"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Key Projects (extracted from Resume)</label>
              <textarea 
                className="form-input" 
                rows={4} 
                placeholder="Project 1: HireMate AI - Python/React App&#10;Project 2: E-Commerce scale platform"
                value={projects}
                onChange={(e) => setProjects(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Certifications</label>
              <textarea 
                className="form-input" 
                rows={2} 
                placeholder="AWS Certified Solutions Architect (2025)&#10;Google Professional Cloud Developer"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={saving}
              style={{ width: '100%', gap: '0.5rem', marginTop: '1rem' }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>

          {/* Right Panel: AI Tips */}
          <div className="glass-card" style={{ height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} style={{ color: '#8aa810' }} />
              <span>Profile Completeness</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, marginBottom: '1.25rem' }}>
              Ensure your parsed credentials are correct and detailed. Click "Save Profile Changes" to register any modifications.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.85rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                <strong>Expected Salary:</strong> Salary filters are estimated in Indian Rupees (₹) to support local founders.
              </div>
              <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg)' }}>
                <strong>Preferred role:</strong> Be precise to automatically qualify for the correct sorting rankings.
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Profile;
