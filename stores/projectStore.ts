import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Project {
  id: string;
  name: string;
  description?: string;
  workspace: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    files: number;
    tasks: number;
  };
}

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  isLoading: boolean;
  
  // Actions
  loadProjects: (workspace?: string) => Promise<void>;
  createProject: (name: string, workspace: string, description?: string) => Promise<Project | null>;
  updateProject: (projectId: string, data: { name?: string; description?: string }) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  setActiveProject: (projectId: string | null) => void;
  getActiveProject: () => Project | undefined;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,
      isLoading: false,
      
      loadProjects: async (workspace) => {
        set({ isLoading: true });
        try {
          const params = new URLSearchParams();
          if (workspace) params.append('workspace', workspace);
          
          const res = await fetch(`/api/projects?${params}`);
          if (res.ok) {
            const data = await res.json();
            set({ projects: data.projects });
            
            // If no active project, set first one as active
            const state = get();
            if (!state.activeProjectId && data.projects.length > 0) {
              set({ activeProjectId: data.projects[0].id });
            }
          }
        } catch (error) {
          console.error('Failed to load projects:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      createProject: async (name, workspace, description) => {
        try {
          const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, workspace, description }),
          });
          
          if (res.ok) {
            const data = await res.json();
            const newProject = data.project;
            
            set(state => ({
              projects: [newProject, ...state.projects],
              activeProjectId: newProject.id,
            }));
            
            return newProject;
          }
          return null;
        } catch (error) {
          console.error('Failed to create project:', error);
          return null;
        }
      },
      
      updateProject: async (projectId, data) => {
        try {
          const res = await fetch('/api/projects', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, ...data }),
          });
          
          if (res.ok) {
            const updated = await res.json();
            set(state => ({
              projects: state.projects.map(p =>
                p.id === projectId ? { ...p, ...updated.project } : p
              ),
            }));
          }
        } catch (error) {
          console.error('Failed to update project:', error);
        }
      },
      
      deleteProject: async (projectId) => {
        try {
          const res = await fetch(`/api/projects?projectId=${projectId}`, {
            method: 'DELETE',
          });
          
          if (res.ok) {
            set(state => {
              const newProjects = state.projects.filter(p => p.id !== projectId);
              return {
                projects: newProjects,
                activeProjectId: state.activeProjectId === projectId
                  ? newProjects[0]?.id || null
                  : state.activeProjectId,
              };
            });
          }
        } catch (error) {
          console.error('Failed to delete project:', error);
        }
      },
      
      setActiveProject: (projectId) => set({ activeProjectId: projectId }),
      
      getActiveProject: () => {
        const state = get();
        return state.projects.find(p => p.id === state.activeProjectId);
      },
    }),
    {
      name: 'project-store',
      partialize: (state) => ({
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);
