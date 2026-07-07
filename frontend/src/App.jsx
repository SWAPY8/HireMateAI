import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layouts
import Sidebar from './components/layout/Sidebar';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Founder Dashboard Pages
import FounderDashboard from './pages/founder/Dashboard';
import FounderJobs from './pages/founder/Jobs';
import FounderCandidates from './pages/founder/Candidates';
import FounderPipeline from './pages/founder/Pipeline';
import FounderInterviews from './pages/founder/Interviews';
import FounderEmails from './pages/founder/Emails';
import FounderAnalytics from './pages/founder/Analytics';
import FounderSettings from './pages/founder/Settings';

// Candidate Dashboard Pages
import CandidateDashboard from './pages/candidate/Dashboard';
import CandidateProfile from './pages/candidate/Profile';
import CandidateResume from './pages/candidate/Resume';
import CandidateJobs from './pages/candidate/Jobs';
import CandidateApplications from './pages/candidate/Applications';
import CandidateInterview from './pages/candidate/Interview';
import CandidateNotifications from './pages/candidate/Notifications';

// Global Styles
import './styles/global.css';

// Protected Route components
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>Verifying Authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'founder' ? '/founder' : '/candidate'} replace />;
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <Outlet />
    </div>
  );
};

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-main)' }}>Verifying Authentication Session...</div>;
  }

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={user.role === 'founder' ? '/founder' : '/candidate'} replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={user.role === 'founder' ? '/founder' : '/candidate'} replace />} />

      {/* Founder Panel Routes */}
      <Route element={<ProtectedRoute allowedRoles={['founder']} />}>
        <Route path="/founder" element={<FounderDashboard />} />
        <Route path="/founder/jobs" element={<FounderJobs />} />
        <Route path="/founder/candidates" element={<FounderCandidates />} />
        <Route path="/founder/pipeline" element={<FounderPipeline />} />
        <Route path="/founder/interviews" element={<FounderInterviews />} />
        <Route path="/founder/emails" element={<FounderEmails />} />
        <Route path="/founder/analytics" element={<FounderAnalytics />} />
        <Route path="/founder/settings" element={<FounderSettings />} />
      </Route>

      {/* Candidate Panel Routes */}
      <Route element={<ProtectedRoute allowedRoles={['candidate']} />}>
        <Route path="/candidate" element={<CandidateDashboard />} />
        <Route path="/candidate/profile" element={<CandidateProfile />} />
        <Route path="/candidate/resume" element={<CandidateResume />} />
        <Route path="/candidate/jobs" element={<CandidateJobs />} />
        <Route path="/candidate/applications" element={<CandidateApplications />} />
        <Route path="/candidate/interview" element={<CandidateInterview />} />
        <Route path="/candidate/notifications" element={<CandidateNotifications />} />
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
