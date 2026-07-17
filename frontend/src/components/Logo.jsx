import React from 'react';

/**
 * NovaMind Unified Logo Component (Zero Emojis)
 * Used across Landing Page, Sidebar, Auth Modal, Setup Modal, etc.
 */
export function LogoIcon({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="novamind-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="novamind-grad-inner" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      {/* Outer Hexagon Shell */}
      <path
        d="M20 3L35 11.66V28.34L20 37L5 28.34V11.66L20 3Z"
        stroke="url(#novamind-grad)"
        strokeWidth="3.2"
        strokeLinejoin="round"
        fill="rgba(99, 102, 241, 0.08)"
      />

      {/* Inner Neural Nodes & Interconnecting Paths */}
      <path
        d="M20 10L28 15.5V24.5L20 30L12 24.5V15.5L20 10Z"
        stroke="url(#novamind-grad-inner)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="10" r="2.5" fill="#38bdf8" />
      <circle cx="28" cy="15.5" r="2.5" fill="#8b5cf6" />
      <circle cx="28" cy="24.5" r="2.5" fill="#a855f7" />
      <circle cx="20" cy="30" r="2.5" fill="#6366f1" />
      <circle cx="12" cy="24.5" r="2.5" fill="#818cf8" />
      <circle cx="12" cy="15.5" r="2.5" fill="#06b6d4" />
      <circle cx="20" cy="20" r="3.2" fill="url(#novamind-grad)" />
    </svg>
  );
}

export default function Logo({ size = 28, showText = true, className = '', textClassName = '' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className={className}>
      <LogoIcon size={size} />
      {showText && (
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 800,
            fontSize: size * 0.78,
            letterSpacing: '-0.02em',
          }}
          className={`novamind-logo-text ${textClassName}`}
        >
          NovaMind
        </span>
      )}
    </div>
  );
}
