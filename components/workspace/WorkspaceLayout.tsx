'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  PanelLeftClose, PanelLeft, MessageSquare, Code,
  Terminal as TerminalIcon, Eye, Files, Settings,
  Play, Save, ChevronDown, Loader2, X
} from 'lucide-react';
import { Editor, EditorFile } from '@/components/editor/Editor';
import { Terminal } from '@/components/editor/Terminal';
import { Preview } from '@/components/editor/Preview';
import { FileExplorer, FileNode } from '@/components/editor/FileExplorer';
import { Chat } from '@/components/chat/Chat';
import { useWebContainer, defaultProjectFiles } from '@/hooks/useWebContainer';
import { WorkspaceConfig } from '@/config/workspaces';

interface WorkspaceLayoutProps {
  workspace: WorkspaceConfig;
  projectId?: string;
}

type ActivePanel = 'editor' | 'terminal' | 'preview';

export function WorkspaceLayout({ workspace, projectId }: WorkspaceLayoutProps) {
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<ActivePanel>('editor');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  // File State
  const [openFiles, setOpenFiles] = useState<EditorFile[]>([]);
  const [activeFile, setActiveFile] = useState<EditorFile | null>(null);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // WebContainer
  const {
    isReady,
    isLoading,
    error,
    serverUrl,
    files,
    readFile,
    writeFile,
    deleteFile,
    createDirectory,
    renameFile,
    runCommand,
    startDevServer,
    stopDevServer,
    mountProject,
    refreshFiles,
  } = useWebContainer({
    onServerReady: (url, port) => {
      console.log(`Server ready at ${url}:${port}`);
    },
    onOutput: (output) => {
      setTerminalOutput(prev => [...prev, output]);
    },
    onError: (error) => {
      console.error('WebContainer error:', error);
    },
  });

  // Initialize project
  useEffect(() => {
    if (isReady && !projectId) {
      // Mount default project
      mountProject(defaultProjectFiles);
    }
  }, [isReady, projectId]);

  // Handle file selection
  const handleFileSelect = useCallback(async (node: FileNode) => {
    setSelectedPath(node.path);

    if (node.type === 'file') {
      // Check if already open
      const existing = openFiles.find(f => f.path === node.path);
      if (existing) {
        setActiveFile(existing);
        return;
      }

      // Read file content
      try {
        const content = await readFile(node.path);
        const newFile: EditorFile = {
          path: node.path,
          name: node.name,
          content,
          language: getLanguageFromPath(node.path),
        };
        setOpenFiles(prev => [...prev, newFile]);
        setActiveFile(newFile);
      } catch (error) {
        console.error('Failed to read file:', error);
      }
    }
  }, [openFiles, readFile]);

  // Handle file save
  const handleFileSave = useCallback(async (file: EditorFile) => {
    try {
      await writeFile(file.path, file.content);
      
      // Update open files
      setOpenFiles(prev => prev.map(f => 
        f.path === file.path ? { ...f, isDirty: false } : f
      ));
    } catch (error) {
      console.error('Failed to save file:', error);
    }
  }, [writeFile]);

  // Handle file change
  const handleFileChange = useCallback((content: string) => {
    if (!activeFile) return;

    const updatedFile = { ...activeFile, content, isDirty: true };
    setActiveFile(updatedFile);
    setOpenFiles(prev => prev.map(f => 
      f.path === activeFile.path ? updatedFile : f
    ));
  }, [activeFile]);

  // Handle file close
  const handleFileClose = useCallback((path: string) => {
    setOpenFiles(prev => {
      const newFiles = prev.filter(f => f.path !== path);
      
      // If closing active file, switch to another
      if (activeFile?.path === path) {
        setActiveFile(newFiles.length > 0 ? newFiles[newFiles.length - 1] : null);
      }
      
      return newFiles;
    });
  }, [activeFile]);

  // Handle terminal command
  const handleTerminalCommand = useCallback(async (command: string): Promise<string> => {
    try {
      const output = await runCommand(command);
      return output;
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }, [runCommand]);

  // Handle file create
  const handleFileCreate = useCallback(async (path: string, type: 'file' | 'directory') => {
    const name = prompt(`Enter ${type} name:`);
    if (!name) return;

    const fullPath = path === '/' ? `/${name}` : `${path}/${name}`;

    try {
      if (type === 'directory') {
        await createDirectory(fullPath);
      } else {
        await writeFile(fullPath, '');
      }
      await refreshFiles();
    } catch (error) {
      console.error('Failed to create:', error);
    }
  }, [createDirectory, writeFile, refreshFiles]);

  // Handle file delete
  const handleFileDelete = useCallback(async (path: string) => {
    if (!confirm(`Delete ${path}?`)) return;

    try {
      await deleteFile(path);
      await refreshFiles();
      
      // Close if open
      handleFileClose(path);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  }, [deleteFile, refreshFiles, handleFileClose]);

  // Handle file rename
  const handleFileRename = useCallback(async (oldPath: string, newPath: string) => {
    try {
      await renameFile(oldPath, newPath);
      await refreshFiles();
      
      // Update open files
      setOpenFiles(prev => prev.map(f => 
        f.path === oldPath ? { ...f, path: newPath, name: newPath.split('/').pop() || '' } : f
      ));
    } catch (error) {
      console.error('Failed to rename:', error);
    }
  }, [renameFile, refreshFiles]);

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Top Bar */}
      <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-5 h-5 text-gray-400" />
            ) : (
              <PanelLeft className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: workspace.color }}
            >
              <Code className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">{workspace.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* WebContainer Status */}
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg text-sm">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                <span className="text-yellow-400">Loading...</span>
              </>
            ) : error ? (
              <>
                <X className="w-4 h-4 text-red-400" />
                <span className="text-red-400">Error</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-green-400">Ready</span>
              </>
            )}
          </div>

          {/* Run Button */}
          <button
            onClick={startDevServer}
            disabled={!isReady || isLoading}
            className="flex items-center gap-2 px-4 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            Run
          </button>

          <button className="p-2 hover:bg-gray-800 rounded-lg">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 border-r border-gray-800 flex flex-col">
            <FileExplorer
              files={files}
              selectedPath={selectedPath || undefined}
              onSelect={handleFileSelect}
              onCreate={handleFileCreate}
              onDelete={handleFileDelete}
              onRename={handleFileRename}
              onRefresh={refreshFiles}
            />
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Panel Tabs */}
          <div className="h-10 bg-gray-900 border-b border-gray-800 flex items-center px-2">
            {([
              { id: 'editor' as const, label: 'Editor', icon: Code },
              { id: 'terminal' as const, label: 'Terminal', icon: TerminalIcon },
              { id: 'preview' as const, label: 'Preview', icon: Eye },
            ]).map((panel) => (
              <button
                key={panel.id}
                onClick={() => setActivePanel(panel.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  activePanel === panel.id
                    ? 'text-white bg-gray-800 rounded-t-lg'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <panel.icon className="w-4 h-4" />
                {panel.label}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {activePanel === 'editor' && (
              <Editor
                file={activeFile}
                files={openFiles}
                onSave={handleFileSave}
                onChange={handleFileChange}
                onClose={handleFileClose}
                onFileSelect={(path) => {
                  const file = openFiles.find(f => f.path === path);
                  if (file) setActiveFile(file);
                }}
              />
            )}

            {activePanel === 'terminal' && (
              <Terminal
                onCommand={handleTerminalCommand}
                workingDirectory="~/project"
              />
            )}

            {activePanel === 'preview' && (
              <Preview
                url={serverUrl || undefined}
                port={3000}
              />
            )}
          </div>
        </main>

        {/* Chat Panel */}
        {chatOpen && <Chat />}

        {/* Chat Toggle */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="fixed right-4 bottom-4 p-4 bg-purple-500 hover:bg-purple-600 rounded-full shadow-lg z-50"
          >
            <MessageSquare className="w-6 h-6 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}

// Helper function
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'json': 'json',
    'html': 'html',
    'css': 'css',
    'md': 'markdown',
  };
  return langMap[ext || ''] || 'plaintext';
}

export default WorkspaceLayout;
