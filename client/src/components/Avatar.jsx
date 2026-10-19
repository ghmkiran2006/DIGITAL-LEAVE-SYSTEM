import React, { useState } from 'react';
import PhotoViewerModal from './PhotoViewerModal';

// Generate clean SVG initials avatar without external network requests
function getInitialsAvatar(name = 'U', size = 64) {
  const cleanName = name ? name.trim() : 'User';
  const parts = cleanName.split(' ').filter(Boolean);
  const initials = parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : cleanName.substring(0, 2).toUpperCase();

  // Consistent hue from name
  let hash = 0;
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  const bg1 = `hsl(${hue}, 65%, 28%)`;
  const bg2 = `hsl(${(hue + 40) % 360}, 75%, 45%)`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="g_${hue}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${bg1}" />
          <stop offset="100%" stop-color="${bg2}" />
        </linearGradient>
      </defs>
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#g_${hue})" />
      <text x="50%" y="54%" font-family="Plus Jakarta Sans, sans-serif" font-weight="700" font-size="${size * 0.4}px" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">
        ${initials}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function Avatar({
  src,
  name,
  subtitle,
  size = 40,
  className = '',
  style = {},
  allowViewer = true,
  onClick
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fallbackSrc = getInitialsAvatar(name, size * 2);
  const displaySrc = (!imgError && src && src.trim()) ? src : fallbackSrc;

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (allowViewer) {
      e.stopPropagation();
      setViewerOpen(true);
    }
  };

  return (
    <>
      <img
        src={displaySrc}
        alt={name || 'Avatar'}
        className={`circular-avatar ${className}`}
        onError={() => setImgError(true)}
        onClick={handleClick}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          cursor: (allowViewer || onClick) ? 'pointer' : 'default',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
          display: 'inline-block',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          ...style
        }}
        title={allowViewer ? 'Click to view full photo' : name}
      />

      {allowViewer && (
        <PhotoViewerModal
          isOpen={viewerOpen}
          photoUrl={src || displaySrc}
          name={name}
          subtitle={subtitle}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
