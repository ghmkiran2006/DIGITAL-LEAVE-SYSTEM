import React, { useEffect, useState } from 'react';
import { X, FileText, Image as ImageIcon, AlertCircle, Loader } from 'lucide-react';

export default function DocumentPreviewModal({
  isOpen,
  fileUrl,
  fileName = 'Supporting Document',
  fileType = '',
  onClose
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setLoading(true);
      setError(false);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, fileUrl, onClose]);

  if (!isOpen || !fileUrl) return null;

  const isPdf =
    fileType?.toLowerCase().includes('pdf') ||
    fileName?.toLowerCase().endsWith('.pdf') ||
    fileUrl?.toLowerCase().endsWith('.pdf');

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 11, 24, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: isPdf ? 860 : 760,
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: 'var(--radius-xl, 16px)',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                background: isPdf ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                color: isPdf ? '#dc2626' : '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {isPdf ? <FileText size={18} /> : <ImageIcon size={18} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  margin: 0,
                  color: '#0f172a',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
                title={fileName}
              >
                {fileName}
              </h3>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {isPdf ? 'PDF Supporting Document' : 'Image Supporting Proof'} • In-App Document Preview
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="icon-btn"
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: 'none',
              background: '#f1f5f9',
              color: '#475569'
            }}
            title="Close Viewer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            flex: '1 1 auto',
            padding: '16px',
            overflowY: 'auto',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 280,
            position: 'relative'
          }}
        >
          {loading && (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#64748b',
                fontSize: '0.88rem'
              }}
            >
              <Loader size={20} style={{ animation: 'spin 1.5s linear infinite' }} />
              <span>Loading supporting document...</span>
            </div>
          )}

          {error ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#b91c1c' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Unable to load supporting document preview</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                The document file may have been moved or removed from server storage.
              </div>
            </div>
          ) : isPdf ? (
            <iframe
              src={fileUrl}
              style={{
                width: '100%',
                height: '68vh',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                background: '#ffffff'
              }}
              title={fileName}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          ) : (
            <img
              src={fileUrl}
              alt={fileName}
              style={{
                maxWidth: '100%',
                maxHeight: '68vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                display: loading ? 'none' : 'block'
              }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            background: '#ffffff',
            flexShrink: 0
          }}
        >
          <button
            className="btn btn-primary"
            onClick={onClose}
            style={{ padding: '8px 20px', fontSize: '0.88rem' }}
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
}
