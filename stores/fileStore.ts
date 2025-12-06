import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FileItem {
  id?: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isFolder: boolean;
  children?: FileItem[];
  isSaved?: boolean;
}

interface FileState {
  files: FileItem[];
  activeFile: string | null;
  openFiles: string[];
  isLoading: boolean;
  isSaving: boolean;
  currentProjectId: string | null;
  
  // Actions
  loadFiles: (projectId?: string) => Promise<void>;
  addFile: (file: Omit<FileItem, 'isFolder'>, projectId?: string) => void;
  saveFile: (path: string, projectId?: string) => Promise<void>;
  saveAllFiles: () => Promise<void>;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => Promise<void>;
  setActiveFile: (path: string | null) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  getFileContent: (path: string) => string | undefined;
  getFileByPath: (path: string) => FileItem | undefined;
  clearFiles: () => void;
  setCurrentProject: (projectId: string | null) => void;
}

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'yml': 'yaml',
    'yaml': 'yaml',
    'xml': 'xml',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
  };
  return langMap[ext] || 'plaintext';
}

export const useFileStore = create<FileState>()(
  persist(
    (set, get) => ({
      files: [],
      activeFile: null,
      openFiles: [],
      isLoading: false,
      isSaving: false,
      currentProjectId: null,
      
      loadFiles: async (projectId) => {
        set({ isLoading: true, currentProjectId: projectId || null });
        try {
          const params = new URLSearchParams();
          if (projectId) params.append('projectId', projectId);
          
          const res = await fetch(`/api/files?${params}`);
          if (res.ok) {
            const data = await res.json();
            set({ 
              files: data.files.map((f: any) => ({
                ...f,
                language: detectLanguage(f.name),
                isSaved: true,
              })),
              openFiles: [],
              activeFile: null,
            });
          }
        } catch (error) {
          console.error('Failed to load files:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      setCurrentProject: (projectId) => {
        set({ currentProjectId: projectId });
        if (projectId) {
          get().loadFiles(projectId);
        } else {
          set({ files: [], openFiles: [], activeFile: null });
        }
      },
      
      addFile: (file, projectId) => {
        const language = file.language || detectLanguage(file.name);
        const newFile: FileItem = {
          ...file,
          language,
          isFolder: false,
          isSaved: false, // Mark as unsaved
        };
        
        set(state => {
          const exists = state.files.some(f => f.path === file.path);
          if (exists) {
            return {
              files: state.files.map(f => 
                f.path === file.path 
                  ? { ...f, content: file.content, isSaved: false } 
                  : f
              ),
            };
          }
          return { files: [...state.files, newFile] };
        });
        
        // Auto-open the file
        get().openFile(file.path);
        
        // Auto-save after a short delay
        const currentProject = get().currentProjectId;
        setTimeout(() => get().saveFile(file.path, currentProject || undefined), 1000);
      },
      
      saveFile: async (path, projectId) => {
        const file = get().files.find(f => f.path === path);
        if (!file || file.isSaved) return;
        
        const pid = projectId || get().currentProjectId;
        
        set({ isSaving: true });
        try {
          const res = await fetch('/api/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: file.name,
              path: file.path,
              content: file.content,
              isFolder: file.isFolder,
              projectId: pid,
            })
          });
          
          if (res.ok) {
            const saved = await res.json();
            set(state => ({
              files: state.files.map(f => 
                f.path === path ? { ...f, id: saved.id, isSaved: true } : f
              )
            }));
          }
        } catch (error) {
          console.error('Failed to save file:', error);
        } finally {
          set({ isSaving: false });
        }
      },
      
      saveAllFiles: async () => {
        const unsavedFiles = get().files.filter(f => !f.isSaved);
        for (const file of unsavedFiles) {
          await get().saveFile(file.path);
        }
      },
      
      updateFile: (path, content) => {
        set(state => ({
          files: state.files.map(f =>
            f.path === path ? { ...f, content, isSaved: false } : f
          ),
        }));
        
        // Debounced auto-save
        clearTimeout((window as any).__saveTimeout);
        (window as any).__saveTimeout = setTimeout(() => {
          get().saveFile(path);
        }, 2000);
      },
      
      deleteFile: async (path) => {
        try {
          await fetch(`/api/files?path=${encodeURIComponent(path)}`, {
            method: 'DELETE'
          });
        } catch (error) {
          console.error('Failed to delete file:', error);
        }
        
        set(state => ({
          files: state.files.filter(f => f.path !== path),
          openFiles: state.openFiles.filter(p => p !== path),
          activeFile: state.activeFile === path ? null : state.activeFile,
        }));
      },
      
      setActiveFile: (path) => set({ activeFile: path }),
      
      openFile: (path) => {
        set(state => ({
          openFiles: state.openFiles.includes(path) 
            ? state.openFiles 
            : [...state.openFiles, path],
          activeFile: path,
        }));
      },
      
      closeFile: (path) => {
        set(state => {
          const newOpenFiles = state.openFiles.filter(p => p !== path);
          return { 
            openFiles: newOpenFiles, 
            activeFile: state.activeFile === path 
              ? newOpenFiles[newOpenFiles.length - 1] || null
              : state.activeFile 
          };
        });
      },
      
      getFileContent: (path) => get().files.find(f => f.path === path)?.content,
      getFileByPath: (path) => get().files.find(f => f.path === path),
      
      clearFiles: () => set({ files: [], activeFile: null, openFiles: [] }),
    }),
    {
      name: 'file-store',
      partialize: (state) => ({
        files: state.files.slice(0, 50), // Keep last 50 files in localStorage as backup
        openFiles: state.openFiles,
        activeFile: state.activeFile,
      }),
    }
  )
);

// Helper to parse code blocks from AI response
export function parseCodeBlocksToFiles(content: string): FileItem[] {
  const files: FileItem[] = [];
  const codeBlockRegex = /```(\w+)(?:[:\s]+([^\n]+))?\n([\s\S]*?)```/g;
  
  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [, lang, filename, code] = match;
    
    if (filename) {
      const cleanFilename = filename.trim();
      files.push({
        name: cleanFilename.split('/').pop() || cleanFilename,
        path: cleanFilename.startsWith('/') ? cleanFilename : `/${cleanFilename}`,
        content: code.trim(),
        language: lang,
        isFolder: false,
      });
    }
  }
  
  return files;
}
