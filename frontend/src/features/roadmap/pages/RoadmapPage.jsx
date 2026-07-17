import { useWorkflow } from '../../dashboard/hooks/useWorkflow';
import { useUser } from '../../../context/UserContext';
import Sidebar from '../../dashboard/components/Sidebar';
import '../styles/roadmap.css';

const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default function RoadmapPage({ onNavigate }) {
  const { userId } = useUser();
  const { plan, loading, error } = useWorkflow(userId);

  return (
    <div className="roadmap-page">
      <Sidebar activePage="roadmap" onNavigate={onNavigate} />
      
      <main className="roadmap-main">
        <div className="roadmap-header">
          <h1 className="roadmap-title">{plan?.title || 'Your Learning Roadmap'}</h1>
          <p className="roadmap-subtitle">
            {plan ? `${plan.total_weeks} weeks • ${plan.hours_per_week} hours/week` : 'Generate a plan to see your personalized roadmap.'}
          </p>
        </div>

        {loading ? (
          <div className="roadmap-empty">Loading your personalized roadmap...</div>
        ) : error ? (
          <div className="roadmap-empty">Error loading roadmap: {error}</div>
        ) : !plan ? (
          <div className="roadmap-empty">No roadmap found. Head to the dashboard to set up your learning goal!</div>
        ) : (
          <div className="roadmap-timeline">
            {plan.weeks.map((week, idx) => {
              const isCompleted = week.week < (plan.current_week || 1);
              const isActive = week.week === (plan.current_week || 1);
              
              return (
                <div 
                  key={week.week} 
                  className={`roadmap-week ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="roadmap-week-indicator">
                    {isCompleted ? <CheckIcon /> : week.week}
                  </div>
                  
                  <div className="roadmap-week-content">
                    <div className="roadmap-week-header">
                      <h3 className="roadmap-week-theme">{week.theme}</h3>
                      <span className="roadmap-week-meta">Week {week.week}</span>
                    </div>

                    <div className="roadmap-topics">
                      {week.topics?.map(topic => (
                        <span key={topic} className="roadmap-topic-tag">{topic}</span>
                      ))}
                    </div>

                    <div className="roadmap-tasks">
                      {week.tasks?.map(task => (
                        <div key={task.id} className="roadmap-task">
                          <div className="roadmap-task-icon">
                            <BookIcon />
                          </div>
                          <div className="roadmap-task-info">
                            <div className="roadmap-task-title">{task.title}</div>
                            <div className="roadmap-task-desc">{task.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
