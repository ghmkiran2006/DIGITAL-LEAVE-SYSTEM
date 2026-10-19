import React, { useState } from 'react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import {
  FilePlus2,
  Calendar,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  X,
  FileCheck,
  Eye,
  Sparkles,
  ShieldAlert,
  Clock,
  ArrowRight,
  RotateCw
} from 'lucide-react';

export default function ApplyLeavePage({ onLeaveSubmitted, onCancel }) {
  const [leaveType, setLeaveType] = useState('Medical Leave');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [additionalRemarks, setAdditionalRemarks] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const leaveTypes = [
    'Sick/Medical Leave',
    'Marriage Leave',
    'Personal Leave',
    'Emergency Leave',
    'Casual Leave',
    'Other'
  ];

  // Calculate days difference
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return 0;
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff;
  };

  const numberOfDays = calculateDays(startDate, endDate);

  // Calculate Grace Date & Verification Deadline
  const getGraceInfo = () => {
    if (!endDate) return null;
    const end = new Date(endDate);
    if (isNaN(end.getTime())) return null;
    const grace = new Date(end);
    grace.setDate(grace.getDate() + 1);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return {
      graceDateStr: grace.toLocaleDateString('en-IN', options),
      endDateStr: end.toLocaleDateString('en-IN', options)
    };
  };

  const graceInfo = getGraceInfo();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file format. Only JPG, JPEG, PNG, and PDF files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10 MB limit.');
      return;
    }

    setError('');
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!leaveType || !reason.trim() || !startDate || !endDate) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    if (numberOfDays <= 0) {
      setError('End Date must be on or after Start Date.');
      return;
    }

    if (!selectedFile) {
      setError('Supporting document is required for leave submission. Please upload medical certificate, invitation, or relevant proof.');
      return;
    }

    if (!declarationConfirmed) {
      setError('You must confirm the leave declaration checkbox before submitting.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('leaveType', leaveType);
      formData.append('reason', reason.trim());
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('additionalRemarks', additionalRemarks.trim());
      formData.append('supportingDocument', selectedFile);

      const res = await api.applyLeave(formData);
      if (res.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        setSuccessInfo({
          leaveId: res.leaveId,
          leaveNumber: res.leaveApplicationNumber,
          graceDate: res.graceDate,
          days: numberOfDays
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to submit leave application.');
    } finally {
      setLoading(false);
    }
  };

  if (successInfo) {
    return (
      <div className="page-transition" style={{ maxWidth: 640, margin: '40px auto' }}>
        <div className="form-card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#d1fae5',
              color: '#059669',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20
            }}
          >
            <CheckCircle2 size={42} />
          </div>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-900)', marginBottom: 8 }}>
            Leave Application Submitted!
          </h3>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Your request has been forwarded to the institutional authority queue.
          </p>

          <div
            style={{
              background: '#f8fafc',
              borderRadius: 'var(--radius-lg)',
              padding: '16px 20px',
              border: '1px solid var(--border-color)',
              marginBottom: 24,
              textAlign: 'left',
              fontSize: '0.86rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)' }}>Application Number:</span>
              <strong style={{ color: 'var(--primary-800)' }}>{successInfo.leaveNumber}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Duration:</span>
              <strong>{successInfo.days} Calendar Day{successInfo.days > 1 ? 's' : ''}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text-muted)' }}>1-Day Verification Grace Date:</span>
              <strong style={{ color: 'var(--accent-amber)' }}>{successInfo.graceDate}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span className="status-pill status-PENDING">PENDING REVIEW</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => onLeaveSubmitted && onLeaveSubmitted(successInfo.leaveId)}
              className="btn btn-primary"
              style={{ padding: '12px 24px' }}
            >
              View My Applications <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition" style={{ maxWidth: 740, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-900)' }}>
            Apply for Student Leave
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Submit leave details, attach supporting documentation, and track authorization in real time
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLeaveType('Sick/Medical Leave');
            setReason('');
            setStartDate('');
            setEndDate('');
            setAdditionalRemarks('');
            setSelectedFile(null);
            setPreviewUrl(null);
            setDeclarationConfirmed(false);
            setError('');
          }}
          className="btn btn-outline"
          style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
          title="Reset and refresh form"
        >
          <RotateCw size={14} /> Refresh Form
        </button>
      </div>

      <div className="form-card" style={{ padding: '36px' }}>
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 24
            }}
          >
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Leave Type */}
          <div className="form-group">
            <label className="form-label" htmlFor="leave-type-select">
              Leave Category *
            </label>
            <select
              id="leave-type-select"
              className="form-control"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              required
            >
              {leaveTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range with Automatic Calculation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="leave-start-date">
                Leave Start Date *
              </label>
              <input
                id="leave-start-date"
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="leave-end-date">
                Leave End Date *
              </label>
              <input
                id="leave-end-date"
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Automatic Calendar & Grace Summary Box */}
          {startDate && endDate && numberOfDays > 0 && graceInfo && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={20} color="var(--primary-600)" />
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--primary-900)' }}>
                    Total Leave Duration: {numberOfDays} Calendar Day{numberOfDays > 1 ? 's' : ''}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Final Leave Day: {graceInfo.endDateStr}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    border: '1px solid #fde68a',
                    padding: '3px 10px',
                    borderRadius: 9999,
                    fontSize: '0.74rem',
                    fontWeight: 700
                  }}
                >
                  1-Day Grace Verification
                </span>
                <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 3 }}>
                  Deadline: End of <strong>{graceInfo.graceDateStr}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Primary Reason */}
          <div className="form-group">
            <label className="form-label" htmlFor="leave-reason-input">
              Reason for Leave *
            </label>
            <input
              id="leave-reason-input"
              type="text"
              className="form-control"
              placeholder="e.g. Viral fever and medical recovery / Sister's marriage ceremony"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          {/* Additional Remarks */}
          <div className="form-group">
            <label className="form-label" htmlFor="leave-remarks-input">
              Detailed Description / Remarks (Optional)
            </label>
            <textarea
              id="leave-remarks-input"
              className="form-control"
              rows="3"
              placeholder="Provide any additional context or details for the authority..."
              value={additionalRemarks}
              onChange={(e) => setAdditionalRemarks(e.target.value)}
            />
          </div>

          {/* Mandatory Supporting Document Upload */}
          <div className="form-group">
            <label className="form-label">
              Upload Supporting Document * (Medical Certificate, Prescription, Invitation, or Proof)
            </label>

            <div
              style={{
                fontSize: '0.78rem',
                color: '#64748b',
                background: '#f1f5f9',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 10,
                border: '1px solid #e2e8f0'
              }}
            >
              <strong>Supporting Document Reminder:</strong> Please upload a clear image or PDF document. Submission is not permitted without valid proof.
            </div>

            {!selectedFile ? (
              <label
                htmlFor="file-upload"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px 20px',
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <UploadCloud size={38} color="var(--primary-500)" style={{ marginBottom: 10 }} />
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary-900)' }}>
                  Click to select supporting document
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Supported formats: JPG, PNG, PDF (Max 10 MB)
                </span>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: '#f8fafc',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileCheck size={28} color="var(--success)" />
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-900)' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Document'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="icon-btn"
                    style={{ width: 32, height: 32, color: 'var(--danger)' }}
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pre-Submission Important Leave Declaration & Warning */}
          <div
            style={{
              padding: '18px 20px',
              background: 'rgba(15, 23, 42, 0.03)',
              border: '1px solid #cbd5e1',
              borderRadius: 'var(--radius-lg)',
              marginTop: 22,
              marginBottom: 24
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary-900)', fontWeight: 800, fontSize: '0.92rem', marginBottom: 6 }}>
              <ShieldAlert size={18} color="var(--accent-amber)" /> Important Leave Declaration & Warning
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
              Please ensure that all information provided in this leave application is correct and genuine. If the Authority determines that the leave request contains false, misleading, or invalid information, the application will be rejected and disciplinary attendance restrictions (1 to 5+ applicable attendance days) may be applied according to institutional rules.
            </p>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.86rem',
                fontWeight: 600,
                color: 'var(--primary-900)',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={declarationConfirmed}
                onChange={(e) => setDeclarationConfirmed(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--primary-600)', cursor: 'pointer' }}
                id="declaration-checkbox"
                required
              />
              <span>I confirm that the information provided in this leave application is true and accurate.</span>
            </label>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end' }}>
            {onCancel && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={onCancel}
                style={{ padding: '12px 24px' }}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              id="submit-leave-btn"
              disabled={loading || !declarationConfirmed || !selectedFile}
              style={{ padding: '12px 28px', fontSize: '0.96rem' }}
            >
              {loading ? 'Submitting Leave...' : 'Submit Leave Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
