import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  FilePlus2,
  Clock,
  CheckCircle2,
  XCircle,
  QrCode,
  ShieldCheck,
  Calendar,
  Eye,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  FileText,
  AlertTriangle,
  RotateCw
} from 'lucide-react';

export default function StudentDashboard({ onNavigate, onSelectLeave }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
    verified: 0
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await api.getStudentLeaves();
      if (res.success) {
        setStats(res.stats);
        // Show active leaves (exclude verified/completed leaves from active display)
        const activeOnly = res.leaves.filter((l) => l.status !== 'VERIFIED');
        setRecentLeaves(activeOnly.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const isSchool = user?.organizationType === 'School';
  const orgName = user?.organizationName || 'Ballari Institute of Technology and Management';
  const appName = user?.appName || 'Digital Leave System';

  // Check for leaves pending for > 3 days
  const overduePendingLeaves = recentLeaves.filter(
    (l) => l.status === 'PENDING' && (
      l.is_overdue_3_days ||
      (Date.now() - new Date(l.created_at).getTime() > 3 * 24 * 60 * 60 * 1000)
    )
  );

  return (
    <div className="page-transition">
      {/* 3-Day Pending Leave Alert Banner */}
      {overduePendingLeaves.length > 0 && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '1px solid #fde68a',
            color: '#92400e',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 20,
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
          }}
        >
          <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '0.92rem' }}>
              Pending Leave Alert ({overduePendingLeaves.length} application{overduePendingLeaves.length > 1 ? 's' : ''})
            </strong>
            <p style={{ fontSize: '0.82rem', marginTop: 2, color: '#78350f' }}>
              Your leave request has been pending approval for more than 3 days. The authority has been flagged for urgent review.
            </p>
          </div>
          <button
            onClick={() => onNavigate('my-leaves')}
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.78rem', borderColor: '#d97706', color: '#92400e', background: '#fff' }}
          >
            Track Status
          </button>
        </div>
      )}

      {/* Student Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212, 175, 55, 0.2)', color: 'var(--accent-gold-light)', padding: '4px 12px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 600, marginBottom: 8 }}>
            <Sparkles size={14} /> {appName}
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', marginBottom: 6 }}>
            Welcome, {user?.fullName}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: '0.85rem', color: '#cbd5e1' }}>
            {isSchool ? (
              <>
                <span><strong>Standard:</strong> {user?.standard || user?.semester} Standard</span>
                {user?.section && <span>• <strong>Section:</strong> {user?.section}</span>}
                {user?.rollNumber && <span>• <strong>Roll No:</strong> {user?.rollNumber}</span>}
              </>
            ) : (
              <>
                <span><strong>USN:</strong> {user?.usn}</span>
                <span>•</span>
                <span><strong>Dept:</strong> {user?.department} ({user?.departmentName || user?.department})</span>
                <span>•</span>
                <span><strong>Semester:</strong> {user?.semester}th Sem</span>
              </>
            )}
            <span>•</span>
            <span><strong>Institution:</strong> {orgName}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-outline"
            style={{
              padding: '10px 16px',
              fontSize: '0.85rem',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              background: 'rgba(255, 255, 255, 0.08)'
            }}
            onClick={fetchDashboard}
            title="Refresh Student Dashboard"
          >
            <RotateCw size={15} style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>

          <button
            className="btn btn-accent"
            id="btn-quick-apply"
            style={{ padding: '12px 22px', fontSize: '0.95rem' }}
            onClick={() => onNavigate('apply-leave')}
          >
            <FilePlus2 size={18} /> Apply for Leave
          </button>
        </div>
      </div>

      {/* Quick Actions 4-Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}
      >
        <button
          onClick={() => onNavigate('apply-leave')}
          className="btn"
          style={{
            background: 'linear-gradient(135deg, var(--primary-700) 0%, var(--primary-600) 100%)',
            color: '#fff',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            border: 'none',
            boxShadow: '0 4px 14px rgba(19, 64, 116, 0.25)'
          }}
        >
          <FilePlus2 size={24} />
          <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Apply Leave</span>
        </button>

        <button
          onClick={() => onNavigate('my-leaves')}
          className="btn"
          style={{
            background: '#ffffff',
            color: 'var(--primary-900)',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Calendar size={24} color="var(--primary-700)" />
          <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>My Leaves</span>
        </button>

        <button
          onClick={() => onNavigate('approved-leaves')}
          className="btn"
          style={{
            background: '#ffffff',
            color: 'var(--primary-900)',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <QrCode size={24} color="#10b981" />
          <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Leave Pass & QR</span>
        </button>

        <button
          onClick={() => onNavigate('help')}
          className="btn"
          style={{
            background: '#ffffff',
            color: 'var(--primary-900)',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <HelpCircle size={24} color="#f59e0b" />
          <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Help & Guide</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f1f5f9', color: 'var(--primary-800)' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <h4>Total Applications</h4>
            <div className="value">{stats.total}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h4>Pending Leaves</h4>
            <div className="value" style={{ color: '#b45309' }}>{stats.pending}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <h4>Approved Leaves</h4>
            <div className="value" style={{ color: '#1d4ed8' }}>{stats.approved}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#fee2e2', color: '#b91c1c' }}>
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <h4>Rejected Leaves</h4>
            <div className="value" style={{ color: '#b91c1c' }}>{stats.rejected}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#d1fae5', color: '#047857' }}>
            <ShieldCheck size={24} />
          </div>
          <div className="stat-info">
            <h4>Verified Leaves</h4>
            <div className="value" style={{ color: '#047857' }}>{stats.verified}</div>
          </div>
        </div>
      </div>

      {/* Recent Leave Applications Section */}
      <div className="table-card">
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Leave Applications</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest active leave submissions and gate pass statuses</span>
          </div>
          <button
            onClick={() => onNavigate('my-leaves')}
            className="btn btn-outline"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            View All Leaves <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Leave ID</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentLeaves.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading applications...' : 'No leave applications submitted yet. Click "Apply for Leave" above.'}
                  </td>
                </tr>
              ) : (
                recentLeaves.map((leave) => (
                  <tr key={leave.id}>
                    <td>
                      <strong style={{ color: 'var(--primary-800)', fontSize: '0.86rem' }}>
                        {leave.leave_application_number}
                      </strong>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{leave.leave_type}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} color="var(--primary-600)" />
                        <span>{leave.start_date} <span style={{ color: 'var(--text-muted)' }}>to</span> {leave.end_date}</span>
                      </div>
                      {leave.grace_date && (
                        <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600, marginTop: 2 }}>
                          Grace: {leave.grace_date}
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{leave.number_of_days} d</span>
                    </td>
                    <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {leave.reason}
                    </td>
                    <td>
                      <span className={`status-pill status-${leave.status}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                          onClick={() => onSelectLeave(leave.id)}
                          title="View Details"
                        >
                          <Eye size={13} /> View
                        </button>
                        {(leave.status === 'APPROVED' || leave.status === 'VERIFIED') && (
                          <button
                            className="btn btn-accent"
                            style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                            onClick={() => {
                              onSelectLeave(leave.id);
                              onNavigate('approved-leaves');
                            }}
                            title="Open Gate Pass QR"
                          >
                            <QrCode size={13} /> QR Pass
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
