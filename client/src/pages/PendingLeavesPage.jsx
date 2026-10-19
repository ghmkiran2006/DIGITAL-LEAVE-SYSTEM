import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import Avatar from '../components/Avatar';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import {
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  X,
  Calendar,
  User,
  ShieldCheck,
  Search,
  ShieldAlert,
  Download,
  RefreshCw
} from 'lucide-react';

export default function PendingLeavesPage({ selectedLeaveId, onLeaveActionComplete }) {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeReviewLeave, setActiveReviewLeave] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [approverName, setApproverName] = useState('');
  const [approverDesignation, setApproverDesignation] = useState('Proctor / Teacher');
  const [approveComments, setApproveComments] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingName, setRejectingName] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Invalid / False Leave Modal
  const [showInvalidModal, setShowInvalidModal] = useState(false);
  const [invalidAuthorityName, setInvalidAuthorityName] = useState('');
  const [invalidReason, setInvalidReason] = useState('');
  const [penaltyDays, setPenaltyDays] = useState(3);
  const [customPenalty, setCustomPenalty] = useState('');

  // Document preview modal
  const [previewDocFile, setPreviewDocFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchPendingLeaves = async () => {
    try {
      setLoading(true);
      // Strictly query PENDING leaves only
      const res = await api.getAuthorityLeaves({ status: 'PENDING' });
      if (res.success) {
        setLeaves(res.leaves || []);
        if (selectedLeaveId) {
          const found = res.leaves.find((l) => l.id === selectedLeaveId);
          if (found) setActiveReviewLeave(found);
        }
      }
    } catch (err) {
      console.error('Fetch pending leaves error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLeaves();
  }, [selectedLeaveId]);

  const handleOpenApprove = (leave) => {
    setActiveReviewLeave(leave);
    setApproverName('');
    setApproverDesignation('Proctor / Teacher');
    setApproveComments('Supporting proof verified. Leave approved.');
    setActionError('');
    setShowApproveConfirm(true);
  };

  const handleOpenReject = (leave) => {
    setActiveReviewLeave(leave);
    setRejectingName('');
    setRejectionReason('');
    setActionError('');
    setShowRejectModal(true);
  };

  const handleOpenInvalid = (leave) => {
    setActiveReviewLeave(leave);
    setInvalidAuthorityName('');
    setInvalidReason('');
    setPenaltyDays(3);
    setCustomPenalty('');
    setActionError('');
    setShowInvalidModal(true);
  };

  const handleConfirmApprove = async () => {
    if (!activeReviewLeave) return;
    if (!approverName.trim()) {
      setActionError('Approving Proctor / Teacher Name is required before final approval.');
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      const res = await api.approveLeave(
        activeReviewLeave.id,
        approverName.trim(),
        approverDesignation.trim(),
        approveComments.trim()
      );
      if (res.success) {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.6 }
        });
        setShowApproveConfirm(false);
        setActiveReviewLeave(null);
        fetchPendingLeaves();
        if (onLeaveActionComplete) onLeaveActionComplete();
      }
    } catch (err) {
      setActionError(err.message || 'Failed to approve leave application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!activeReviewLeave) return;
    if (!rejectionReason.trim()) {
      setActionError('Rejection reason is mandatory. Please state why this leave is being rejected.');
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      const res = await api.rejectLeave(
        activeReviewLeave.id,
        rejectionReason.trim(),
        rejectingName.trim()
      );
      if (res.success) {
        setShowRejectModal(false);
        setActiveReviewLeave(null);
        fetchPendingLeaves();
        if (onLeaveActionComplete) onLeaveActionComplete();
      }
    } catch (err) {
      setActionError(err.message || 'Failed to reject leave application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmInvalid = async () => {
    if (!activeReviewLeave) return;
    if (!invalidReason.trim()) {
      setActionError('Reason for marking leave as invalid is mandatory.');
      return;
    }

    const finalDays = penaltyDays === 'custom' ? parseInt(customPenalty, 10) : parseInt(penaltyDays, 10);
    if (isNaN(finalDays) || finalDays < 1) {
      setActionError('Please specify valid number of upcoming attendance penalty days (minimum 1).');
      return;
    }

    setActionLoading(true);
    setActionError('');
    try {
      const res = await api.markLeaveInvalid(activeReviewLeave.id, {
        authorityName: invalidAuthorityName.trim(),
        reason: invalidReason.trim(),
        attendancePenaltyDays: finalDays
      });
      if (res.success) {
        setShowInvalidModal(false);
        setActiveReviewLeave(null);
        fetchPendingLeaves();
        if (onLeaveActionComplete) onLeaveActionComplete();
      }
    } catch (err) {
      setActionError(err.message || 'Failed to apply disciplinary action.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLeaves = leaves.filter((l) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.student_name?.toLowerCase().includes(term) ||
      l.usn?.toLowerCase().includes(term) ||
      l.leave_application_number?.toLowerCase().includes(term) ||
      l.leave_type?.toLowerCase().includes(term) ||
      l.standard?.toLowerCase().includes(term) ||
      l.department_code?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="page-transition">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-900)' }}>
            Pending Leave Approvals ({leaves.length})
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Review pending applications only. Approved, verified, or expired requests are automatically excluded.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={fetchPendingLeaves} className="btn btn-outline" style={{ padding: '8px 14px' }}>
            <RefreshCw size={15} /> Refresh
          </button>

          <div style={{ position: 'relative', width: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search Student, USN, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 36, fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Table of Pending Requests */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Leave ID</th>
                <th>Student</th>
                <th>Academic</th>
                <th>Category & Dates</th>
                <th>Reason & Proof</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                    {loading ? 'Checking for pending leaves...' : 'No pending leave applications. The approval queue is all clear!'}
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <strong style={{ color: 'var(--primary-800)', fontSize: '0.88rem' }}>
                        {l.leave_application_number}
                      </strong>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar
                          src={l.student_photo}
                          name={l.student_name}
                          subtitle={l.usn}
                          size={36}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--primary-900)' }}>{l.student_name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{l.usn}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      {l.standard ? (
                        <div>{l.standard} {l.section ? `(Sec ${l.section})` : ''}</div>
                      ) : (
                        <div>{l.department_code || 'Dept'} • Sem {l.semester}</div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{l.leave_type}</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Calendar size={13} color="var(--primary-600)" />
                        <span>{l.start_date} <span style={{ color: 'var(--text-muted)' }}>to</span> {l.end_date}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {l.number_of_days} Day{l.number_of_days > 1 ? 's' : ''} {l.grace_date && `• Grace: ${l.grace_date}`}
                      </div>
                    </td>

                    <td>
                      <div style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem' }}>
                        {l.reason}
                      </div>
                      {l.document_file && (
                        <button
                          type="button"
                          onClick={() => setPreviewDocFile(l.document_file)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-600)',
                            fontSize: '0.76rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            cursor: 'pointer',
                            marginTop: 4
                          }}
                        >
                          <Eye size={12} /> View Uploaded Proof
                        </button>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleOpenApprove(l)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <CheckCircle2 size={13} /> Approve
                        </button>

                        <button
                          onClick={() => handleOpenReject(l)}
                          className="btn btn-outline"
                          style={{ padding: '6px 10px', fontSize: '0.78rem', color: 'var(--danger)' }}
                        >
                          <XCircle size={13} /> Reject
                        </button>

                        <button
                          onClick={() => handleOpenInvalid(l)}
                          className="btn btn-outline"
                          style={{ padding: '6px 10px', fontSize: '0.78rem', color: 'var(--accent-amber)' }}
                          title="Mark as Invalid / False Leave"
                        >
                          <ShieldAlert size={13} /> Mark Invalid
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. APPROVE CONFIRMATION MODAL (Requires Proctor / Teacher Name) */}
      {showApproveConfirm && activeReviewLeave && (
        <div className="modal-backdrop" onClick={() => setShowApproveConfirm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-900)' }}>
                Approve Leave Application
              </h3>
              <button onClick={() => setShowApproveConfirm(false)} className="icon-btn" style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              {actionError && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem', marginBottom: 14 }}>
                  {actionError}
                </div>
              )}

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', marginBottom: 16, fontSize: '0.85rem' }}>
                <div>Student: <strong>{activeReviewLeave.student_name}</strong> ({activeReviewLeave.usn})</div>
                <div>Duration: <strong>{activeReviewLeave.start_date}</strong> to <strong>{activeReviewLeave.end_date}</strong> ({activeReviewLeave.number_of_days} days)</div>
                <div>Reason: {activeReviewLeave.reason}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Approving Proctor / Teacher Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Dr. K. Ramesh / Prof. Priya"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                  This name will appear on the official student leave letter and gate pass.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Authority Designation</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Proctor / Class Teacher / HOD"
                  value={approverDesignation}
                  onChange={(e) => setApproverDesignation(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Approval Remarks</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Supporting proof verified. Approved."
                  value={approveComments}
                  onChange={(e) => setApproveComments(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowApproveConfirm(false)} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={handleConfirmApprove} className="btn btn-primary" disabled={actionLoading}>
                {actionLoading ? 'Issuing Approval...' : 'Confirm & Generate QR Pass'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REJECT MODAL (Mandatory Reason + Rejecting Authority Name) */}
      {showRejectModal && activeReviewLeave && (
        <div className="modal-backdrop" onClick={() => setShowRejectModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--danger)' }}>
                Reject Leave Application
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="icon-btn" style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              {actionError && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem', marginBottom: 14 }}>
                  {actionError}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Reviewing Authority / Proctor Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Authorized Officer"
                  value={rejectingName}
                  onChange={(e) => setRejectingName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Rejection * (Mandatory)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Provide explicit reason for rejecting this leave request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowRejectModal(false)} className="btn btn-outline">
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="btn btn-primary"
                style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}
                disabled={actionLoading}
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MARK AS INVALID / FALSE LEAVE (Attendance Penalty Action) */}
      {showInvalidModal && activeReviewLeave && (
        <div className="modal-backdrop" onClick={() => setShowInvalidModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header" style={{ borderBottom: '2px solid #f59e0b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b45309' }}>
                <ShieldAlert size={22} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Confirm Invalid Leave & Attendance Action</h3>
              </div>
              <button onClick={() => setShowInvalidModal(false)} className="icon-btn" style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px 24px' }}>
              {actionError && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem', marginBottom: 14 }}>
                  {actionError}
                </div>
              )}

              <div style={{ padding: '12px 14px', background: '#fffbeb', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.84rem', lineHeight: 1.45, marginBottom: 16 }}>
                <strong>Important Notice:</strong> You are about to mark this leave application as invalid or false. This action will permanently reject the application, invalidate any QR code, and assign an institutional attendance restriction for upcoming attendance days.
              </div>

              <div className="form-group">
                <label className="form-label">Authority / Proctor Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Examination / Discipline Head"
                  value={invalidAuthorityName}
                  onChange={(e) => setInvalidAuthorityName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Invalid Action *</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="e.g. Supporting medical prescription verified as invalid / false declaration."
                  value={invalidReason}
                  onChange={(e) => setInvalidReason(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Attendance Penalty: Number of Upcoming Attendance Days Affected *
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                  {[1, 2, 3, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPenaltyDays(num)}
                      className="btn btn-outline"
                      style={{
                        padding: '6px 14px',
                        background: penaltyDays === num ? 'var(--primary-600)' : 'transparent',
                        color: penaltyDays === num ? '#fff' : 'var(--text-main)',
                        borderColor: penaltyDays === num ? 'var(--primary-600)' : 'var(--border-color)',
                        fontWeight: 700
                      }}
                    >
                      {num} Day{num > 1 ? 's' : ''}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPenaltyDays('custom')}
                    className="btn btn-outline"
                    style={{
                      padding: '6px 14px',
                      background: penaltyDays === 'custom' ? 'var(--primary-600)' : 'transparent',
                      color: penaltyDays === 'custom' ? '#fff' : 'var(--text-main)',
                      borderColor: penaltyDays === 'custom' ? 'var(--primary-600)' : 'var(--border-color)',
                      fontWeight: 700
                    }}
                  >
                    Custom
                  </button>
                </div>

                {penaltyDays === 'custom' && (
                  <input
                    type="number"
                    min="1"
                    max="30"
                    className="form-control"
                    placeholder="Enter custom number of attendance days"
                    value={customPenalty}
                    onChange={(e) => setCustomPenalty(e.target.value)}
                    required
                  />
                )}

                <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: 4 }}>
                  Selected Penalty: <strong>{penaltyDays === 'custom' ? customPenalty || 'X' : penaltyDays} upcoming applicable attendance day(s)</strong>.
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setShowInvalidModal(false)} className="btn btn-outline">
                Cancel
              </button>
              <button
                onClick={handleConfirmInvalid}
                className="btn btn-primary"
                style={{ background: '#b45309', borderColor: '#b45309' }}
                disabled={actionLoading}
              >
                {actionLoading ? 'Recording Penalty...' : 'Confirm & Reject Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. In-App Document Viewer */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDocFile)}
        fileUrl={previewDocFile ? `/api/leaves/documents/${previewDocFile}` : null}
        fileName="Supporting Document Proof"
        onClose={() => setPreviewDocFile(null)}
      />
    </div>
  );
}
