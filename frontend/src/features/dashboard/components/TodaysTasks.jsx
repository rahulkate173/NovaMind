import { Icons } from './Icons';
import { useDailyTasks } from '../hooks/useDailyTasks';
import { useUser } from '../../../context/UserContext';

/* ── Skeleton loader ──────────────────────────────────────────────────────── */
function TaskSkeleton() {
  return (
    <div className="task-item" style={{ opacity: 0.5, pointerEvents: 'none' }}>
      <div className="task-check" style={{ background: 'var(--bg-tertiary)', border: 'none' }} />
      <div style={{
        flex: 1,
        height: '12px',
        borderRadius: '6px',
        background: 'var(--bg-tertiary)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }} />
    </div>
  );
}

export default function TodaysTasks() {
  const { userId } = useUser();
  const { tasks, loading, error, toggle } = useDailyTasks(userId);

  const doneCount = tasks.filter(t => t.done).length;

  return (
    <div className="section-card animate-in">
      <div className="section-card-header">
        <h2 className="section-card-title">
          <Icons.Tasks />
          Today's Tasks
          {!loading && (
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '4px' }}>
              {doneCount}/{tasks.length}
            </span>
          )}
        </h2>
        <span className="section-card-action">View All</span>
      </div>

      <div className="task-list">
        {/* Loading skeletons */}
        {loading && [1, 2, 3].map(k => <TaskSkeleton key={k} />)}

        {/* Error state */}
        {!loading && error && (
          <div style={{
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(239,68,68,0.08)',
            color: '#ef4444',
            fontSize: '13px',
            textAlign: 'center',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && tasks.length === 0 && (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}>
            🎉 No tasks today — start a learning plan to get started!
          </div>
        )}

        {/* Task list */}
        {!loading && !error && tasks.map(task => (
          <div
            key={task.id}
            className={`task-item ${task.done ? 'done' : ''}`}
            onClick={() => toggle(task.id)}
          >
            <div className={`task-check ${task.done ? 'done' : ''}`}>
              {task.done && <Icons.Check />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="task-text">{task.text}</div>
              {task.description && task.description !== task.text && (
                <div className="task-desc-ui">{task.description}</div>
              )}
              {task.resources?.length > 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  📚 {task.resources.length} resource{task.resources.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
