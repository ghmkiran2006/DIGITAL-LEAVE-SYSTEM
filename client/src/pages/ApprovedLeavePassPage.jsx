import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import Avatar from '../components/Avatar';
import {
  Printer,
  Download,
  Share2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  ShieldCheck,
  FileText,
  Eye,
  X,
  FileCheck2,
  QrCode
} from 'lucide-react';

export default function ApprovedLeavePassPage({ leaveId, onBack }) {
  const { user } = useAuth();
  const [leave, setLeave] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDocModal, setShowDocModal] = useState(false);

  useEffect(() => {
    async function loadApprovedLeave() {
      try {
        setLoading(true);
        let targetId = leaveId;
        if (!targetId) {
          const res = await api.getStudentLeaves();
          if (res.success && res.leaves.length > 0) {
            // Find latest approved or verified, or any latest
            const found = res.leaves.find((l) => l.status === 'APPROVED' || l.status === 'VERIFIED') || res.leaves[0];
            if (found) targetId = found.id;
          }
        }

        if (!targetId) {
          setError('No leave application found to display.');
          setLoading(false);
          return;
        }

        const leaveRes = await api.getLeaveById(targetId);
        if (leaveRes.success) {
          setLeave(leaveRes.leave);

          if (leaveRes.leave.status === 'APPROVED' || leaveRes.leave.status === 'VERIFIED') {
            const qrRes = await api.getQrCode(targetId);
            if (qrRes.success) {
              setQrData(qrRes);
            }
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to load leave letter.');
      } finally {
        setLoading(false);
      }
    }
    loadApprovedLeave();
  }, [leaveId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrData?.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrData.qrDataUrl;
    a.download = `QR_PASS_${leave?.leave_application_number || 'LEAVE'}.png`;
    a.click();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <Clock size={36} style={{ animation: 'spin 1.5s linear infinite', marginBottom: 12 }} />
        <p>Loading official digital leave letter...</p>
      </div>
    );
  }

  if (error || !leave) {
    return (
      <div className="page-transition" style={{ maxWidth: 580, margin: '40px auto' }}>
        <div className="form-card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <AlertTriangle size={48} color="var(--accent-amber)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>Leave Letter Unavailable</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            {error || 'No leave record is currently available.'}
          </p>
          {onBack && (
            <button className="btn btn-primary" onClick={onBack}>
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  const isSchool = leave.organization_type === 'School';
  const isApproved = leave.status === 'APPROVED';
  const isVerified = leave.status === 'VERIFIED';
  const isRejected = leave.status === 'REJECTED';
  const token12Digit = qrData?.token || leave.qr_token || 'Awaiting Approval';

  return (
    <div className="page-transition" style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Action Toolbar (Hidden in Print) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <button onClick={onBack} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
              ← Back
            </button>
          )}
          <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-900)' }}>
            Official Digital Leave Letter
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {qrData?.qrDataUrl && (
            <button onClick={handleDownloadQr} className="btn btn-outline" style={{ padding: '7px 14px', fontSize: '0.82rem' }}>
              <Download size={14} /> Download QR
            </button>
          )}

          <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '7px 18px', fontSize: '0.82rem' }}>
            <Printer size={15} /> Print / Save PDF (A4)
          </button>
        </div>
      </div>

      {/* SINGLE A4 SHEET DOCUMENT CONTAINER */}
      <div
        className="a4-document-container"
        style={{
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid #cbd5e1',
          padding: '28px 36px',
          margin: '0 auto 40px auto',
          position: 'relative',
          maxWidth: '800px',
          minHeight: '1020px', // Exact A4 aspect proportion
          boxSizing: 'border-box'
        }}
      >
        {/* Verification Watermark if Verified */}
        {isVerified && (
          <div
            style={{
              position: 'absolute',
              top: '42%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-25deg)',
              border: '6px solid rgba(16, 185, 129, 0.28)',
              color: 'rgba(16, 185, 129, 0.32)',
              fontSize: '3.6rem',
              fontWeight: 900,
              letterSpacing: '0.15em',
              padding: '12px 36px',
              borderRadius: '16px',
              userSelect: 'none',
              pointerEvents: 'none',
              zIndex: 10,
              textTransform: 'uppercase'
            }}
          >
            VERIFIED
          </div>
        )}

        {/* 1. Header: Dynamic Institution Branding */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #0f2744',
            paddingBottom: '16px',
            marginBottom: '18px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {leave.org_logo ? (
              <img
                src={leave.org_logo}
                alt="Institution Logo"
                style={{ width: 56, height: 56, objectFit: 'contain' }}
              />
            ) : (
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #07162c 0%, #134074 100%)',
                  color: '#d4af37',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.25rem'
                }}
              >
                {leave.org_short_name || 'BITM'}
              </div>
            )}

            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#07162c', letterSpacing: '-0.02em', margin: 0 }}>
                {leave.org_name || 'Ballari Institute of Technology and Management'}
              </h1>
              <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600, marginTop: 2 }}>
                {leave.app_name || 'Smart Leave Management & Verification System'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Autonomous Institution • Affiliated to University • Accreditation Division
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 4,
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                background: isVerified ? '#d1fae5' : isApproved ? '#dbeafe' : isRejected ? '#fee2e2' : '#fef3c7',
                color: isVerified ? '#047857' : isApproved ? '#1d4ed8' : isRejected ? '#b91c1c' : '#b45309',
                border: '1px solid currentColor'
              }}
            >
              {isVerified ? 'STATUS: VERIFIED & COMPLETED' : `STATUS: ${leave.status}`}
            </span>
            <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 4 }}>
              App No: <strong>{leave.leave_application_number}</strong>
            </div>
          </div>
        </div>

        {/* 2. Formal Addressee */}
        <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.45, marginBottom: 14 }}>
          <strong>To,</strong>
          <br />
          The Concerned Authority / Proctor / Head of Department,
          <br />
          {leave.org_name || 'Ballari Institute of Technology and Management'}.
        </div>

        {/* 3. Student & Academic Information Table */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            padding: '12px 16px',
            marginBottom: 16
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: '0.82rem' }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                Student Name
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <Avatar
                  src={leave.student_photo}
                  name={leave.student_name}
                  subtitle={leave.usn}
                  size={32}
                />
                <strong style={{ color: '#0f172a' }}>{leave.student_name}</strong>
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                {isSchool ? 'Roll Number / ID' : 'Student ID / USN'}
              </span>
              <strong style={{ color: '#0f172a' }}>{leave.usn}</strong>
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                {isSchool ? 'Standard & Section' : 'Department & Semester'}
              </span>
              <strong style={{ color: '#0f172a' }}>
                {isSchool
                  ? `${leave.standard || '1st Standard'} ${leave.section ? ' - Sec ' + leave.section : ''}`
                  : `${leave.department_code || 'Dept'} • ${leave.semester || '1'}th Semester`}
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                Date of Birth
              </span>
              <span style={{ color: '#0f172a' }}>{leave.dob}</span>
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                Application Date
              </span>
              <span style={{ color: '#0f172a' }}>{new Date(leave.created_at).toLocaleDateString()}</span>
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                Contact Number
              </span>
              <span style={{ color: '#0f172a' }}>{leave.student_mobile || 'Registered in ERP'}</span>
            </div>
          </div>
        </div>

        {/* 4. Formal Request Body */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#07162c', marginBottom: 4 }}>
            Sub: Application for {leave.leave_type} ({leave.number_of_days} Day{leave.number_of_days > 1 ? 's' : ''})
          </div>

          <p style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.5, margin: '6px 0' }}>
            Respected Sir/Madam,
            <br />
            I, <strong>{leave.student_name}</strong> ({isSchool ? `Standard ${leave.standard || ''}` : `USN ${leave.usn}`}),
            respectfully request leave of absence from <strong>{leave.start_date}</strong> to <strong>{leave.end_date}</strong> (Total duration: <strong>{leave.number_of_days} Day{leave.number_of_days > 1 ? 's' : ''}</strong>).
          </p>

          <div
            style={{
              padding: '10px 14px',
              background: '#f1f5f9',
              borderRadius: 6,
              borderLeft: '3px solid #134074',
              fontSize: '0.82rem',
              color: '#1e293b',
              marginTop: 8
            }}
          >
            <strong>Reason:</strong> {leave.reason}
            {leave.additional_remarks && (
              <div style={{ marginTop: 4 }}>
                <strong>Remarks / Details:</strong> {leave.additional_remarks}
              </div>
            )}
          </div>
        </div>

        {/* 5. Supporting Document Section with In-App View */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 6,
            padding: '10px 14px',
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.82rem'
          }}
        >
          <div>
            <span style={{ fontWeight: 700, color: '#07162c' }}>Supporting Attachment: </span>
            <span style={{ color: '#475569' }}>
              {leave.document_name ? leave.document_name : 'Mandatory Document Uploaded'}
            </span>
          </div>

          {leave.document_file && (
            <button
              onClick={() => setShowDocModal(true)}
              className="no-print btn btn-outline"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
            >
              <Eye size={13} /> View Attached Document
            </button>
          )}
        </div>

        {/* 6. Authority Decision Section */}
        <div
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            padding: '12px 16px',
            marginBottom: 16,
            background: isApproved || isVerified ? '#f0fdf4' : isRejected ? '#fef2f2' : '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginBottom: 2 }}>
                Institutional Review & Decision
              </div>

              {isApproved || isVerified ? (
                <>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#047857' }}>
                    APPROVED by {leave.approver_name || 'Proctor / Authority'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: 2 }}>
                    Designation: {leave.approver_designation || 'Proctor / Authorized Leave Officer'}
                    {leave.approval_date && ` • Approved on: ${new Date(leave.approval_date).toLocaleDateString()}`}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 4 }}>
                    Verification Grace Date: <strong>{leave.grace_date || 'Next Calendar Day'}</strong> (Deadline: End of grace date)
                  </div>
                </>
              ) : isRejected ? (
                <>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#b91c1c' }}>
                    REJECTED {leave.is_invalid ? '– MARKED AS INVALID LEAVE' : ''}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: 2 }}>
                    Reviewed by: {leave.rejected_by_name || 'Authority'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#991b1b', marginTop: 2 }}>
                    Reason: {leave.rejection_reason || 'Criteria not met.'}
                  </div>
                  {leave.attendance_penalty_days > 0 && (
                    <div style={{ fontSize: '0.78rem', color: '#b91c1c', fontWeight: 700, marginTop: 4 }}>
                      Disciplinary Attendance Restriction: {leave.attendance_penalty_days} upcoming applicable attendance day(s).
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 700 }}>
                  PENDING REVIEW by Concerned Proctor / Authority
                </div>
              )}
            </div>

            {/* QR Code and 12-Digit Token Stamp */}
            {(isApproved || isVerified) && qrData?.qrDataUrl && (
              <div style={{ textAlign: 'center', padding: '6px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 6 }}>
                <img
                  src={qrData.qrDataUrl}
                  alt="Verification QR"
                  style={{ width: 90, height: 90, display: 'block', margin: '0 auto' }}
                />
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#07162c', marginTop: 4 }}>
                  12-Digit Token:
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 900, color: '#134074', letterSpacing: '0.06em' }}>
                  {token12Digit}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 7. Verification Stamp / Footer Note */}
        {isVerified && (
          <div
            style={{
              padding: '8px 12px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 6,
              marginBottom: 16,
              fontSize: '0.78rem',
              color: '#065f46',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <CheckCircle2 size={16} color="#059669" />
            <span>
              <strong>Verified on Campus Return:</strong> Verified by{' '}
              <strong>{leave.verified_by_name || 'Campus Gate Authority'}</strong> on{' '}
              {new Date(leave.verified_at || Date.now()).toLocaleString()}. This pass has expired and cannot be reused.
            </span>
          </div>
        )}

        {/* 8. Computerized Signature Declaration (Strict Requirement) */}
        <div
          style={{
            borderTop: '1px dashed #cbd5e1',
            paddingTop: '12px',
            marginTop: 'auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: '#64748b'
          }}
        >
          <div>
            <strong>Declaration:</strong> This is a digitally generated and verified leave letter from the {leave.app_name || 'Digital Leave System'}.
            <br />
            <strong>Note:</strong> It is computerized so physical signature is not required.
          </div>

          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 700, color: '#07162c' }}>Official College / School Record</span>
            <br />
            Generated on: {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* In-App Document Viewer Modal (No External Redirection) */}
      <DocumentPreviewModal
        isOpen={showDocModal}
        fileUrl={leave.document_file ? `/api/leaves/documents/${leave.document_file}` : null}
        fileName={leave.document_name || 'Supporting Document'}
        fileType={leave.document_type}
        onClose={() => setShowDocModal(false)}
      />
    </div>
  );
}
