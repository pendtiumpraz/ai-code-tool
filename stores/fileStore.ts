import { create } from 'zustand';

export interface FileItem {
  name: string;
  path: string;
  content: string;
  language: string;
  isFolder: boolean;
  children?: FileItem[];
}

interface FileState {
  files: FileItem[];
  activeFile: string | null;
  openFiles: string[]; // Tabs
  
  // Actions
  addFile: (file: Omit<FileItem, 'isFolder'>) => void;
  updateFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  getFileContent: (path: string) => string | undefined;
  getFileByPath: (path: string) => FileItem | undefined;
  clearFiles: () => void;
}

// Detect language from file extension
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

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  activeFile: null,
  openFiles: [],
  
  addFile: (file) => {
    const language = file.language || detectLanguage(file.name);
    const newFile: FileItem = {
      ...file,
      language,
      isFolder: false,
    };
    
    set((state) => {
      // Check if file already exists
      const exists = state.files.some(f => f.path === file.path);
      if (exists) {
        // Update existing file
        return {
          files: state.files.map(f => 
            f.path === file.path ? { ...f, content: file.content } : f
          ),
        };
      }
      return { files: [...state.files, newFile] };
    });
    
    // Auto-open the file
    get().openFile(file.path);
  },
  
  updateFile: (path, content) => {
    set((state) => ({
      files: state.files.map(f =>
        f.path === path ? { ...f, content } : f
      ),
    }));
  },
  
  deleteFile: (path) => {
    set((state) => ({
      files: state.files.filter(f => f.path !== path),
      openFiles: state.openFiles.filter(p => p !== path),
      activeFile: state.activeFile === path ? null : state.activeFile,
    }));
  },
  
  setActiveFile: (path) => {
    set({ activeFile: path });
  },
  
  openFile: (path) => {
    set((state) => ({
      openFiles: state.openFiles.includes(path) 
        ? state.openFiles 
        : [...state.openFiles, path],
      activeFile: path,
    }));
  },
  
  closeFile: (path) => {
    set((state) => {
      const newOpenFiles = state.openFiles.filter(p => p !== path);
      const newActiveFile = state.activeFile === path 
        ? newOpenFiles[newOpenFiles.length - 1] || null
        : state.activeFile;
      return { openFiles: newOpenFiles, activeFile: newActiveFile };
    });
  },
  
  getFileContent: (path) => {
    return get().files.find(f => f.path === path)?.content;
  },
  
  getFileByPath: (path) => {
    return get().files.find(f => f.path === path);
  },
  
  clearFiles: () => {
    set({ files: [], activeFile: null, openFiles: [] });
  },
}));

// Helper to parse code blocks from AI response and create files
export function parseCodeBlocksToFiles(content: string): FileItem[] {
  const files: FileItem[] = [];
  
  // Match ```language:filename or ```language filename patterns
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
