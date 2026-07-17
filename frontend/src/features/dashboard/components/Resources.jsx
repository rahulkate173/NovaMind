import { Icons } from './Icons';
import { useDailyTasks } from '../hooks/useDailyTasks';
import { useWorkflow } from '../hooks/useWorkflow';
import { useUser } from '../../../context/UserContext';

function ResourceSkeleton() {
  return (
    <div className="resource-item" style={{ opacity: 0.5, pointerEvents: 'none' }}>
      <div className="resource-icon doc" style={{ background: 'var(--bg-tertiary)' }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: '12px', width: '70%', borderRadius: '6px', background: 'var(--bg-tertiary)', marginBottom: '6px' }} />
        <div style={{ height: '10px', width: '40%', borderRadius: '6px', background: 'var(--bg-tertiary)' }} />
      </div>
    </div>
  );
}

export default function Resources() {
  const { userId } = useUser();
  const { tasks, loading: tasksLoading } = useDailyTasks(userId);
  const { plan, loading: planLoading } = useWorkflow(userId);

  const loading = tasksLoading || planLoading;
  const allResources = [];
  const seen = new Set();

  const addRes = (res, defaultType = 'doc') => {
    if (!res) return;
    const title = typeof res === 'string' ? res : (res.title || res.name || 'Learning Resource');
    const url = typeof res === 'string' ? (res.startsWith('http') ? res : '#') : (res.url || res.link || '#');
    const type = typeof res === 'string' ? defaultType : (res.kind || res.type || defaultType);
    const key = `${title}-${url}`;
    if (!seen.has(key)) {
      seen.add(key);
      let hostnameMeta = type.toUpperCase() + ' · Agent Recommended';
      if (url && url !== '#') {
        try {
          hostnameMeta = new URL(url, window.location.href).hostname.replace('www.', '') + ' · Agent Link';
        } catch {
          hostnameMeta = type.toUpperCase() + ' · Resource';
        }
      }
      allResources.push({
        id: key,
        title,
        url,
        type: ['video', 'doc', 'code', 'quiz', 'roadmap', 'link'].includes(type) ? type : 'doc',
        meta: hostnameMeta
      });
    }
  };

  // Extract resources from today's tasks
  tasks?.forEach(t => {
    t.resources?.forEach(r => addRes(r, 'doc'));
  });

  // Extract resources across all weeks & tasks in the plan
  plan?.weeks?.forEach(w => {
    w.tasks?.forEach(t => {
      t.resources?.forEach(r => addRes(r, 'doc'));
    });
    w.resources?.forEach(r => addRes(r, 'doc'));
  });

  const getIcon = (type) => {
    switch (type) {
      case 'video': return Icons.Video;
      case 'code': return Icons.Code;
      case 'quiz': return Icons.Brain;
      case 'roadmap': return Icons.Map;
      default: return Icons.Doc;
    }
  };

  return (
    <div className="section-card animate-in">
      <div className="section-card-header">
        <h2 className="section-card-title">
          <Icons.Book />
          Resources
          {!loading && allResources.length > 0 && (
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '4px' }}>
              ({allResources.length})
            </span>
          )}
        </h2>
        <span className="section-card-action">Agent Curated</span>
      </div>

      <div className="resource-list">
        {loading && [1, 2, 3].map(k => <ResourceSkeleton key={k} />)}

        {!loading && allResources.length === 0 && (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px',
          }}>
            🎉 No resources yet — generate your roadmap and your agent will attach study links, docs, and videos right here!
          </div>
        )}

        {!loading && allResources.map(({ id, type, title, url, meta }) => {
          const Icon = getIcon(type);
          const isLink = url && url !== '#';
          return (
            <div
              className="resource-item"
              key={id}
              onClick={() => isLink && window.open(url, '_blank')}
              style={{ cursor: isLink ? 'pointer' : 'default' }}
              title={isLink ? url : title}
            >
              <div className={`resource-icon ${type}`}>
                <Icon />
              </div>
              <div className="resource-info">
                <div className="resource-title">{title}</div>
                <div className="resource-meta">{meta}</div>
              </div>
              {isLink && (
                <span className="resource-arrow"><Icons.Arrow /></span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
