'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// WebContainer types
interface WebContainerProcess {
  exit: Promise<number>;
  kill: () => void;
  output: ReadableStream<string>;
  input: WritableStream<string>;
}

interface WebContainerFS {
  readFile: (path: string, encoding?: string) => Promise<string | Uint8Array>;
  writeFile: (path: string, data: string | Uint8Array) => Promise<void>;
  readdir: (path: string) => Promise<string[]>;
  mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
  rm: (path: string, options?: { recursive?: boolean; force?: boolean }) => Promise<void>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
}

interface WebContainerInstance {
  mount: (tree: Record<string, any>) => Promise<void>;
  spawn: (command: string, args?: string[], options?: any) => Promise<WebContainerProcess>;
  fs: WebContainerFS;
  on: (event: string, callback: (...args: any[]) => void) => void;
  teardown: () => void;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
}

interface UseWebContainerOptions {
  onServerReady?: (url: string, port: number) => void;
  onOutput?: (output: string) => void;
  onError?: (error: string) => void;
}

interface UseWebContainerReturn {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  serverUrl: string | null;
  files: FileNode[];
  
  // File operations
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  createDirectory: (path: string) => Promise<void>;
  renameFile: (oldPath: string, newPath: string) => Promise<void>;
  
  // Process operations
  runCommand: (command: string) => Promise<string>;
  startDevServer: () => Promise<void>;
  stopDevServer: () => void;
  
  // Project operations
  mountProject: (files: Record<string, any>) => Promise<void>;
  refreshFiles: () => Promise<void>;
}

