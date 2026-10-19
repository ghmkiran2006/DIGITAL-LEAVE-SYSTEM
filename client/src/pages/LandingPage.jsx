import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle,
  FileText,
  QrCode,
  School,
  BookOpen,
  ChevronDown,
  Shield
} from 'lucide-react';

const DEFAULT_ORGS = [
  { id: 'org-bitm', name: 'Ballari Institute of Technology and Management', short_name: 'BITM', organization_type: 'College' },
  { id: 'org-school', name: 'BITM Central Public School & PU College', short_name: 'BITM-School', organization_type: 'School' },
  { id: 'org-univ', name: 'BITM Deemed University', short_name: 'BITM-Univ', organization_type: 'University' }
];

export default function LandingPage({ onSelectRole }) {
  const [organizations, setOrganizations] = useState(DEFAULT_ORGS);
  const [selectedOrgId, setSelectedOrgId] = useState('org-bitm');
  const [selectedOrg, setSelectedOrg] = useState(DEFAULT_ORGS[0]);

  useEffect(() => {
    async function loadOrgs() {
      try {
        const res = await api.getOrganizations();
        if (res.success && res.organizations?.length > 0) {
          setOrganizations(res.organizations);
          setSelectedOrgId((prev) => {
            const found = res.organizations.find((o) => o.id === prev);
            if (found) {
              setSelectedOrg(found);
              return prev;
            }
            setSelectedOrg(res.organizations[0]);
            return res.organizations[0].id;
          });
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

  const orgName = selectedOrg?.name || 'Ballari Institute of Technology and Management';
  const orgShort = selectedOrg?.short_name || 'BITM';
  const appName = selectedOrg?.app_name || 'Digital Leave System';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #091326 0%, #050a14 65%, #02040a 100%)',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Neon Glow Spheres */}
      <div
        style={{
          position: 'absolute',
          top: -120,
          left: -120,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.16) 0%, rgba(37, 99, 235, 0) 70%)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -150,
          right: -100,
          width: 650,
          height: 650,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.14) 0%, rgba(14, 165, 233, 0) 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* Top Header */}
      <header
        style={{
          padding: '20px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
          background: 'rgba(7, 13, 24, 0.8)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 30
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.25rem',
              boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)'
            }}
          >
            {orgShort}
          </div>
          <div>
            <h1 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.15 }}>
              {orgName}
            </h1>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>
              {appName} • Multi-Institution Autonomous Platform
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span
            style={{
              background: 'rgba(37, 99, 235, 0.15)',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              padding: '6px 14px',
              borderRadius: 9999,
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Sparkles size={14} color="#60a5fa" /> Official Cloud Portal
          </span>
        </div>
      </header>

      {/* Main Cinematic Split: Visual on Left, Login Cards on Right */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          maxWidth: 1200,
          margin: '0 auto',
          width: '100%',
          zIndex: 20
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 48,
            width: '100%'
          }}
        >
          {/* Left Side: Animated Educational Student Illustration & Intro */}
          <div
            style={{
              flex: '1 1 480px',
              maxWidth: 540,
              display: 'flex',
              flexDirection: 'column',
              gap: 24
            }}
            className="page-transition"
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 16px',
                  borderRadius: 9999,
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#60a5fa',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  marginBottom: 16
                }}
              >
                <Building2 size={16} /> {orgName}
              </div>

              <h2
                style={{
                  fontSize: '2.8rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.15,
                  marginBottom: 16
                }}
              >
                Digital Leave System
              </h2>

              <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.6, maxWidth: 500 }}>
                Next-generation paperless leave management with automated 1-day grace period calculations, single-sheet A4 official letters, and QR gate pass verification.
              </p>
            </div>

            {/* Stylized Educational Academic Character SVG Illustration */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 420,
                height: 220,
                background: 'rgba(15, 23, 42, 0.7)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                padding: '20px 28px',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.1)',
                animation: 'fadeIn 0.8s ease-out forwards'
              }}
            >
              {/* Scholar Graphic */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    margin: '0 auto 10px',
                    boxShadow: '0 0 25px rgba(59, 130, 246, 0.5)'
                  }}
                >
                  <GraduationCap size={38} />
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
                  Student Portal
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  DOB Protected Login
                </div>
              </div>

              {/* Arrow Connector */}
              <div style={{ color: 'rgba(59, 130, 246, 0.6)' }}>
                <ArrowRight size={28} />
              </div>

              {/* Authority Graphic */}
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    margin: '0 auto 10px',
                    boxShadow: '0 0 25px rgba(217, 119, 6, 0.4)'
                  }}
                >
                  <ShieldCheck size={38} />
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
                  Authority Portal
                </div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                  12-Digit QR Gatepass
                </div>
              </div>
            </div>

            {/* Quick Feature Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: '0.82rem', color: '#cbd5e1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: 9999 }}>
                <CheckCircle size={14} color="#10b981" /> 1-Day Verification Grace
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: 9999 }}>
                <QrCode size={14} color="#38bdf8" /> 12-Digit QR Tokens
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: 9999 }}>
                <FileText size={14} color="#fbbf24" /> Official Single A4 Letters
              </span>
            </div>
          </div>

          {/* Right Side: Dual Login Card with Institution Selector */}
          <div
            style={{
              flex: '1 1 440px',
              maxWidth: 480,
              width: '100%',
              background: 'rgba(13, 22, 38, 0.85)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: 'var(--radius-xl)',
              padding: '36px 32px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65), 0 0 40px -5px rgba(59, 130, 246, 0.35)',
              backdropFilter: 'blur(20px)',
              position: 'relative'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 'var(--radius-lg)',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                  boxShadow: '0 0 25px rgba(37, 99, 235, 0.5)'
                }}
              >
                <BookOpen size={28} />
              </div>
              <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', marginBottom: 4 }}>
                Choose Your Role
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                Single integrated application with isolated institutional security
              </p>
            </div>

            {/* Select School / College / University */}
            <div className="form-group" style={{ marginBottom: 26 }}>
              <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.84rem', fontWeight: 600 }}>
                Select School / College / University
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  className="form-control"
                  value={selectedOrgId}
                  onChange={handleOrgChange}
                  style={{
                    background: '#0d1829',
                    color: '#f8fafc',
                    colorScheme: 'dark',
                    borderColor: 'rgba(59, 130, 246, 0.45)',
                    paddingLeft: 42,
                    paddingRight: 40,
                    height: 48,
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none'
                  }}
                  id="select-institution-landing"
                >
                  {organizations.map((org) => (
                    <option
                      key={org.id}
                      value={org.id}
                      style={{
                        background: '#0d1829',
                        color: '#f8fafc',
                        padding: '12px 14px',
                        fontSize: '0.92rem',
                        fontWeight: 500
                      }}
                    >
                      {org.name} ({org.organization_type})
                    </option>
                  ))}
                </select>
                <Building2
                  size={18}
                  color="#60a5fa"
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
                <ChevronDown
                  size={18}
                  color="#60a5fa"
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                />
              </div>
            </div>

            {/* Dual Role Selection Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Option 1: Student Login */}
              <button
                onClick={() => onSelectRole('student')}
                id="select-student-role"
                style={{
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(30, 64, 175, 0.25) 100%)',
                  border: '1px solid rgba(59, 130, 246, 0.5)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#ffffff',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#60a5fa';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(37, 99, 235, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}
                >
                  <GraduationCap size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
                    Student Login
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Sign in using Student ID and selectable Date of Birth
                  </div>
                </div>
                <ArrowRight size={18} color="#60a5fa" />
              </button>

              {/* Option 2: Authority Login */}
              <button
                onClick={() => onSelectRole('authority')}
                id="select-authority-role"
                style={{
                  background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.12) 0%, rgba(180, 83, 9, 0.22) 100%)',
                  border: '1px solid rgba(217, 119, 6, 0.5)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#ffffff',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#fbbf24';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(217, 119, 6, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.5)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}
                >
                  <ShieldCheck size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
                    Authority Login
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Principal • Manager • HOD • Official Authority
                  </div>
                </div>
                <ArrowRight size={18} color="#fbbf24" />
              </button>

              {/* Option 3: Admin Login */}
              <button
                onClick={() => onSelectRole('admin')}
                id="select-admin-role"
                style={{
                  background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.14) 0%, rgba(79, 70, 229, 0.22) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: '#ffffff',
                  transition: 'all 0.25s ease',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#a78bfa';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(124, 58, 237, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}
                >
                  <Shield size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
                    Admin Login
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                    System Administrator • Organisation & Authority Management
                  </div>
                </div>
                <ArrowRight size={18} color="#a78bfa" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '18px 48px',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: '#64748b',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(3, 6, 12, 0.9)'
        }}
      >
        Digital Leave System • Multi-Institution Autonomous Management & QR Verification • {new Date().getFullYear()}
      </footer>
    </div>
  );
}
