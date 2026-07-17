import { useState,useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import HeroCard from '../components/HeroCard';
import TodaysTasks from '../components/TodaysTasks';
import Resources from '../components/Resources';
import QuickActions from '../components/QuickActions';
import SetupModal from '../components/SetupModal';
import { useWorkflow } from '../hooks/useWorkflow';
import { useUser } from '../../../context/UserContext';
import '../styles/dashboard.css';

export default function DashboardPage({ onNavigate }) {
  const [activePage, setActivePage] = useState('dashboard');
  const { userId, user } = useUser();
  const { plan, loading: planLoading, starting, initPlan } = useWorkflow(userId);
  const [stats, setStats] = useState({ streak: 0, quizzes: 0, progress: 0 });

  useEffect(() => {
    import('../../../services/api').then(({ getAgentState }) => {
      if (userId) {
        getAgentState(userId).then(state => {
          if (state) {
            // calculate streak (mocked based on state properties, or state.streak if it exists)
            // Python backend actually doesn't have a specific "streak" field by default, we can use completed_tasks length or just 1 for now if active
            const quizzesDone = state.quiz_history ? state.quiz_history.length : 0;
            const progress = state.overall_progress ? Math.round(state.overall_progress) : 0;
            setStats({ streak: state.completed_tasks?.length || 0, quizzes: quizzesDone, progress });
          }
        }).catch(() => {});
      }
    });
  }, [userId, plan]);

  const handleNavigate = (id) => {
    setActivePage(id);
    if (onNavigate) onNavigate(id);
  };

  // Show setup modal until we have a plan OR while loading
  const showSetup = !planLoading && !plan;

  return (
    <div className="dashboard-layout">
      <Sidebar activePage={activePage} onNavigate={handleNavigate} />

      <main className="dashboard-main">
        <HeroCard 
          name={user?.displayName?.split(' ')[0] || 'Learner'} 
          streak={stats.streak} 
          quizzes={stats.quizzes} 
          progress={stats.progress} 
        />

        <div className="middle-row" key={plan ? 'has-plan' : 'no-plan'}>
          <TodaysTasks />
          <Resources />
        </div>

        <QuickActions onNavigate={handleNavigate} />
      </main>

      {/* Setup modal – shown when no learning plan exists */}
      {showSetup && (
        <SetupModal
          onSubmit={initPlan}
          loading={starting}
        />
      )}
    </div>
  );
}
