import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import api from '../../api';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
  Video,
  MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './Founder.module.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, interviewsRes] = await Promise.allSettled([
          api.get('/analytics/overview'),
          api.get('/interviews')
        ]);
        
        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data);
        } else {
          console.error('Failed to load analytics:', statsRes.reason);
        }
        
        if (interviewsRes.status === 'fulfilled') {
          setInterviews(interviewsRes.value.data);
        } else {
          console.error('Failed to load interviews:', interviewsRes.reason);
        }
      } catch (err) {
        setError('Failed to fetch dashboard metrics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <PageWrapper title="Overview" subtitle="Loading metrics...">
        <div className="loadingSpinner">Loading...</div>
      </PageWrapper>
    );
  }

  // Filter upcoming interviews (scheduled, sorted by date)
  const upcomingInterviews = interviews
    .filter(i => i.status === 'Scheduled')
    .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
    .slice(0, 5);

  const statCards = [
    { title: 'Open Job Positions', value: stats?.jobs_count || 0, icon: Briefcase, color: 'info', path: '/founder/jobs' },
    { title: 'Total Candidates', value: stats?.applications_count || 0, icon: Users, color: 'success', path: '/founder/candidates' },
    { title: 'Interviews Booked', value: stats?.interviews_count || 0, icon: Calendar, color: 'warning', path: '/founder/interviews' },
    { title: 'Average ATS Score', value: `${stats?.average_ats || 0}%`, icon: TrendingUp, color: 'primary', path: '/founder/analytics' },
  ];

  return (
    <PageWrapper 
      title="Overview" 
      subtitle="Welcome back! Your AI agents are running background screening tasks."
      actions={
        <Link to="/founder/jobs" className="btn btn-primary">
          <Plus size={18} />
          <span>New Job Posting</span>
        </Link>
      }
    >
      {/* Stats Summary Grid */}
      <div className={styles.statsGrid}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link key={idx} to={card.path} className={`${styles.statCard} glass-card`}>
              <div className={`${styles.iconContainer} ${styles['icon-' + card.color]}`}>
                <Icon size={24} />
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>{card.title}</span>
                <span className={styles.statValue}>{card.value}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Upcoming Interviews Section */}
      <div className={styles.dashboardSplitGrid} style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ flex: 1 }}>
          <div className={styles.cardTitleBar}>
            <Calendar className={styles.aiIcon} />
            <h2>Upcoming Interviews</h2>
          </div>
          <p className={styles.panelSubtitle}>Scheduled candidate interview meetings.</p>
          
          {upcomingInterviews.length > 0 ? (
            <div className={styles.recommendationList}>
              {upcomingInterviews.map((meet) => (
                <Link 
                  key={meet.id} 
                  to="/founder/interviews" 
                  className={styles.recommendationItem}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className={styles.recIndicator}>
                    <span className={`${styles.priorityBadge} ${styles['priority-high']}`} style={{ minWidth: '70px', textAlign: 'center' }}>
                      {meet.location_type === 'Online' ? <Video size={12} style={{ marginRight: 4 }} /> : <MapPin size={12} style={{ marginRight: 4 }} />}
                      {meet.location_type}
                    </span>
                  </div>
                  <div className={styles.recText} style={{ flex: 1 }}>
                    <h4 style={{ margin: 0 }}>{meet.application?.candidate?.user?.full_name || 'Candidate'}</h4>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                      {meet.application?.job?.title || 'Position'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', fontSize: '0.82rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} />
                      <span>{new Date(meet.date_time).toLocaleDateString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Clock size={13} />
                      <span>{new Date(meet.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <ArrowRight size={18} className={styles.recArrow} />
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>No upcoming interviews scheduled. Book one from the <Link to="/founder/interviews" style={{ color: 'var(--color-primary)' }}>Interviews</Link> page.</p>
          )}
        </div>

        {/* Pipeline Summary Panel */}
        <div className="glass-card" style={{ flex: 1 }}>
          <div className={styles.cardTitleBar}>
            <h2>Active Pipeline Funnel</h2>
          </div>
          <p className={styles.panelSubtitle}>Recruitment pipeline overview status distribution.</p>
          
          <div className={styles.pipelineBarList}>
            {stats?.pipeline && Object.entries(stats.pipeline).map(([phase, count]) => {
              const maxVal = Math.max(...Object.values(stats.pipeline), 1);
              const percentage = (count / maxVal) * 100;
              return (
                <div key={phase} className={styles.pipelineBarItem}>
                  <div className={styles.pipelineBarHeader}>
                    <span className={styles.pipelineBarLabel}>{phase}</span>
                    <span className={styles.pipelineBarCount}>{count} candidates</span>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div 
                      className={`${styles.progressBarFill} ${styles['progress-' + phase.toLowerCase()]}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.dashboardSplitGrid}>
        {/* AI Recommendations Panel */}
        <div className="glass-card" style={{ flex: 1.3 }}>
          <div className={styles.cardTitleBar}>
            <Sparkles className={styles.aiIcon} />
            <h2>AI Hiring Recommendations</h2>
          </div>
          <p className={styles.panelSubtitle}>Real-time advice generated by your autonomous screening agents.</p>
          
          <div className={styles.recommendationList}>
            {stats?.recommendations && stats.recommendations.length > 0 ? (
              stats.recommendations.map((rec, index) => (
                <div key={index} className={styles.recommendationItem}>
                  <div className={styles.recIndicator}>
                    <span className={`${styles.priorityBadge} ${styles['priority-' + rec.priority.toLowerCase()]}`}>
                      {rec.priority} Priority
                    </span>
                  </div>
                  <div className={styles.recText}>
                    <h4>{rec.title}</h4>
                    <p>{rec.description}</p>
                  </div>
                  <ArrowRight size={18} className={styles.recArrow} />
                </div>
              ))
            ) : (
              <p>No new hiring recommendations available. Keep checking back!</p>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
