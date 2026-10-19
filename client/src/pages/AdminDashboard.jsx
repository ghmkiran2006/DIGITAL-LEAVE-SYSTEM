import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Building2,
  Users,
  GraduationCap,
  Activity,
  PlusCircle,
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  School,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  FileText
} from 'lucide-react';

export default function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAdminStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setError(err.message || 'Failed to load system stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="page-transition" style={{ padding: '4px 0' }}>
      {/* Top Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(30, 58, 138, 0.35) 100%)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 9999,
              background: 'rgba(124, 58, 237, 0.25)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#c4b5fd',
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8
            }}
          >
            <ShieldCheck size={14} /> System Administrator Portal
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Platform Overview
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.86rem', marginTop: 4, margin: 0 }}>
            Multi-organisation provisioning, institutional authorities, security oversight & system logs
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={fetchStats}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} /> Refresh
          </button>
          <button
            onClick={() => onNavigate('admin-organisations')}
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              border: 'none',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
            }}
          >
            <PlusCircle size={16} /> Manage Organisations
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28
        }}
      >
        {/* Card 1: Total Organisations */}
        <div
          className="form-card"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            padding: '22px 20px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 20px rgba(124, 58, 237, 0.45)'
            }}
          >
            <Building2 size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Total Organisations</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>
              {loading ? '...' : stats?.totalOrganizations ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: 4, fontWeight: 600 }}>
              {stats?.activeOrganizations ?? 0} Active institutions
            </div>
          </div>
        </div>

        {/* Card 2: Total Authorities */}
        <div
          className="form-card"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            padding: '22px 20px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 20px rgba(217, 119, 6, 0.4)'
            }}
          >
            <Users size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Total Authorities</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>
              {loading ? '...' : stats?.totalAuthorities ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: 4 }}>
              Officers & HODs
            </div>
          </div>
        </div>

        {/* Card 3: Total Students */}
        <div
          className="form-card"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '22px 20px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)'
            }}
          >
            <GraduationCap size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Total Students</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>
              {loading ? '...' : stats?.totalStudents ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#60a5fa', marginTop: 4 }}>
              Across all institutions
            </div>
          </div>
        </div>

        {/* Card 4: Total Applications */}
        <div
          className="form-card"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '22px 20px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 16
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)'
            }}
          >
            <FileText size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Total Leaves Processed</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f8fafc', lineHeight: 1.1 }}>
              {loading ? '...' : stats?.totalLeaves ?? 0}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: 4 }}>
              Paperless digital trail
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div
          onClick={() => onNavigate('admin-organisations')}
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#a78bfa';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(124, 58, 237, 0.2)', color: '#c4b5fd' }}>
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#f8fafc' }}>Organisations</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Create, edit & deactivate schools, colleges, universities</div>
            </div>
          </div>
          <ArrowRight size={18} color="#a78bfa" />
        </div>

        <div
          onClick={() => onNavigate('admin-authorities')}
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#fbbf24';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(217, 119, 6, 0.2)', color: '#fde68a' }}>
              <UserPlus size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#f8fafc' }}>Authority Management</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Provision officers, assign institutions & reset passwords</div>
            </div>
          </div>
          <ArrowRight size={18} color="#fbbf24" />
        </div>

        <div
          onClick={() => onNavigate('admin-audit-logs')}
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#60a5fa';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ padding: 12, borderRadius: 'var(--radius-md)', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#f8fafc' }}>Audit Trail & Security</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Review administrative events & security alerts</div>
            </div>
          </div>
          <ArrowRight size={18} color="#60a5fa" />
        </div>
      </div>

      {/* Recent Platform Activity */}
      <div
        className="form-card"
        style={{
          background: 'rgba(13, 22, 38, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Recent Administrative Activity
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Real-time audit log of institutional changes and authority provisioning
            </span>
          </div>
          <button
            onClick={() => onNavigate('admin-audit-logs')}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '6px 14px' }}
          >
            View Full Trail
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
            Loading platform activity...
          </div>
        ) : !stats?.recentActivity || stats.recentActivity.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
            No recent activity recorded.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', fontSize: '0.84rem' }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>User / Admin</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentActivity.map((act) => {
                  let detailsObj = null;
                  try {
                    detailsObj = typeof act.details === 'string' ? JSON.parse(act.details) : act.details;
                  } catch (e) {
                    detailsObj = act.details;
                  }

                  const isSecurity = act.action.includes('FAIL') || act.action.includes('DENIED');

                  return (
                    <tr key={act.id}>
                      <td style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {act.created_at ? new Date(act.created_at).toLocaleString() : '-'}
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 4,
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            background: isSecurity ? 'rgba(239, 68, 68, 0.2)' : 'rgba(124, 58, 237, 0.2)',
                            color: isSecurity ? '#fca5a5' : '#c4b5fd',
                            border: `1px solid ${isSecurity ? 'rgba(239, 68, 68, 0.4)' : 'rgba(139, 92, 246, 0.4)'}`
                          }}
                        >
                          {act.action}
                        </span>
                      </td>
                      <td style={{ textTransform: 'capitalize', color: '#cbd5e1' }}>{act.entity_type}</td>
                      <td style={{ color: '#f8fafc', fontWeight: 600 }}>{act.user_name || 'System / Guest'}</td>
                      <td style={{ color: '#94a3b8', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {typeof detailsObj === 'object' ? JSON.stringify(detailsObj) : String(detailsObj || '-')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
