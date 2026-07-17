import { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Icons } from '../../dashboard/components/Icons';
import Logo from '../../../components/Logo';
import { EXPRESS_BASE } from '../../../services/api';
import '../styles/auth.css';

/**
 * Google SVG Icon component for rich aesthetics
 */
function GoogleIcon() {
  return (
    <svg className="auth-google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-8.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
      />
    </svg>
  );
}

export default function AuthPage({ initialTab = 'signin', onBackToHome }) {
  const [tab, setTab] = useState(initialTab || 'signin'); // 'signin' | 'signup'
  const { theme, toggleTheme } = useTheme();

  const handleGoogleOAuth = () => {
    window.location.href = `${EXPRESS_BASE}/auth/google`;
  };

  return (
    <div className="auth-split-container">
      {/* ── Left Side: Purely Visual Animated SVG & Cosmic Neural Loop ── */}
      <div className="auth-showcase">
        {/* Shifting Cosmic Background Waves & Glows */}
        <div className="auth-cosmic-glow glow-1" />
        <div className="auth-cosmic-glow glow-2" />
        <div className="auth-cosmic-glow glow-3" />
        <div className="auth-starfield" />

        <div className="auth-visual-centerpiece">
          {/* Top Tag */}
          <div className="auth-minimal-tag">
            <span className="auth-neon-dot" />
            <span>NOVA MIND · CLOSED-LOOP AI</span>
          </div>

          {/* Dynamic Animated Neural Planetary SVG */}
          <div className="auth-svg-wrapper">
            <svg className="auth-animated-svg" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* Glowing Gradients */}
                <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
                  <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
                </radialGradient>

                <linearGradient id="ringGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.1" />
                </linearGradient>

                <linearGradient id="ringGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
                </linearGradient>

                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Background Synapse Connection Paths */}
              <g className="svg-synapse-group" stroke="rgba(168, 85, 247, 0.25)" strokeWidth="2" strokeDasharray="6 6">
                <path d="M300 300 L120 160" />
                <path d="M300 300 L480 160" />
                <path d="M300 300 L150 450" />
                <path d="M300 300 L450 450" />
              </g>

              {/* Outer Rotating Ring 1 (Dashed) */}
              <circle
                className="svg-ring-1"
                cx="300"
                cy="300"
                r="220"
                stroke="url(#ringGrad1)"
                strokeWidth="2.5"
                strokeDasharray="18 12 6 12"
              />

              {/* Outer Rotating Ring 2 (Tilted & Counter-Rotating) */}
              <ellipse
                className="svg-ring-2"
                cx="300"
                cy="300"
                rx="260"
                ry="150"
                stroke="url(#ringGrad2)"
                strokeWidth="2"
                strokeDasharray="24 16"
              />

              {/* Inner Pulsing Orbit Ring */}
              <circle
                className="svg-ring-3"
                cx="300"
                cy="300"
                r="130"
                stroke="rgba(56, 189, 248, 0.4)"
                strokeWidth="1.5"
              />

              {/* Central Energy Core */}
              <circle className="svg-core-pulse" cx="300" cy="300" r="75" fill="url(#coreGlow)" filter="url(#glowFilter)" />
              <circle cx="300" cy="300" r="32" fill="#ffffff" filter="url(#glowFilter)" />
              <circle cx="300" cy="300" r="16" fill="#38bdf8" />

              {/* Orbiting Satellite Node 1: Roadmap */}
              <g className="svg-satellite sat-1">
                <circle cx="120" cy="160" r="28" fill="#1e1b4b" stroke="#6366f1" strokeWidth="3" filter="url(#glowFilter)" />
              </g>

              {/* Orbiting Satellite Node 2: AI Tutor */}
              <g className="svg-satellite sat-2">
                <circle cx="480" cy="160" r="28" fill="#1e1b4b" stroke="#38bdf8" strokeWidth="3" filter="url(#glowFilter)" />
              </g>

              {/* Orbiting Satellite Node 3: Doubt Solver */}
              <g className="svg-satellite sat-3">
                <circle cx="150" cy="450" r="28" fill="#1e1b4b" stroke="#ec4899" strokeWidth="3" filter="url(#glowFilter)" />
              </g>

              {/* Orbiting Satellite Node 4: Quiz Generator */}
              <g className="svg-satellite sat-4">
                <circle cx="450" cy="450" r="28" fill="#1e1b4b" stroke="#10b981" strokeWidth="3" filter="url(#glowFilter)" />
              </g>

              {/* Traveling Energy Pulses along Synapses */}
              <circle r="6" fill="#38bdf8" filter="url(#glowFilter)">
                <animateMotion path="M300 300 L120 160 L300 300" dur="4s" repeatCount="indefinite" />
              </circle>
              <circle r="6" fill="#ec4899" filter="url(#glowFilter)">
                <animateMotion path="M300 300 L480 160 L300 300" dur="5s" repeatCount="indefinite" />
              </circle>
              <circle r="6" fill="#10b981" filter="url(#glowFilter)">
                <animateMotion path="M300 300 L150 450 L300 300" dur="4.5s" repeatCount="indefinite" />
              </circle>
              <circle r="6" fill="#fbbf24" filter="url(#glowFilter)">
                <animateMotion path="M300 300 L450 450 L300 300" dur="3.5s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          {/* Clean Minimal Statement */}
          <div className="auth-minimal-statement">
            <h2>Where Intelligence Meets Mastery</h2>
            <p>Closed-loop neural learning powered by real-time AI synchronization.</p>
          </div>
        </div>
      </div>

      {/* ── Right Side: Sign In / Sign Up Modal ── */}
      <div className="auth-modal-wrapper">
        {/* Top Header Buttons: Back to Home & Theme Switcher */}
        <div className="auth-theme-switcher" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {onBackToHome && (
            <button
              type="button"
              className="auth-theme-btn"
              onClick={onBackToHome}
              style={{ padding: '8px 14px', fontSize: '13px' }}
            >
              ← Back to Home
            </button>
          )}
          <button
            type="button"
            className="auth-theme-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        <div className="auth-card">
          {/* Header */}
          <div className="auth-logo-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Logo size={48} />
            <p className="auth-logo-sub" style={{ marginTop: '4px' }}>
              {tab === 'signin'
                ? 'Welcome back! Sign in to continue your journey'
                : 'Create your account to unlock personalized AI learning'}
            </p>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${tab === 'signin' ? 'active' : ''}`}
              onClick={() => setTab('signin')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${tab === 'signup' ? 'active' : ''}`}
              onClick={() => setTab('signup')}
            >
              Sign Up
            </button>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleOAuth}
          >
            <GoogleIcon />
            <span>{tab === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
