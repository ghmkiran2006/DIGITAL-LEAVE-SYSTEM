import React, { useState } from 'react';
import {
  HelpCircle,
  LogIn,
  FilePlus2,
  FileText,
  UploadCloud,
  Send,
  Clock,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  RotateCw
} from 'lucide-react';

export default function StudentHelpPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('guide'); // 'guide' | 'rules' | 'faq'

  const steps = [
    {
      num: 1,
      title: 'Login to Portal',
      icon: LogIn,
      desc: 'Log in using your registered University Seat Number (USN) or Student Name and your Date of Birth as the password. Student self-registration is disabled for campus security; accounts are provisioned exclusively by your institution authority.'
    },
    {
      num: 2,
      title: 'Open Leave Application',
      icon: FilePlus2,
      desc: 'Navigate to "Apply Leave" from your student dashboard or sidebar. Choose your appropriate leave category (Medical, Sick, Marriage, Emergency, Casual, or Other).'
    },
    {
      num: 3,
      title: 'Select Dates & Details',
      icon: Calendar,
      desc: 'Pick your Leave Start Date and Leave End Date. The system automatically computes total calendar leave days and sets your official 1-day verification grace deadline.'
    },
    {
      num: 4,
      title: 'Upload Supporting Document (Mandatory)',
      icon: UploadCloud,
      desc: 'Attach genuine supporting documentation (medical prescription, official invitation, event letter, or doctor certificate). Applications cannot be submitted without readable proof.'
    },
    {
      num: 5,
      title: 'Confirm Genuine Declaration & Submit',
      icon: Send,
      desc: 'Check the mandatory honesty declaration confirming your information is true and accurate, then click "Submit Leave". Your request enters the Authority Pending Queue.'
    },
    {
      num: 6,
      title: 'Track Approval Status & 3-Day Alert',
      icon: Clock,
      desc: 'Monitor real-time status under "My Leaves". If an application is pending for more than 3 days, a high-priority pending alert automatically flags in your dashboard.'
    },
    {
      num: 7,
      title: 'Receive Official Pass & 12-Digit QR Code',
      icon: QrCode,
      desc: 'Once approved by your Proctor or Authority, a cryptographically signed QR code and unique 12-digit numeric token are automatically generated for your gate pass and printable single A4 leave letter.'
    },
    {
      num: 8,
      title: 'Return to Campus & Complete Verification',
      icon: ShieldCheck,
      desc: 'Present your QR code or 12-digit token to the campus authority before the verification deadline (End Date + 1 Day Grace). The authority verifies your return.'
    },
    {
      num: 9,
      title: 'Automatic Expiry & Completion',
      icon: CheckCircle2,
      desc: 'Upon successful verification, the leave is marked Verified and immediately expires to prevent duplicate use. If not verified by the grace deadline, it automatically rejects.'
    }
  ];

  const rules = [
    {
      title: 'One-Time QR & Token Use',
      desc: 'Each approved leave QR code and 12-digit token can only be scanned and verified once. After verification, it permanently invalidates.'
    },
    {
      title: '1-Day Verification Grace Period',
      desc: 'You have exactly 1 additional calendar day following your Leave End Date to complete QR verification with the authority.'
    },
    {
      title: 'Automatic Background Rejection',
      desc: 'If verification is not completed before the end of the 1-day grace period, the system automatically marks the leave as "Rejected – Verification Deadline Expired".'
    },
    {
      title: 'Mandatory True Information Declaration',
      desc: 'Submitting false or forged medical certificates or fake reasons will result in the Authority marking the leave as Invalid with institutional attendance restrictions (1 to 5+ days penalty).'
    },
    {
      title: 'Official Single A4 Digital Leave Letter',
      desc: 'You can view, print, or download your official computerized leave letter in standard single A4 format anytime.'
    }
  ];

  return (
    <div className="page-transition" style={{ maxWidth: 880, margin: '0 auto' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-800) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '30px 32px',
          color: '#ffffff',
          marginBottom: 24,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37, 99, 235, 0.25)', color: '#93c5fd', padding: '4px 12px', borderRadius: 9999, fontSize: '0.78rem', fontWeight: 700, marginBottom: 10 }}>
          <HelpCircle size={14} /> In-App Help & Guide
        </div>
        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', marginBottom: 8 }}>
          How to Use the Digital Leave System
        </h2>
        <p style={{ fontSize: '0.92rem', color: '#cbd5e1', maxWidth: 680, lineHeight: 1.5 }}>
          Follow our clean step-by-step instructions for submitting leave requests, tracking proctor approvals, downloading your official single A4 pass, and completing QR verification.
        </p>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setActiveTab('guide')}
            className="btn"
            style={{
              background: activeTab === 'guide' ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)'
            }}
          >
            Step-by-Step Guide
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className="btn btn-outline"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              padding: '8px 14px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            title="Refresh Guide"
          >
            <RotateCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className="btn"
            style={{
              background: activeTab === 'rules' ? 'var(--primary-500)' : 'rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              padding: '8px 16px',
              fontSize: '0.85rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)'
            }}
          >
            Important Rules & Deadlines
          </button>
        </div>
      </div>

      {/* Guide Tab */}
      {activeTab === 'guide' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="form-card"
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 18,
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                    color: 'var(--primary-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    flexShrink: 0
                  }}
                >
                  {s.num}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <Icon size={18} color="var(--primary-500)" />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-900)' }}>
                      Step {s.num}: {s.title}
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}

          <div style={{ textAlign: 'center', marginTop: 12, marginBottom: 30 }}>
            {onNavigate && (
              <button
                onClick={() => onNavigate('apply-leave')}
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '0.95rem' }}
              >
                Ready? Apply for Leave Now <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              padding: '16px 20px',
              background: '#fffbeb',
              border: '2px solid #fde68a',
              borderRadius: 'var(--radius-lg)',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}
          >
            <AlertTriangle size={28} />
            <div>
              <strong style={{ fontSize: '0.95rem' }}>Automated Verification Compliance</strong>
              <div style={{ fontSize: '0.85rem', marginTop: 2 }}>
                Please review these institutional regulations carefully. The system enforces cryptographic QR verification and server-side calendar expiry.
              </div>
            </div>
          </div>

          {rules.map((r, i) => (
            <div
              key={i}
              className="form-card"
              style={{ padding: '22px 24px', borderLeft: '4px solid var(--primary-600)' }}
            >
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-900)', marginBottom: 6 }}>
                {r.title}
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
