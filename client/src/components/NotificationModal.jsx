import React from 'react';
import { X, CheckCheck, Bell, Info, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import { api } from '../services/api';

export default function NotificationModal({ isOpen, onClose, notifications, onRefresh }) {
  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.deleteNotification(id);
      onRefresh();
    } catch (err) {
      console.error('Delete notification failed:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;
    try {
      await api.clearAllNotifications();
      onRefresh();
    } catch (err) {
      console.error('Clear all notifications failed:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'LEAVE_APPROVED':
      case 'LEAVE_VERIFIED':
        return <CheckCircle2 size={18} color="var(--success)" />;
      case 'LEAVE_REJECTED':
        return <AlertTriangle size={18} color="var(--danger)" />;
      default:
        return <Info size={18} color="var(--primary-600)" />;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={20} color="var(--primary-700)" />
            <h3 style={{ fontSize: '1.15rem' }}>In-App Notifications</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {notifications.length > 0 && (
              <>
                <button
                  onClick={handleMarkAllRead}
                  className="btn btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  title="Mark all as read"
                >
                  <CheckCheck size={14} /> Read all
                </button>
                <button
                  onClick={handleClearAll}
                  className="btn btn-outline"
                  style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: '#fca5a5' }}
                  title="Delete all notifications"
                >
                  <Trash2 size={14} /> Clear all
                </button>
              </>
            )}
            <button onClick={onClose} className="icon-btn" style={{ width: 32, height: 32 }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '16px' }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <Bell size={40} style={{ opacity: 0.3, marginBottom: 10 }} />
              <p>No notifications yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && handleMarkSingleRead(notif.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: notif.read ? '#ffffff' : '#f0f7ff',
                    cursor: notif.read ? 'default' : 'pointer',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    position: 'relative'
                  }}
                >
                  <div style={{ marginTop: 2 }}>{getIcon(notif.type)}</div>
                  <div style={{ flex: 1, paddingRight: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.88rem', fontWeight: notif.read ? 600 : 700, color: 'var(--primary-900)' }}>
                        {notif.title}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                      {notif.message}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, notif.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Delete notification"
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    <Trash2 size={15} />
                  </button>
                  {!notif.read && (
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-600)', position: 'absolute', top: 12, right: 8 }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
