import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Settings,
  Lock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Trash2,
  PlusCircle,
  Save,
  User,
  ShieldAlert,
  Image,
  Globe,
  RotateCw
} from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ type: '', text: '' });

  // Authority Profile State
  const [authName, setAuthName] = useState(user?.fullName || '');
  const [authEmail, setAuthEmail] = useState(user?.email || '');
  const [authPhone, setAuthPhone] = useState(user?.phoneNumber || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileStatus, setProfileStatus] = useState({ type: '', text: '' });

  // Current Institution State (Only this institution shown!)
  const [orgData, setOrgData] = useState({
    id: user?.organizationId || 'org-bitm',
    name: user?.organizationName || 'Ballari Institute of Technology and Management',
    short_name: user?.organizationShortName || 'BITM',
    app_name: user?.appName || 'Digital Leave System',
    organization_type: user?.organizationType || 'College',
    logo_url: user?.organizationLogo || '',
    address: 'Jnana Gangothri Campus, Ballari, Karnataka 583104',
    email: 'info@bitm.edu.in',
    phone: '+91 8392 237150'
  });
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgStatus, setOrgStatus] = useState({ type: '', text: '' });

  // Create Institution Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrgType, setNewOrgType] = useState('School'); // Asks School or College or University
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgShort, setNewOrgShort] = useState('');
  const [newOrgApp, setNewOrgApp] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Delete Institution Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load current institution data
  useEffect(() => {
    async function loadCurrentOrg() {
      if (!user?.organizationId) return;
      try {
        const res = await api.getOrganization(user.organizationId);
        if (res.success && res.organization) {
          setOrgData(res.organization);
        }
      } catch (err) {
        console.error('Failed to load institution details:', err);
      }
    }
    loadCurrentOrg();
  }, [user?.organizationId]);

  // Handle Authority Profile Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileStatus({ type: '', text: '' });
    setProfileLoading(true);

    try {
      const res = await api.updateProfile({
        fullName: authName.trim(),
        email: authEmail.trim(),
        phoneNumber: authPhone.trim()
      });
      if (res.success) {
        setProfileStatus({ type: 'success', text: 'Authority profile updated successfully.' });
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      setProfileStatus({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle Password Change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.authorityChangePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordStatus({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordStatus({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Institution Branding Update
  const handleOrgUpdate = async (e) => {
    e.preventDefault();
    setOrgStatus({ type: '', text: '' });
    setOrgLoading(true);

    try {
      const res = await api.updateOrganization(orgData.id, {
        name: orgData.name,
        short_name: orgData.short_name,
        shortName: orgData.short_name,
        app_name: orgData.app_name,
        appName: orgData.app_name,
        organization_type: orgData.organization_type,
        organizationType: orgData.organization_type,
        logo_url: orgData.logo_url,
        logoUrl: orgData.logo_url,
        address: orgData.address,
        email: orgData.email,
        phone: orgData.phone
      });
      if (res.success) {
        setOrgStatus({ type: 'success', text: `Institution configuration updated to "${orgData.organization_type}" successfully! Changes are synchronized across all portals.` });
        if (refreshUser) await refreshUser();
        try {
          const reloaded = await api.getOrganization(orgData.id);
          if (reloaded.success && reloaded.organization) {
            setOrgData(reloaded.organization);
          }
        } catch (e) {}
      }
    } catch (err) {
      setOrgStatus({ type: 'error', text: err.message || 'Failed to update institution settings.' });
    } finally {
      setOrgLoading(false);
    }
  };

  // Handle Create New Institution
  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setCreateLoading(true);
    try {
      const res = await api.createOrganization({
        name: newOrgName.trim(),
        short_name: newOrgShort.trim() || newOrgName.substring(0, 4).toUpperCase(),
        shortName: newOrgShort.trim() || newOrgName.substring(0, 4).toUpperCase(),
        organization_type: newOrgType,
        organizationType: newOrgType,
        app_name: newOrgApp.trim() || `${newOrgName} Leave System`,
        appName: newOrgApp.trim() || `${newOrgName} Leave System`
      });
      if (res.success) {
        alert(`Institution "${newOrgName}" (${newOrgType}) created successfully.`);
        setShowCreateModal(false);
        setNewOrgName('');
        setNewOrgShort('');
        setNewOrgApp('');
      }
    } catch (err) {
      alert(err.message || 'Failed to create institution.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Delete THIS Institution
  const handleDeleteOrg = async () => {
    if (orgData.id === 'org-bitm') {
      alert('The primary default BITM institution cannot be deleted.');
      return;
    }

    if (deleteConfirmText !== orgData.short_name) {
      alert(`Please type "${orgData.short_name}" to confirm deletion.`);
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await api.deleteOrganization(orgData.id);
      if (res.success) {
        alert('Institution deleted successfully. Logging out.');
        window.location.reload();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete institution.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="page-transition" style={{ maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-900)' }}>
            Authority & Institution Settings
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Manage your administrative profile, security credentials, and institution branding
          </p>
        </div>
        <button
          onClick={() => { if (refreshUser) refreshUser(); }}
          className="btn btn-outline"
          style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
          title="Refresh settings"
        >
          <RotateCw size={14} /> Refresh
        </button>
      </div>

      {/* SECTION 1: Institution Branding & Settings (Only this institution shown!) */}
      <div className="form-card" style={{ padding: '32px', marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-900)' }}>
                {orgData.name} ({orgData.organization_type})
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Centralized Institution Configuration (Propagates to Student & Authority Portals)
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-outline"
            style={{ padding: '6px 14px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <PlusCircle size={15} /> Add Institution
          </button>
        </div>

        {orgStatus.text && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: orgStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: orgStatus.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${orgStatus.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20
            }}
          >
            {orgStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{orgStatus.text}</span>
          </div>
        )}

        <form onSubmit={handleOrgUpdate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Institution / College / School Name</label>
              <input
                type="text"
                className="form-control"
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">System / Application Name</label>
              <input
                type="text"
                className="form-control"
                value={orgData.app_name}
                onChange={(e) => setOrgData({ ...orgData, app_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Institution Short Code</label>
              <input
                type="text"
                className="form-control"
                value={orgData.short_name}
                onChange={(e) => setOrgData({ ...orgData, short_name: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Institution Type (School / College / University)</label>
              <select
                className="form-control"
                value={orgData.organization_type}
                onChange={(e) => setOrgData({ ...orgData, organization_type: e.target.value })}
              >
                <option value="School">School (Standards 1st to 10th)</option>
                <option value="College">College (Departments & 8 Semesters)</option>
                <option value="University">University (Academic Divisions & Semesters)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Official Contact Email</label>
              <input
                type="email"
                className="form-control"
                value={orgData.email || ''}
                onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Official Contact Phone</label>
              <input
                type="text"
                className="form-control"
                value={orgData.phone || ''}
                onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 14 }}>
            <label className="form-label">Official Address</label>
            <input
              type="text"
              className="form-control"
              value={orgData.address || ''}
              onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 12 }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={orgLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
            >
              <Save size={16} />
              {orgLoading ? 'Saving Branding...' : 'Save Institution Settings'}
            </button>

            {/* Delete this institution only */}
            {orgData.id !== 'org-bitm' && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="btn btn-outline"
                style={{ color: 'var(--danger)', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem' }}
              >
                <Trash2 size={15} /> Delete This Institution
              </button>
            )}
          </div>
        </form>
      </div>

      {/* SECTION 2: Authority Account Details */}
      <div className="form-card" style={{ padding: '32px', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-900)' }}>
              Authority Account Information
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Update your administrative profile details and institutional contact info
            </span>
          </div>
        </div>

        {profileStatus.text && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: profileStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: profileStatus.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${profileStatus.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20
            }}
          >
            {profileStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{profileStatus.text}</span>
          </div>
        )}

        <form onSubmit={handleProfileUpdate}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Authority Full Name</label>
              <input
                type="text"
                className="form-control"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Authority Official Email</label>
              <input
                type="email"
                className="form-control"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Authority Phone Number</label>
              <input
                type="text"
                className="form-control"
                value={authPhone}
                onChange={(e) => setAuthPhone(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-accent"
            disabled={profileLoading}
            style={{ padding: '10px 22px', marginTop: 10 }}
          >
            {profileLoading ? 'Saving Profile...' : 'Save Profile Details'}
          </button>
        </form>
      </div>

      {/* SECTION 3: Change Authority Password */}
      <div className="form-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-900)' }}>
              Security & Password
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Update your account password with cryptographic authentication
            </span>
          </div>
        </div>

        {passwordStatus.text && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: passwordStatus.type === 'success' ? '#d1fae5' : '#fee2e2',
              color: passwordStatus.type === 'success' ? '#065f46' : '#991b1b',
              border: `1px solid ${passwordStatus.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20
            }}
          >
            {passwordStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{passwordStatus.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="current-pass-input">
                Current Password
              </label>
              <input
                id="current-pass-input"
                type="password"
                className="form-control"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-pass-input">
                New Password
              </label>
              <input
                id="new-pass-input"
                type="password"
                className="form-control"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm-pass-input">
                Confirm New Password
              </label>
              <input
                id="confirm-pass-input"
                type="password"
                className="form-control"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-outline"
            style={{ padding: '10px 22px', marginTop: 10, fontWeight: 700 }}
            disabled={passwordLoading}
          >
            {passwordLoading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>
      </div>

      {/* MODAL: Create New Institution (Asks School or College or University!) */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)} style={{ alignItems: 'flex-start', paddingTop: '36px' }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, margin: '0 auto' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Building2 size={20} color="var(--primary-700)" />
                <h3 style={{ fontSize: '1.2rem' }}>Add New Institution</h3>
              </div>
            </div>

            <form onSubmit={handleCreateOrg}>
              <div className="modal-body" style={{ padding: '20px' }}>
                {/* 1. Explicitly ask School or College or University */}
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Select Institution Category
                  </label>
                  <select
                    className="form-control"
                    value={newOrgType}
                    onChange={(e) => setNewOrgType(e.target.value)}
                    required
                  >
                    <option value="School">School (Standards 1st to 10th)</option>
                    <option value="College">College (Departments & 8 Semesters)</option>
                    <option value="University">University (Programs & Semesters)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Institution Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. National Public School"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Short Code / Acronym</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. NPS"
                    value={newOrgShort}
                    onChange={(e) => setNewOrgShort(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Application Branding Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. NPS Smart Leave"
                    value={newOrgApp}
                    onChange={(e) => setNewOrgApp(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createLoading}
                >
                  {createLoading ? 'Creating...' : 'Create Institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete This Institution Only */}
      {showDeleteModal && (
        <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldAlert size={22} color="var(--danger)" />
                <h3 style={{ fontSize: '1.18rem', color: 'var(--danger)' }}>Confirm Institution Deletion</h3>
              </div>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: 14, lineHeight: 1.5 }}>
                You are about to delete <strong>{orgData.name}</strong> ({orgData.short_name}).
                <br />
                All student accounts, leave applications, and records associated with this specific institution will be permanently removed.
              </p>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.82rem' }}>
                  To confirm, type <strong>{orgData.short_name}</strong> below:
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={orgData.short_name}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-accent"
                style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}
                onClick={handleDeleteOrg}
                disabled={deleteLoading || deleteConfirmText !== orgData.short_name}
              >
                {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
