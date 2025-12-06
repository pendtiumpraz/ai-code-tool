'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  PanelLeftClose, PanelLeft, MessageSquare, Code,
  Terminal as TerminalIcon, Eye, Files, Settings,
  Play, Save, Download, Upload, Plus, Search,
  ChevronDown, MoreHorizontal, Sparkles, X, RefreshCw, Clock
} from 'lucide-react';

// Dynamic imports for heavy components
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const Chat = dynamic(() => import('@/components/chat/Chat').then(m => m.Chat), { ssr: false });
const ChatSessionSidebar = dynamic(() => import('@/components/chat/ChatSessionSidebar').then(m => m.ChatSessionSidebar), { ssr: false });

// Security components
import { PreEngagementForm } from '@/components/security/PreEngagementForm';
import { CVSSCalculator } from '@/components/security/CVSSCalculator';
import { SocialEngineeringSimulator } from '@/components/security/SocialEngineeringSimulator';
import { SecurityToolsPanel } from '@/components/security/SecurityToolsPanel';
import { ScannerPanel } from '@/components/security/ScannerPanel';

// Workspace sidebar
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';

import { workspaces } from '@/config/workspaces';
import { useChatStore } from '@/stores/chatStore';
import { useFileStore } from '@/stores/fileStore';

export default function WorkspacePage() {
  const params = useParams();
  const category = params.category as string;
  
  const [navSidebarOpen, setNavSidebarOpen] = useState(true);
  const [fileSidebarOpen, setFileSidebarOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Legacy - for file explorer toggle
  const [chatOpen, setChatOpen] = useState(true);
  const [chatHistoryOpen, setChatHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal' | 'preview' | 'security'>('editor');
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard');
  const [showEngagementForm, setShowEngagementForm] = useState(false);
  const [securityTool, setSecurityTool] = useState<'scanner' | 'cvss' | 'social-eng' | null>(null);
  const [activeSecurityTool, setActiveSecurityTool] = useState<string | null>(null);
  const [scanConfig, setScanConfig] = useState<{
    targetUrl: string;
    scanType: 'web' | 'api' | 'network';
    targetType?: string;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['$ Ready for commands...']);
  const [terminalInput, setTerminalInput] = useState('');
  const previewRef = useRef<HTMLIFrameElement>(null);

  const setWorkspace = useChatStore((state) => state.setWorkspace);
  
  // File store
  const { 
    files, 
    activeFile, 
    openFiles,
    addFile, 
    updateFile, 
    deleteFile,
    setActiveFile,
    openFile,
    closeFile,
    getFileContent,
    getFileByPath,
  } = useFileStore();
  
  const workspace = workspaces[category] || workspaces['software-dev'];
  const isCybersecurity = category === 'cybersecurity';

  // Initialize workspace
  useEffect(() => {
    // Set current workspace for chat
    setWorkspace(category);
    // Load workspace-specific settings
    document.title = `${workspace.name} - AI Code Studio`;
  }, [category, workspace, setWorkspace]);

  const handleEngagementSubmit = (data: any) => {
    console.log('Engagement data:', data);
    setShowEngagementForm(false);
    // Start security scan with authorization
    setScanConfig({
      targetUrl: data.targetUrl,
      scanType: data.targetType === 'api' ? 'api' : data.targetType === 'network' ? 'network' : 'web',
      targetType: data.targetType,
    });
    setActiveTab('security');
  };

  // Terminal command handler
  const handleTerminalCommand = (cmd: string) => {
    setTerminalOutput(prev => [...prev, `$ ${cmd}`]);
    
    const commands: Record<string, () => string> = {
      'ls': () => files.map(f => f.name).join('  ') || '(no files)',
      'pwd': () => '/project',
      'clear': () => { setTerminalOutput([]); return ''; },
      'help': () => 'Available: ls, pwd, clear, cat <file>, touch <file>, rm <file>',
      'date': () => new Date().toLocaleString(),
      'whoami': () => 'developer',
    };
    
    if (commands[cmd]) {
      const result = commands[cmd]();
      if (result) setTerminalOutput(prev => [...prev, result]);
    } else if (cmd.startsWith('cat ')) {
      const filename = cmd.slice(4).trim();
      const file = files.find(f => f.name === filename || f.path === `/${filename}`);
      if (file) {
        setTerminalOutput(prev => [...prev, file.content]);
      } else {
        setTerminalOutput(prev => [...prev, `cat: ${filename}: No such file`]);
      }
    } else if (cmd.startsWith('touch ')) {
      const filename = cmd.slice(6).trim();
      addFile({ name: filename, path: `/${filename}`, content: '', language: '' });
      setTerminalOutput(prev => [...prev, `Created ${filename}`]);
    } else if (cmd.startsWith('rm ')) {
      const filename = cmd.slice(3).trim();
      const file = files.find(f => f.name === filename);
      if (file) {
        deleteFile(file.path);
        setTerminalOutput(prev => [...prev, `Deleted ${filename}`]);
      } else {
        setTerminalOutput(prev => [...prev, `rm: ${filename}: No such file`]);
      }
    } else if (cmd.startsWith('echo ')) {
      setTerminalOutput(prev => [...prev, cmd.slice(5)]);
    } else {
      setTerminalOutput(prev => [...prev, `Command not found: ${cmd}. Type 'help' for available commands.`]);
    }
  };

  // Get HTML file for preview
  const getHtmlFile = () => files.find(f => f.name.endsWith('.html'));
  
  // Get CSS files
  const getCssFiles = () => files.filter(f => f.name.endsWith('.css'));
  
  // Get JS files
  const getJsFiles = () => files.filter(f => f.name.endsWith('.js'));

  // Generate preview HTML combining all files
  const generatePreviewHtml = () => {
    const htmlFile = getHtmlFile();
    const cssFiles = getCssFiles();
    const jsFiles = getJsFiles();
    
    if (!htmlFile) {
      return `<!DOCTYPE html>
<html><head><style>
  body { font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #1a1a2e; color: #888; }
</style></head>
<body><div style="text-align: center;">
  <h2>No HTML file to preview</h2>
  <p>Create an .html file to see the preview</p>
</div></body></html>`;
    }
    
    let html = htmlFile.content;
    
    // Inject CSS
    if (cssFiles.length > 0) {
      const cssContent = cssFiles.map(f => f.content).join('\n');
      if (html.includes('</head>')) {
        html = html.replace('</head>', `<style>\n${cssContent}\n</style>\n</head>`);
      } else {
        html = `<style>\n${cssContent}\n</style>\n${html}`;
      }
    }
    
    // Inject JS
    if (jsFiles.length > 0) {
      const jsContent = jsFiles.map(f => f.content).join('\n');
      if (html.includes('</body>')) {
        html = html.replace('</body>', `<script>\n${jsContent}\n</script>\n</body>`);
      } else {
        html = `${html}\n<script>\n${jsContent}\n</script>`;
      }
    }
    
    return html;
  };

  // Refresh preview
  const refreshPreview = () => {
    if (previewRef.current) {
      previewRef.current.srcdoc = generatePreviewHtml();
    }
  };

  return (
    <div className="h-screen bg-gray-950 flex flex-col">
      {/* Top Bar */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setNavSidebarOpen(!navSidebarOpen)}
              className={`p-2 hover:bg-gray-800 rounded-lg transition-colors ${navSidebarOpen ? 'bg-gray-800' : ''}`}
              title="Toggle Navigation"
            >
              {navSidebarOpen ? (
                <PanelLeftClose className="w-5 h-5 text-gray-400" />
              ) : (
                <PanelLeft className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => setFileSidebarOpen(!fileSidebarOpen)}
              className={`p-2 hover:bg-gray-800 rounded-lg transition-colors ${fileSidebarOpen ? 'bg-gray-800' : ''}`}
              title="Toggle File Explorer"
            >
              <Files className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: workspace.gradient || workspace.color }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">{workspace.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Workspace Menu */}
          <WorkspaceMenu workspace={workspace} onAction={(action) => {
            console.log('Menu action:', action);
            switch (action) {
              case 'new-file':
                const filename = prompt('Enter filename:', 'untitled.html');
                if (filename) {
                  addFile({ 
                    name: filename, 
                    path: `/${filename}`, 
                    content: getDefaultContent(filename),
                    language: '',
                  });
                }
                break;
              case 'new-folder':
                // TODO: Implement folder creation
                alert('Create new folder - coming soon');
                break;
              case 'save':
              case 'save-all':
                alert('File saved!');
                break;
              case 'settings':
                setShowSettings(true);
                break;
              case 'ai-settings':
                setShowAISettings(true);
                break;
              case 'toggle-sidebar':
                setSidebarOpen(!sidebarOpen);
                break;
              case 'toggle-terminal':
                setActiveTab('terminal');
                break;
              case 'toggle-preview':
                setActiveTab('preview');
                break;
              case 'run':
                alert('Run code - coming soon');
                break;
              case 'format':
                alert('Format code - coming soon');
                break;
              case 'lint':
                alert('Lint code - coming soon');
                break;
              case 'undo':
              case 'redo':
              case 'find':
                alert(`${action} - coming soon`);
                break;
              case 'theme':
                setShowSettings(true);
                break;
            }
          }} />
          
          <button 
            onClick={() => setShowAISettings(true)}
            className="p-2 hover:bg-gray-800 rounded-lg"
            title="AI Settings"
          >
            <Sparkles className="w-5 h-5 text-purple-400" />
          </button>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-800 rounded-lg"
            title="Workspace Settings"
          >
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar - Industry Specific */}
        <WorkspaceSidebar
          workspace={category}
          isOpen={navSidebarOpen}
          onToggle={() => setNavSidebarOpen(!navSidebarOpen)}
          onAction={(action) => {
            setActiveSidebarItem(action);
            // Handle navigation actions
            switch (action) {
              case 'editor':
                setActiveTab('editor');
                setActiveSecurityTool(null);
                break;
              case 'terminal':
                setActiveTab('terminal');
                setActiveSecurityTool(null);
                break;
              case 'preview':
                setActiveTab('preview');
                setActiveSecurityTool(null);
                break;
              case 'settings':
                setShowSettings(true);
                break;
              case 'web-scanner':
              case 'api-scanner':
              case 'network-scanner':
                setShowEngagementForm(true);
                break;
              case 'cvss-calculator':
                setSecurityTool('cvss');
                setActiveTab('security');
                setActiveSecurityTool(null);
                break;
              case 'phishing-sim':
              case 'awareness':
                setSecurityTool('social-eng');
                setActiveTab('security');
                setActiveSecurityTool(null);
                break;
              // Reconnaissance tools
              case 'subdomain-finder':
              case 'port-scanner':
              case 'whois-lookup':
              case 'dns-lookup':
              case 'ip-lookup':
              case 'shodan-search':
              // Vulnerability tools
              case 'cve-lookup':
              case 'virustotal-scan':
              // Security tools
              case 'hash-generator':
              case 'encoder-decoder':
              case 'password-generator':
              case 'jwt-decoder':
              case 'security-headers':
                setActiveSecurityTool(action);
                setActiveTab('security');
                setSecurityTool(null);
                break;
              // Reports (not implemented yet - show placeholder)
              case 'scan-history':
              case 'generate-report':
              case 'report-templates':
                setActiveSecurityTool(action);
                setActiveTab('security');
                setSecurityTool(null);
                break;
              default:
                console.log('Sidebar action:', action);
            }
          }}
          activeItem={activeSidebarItem}
        />

        {/* Sidebar - File Explorer */}
        {fileSidebarOpen && (
          <motion.aside
            initial={{ width: 0 }}
            animate={{ width: 260 }}
            exit={{ width: 0 }}
            className="bg-gray-900 border-r border-gray-800 flex flex-col"
          >
            <div className="p-3 border-b border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-400">Explorer</span>
                <div className="flex items-center gap-1">
                  <button 
                    className="p-1 hover:bg-gray-800 rounded"
                    onClick={() => {
                      const filename = prompt('Enter filename:', 'untitled.html');
                      if (filename) {
                        addFile({ 
                          name: filename, 
                          path: `/${filename}`, 
                          content: getDefaultContent(filename),
                          language: '',
                        });
                      }
                    }}
                    title="New File"
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-1 hover:bg-gray-800 rounded" title="Upload File">
                    <Upload className="w-4 h-4 text-gray-500" />
                  </button>
                  <button 
                    className="p-1 hover:bg-gray-800 rounded" 
                    onClick={() => setFileSidebarOpen(false)}
                    title="Close Explorer"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search files..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-y-auto p-2">
              <FileTree files={files} onSelect={setActiveFile} />
            </div>

            {/* Security Tools (Cybersecurity workspace) */}
            {isCybersecurity && (
              <div className="p-3 border-t border-gray-800">
                <div className="text-xs text-gray-500 mb-2">Security Tools</div>
                <div className="space-y-1">
                  <button
                    onClick={() => setShowEngagementForm(true)}
                    className="w-full px-3 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm text-left hover:bg-red-500/20"
                  >
                    🛡️ New Security Scan
                  </button>
                  <button
                    onClick={() => setSecurityTool('cvss')}
                    className="w-full px-3 py-2 bg-purple-500/10 text-purple-400 rounded-lg text-sm text-left hover:bg-purple-500/20"
                  >
                    🧮 CVSS Calculator
                  </button>
                  <button
                    onClick={() => setSecurityTool('social-eng')}
                    className="w-full px-3 py-2 bg-orange-500/10 text-orange-400 rounded-lg text-sm text-left hover:bg-orange-500/20"
                  >
                    🎭 Social Engineering Sim
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="h-10 bg-gray-900 border-b border-gray-800 flex items-center px-2">
            {[
              { id: 'editor', label: 'Editor', icon: Code },
              { id: 'terminal', label: 'Terminal', icon: TerminalIcon },
              { id: 'preview', label: 'Preview', icon: Eye },
              ...(isCybersecurity ? [{ id: 'security', label: 'Security', icon: Settings }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-white bg-gray-800 rounded-t-lg'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'editor' && (
              <div className="h-full flex flex-col">
                {/* File Tabs */}
                {openFiles.length > 0 && (
                  <div className="flex items-center bg-gray-900 border-b border-gray-800 overflow-x-auto">
                    {openFiles.map((path) => {
                      const file = getFileByPath(path);
                      return (
                        <div
                          key={path}
                          className={`flex items-center gap-2 px-3 py-2 text-sm border-r border-gray-800 cursor-pointer ${
                            activeFile === path ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'
                          }`}
                          onClick={() => setActiveFile(path)}
                        >
                          <Code className="w-3 h-3" />
                          <span>{file?.name || path}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); closeFile(path); }}
                            className="hover:bg-gray-700 rounded p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Editor */}
                <div className="flex-1">
                  {activeFile ? (
                    <MonacoEditor
                      height="100%"
                      language={getFileByPath(activeFile)?.language || 'plaintext'}
                      theme="vs-dark"
                      value={getFileContent(activeFile) || ''}
                      onChange={(value) => value && updateFile(activeFile, value)}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        automaticLayout: true,
                      }}
                    />
                  ) : (
                    <EmptyState 
                      title="No file open"
                      description="Create a new file from the menu or ask AI to create files for you"
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'terminal' && (
              <div className="h-full bg-black p-4 font-mono text-sm text-green-400 flex flex-col">
                <div className="flex-1 overflow-y-auto">
                  {terminalOutput.map((line, i) => (
                    <div key={i} className={line.startsWith('$') ? 'text-blue-400' : ''}>{line}</div>
                  ))}
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (terminalInput.trim()) {
                      handleTerminalCommand(terminalInput.trim());
                      setTerminalInput('');
                    }
                  }}
                  className="flex items-center mt-2 border-t border-gray-800 pt-2"
                >
                  <span className="text-blue-400">~/project $</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    className="flex-1 ml-2 bg-transparent outline-none text-green-400"
                    placeholder="Type command..."
                    autoFocus
                  />
                </form>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="h-full flex flex-col bg-gray-900">
                {/* Preview Toolbar */}
                <div className="flex items-center gap-2 p-2 border-b border-gray-800">
                  <button
                    onClick={refreshPreview}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                  <span className="text-sm text-gray-500">
                    {getHtmlFile() ? `Previewing: ${getHtmlFile()?.name}` : 'No HTML file to preview'}
                  </span>
                </div>
                
                {/* Preview iframe */}
                <div className="flex-1 bg-white">
                  <iframe
                    ref={previewRef}
                    srcDoc={generatePreviewHtml()}
                    className="w-full h-full border-0"
                    title="Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            )}

            {activeTab === 'security' && isCybersecurity && (
              <div className="h-full overflow-hidden">
                {/* Active Scanner */}
                {scanConfig && (
                  <ScannerPanel
                    config={scanConfig}
                    onClose={() => setScanConfig(null)}
                    onComplete={(result) => console.log('Scan complete:', result)}
                  />
                )}
                
                {/* Security Tools Panel */}
                {!scanConfig && activeSecurityTool && (
                  <SecurityToolsPanel 
                    tool={activeSecurityTool} 
                    onClose={() => {
                      setActiveSecurityTool(null);
                      setActiveSidebarItem('dashboard');
                    }} 
                  />
                )}
                
                {/* Legacy security tools */}
                {!scanConfig && !activeSecurityTool && securityTool === 'cvss' && (
                  <div className="h-full overflow-y-auto p-6">
                    <CVSSCalculator />
                  </div>
                )}
                {!scanConfig && !activeSecurityTool && securityTool === 'social-eng' && (
                  <div className="h-full overflow-y-auto p-6">
                    <SocialEngineeringSimulator />
                  </div>
                )}
                
                {/* Security tools grid */}
                {!scanConfig && !activeSecurityTool && !securityTool && (
                  <div className="h-full overflow-y-auto p-6">
                    <h2 className="text-lg font-semibold mb-4">Security Tools</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      <SecurityToolCard
                        title="Web Scanner"
                        description="Scan websites for vulnerabilities"
                        icon="🌐"
                        onClick={() => setShowEngagementForm(true)}
                      />
                      <SecurityToolCard
                        title="API Scanner"
                        description="Scan APIs for security issues"
                        icon="🔌"
                        onClick={() => setShowEngagementForm(true)}
                      />
                      <SecurityToolCard
                        title="Network Scanner"
                        description="Scan network infrastructure"
                        icon="🖧"
                        onClick={() => setShowEngagementForm(true)}
                      />
                      <SecurityToolCard
                        title="Subdomain Finder"
                        description="Find subdomains via DNS"
                        icon="🌐"
                        onClick={() => setActiveSecurityTool('subdomain-finder')}
                      />
                      <SecurityToolCard
                        title="Port Scanner"
                        description="Scan common ports"
                        icon="🔌"
                        onClick={() => setActiveSecurityTool('port-scanner')}
                      />
                      <SecurityToolCard
                        title="WHOIS Lookup"
                        description="Get domain registration info"
                        icon="📋"
                        onClick={() => setActiveSecurityTool('whois-lookup')}
                      />
                      <SecurityToolCard
                        title="DNS Lookup"
                        description="Query DNS records"
                        icon="🗂️"
                        onClick={() => setActiveSecurityTool('dns-lookup')}
                      />
                      <SecurityToolCard
                        title="Hash Generator"
                        description="Generate MD5, SHA hashes"
                        icon="#️⃣"
                        onClick={() => setActiveSecurityTool('hash-generator')}
                      />
                      <SecurityToolCard
                        title="Encoder/Decoder"
                        description="Base64, URL, HTML encoding"
                        icon="🔐"
                        onClick={() => setActiveSecurityTool('encoder-decoder')}
                      />
                      <SecurityToolCard
                        title="Password Generator"
                        description="Generate secure passwords"
                        icon="🔑"
                        onClick={() => setActiveSecurityTool('password-generator')}
                      />
                      <SecurityToolCard
                        title="CVSS Calculator"
                        description="Calculate vulnerability severity"
                        icon="🧮"
                        onClick={() => setSecurityTool('cvss')}
                      />
                      <SecurityToolCard
                        title="Social Engineering"
                        description="Phishing & awareness simulations"
                        icon="🎭"
                        onClick={() => setSecurityTool('social-eng')}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Chat Panel with History Sidebar */}
        {chatOpen && (
          <div className="flex h-full flex-shrink-0">
            <ChatSessionSidebar
              isOpen={chatHistoryOpen}
              onToggle={() => setChatHistoryOpen(!chatHistoryOpen)}
              workspace={category}
            />
            <div className="relative h-full">
              {/* History toggle button */}
              {!chatHistoryOpen && (
                <button
                  onClick={() => setChatHistoryOpen(true)}
                  className="absolute left-2 top-4 z-10 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Show chat history"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <Chat />
            </div>
          </div>
        )}

        {/* Toggle Chat Button */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="fixed right-4 bottom-4 p-4 bg-purple-500 hover:bg-purple-600 rounded-full shadow-lg"
          >
            <MessageSquare className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Pre-Engagement Form Modal */}
      {showEngagementForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <PreEngagementForm
            onSubmit={handleEngagementSubmit}
            onCancel={() => setShowEngagementForm(false)}
          />
        </div>
      )}

      {/* Workspace Settings Modal */}
      {showSettings && (
        <SettingsModal 
          workspace={workspace} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      {/* AI Settings Modal */}
      {showAISettings && (
        <AISettingsModal onClose={() => setShowAISettings(false)} />
      )}
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function WorkspaceMenu({ workspace, onAction }: { workspace: any; onAction: (action: string) => void }) {
  const [open, setOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const setInputValue = useChatStore((state) => state.setInputValue);

  const defaultMenu = [
    { id: 'file', label: 'File', submenu: [
      { id: 'new-file', label: '📄 New File' },
      { id: 'new-folder', label: '📁 New Folder' },
      { id: 'save', label: '💾 Save' },
      { id: 'save-all', label: '💾 Save All' },
    ]},
    { id: 'edit', label: 'Edit', submenu: [
      { id: 'undo', label: '↩️ Undo' },
      { id: 'redo', label: '↪️ Redo' },
      { id: 'find', label: '🔍 Find & Replace' },
    ]},
    { id: 'view', label: 'View', submenu: [
      { id: 'toggle-sidebar', label: '📂 Toggle Sidebar' },
      { id: 'toggle-terminal', label: '💻 Toggle Terminal' },
      { id: 'toggle-preview', label: '👁️ Toggle Preview' },
    ]},
    { id: 'tools', label: 'Tools', submenu: [
      { id: 'run', label: '▶️ Run Code' },
      { id: 'format', label: '✨ Format Code' },
      { id: 'lint', label: '🔧 Lint' },
    ]},
    { id: 'settings', label: 'Settings', submenu: [
      { id: 'settings', label: '⚙️ Workspace Settings' },
      { id: 'ai-settings', label: '🤖 AI Settings' },
      { id: 'theme', label: '🎨 Theme' },
    ]},
  ];

  const menuItems = workspace.menu?.length > 0 ? workspace.menu : defaultMenu;

  const handleMenuItemClick = (item: any) => {
    if (item.prompt) {
      // Insert prompt into chat input
      setInputValue(item.prompt);
      setOpen(false);
      setActiveSubmenu(null);
    } else if (item.submenu) {
      // Toggle submenu
      setActiveSubmenu(activeSubmenu === item.id ? null : item.id);
    } else {
      // Call action handler
      onAction(item.id);
      setOpen(false);
      setActiveSubmenu(null);
    }
  };

  const renderMenuItem = (item: any, depth: number = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isActive = activeSubmenu === item.id;
    
    return (
      <div key={item.id}>
        <button
          className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-700 transition-colors flex items-center justify-between ${
            depth > 0 ? 'pl-6' : ''
          }`}
          onClick={() => handleMenuItemClick(item)}
        >
          <span>{item.label}</span>
          {hasSubmenu && (
            <ChevronDown className={`w-3 h-3 transition-transform ${isActive ? 'rotate-180' : ''}`} />
          )}
        </button>
        {hasSubmenu && isActive && (
          <div className="bg-gray-900/50">
            {item.submenu.map((sub: any) => renderMenuItem(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          setActiveSubmenu(null);
        }}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
      >
        Menu
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setActiveSubmenu(null); }} />
          <div className="absolute right-0 top-full mt-1 w-72 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
            {menuItems.map((item: any) => (
              <div key={item.id} className="border-b border-gray-700 last:border-0">
                <div className="px-3 py-2 text-sm font-medium text-gray-400">
                  {item.label}
                </div>
                {item.submenu?.map((sub: any) => renderMenuItem(sub))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FileTree({ files, onSelect }: { files: any[]; onSelect: (path: string) => void }) {
  if (files.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-8">
        <Files className="w-8 h-8 mx-auto mb-2 opacity-50" />
        No files yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {files.map((file) => (
        <button
          key={file.path}
          onClick={() => onSelect(file.path)}
          className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-800 text-sm text-left"
        >
          <Code className="w-4 h-4 text-gray-500" />
          {file.name}
        </button>
      ))}
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <Code className="w-12 h-12 mx-auto mb-4 text-gray-700" />
        <h3 className="font-medium text-gray-400 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function SecurityToolCard({ 
  title, 
  description, 
  icon, 
  onClick 
}: { 
  title: string; 
  description: string; 
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-6 bg-gray-800 border border-gray-700 rounded-xl text-left hover:border-gray-600 transition-colors"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </button>
  );
}

function SettingsModal({ workspace, onClose }: { workspace: any; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('general');
  const [apiKeys, setApiKeys] = useState({ shodan: '', virusTotal: '' });
  const [apiKeyStatus, setApiKeyStatus] = useState<any>({ shodan: null, virusTotal: null });
  const [savingKeys, setSavingKeys] = useState(false);
  const [keyMessage, setKeyMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch current API key status on mount
  useEffect(() => {
    if (activeTab === 'api-keys') {
      fetch('/api/user/security-keys')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setApiKeyStatus(data.keys);
          }
        })
        .catch(console.error);
    }
  }, [activeTab]);

  const saveApiKeys = async () => {
    setSavingKeys(true);
    setKeyMessage(null);
    try {
      const res = await fetch('/api/user/security-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shodanKey: apiKeys.shodan || undefined,
          virusTotalKey: apiKeys.virusTotal || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setKeyMessage({ type: 'success', text: 'API keys saved successfully!' });
        setApiKeyStatus(data.keys);
        setApiKeys({ shodan: '', virusTotal: '' });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setKeyMessage({ type: 'error', text: err.message || 'Failed to save keys' });
    } finally {
      setSavingKeys(false);
    }
  };

  const deleteApiKey = async (keyType: 'shodan' | 'virusTotal') => {
    try {
      const res = await fetch(`/api/user/security-keys?key=${keyType}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setApiKeyStatus((prev: any) => ({ ...prev, [keyType]: { configured: false } }));
        setKeyMessage({ type: 'success', text: `${keyType} key removed` });
      }
    } catch (err: any) {
      setKeyMessage({ type: 'error', text: err.message });
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold">⚙️ Workspace Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            ✕
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-800 overflow-x-auto">
          {['general', 'api-keys', 'editor', 'terminal', 'appearance'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm capitalize ${
                activeTab === tab 
                  ? 'border-b-2 border-purple-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Workspace Name</label>
                <input 
                  type="text" 
                  defaultValue={workspace.name}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Default Language</label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                  <option>TypeScript</option>
                  <option>JavaScript</option>
                  <option>Python</option>
                  <option>Go</option>
                  <option>Rust</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span>Auto-save</span>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400">
                  Configure your API keys for security tools. Keys are encrypted and stored securely per user.
                </p>
              </div>

              {keyMessage && (
                <div className={`p-3 rounded-lg ${keyMessage.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {keyMessage.text}
                </div>
              )}

              {/* Shodan API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">Shodan API Key</label>
                  {apiKeyStatus.shodan?.configured && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      ✓ Configured: {apiKeyStatus.shodan.masked}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="password"
                    value={apiKeys.shodan}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, shodan: e.target.value }))}
                    placeholder={apiKeyStatus.shodan?.configured ? "Enter new key to update" : "Enter your Shodan API key"}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                  {apiKeyStatus.shodan?.configured && (
                    <button 
                      onClick={() => deleteApiKey('shodan')}
                      className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Get your API key at <a href="https://shodan.io" target="_blank" className="text-purple-400 hover:underline">shodan.io</a>
                </p>
              </div>

              {/* VirusTotal API Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium">VirusTotal API Key</label>
                  {apiKeyStatus.virusTotal?.configured && (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      ✓ Configured: {apiKeyStatus.virusTotal.masked}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="password"
                    value={apiKeys.virusTotal}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, virusTotal: e.target.value }))}
                    placeholder={apiKeyStatus.virusTotal?.configured ? "Enter new key to update" : "Enter your VirusTotal API key"}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                  {apiKeyStatus.virusTotal?.configured && (
                    <button 
                      onClick={() => deleteApiKey('virusTotal')}
                      className="px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Get your API key at <a href="https://www.virustotal.com/gui/join-us" target="_blank" className="text-purple-400 hover:underline">virustotal.com</a>
                </p>
              </div>

              {/* Save Button */}
              {(apiKeys.shodan || apiKeys.virusTotal) && (
                <button 
                  onClick={saveApiKeys}
                  disabled={savingKeys}
                  className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-lg font-medium"
                >
                  {savingKeys ? 'Saving...' : 'Save API Keys'}
                </button>
              )}

              {/* Free Tools Info */}
              <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <p className="text-sm text-blue-400 font-medium mb-2">Tools that work without API keys:</p>
                <p className="text-xs text-gray-400">
                  IP Lookup, CVE Lookup, DNS Lookup, WHOIS, Port Scanner, Security Headers, Hash Generator, Encoder/Decoder, JWT Decoder, Password Generator
                </p>
              </div>
            </div>
          )}
          
          {activeTab === 'editor' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Font Size</label>
                <input type="range" min="12" max="24" defaultValue="14" className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tab Size</label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                  <option>2 spaces</option>
                  <option>4 spaces</option>
                  <option>Tab</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span>Word Wrap</span>
                <input type="checkbox" defaultChecked className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <span>Minimap</span>
                <input type="checkbox" className="w-5 h-5" />
              </div>
            </div>
          )}
          
          {activeTab === 'terminal' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Default Shell</label>
                <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                  <option>bash</option>
                  <option>zsh</option>
                  <option>fish</option>
                  <option>powershell</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Font Size</label>
                <input type="range" min="10" max="20" defaultValue="14" className="w-full" />
              </div>
            </div>
          )}
          
          {activeTab === 'appearance' && (
            <AppearanceSettings />
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
            Cancel
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

function AISettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold">🤖 AI Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">AI Model</label>
            <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
              <option>Gemini 2.0 Flash (Recommended)</option>
              <option>Gemini 2.0 Flash Exp (Code Execution)</option>
              <option>Gemini 2.0 Flash Lite (Fast)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Exp = Full tools + Python execution, Flash = Tools only, Lite = Simple chat
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Response Style</label>
            <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
              <option>Balanced</option>
              <option>Concise</option>
              <option>Detailed</option>
              <option>Creative</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Temperature</label>
            <input type="range" min="0" max="100" defaultValue="70" className="w-full" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="block">Enable Tool Calling</span>
              <span className="text-xs text-gray-500">Allow AI to execute tools</span>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="block">Show Thinking Process</span>
              <span className="text-xs text-gray-500">Display AI reasoning</span>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="block">Code Execution</span>
              <span className="text-xs text-gray-500">Run Python in sandbox</span>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5" />
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">
            Cancel
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPER: Default file content
// ============================================

function getDefaultContent(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const templates: Record<string, string> = {
    'html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`,
    'css': `/* Styles */
body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 20px;
}`,
    'js': `// JavaScript
console.log('Hello World');`,
    'ts': `// TypeScript
const greeting: string = 'Hello World';
console.log(greeting);`,
    'json': `{
  "name": "project",
  "version": "1.0.0"
}`,
    'py': `# Python
print("Hello World")`,
    'md': `# Title

Content here...`,
  };
  
  return templates[ext] || '';
}

// Appearance Settings Component with localStorage persistence
function AppearanceSettings() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app-theme') || 'dark';
    }
    return 'dark';
  });
  
  const [accentColor, setAccentColor] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('app-accent') || '#8B5CF6';
    }
    return '#8B5CF6';
  });
  
  const [saved, setSaved] = useState(false);

  const themes = [
    { id: 'dark', name: 'Dark (Default)' },
    { id: 'light', name: 'Light' },
    { id: 'dracula', name: 'Dracula' },
    { id: 'monokai', name: 'Monokai' },
    { id: 'nord', name: 'Nord' },
  ];

  const accentColors = [
    { color: '#8B5CF6', name: 'Purple' },
    { color: '#3B82F6', name: 'Blue' },
    { color: '#10B981', name: 'Green' },
    { color: '#F59E0B', name: 'Yellow' },
    { color: '#EF4444', name: 'Red' },
    { color: '#EC4899', name: 'Pink' },
  ];

  const applyTheme = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const applyAccent = (newColor: string) => {
    setAccentColor(newColor);
    localStorage.setItem('app-accent', newColor);
    document.documentElement.style.setProperty('--accent-color', newColor);
    // Also update CSS variables for different shades
    document.documentElement.style.setProperty('--accent-color-light', newColor + '33');
    document.documentElement.style.setProperty('--accent-color-dark', newColor + 'cc');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {saved && (
        <div className="p-3 bg-green-500/20 text-green-400 rounded-lg text-sm">
          ✓ Settings saved!
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-3">Theme</label>
        <div className="grid grid-cols-2 gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => applyTheme(t.id)}
              className={`px-4 py-3 rounded-lg border text-left transition-all ${
                theme === t.id 
                  ? 'border-purple-500 bg-purple-500/20 text-white' 
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-3">Accent Color</label>
        <div className="flex gap-3">
          {accentColors.map((c) => (
            <button
              key={c.color}
              onClick={() => applyAccent(c.color)}
              className={`w-10 h-10 rounded-full transition-all ${
                accentColor === c.color 
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' 
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c.color }}
              title={c.name}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Current: <span style={{ color: accentColor }}>{accentColor}</span>
        </p>
      </div>

      <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <p className="text-sm text-gray-400">
          Theme and accent color are saved locally and will persist across sessions.
        </p>
      </div>
    </div>
  );
}
