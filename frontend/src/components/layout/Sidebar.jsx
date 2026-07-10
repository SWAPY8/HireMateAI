import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  GitBranch,
  Calendar,
  Mail,
  BarChart3,
  Settings,
  User,
  FileText,
  Search,
  Bell,
  LogOut,
  Laptop,
  Sun,
  Moon
} from 'lucide-react';
import styles from './Layout.module.css';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [theme, setTheme] = useState(localStorage.getItem('hiremate_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hiremate_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (!user) return null;

  const founderLinks = [
    { to: '/founder', label: 'Overview', icon: LayoutDashboard },
    { to: '/founder/jobs', label: 'Jobs Manager', icon: Briefcase },
    { to: '/founder/candidates', label: 'Candidates', icon: Users },
    { to: '/founder/pipeline', label: 'Hiring Pipeline', icon: GitBranch },
    { to: '/founder/interviews', label: 'Interviews', icon: Calendar },
    { to: '/founder/emails', label: 'Email Automation', icon: Mail },
    { to: '/founder/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/founder/settings', label: 'Settings', icon: Settings },
  ];

  const candidateLinks = [
    { to: '/candidate', label: 'Overview', icon: LayoutDashboard },
    { to: '/candidate/profile', label: 'Profile Builder', icon: User },
    { to: '/candidate/resume', label: 'AI Resume Tips', icon: FileText },
    { to: '/candidate/jobs', label: 'Job Search', icon: Search },
    { to: '/candidate/applications', label: 'Application Tracker', icon: GitBranch },
    { to: '/candidate/interview', label: 'AI Mock Interview', icon: Laptop },
    { to: '/candidate/notifications', label: 'Notifications', icon: Bell },
  ];

  const links = user.role === 'founder' ? founderLinks : candidateLinks;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea} style={{ backgroundColor: '#FFFFFF', padding: '0.4rem 0.75rem', borderRadius: '10px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img 
          src="/logo.png" 
          alt="HireMate AI Logo" 
          style={{ width: '100%', height: 'auto', objectFit: 'contain' }} 
        />
      </div>

      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
        </div>
        <div className={styles.userDetails}>
          <span className={styles.userName}>{user.full_name}</span>
          <span className={styles.userRole}>{user.role === 'founder' ? 'Founder Account' : 'Candidate Account'}</span>
        </div>
      </div>

      <nav className={styles.nav}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/founder' || link.to === '/candidate'}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              <Icon size={20} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <button 
        onClick={toggleTheme}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          background: 'transparent',
          border: 'none',
          color: '#C1C1CD',
          fontFamily: 'var(--font-heading)',
          fontWeight: 500,
          fontSize: '0.95rem',
          cursor: 'pointer',
          width: '100%',
          marginBottom: '0.5rem',
          textAlign: 'left',
          transition: 'all 0.2s ease'
        }}
        title="Toggle Light/Dark Theme"
      >
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
      </button>

      <button className={styles.logoutBtn} onClick={handleLogout}>
        <LogOut size={20} />
        <span>Log Out</span>
      </button>
    </aside>
  );
};

export default Sidebar;
