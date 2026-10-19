import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Calendar, ShieldCheck, UserCheck, RotateCw, Download, Check } from 'lucide-react';
import Avatar from './Avatar';

export default function Navbar({ onOpenNotifications, unreadCount, onRefresh }) {
  const { user, isStudent, isAdmin } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Check if already installed in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) {
      alert('Application is already installed on this device!');
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Browser doesn't support or prompt not yet fired
      alert('To install this app on your device:\n• Chrome/Edge: Click the install icon in the address bar or menu (⋮) -> "Install App"\n• iOS Safari: Tap Share -> "Add to Home Screen"');
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    if (onRefresh) {
      onRefresh();
    }
    setTimeout(() => {
      window.location.reload();
    }, 250);
  };
  
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const orgName = isAdmin ? 'System Administration ERP (Master Portal)' : (user?.organizationName || 'Ballari Institute of Technology and Management');

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          className="brand-badge-pill"
          title={orgName}
          style={isAdmin ? { border: '1px solid #7c3aed', background: '#f5f3ff', color: '#7c3aed' } : undefined}
        >
          <ShieldCheck size={16} color={isAdmin ? '#7c3aed' : 'var(--accent-gold)'} />
          <span style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isAdmin ? 700 : undefined }}>
            {orgName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <Calendar size={15} />
          <span>{today}</span>
        </div>
      </div>

      <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Refresh Page Button */}
        <button
          className="btn btn-outline"
          onClick={handleManualRefresh}
          title="Refresh Application"
          id="btn-app-refresh"
          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <RotateCw size={14} style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }} />
          <span>Refresh</span>
        </button>

        {/* PWA Install App Button */}
        <button
          className="btn btn-accent"
          onClick={handleInstallClick}
          title={isInstalled ? 'App Installed' : 'Install Digital Leave App'}
          id="btn-install-app"
          style={{
            padding: '6px 14px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: isInstalled ? '#10b981' : undefined,
            color: '#ffffff'
          }}
        >
          {isInstalled ? <Check size={14} /> : <Download size={14} />}
          <span>{isInstalled ? 'App Installed' : 'Install App'}</span>
        </button>

        {/* Notifications Icon Button */}
        <button
          className="icon-btn"
          onClick={onOpenNotifications}
          title="Notifications"
          id="btn-notifications"
        >
          <Bell size={19} />
          {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
        </button>

        {/* User Profile Mini Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-900)' }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              <UserCheck size={12} color="var(--success)" />
              {isAdmin
                ? `Admin (${user?.adminId || 'SUPER'})`
                : (isStudent
                    ? (user?.organizationType === 'School'
                        ? `${user?.standard || user?.semester} Standard`
                        : `Sem ${user?.semester} (${user?.department})`)
                    : user?.role)}
            </div>
          </div>
          <Avatar
            src={user?.profilePhoto}
            name={user?.fullName || 'User'}
            size={36}
          />
        </div>
      </div>
    </header>
  );
}
