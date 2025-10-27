import { useProject } from '@/lib/context/ProjectContext';
import { Navigate } from 'react-router-dom';
import { SchedulePage } from '@/pages/schedule';

export function WBSPage() {
  const { currentProjectId } = useProject();

  // Redirect to projects if no project selected
  if (!currentProjectId) {
    return <Navigate to="/projects" replace />;
  }

  // Render SchedulePage with the current project context
  return <SchedulePage />;
}
