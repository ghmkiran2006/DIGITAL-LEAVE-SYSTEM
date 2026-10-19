import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Calendar,
  Eye,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Building2,
  Users,
  KeyRound,
  Trash2
} from 'lucide-react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  // Selected Log Details Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entityType = entityFilter;

      const res = await api.getAdminAuditLogs(params);
      if (res.success) {
        setLogs(res.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadgeColor = (action = '') => {
    const act = action.toUpperCase();
    if (act.includes('DELETE') || act.includes('DENIED') || act.includes('DEACTIVATED') || act.includes('FAIL')) {
      return { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' };
    }
    if (act.includes('CREATE') || act.includes('APPROVE') || act.includes('ACTIVATED') || act.includes('LOGIN_SUCCESS')) {
      return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
    }
    if (act.includes('PASSWORD') || act.includes('SECURITY') || act.includes('ADMIN')) {
      return { bg: '#ede9fe', text: '#7c3aed', border: '#ddd6fe' };
    }
    if (act.includes('UPDATE') || act.includes('EDIT')) {
      return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
    }
    return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="page-transition">
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--primary-900)', margin: 0 }}>
              System Audit Trail
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Immutable system-wide activity log, administrative changes, and security compliance records
            </p>
          </div>
        </div>

        <button
          className="btn btn-outline"
          onClick={fetchLogs}
          style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: '#7c3aed', color: '#7c3aed' }}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="form-card"
        style={{
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          background: '#ffffff',
          borderRadius: 14,
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={17} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search action, details, user name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 38, width: '100%', height: 40 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#64748b" />
          <select
            className="form-control"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            style={{ height: 40, minWidth: 160 }}
          >
            <option value="">All Entity Types</option>
            <option value="organization">Organisation</option>
            <option value="authority">Authority</option>
            <option value="student">Student</option>
            <option value="leave">Leave Request</option>
            <option value="admin">Admin</option>
            <option value="admin_invitation">Admin Invitation</option>
            <option value="auth">Authentication</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={16} color="#64748b" />
          <select
            className="form-control"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ height: 40, minWidth: 190 }}
          >
            <option value="">All Actions</option>
            <option value="ADMIN_LOGIN_SUCCESS">Admin Login Success</option>
            <option value="AUTHORITY_LOGIN_SUCCESS">Authority Login Success</option>
            <option value="STUDENT_LOGIN_SUCCESS">Student Login Success</option>
            <option value="UNAUTHORIZED_ROLE_ACCESS_DENIED">Role Access Denied</option>
            <option value="ADMIN_ORGANIZATION_CREATED">Org Created</option>
            <option value="ADMIN_ORGANIZATION_UPDATED">Org Updated</option>
            <option value="ADMIN_ORGANIZATION_DEACTIVATED">Org Deactivated</option>
            <option value="ADMIN_ORGANIZATION_ACTIVATED">Org Activated</option>
            <option value="ADMIN_AUTHORITY_CREATED">Authority Created</option>
            <option value="ADMIN_AUTHORITY_PASSWORD_RESET">Password Reset</option>
          </select>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ height: 40, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none' }}
        >
          Filter
        </button>
      </form>

      {/* Logs Table */}
      <div className="form-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 14 }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <div>Loading audit log records...</div>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            <FileText size={44} style={{ color: '#cbd5e1', marginBottom: 14 }} />
            <h4 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>No audit records found</h4>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>
              No audit records matched your current query criteria.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '14px 18px' }}>Timestamp</th>
                  <th style={{ padding: '14px 18px' }}>Action</th>
                  <th style={{ padding: '14px 18px' }}>Actor / User</th>
                  <th style={{ padding: '14px 18px' }}>Entity Type</th>
                  <th style={{ padding: '14px 18px' }}>Summary</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const style = getActionBadgeColor(log.action);
                  let parsedDetails = null;
                  try {
                    parsedDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                  } catch {
                    parsedDetails = { raw: log.details };
                  }

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '14px 18px', whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={13} color="#94a3b8" />
                          <span>{formatTimestamp(log.created_at)}</span>
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            letterSpacing: '0.3px',
                            background: style.bg,
                            color: style.text,
                            border: `1px solid ${style.border}`
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>
                            {log.user_name || (parsedDetails?.adminId ? `Admin (${parsedDetails.adminId})` : 'System / Actor')}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                            {log.user_email || parsedDetails?.email || log.user_id || 'System'}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: '0.75rem',
                            background: '#f1f5f9',
                            color: '#475569',
                            textTransform: 'uppercase',
                            fontWeight: 600
                          }}
                        >
                          {log.entity_type || 'SYSTEM'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', maxWidth: 320 }}>
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: '#475569',
                            fontSize: '0.82rem'
                          }}
                          title={typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                        >
                          {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          className="btn btn-outline"
                          onClick={() => setSelectedLog(log)}
                          title="View Payload Details"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 560, width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: '#ede9fe',
                    color: '#7c3aed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--primary-900)' }}>
                    Audit Event Details
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>ID: {selectedLog.id}</span>
                </div>
              </div>
              <button onClick={() => setSelectedLog(null)} className="icon-btn" style={{ border: 'none' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ACTION</div>
                <div style={{ fontWeight: 700, color: '#1e293b', marginTop: 4 }}>{selectedLog.action}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ENTITY</div>
                <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 4 }}>
                  {selectedLog.entity_type} ({selectedLog.entity_id || 'N/A'})
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ACTOR / USER</div>
                <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 4 }}>
                  {selectedLog.user_name || selectedLog.user_id || 'System'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{selectedLog.user_email || '—'}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TIMESTAMP</div>
                <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 4 }}>
                  {formatTimestamp(selectedLog.created_at)}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                RAW EVENT DETAILS & METADATA
              </label>
              <pre
                style={{
                  background: '#0f172a',
                  color: '#38bdf8',
                  padding: 14,
                  borderRadius: 8,
                  fontSize: '0.8rem',
                  overflowX: 'auto',
                  maxHeight: 220
                }}
              >
                {(() => {
                  try {
                    const parsed = typeof selectedLog.details === 'string' ? JSON.parse(selectedLog.details) : selectedLog.details;
                    return JSON.stringify(parsed, null, 2);
                  } catch {
                    return selectedLog.details || '{}';
                  }
                })()}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={() => setSelectedLog(null)}
                style={{ background: '#7c3aed', border: 'none' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