export function useWebContainer(options: UseWebContainerOptions = {}): UseWebContainerReturn {
  const { onServerReady, onOutput, onError } = options;
  
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);
  
  const containerRef = useRef<WebContainerInstance | null>(null);
  const devServerRef = useRef<WebContainerProcess | null>(null);
  const outputBufferRef = useRef<string>('');

  // Initialize WebContainer
  useEffect(() => {
    let mounted = true;

    const initContainer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Dynamic import WebContainer API
        const { WebContainer } = await import('@webcontainer/api');
        
        // Boot the container
        const container = await WebContainer.boot();
        
        if (!mounted) {
          container.teardown();
          return;
        }

        containerRef.current = container as unknown as WebContainerInstance;

        // Listen for server-ready event
        container.on('server-ready', (port: number, url: string) => {
          setServerUrl(url);
          onServerReady?.(url, port);
        });

        // Note: WebContainer doesn't have an 'error' event, errors are handled via promises

        setIsReady(true);
        setIsLoading(false);

      } catch (err: any) {
        if (!mounted) return;
        
        const errorMsg = err.message || 'Failed to initialize WebContainer';
        setError(errorMsg);
        setIsLoading(false);
        onError?.(errorMsg);
        
        console.error('WebContainer initialization error:', err);
      }
    };

    initContainer();

    return () => {
      mounted = false;
      devServerRef.current?.kill();
      containerRef.current?.teardown();
    };
  }, []);

  // Read file
  const readFile = useCallback(async (path: string): Promise<string> => {
    if (!containerRef.current) throw new Error('WebContainer not ready');
    
    const content = await containerRef.current.fs.readFile(path, 'utf-8');
    return content as string;
  }, []);

  // Write file
  const writeFile = useCallback(async (path: string, content: string): Promise<void> => {
    if (!containerRef.current) throw new Error('WebContainer not ready');
    
    // Ensure directory exists
    const dir = path.split('/').slice(0, -1).join('/');
    if (dir) {
      try {
        await containerRef.current.fs.mkdir(dir, { recursive: true });
      } catch (e) {
        // Directory might already exist
      }
    }
    
    await containerRef.current.fs.writeFile(path, content);
  }, []);

  // Delete file
  const deleteFile = useCallback(async (path: string): Promise<void> => {
    if (!containerRef.current) throw new Error('WebContainer not ready');
    
    await containerRef.current.fs.rm(path, { recursive: true, force: true });
  }, []);

  // Create directory
  const createDirectory = useCallback(async (path: string): Promise<void> => {
    if (!containerRef.current) throw new Error('WebContainer not ready');
    
    await containerRef.current.fs.mkdir(path, { recursive: true });
  }, []);

  // Rename file
  const renameFile = useCallback(async (oldPath: string, newPath: string): Promise<void> => {
    if (!containerRef.current) throw new Error('WebContainer not ready');
    
    await containerRef.current.fs.rename(oldPath, newPath);
  }, []);

  // Run command
  const runCommand = useCallback(async (command: string): Promise<string> => {
    if (!containerRef.current) throw new Error('WebContainer not ready');
    
    const [cmd, ...args] = command.split(' ');
    const process = await containerRef.current.spawn(cmd, args);
    
    let output = '';
    
    // Read output stream
    const reader = process.output.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        output += value;
        onOutput?.(value);
      }
    } finally {
      reader.releaseLock();
    }
    
    const exitCode = await process.exit;
    if (exitCode !== 0) {
      throw new Error(`Command failed with exit code ${exitCode}`);
    }
    
    return output;
  }, [onOutput]);

  // Start development server
  const startDevServer = useCallback(async (): Promise<void> => {
    if (!containerRef.current) throw new Error('WebContainer not ready');
    
    // Stop existing server
    devServerRef.current?.kill();
    
    // Install dependencies first
    onOutput?.('Installing dependencies...\n');
    const installProcess = await containerRef.current.spawn('npm', ['install']);
    
    const installReader = installProcess.output.getReader();
    try {
      while (true) {
        const { done, value } = await installReader.read();
        if (done) break;
        onOutput?.(value);
      }
    } finally {
      installReader.releaseLock();
    }
    
    const installExit = await installProcess.exit;
    if (installExit !== 0) {
      throw new Error('npm install failed');
    }
    
    // Start dev server
    onOutput?.('\nStarting development server...\n');
    const devProcess = await containerRef.current.spawn('npm', ['run', 'dev']);
    devServerRef.current = devProcess;
    
    // Stream output
    const devReader = devProcess.output.getReader();
    (async () => {
      try {
        while (true) {
          const { done, value } = await devReader.read();
          if (done) break;
          onOutput?.(value);
        }
      } finally {
        devReader.releaseLock();
      }
    })();
    
  }, [onOutput]);

  // Stop development server
  const stopDevServer = useCallback((): void => {
    devServerRef.current?.kill();
    devServerRef.current = null;
    setServerUrl(null);
  }, []);

  // Mount project files
  const mountProject = useCallback(async (fileTree: Record<string, any>): Promise<void> => {
    if (!containerRef.current) throw new Error('WebContainer not ready');
    
    await containerRef.current.mount(fileTree);
    await refreshFiles();
  }, []);

  // Refresh file list
  const refreshFiles = useCallback(async (): Promise<void> => {
    if (!containerRef.current) return;
    
    const buildTree = async (path: string): Promise<FileNode[]> => {
      try {
        const entries = await containerRef.current!.fs.readdir(path);
        const nodes: FileNode[] = [];
        
        for (const entry of entries) {
          if (entry.startsWith('.') || entry === 'node_modules') continue;
          
          const fullPath = path === '/' ? `/${entry}` : `${path}/${entry}`;
          
          try {
            const children = await buildTree(fullPath);
            nodes.push({
              name: entry,
              path: fullPath,
              type: 'directory',
              children,
            });
          } catch {
            // It's a file
            nodes.push({
              name: entry,
              path: fullPath,
              type: 'file',
            });
          }
        }
        
        return nodes;
      } catch {
        return [];
      }
    };
    
    const tree = await buildTree('/');
    setFiles(tree);
  }, []);

  return {
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
  };
}

// Default project template
export const defaultProjectFiles = {
  'package.json': {
    file: {
      contents: JSON.stringify({
        name: 'my-project',
        version: '1.0.0',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.0.0',
          typescript: '^5.0.0',
          vite: '^5.0.0',
        },
      }, null, 2),
    },
  },
  'vite.config.ts': {
    file: {
      contents: `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
    },
  },
  'index.html': {
    file: {
      contents: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Project</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`,
    },
  },
  src: {
    directory: {
      'main.tsx': {
        file: {
          contents: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
        },
      },
      'App.tsx': {
        file: {
          contents: `import React from 'react';

export default function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Hello World!</h1>
      <p>Edit src/App.tsx to get started.</p>
    </div>
  );
}
`,
        },
      },
    },
  },
};

export default useWebContainer;
