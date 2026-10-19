import React, { useEffect } from 'react';
import { X, User, Download } from 'lucide-react';

export default function PhotoViewerModal({ isOpen, photoUrl, name, subtitle, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 11, 24, 0.88)',
        backdropFilter: 'blur(14px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      {/* Header Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 20,
          left: 24,
          right: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff'
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>{name || 'Profile Photo'}</h3>
          {subtitle && <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{subtitle}</p>}
        </div>

        <button
          onClick={onClose}
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Close (Esc)"
        >
          <X size={22} />
        </button>
      </div>

      {/* Main Image Box */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          maxWidth: 'min(90vw, 480px)',
          maxHeight: 'min(80vh, 480px)',
          borderRadius: '50%',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(37, 99, 235, 0.3)',
          border: '4px solid rgba(255, 255, 255, 0.25)',
          animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name || 'Profile'}
            style={{
              width: '100%',
              height: '100%',
              aspectRatio: '1 / 1',
              objectFit: 'cover',
              display: 'block'
            }}
          />
        ) : (
          <div
            style={{
              width: 320,
              height: 320,
              background: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}
          >
            <User size={84} />
            <span style={{ marginTop: 12, fontSize: '1rem', fontWeight: 600 }}>No Profile Photo Uploaded</span>
          </div>
        )}
      </div>

      <p style={{ marginTop: 24, fontSize: '0.82rem', color: '#94a3b8' }}>
        Click outside or press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4 }}>Esc</kbd> to close
      </p>
    </div>
  );
}
