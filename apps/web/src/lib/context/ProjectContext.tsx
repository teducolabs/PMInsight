import { createContext, useContext, useState, ReactNode } from 'react';

interface ProjectContextType {
  currentProjectId: string | null;
  currentProjectName: string | null;
  setCurrentProject: (id: string, name: string) => void;
  clearCurrentProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider = ({ children }: ProjectProviderProps) => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(() => {
    // Load from localStorage on init
    return localStorage.getItem('currentProjectId');
  });
  
  const [currentProjectName, setCurrentProjectName] = useState<string | null>(() => {
    return localStorage.getItem('currentProjectName');
  });

  const setCurrentProject = (id: string, name: string) => {
    setCurrentProjectId(id);
    setCurrentProjectName(name);
    localStorage.setItem('currentProjectId', id);
    localStorage.setItem('currentProjectName', name);
  };

  const clearCurrentProject = () => {
    setCurrentProjectId(null);
    setCurrentProjectName(null);
    localStorage.removeItem('currentProjectId');
    localStorage.removeItem('currentProjectName');
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProjectId,
        currentProjectName,
        setCurrentProject,
        clearCurrentProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
