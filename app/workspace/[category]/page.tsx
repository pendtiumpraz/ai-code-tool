'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  PanelLeftClose, PanelLeft, MessageSquare, Code,
  Terminal as TerminalIcon, Eye, Files, Settings,
  Play, Save, Download, Upload, Plus, Search,
  ChevronDown, MoreHorizontal, Sparkles
} from 'lucide-react';

// Dynamic imports for heavy components
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
const Chat = dynamic(() => import('@/components/chat/Chat').then(m => m.Chat), { ssr: false });

// Security components
import { PreEngagementForm } from '@/components/security/PreEngagementForm';
import { CVSSCalculator } from '@/components/security/CVSSCalculator';
import { SocialEngineeringSimulator } from '@/components/security/SocialEngineeringSimulator';

import { workspaces } from '@/config/workspaces';
import { useChatStore } from '@/stores/chatStore';

export default function WorkspacePage() {
  const params = useParams();
  const category = params.category as string;
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatOpen, setChatOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal' | 'preview' | 'security'>('editor');
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [showEngagementForm, setShowEngagementForm] = useState(false);
  const [securityTool, setSecurityTool] = useState<'scanner' | 'cvss' | 'social-eng' | null>(null);

  const setWorkspace = useChatStore((state) => state.setWorkspace);
  
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
  };

  return (
    <div className="h-screen bg-gray-950 flex flex-col">
      {/* Top Bar */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
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
              style={{ background: workspace.gradient || workspace.color }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">{workspace.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Workspace Menu */}
          <WorkspaceMenu workspace={workspace} />
          
          <button className="p-2 hover:bg-gray-800 rounded-lg">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File Explorer */}
        {sidebarOpen && (
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
                  <button className="p-1 hover:bg-gray-800 rounded">
                    <Plus className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-1 hover:bg-gray-800 rounded">
                    <Upload className="w-4 h-4 text-gray-500" />
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
              <div className="h-full">
                {activeFile ? (
                  <MonacoEditor
                    height="100%"
                    language="typescript"
                    theme="vs-dark"
                    value="// Start coding..."
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      wordWrap: 'on',
                    }}
                  />
                ) : (
                  <EmptyState 
                    title="No file open"
                    description="Select a file from the explorer or create a new one"
                  />
                )}
              </div>
            )}

            {activeTab === 'terminal' && (
              <div className="h-full bg-black p-4 font-mono text-sm text-green-400">
                <div>$ Ready for commands...</div>
                <div className="flex items-center mt-2">
                  <span className="text-blue-400">~/project $</span>
                  <input
                    type="text"
                    className="flex-1 ml-2 bg-transparent outline-none"
                    placeholder="Type command..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="h-full bg-white">
                <iframe
                  src="about:blank"
                  className="w-full h-full border-0"
                  title="Preview"
                />
              </div>
            )}

            {activeTab === 'security' && isCybersecurity && (
              <div className="h-full overflow-y-auto p-6">
                {securityTool === 'cvss' && <CVSSCalculator />}
                {securityTool === 'social-eng' && <SocialEngineeringSimulator />}
                {!securityTool && (
                  <div className="grid grid-cols-3 gap-4">
                    <SecurityToolCard
                      title="Web Scanner"
                      description="Scan websites for vulnerabilities"
                      icon="🔍"
                      onClick={() => setShowEngagementForm(true)}
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
                )}
              </div>
            )}
          </div>
        </main>

        {/* Chat Panel */}
        {chatOpen && <Chat />}

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
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function WorkspaceMenu({ workspace }: { workspace: any }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
      >
        Menu
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          {workspace.menu?.slice(0, 5).map((item: any) => (
            <div key={item.id} className="border-b border-gray-700 last:border-0">
              <div className="px-3 py-2 text-sm font-medium text-gray-400">
                {item.label}
              </div>
              {item.submenu?.slice(0, 4).map((sub: any) => (
                <button
                  key={sub.id}
                  className="w-full px-4 py-2 text-sm text-left hover:bg-gray-700 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          ))}
        </div>
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
