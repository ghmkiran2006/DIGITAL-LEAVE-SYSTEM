import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FilePlus2,
  CalendarCheck2,
  QrCode,
  Bell,
  User,
  LogOut,
  Clock,
  ListFilter,
  CheckCircle2,
  XCircle,
  ScanLine,
  ShieldAlert,
  Settings,
  GraduationCap,
  Building2,
  Users,
  HelpCircle
} from 'lucide-react';
import Avatar from './Avatar';

export default function Sidebar({ currentPage, setCurrentPage, unreadCount }) {
  const { user, isStudent, isAuthority, isAdmin, logout } = useAuth();

  const studentNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'apply-leave', label: 'Apply Leave', icon: FilePlus2 },
    { id: 'my-leaves', label: 'My Leaves', icon: CalendarCheck2 },
    { id: 'approved-leaves', label: 'Approved Leaves (QR)', icon: QrCode },
    { id: 'help', label: 'Help & Guide', icon: HelpCircle },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  const authorityNavItems = [
    { id: 'authority-dashboard', label: 'Authority Dashboard', icon: LayoutDashboard },
    { id: 'student-mgmt', label: 'Student Management', icon: Users },
    { id: 'pending-leaves', label: 'Pending Requests', icon: Clock },
    { id: 'qr-scanner', label: 'Scan Leave QR', icon: ScanLine },
    { id: 'all-leaves', label: 'All Applications', icon: ListFilter },
    { id: 'approved-leaves-list', label: 'Approved Leaves', icon: CheckCircle2 },
    { id: 'rejected-leaves-list', label: 'Rejected Leaves', icon: XCircle },
    { id: 'verification-history', label: 'Verification Records', icon: CalendarCheck2 },
    { id: 'audit-logs', label: 'Audit Trail', icon: ShieldAlert },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'settings', label: 'Authority Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'admin-organisations', label: 'Organisations', icon: Building2 },
    { id: 'admin-authorities', label: 'Authority Management', icon: Users },
    { id: 'admin-audit-logs', label: 'System Audit Trail', icon: ShieldAlert },
    { id: 'admin-security', label: 'Security & Access', icon: ShieldAlert },
    { id: 'admin-profile', label: 'Admin Profile', icon: User }
  ];

  const navItems = isAdmin ? adminNavItems : (isStudent ? studentNavItems : authorityNavItems);
  const brandShort = isAdmin ? 'Super Admin' : (user?.organizationShortName || 'BITM');
  const portalLabel = isAdmin ? 'Management Portal' : (isStudent ? 'Student Portal' : 'Authority ERP');

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div
          className="sidebar-logo-badge"
          style={isAdmin ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff' } : undefined}
        >
          {isAdmin ? <ShieldAlert size={26} /> : (isStudent ? <GraduationCap size={26} /> : <Building2 size={26} />)}
        </div>
        <div className="sidebar-title-group">
          <h2>{brandShort}</h2>
          <span>{portalLabel}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.id)}
            >
              <Icon size={19} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && (
                <span
                  style={{
                    background: 'var(--danger)',
                    color: '#fff',
                    borderRadius: '9999px',
                    padding: '2px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-mini-card">
          <Avatar
            src={user?.profilePhoto}
            name={user?.fullName || 'User'}
            size={38}
          />
          <div className="user-mini-info">
            <div className="name">{user?.fullName}</div>
            <div className="role">
              {isAdmin
                ? `Admin ID: ${user?.adminId || 'SUPER'}`
                : (isStudent
                    ? (user?.organizationType === 'School'
                        ? `${user?.standard || user?.semester} Standard`
                        : `USN: ${user?.usn}`)
                    : (user?.role || 'Authority'))}
            </div>
          </div>
          <button
            onClick={logout}
            className="icon-btn"
            title="Logout"
            style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
