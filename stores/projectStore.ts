import { create } from 'zustand';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  driveId?: string;
}

interface ProjectState {
  // Project info
  projectId: string | null;
  projectName: string | null;
  
  // Files
  files: FileNode[];
  openFiles: string[];
  activeFile: string | null;
  fileContents: Map<string, string>;
  unsavedFiles: Set<string>;
  
  // Actions
  setProject: (id: string, name: string) => void;
  setFiles: (files: FileNode[]) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  setFileContent: (path: string, content: string) => void;
  markUnsaved: (path: string) => void;
  markSaved: (path: string) => void;
  addFile: (file: FileNode) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectId: null,
  projectName: null,
  files: [],
  openFiles: [],
  activeFile: null,
  fileContents: new Map(),
  unsavedFiles: new Set(),

  setProject: (id, name) => set({ projectId: id, projectName: name }),

  setFiles: (files) => set({ files }),

  openFile: (path) => {
    const { openFiles } = get();
    if (!openFiles.includes(path)) {
      set({ openFiles: [...openFiles, path], activeFile: path });
    } else {
      set({ activeFile: path });
    }
  },

  closeFile: (path) => {
    const { openFiles, activeFile } = get();
    const newOpenFiles = openFiles.filter((f) => f !== path);
    const newActiveFile = activeFile === path 
      ? newOpenFiles[newOpenFiles.length - 1] || null 
      : activeFile;
    set({ openFiles: newOpenFiles, activeFile: newActiveFile });
  },

  setActiveFile: (path) => set({ activeFile: path }),

  setFileContent: (path, content) => {
    const { fileContents } = get();
    const newContents = new Map(fileContents);
    newContents.set(path, content);
    set({ fileContents: newContents });
  },

  markUnsaved: (path) => {
    const { unsavedFiles } = get();
    const newUnsaved = new Set(unsavedFiles);
    newUnsaved.add(path);
    set({ unsavedFiles: newUnsaved });
  },

  markSaved: (path) => {
    const { unsavedFiles } = get();
    const newUnsaved = new Set(unsavedFiles);
    newUnsaved.delete(path);
    set({ unsavedFiles: newUnsaved });
  },

  addFile: (file) => {
    const { files } = get();
    set({ files: [...files, file] });
  },

  deleteFile: (path) => {
    const { files, openFiles, activeFile, fileContents, unsavedFiles } = get();
    
    const filterFiles = (nodes: FileNode[]): FileNode[] => 
      nodes.filter((node) => {
        if (node.path === path) return false;
        if (node.children) {
          node.children = filterFiles(node.children);
        }
        return true;
      });

    const newContents = new Map(fileContents);
    newContents.delete(path);
    
    const newUnsaved = new Set(unsavedFiles);
    newUnsaved.delete(path);

    set({
      files: filterFiles([...files]),
      openFiles: openFiles.filter((f) => f !== path),
      activeFile: activeFile === path ? null : activeFile,
      fileContents: newContents,
      unsavedFiles: newUnsaved,
    });
  },

  renameFile: (oldPath, newPath) => {
    const { files, openFiles, activeFile, fileContents, unsavedFiles } = get();
    
    const renameInTree = (nodes: FileNode[]): FileNode[] =>
      nodes.map((node) => {
        if (node.path === oldPath) {
          return { ...node, path: newPath, name: newPath.split('/').pop() || newPath };
        }
        if (node.children) {
          node.children = renameInTree(node.children);
        }
        return node;
      });

    const newContents = new Map(fileContents);
    const content = newContents.get(oldPath);
    if (content) {
      newContents.delete(oldPath);
      newContents.set(newPath, content);
    }

    const newUnsaved = new Set(unsavedFiles);
    if (newUnsaved.has(oldPath)) {
      newUnsaved.delete(oldPath);
      newUnsaved.add(newPath);
    }

    set({
      files: renameInTree([...files]),
      openFiles: openFiles.map((f) => (f === oldPath ? newPath : f)),
      activeFile: activeFile === oldPath ? newPath : activeFile,
      fileContents: newContents,
      unsavedFiles: newUnsaved,
    });
  },
}));
