import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import confetti from 'canvas-confetti';
import { Html5Qrcode } from 'html5-qrcode';
import {
  ScanLine,
  Camera,
  UploadCloud,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
  FileCheck,
  User,
  X
} from 'lucide-react';

export default function QRScannerPage({ onVerificationComplete }) {
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Scan Result State
  const [scanResult, setScanResult] = useState(null);

  // Verification Confirmation Modal State (Requires Proctor / Teacher Name)
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifiedByName, setVerifiedByName] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('Campus return verified');
  const [verifying, setVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(null);

  const html5QrCodeRef = useRef(null);
  const scannerContainerId = 'bitm-qr-camera-stream';

  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const startCameraScanner = async () => {
    setCameraError('');
    setScanning(true);
    setScanResult(null);
    setVerificationSuccess(null);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
      }

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handleTokenDetected(decodedText);
          stopCameraScanner();
        },
        () => {
          // ignore stream frame scan errors
        }
      );
    } catch (err) {
      console.error('Camera init error:', err);
      setCameraError(err.message || 'Unable to access device camera. Please check camera permissions or try Manual Entry.');
      setScanning(false);
    }
  };

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.error('Stop scanner error:', err);
      }
    }
    setScanning(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setCameraError('');
    try {
      const html5QrCode = new Html5Qrcode('bitm-qr-file-dummy');
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      await handleTokenDetected(decodedText);
    } catch (err) {
      setCameraError('Could not decode QR code from the uploaded image. Please ensure the QR code is clearly visible.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleTokenDetected(manualToken.trim());
  };

  const handleTokenDetected = async (tokenString) => {
    setLoading(true);
    setScanResult(null);
    setVerificationSuccess(null);

    try {
      const res = await api.scanQr(tokenString);
      setScanResult(res);
      if (res.valid) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.5 }
        });
      }
    } catch (err) {
      setScanResult({
        success: false,
        valid: false,
        status: 'INVALID_LEAVE',
        errorReason: err.message || 'QR Scan error',
        message: 'INVALID LEAVE'
      });
    } finally {
      setLoading(false);
    }
  };

  // Open modal asking for Proctor / Teacher Name before final verification
  const handleOpenVerifyModal = () => {
    setVerifiedByName('');
    setVerificationNotes('Verified upon return to campus');
    setShowVerifyModal(true);
  };

  const handleFinalVerify = async (e) => {
    if (e) e.preventDefault();
    if (!scanResult?.leave?.id) return;

    if (!verifiedByName.trim()) {
      alert('Please enter the Proctor or Teacher Name verifying this leave.');
      return;
    }

    setVerifying(true);
    try {
      const res = await api.verifyLeave(
        scanResult.leave.id,
        scanResult.tokenRecordId,
        verifiedByName.trim(),
        verificationNotes.trim()
      );
      if (res.success) {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 }
        });
        setVerificationSuccess(res.verification);
        setShowVerifyModal(false);
        if (onVerificationComplete) onVerificationComplete();
      }
    } catch (err) {
      alert(err.message || 'Failed to complete verification.');
    } finally {
      setVerifying(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setVerificationSuccess(null);
    setManualToken('');
    setCameraError('');
  };

  return (
    <div className="page-transition" style={{ maxWidth: 740, margin: '0 auto' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-900)' }}>
            QR Code & Token Verification
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Scan student gate pass QR or enter the 12-digit numeric token to verify campus return
          </p>
        </div>
        <button
          onClick={resetScanner}
          className="btn btn-outline"
          style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
          title="Reset scanner"
        >
          <RotateCw size={14} /> Refresh
        </button>
      </div>

      {/* Hidden dummy container for file scanning */}
      <div id="bitm-qr-file-dummy" style={{ display: 'none' }} />

      {/* Verification Success Screen */}
      {verificationSuccess && (
        <div className="form-card" style={{ textAlign: 'center', padding: '40px 24px', border: '2px solid var(--success)' }}>
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
              marginBottom: 16
            }}
          >
            <CheckCircle2 size={42} />
          </div>

          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#065f46', marginBottom: 6 }}>
            Leave Verified Successfully – Leave Expired.
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: 540, margin: '0 auto 20px' }}>
            The student's return to campus has been verified by <strong>{verificationSuccess.verifiedBy}</strong>. The leave pass and 12-digit token have been permanently expired and cannot be reused.
          </p>

          <button onClick={resetScanner} className="btn btn-primary" style={{ padding: '10px 24px' }}>
            <RotateCcw size={15} /> Scan Next Student Pass
          </button>
        </div>
      )}

      {/* Active Scan Result Screen (Valid Leave Pending Authority Proctor Name) */}
      {!verificationSuccess && scanResult && (
        <div className="form-card" style={{ padding: '28px', border: scanResult.valid ? '2px solid var(--primary-600)' : '2px solid var(--danger)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 'var(--radius-md)',
                background: scanResult.valid ? '#d1fae5' : '#fee2e2',
                color: scanResult.valid ? '#059669' : '#b91c1c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {scanResult.valid ? <CheckCircle2 size={30} /> : <XCircle size={30} />}
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: scanResult.valid ? '#065f46' : '#991b1b' }}>
                {scanResult.valid ? 'VALID LEAVE PASS' : scanResult.message || 'INVALID LEAVE'}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {scanResult.valid
                  ? 'Matched record in database. Confirm proctor name below to verify.'
                  : scanResult.errorReason || 'Verification check failed.'}
              </p>
            </div>

            <button onClick={resetScanner} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
              Reset
            </button>
          </div>

          {scanResult.leave && (
            <div
              style={{
                background: '#f8fafc',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 20px',
                border: '1px solid var(--border-color)',
                marginBottom: 20,
                fontSize: '0.86rem'
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Student Name
                  </span>
                  <div style={{ fontWeight: 700, color: 'var(--primary-900)' }}>{scanResult.leave.studentName}</div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    {scanResult.leave.organizationType === 'School' ? 'Standard / Roll No' : 'USN / Student ID'}
                  </span>
                  <div style={{ fontWeight: 700 }}>{scanResult.leave.usn}</div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Category & Days
                  </span>
                  <div>{scanResult.leave.leaveType} ({scanResult.leave.numberOfDays} days)</div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    Leave Dates
                  </span>
                  <div>{scanResult.leave.startDate} to {scanResult.leave.endDate}</div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    1-Day Verification Grace Date
                  </span>
                  <div style={{ fontWeight: 700, color: '#b45309' }}>{scanResult.leave.graceDate}</div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', textTransform: 'uppercase', fontWeight: 700 }}>
                    12-Digit Token
                  </span>
                  <div style={{ fontWeight: 800, color: 'var(--primary-700)', letterSpacing: '0.05em' }}>
                    {scanResult.leave.token}
                  </div>
                </div>
              </div>
            </div>
          )}

          {scanResult.valid && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={resetScanner} className="btn btn-outline" style={{ padding: '10px 20px' }}>
                Cancel
              </button>
              <button
                onClick={handleOpenVerifyModal}
                className="btn btn-primary"
                style={{ padding: '10px 26px', fontSize: '0.95rem' }}
              >
                <CheckCircle2 size={16} /> Verify Leave Return
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Scanner Card (When no result is active) */}
      {!verificationSuccess && !scanResult && (
        <div className="form-card" style={{ padding: '32px' }}>
          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
            <button
              onClick={() => { setScanMode('camera'); stopCameraScanner(); }}
              className="btn"
              style={{
                flex: 1,
                background: scanMode === 'camera' ? 'var(--primary-600)' : '#f1f5f9',
                color: scanMode === 'camera' ? '#fff' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px'
              }}
            >
              <Camera size={16} /> Live Camera
            </button>

            <button
              onClick={() => { setScanMode('manual'); stopCameraScanner(); }}
              className="btn"
              style={{
                flex: 1,
                background: scanMode === 'manual' ? 'var(--primary-600)' : '#f1f5f9',
                color: scanMode === 'manual' ? '#fff' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px'
              }}
            >
              <KeyRound size={16} /> 12-Digit Token Entry
            </button>

            <button
              onClick={() => { setScanMode('upload'); stopCameraScanner(); }}
              className="btn"
              style={{
                flex: 1,
                background: scanMode === 'upload' ? 'var(--primary-600)' : '#f1f5f9',
                color: scanMode === 'upload' ? '#fff' : 'var(--text-main)',
                fontWeight: 700,
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px'
              }}
            >
              <UploadCloud size={16} /> Image File
            </button>
          </div>

          {cameraError && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '0.85rem',
                marginBottom: 20
              }}
            >
              {cameraError}
            </div>
          )}

          {/* Mode 1: Camera Scanner */}
          {scanMode === 'camera' && (
            <div style={{ textAlign: 'center' }}>
              <div
                id={scannerContainerId}
                style={{
                  width: '100%',
                  maxWidth: 360,
                  height: scanning ? 320 : 220,
                  margin: '0 auto 20px',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  background: '#07162c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  border: '2px dashed var(--primary-500)'
                }}
              >
                {!scanning && (
                  <div style={{ padding: '20px' }}>
                    <ScanLine size={48} style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                    <p style={{ fontSize: '0.88rem' }}>Click below to activate device camera scanner</p>
                  </div>
                )}
              </div>

              {!scanning ? (
                <button onClick={startCameraScanner} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
                  <Camera size={18} /> Start Camera Scanner
                </button>
              ) : (
                <button onClick={stopCameraScanner} className="btn btn-outline" style={{ padding: '10px 24px' }}>
                  Stop Camera
                </button>
              )}
            </div>
          )}

          {/* Mode 2: 12-Digit Token Entry */}
          {scanMode === 'manual' && (
            <form onSubmit={handleManualSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="manual-token-input">
                  Enter 12-Digit Numeric Verification Token
                </label>
                <input
                  id="manual-token-input"
                  type="text"
                  maxLength={12}
                  className="form-control"
                  placeholder="e.g. 849204829104"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value.replace(/\D/g, ''))}
                  style={{ fontSize: '1.2rem', letterSpacing: '0.12em', textAlign: 'center', fontWeight: 800 }}
                  required
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  The student can read this 12-digit number directly from their gate pass QR screen.
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px' }}
                disabled={loading || manualToken.length < 10}
              >
                {loading ? 'Validating Token...' : 'Verify Token'}
              </button>
            </form>
          )}

          {/* Mode 3: Upload QR Image */}
          {scanMode === 'upload' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <label
                htmlFor="qr-file-input"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '36px',
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  cursor: 'pointer'
                }}
              >
                <UploadCloud size={44} color="var(--primary-600)" style={{ marginBottom: 10 }} />
                <span style={{ fontWeight: 700, color: 'var(--primary-900)' }}>Select Image with QR Code</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  PNG, JPG, or screenshot of Gate Pass
                </span>
                <input
                  id="qr-file-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Verification Confirmation Modal: Prompts for Proctor / Teacher Name */}
      {showVerifyModal && scanResult?.leave && (
        <div className="modal-backdrop" onClick={() => setShowVerifyModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-900)' }}>
                Confirm Return Verification
              </h3>
              <button onClick={() => setShowVerifyModal(false)} className="icon-btn" style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleFinalVerify}>
              <div className="modal-body" style={{ padding: '20px 24px' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: '#166534', fontSize: '0.86rem', marginBottom: 16 }}>
                  Verifying leave pass for <strong>{scanResult.leave.studentName}</strong> ({scanResult.leave.usn}).
                  <br />
                  <span style={{ fontSize: '0.78rem', color: '#15803d' }}>
                    Upon verification, this leave will immediately expire and be marked complete.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Verifying Proctor / Teacher Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter proctor or teacher name"
                    value={verifiedByName}
                    onChange={(e) => setVerifiedByName(e.target.value)}
                    required
                    autoFocus
                  />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                    Please enter the authority / teacher name confirming this verification.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Verification Notes (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Student reported on time"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '14px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowVerifyModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={verifying || !verifiedByName.trim()}
                >
                  {verifying ? 'Verifying...' : 'Confirm & Expire Leave'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
