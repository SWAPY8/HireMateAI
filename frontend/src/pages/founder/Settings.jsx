import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { Save, Shield, Key, Sparkles, Sliders } from 'lucide-react';
import styles from './Founder.module.css';

const Settings = () => {
  const { user } = useAuth();
  
  // Settings Form States
  const [companyName, setCompanyName] = useState('HireMate Solutions');
  const [recruiterName, setRecruiterName] = useState(user?.full_name || 'Founder');
  const [apiType, setApiType] = useState('Simulated'); // Simulated vs Live OpenAI
  const [apiKey, setApiKey] = useState('');
  
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Settings saved successfully!');
    }, 800);
  };

  return (
    <PageWrapper 
      title="Settings" 
      subtitle="Manage your team profile, API model parameters, and integrations configuration."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px' }}>
        <form onSubmit={handleSaveSettings}>
          {/* Section 1: Profile */}
          <div className="glass-card" style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={20} />
              <span>Company Information</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Recruiter Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={recruiterName}
                  onChange={(e) => setRecruiterName(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Section 2: Model Configuration */}
          <div className="glass-card" style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={20} />
              <span>AI Engine Credentials</span>
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem', lineHeight: 1.4 }}>
              Switch between local sandbox simulated AI agents or connect live OpenAI models to parse resumes and generate content.
            </p>

            <div className="form-group">
              <label className="form-label">AI Engine Mode</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="radio" 
                    name="apiType" 
                    value="Simulated"
                    checked={apiType === 'Simulated'}
                    onChange={() => setApiType('Simulated')}
                  />
                  <span>Simulated Agent Pipeline (Zero API Costs)</span>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input 
                    type="radio" 
                    name="apiType" 
                    value="Live"
                    checked={apiType === 'Live'}
                    onChange={() => setApiType('Live')}
                  />
                  <span>Connect OpenAI API (GPT-4o Agentic Integration)</span>
                </label>
              </div>
            </div>

            {apiType === 'Live' && (
              <div className="form-group fade-in-up">
                <label className="form-label">OpenAI API Key</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="sk-proj-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Section 3: Integrations Security */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} />
              <span>Recruiting Settings & Security</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" defaultChecked />
                <span>Auto-generate candidate notifications upon status progression.</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" defaultChecked />
                <span>Automatically score uploaded candidates using ATS match keywords.</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" />
                <span>Require dual recruiter validation before sending offer letters.</span>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={saving}
            style={{ width: '100%', gap: '0.5rem' }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving Config...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>
    </PageWrapper>
  );
};

export default Settings;
