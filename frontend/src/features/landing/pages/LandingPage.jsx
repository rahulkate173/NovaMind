import { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Icons } from '../../dashboard/components/Icons';
import Logo from '../../../components/Logo';
import '../styles/landing.css';

export default function LandingPage({ user, onOpenAuth }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="landing-container">
      {/* Background Ambient Glows */}
      <div className="landing-ambient-bg">
        <div className="ambient-glow glow-1" />
        <div className="ambient-glow glow-2" />
        <div className="ambient-glow glow-3" />
      </div>

      {/* Top Navigation Bar */}
      <header className="landing-nav">
        <a href="/" style={{ textDecoration: 'none' }}>
          <Logo size={32} />
        </a>

        <nav className="landing-nav-links">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#workflow" className="landing-nav-link">How It Works</a>
        </nav>

        <div className="landing-nav-actions">
          <button
            type="button"
            className="landing-theme-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {user ? (
            <button
              type="button"
              className="landing-btn-primary"
              onClick={() => onOpenAuth('dashboard')}
            >
              Go to Dashboard
            </button>
          ) : (
            <>
              <button
                type="button"
                className="landing-btn-ghost"
                onClick={() => onOpenAuth('signin')}
              >
                Sign In
              </button>
              <button
                type="button"
                className="landing-btn-primary"
                onClick={() => onOpenAuth('signup')}
              >
                Get Started Free
              </button>
            </>
          )}
        </div>
      </header>

      {/* Centered High-Impact Hero Section */}
      <section className="landing-hero">
        <div className="landing-tag">
          <span className="landing-tag-dot" />
          <span>CLOSED-LOOP NEURAL LEARNING</span>
        </div>

        <h1 className="landing-title">
          Where Intelligence Meets <span className="gradient-text">Mastery</span>
        </h1>

        <p className="landing-subtitle">
          Experience autonomous AI tutoring that dynamically syncs with your daily study tasks, generates real-time roadmaps, and evolves every time you complete a quiz or solve a doubt.
        </p>

        <div className="landing-cta-group">
          <button
            type="button"
            className="landing-btn-hero"
            onClick={() => onOpenAuth(user ? 'dashboard' : 'signup')}
          >
            <span>{user ? 'Go to Dashboard' : 'Start Learning Free'}</span>
            <Icons.Arrow />
          </button>
          <a href="#features" className="landing-btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Explore Features</span>
            <Icons.Sparkles />
          </a>
        </div>

        {/* Clean High-Contrast Stat Strip */}
        <div className="landing-hero-stats">
          <div className="landing-stat-pill">
            <span className="landing-stat-num">&lt; 200ms</span>
            <span className="landing-stat-label">Real-Time Re-planning</span>
          </div>
          <div className="landing-stat-pill">
            <span className="landing-stat-num">24/7</span>
            <span className="landing-stat-label">LangChain AI Tutor</span>
          </div>
          <div className="landing-stat-pill">
            <span className="landing-stat-num">100%</span>
            <span className="landing-stat-label">Personalized Paths</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="landing-section" id="features">
        <div className="section-header">
          <div className="landing-tag">
            <span>WHY NOVAMIND</span>
          </div>
          <h2 className="section-title">Built for Real Concept Mastery</h2>
          <p className="section-sub">
            Static video courses leave you stuck when questions arise. NovaMind closes the learning loop with real-time AI tutoring, structured roadmaps, and adaptive assessments.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#6366f1' }}>
              <Icons.Sync />
            </div>
            <h3 className="feature-title">Closed-Loop Synchronization</h3>
            <p className="feature-desc">
              Unlike static courses, NovaMind detects your quiz results and daily task speed to re-plan your exact roadmap in real time so you never fall behind.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#06b6d4' }}>
              <Icons.Tutor />
            </div>
            <h3 className="feature-title">24/7 LangChain AI Tutor</h3>
            <p className="feature-desc">
              Your personal expert tutor. Ask deep conceptual questions, request step-by-step code walkthroughs, or type `/today` for instant guidance.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#8b5cf6' }}>
              <Icons.Lightbulb />
            </div>
            <h3 className="feature-title">Instant Doubt Solver</h3>
            <p className="feature-desc">
              Stuck on an error or tough algorithm? Get verified, structured solutions in seconds with copyable code blocks and clear explanations.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon" style={{ color: '#38bdf8' }}>
              <Icons.Roadmap />
            </div>
            <h3 className="feature-title">Dynamic Roadmap Engine</h3>
            <p className="feature-desc">
              Custom-tailored weekly goals, curated tutorials, and adaptive progress tracking built directly for your unique pace and schedule.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="landing-section" id="workflow" style={{ background: 'rgba(255, 255, 255, 0.015)' }}>
        <div className="section-header">
          <div className="landing-tag">
            <span>HOW IT WORKS</span>
          </div>
          <h2 className="section-title">3 Steps to Autonomous Mastery</h2>
          <p className="section-sub">
            Our closed-loop learning engine continuously adapts to your progress every single day.
          </p>
        </div>

        <div className="workflow-grid">
          <div className="workflow-step">
            <span className="step-num">01</span>
            <h3 className="step-title">Set Your Goal</h3>
            <p className="step-desc">
              Tell NovaMind what you want to master—from Data Structures to Full-Stack Web Dev—and get an instant custom syllabus.
            </p>
          </div>

          <div className="workflow-step">
            <span className="step-num">02</span>
            <h3 className="step-title">Learn & Practice</h3>
            <p className="step-desc">
              Complete daily bite-sized tasks, watch curated tutorials, and attempt adaptive quizzes that test real conceptual understanding.
            </p>
          </div>

          <div className="workflow-step">
            <span className="step-num">03</span>
            <h3 className="step-title">Neural Feedback Loop</h3>
            <p className="step-desc">
              Pass a quiz easily or struggle on a topic? NovaMind instantly recalculates and adjusts your next week's schedule automatically.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="landing-cta-banner">
        <h2 className="landing-cta-title">Ready to experience the future of learning?</h2>
        <p className="landing-cta-sub">
          Join NovaMind today and master complex topics faster with your closed-loop AI companion.
        </p>
        <button
          type="button"
          className="landing-btn-hero"
          onClick={() => onOpenAuth(user ? 'dashboard' : 'signup')}
        >
          <span>{user ? 'Go to Your Dashboard' : 'Create Your Free Account'}</span>
        </button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>© 2026 NovaMind AI. Where Intelligence Meets Mastery. All rights reserved.</p>
      </footer>
    </div>
  );
}
