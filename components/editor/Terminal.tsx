'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Terminal as TerminalIcon, X, Plus, Maximize2, Minimize2,
  Trash2, Copy, Check, ChevronDown
} from 'lucide-react';

// Types for xterm
interface ITerminal {
  open: (element: HTMLElement) => void;
  write: (data: string) => void;
  writeln: (data: string) => void;
  clear: () => void;
  dispose: () => void;
  onData: (callback: (data: string) => void) => { dispose: () => void };
  onKey: (callback: (event: { key: string; domEvent: KeyboardEvent }) => void) => { dispose: () => void };
  focus: () => void;
  reset: () => void;
}

interface IFitAddon {
  fit: () => void;
  proposeDimensions: () => { cols: number; rows: number } | undefined;
}

interface TerminalSession {
  id: string;
  name: string;
  terminal?: ITerminal;
  history: string[];
  historyIndex: number;
}

interface TerminalProps {
  onCommand?: (command: string) => Promise<string>;
  initialCommands?: string[];
  workingDirectory?: string;
  className?: string;
}

export function Terminal({
  onCommand,
  initialCommands = [],
  workingDirectory = '~/project',
  className = '',
}: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sessions, setSessions] = useState<TerminalSession[]>([
    { id: '1', name: 'Terminal 1', history: [], historyIndex: -1 }
  ]);
  const [activeSession, setActiveSession] = useState('1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const terminalRef = useRef<ITerminal | null>(null);
  const fitAddonRef = useRef<IFitAddon | null>(null);
  const inputBufferRef = useRef('');

  // Initialize terminal
  useEffect(() => {
    let terminal: ITerminal | null = null;
    let fitAddon: IFitAddon | null = null;

    const initTerminal = async () => {
      if (!containerRef.current) return;

      try {
        // Dynamic import xterm
        const { Terminal } = await import('xterm');
        const { FitAddon } = await import('xterm-addon-fit');
        
        // Import CSS
        await import('xterm/css/xterm.css');

        terminal = new Terminal({
          cursorBlink: true,
          cursorStyle: 'bar',
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          theme: {
            background: '#0d0d0f',
            foreground: '#d4d4d4',
            cursor: '#a855f7',
            cursorAccent: '#0d0d0f',
            selectionBackground: '#3b82f680',
            black: '#1e1e1e',
            red: '#f87171',
            green: '#4ade80',
            yellow: '#facc15',
            blue: '#60a5fa',
            magenta: '#c084fc',
            cyan: '#22d3ee',
            white: '#e5e5e5',
            brightBlack: '#6b7280',
            brightRed: '#fca5a5',
            brightGreen: '#86efac',
            brightYellow: '#fde047',
            brightBlue: '#93c5fd',
            brightMagenta: '#d8b4fe',
            brightCyan: '#67e8f9',
            brightWhite: '#ffffff',
          },
          allowTransparency: true,
          scrollback: 10000,
        }) as ITerminal;

        fitAddon = new FitAddon() as IFitAddon;
        (terminal as any).loadAddon(fitAddon);

        terminal.open(containerRef.current);
        fitAddon.fit();

        terminalRef.current = terminal;
        fitAddonRef.current = fitAddon;

        // Welcome message
        terminal.writeln('\x1b[1;35m╔══════════════════════════════════════════╗\x1b[0m');
        terminal.writeln('\x1b[1;35m║\x1b[0m  \x1b[1;36mAI Code Studio Terminal\x1b[0m                 \x1b[1;35m║\x1b[0m');
        terminal.writeln('\x1b[1;35m║\x1b[0m  Type \x1b[33mhelp\x1b[0m for available commands         \x1b[1;35m║\x1b[0m');
        terminal.writeln('\x1b[1;35m╚══════════════════════════════════════════╝\x1b[0m');
        terminal.writeln('');

        writePrompt(terminal);

        // Handle input
        terminal.onData((data) => {
          handleInput(data);
        });

        // Run initial commands
        for (const cmd of initialCommands) {
          await executeCommand(cmd);
        }

      } catch (error) {
        console.error('Failed to initialize terminal:', error);
      }
    };

    initTerminal();

    // Handle resize
    const handleResize = () => {
      fitAddonRef.current?.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal?.dispose();
    };
  }, [activeSession]);

  const writePrompt = (term: ITerminal) => {
    term.write(`\x1b[32m${workingDirectory}\x1b[0m \x1b[34m$\x1b[0m `);
  };

  const handleInput = (data: string) => {
    const terminal = terminalRef.current;
    if (!terminal) return;

    const code = data.charCodeAt(0);

    // Enter key
    if (code === 13) {
      terminal.writeln('');
      const command = inputBufferRef.current.trim();
      inputBufferRef.current = '';
      
      if (command) {
        executeCommand(command);
      } else {
        writePrompt(terminal);
      }
      return;
    }

    // Backspace
    if (code === 127) {
      if (inputBufferRef.current.length > 0) {
        inputBufferRef.current = inputBufferRef.current.slice(0, -1);
        terminal.write('\b \b');
      }
      return;
    }

    // Ctrl+C
    if (code === 3) {
      terminal.writeln('^C');
      inputBufferRef.current = '';
      writePrompt(terminal);
      return;
    }

    // Ctrl+L (clear)
    if (code === 12) {
      terminal.clear();
      writePrompt(terminal);
      return;
    }

    // Arrow keys (history navigation)
    if (data === '\x1b[A') { // Up
      navigateHistory(-1);
      return;
    }
    if (data === '\x1b[B') { // Down
      navigateHistory(1);
      return;
    }

    // Regular character
    if (code >= 32) {
      inputBufferRef.current += data;
      terminal.write(data);
    }
  };

  const navigateHistory = (direction: number) => {
    const session = sessions.find(s => s.id === activeSession);
    if (!session || session.history.length === 0) return;

    const terminal = terminalRef.current;
    if (!terminal) return;

    let newIndex = session.historyIndex + direction;
    newIndex = Math.max(-1, Math.min(newIndex, session.history.length - 1));

    // Clear current input
    const clearLen = inputBufferRef.current.length;
    terminal.write('\b \b'.repeat(clearLen));

    if (newIndex === -1) {
      inputBufferRef.current = '';
    } else {
      const historyCommand = session.history[session.history.length - 1 - newIndex];
      inputBufferRef.current = historyCommand;
      terminal.write(historyCommand);
    }

    setSessions(prev => prev.map(s => 
      s.id === activeSession ? { ...s, historyIndex: newIndex } : s
    ));
  };

  const executeCommand = async (command: string) => {
    const terminal = terminalRef.current;
    if (!terminal) return;

    // Add to history
    setSessions(prev => prev.map(s => 
      s.id === activeSession 
        ? { ...s, history: [...s.history, command], historyIndex: -1 }
        : s
    ));

    // Built-in commands
    const builtinResult = handleBuiltinCommand(command);
    if (builtinResult !== null) {
      if (builtinResult) {
        terminal.writeln(builtinResult);
      }
      writePrompt(terminal);
      return;
    }

    // External command
    if (onCommand) {
      setIsLoading(true);
      try {
        const output = await onCommand(command);
        if (output) {
          terminal.writeln(output);
        }
      } catch (error: any) {
        terminal.writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Simulate command execution
      terminal.writeln(simulateCommand(command));
    }

    writePrompt(terminal);
  };

  const handleBuiltinCommand = (command: string): string | null => {
    const [cmd, ...args] = command.split(' ');
    const terminal = terminalRef.current;

    switch (cmd.toLowerCase()) {
      case 'clear':
      case 'cls':
        terminal?.clear();
        return '';

      case 'help':
        return `
\x1b[1;36mAvailable Commands:\x1b[0m

  \x1b[33mclear\x1b[0m          Clear the terminal
  \x1b[33mhelp\x1b[0m           Show this help message
  \x1b[33mhistory\x1b[0m        Show command history
  \x1b[33mecho\x1b[0m <text>    Print text
  \x1b[33mpwd\x1b[0m            Print working directory
  \x1b[33mls\x1b[0m             List files
  \x1b[33mcat\x1b[0m <file>     Show file contents
  \x1b[33mnode\x1b[0m           Run Node.js
  \x1b[33mnpm\x1b[0m            Node package manager
  \x1b[33mpython\x1b[0m         Run Python

\x1b[90mPress Ctrl+C to cancel, Ctrl+L to clear\x1b[0m
`;

      case 'history':
        const session = sessions.find(s => s.id === activeSession);
        return session?.history.map((h, i) => `  ${i + 1}  ${h}`).join('\n') || '';

      case 'echo':
        return args.join(' ');

      case 'pwd':
        return workingDirectory;

      default:
        return null;
    }
  };

  const simulateCommand = (command: string): string => {
    const [cmd, ...args] = command.split(' ');

    switch (cmd.toLowerCase()) {
      case 'ls':
        return `\x1b[34mnode_modules\x1b[0m  \x1b[34msrc\x1b[0m  package.json  tsconfig.json  README.md`;

      case 'node':
        return `Node.js v20.10.0`;

      case 'npm':
        if (args[0] === '-v' || args[0] === '--version') {
          return '10.2.3';
        }
        return `npm <command>

Usage: npm <command>

Commands: install, run, test, build, start`;

      case 'python':
      case 'python3':
        return `Python 3.11.0`;

      case 'git':
        if (args[0] === 'status') {
          return `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean`;
        }
        return `git version 2.42.0`;

      default:
        return `\x1b[33mCommand simulated:\x1b[0m ${command}`;
    }
  };

  const addSession = () => {
    const newId = String(sessions.length + 1);
    setSessions(prev => [...prev, {
      id: newId,
      name: `Terminal ${newId}`,
      history: [],
      historyIndex: -1,
    }]);
    setActiveSession(newId);
  };

  const removeSession = (id: string) => {
    if (sessions.length === 1) return;
    
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    
    if (activeSession === id) {
      setActiveSession(newSessions[0].id);
    }
  };

  const handleCopy = () => {
    // Get terminal selection or full content
    const selection = window.getSelection()?.toString() || '';
    if (selection) {
      navigator.clipboard.writeText(selection);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#0d0d0f] ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-gray-900 border-b border-gray-800">
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {sessions.map(session => (
            <div
              key={session.id}
              onClick={() => setActiveSession(session.id)}
              className={`
                flex items-center gap-2 px-3 py-1 rounded-t cursor-pointer text-sm
                ${session.id === activeSession 
                  ? 'bg-[#0d0d0f] text-white' 
                  : 'text-gray-500 hover:text-gray-300'
                }
              `}
            >
              <TerminalIcon className="w-3 h-3" />
              <span>{session.name}</span>
              {sessions.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSession(session.id);
                  }}
                  className="p-0.5 hover:bg-gray-700 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addSession}
            className="p-1 hover:bg-gray-800 rounded"
            title="New terminal"
          >
            <Plus className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-gray-800 rounded"
            title="Copy selection"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-500" />}
          </button>
          <button
            onClick={() => terminalRef.current?.clear()}
            className="p-1.5 hover:bg-gray-800 rounded"
            title="Clear terminal"
          >
            <Trash2 className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-gray-800 rounded"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen 
              ? <Minimize2 className="w-4 h-4 text-gray-500" />
              : <Maximize2 className="w-4 h-4 text-gray-500" />
            }
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div 
        ref={containerRef} 
        className="flex-1 p-2"
        onClick={() => terminalRef.current?.focus()}
      />

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-gray-900 border-t border-gray-800 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="text-yellow-500">Running...</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>bash</span>
          <span>{workingDirectory}</span>
        </div>
      </div>
    </div>
  );
}

export default Terminal;
