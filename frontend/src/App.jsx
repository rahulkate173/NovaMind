import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider, useUser } from './context/UserContext';
import DashboardPage from './features/dashboard/pages/DashboardPage';
import AITutorPage from './features/ai_tutor/pages/AITutorPage';
import DoubtSolverPage from './features/doubt_solver/pages/DoubtSolverPage';
import AuthPage    from './features/auth/pages/AuthPage';
import LandingPage from './features/landing/pages/LandingPage';
import QuizPage    from './features/quiz/pages/QuizPage';
import RoadmapPage  from './features/roadmap/pages/RoadmapPage';
import './index.css';

function getPageFromPath(path) {
  if (path === '/' || path === '' || path === '/home') return 'home';
  if (path === '/dashboard') return 'dashboard';
  if (path === '/ai-tutor') return 'ai-tutor';
  if (path === '/doubt') return 'doubt';
  if (path === '/quiz') return 'quiz';
  if (path === '/roadmap') return 'roadmap';
  return 'home';
}

function getPathFromPage(pageId) {
  if (pageId === 'home') return '/';
  if (pageId === 'dashboard') return '/dashboard';
  if (pageId === 'ai-tutor') return '/ai-tutor';
  if (pageId === 'doubt') return '/doubt';
  if (pageId === 'quiz') return '/quiz';
  if (pageId === 'roadmap') return '/roadmap';
  return '/';
}

function MainAppContent() {
  const [page, setPage] = useState(() => getPageFromPath(window.location.pathname));
  const [authMode, setAuthMode] = useState(null); // null = LandingPage, 'signin' | 'signup' = AuthPage
  const { token, user, login } = useUser();

  // Listen to browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setPage(getPageFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check if browser was redirected from Google OAuth callback (/oauth-callback or /auth/success)
  useEffect(() => {
    if (window.location.pathname === '/oauth-callback' || window.location.pathname === '/auth/success') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      const id = params.get('id');
      const displayName = params.get('displayName') || 'Learner';
      const photo = params.get('photo') || '';
      const email = params.get('email') || '';

      if (urlToken && id) {
        login(urlToken, { id, displayName, photo, email });
        window.history.replaceState({}, document.title, '/dashboard');
        setPage('dashboard');
      }
    }
  }, [login]);

  const navigate = (id) => {
    const targetPath = getPathFromPage(id);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    setPage(id);
    window.scrollTo(0, 0);
  };

  // If not authenticated, render Homepage (LandingPage) or AuthPage modal
  if (!token || !user) {
    if (authMode || page !== 'home') {
      return (
        <AuthPage
          initialTab={authMode || 'signin'}
          onBackToHome={() => {
            setAuthMode(null);
            navigate('home');
          }}
        />
      );
    }
    return <LandingPage user={null} onOpenAuth={(mode) => setAuthMode(mode || 'signin')} />;
  }

  // If authenticated: render Homepage on '/', DashboardPage on '/dashboard', etc.
  if (page === 'home') {
    return (
      <LandingPage
        user={user}
        onOpenAuth={(mode) => {
          if (mode === 'dashboard') navigate('dashboard');
        }}
      />
    );
  }

  if (page === 'ai-tutor') return <AITutorPage onNavigate={navigate} />;
  if (page === 'doubt')    return <DoubtSolverPage onNavigate={navigate} />;
  if (page === 'quiz')     return <QuizPage onNavigate={navigate} />;
  if (page === 'roadmap')  return <RoadmapPage onNavigate={navigate} />;

  // default: dashboard on '/dashboard'
  return <DashboardPage onNavigate={navigate} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <MainAppContent />
      </UserProvider>
    </ThemeProvider>
  );
}
