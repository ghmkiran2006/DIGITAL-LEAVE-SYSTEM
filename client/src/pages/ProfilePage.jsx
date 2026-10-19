import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Calendar, Building2, GraduationCap, ShieldCheck, RotateCw } from 'lucide-react';

import Avatar from '../components/Avatar';

export default function ProfilePage() {
  const { user, isStudent, refreshUser } = useAuth();

  return (
    <div className="page-transition" style={{ maxWidth: 740, margin: '0 auto' }}>
      <div className="form-card" style={{ padding: '36px' }}>
        {/* Header: Avatar + name + role pill + Refresh button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 28, borderBottom: '1px solid var(--border-color)', paddingBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Avatar
              src={user?.profilePhoto}
              name={user?.fullName || 'User'}
              size={84}
              style={{ border: '3px solid var(--accent-gold)' }}
            />
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-900)' }}>
                {user?.fullName}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span
                  style={{
                    background: isStudent ? '#e0f2fe' : '#fef3c7',
                    color: isStudent ? '#0369a1' : '#b45309',
                    padding: '4px 12px',
                    borderRadius: 9999,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  {isStudent ? 'STUDENT' : user?.role}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {isStudent ? `USN: ${user?.usn}` : user?.organization}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => { if (refreshUser) refreshUser(); }}
            className="btn btn-outline"
            style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
            title="Refresh Profile"
          >
            <RotateCw size={14} /> Refresh
          </button>
        </div>

        {/* Info grid cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
              <Mail size={14} /> Registered Email
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.email || 'Not specified'}</div>
          </div>

          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
              <Phone size={14} /> Contact Number
            </div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.mobileNumber || 'Not specified'}</div>
          </div>

          {isStudent && (
            <>
              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                  <Calendar size={14} /> Date of Birth
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.dob || 'Not specified'}</div>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                  <GraduationCap size={14} /> Department & Semester
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  {user?.department} ({user?.departmentName}) • {user?.semester}th Sem
                </div>
              </div>

              <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                  <Building2 size={14} /> Institution
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{user?.college || user?.organizationName}</div>
              </div>
            </>
          )}

          {!isStudent && (
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
                <Building2 size={14} /> Organization Jurisdiction
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {user?.organizationName || 'Ballari Institute of Technology and Management (BITM)'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
