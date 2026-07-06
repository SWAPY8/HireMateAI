import React, { useState } from 'react';
import PageWrapper from '../../components/layout/PageWrapper';
import { Bell, Check, Trash2 } from 'lucide-react';
import styles from './Candidate.module.css';

const Notifications = () => {
  const [notifs, setNotifs] = useState([
    { id: 1, message: "Welcome to HireMate AI! Build your profile and upload a resume to get matched.", time: "2 hours ago", read: false },
    { id: 2, message: "AI Agent successfully parsed and formatted your resume profile skills.", time: "1 day ago", read: true }
  ]);

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotif = (id) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
  };

  const toggleRead = (id) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  return (
    <PageWrapper 
      title="Notifications" 
      subtitle="View automated status notifications and calendar interview alerts."
      actions={
        <button className="btn btn-secondary" onClick={markAllRead} style={{ fontSize: '0.85rem' }}>
          <Check size={16} />
          <span>Mark all read</span>
        </button>
      }
    >
      <div className="glass-card" style={{ maxWidth: '800px' }}>
        {notifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
            <Bell size={36} style={{ marginBottom: '0.5rem' }} />
            <p>No new notifications.</p>
          </div>
        ) : (
          <div className={styles.notifList}>
            {notifs.map(n => (
              <div 
                key={n.id} 
                className={`${styles.notifItem} ${!n.read ? styles.notifItemUnread : ''}`}
              >
                <Bell size={18} className={styles.notifIcon} />
                <div className={styles.notifContent}>
                  <div style={{ fontWeight: !n.read ? 600 : 500 }}>{n.message}</div>
                  <div className={styles.notifTime}>{n.time}</div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => toggleRead(n.id)} 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem', border: 'none' }}
                    title={n.read ? "Mark unread" : "Mark read"}
                  >
                    <Check size={16} style={{ color: n.read ? 'var(--color-text-secondary)' : 'var(--color-success)' }} />
                  </button>
                  <button 
                    onClick={() => deleteNotif(n.id)} 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem', border: 'none', color: 'var(--color-danger)' }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default Notifications;
