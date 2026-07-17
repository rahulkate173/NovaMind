import { useState } from 'react';
import Logo from '../../../components/Logo';
import '../styles/landing.css';

export default function LandingPage({ user, onOpenAuth }) {
  return (
    <div className="landing-container">
      {/* Top Navigation Bar */}
      <header className="landing-nav">
        <a href="/" className="landing-nav-logo" style={{ textDecoration: 'none' }}>
          <Logo size={32} />
          
        </a>

        <nav className="landing-nav-links">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#workflow" className="landing-nav-link">How It Works</a>
        </nav>

        <div className="landing-nav-actions">
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

      {/* Centered Hero Section */}
      <section className="landing-hero">
        {/* Big Illustration Wrapper (positioned absolutely in CSS to span the screen) */}
        <div className="landing-hero-image-wrapper">
          <img 
            src="/home-image.webp" 
            alt="Whimsical magical stream of learning" 
            className="landing-hero-image" 
          />
        </div>

        {/* Text content overlapping the image */}
        <div className="landing-hero-text">
          <h1 className="landing-title">
            Learning that actually works.
          </h1>
          <p className="landing-subtitle">
            NovaMind is an autonomous AI tutor that dynamically syncs with your daily tasks, generates real-time roadmaps, and evolves with you.
          </p>
        </div>
      </section>

      {/* Soft Glassmorphism Feature Grid */}
      <section id="features" className="landing-features-grid">
        <div className="landing-feature-card">
          <div className="landing-feature-icon-wrapper icon-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.25 1.64"/></svg>
          </div>
          <h3 className="landing-feature-title">Closed-Loop Synchronization</h3>
          <p className="landing-feature-text">
            Unlike static courses, NovaMind detects your quiz results and daily task speed to re-plan your exact roadmap in real time so you never fall behind.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="landing-feature-icon-wrapper icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h3 className="landing-feature-title">24/7 AI Tutor</h3>
          <p className="landing-feature-text">
            Your personal expert tutor. Ask deep conceptual questions, request step-by-step code walkthroughs, or type `/today` for instant guidance.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="landing-feature-icon-wrapper icon-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A6 6 0 1 0 7.5 11.5c.76.76 1.23 1.52 1.41 2.5h6.18z"/></svg>
          </div>
          <h3 className="landing-feature-title">Instant Doubt Solver</h3>
          <p className="landing-feature-text">
            Stuck on an error or tough algorithm? Get verified, structured solutions in seconds with copyable code blocks and clear explanations.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="landing-feature-icon-wrapper icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          </div>
          <h3 className="landing-feature-title">Dynamic Roadmap Engine</h3>
          <p className="landing-feature-text">
            Custom-tailored weekly goals, curated tutorials, and adaptive progress tracking built directly for your unique pace and schedule.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="workflow" className="landing-workflow-section">
        <div className="landing-workflow-header">
          <h2 className="landing-workflow-title">How NovaMind Works</h2>
          <p className="landing-workflow-subtitle">Your journey to mastery in three simple steps.</p>
        </div>
        
        <div className="landing-workflow-steps">
          <div className="landing-workflow-step">
            <div className="step-number">1</div>
            <h3 className="step-title">Define Your Target</h3>
            <p className="step-text">Tell us what you want to learn (e.g. "Full-Stack Development"). The AI instantly generates a structured, verified 12-week roadmap tailored to your schedule.</p>
          </div>

          <div className="landing-workflow-step">
            <div className="step-number">2</div>
            <h3 className="step-title">Learn & Test Daily</h3>
            <p className="step-text">Complete daily bite-sized tasks and interactive quizzes. The system tracks your speed, accuracy, and confidence on every sub-skill.</p>
          </div>

          <div className="landing-workflow-step">
            <div className="step-number">3</div>
            <h3 className="step-title">Autonomous Re-planning</h3>
            <p className="step-text">Struggle with a concept? The AI tutor intervenes, explains the doubt, and automatically adjusts next week's schedule to include remedial practice.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
