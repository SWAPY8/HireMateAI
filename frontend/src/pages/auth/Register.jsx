import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { KeyRound, Mail, User, Briefcase, Sparkles } from 'lucide-react';
import styles from './Auth.module.css';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('founder'); // 'founder' or 'candidate'
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await register(fullName, email, password, role);
      if (user.role === 'founder') {
        navigate('/founder');
      } else {
        navigate('/candidate');
      }
    } catch (err) {
      setError(err);
      if (typeof err === 'string' && err.toLowerCase().includes('already exists')) {
        alert('A user with this email already exists. Redirecting you to the login page.');
        navigate(`/login?email=${encodeURIComponent(email)}`);
      }
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBgDecoration}>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
      </div>
      
      <div className={styles.authCard}>
        <div className={styles.logoHeader}>
          <div className={styles.logoIcon}>HM</div>
          <h2 className={styles.logoText}>HireMate <span className={styles.logoAccent}>AI</span></h2>
        </div>
        
        <div className={styles.cardHeader}>
          <h3>Get Started</h3>
          <p>Create a free account to begin automating your hiring process</p>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className="form-group">
            <label className="form-label">I am registering as a...</label>
            <div className={styles.roleSelector}>
              <div
                className={`${styles.roleOption} ${role === 'founder' ? styles.roleOptionActive : ''}`}
                onClick={() => setRole('founder')}
              >
                <Briefcase size={22} />
                <span>Founder / Recruiter</span>
              </div>
              
              <div
                className={`${styles.roleOption} ${role === 'candidate' ? styles.roleOptionActive : ''}`}
                onClick={() => setRole('candidate')}
              >
                <User size={22} />
                <span>Job Candidate</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <div className={styles.inputWrapper}>
              <User size={18} className={styles.inputIcon} />
              <input
                id="fullName"
                type="text"
                className="form-input"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className={styles.inputWrapper}>
              <KeyRound size={18} className={styles.inputIcon} />
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            Create Account
          </button>
        </form>

        <div className={styles.cardFooter}>
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
