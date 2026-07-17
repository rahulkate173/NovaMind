import { useState } from 'react';
import Logo from '../../../components/Logo';
import '../styles/landing.css';

export default function LandingPage({ user, onOpenAuth }) {
  const [demoTab, setDemoTab] = useState('roadmap'); // 'roadmap' | 'chat' | 'doubt'
  const [roadmapPreset, setRoadmapPreset] = useState('fullstack');
  const [faqOpen, setFaqOpen] = useState(null);

  const toggleFaq = (index) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  return (
    <div className="landing-container">
      {/* Top Navigation Bar */}
      <header className="landing-nav">
        <a href="/" className="landing-nav-logo" style={{ textDecoration: 'none' }}>
          <Logo size={32} />
        </a>

        <nav className="landing-nav-links">
          <a href="#demo" className="landing-nav-link">Interactive Demo</a>
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#comparison" className="landing-nav-link">Why NovaMind</a>
          <a href="#workflow" className="landing-nav-link">How It Works</a>
          <a href="#faq" className="landing-nav-link">FAQ</a>
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
            NovaMind is an autonomous AI tutor that dynamically syncs with your daily tasks, generates real-time roadmaps, and evolves with your unique pace.
          </p>

          {/* Prominent CTA Actions */}
          <div className="landing-hero-actions">
            <button
              type="button"
              className="landing-btn-primary"
              onClick={() => onOpenAuth(user ? 'dashboard' : 'signup')}
            >
              {user ? 'Go to Your Dashboard →' : 'Start Your Free Roadmap →'}
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: INTERACTIVE AI DEMO PREVIEW
      ───────────────────────────────────────────────────────────── */}
      <section id="demo" className="landing-demo-section">
        <div className="landing-section-header">
          <span className="landing-section-badge">Live Interactive Preview</span>
          <h2 className="landing-section-title">Experience the AI Tutor in Action</h2>
          <p className="landing-section-subtitle">
            Test our core features live before signing up. See how NovaMind adapts to your goal, answers complex conceptual doubts, and debugs code instantly.
          </p>
        </div>

        <div className="landing-demo-container">
          {/* Tabs */}
          <div className="landing-demo-tabs">
            <button
              type="button"
              className={`landing-demo-tab ${demoTab === 'roadmap' ? 'active' : ''}`}
              onClick={() => setDemoTab('roadmap')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              Dynamic Roadmap Engine
            </button>
            <button
              type="button"
              className={`landing-demo-tab ${demoTab === 'chat' ? 'active' : ''}`}
              onClick={() => setDemoTab('chat')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              24/7 AI Conceptual Tutor
            </button>
            <button
              type="button"
              className={`landing-demo-tab ${demoTab === 'doubt' ? 'active' : ''}`}
              onClick={() => setDemoTab('doubt')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A6 6 0 1 0 7.5 11.5c.76.76 1.23 1.52 1.41 2.5h6.18z"/></svg>
              Instant Doubt & Code Solver
            </button>
          </div>

          <div className="landing-demo-body">
            {/* Tab 1: Roadmap Preview */}
            {demoTab === 'roadmap' && (
              <div className="landing-demo-card-preview">
                <div className="landing-demo-presets">
                  <span className="landing-demo-preset-label">Select Goal Target:</span>
                  <button
                    type="button"
                    className={`landing-demo-preset-btn ${roadmapPreset === 'fullstack' ? 'active' : ''}`}
                    onClick={() => setRoadmapPreset('fullstack')}
                  >
                    Full-Stack React & Node (8 Weeks)
                  </button>
                  <button
                    type="button"
                    className={`landing-demo-preset-btn ${roadmapPreset === 'python' ? 'active' : ''}`}
                    onClick={() => setRoadmapPreset('python')}
                  >
                    🐍 Python Data Science & AI (6 Weeks)
                  </button>
                  <button
                    type="button"
                    className={`landing-demo-preset-btn ${roadmapPreset === 'system' ? 'active' : ''}`}
                    onClick={() => setRoadmapPreset('system')}
                  >
                    🏗 System Design Mastery (4 Weeks)
                  </button>
                </div>

                {roadmapPreset === 'fullstack' && (
                  <div>
                    <div className="demo-roadmap-header">
                      <div>
                        <h3 className="demo-roadmap-title">Full-Stack Web Development Roadmap</h3>
                        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>Adaptive pace: ~1.5 hours/day • Automatically syncs with daily tasks</p>
                      </div>
                      <span className="demo-roadmap-badge">AI Verified & Active</span>
                    </div>
                    <div className="demo-roadmap-steps">
                      <div className="demo-step-item">
                        <div className="demo-step-num">W1</div>
                        <div className="demo-step-content">
                          <h4>Modern JS Architecture & React Hooks Foundation</h4>
                          <p>Deep dive into closures, async/await, virtual DOM, and mastering useState/useEffect with cleanup patterns.</p>
                        </div>
                      </div>
                      <div className="demo-step-item">
                        <div className="demo-step-num">W2</div>
                        <div className="demo-step-content">
                          <h4>State Management, Context API & Performance Optimization</h4>
                          <p>Building scalable component hierarchies, memoization (`useCallback`, `useMemo`), and custom reusable hooks.</p>
                        </div>
                      </div>
                      <div className="demo-step-item">
                        <div className="demo-step-num">W3</div>
                        <div className="demo-step-content">
                          <h4>Node.js Express APIs, Middleware & MongoDB Aggregations</h4>
                          <p>RESTful API design, JWT authentication, error handling pipelines, and optimized database queries.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {roadmapPreset === 'python' && (
                  <div>
                    <div className="demo-roadmap-header">
                      <div>
                        <h3 className="demo-roadmap-title">Python Data Science & AI Engineering</h3>
                        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>Adaptive pace: ~2 hours/day • Real-world projects & datasets</p>
                      </div>
                      <span className="demo-roadmap-badge">AI Verified & Active</span>
                    </div>
                    <div className="demo-roadmap-steps">
                      <div className="demo-step-item">
                        <div className="demo-step-num">W1</div>
                        <div className="demo-step-content">
                          <h4>Pythonic Data Structures, Generators & Vectorization with NumPy</h4>
                          <p>Advanced Python internals, memory views, broadcasting, and multi-dimensional array operations.</p>
                        </div>
                      </div>
                      <div className="demo-step-item">
                        <div className="demo-step-num">W2</div>
                        <div className="demo-step-content">
                          <h4>Data Wrangling with Pandas & Statistical Exploratory Analysis</h4>
                          <p>Data cleaning pipelines, handling missing values, group-by aggregations, and Seaborn data visualization.</p>
                        </div>
                      </div>
                      <div className="demo-step-item">
                        <div className="demo-step-num">W3</div>
                        <div className="demo-step-content">
                          <h4>Machine Learning Fundamentals with Scikit-Learn</h4>
                          <p>Supervised vs unsupervised learning, regression, decision trees, cross-validation, and hyperparameter tuning.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {roadmapPreset === 'system' && (
                  <div>
                    <div className="demo-roadmap-header">
                      <div>
                        <h3 className="demo-roadmap-title">Distributed System Design & Architecture</h3>
                        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>Adaptive pace: ~1 hour/day • Architecture case studies</p>
                      </div>
                      <span className="demo-roadmap-badge">AI Verified & Active</span>
                    </div>
                    <div className="demo-roadmap-steps">
                      <div className="demo-step-item">
                        <div className="demo-step-num">W1</div>
                        <div className="demo-step-content">
                          <h4>Scalability Patterns, Load Balancing & Caching Strategies</h4>
                          <p>Horizontal vs vertical scaling, CDN distribution, Redis/Memcached eviction policies, and consistent hashing.</p>
                        </div>
                      </div>
                      <div className="demo-step-item">
                        <div className="demo-step-num">W2</div>
                        <div className="demo-step-content">
                          <h4>Database Partitioning, Sharding & CAP Theorem Trade-offs</h4>
                          <p>SQL vs NoSQL selection criteria, replication topologies, eventual consistency, and distributed consensus.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: AI Tutor Chat Preview */}
            {demoTab === 'chat' && (
              <div className="landing-demo-card-preview">
                <div className="demo-chat-box">
                  <div className="demo-msg user">
                    <div className="demo-msg-avatar">YOU</div>
                    <div className="demo-msg-bubble">
                      Can you explain why we need cleanup functions in React's `useEffect`? I'm getting weird duplicate API calls.
                    </div>
                  </div>
                  <div className="demo-msg ai">
                    <div className="demo-msg-avatar">AI</div>
                    <div className="demo-msg-bubble">
                      <strong>Great question!</strong> When a component re-renders or unmounts, any ongoing subscriptions, event listeners, or asynchronous requests initiated inside `useEffect` persist unless explicitly cleaned up.
                      <br /><br />
                      Without a cleanup function, rapid re-renders can trigger duplicate requests or race conditions where an old response sets state on an unmounted component. Here is the canonical pattern using `AbortController`:
                      <div className="demo-code-block">
                        {`useEffect(() => {
  const controller = new AbortController();
  
  async function fetchData() {
    try {
      const res = await fetch('/api/data', { signal: controller.signal });
      const data = await res.json();
      setData(data);
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  }

  fetchData();
  return () => controller.abort(); // Cleanup cancels pending request
}, []);`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Doubt Solver Preview */}
            {demoTab === 'doubt' && (
              <div className="landing-demo-card-preview">
                <div className="demo-chat-box">
                  <div className="demo-msg user">
                    <div className="demo-msg-avatar">YOU</div>
                    <div className="demo-msg-bubble">
                      I'm trying to update an object inside an array state in React, but the UI isn't re-rendering. Here's my code: `items[2].completed = true; setItems(items);`
                    </div>
                  </div>
                  <div className="demo-msg ai">
                    <div className="demo-msg-avatar">AI</div>
                    <div className="demo-msg-bubble">
                      <span style={{ color: '#e11d48', fontWeight: 800 }}>⚠️ Root Cause Identified: State Mutation</span>
                      <p style={{ margin: '8px 0' }}>
                        In React, state must be treated as immutable. Mutating `items[2].completed` directly modifies the existing array in memory. When you pass the exact same array reference to `setItems(items)`, React bails out of re-rendering because reference equality (`Object.is(prevItems, newItems)`) returns `true`.
                      </p>
                      <strong>✅ Verified Fix (Map pattern returning a new array and new object):</strong>
                      <div className="demo-code-block">
                        {`setItems(prevItems => 
  prevItems.map((item, index) => 
    index === 2 ? { ...item, completed: true } : item
  )
);`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: SOFT GLASSMORPHISM 6-FEATURE GRID
      ───────────────────────────────────────────────────────────── */}
      <section id="features" className="landing-features-grid">
        <div className="landing-feature-card">
          <div className="landing-feature-icon-wrapper icon-purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l5.25 1.64"/></svg>
          </div>
          <h3 className="landing-feature-title">Closed-Loop Synchronization</h3>
          <p className="landing-feature-text">
            Unlike static courses, NovaMind detects your quiz results and daily task speed to re-plan your exact roadmap in real time so you never fall behind or get bored.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="landing-feature-icon-wrapper icon-blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <h3 className="landing-feature-title">24/7 AI Conceptual Tutor</h3>
          <p className="landing-feature-text">
            Your personal expert mentor. Ask deep conceptual questions, request step-by-step code walkthroughs, or type `/today` for instant guidance anytime.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="landing-feature-icon-wrapper icon-rose">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A6 6 0 1 0 7.5 11.5c.76.76 1.23 1.52 1.41 2.5h6.18z"/></svg>
          </div>
          <h3 className="landing-feature-title">Instant Doubt & Error Solver</h3>
          <p className="landing-feature-text">
            Stuck on a tricky compiler error or tough algorithm? Get verified, structured solutions in seconds with copyable code blocks and clear explanations.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="landing-feature-icon-wrapper icon-indigo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          </div>
          <h3 className="landing-feature-title">Dynamic Roadmap Engine</h3>
          <p className="landing-feature-text">
            Custom-tailored weekly goals, curated tutorials, and adaptive progress tracking built directly for your unique learning pace, background, and schedule.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="landing-feature-icon-wrapper icon-green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <h3 className="landing-feature-title">Adaptive Quiz & Recall Engine</h3>
          <p className="landing-feature-text">
            Test active retention with bite-sized quizzes generated directly from your completed lessons. Weak spots trigger automatic remedial scheduling.
          </p>
        </div>

        <div className="landing-feature-card">
          <div className="landing-feature-icon-wrapper icon-amber">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
          </div>
          <h3 className="landing-feature-title">Deep Velocity Analytics</h3>
          <p className="landing-feature-text">
            Track your streak, study velocity, and concept readiness with rich visual charts that show exactly how prepared you are for interviews and builds.
          </p>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: WHY NOVAMIND VS. TRADITIONAL LEARNING
      ───────────────────────────────────────────────────────────── */}
      <section id="comparison" className="landing-comparison-section">
        <div className="landing-section-header">
          <span className="landing-section-badge">The Paradigm Shift</span>
          <h2 className="landing-section-title">Why NovaMind Beats Static Courses</h2>
          <p className="landing-section-subtitle">
            Video courses assume everyone learns at the exact same speed. NovaMind is a living AI mentor that adapts to you.
          </p>
        </div>

        <div className="landing-comparison-table-wrapper">
          <table className="landing-comparison-table">
            <thead>
              <tr>
                <th className="col-feature">Key Learning Dimension</th>
                <th className="col-novamind">NovaMind Autonomous AI</th>
                <th className="col-trad">Traditional Video Courses</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700, color: '#1f2937' }}>Curriculum & Pacing</td>
                <td className="col-novamind">
                  <div className="badge-ai">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>100% custom roadmap adapted to your daily velocity</span>
                  </div>
                </td>
                <td>
                  <div className="badge-trad">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span>Rigid, one-size-fits-all pre-recorded videos</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: '#1f2937' }}>When You Miss a Few Days</td>
                <td className="col-novamind">
                  <div className="badge-ai">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Autonomous real-time re-planning with zero guilt</span>
                  </div>
                </td>
                <td>
                  <div className="badge-trad">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span>You fall behind, feel overwhelmed, and quit</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: '#1f2937' }}>Stuck on a Complex Doubt</td>
                <td className="col-novamind">
                  <div className="badge-ai">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Instant 24/7 conceptual explanation & code verification</span>
                  </div>
                </td>
                <td>
                  <div className="badge-trad">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span>Wait days for Q&A replies or dig through forums</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700, color: '#1f2937' }}>Active Recall & Testing</td>
                <td className="col-novamind">
                  <div className="badge-ai">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>Bite-sized adaptive quizzes with weak-topic remediation</span>
                  </div>
                </td>
                <td>
                  <div className="badge-trad">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    <span>Passive watching with low long-term retention</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: HOW IT WORKS
      ───────────────────────────────────────────────────────────── */}
      <section id="workflow" className="landing-workflow-section">
        <div className="landing-workflow-header">
          <span className="landing-section-badge">Step-by-Step Workflow</span>
          <h2 className="landing-workflow-title">How NovaMind Works</h2>
          <p className="landing-workflow-subtitle">Your journey to mastery in three simple steps.</p>
        </div>
        
        <div className="landing-workflow-steps">
          <div className="landing-workflow-step">
            <div className="step-number">1</div>
            <h3 className="step-title">Define Your Target</h3>
            <p className="step-text">Tell us what you want to learn (e.g. "Full-Stack Development" or "AI Systems"). The AI instantly generates a structured, verified multi-week roadmap tailored to your schedule.</p>
          </div>

          <div className="landing-workflow-step">
            <div className="step-number">2</div>
            <h3 className="step-title">Learn & Test Daily</h3>
            <p className="step-text">Complete daily bite-sized tasks and interactive quizzes. The system tracks your speed, accuracy, and confidence on every sub-skill to build your learning profile.</p>
          </div>

          <div className="landing-workflow-step">
            <div className="step-number">3</div>
            <h3 className="step-title">Autonomous Re-planning</h3>
            <p className="step-text">Struggle with a concept? The AI tutor intervenes, explains the doubt clearly, and automatically adjusts next week's schedule to include remedial practice without stress.</p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: FREQUENTLY ASKED QUESTIONS (ACCORDION)
      ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="landing-faq-section">
        <div className="landing-section-header">
          <span className="landing-section-badge">Got Questions?</span>
          <h2 className="landing-section-title">Frequently Asked Questions</h2>
          <p className="landing-section-subtitle">Everything you need to know about NovaMind’s autonomous learning system.</p>
        </div>

        <div className="landing-faq-list">
          {[
            {
              q: 'How does NovaMind sync with my daily tasks and study speed?',
              a: 'NovaMind continuously monitors your lesson completion rate, quiz accuracy, and self-reported confidence. If you master topics quickly, it accelerates your curriculum. If you encounter complex topics that need extra attention, it re-plans subsequent days automatically so you always stay on track without feeling overwhelmed.'
            },
            {
              q: 'Do I need prior coding experience to use NovaMind?',
              a: 'Not at all! Whether you are a beginner taking your first steps in HTML/Python or a senior developer mastering distributed architecture and compiler design, NovaMind tailors the curriculum depth, code examples, and vocabulary directly to your exact skill level.'
            },
            {
              q: 'What makes NovaMind different from standard chatbots like ChatGPT?',
              a: 'Standard chatbots are stateless across sessions—they forget your curriculum structure, cannot track your multi-week goals, and do not proactively manage your schedule. NovaMind acts as a dedicated learning OS with persistent state tracking, closed-loop schedule synchronization, and adaptive quiz engines.'
            },
            {
              q: 'Can I ask the AI Tutor questions about my own code or errors?',
              a: 'Yes! The Instant Doubt & Error Solver allows you to paste full error stack traces, complex algorithm snippets, or conceptual questions. The AI diagnoses the exact root cause and provides structured, verified code corrections with clear explanations.'
            },
            {
              q: 'Is NovaMind free to get started?',
              a: 'Yes! You can sign up free today, instantly generate your custom learning roadmap, practice daily quizzes, and experience the autonomous AI tutor.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className={`landing-faq-item ${faqOpen === idx ? 'open' : ''}`}
            >
              <button
                type="button"
                className="landing-faq-question"
                onClick={() => toggleFaq(idx)}
              >
                <span>{item.q}</span>
                <div className="landing-faq-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
              </button>
              {faqOpen === idx && (
                <div className="landing-faq-answer">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 7: FINAL CALL TO ACTION BANNER & FOOTER
      ───────────────────────────────────────────────────────────── */}
      <section className="landing-cta-banner-section">
        <div className="landing-cta-banner">
          <h2 className="landing-cta-title">Ready to transform how you learn?</h2>
          <p className="landing-cta-subtitle">
            Join thousands of learners mastering complex technical topics 2.4x faster with their personal autonomous AI tutor.
          </p>
          <button
            type="button"
            className="landing-btn-banner"
            onClick={() => onOpenAuth(user ? 'dashboard' : 'signup')}
          >
            {user ? 'Open Your Dashboard →' : 'Start Your Personalized Roadmap Free →'}
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-grid">
          <div className="landing-footer-brand">
            <Logo size={30} showText={true} />
            <p>
              Autonomous AI tutoring engine that builds dynamic learning roadmaps, syncs with your schedule, and accelerates technical mastery.
            </p>
          </div>

          <div className="landing-footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a href="#demo">Interactive Demo</a></li>
              <li><a href="#features">Features Grid</a></li>
              <li><a href="#comparison">Why NovaMind</a></li>
              <li><a href="#workflow">How It Works</a></li>
            </ul>
          </div>

          <div className="landing-footer-col">
            <h4>Features</h4>
            <ul>
              <li><a href="#demo">Roadmap Engine</a></li>
              <li><a href="#demo">24/7 AI Tutor</a></li>
              <li><a href="#demo">Doubt Solver</a></li>
              <li><a href="#demo">Adaptive Quizzes</a></li>
            </ul>
          </div>

          <div className="landing-footer-col">
            <h4>Account</h4>
            <ul>
              <li><a href="#" onClick={(e) => { e.preventDefault(); onOpenAuth('signin'); }}>Sign In</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); onOpenAuth('signup'); }}>Create Account</a></li>
              <li><a href="#faq">FAQ & Support</a></li>
            </ul>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <span>© {new Date().getFullYear()} NovaMind AI. All rights reserved. Built for curious minds.</span>
          <div className="landing-status-pill">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            All Systems Operational
          </div>
        </div>
      </footer>
    </div>
  );
}
