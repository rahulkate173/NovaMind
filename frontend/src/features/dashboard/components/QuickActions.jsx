import { Icons } from './Icons';

const QUICK_CARDS = [
  {
    id: 'doubt',
    variant: 'doubt',
    Icon: Icons.Doubt,
    label: 'Doubt Solver',
    desc: 'Get instant AI-powered answers',
  },
  {
    id: 'ai-tutor',
    variant: 'tutor',
    Icon: Icons.Tutor,
    label: 'AI Tutor',
    desc: 'Learn concepts step by step',
  },
  {
    id: 'quiz',
    variant: 'quiz',
    Icon: Icons.Quiz,
    label: 'Chapter Quiz',
    desc: 'Test your knowledge now',
  },
];

export default function QuickActions({ onNavigate }) {
  return (
    <div className="quick-actions-row">
      {QUICK_CARDS.map(({ id, variant, Icon, label, desc }, i) => (
        <div
          key={id}
          className={`quick-card ${variant} animate-in`}
          style={{ animationDelay: `${i * 0.08}s` }}
          onClick={() => onNavigate && onNavigate(id)}
        >
          <div className="quick-card-icon-wrap">
            <Icon />
          </div>
          <div>
            <div className="quick-card-label">{label}</div>
            <div className="quick-card-desc">{desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
