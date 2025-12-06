'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  Save, Copy, Undo, Redo, Search, Settings, 
  Code, FileText, Maximize2, Minimize2, X,
  ChevronDown, Check, Loader2
} from 'lucide-react';

// Dynamic import Monaco Editor
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { 
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-900">
      <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
    </div>
  ),
});

export interface EditorFile {
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty?: boolean;
}

interface EditorProps {
  file: EditorFile | null;
  files?: EditorFile[];
  onSave?: (file: EditorFile) => void;
  onChange?: (content: string) => void;
  onClose?: (path: string) => void;
  onFileSelect?: (path: string) => void;
  readOnly?: boolean;
  theme?: 'vs-dark' | 'light';
}

// Language detection from file extension
const getLanguage = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'ps1': 'powershell',
    'dockerfile': 'dockerfile',
    'graphql': 'graphql',
    'prisma': 'prisma',
  };
  return langMap[ext || ''] || 'plaintext';
};

export function Editor({
  file,
  files = [],
  onSave,
  onChange,
  onClose,
  onFileSelect,
  readOnly = false,
  theme = 'vs-dark',
}: EditorProps) {
  const editorRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S = Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Ctrl/Cmd + F = Search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        editorRef.current?.getAction('actions.find')?.run();
      }
      // Escape = Exit fullscreen
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, isFullscreen]);

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configure editor
    editor.updateOptions({
      minimap: { enabled: true },
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontLigatures: true,
      lineNumbers: 'on',
      wordWrap: 'on',
      tabSize: 2,
      insertSpaces: true,
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
    });

    // Custom theme adjustments
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0d0d0f',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#4b5563',
        'editorLineNumber.activeForeground': '#9ca3af',
        'editor.selectionBackground': '#3b82f680',
        'editor.lineHighlightBackground': '#1f293780',
      },
    });
    monaco.editor.setTheme('custom-dark');
  };

  const handleSave = async () => {
    if (!file || readOnly || isSaving) return;
    
    setIsSaving(true);
    try {
      const content = editorRef.current?.getValue() || '';
      await onSave?.({ ...file, content });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    const content = editorRef.current?.getValue() || '';
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUndo = () => {
    editorRef.current?.trigger('keyboard', 'undo', null);
  };

  const handleRedo = () => {
    editorRef.current?.trigger('keyboard', 'redo', null);
  };

  const handleFormat = () => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
  };

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-950 text-gray-500">
        <Code className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">No file open</p>
        <p className="text-sm mt-1">Select a file from the explorer to start editing</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gray-950 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Tabs */}
      {files.length > 0 && (
        <div className="flex items-center bg-gray-900 border-b border-gray-800 overflow-x-auto">
          {files.map((f) => (
            <div
              key={f.path}
              onClick={() => onFileSelect?.(f.path)}
              className={`
                flex items-center gap-2 px-4 py-2 border-r border-gray-800 cursor-pointer
                ${f.path === file.path 
                  ? 'bg-gray-950 text-white' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                }
              `}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">{f.name}</span>
              {f.isDirty && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
              {onClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(f.path);
                  }}
                  className="p-0.5 hover:bg-gray-700 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            disabled={readOnly || isSaving}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            title="Save (Ctrl+S)"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleUndo}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-700 mx-2" />
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Copy all"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleFormat}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Format document"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded-lg text-sm">
            <span className="text-gray-400">{file.language || getLanguage(file.name)}</span>
          </div>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          height="100%"
          language={file.language || getLanguage(file.name)}
          value={file.content}
          theme="vs-dark"
          onChange={(value) => onChange?.(value || '')}
          onMount={handleEditorMount}
          options={{
            readOnly,
            minimap: { enabled: !isFullscreen },
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-gray-900 border-t border-gray-800 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>{file.path}</span>
          {file.isDirty && <span className="text-blue-400">Modified</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>LF</span>
          <span>{file.language || getLanguage(file.name)}</span>
        </div>
      </div>
    </div>
  );
}

export default Editor;
