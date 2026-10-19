import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Power,
  Trash2,
  School,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink
} from 'lucide-react';

export default function AdminOrganisationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [deactivatingOrg, setDeactivatingOrg] = useState(null);
  const [deletingOrg, setDeletingOrg] = useState(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('College');
  const [formShortName, setFormShortName] = useState('');
  const [formAppName, setFormAppName] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formWebsite, setFormWebsite] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOrganizations();
      if (res.success) {
        setOrganizations(res.organizations || []);
      }
    } catch (err) {
      console.error('Failed to load organisations:', err);
      setError(err.message || 'Failed to fetch organisations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const openAddModal = () => {
    setEditingOrg(null);
    setFormName('');
    setFormType('College');
    setFormShortName('');
    setFormAppName('');
    setFormLogoUrl('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setFormWebsite('');
    setError('');
    setShowAddModal(true);
  };

  const openEditModal = (org) => {
    setEditingOrg(org);
    setFormName(org.name || '');
    setFormType(org.organization_type || 'College');
    setFormShortName(org.short_name || '');
    setFormAppName(org.app_name || '');
    setFormLogoUrl(org.logo_url || '');
    setFormEmail(org.email || '');
    setFormPhone(org.phone || '');
    setFormAddress(org.address || '');
    setFormWebsite(org.website || '');
    setError('');
    setShowAddModal(true);
  };

  const handleSaveOrg = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Organisation Name is required.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: formName.trim(),
        organizationType: formType,
        shortName: formShortName.trim(),
        appName: formAppName.trim(),
        logoUrl: formLogoUrl.trim() || null,
        email: formEmail.trim() || null,
        phone: formPhone.trim() || null,
        address: formAddress.trim() || null,
        website: formWebsite.trim() || null
      };

      if (editingOrg) {
        await api.updateAdminOrganization(editingOrg.id, payload);
        setSuccess(`Organisation "${formName}" updated successfully.`);
      } else {
        await api.createAdminOrganization(payload);
        setSuccess(`Organisation "${formName}" created successfully.`);
      }

      setShowAddModal(false);
      fetchOrgs();
    } catch (err) {
      setError(err.message || 'Failed to save organisation.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!deactivatingOrg) return;
    setSaving(true);
    try {
      const res = await api.toggleOrganizationStatus(deactivatingOrg.id);
      if (res.success) {
        setSuccess(res.message);
        setDeactivatingOrg(null);
        fetchOrgs();
      }
    } catch (err) {
      setError(err.message || 'Failed to update organisation status.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!deletingOrg) return;
    setSaving(true);
    try {
      const res = await api.deleteAdminOrganization(deletingOrg.id);
      if (res.success) {
        setSuccess(res.message);
        setDeletingOrg(null);
        fetchOrgs();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete organisation.');
    } finally {
      setSaving(false);
    }
  };

  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.short_name.toLowerCase().includes(search.toLowerCase()) ||
      (org.email && org.email.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || org.organization_type === typeFilter;
    const orgStatus = org.status || 'ACTIVE';
    const matchesStatus = statusFilter === 'ALL' || orgStatus === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="page-transition">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
            Organisations Management
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '4px 0 0' }}>
            Provision, customize and manage schools, colleges, and universities across the platform
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchOrgs} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem' }}>
            <RefreshCw size={15} className={loading ? 'spinning' : ''} /> Refresh
          </button>
          <button
            onClick={openAddModal}
            id="add-organization-btn"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              border: 'none',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
            }}
          >
            <PlusCircle size={16} /> Add Organisation
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#6ee7b7', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={18} /> {success}
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {/* Filters Bar */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', gap: 12, flex: '1 1 300px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
            <input
              type="text"
              placeholder="Search by name, short code, or email..."
              className="form-control"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ background: '#0d1829', color: '#f8fafc', paddingLeft: 38, fontSize: '0.86rem' }}
            />
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-control"
            style={{ background: '#0d1829', color: '#f8fafc', width: 'auto', fontSize: '0.84rem' }}
          >
            <option value="ALL">All Types</option>
            <option value="School">School (1st–10th Std)</option>
            <option value="College">College (Semesters)</option>
            <option value="University">University</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-control"
            style={{ background: '#0d1829', color: '#f8fafc', width: 'auto', fontSize: '0.84rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Organisations Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          Loading organisations...
        </div>
      ) : filteredOrgs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Building2 size={42} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>No organisations match your criteria</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.84rem' }}>Try clearing filters or add a new institution.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {filteredOrgs.map((org) => {
            const isDeactivated = org.status === 'DEACTIVATED';
            const isPrimary = org.id === 'org-bitm';

            const typeColor =
              org.organization_type === 'School'
                ? '#10b981'
                : org.organization_type === 'University'
                ? '#8b5cf6'
                : '#3b82f6';

            return (
              <div
                key={org.id}
                style={{
                  background: 'rgba(13, 22, 38, 0.85)',
                  border: `1px solid ${isDeactivated ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.25)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                  opacity: isDeactivated ? 0.75 : 1,
                  position: 'relative'
                }}
              >
                {/* Top Badge Row */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 9999,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: `${typeColor}20`,
                          color: typeColor,
                          border: `1px solid ${typeColor}50`,
                          textTransform: 'uppercase'
                        }}
                      >
                        {org.organization_type}
                      </span>
                      {isPrimary && (
                        <span style={{ padding: '3px 8px', borderRadius: 9999, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: '1px solid rgba(251, 191, 36, 0.4)' }}>
                          Primary Default
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: isDeactivated ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: isDeactivated ? '#fca5a5' : '#6ee7b7',
                        border: `1px solid ${isDeactivated ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                      }}
                    >
                      {isDeactivated ? 'DEACTIVATED' : 'ACTIVE'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>
                    {org.name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 600, marginBottom: 14 }}>
                    Code: {org.short_name} • App: {org.app_name}
                  </div>

                  {/* Metadata Chips */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.78rem', color: '#94a3b8', marginBottom: 16 }}>
                    {org.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Mail size={14} color="#64748b" /> {org.email}
                      </div>
                    )}
                    {org.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Phone size={14} color="#64748b" /> {org.phone}
                      </div>
                    )}
                    {org.address && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <MapPin size={14} color="#64748b" /> {org.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Counts & Actions */}
                <div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 8,
                      background: 'rgba(15, 23, 42, 0.6)',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 16,
                      textAlign: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                        {org.authority_count ?? 0}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Authorities</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                        {org.student_count ?? 0}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Students</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                        {org.leave_count ?? 0}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Leaves</div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => openEditModal(org)}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '7px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    >
                      <Edit2 size={14} /> Edit
                    </button>

                    <button
                      onClick={() => setDeactivatingOrg(org)}
                      style={{
                        padding: '7px 12px',
                        fontSize: '0.8rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: isDeactivated ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isDeactivated ? '#6ee7b7' : '#fca5a5',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Power size={14} /> {isDeactivated ? 'Activate' : 'Deactivate'}
                    </button>

                    {!isPrimary && (
                      <button
                        onClick={() => setDeletingOrg(org)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#f87171',
                          cursor: 'pointer'
                        }}
                        title="Delete Organisation"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showAddModal && (
        <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1100 }}>
          <div
            className="modal-container"
            style={{
              maxWidth: 600,
              width: '100%',
              background: '#0d1829',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              borderRadius: 'var(--radius-xl)',
              padding: 28,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={24} color="#a78bfa" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  {editingOrg ? 'Edit Organisation' : 'Add New Organisation'}
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveOrg} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                  Organisation Name *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ballari Institute of Technology and Management"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{ background: '#091322', color: '#f8fafc' }}
                  required
                />
              </div>

              {/* Type & Short Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                    Organisation Type *
                  </label>
                  <select
                    className="form-control"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    style={{ background: '#091322', color: '#f8fafc' }}
                  >
                    <option value="School">School (1st to 10th Standards)</option>
                    <option value="College">College (Departments & Semesters)</option>
                    <option value="University">University (Faculties & Programs)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                    Short Code (e.g. BITM)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. BITM"
                    value={formShortName}
                    onChange={(e) => setFormShortName(e.target.value.toUpperCase())}
                    style={{ background: '#091322', color: '#f8fafc' }}
                  />
                </div>
              </div>

              {/* App / Branding Name */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                  Application / System Title
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. BITM Smart Leave System"
                  value={formAppName}
                  onChange={(e) => setFormAppName(e.target.value)}
                  style={{ background: '#091322', color: '#f8fafc' }}
                />
              </div>

              {/* Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                    Official Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="contact@institution.edu"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    style={{ background: '#091322', color: '#f8fafc' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                    Official Phone
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+91 83922 24800"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    style={{ background: '#091322', color: '#f8fafc' }}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                  Campus Address
                </label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Campus address, city, state, pin"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  style={{ background: '#091322', color: '#f8fafc', resize: 'vertical' }}
                />
              </div>

              {/* Website URL */}
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                  Website URL
                </label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://www.institution.edu"
                  value={formWebsite}
                  onChange={(e) => setFormWebsite(e.target.value)}
                  style={{ background: '#091322', color: '#f8fafc' }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px 22px',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Saving...' : editingOrg ? 'Update Organisation' : 'Create Organisation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DEACTIVATION MODAL */}
      {deactivatingOrg && (
        <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1100 }}>
          <div
            className="modal-container"
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#0d1829',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-xl)',
              padding: 28,
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                margin: '0 auto 16px'
              }}
            >
              <Power size={26} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>
              Confirm Organisation Deactivation
            </h3>

            <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: 20 }}>
              This will prevent users belonging to <strong>{deactivatingOrg.name}</strong> from accessing the application. Existing leave records and student profiles are preserved safely.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeactivatingOrg(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={saving}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Processing...' : deactivatingOrg.status === 'DEACTIVATED' ? 'Reactivate' : 'Deactivate Organisation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingOrg && (
        <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 1100 }}>
          <div
            className="modal-container"
            style={{
              maxWidth: 480,
              width: '100%',
              background: '#0d1829',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: 'var(--radius-xl)',
              padding: 28,
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '2px solid rgba(239, 68, 68, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                margin: '0 auto 16px'
              }}
            >
              <Trash2 size={26} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginBottom: 8 }}>
              Permanently Delete Organisation?
            </h3>

            <p style={{ fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: 20 }}>
              Are you sure you want to permanently delete <strong>{deletingOrg.name}</strong>? This action cannot be undone and will remove associated data.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeletingOrg(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button
                onClick={handleDeleteOrg}
                disabled={saving}
                style={{
                  flex: 1,
                  background: '#dc2626',
                  border: 'none',
                  color: '#fff',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {saving ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
