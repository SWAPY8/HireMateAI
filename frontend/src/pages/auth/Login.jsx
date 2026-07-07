import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { KeyRound, Mail, Sparkles, User, Briefcase } from 'lucide-react';
import styles from './Auth.module.css';
const Login = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const isExpired = queryParams.get('expired') === 'true';
  const initialEmail = queryParams.get('email') || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'founder') {
        navigate('/founder');
      } else {
        navigate('/candidate');
      }
    } catch (err) {
      setError(err);
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
          <h3>Welcome back</h3>
          <p>Login to manage your hiring pipeline or view job matches</p>
        </div>

        {isExpired && (
          <div style={{ 
            backgroundColor: 'var(--color-danger-light)', 
            border: '1px solid var(--color-danger)', 
            padding: '0.75rem', 
            borderRadius: '8px', 
            fontSize: '0.82rem', 
            color: 'var(--color-danger)', 
            marginBottom: '1rem', 
            textAlign: 'center',
            fontWeight: 500
          }}>
            Your session has expired. Please sign in again.
          </div>
        )}

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.authForm}>
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
            Sign In
          </button>
        </form>

        <div className={styles.cardFooter}>
          Don't have an account? <Link to="/register">Create an account</Link>
        </div>

        <div className={styles.demoBanner}>
          <Sparkles size={16} className={styles.demoIcon} />
          <span>
            <strong>Demo Accounts:</strong><br />
            Founder: <code>founder@example.com</code> / <code>password123</code><br />
            Candidate: <code>candidate@example.com</code> / <code>password123</code>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
