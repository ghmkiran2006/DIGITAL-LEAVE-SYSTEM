import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { GraduationCap, ArrowLeft, AlertCircle, Building2, Calendar, Sparkles, ChevronDown } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DEFAULT_ORGS = [
  { id: 'org-bitm', name: 'Ballari Institute of Technology and Management', short_name: 'BITM', organization_type: 'College' },
  { id: 'org-school', name: 'BITM Central Public School & PU College', short_name: 'BITM-School', organization_type: 'School' },
  { id: 'org-univ', name: 'BITM Deemed University', short_name: 'BITM-Univ', organization_type: 'University' }
];

export default function StudentLoginPage({ onBack, onLoginSuccess }) {
  const { loginStudent } = useAuth();
  
  // Organization / Institution Selection
  const [organizations, setOrganizations] = useState(DEFAULT_ORGS);
  const [selectedOrgId, setSelectedOrgId] = useState('org-bitm');
  const [selectedOrg, setSelectedOrg] = useState(DEFAULT_ORGS[0]);

  // Student Input Fields
  const [usn, setUsn] = useState('');
  const [studentName, setStudentName] = useState('');
  
  // Selectable Date of Birth (No typing form!)
  const [dobDay, setDobDay] = useState('15');
  const [dobMonth, setDobMonth] = useState('March');
  const [dobYear, setDobYear] = useState('2006');
  
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load organizations from server
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

  const isSchool = selectedOrg?.organization_type === 'School';

  // Construct DOB password string (e.g., "15March2006")
  const formattedDob = `${dobDay}${dobMonth}${dobYear}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isSchool) {
      if (!studentName.trim()) {
        setErrorMessage('Please enter your Student Name.');
        return;
      }
    } else {
      if (!usn.trim()) {
        setErrorMessage('Please enter your University Seat Number (USN).');
        return;
      }
    }

    if (!dobDay || !dobMonth || !dobYear) {
      setErrorMessage('Please select your complete Date of Birth.');
      return;
    }

    setLoading(true);
    try {
      if (isSchool) {
        // School login: Student Name + DOB
        await loginStudent({
          studentName: studentName.trim(),
          dob: formattedDob,
          organizationId: selectedOrgId
        });
      } else {
        // College / University login: USN + DOB
        await loginStudent({
          usn: usn.trim(),
          dob: formattedDob,
          organizationId: selectedOrgId
        });
      }
      onLoginSuccess();
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your Student ID and Date of Birth.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #0f1d35 0%, #070d18 70%, #030710 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
      className="page-transition"
    >
      {/* Background Neon Grid / Glow Accent */}
      <div
        style={{
          position: 'absolute',
          width: 550,
          height: 550,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, rgba(37, 99, 235, 0) 70%)',
          top: -100,
          left: -100,
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.12) 0%, rgba(14, 165, 233, 0) 70%)',
          bottom: -100,
          right: -100,
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
        {/* Left Side: Educational Visual Illustration (Cinematic Theme) */}
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
              background: 'rgba(37, 99, 235, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#93c5fd',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: 18,
              width: 'fit-content'
            }}
          >
            <Sparkles size={14} color="#60a5fa" /> Digital Leave System
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
            Official student portal for automated leave requests, medical certificate submissions, and high-security QR gate pass verification.
          </p>

          {/* Educational Visual Card */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
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
                background: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)'
              }}
            >
              <GraduationCap size={28} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#f8fafc' }}>
                Secure Student Verification
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Password is authenticated strictly via your registered Date of Birth.
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Dark Glassmorphic Login Card */}
        <div
          style={{
            flex: '1 1 420px',
            maxWidth: 480,
            width: '100%',
            background: 'rgba(13, 22, 38, 0.85)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 32px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 35px -5px rgba(37, 99, 235, 0.3)',
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
              Student Login
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
              Select your institution and authenticate with your registered credentials.
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

            {/* 2. Identifier: Student Name for School, or USN for College/University */}
            {isSchool ? (
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" htmlFor="student-name-input" style={{ color: '#cbd5e1', fontSize: '0.84rem', fontWeight: 600 }}>
                  Student Full Name
                </label>
                <input
                  id="student-name-input"
                  type="text"
                  className="form-control"
                  placeholder="Enter student name (as registered by School Authority)"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  autoComplete="name"
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: '#f8fafc',
                    borderColor: 'rgba(59, 130, 246, 0.35)'
                  }}
                  required
                />
              </div>
            ) : (
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" htmlFor="student-usn-input" style={{ color: '#cbd5e1', fontSize: '0.84rem', fontWeight: 600 }}>
                  University Seat Number (USN) / Student ID
                </label>
                <input
                  id="student-usn-input"
                  type="text"
                  className="form-control"
                  placeholder="e.g. 3BR23CS001"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())}
                  autoComplete="username"
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: '#f8fafc',
                    borderColor: 'rgba(59, 130, 246, 0.35)'
                  }}
                  required
                />
              </div>
            )}

            {/* 3. Password: STRICTLY SELECTABLE Date of Birth (No manual typing!) */}
            <div className="form-group" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.84rem', fontWeight: 600, marginBottom: 0 }}>
                  Date of Birth Password (Selectable)
                </label>
                <span style={{ fontSize: '0.74rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} /> Day + Month + Year
                </span>
              </div>

              {/* Day, Month, Year Selectable Dropdowns */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 100px', gap: 10 }}>
                {/* Day */}
                <select
                  className="form-control"
                  value={dobDay}
                  onChange={(e) => setDobDay(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: '#f8fafc',
                    borderColor: 'rgba(59, 130, 246, 0.35)',
                    padding: '10px 8px',
                    textAlign: 'center'
                  }}
                  id="select-dob-day"
                >
                  {Array.from({ length: 31 }, (_, i) => {
                    const d = (i + 1).toString().padStart(2, '0');
                    return (
                      <option key={d} value={d} style={{ background: '#0f172a', color: '#fff' }}>
                        {d}
                      </option>
                    );
                  })}
                </select>

                {/* Month */}
                <select
                  className="form-control"
                  value={dobMonth}
                  onChange={(e) => setDobMonth(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: '#f8fafc',
                    borderColor: 'rgba(59, 130, 246, 0.35)',
                    padding: '10px 10px'
                  }}
                  id="select-dob-month"
                >
                  {MONTH_NAMES.map((m) => (
                    <option key={m} value={m} style={{ background: '#0f172a', color: '#fff' }}>
                      {m}
                    </option>
                  ))}
                </select>

                {/* Year */}
                <select
                  className="form-control"
                  value={dobYear}
                  onChange={(e) => setDobYear(e.target.value)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.9)',
                    color: '#f8fafc',
                    borderColor: 'rgba(59, 130, 246, 0.35)',
                    padding: '10px 8px',
                    textAlign: 'center'
                  }}
                  id="select-dob-year"
                >
                  {Array.from({ length: 40 }, (_, i) => {
                    const y = 2024 - i;
                    return (
                      <option key={y} value={y.toString()} style={{ background: '#0f172a', color: '#fff' }}>
                        {y}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div
                style={{
                  fontSize: '0.74rem',
                  color: '#94a3b8',
                  marginTop: 8,
                  background: 'rgba(15, 23, 42, 0.5)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                Selected DOB password: <code style={{ color: '#60a5fa', fontWeight: 700 }}>{formattedDob}</code>
                <br />
                Your password is fixed to your Date of Birth as created by the institution Authority.
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              id="submit-student-login"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.98rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 18px rgba(37, 99, 235, 0.4)',
                border: 'none',
                color: '#ffffff'
              }}
              disabled={loading}
            >
              {loading ? 'Authenticating Student...' : 'Sign In as Student'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
