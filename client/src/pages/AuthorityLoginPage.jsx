import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldCheck, ArrowLeft, Eye, EyeOff, AlertCircle, Building2, Lock, Sparkles } from 'lucide-react';

export default function AuthorityLoginPage({ onBack, onLoginSuccess }) {
  const { loginAuthority } = useAuth();
  
  // Organization / Institution Selection
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(null);

  // Authority Input Fields (Do NOT display or pre-fill email!)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load organizations
  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await api.getOrganizations();
        if (res.success && res.organizations?.length > 0) {
          setOrganizations(res.organizations);
          setSelectedOrgId(res.organizations[0].id);
          setSelectedOrg(res.organizations[0]);
        }
      } catch (err) {
        console.error('Failed to load institutions:', err);
      }
    }
    loadOrgs();
  }, []);

  const handleOrgChange = (e) => {
    const orgId = e.target.value;
    setSelectedOrgId(orgId);
    const org = organizations.find((o) => o.id === orgId);
    setSelectedOrg(org || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both Authority Email and Password.');
      return;
    }

    setLoading(true);
    try {
      await loginAuthority({
        email: email.trim(),
        password: password.trim(),
        organizationId: selectedOrgId
      });
      onLoginSuccess();
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #0c1829 0%, #060b14 70%, #03060a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="page-transition"
    >
      {/* Background Neon Glow Accent */}
      <div
        style={{
          position: 'absolute',
          width: 550,
          height: 550,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.12) 0%, rgba(212, 175, 55, 0) 70%)',
          top: -100,
          right: -100,
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0) 70%)',
          bottom: -100,
          left: -100,
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          maxWidth: 960,
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          zIndex: 10
        }}
      >
        {/* Left Side: Authority Administration Overview */}
        <div
          style={{
            flex: '1 1 380px',
            maxWidth: 440,
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 9999,
              background: 'rgba(212, 175, 55, 0.15)',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              color: '#fde047',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: 18,
              width: 'fit-content'
            }}
          >
            <Sparkles size={14} color="#facc15" /> Institutional Authority Portal
          </div>

          <h1
            style={{
              fontSize: '2.4rem',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              marginBottom: 14,
              letterSpacing: '-0.02em'
            }}
          >
            {selectedOrg?.name || 'Ballari Institute of Technology and Management'}
          </h1>

          <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 26 }}>
            Authorized portal for Principal, HOD, Proctor, and Institution Administrators to review leave requests, scan gate pass QR codes, and manage students.
          </p>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: 'var(--radius-xl)',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.35)'
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 20px rgba(217, 119, 6, 0.4)'
              }}
            >
              <ShieldCheck size={28} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#f8fafc' }}>
                Verified Authority Access
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Multi-institution isolated data security with full cryptographic audit logging.
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Dark Glassmorphic Authority Login Card */}
        <div
          style={{
            flex: '1 1 420px',
            maxWidth: 480,
            width: '100%',
            background: 'rgba(13, 22, 38, 0.85)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 32px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px -5px rgba(212, 175, 55, 0.25)',
            backdropFilter: 'blur(20px)',
            color: '#f8fafc'
          }}
        >
          <button
            onClick={onBack}
            className="btn btn-outline"
            style={{
              padding: '6px 14px',
              fontSize: '0.82rem',
              marginBottom: 20,
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#e2e8f0',
              borderColor: 'rgba(255, 255, 255, 0.15)'
            }}
          >
            <ArrowLeft size={15} /> Back to Role Selection
          </button>

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
              Authority Login
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
              Sign in with institutional administrative credentials.
            </p>
          </div>

          {errorMessage && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 20
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 1. Institution Selector */}
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.84rem', fontWeight: 600 }}>
                Select School / College / University
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  className="form-control"
                  value={selectedOrgId}
                  onChange={handleOrgChange}
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: '#f8fafc',
                    borderColor: 'rgba(212, 175, 55, 0.35)',
                    paddingLeft: 38
                  }}
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id} style={{ background: '#0f172a', color: '#f8fafc' }}>
                      {org.name} ({org.organization_type})
                    </option>
                  ))}
                </select>
                <Building2
                  size={16}
                  color="#fbbf24"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
              </div>
            </div>

            {/* 2. Email Address (Do not pre-fill or display authority email) */}
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label" htmlFor="authority-email" style={{ color: '#cbd5e1', fontSize: '0.84rem', fontWeight: 600 }}>
                Authority Email
              </label>
              <input
                id="authority-email"
                type="email"
                className="form-control"
                placeholder="Enter authority email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  color: '#f8fafc',
                  borderColor: 'rgba(212, 175, 55, 0.35)'
                }}
                required
              />
            </div>

            {/* 3. Password with Eye Icon Toggle */}
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label" htmlFor="authority-password" style={{ color: '#cbd5e1', fontSize: '0.84rem', fontWeight: 600 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="authority-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter authority password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: '#f8fafc',
                    borderColor: 'rgba(212, 175, 55, 0.35)',
                    paddingRight: '46px'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 4
                  }}
                  id="toggle-authority-password"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} color="#f8fafc" /> : <Eye size={18} color="#94a3b8" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-accent"
              id="submit-authority-login"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.98rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                boxShadow: '0 4px 18px rgba(217, 119, 6, 0.4)',
                border: 'none',
                color: '#ffffff'
              }}
              disabled={loading}
            >
              {loading ? 'Authenticating Authority...' : 'Sign In as Authority'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
