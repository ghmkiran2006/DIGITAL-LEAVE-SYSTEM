import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Sparkles
} from 'lucide-react';
import Avatar from '../components/Avatar';

export default function AdminProfilePage() {
  const { user, refreshUser } = useAuth();

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState({ text: '', type: '' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileMsg({ text: 'Full Name cannot be empty.', type: 'error' });
      return;
    }

    setSavingProfile(true);
    setProfileMsg({ text: '', type: '' });
    try {
      const res = await api.updateAdminProfile({
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim() || null
      });

      if (res.success) {
        setProfileMsg({ text: 'Admin profile updated successfully.', type: 'success' });
        if (refreshUser) refreshUser();
      }
    } catch (err) {
      setProfileMsg({ text: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPassMsg({ text: 'Please fill in both current and new passwords.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setPassMsg({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setSavingPass(true);
    setPassMsg({ text: '', type: '' });
    try {
      const res = await api.changeAdminPassword(currentPassword, newPassword);
      if (res.success) {
        setPassMsg({ text: 'Admin password successfully changed.', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPassMsg({ text: err.message || 'Failed to change password.', type: 'error' });
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="page-transition" style={{ maxWidth: 860, margin: '0 auto' }}>
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
              Administrator Profile & Security
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Manage master administrator credentials, profile details, and account settings
            </p>
          </div>
        </div>

        <button
          className="btn btn-outline"
          onClick={() => { if (refreshUser) refreshUser(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: '#7c3aed', color: '#7c3aed' }}
        >
          <RotateCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Admin Identity Card */}
      <div className="form-card" style={{ padding: 28, borderRadius: 14, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9', paddingBottom: 22 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: '2rem',
              fontWeight: 800,
              boxShadow: '0 4px 16px rgba(124, 58, 237, 0.35)'
            }}
          >
            {user?.fullName?.charAt(0) || 'A'}
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>
                {user?.fullName || 'System Administrator'}
              </h2>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 10px',
                  borderRadius: 9999,
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: '#ffffff'
                }}
              >
                <Sparkles size={12} />
                SYSTEM ADMIN
              </span>
            </div>
            <div style={{ color: '#64748b', fontSize: '0.88rem', marginTop: 4 }}>
              {user?.email}
            </div>
          </div>

          <div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                Admin ID Code
              </div>
              <code style={{ fontSize: '1.1rem', fontWeight: 800, color: '#7c3aed' }}>
                {user?.adminId || 'ADMIN-001'}
              </code>
            </div>
          </div>
        </div>

        {/* Quick info row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 20 }}>
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
              Role Designation
            </div>
            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
              {user?.role || 'Super Administrator'}
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
              Account Scope
            </div>
            <div style={{ fontWeight: 600, color: '#7c3aed', fontSize: '0.9rem' }}>
              All Multi-Tenant Institutions
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
              Security Status
            </div>
            <div style={{ fontWeight: 600, color: '#059669', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} /> Active / Verified
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Form 1: Edit Profile Details */}
        <div className="form-card" style={{ padding: 24, borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#ede9fe',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <User size={18} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>Personal Information</h3>
          </div>

          {profileMsg.text && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.85rem',
                marginBottom: 16,
                background: profileMsg.type === 'success' ? '#ecfdf5' : '#fee2e2',
                color: profileMsg.type === 'success' ? '#059669' : '#dc2626',
                border: `1px solid ${profileMsg.type === 'success' ? '#a7f3d0' : '#fca5a5'}`
              }}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile}>
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

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Admin Email (Read-Only)</label>
              <input
                type="email"
                className="form-control"
                value={user?.email || ''}
                disabled
                style={{ background: '#f8fafc', color: '#64748b' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="form-control"
                placeholder="+91 9876543210"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingProfile}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                border: 'none',
                padding: '10px 0'
              }}
            >
              {savingProfile ? 'Saving...' : 'Update Profile Details'}
            </button>
          </form>
        </div>

        {/* Form 2: Change Password */}
        <div className="form-card" style={{ padding: 24, borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#ede9fe',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <KeyRound size={18} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>Change Password</h3>
          </div>

          {passMsg.text && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                fontSize: '0.85rem',
                marginBottom: 16,
                background: passMsg.type === 'success' ? '#ecfdf5' : '#fee2e2',
                color: passMsg.type === 'success' ? '#059669' : '#dc2626',
                border: `1px solid ${passMsg.type === 'success' ? '#a7f3d0' : '#fca5a5'}`
              }}
            >
              {passMsg.text}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="form-group" style={{ marginBottom: 14, position: 'relative' }}>
              <label className="form-label">Current Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">New Password * (Min 6 characters)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Confirm New Password *</label>
              <input
                type="password"
                className="form-control"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={savingPass}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                border: 'none',
                padding: '10px 0'
              }}
            >
              {savingPass ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
