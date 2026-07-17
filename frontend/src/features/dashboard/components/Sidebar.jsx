import { useTheme } from '../hooks/useTheme';
import { useUser } from '../../../context/UserContext';
import { Icons } from './Icons';

const NAV_ITEMS = [
  { Icon: Icons.Dashboard,  label: 'Dashboard',      id: 'dashboard', badge: null },
  { Icon: Icons.Roadmap,    label: 'Roadmap',        id: 'roadmap',   badge: null },
  { Icon: Icons.Doubt,      label: 'Doubt Solver',   id: 'doubt',     badge: null },
  { Icon: Icons.Tutor,      label: 'AI Tutor',       id: 'ai-tutor',  badge: null },
  { Icon: Icons.Quiz,       label: 'Quizzes',        id: 'quiz',      badge: null },
];

import Logo from '../../../components/Logo';

export default function Sidebar({ activePage, onNavigate }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useUser();
  const isDark = theme === 'dark';

  const displayName = user?.displayName || 'Sidd';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div
        className="sidebar-logo"
        onClick={() => onNavigate && onNavigate('home')}
        style={{ cursor: 'pointer' }}
        title="Go to Homepage (/)"
      >
        <Logo size={28} />
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <span className="sidebar-nav-label">Main Menu</span>

        {NAV_ITEMS.map(({ Icon, label, id, badge }) => (
          <div
            key={id}
            className={`nav-item ${activePage === id ? 'active' : ''}`}
            onClick={() => onNavigate(id)}
          >
            <span className="nav-item-icon"><Icon /></span>
            {label}
            {badge && <span className="nav-item-badge">{badge}</span>}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        {/* Theme Toggle */}
        <div className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          <span className="theme-toggle-label">
            {isDark ? <Icons.Moon /> : <Icons.Sun />}
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </span>
          <div className={`toggle-switch ${isDark ? 'on' : ''}`}>
            <div className="toggle-knob" />
          </div>
        </div>

        {/* User Profile */}
        <div className="sidebar-user">
          {user?.photo ? (
            <img src={user.photo} alt={displayName} className="sidebar-avatar" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="sidebar-avatar">{initial}</div>
          )}
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{displayName}</div>
            <div className="sidebar-user-role">AI Learner</div>
          </div>
        </div>

        {/* Logout */}
        <button type="button" className="sidebar-logout-btn" onClick={logout}>
          <Icons.Logout /> Logout
        </button>
      </div>
    </aside>
  );
}
