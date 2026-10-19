import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShieldAlert, RefreshCw, Clock, User, Info } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs();
      if (res.success) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error('Fetch audit logs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadgeColor = (action) => {
    if (action.includes('APPROVED') || action.includes('VERIFIED')) return 'status-VERIFIED';
    if (action.includes('REJECTED') || action.includes('FAILED')) return 'status-REJECTED';
    if (action.includes('SUBMITTED') || action.includes('SCAN')) return 'status-PENDING';
    return 'status-COMPLETED';
  };

  return (
    <div className="page-transition">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-900)' }}>
            System Audit Trail
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Tamper-evident logs of authentications, leave approvals, QR scans, and return verifications
          </p>
        </div>

        <button onClick={fetchLogs} className="btn btn-outline" style={{ padding: '7px 14px' }}>
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Event Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    {loading ? 'Retrieving audit logs...' : 'No audit records logged yet.'}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  let detailsObj = null;
                  try {
                    detailsObj = JSON.parse(log.details);
                  } catch (e) {
                    detailsObj = log.details;
                  }

                  return (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td>
                        <strong style={{ fontSize: '0.86rem' }}>{log.user_name || 'System / Guest'}</strong>
                        {log.email && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{log.email}</div>}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', textTransform: 'capitalize', fontWeight: 600 }}>
                          {log.user_type || 'System'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${getActionBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {log.entity_type}
                      </td>
                      <td style={{ fontSize: '0.8rem', maxWidth: 280 }}>
                        <code style={{ background: '#f8fafc', padding: '3px 6px', borderRadius: 4, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {typeof detailsObj === 'object' ? JSON.stringify(detailsObj) : String(detailsObj || '-')}
                        </code>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
