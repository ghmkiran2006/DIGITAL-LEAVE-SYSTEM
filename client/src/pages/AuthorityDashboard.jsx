import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  CalendarCheck2,
  ScanLine,
  Eye,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  Calendar
} from 'lucide-react';

export default function AuthorityDashboard({ onNavigate, onSelectLeave }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalLeaves: 0,
    pendingLeaves: 0,
    approvedLeaves: 0,
    rejectedLeaves: 0,
    activeLeaves: 0,
    completedLeaves: 0,
    verificationPending: 0,
    verifiedLeaves: 0
  });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAuthorityDashboard = async () => {
    try {
      setRefreshing(true);
      const res = await api.getAuthorityLeaves({ status: 'ALL' });
      if (res.success) {
        setStats(res.stats);
        setRecentLeaves(res.leaves.slice(0, 6));
      }
    } catch (err) {
      console.error('Failed to load authority dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuthorityDashboard();
  }, []);

  return (
    <div className="page-transition">
      {/* Executive Authority Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-800) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: 28,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(212, 175, 55, 0.25)', color: 'var(--accent-gold-light)', padding: '4px 12px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 700, marginBottom: 8 }}>
            <ShieldCheck size={14} /> BITM Authority Portal
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginBottom: 6 }}>
            Welcome, {user?.fullName}
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.85rem', color: '#cbd5e1' }}>
            <span><strong>Role:</strong> {user?.role}</span>
            <span>•</span>
            <span><strong>Organization:</strong> {user?.organization || 'Ballari Institute of Technology & Management'}</span>
            <span>•</span>
            <span><strong>Email:</strong> {user?.email}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            style={{
              padding: '12px 18px',
              fontSize: '0.9rem',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              background: 'rgba(255, 255, 255, 0.08)'
            }}
            onClick={fetchAuthorityDashboard}
            title="Refresh Dashboard"
          >
            <RotateCw size={16} style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }} />
            <span>Refresh</span>
          </button>
          <button
            className="btn btn-accent"
            id="btn-nav-scanner"
            style={{ padding: '12px 20px', fontSize: '0.95rem' }}
            onClick={() => onNavigate('qr-scanner')}
          >
            <ScanLine size={18} /> Open QR Scanner
          </button>
          <button
            className="btn btn-primary"
            style={{ padding: '12px 20px', fontSize: '0.95rem', background: '#1d5b96' }}
            onClick={() => onNavigate('pending-leaves')}
          >
            <Clock size={18} /> Pending Queue ({stats.pendingLeaves})
          </button>
        </div>
      </div>

      {/* 8 Stats KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#f1f5f9', color: 'var(--primary-800)' }}>
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h4>Total Students</h4>
            <div className="value">{stats.totalStudents}</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h4>Pending Leaves</h4>
            <div className="value" style={{ color: '#b45309' }}>{stats.pendingLeaves}</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-icon-wrapper" style={{ background: '#d1fae5', color: '#047857' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <h4>Approved Leaves</h4>
            <div className="value" style={{ color: '#047857' }}>{stats.approvedLeaves}</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-icon-wrapper" style={{ background: '#fee2e2', color: '#b91c1c' }}>
            <XCircle size={24} />
          </div>
          <div className="stat-info">
            <h4>Rejected Leaves</h4>
            <div className="value" style={{ color: '#b91c1c' }}>{stats.rejectedLeaves}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0369a1' }}>
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <h4>Active Leaves</h4>
            <div className="value">{stats.activeLeaves}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            <CalendarCheck2 size={24} />
          </div>
          <div className="stat-info">
            <h4>Completed Leaves</h4>
            <div className="value">{stats.completedLeaves}</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #d4af37' }}>
          <div className="stat-icon-wrapper" style={{ background: '#fef9c3', color: '#854d0e' }}>
            <ScanLine size={24} />
          </div>
          <div className="stat-info">
            <h4>Verification Pending</h4>
            <div className="value" style={{ color: '#854d0e' }}>{stats.verificationPending}</div>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #059669' }}>
          <div className="stat-icon-wrapper" style={{ background: '#ccfbf1', color: '#0f766e' }}>
            <ShieldCheck size={24} />
          </div>
          <div className="stat-info">
            <h4>Verified Leaves</h4>
            <div className="value" style={{ color: '#0f766e' }}>{stats.verifiedLeaves}</div>
          </div>
        </div>
      </div>

      {/* Recent Leave Requests Queue */}
      <div className="table-card">
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Recent Student Leave Requests</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest applications requiring review and verification</span>
          </div>
          <button
            onClick={() => onNavigate('all-leaves')}
            className="btn btn-outline"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            All Leaves Repository <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Leave ID</th>
                <th>Student & USN</th>
                <th>Dept</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentLeaves.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    {loading ? 'Loading requests...' : 'No leave records found in system.'}
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
                      <div style={{ fontWeight: 700, color: 'var(--primary-900)' }}>{leave.student_name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>USN: {leave.usn}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{leave.department_code}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{leave.leave_type}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} color="var(--primary-600)" />
                        <span>{leave.start_date} <span style={{ color: 'var(--text-muted)' }}>to</span> {leave.end_date}</span>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {leave.number_of_days} Day{leave.number_of_days > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td style={{ maxWidth: 170, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {leave.reason}
                    </td>
                    <td>
                      <span className={`status-pill status-${leave.status}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '5px 12px', fontSize: '0.78rem' }}
                        onClick={() => {
                          onSelectLeave(leave.id);
                          onNavigate('pending-leaves');
                        }}
                      >
                        <Eye size={13} /> Review
                      </button>
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
