import { Icons } from './Icons';

const PROGRESS_DATA = [
  { name: 'Data Structures',      pct: 72, color: 'linear-gradient(90deg,#7c6af7,#9d8bf4)' },
  { name: 'Algorithms',           pct: 55, color: 'linear-gradient(90deg,#2ab5d1,#3b7cf6)' },
  { name: 'System Design',        pct: 30, color: 'linear-gradient(90deg,#22c984,#0e9966)' },
  { name: 'Frontend Development', pct: 88, color: 'linear-gradient(90deg,#e9a84c,#dc5252)' },
];

export default function ProgressSection() {
  return (
    <div className="progress-section animate-in">
      <div className="progress-header">
        <div>
          <div className="progress-title">
            <Icons.Chart /> Learning Progress
          </div>
          <div className="progress-subtitle">Your roadmap completion by topic</div>
        </div>
        <span className="section-card-action">Full Roadmap</span>
      </div>

      <div className="progress-bar-list">
        {PROGRESS_DATA.map(item => (
          <div className="progress-bar-item" key={item.name}>
            <div className="progress-bar-meta">
              <span className="progress-bar-name">{item.name}</span>
              <span className="progress-bar-pct">{item.pct}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${item.pct}%`, background: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
