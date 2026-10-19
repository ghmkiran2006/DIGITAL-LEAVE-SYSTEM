import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Users,
  PlusCircle,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  Lock,
  Clock,
  CheckCircle2,
  X,
  Eye,
  KeyRound,
  Shield,
  FileCheck
} from 'lucide-react';

export default function AdminSecurityPage() {
  const [securityEvents, setSecurityEvents] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'invites' | 'admins'

  // Invitation generation
  const [inviteEmail, setInviteEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  // Add Admin modal
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminFullName, setAdminFullName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminIdCode, setAdminIdCode] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminRole, setAdminRole] = useState('System Administrator');
  const [adminPassword, setAdminPassword] = useState('');
  const [savingAdmin, setSavingAdmin] = useState(false);

  // New admin created modal
  const [createdAdminData, setCreatedAdminData] = useState(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, adminsRes] = await Promise.all([
        api.getAdminSecurityEvents(),
        api.getAdminList()
      ]);

      if (eventsRes.success) {
        setSecurityEvents(eventsRes.events || []);
      }
      if (adminsRes.success) {
        setAdmins(adminsRes.admins || []);
      }
    } catch (err) {
      console.error('Failed to load security data:', err);
      setError(err.message || 'Failed to load security records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    setGeneratingInvite(true);
    setError('');
    try {
      const res = await api.generateAdminInviteCode(inviteEmail ? inviteEmail.trim() : undefined);
      if (res.success) {
        setGeneratedCode(res.code);
        setSuccess('Admin invitation code created successfully (valid for 7 days).');
        setInviteEmail('');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate invitation code.');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminFullName.trim() || !adminEmail.trim()) {
      setError('Full Name and Email are required.');
      return;
    }

    setSavingAdmin(true);
    setError('');
    try {
      const payload = {
        fullName: adminFullName.trim(),
        email: adminEmail.trim(),
        adminIdCode: adminIdCode.trim().toUpperCase() || undefined,
        phone: adminPhone.trim() || undefined,
        role: adminRole.trim(),
        password: adminPassword.trim() || undefined
      };

      const res = await api.createAdminUser(payload);
      if (res.success) {
        setShowAddAdminModal(false);
        setCreatedAdminData({
          fullName: adminFullName,
          email: adminEmail,
          adminId: res.admin.adminId,
          password: res.temporaryPassword
        });
        setAdminFullName('');
        setAdminEmail('');
        setAdminIdCode('');
        setAdminPhone('');
        setAdminPassword('');
        setSuccess(`Administrator account created for ${adminFullName}.`);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create administrator.');
    } finally {
      setSavingAdmin(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        minute: '2-digit'
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
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--primary-900)', margin: 0 }}>
              Security & Access Control
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Threat monitoring, authorization invitation codes, and system administrators
            </p>
          </div>
        </div>

        <button
          className="btn btn-outline"
          onClick={fetchData}
          style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: '#7c3aed', color: '#7c3aed' }}
        >
          <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            color: '#dc2626',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} />
            <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{error}</span>
          </div>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '10px',
            color: '#059669',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} />
            <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{success}</span>
          </div>
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20,
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: 12
        }}
      >
        <button
          className={`btn ${activeTab === 'events' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('events')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 8,
            background: activeTab === 'events' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : undefined,
            borderColor: activeTab === 'events' ? 'transparent' : '#cbd5e1'
          }}
        >
          <ShieldAlert size={16} />
          <span>Security Events ({securityEvents.length})</span>
        </button>

        <button
          className={`btn ${activeTab === 'invites' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('invites')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 8,
            background: activeTab === 'invites' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : undefined,
            borderColor: activeTab === 'invites' ? 'transparent' : '#cbd5e1'
          }}
        >
          <Key size={16} />
          <span>Admin Invitation Codes</span>
        </button>

        <button
          className={`btn ${activeTab === 'admins' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('admins')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 8,
            background: activeTab === 'admins' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : undefined,
            borderColor: activeTab === 'admins' ? 'transparent' : '#cbd5e1'
          }}
        >
          <Users size={16} />
          <span>Administrators ({admins.length})</span>
        </button>
      </div>

      {/* TAB 1: SECURITY EVENTS */}
      {activeTab === 'events' && (
        <div className="form-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 14 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>
              Real-Time Security & Intrusion Alerts
            </h4>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Showing latest {securityEvents.length} events
            </span>
          </div>

          {securityEvents.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
              <ShieldCheck size={44} style={{ color: '#10b981', marginBottom: 14 }} />
              <h4 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>All Clear — No Security Violations</h4>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>No unauthorized access attempts or suspicious events detected.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '12px 18px' }}>Timestamp</th>
                    <th style={{ padding: '12px 18px' }}>Security Action</th>
                    <th style={{ padding: '12px 18px' }}>Target Entity</th>
                    <th style={{ padding: '12px 18px' }}>Audit Details</th>
                  </tr>
                </thead>
                <tbody>
                  {securityEvents.map((evt) => {
                    const isAlert = evt.action.includes('DENIED') || evt.action.includes('FAIL');
                    return (
                      <tr key={evt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 18px', whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.82rem' }}>
                          {formatTimestamp(evt.created_at)}
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              background: isAlert ? '#fee2e2' : '#ede9fe',
                              color: isAlert ? '#dc2626' : '#7c3aed',
                              border: `1px solid ${isAlert ? '#fca5a5' : '#ddd6fe'}`
                            }}
                          >
                            {evt.action}
                          </span>
                        </td>
                        <td style={{ padding: '12px 18px', color: '#334155', fontWeight: 500 }}>
                          {evt.entity_type} {evt.entity_id ? `(${evt.entity_id})` : ''}
                        </td>
                        <td style={{ padding: '12px 18px', color: '#475569', fontSize: '0.82rem' }}>
                          <code style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: 4 }}>
                            {typeof evt.details === 'string' ? evt.details : JSON.stringify(evt.details)}
                          </code>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVITATION CODES */}
      {activeTab === 'invites' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Generator Card */}
          <div className="form-card" style={{ padding: 24, borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}
              >
                <Key size={18} />
              </div>
              <h3 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>Generate Admin Invitation Key</h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 20 }}>
              Admin registration is strictly protected. Generating an invitation key allows an authorized administrator to register on the Admin Login portal.
            </p>

            <form onSubmit={handleGenerateInvite}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Assign to Email (Optional)</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="e.g. newadmin@system.local (Leave blank for open key)"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={generatingInvite}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  border: 'none',
                  padding: '10px 0'
                }}
              >
                {generatingInvite ? 'Generating Key...' : 'Generate 7-Day Invitation Key'}
              </button>
            </form>

            {generatedCode && (
              <div
                style={{
                  marginTop: 20,
                  padding: 16,
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 10
                }}
              >
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                  NEW INVITATION KEY
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    readOnly
                    value={generatedCode}
                    style={{
                      flex: 1,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '1rem',
                      padding: '8px 10px',
                      background: '#fff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      color: '#7c3aed'
                    }}
                  />
                  <button
                    className="btn btn-outline"
                    onClick={() => copyToClipboard(generatedCode)}
                    style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 8 }}>
                  Provide this key to the new administrator. It expires automatically in 7 days.
                </div>
              </div>
            )}
          </div>

          {/* Setup / Security Guide Card */}
          <div className="form-card" style={{ padding: 24, borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: '#ede9fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#7c3aed'
                }}
              >
                <Lock size={18} />
              </div>
              <h3 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>Access Control Rules</h3>
            </div>

            <ul style={{ paddingLeft: 18, fontSize: '0.85rem', color: '#475569', lineHeight: 1.7, margin: 0 }}>
              <li>
                <strong>Public Admin Signup is Disabled:</strong> Only authorized individuals possessing a valid cryptographic key or invitation token can register.
              </li>
              <li>
                <strong>Default Setup Key:</strong> The platform default setup key is <code>ADMIN-SETUP-KEY-2026</code>.
              </li>
              <li>
                <strong>Strict Role Validation:</strong> Students and Authority accounts attempting to register or login through the Admin portal are rejected with <code>403 Access Denied</code> and logged.
              </li>
              <li>
                <strong>Multi-Tenant Isolation:</strong> System Administrators have cross-institution oversight, whereas Authorities and Students are strictly isolated within their specific <code>organization_id</code>.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 3: ADMINISTRATORS */}
      {activeTab === 'admins' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                setAdminIdCode('ADMIN-' + Math.floor(100 + Math.random() * 900));
                setShowAddAdminModal(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                border: 'none',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
              }}
            >
              <PlusCircle size={16} />
              <span>Add Administrator</span>
            </button>
          </div>

          <div className="form-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 14 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '14px 18px' }}>Admin Officer</th>
                    <th style={{ padding: '14px 18px' }}>Admin ID</th>
                    <th style={{ padding: '14px 18px' }}>Role</th>
                    <th style={{ padding: '14px 18px' }}>Contact Phone</th>
                    <th style={{ padding: '14px 18px' }}>Status</th>
                    <th style={{ padding: '14px 18px' }}>Registered On</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((adm) => (
                    <tr key={adm.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: '#ede9fe',
                              color: '#7c3aed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700
                            }}
                          >
                            {adm.full_name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{adm.full_name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{adm.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 4, fontWeight: 700, color: '#7c3aed' }}>
                          {adm.admin_id}
                        </code>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '3px 9px',
                            borderRadius: 6,
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            background: '#ede9fe',
                            color: '#7c3aed'
                          }}
                        >
                          {adm.role || 'System Administrator'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', color: '#64748b' }}>
                        {adm.mobile_number || '—'}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 9999,
                            fontSize: '0.74rem',
                            fontWeight: 600,
                            background: '#ecfdf5',
                            color: '#059669'
                          }}
                        >
                          {adm.status || 'ACTIVE'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '0.82rem' }}>
                        {formatTimestamp(adm.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD ADMINISTRATOR */}
      {showAddAdminModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 520, width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff'
                  }}
                >
                  <PlusCircle size={20} />
                </div>
                <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--primary-900)' }}>
                  Add System Administrator
                </h3>
              </div>
              <button onClick={() => setShowAddAdminModal(false)} className="icon-btn" style={{ border: 'none' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateAdmin}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Master Administrator"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Admin Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="admin@system.local"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Admin ID Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={adminIdCode}
                    onChange={(e) => setAdminIdCode(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+91 9876543210"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password (Optional)</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Auto-generated if blank"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddAdminModal(false)}
                  disabled={savingAdmin}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingAdmin}
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none' }}
                >
                  {savingAdmin ? 'Creating...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN CREATED SUCCESS */}
      {createdAdminData && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 460, width: '90%' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <h3 style={{ margin: '0 0 6px 0', color: '#1e293b', fontWeight: 700 }}>
                Admin Account Created
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                Secure credentials for this administrator:
              </p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Admin:</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{createdAdminData.fullName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Email:</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{createdAdminData.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Admin ID:</span>
                <span style={{ fontWeight: 700, color: '#7c3aed' }}>{createdAdminData.adminId}</span>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                  TEMPORARY PASSWORD
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    readOnly
                    value={createdAdminData.password}
                    style={{
                      flex: 1,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '1rem',
                      padding: '8px 10px',
                      background: '#fff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      color: '#0f172a'
                    }}
                  />
                  <button
                    className="btn btn-outline"
                    onClick={() => copyToClipboard(createdAdminData.password)}
                    style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={() => setCreatedAdminData(null)}
                style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none', minWidth: 140 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
