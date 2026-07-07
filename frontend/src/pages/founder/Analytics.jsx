import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import api from '../../api';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { BarChart3, AlertCircle } from 'lucide-react';
import styles from './Founder.module.css';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/analytics/funnel');
        setData(response.data);
      } catch (err) {
        setError('Failed to fetch funnel graphics data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <PageWrapper title="Analytics Dashboard" subtitle="Fetching metric datasets...">
        <div className="loadingSpinner">Loading analytical dashboard...</div>
      </PageWrapper>
    );
  }

  const COLORS = ['#3b82f6', '#f59e0b', '#9333ea', '#10b981'];

  return (
    <PageWrapper 
      title="Analytics Dashboard" 
      subtitle="Examine your recruiting dashboard performance metrics and ATS match scores distribution."
    >
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      {data && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Main timeline graph */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Applications Trend (Last 7 Days)</h3>
            <div className={styles.chartCard}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C8F74A" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#C8F74A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F1F22', 
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      color: '#FFFFFF'
                    }} 
                  />
                  <Area type="monotone" dataKey="Applications" stroke="#A3CC20" strokeWidth={2} fillOpacity={1} fill="url(#colorApps)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.chartGrid}>
            {/* Stage conversion */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>Pipeline Funnel Analysis</h3>
              <div className={styles.chartCard}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.funnel} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                    <XAxis type="number" stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} />
                    <YAxis dataKey="stage" type="category" stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F1F22', 
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        color: '#FFFFFF'
                      }} 
                    />
                    <Bar dataKey="Candidates" fill="#3B82F6" radius={[0, 6, 6, 0]}>
                      {data.funnel.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Score distribution brackets */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>ATS Match Score Distribution</h3>
              <div className={styles.chartCard}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.distribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                    <XAxis dataKey="bracket" stroke="var(--color-text-secondary)" fontSize={10} tickLine={false} />
                    <YAxis stroke="var(--color-text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F1F22', 
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        color: '#FFFFFF'
                      }} 
                    />
                    <Bar dataKey="Count" fill="#10B981" radius={[6, 6, 0, 0]}>
                      {data.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Analytics;
