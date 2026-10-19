import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { api } from './services/api';

// Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import NotificationModal from './components/NotificationModal';

// Pages
import LandingPage from './pages/LandingPage';
import StudentLoginPage from './pages/StudentLoginPage';
import AuthorityLoginPage from './pages/AuthorityLoginPage';
import StudentDashboard from './pages/StudentDashboard';
import ApplyLeavePage from './pages/ApplyLeavePage';
import MyLeavesPage from './pages/MyLeavesPage';
import ApprovedLeavePassPage from './pages/ApprovedLeavePassPage';
import AuthorityDashboard from './pages/AuthorityDashboard';
import PendingLeavesPage from './pages/PendingLeavesPage';
import QRScannerPage from './pages/QRScannerPage';
import AuthorityLeaveHistory from './pages/AuthorityLeaveHistory';
import AuditLogsPage from './pages/AuditLogsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import StudentManagementPage from './pages/StudentManagementPage';
import StudentHelpPage from './pages/StudentHelpPage';

export default function App() {
  const { user, loading, isStudent, isAuthority } = useAuth();
  
  // Navigation & View State
  const [authView, setAuthView] = useState('landing'); // 'landing' | 'student-login' | 'authority-login'
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  
  // Notifications
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll / Fetch notifications whenever authenticated
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Adjust default landing page based on role
  useEffect(() => {
    if (isStudent) {
      setCurrentPage('dashboard');
    } else if (isAuthority) {
      setCurrentPage('authority-dashboard');
    }
  }, [isStudent, isAuthority]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🎓</div>
          <h3 style={{ color: 'var(--primary-800)', fontWeight: 700 }}>BITM Smart Leave System</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading secure session...</p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Landing / Login Pages
  if (!user) {
    if (authView === 'student-login') {
      return (
        <StudentLoginPage
          onBack={() => setAuthView('landing')}
          onLoginSuccess={() => setCurrentPage('dashboard')}
        />
      );
    }

    if (authView === 'authority-login') {
      return (
        <AuthorityLoginPage
          onBack={() => setAuthView('landing')}
          onLoginSuccess={() => setCurrentPage('authority-dashboard')}
        />
      );
    }

    return (
      <LandingPage
        onSelectRole={(role) => {
          if (role === 'student') setAuthView('student-login');
          if (role === 'authority') setAuthView('authority-login');
        }}
      />
    );
  }

  // Logged-in Main App Shell
  const renderCurrentPage = () => {
    // STUDENT ROUTES
    if (isStudent) {
      switch (currentPage) {
        case 'dashboard':
          return (
            <StudentDashboard
              onNavigate={(page) => setCurrentPage(page)}
              onSelectLeave={(id) => {
                setSelectedLeaveId(id);
                setCurrentPage('my-leaves');
              }}
            />
          );
        case 'apply-leave':
          return (
            <ApplyLeavePage
              onLeaveSubmitted={(id) => {
                setSelectedLeaveId(id);
                setCurrentPage('my-leaves');
                fetchNotifications();
              }}
              onCancel={() => setCurrentPage('dashboard')}
            />
          );
        case 'my-leaves':
          return (
            <MyLeavesPage
              onSelectLeave={(id) => setSelectedLeaveId(id)}
              onOpenQrPass={(id) => {
                setSelectedLeaveId(id);
                setCurrentPage('approved-leaves');
              }}
            />
          );
        case 'approved-leaves':
          return (
            <ApprovedLeavePassPage
              leaveId={selectedLeaveId}
              onBack={() => setCurrentPage('dashboard')}
            />
          );
        case 'notifications':
          return (
            <div className="page-transition">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-900)', marginBottom: 20 }}>
                My Notifications
              </h2>
              <div className="form-card">
                {notifications.map((n) => (
                  <div key={n.id} style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    <strong>{n.title}</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        case 'help':
          return <StudentHelpPage onNavigate={setCurrentPage} />;
        case 'profile':
          return <ProfilePage />;
        default:
          return <StudentDashboard onNavigate={setCurrentPage} onSelectLeave={setSelectedLeaveId} />;
      }
    }

    // AUTHORITY ROUTES
    if (isAuthority) {
      switch (currentPage) {
        case 'authority-dashboard':
          return (
            <AuthorityDashboard
              onNavigate={(page) => setCurrentPage(page)}
              onSelectLeave={(id) => {
                setSelectedLeaveId(id);
                setCurrentPage('pending-leaves');
              }}
            />
          );
        case 'student-mgmt':
          return <StudentManagementPage />;
        case 'pending-leaves':
          return (
            <PendingLeavesPage
              selectedLeaveId={selectedLeaveId}
              onLeaveActionComplete={() => {
                fetchNotifications();
              }}
            />
          );
        case 'qr-scanner':
          return (
            <QRScannerPage
              onVerificationComplete={() => {
                fetchNotifications();
              }}
            />
          );
        case 'all-leaves':
        case 'approved-leaves-list':
        case 'rejected-leaves-list':
        case 'verification-history':
          return <AuthorityLeaveHistory />;
        case 'audit-logs':
          return <AuditLogsPage />;
        case 'settings':
          return <SettingsPage />;
        case 'profile':
          return <ProfilePage />;
        case 'notifications':
          return (
            <div className="page-transition">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-900)', marginBottom: 20 }}>
                Authority Notifications
              </h2>
              <div className="form-card">
                {notifications.map((n) => (
                  <div key={n.id} style={{ padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    <strong>{n.title}</strong>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        default:
          return <AuthorityDashboard onNavigate={setCurrentPage} onSelectLeave={setSelectedLeaveId} />;
      }
    }

    return null;
  };

  return (
    <div className="app-container">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        unreadCount={unreadCount}
      />

      <div className="main-wrapper">
        <Navbar
          onOpenNotifications={() => setIsNotifOpen(true)}
          unreadCount={unreadCount}
          onRefresh={fetchNotifications}
        />

        <main className="content-area">
          {renderCurrentPage()}
        </main>
      </div>

      <NotificationModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onRefresh={fetchNotifications}
      />
    </div>
  );
}
