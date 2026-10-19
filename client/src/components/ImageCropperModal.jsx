import React, { useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Check, UploadCloud } from 'lucide-react';

export default function ImageCropperModal({ isOpen, initialImage, onCropComplete, onClose }) {
  const [imageSrc, setImageSrc] = useState(initialImage || null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      setImageSrc(initialImage || null);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsDragging(false);
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen, initialImage, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSaveCrop = () => {
    if (!imageSrc) return;
    const canvas = document.createElement('canvas');
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Clear
      ctx.clearRect(0, 0, size, size);

      // Clip as circular DP
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw transformed
      const aspect = img.width / img.height;
      let drawWidth = size * zoom;
      let drawHeight = size * zoom;
      if (aspect > 1) {
        drawWidth = size * zoom * aspect;
      } else {
        drawHeight = (size * zoom) / aspect;
      }

      const drawX = (size - drawWidth) / 2 + position.x;
      const drawY = (size - drawHeight) / 2 + position.y;

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      ctx.restore();

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
      onCropComplete(croppedDataUrl);
      onClose();
    };
    img.src = imageSrc;
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 11, 24, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 480,
          width: '100%',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-900)' }}>
            Crop Profile Photo
          </h3>
          <button onClick={onClose} className="icon-btn" style={{ width: 32, height: 32 }}>
            <X size={18} />
          </button>
        </div>

        {!imageSrc ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '48px 24px',
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              textAlign: 'center',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.03)'
            }}
          >
            <UploadCloud size={44} color="var(--primary-500)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>Select Image to Crop</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>JPG, PNG or WEBP formats</div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div>
            {/* Cropping viewport with circular mask */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                width: 260,
                height: 260,
                margin: '0 auto 20px',
                borderRadius: '50%',
                overflow: 'hidden',
                position: 'relative',
                cursor: isDragging ? 'grabbing' : 'grab',
                border: '3px solid var(--primary-500)',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                background: '#0b1329'
              }}
            >
              <img
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${zoom})`,
                  maxHeight: 'none',
                  maxWidth: 'none',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  userSelect: 'none'
                }}
              />
            </div>

            {/* Zoom Controls */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 20 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                style={{ padding: '6px 10px' }}
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>

              <input
                type="range"
                min="0.6"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={{ width: 140, accentColor: 'var(--primary-600)' }}
              />

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                style={{ padding: '6px 10px' }}
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setZoom(1);
                  setPosition({ x: 0, y: 0 });
                }}
                style={{ padding: '6px 10px' }}
                title="Reset Position"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setImageSrc(null)}
                className="btn btn-outline"
                style={{ flex: 1, padding: '10px' }}
              >
                Change Photo
              </button>
              <button
                type="button"
                onClick={handleSaveCrop}
                className="btn btn-primary"
                style={{ flex: 1.5, padding: '10px' }}
              >
                <Check size={16} /> Crop & Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
