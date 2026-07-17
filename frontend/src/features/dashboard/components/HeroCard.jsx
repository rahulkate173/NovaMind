import { Icons } from './Icons';

export default function HeroCard({ name = 'Sidd', streak = 0, quizzes = 0, progress = 0 }) {
  return (
    <div className="hero-card animate-in">
      {/* Greeting */}
      <div className="hero-greeting">
        <p className="hero-greeting-sub">Welcome back,</p>
        <h1 className="hero-greeting-name">{name}</h1>
        <p className="hero-greeting-msg">
          You're on a roll! Keep learning and stay consistent.
        </p>
      </div>

      {/* Stats Chips */}
      <div className="hero-stats">
        <StatChip variant="streak"  Icon={Icons.Fire}   value={streak}   label="Tasks Done"    />
        <StatChip variant="quizzes" Icon={Icons.Target}  value={quizzes}  label="Quizzes Done"  />
        <StatChip variant="roadmap" Icon={Icons.Map}     value={`${progress}%`} label="Your Roadmap"  />
      </div>
    </div>
  );
}

function StatChip({ variant, Icon, value, label }) {
  return (
    <div className={`stat-chip ${variant}`}>
      <span className="stat-chip-icon"><Icon /></span>
      <span className="stat-chip-value">{value}</span>
      <span className="stat-chip-label">{label}</span>
    </div>
  );
}
