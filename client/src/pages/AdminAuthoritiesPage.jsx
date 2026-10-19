import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  KeyRound,
  Power,
  Trash2,
  Building2,
  Mail,
  Phone,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Copy,
  Check,
  UserCheck
} from 'lucide-react';

export default function AdminAuthoritiesPage() {
  const [authorities, setAuthorities] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [orgFilter, setOrgFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAuth, setEditingAuth] = useState(null);
  const [resettingAuth, setResettingAuth] = useState(null);
  const [deactivatingAuth, setDeactivatingAuth] = useState(null);
  const [deletingAuth, setDeletingAuth] = useState(null);

  // Success / Generated Password Modal
  const [passwordModalData, setPasswordModalData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [authorityIdCode, setAuthorityIdCode] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [designation, setDesignation] = useState('HOD');
  const [organizationId, setOrganizationId] = useState('');
  const [password, setPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const designationsList = [
    'Principal',
    'Vice Principal',
    'Head of Department (HOD)',
    'Proctor / Mentor',
    'Faculty / Teacher',
    'School Head / HM',
    'Registrar',
    'Dean of Academics',
    'Administrative Officer',
    'Authorized Leave Officer'
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [authRes, orgRes] = await Promise.all([
        api.getAdminAuthorities(),
        api.getAdminOrganizations()
      ]);

      if (authRes.success) {
        setAuthorities(authRes.authorities || []);
      }
      if (orgRes.success) {
        setOrganizations(orgRes.organizations || []);
        if (orgRes.organizations?.length > 0 && !organizationId) {
          setOrganizationId(orgRes.organizations[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load authorities:', err);
      setError(err.message || 'Failed to load authorities data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingAuth(null);
    setFullName('');
    setEmail('');
    setAuthorityIdCode('AUTH-' + Math.floor(100 + Math.random() * 900));
    setMobileNumber('');
    setDesignation('Head of Department (HOD)');
    if (organizations.length > 0) {
      setOrganizationId(organizations[0].id);
    }
    setPassword('');
    setError('');
    setShowAddModal(true);
  };

  const openEditModal = (auth) => {
    setEditingAuth(auth);
    setFullName(auth.full_name || '');
    setMobileNumber(auth.mobile_number || '');
    setDesignation(auth.role || 'Authorized Leave Officer');
    setOrganizationId(auth.organization_id || '');
    setAuthorityIdCode(auth.authority_id_code || '');
    setError('');
  };

  const handleCreateAuthority = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !organizationId) {
      setError('Please provide Full Name, Email, and select an Organisation.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        authorityIdCode: authorityIdCode.trim().toUpperCase(),
        mobileNumber: mobileNumber.trim(),
        designation: designation.trim(),
        organizationId,
        password: password.trim() || undefined
      };

      const res = await api.createAdminAuthority(payload);
      if (res.success) {
        setShowAddModal(false);
        setPasswordModalData({
          title: 'Authority Account Created',
          name: fullName,
          email: email.trim(),
          password: res.initialPassword,
          note: 'Share these login credentials securely with the authority. They can log in via Authority Login.'
        });
        setSuccess(`Authority "${fullName}" created successfully.`);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create authority.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAuthority = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        designation: designation.trim(),
        organizationId,
        authorityIdCode: authorityIdCode.trim().toUpperCase()
      };

      const res = await api.updateAdminAuthority(editingAuth.id, payload);
      if (res.success) {
        setEditingAuth(null);
        setSuccess('Authority details updated successfully.');
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to update authority.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resettingAuth) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.resetAuthorityPassword(resettingAuth.id);
      if (res.success) {
        const targetAuth = resettingAuth;
        setResettingAuth(null);
        setPasswordModalData({
          title: 'Password Reset Successful',
          name: targetAuth.full_name,
          email: targetAuth.email,
          password: res.temporaryPassword,
          note: 'A new temporary password has been set. The authority will be required to change it on their next login.'
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to reset authority password.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!deactivatingAuth) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.toggleAuthorityStatus(deactivatingAuth.id);
      if (res.success) {
        setDeactivatingAuth(null);
        setSuccess(res.message);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to toggle authority status.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAuthority = async () => {
    if (!deletingAuth) return;
    setSaving(true);
    setError('');
    try {
      const res = await api.deleteAdminAuthority(deletingAuth.id);
      if (res.success) {
        setDeletingAuth(null);
        setSuccess(res.message);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete authority.');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter authorities
  const filteredAuthorities = authorities.filter((auth) => {
    const matchesSearch =
      auth.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      auth.email?.toLowerCase().includes(search.toLowerCase()) ||
      auth.authority_id_code?.toLowerCase().includes(search.toLowerCase()) ||
      auth.role?.toLowerCase().includes(search.toLowerCase()) ||
      auth.organization_name?.toLowerCase().includes(search.toLowerCase());

    const matchesOrg = orgFilter === 'ALL' || auth.organization_id === orgFilter;
    const matchesStatus = statusFilter === 'ALL' || (auth.status || 'ACTIVE') === statusFilter;

    return matchesSearch && matchesOrg && matchesStatus;
  });

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
        <div>
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
              <Users size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--primary-900)', margin: 0 }}>
                Authority Management
              </h1>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Cross-institution authority accounts, designations, access control, and password resets
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-outline"
            onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: '#7c3aed', color: '#7c3aed' }}
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={openAddModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
            }}
          >
            <PlusCircle size={17} />
            <span>Add Authority</span>
          </button>
        </div>
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

      {/* Filter / Search Bar */}
      <div
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
            placeholder="Search by Name, Email, Authority ID, Role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 38, width: '100%', height: 40 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Building2 size={16} color="#64748b" />
          <select
            className="form-control"
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            style={{ height: 40, minWidth: 180 }}
          >
            <option value="ALL">All Organisations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name} ({org.short_name || org.id})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#64748b" />
          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: 40, minWidth: 140 }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Authorities List Table */}
      <div className="form-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 14 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <div>Loading registered authorities...</div>
          </div>
        ) : filteredAuthorities.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
            <Users size={44} style={{ color: '#cbd5e1', marginBottom: 14 }} />
            <h4 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>No authorities found</h4>
            <p style={{ margin: 0, fontSize: '0.88rem' }}>
              {search || orgFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your search filters.'
                : 'Click "Add Authority" to register a new authority officer.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                  <th style={{ padding: '14px 18px' }}>Authority Officer</th>
                  <th style={{ padding: '14px 18px' }}>ID Code</th>
                  <th style={{ padding: '14px 18px' }}>Role / Designation</th>
                  <th style={{ padding: '14px 18px' }}>Organisation</th>
                  <th style={{ padding: '14px 18px' }}>Contact</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuthorities.map((auth) => {
                  const isActive = (auth.status || 'ACTIVE') === 'ACTIVE';
                  const isPrimaryBitm = auth.email?.toLowerCase() === 'bitm@gmail.com';

                  return (
                    <tr
                      key={auth.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                        background: isActive ? '#ffffff' : '#fcfcfd'
                      }}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
                              color: '#7c3aed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.9rem'
                            }}
                          >
                            {auth.full_name?.charAt(0) || 'A'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {auth.full_name}
                              {isPrimaryBitm && (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    fontSize: '0.68rem',
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    background: '#fef3c7',
                                    color: '#b45309',
                                    fontWeight: 700
                                  }}
                                >
                                  Default Authority
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{auth.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <code
                          style={{
                            background: '#f1f5f9',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: '#475569'
                          }}
                        >
                          {auth.authority_id_code || 'AUTH'}
                        </code>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 9px',
                            borderRadius: 6,
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            background: '#eff6ff',
                            color: '#1d4ed8'
                          }}
                        >
                          <Shield size={13} />
                          {auth.role || 'Authority'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 500, color: '#334155' }}>
                          {auth.organization_name || 'Ballari Institute of Technology and Management'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {auth.organization_type || 'Institution'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.78rem', color: '#64748b' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Mail size={12} color="#94a3b8" />
                            {auth.email}
                          </span>
                          {auth.mobile_number && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Phone size={12} color="#94a3b8" />
                              {auth.mobile_number}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 10px',
                            borderRadius: 9999,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: isActive ? '#ecfdf5' : '#fef2f2',
                            color: isActive ? '#059669' : '#dc2626'
                          }}
                        >
                          {isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {/* Edit */}
                          <button
                            className="btn btn-outline"
                            title="Edit Authority"
                            onClick={() => openEditModal(auth)}
                            style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                          >
                            <Edit2 size={14} />
                          </button>

                          {/* Reset Password */}
                          <button
                            className="btn btn-outline"
                            title="Reset Password"
                            onClick={() => setResettingAuth(auth)}
                            style={{ padding: '6px 10px', fontSize: '0.78rem', borderColor: '#eab308', color: '#b45309' }}
                          >
                            <KeyRound size={14} />
                          </button>

                          {/* Toggle Active / Deactivate */}
                          <button
                            className="btn btn-outline"
                            title={isActive ? 'Deactivate Account' : 'Activate Account'}
                            disabled={isPrimaryBitm}
                            onClick={() => setDeactivatingAuth(auth)}
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.78rem',
                              borderColor: isActive ? '#f97316' : '#10b981',
                              color: isActive ? '#ea580c' : '#059669',
                              opacity: isPrimaryBitm ? 0.4 : 1,
                              cursor: isPrimaryBitm ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <Power size={14} />
                          </button>

                          {/* Delete */}
                          <button
                            className="btn btn-outline"
                            title={isPrimaryBitm ? 'Cannot delete default authority' : 'Delete Authority'}
                            disabled={isPrimaryBitm}
                            onClick={() => setDeletingAuth(auth)}
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.78rem',
                              borderColor: '#ef4444',
                              color: '#dc2626',
                              opacity: isPrimaryBitm ? 0.4 : 1,
                              cursor: isPrimaryBitm ? 'not-allowed' : 'pointer'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD AUTHORITY */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 560, width: '90%' }}>
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
                  Add Authority Officer
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="icon-btn" style={{ border: 'none' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateAuthority}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dr. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Official Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="officer@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Authority ID Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="AUTH-101"
                    value={authorityIdCode}
                    onChange={(e) => setAuthorityIdCode(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Organisation *</label>
                  <select
                    className="form-control"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    required
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.organization_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Designation / Role *</label>
                  <select
                    className="form-control"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  >
                    {designationsList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+91 9876543210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password (Optional)</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Auto-generated if blank"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none' }}
                  disabled={saving}
                >
                  {saving ? 'Creating...' : 'Create Authority Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT AUTHORITY */}
      {editingAuth && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 540, width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontWeight: 700, color: 'var(--primary-900)' }}>
                Edit Authority Officer
              </h3>
              <button onClick={() => setEditingAuth(null)} className="icon-btn" style={{ border: 'none' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, marginBottom: 16, fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateAuthority}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Email Address (Read-only)</label>
                <input
                  type="email"
                  className="form-control"
                  value={editingAuth.email}
                  disabled
                  style={{ background: '#f8fafc', color: '#64748b' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Authority ID Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={authorityIdCode}
                    onChange={(e) => setAuthorityIdCode(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div className="form-group">
                  <label className="form-label">Organisation</label>
                  <select
                    className="form-control"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Role / Designation</label>
                  <select
                    className="form-control"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  >
                    {designationsList.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditingAuth(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none' }}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RESET PASSWORD CONFIRMATION */}
      {resettingAuth && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 460, width: '90%' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}
              >
                <KeyRound size={26} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontWeight: 700 }}>
                Reset Authority Password
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                Are you sure you want to reset the login password for{' '}
                <strong>{resettingAuth.full_name}</strong> ({resettingAuth.email})?
              </p>
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: '0.82rem',
                color: '#475569',
                marginBottom: 20
              }}
            >
              • A new temporary password will be generated.
              <br />
              • The authority will be required to change it upon next login.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setResettingAuth(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleResetPassword}
                disabled={saving}
                style={{ background: '#d97706', border: 'none', color: '#fff' }}
              >
                {saving ? 'Resetting...' : 'Confirm Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DEACTIVATE / ACTIVATE CONFIRMATION */}
      {deactivatingAuth && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 460, width: '90%' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: (deactivatingAuth.status || 'ACTIVE') === 'ACTIVE' ? '#fee2e2' : '#ecfdf5',
                  color: (deactivatingAuth.status || 'ACTIVE') === 'ACTIVE' ? '#dc2626' : '#059669',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}
              >
                <Power size={26} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontWeight: 700 }}>
                {(deactivatingAuth.status || 'ACTIVE') === 'ACTIVE' ? 'Deactivate' : 'Activate'} Authority?
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                {(deactivatingAuth.status || 'ACTIVE') === 'ACTIVE'
                  ? `Deactivating ${deactivatingAuth.full_name} will immediately prevent them from logging in or approving/rejecting leave applications.`
                  : `Activating ${deactivatingAuth.full_name} will restore their login access and allow them to review leave requests.`}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeactivatingAuth(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleToggleStatus}
                disabled={saving}
                style={{
                  background: (deactivatingAuth.status || 'ACTIVE') === 'ACTIVE' ? '#dc2626' : '#059669',
                  border: 'none',
                  color: '#fff'
                }}
              >
                {saving
                  ? 'Updating...'
                  : (deactivatingAuth.status || 'ACTIVE') === 'ACTIVE'
                  ? 'Yes, Deactivate'
                  : 'Yes, Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE CONFIRMATION */}
      {deletingAuth && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 460, width: '90%' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: '#fee2e2',
                  color: '#dc2626',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12
                }}
              >
                <AlertTriangle size={26} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontWeight: 700 }}>
                Delete Authority Account
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                Are you sure you want to permanently delete the authority account for{' '}
                <strong>{deletingAuth.full_name}</strong>? This action cannot be undone.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeletingAuth(null)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteAuthority}
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: PASSWORD DISPLAY MODAL */}
      {passwordModalData && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 480, width: '90%' }}>
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
                {passwordModalData.title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                {passwordModalData.note}
              </p>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '16px',
                marginBottom: 20
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Officer:</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{passwordModalData.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Email:</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{passwordModalData.email}</span>
              </div>

              <div style={{ marginTop: 12 }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                  TEMPORARY PASSWORD
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    readOnly
                    value={passwordModalData.password}
                    style={{
                      flex: 1,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '1rem',
                      padding: '8px 12px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      color: '#0f172a'
                    }}
                  />
                  <button
                    className="btn btn-outline"
                    onClick={() => copyToClipboard(passwordModalData.password)}
                    style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {copied ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={() => setPasswordModalData(null)}
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  border: 'none',
                  minWidth: 140
                }}
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
