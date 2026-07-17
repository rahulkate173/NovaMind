const TOPICS = [
  { name: 'Data Structures', pct: 72 },
  { name: 'Algorithms',      pct: 55 },
  { name: 'System Design',   pct: 30 },
  { name: 'JavaScript',      pct: 80 },
  { name: 'React',           pct: 65 },
  { name: 'Python',          pct: 48 },
  { name: 'SQL',             pct: 35 },
];

export default function TutorTopicSidebar({ activeTopic, onSelect }) {
  return (
    <aside className="tutor-sidebar">
      <div className="tutor-sidebar-header">
        <span className="tutor-sidebar-label">Topics</span>
      </div>

      <div className="tutor-topic-list">
        {TOPICS.map(topic => (
          <div
            key={topic.name}
            className={`tutor-topic-item ${activeTopic === topic.name ? 'active' : ''}`}
            onClick={() => onSelect(topic.name)}
          >
            {activeTopic !== topic.name && <div className="tutor-topic-dot" />}
            {topic.name}
            <span className="tutor-topic-progress">{topic.pct}%</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
