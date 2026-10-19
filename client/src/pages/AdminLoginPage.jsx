import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Shield,
  Lock,
  Mail,
  User,
  Key,
  Phone,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Info
} from 'lucide-react';

export default function AdminLoginPage({ onBack, onLoginSuccess }) {
  const { loginAdmin, user, isStudent, isAuthority } = useAuth();

  // Mode: 'signin' | 'register'
  const [mode, setMode] = useState('signin');

  // Sign In state
  const [emailOrId, setEmailOrId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register / Protected signup state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAdminId, setRegAdminId] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Guard against logged-in Student or Authority attempting Admin registration
  if (user && (isStudent || isAuthority)) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at top, #091326 0%, #050a14 65%, #02040a 100%)',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: '100%',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: 'var(--radius-xl)',
            padding: 36,
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 35px rgba(239, 68, 68, 0.25)'
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
              margin: '0 auto 20px'
            }}
          >
            <AlertTriangle size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>
            Access Denied
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: 24 }}>
            {isStudent
              ? 'Student accounts cannot create or register as administrators.'
              : 'Authority accounts cannot create administrator accounts.'}
          </p>
          <button
            onClick={onBack}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontWeight: 700 }}
          >
            Return to {isStudent ? 'Student Portal' : 'Authority Portal'}
          </button>
        </div>
      </div>
    );
  }

  // Handle Sign In Submit
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!emailOrId.trim() || !password.trim()) {
      setError('Please provide your Admin Email / Admin ID and password.');
      return;
    }

    setLoading(true);
    try {
      await loginAdmin({ emailOrId: emailOrId.trim(), password: password.trim() });
      if (onLoginSuccess) onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Administrator authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Protected Registration Submit
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!regFullName.trim() || !regEmail.trim() || !regPassword.trim() || !invitationCode.trim()) {
      setError('Full Name, Email, Password, and an Authorization Key / Invitation Code are required.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.adminRegister({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        adminId: regAdminId.trim(),
        mobileNumber: regPhone.trim(),
        password: regPassword.trim(),
        confirmPassword: regConfirmPassword.trim(),
        invitationCode: invitationCode.trim()
      });

      if (res.success) {
        setSuccessMsg('System Administrator account registered successfully! You may now sign in.');
        setMode('signin');
        setEmailOrId(regEmail.trim());
        setPassword('');
        // Reset form
        setRegFullName('');
        setRegEmail('');
        setRegAdminId('');
        setRegPhone('');
        setRegPassword('');
        setRegConfirmPassword('');
        setInvitationCode('');
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Registration error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #091326 0%, #050a14 65%, #02040a 100%)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative'
      }}
    >
      {/* Top back button */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: 24,
          left: 24,
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#cbd5e1',
          padding: '8px 16px',
          borderRadius: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 600,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.color = '#cbd5e1';
        }}
      >
        <ArrowLeft size={16} /> Back to Role Selection
      </button>

      {/* Main Login / Register Card */}
      <div
        style={{
          maxWidth: mode === 'signin' ? 460 : 540,
          width: '100%',
          background: 'rgba(13, 22, 38, 0.92)',
          border: '1px solid rgba(139, 92, 246, 0.45)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 32px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(124, 58, 237, 0.25)',
          backdropFilter: 'blur(20px)',
          animation: 'fadeIn 0.3s ease-out'
        }}
      >
        {/* Header Badge */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              boxShadow: '0 0 25px rgba(124, 58, 237, 0.55)'
            }}
          >
            <Shield size={30} />
          </div>

          <div
            style={{
              display: 'inline-block',
              padding: '3px 12px',
              borderRadius: 9999,
              background: 'rgba(124, 58, 237, 0.2)',
              border: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#c4b5fd',
              fontSize: '0.74rem',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 8
            }}
          >
            System Administration
          </div>

          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
            {mode === 'signin' ? 'Admin Sign In' : 'Protected Admin Registration'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            {mode === 'signin'
              ? 'Multi-Organisation Management & Platform Control'
              : 'Authorized registration requires a valid verification key'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 'var(--radius-md)',
            padding: 4,
            marginBottom: 24,
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'signin' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'transparent',
              color: mode === 'signin' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: mode === 'register' ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'transparent',
              color: mode === 'register' ? '#ffffff' : '#94a3b8',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Create Admin Account
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.84rem',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#6ee7b7',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.84rem',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE 1: SIGN IN */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600 }}>
                Admin Email or Admin ID
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. admin@system.local or ADMIN-001"
                  value={emailOrId}
                  onChange={(e) => setEmailOrId(e.target.value)}
                  style={{
                    background: '#0d1829',
                    color: '#f8fafc',
                    borderColor: 'rgba(139, 92, 246, 0.45)',
                    paddingLeft: 42
                  }}
                  id="admin-email-input"
                  required
                />
                <Mail
                  size={18}
                  color="#a78bfa"
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>
                  Password
                </label>
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  Protected Asterisks
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    background: '#0d1829',
                    color: '#f8fafc',
                    borderColor: 'rgba(139, 92, 246, 0.45)',
                    paddingLeft: 42,
                    paddingRight: 42
                  }}
                  id="admin-password-input"
                  required
                />
                <Lock
                  size={18}
                  color="#a78bfa"
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: 4
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              id="admin-submit-btn"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '13px 20px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.94rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 18px rgba(124, 58, 237, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 6
              }}
            >
              <ShieldCheck size={18} />
              {loading ? 'Authenticating Admin...' : 'Sign In as Administrator'}
            </button>

            {/* Helper callout */}
            <div
              style={{
                marginTop: 8,
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: '0.76rem',
                color: '#cbd5e1',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Info size={15} color="#a78bfa" style={{ flexShrink: 0 }} />
              <span>
                Default Initial Admin: <strong>admin@system.local</strong> (Admin ID: <strong>ADMIN-001</strong>)
              </span>
            </div>
          </form>
        )}

        {/* MODE 2: PROTECTED REGISTRATION */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Security Notice */}
            <div
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.78rem',
                color: '#93c5fd',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8
              }}
            >
              <ShieldCheck size={16} color="#60a5fa" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Protected Registration:</strong> System Administrator accounts can only be created with an authorization key issued by an existing System Administrator.
              </div>
            </div>

            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  style={{ background: '#0d1829', color: '#f8fafc', borderColor: 'rgba(139, 92, 246, 0.45)', paddingLeft: 38 }}
                  required
                />
                <User size={16} color="#a78bfa" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Email & Phone grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>
                  Admin Email *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="admin@edu.org"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{ background: '#0d1829', color: '#f8fafc', borderColor: 'rgba(139, 92, 246, 0.45)', paddingLeft: 36, fontSize: '0.84rem' }}
                    required
                  />
                  <Mail size={16} color="#a78bfa" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>
                  Admin ID Code
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. ADMIN-002"
                  value={regAdminId}
                  onChange={(e) => setRegAdminId(e.target.value.toUpperCase())}
                  style={{ background: '#0d1829', color: '#f8fafc', borderColor: 'rgba(139, 92, 246, 0.45)', fontSize: '0.84rem' }}
                />
              </div>
            </div>

            {/* Mobile */}
            <div className="form-group">
              <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>
                Phone Number (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  style={{ background: '#0d1829', color: '#f8fafc', borderColor: 'rgba(139, 92, 246, 0.45)', paddingLeft: 38 }}
                />
                <Phone size={16} color="#a78bfa" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Password & Confirm */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>
                  Password *
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="At least 6 chars"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  style={{ background: '#0d1829', color: '#f8fafc', borderColor: 'rgba(139, 92, 246, 0.45)', fontSize: '0.84rem' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}>
                  Confirm Password *
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Repeat password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  style={{ background: '#0d1829', color: '#f8fafc', borderColor: 'rgba(139, 92, 246, 0.45)', fontSize: '0.84rem' }}
                  required
                />
              </div>
            </div>

            {/* Administrator Authorization Key / Invitation Code */}
            <div className="form-group">
              <label className="form-label" style={{ color: '#fbbf24', fontSize: '0.82rem', fontWeight: 700 }}>
                Authorization Key / Invitation Code *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. ADMIN-SETUP-KEY-2026 or ADM-INV-XXXX"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  style={{
                    background: '#0d1829',
                    color: '#fde047',
                    borderColor: 'rgba(251, 191, 36, 0.5)',
                    paddingLeft: 38,
                    fontWeight: 700,
                    letterSpacing: '0.04em'
                  }}
                  required
                />
                <Key size={16} color="#fbbf24" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 4, display: 'block' }}>
                Default Initial Setup Key: <code>ADMIN-SETUP-KEY-2026</code>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '13px 20px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 18px rgba(124, 58, 237, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 6
              }}
            >
              <ShieldCheck size={18} />
              {loading ? 'Validating Authorization...' : 'Verify & Register Administrator'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
