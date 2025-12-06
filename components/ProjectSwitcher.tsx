'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Plus, Folder, Trash2, Edit2, Check, X } from 'lucide-react';
import { useProjectStore, Project } from '@/stores/projectStore';
import { useFileStore } from '@/stores/fileStore';

interface ProjectSwitcherProps {
  workspace: string;
}

export function ProjectSwitcher({ workspace }: ProjectSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const { 
    projects, 
    activeProjectId, 
    isLoading,
    loadProjects, 
    createProject, 
    updateProject,
    deleteProject,
    setActiveProject 
  } = useProjectStore();
  
  const { loadFiles, clearFiles } = useFileStore();

  useEffect(() => {
    loadProjects(workspace);
  }, [workspace, loadProjects]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleSelectProject = async (project: Project) => {
    setActiveProject(project.id);
    await loadFiles(project.id);
    setIsOpen(false);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    const project = await createProject(newProjectName.trim(), workspace);
    if (project) {
      await loadFiles(project.id);
      setNewProjectName('');
      setIsCreating(false);
    }
  };

  const handleUpdateProject = async (projectId: string) => {
    if (!editName.trim()) return;
    await updateProject(projectId, { name: editName.trim() });
    setEditingId(null);
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this project and all its files?')) {
      await deleteProject(projectId);
      if (projects.length > 1) {
        const next = projects.find(p => p.id !== projectId);
        if (next) {
          await loadFiles(next.id);
        }
      } else {
        clearFiles();
      }
    }
  };

  return (
    <div className="relative">
      {/* Current Project Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm w-full"
      >
        <Folder className="w-4 h-4 text-purple-400" />
        <span className="flex-1 text-left truncate">
          {isLoading ? 'Loading...' : activeProject?.name || 'Select Project'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {/* Project List */}
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => !editingId && handleSelectProject(project)}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-700 ${
                project.id === activeProjectId ? 'bg-purple-500/20' : ''
              }`}
            >
              {editingId === project.id ? (
                <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateProject(project.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button 
                    onClick={() => handleUpdateProject(project.id)}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    <Check className="w-4 h-4 text-green-400" />
                  </button>
                  <button 
                    onClick={() => setEditingId(null)}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ) : (
                <>
                  <Folder className="w-4 h-4 text-gray-400" />
                  <span className="flex-1 truncate">{project.name}</span>
                  {project._count && (
                    <span className="text-xs text-gray-500">
                      {project._count.files} files
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(project.id);
                      setEditName(project.name);
                    }}
                    className="p-1 hover:bg-gray-600 rounded opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 className="w-3 h-3 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className="p-1 hover:bg-red-500/20 rounded"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </>
              )}
            </div>
          ))}

          {projects.length === 0 && !isCreating && (
            <div className="px-3 py-4 text-center text-gray-500 text-sm">
              No projects yet
            </div>
          )}

          {/* Create New Project */}
          <div className="border-t border-gray-700">
            {isCreating ? (
              <div className="p-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project name..."
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateProject();
                      if (e.key === 'Escape') {
                        setIsCreating(false);
                        setNewProjectName('');
                      }
                    }}
                  />
                  <button
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim()}
                    className="px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-lg text-sm"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setNewProjectName('');
                    }}
                    className="p-2 hover:bg-gray-700 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-700 text-purple-400"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
