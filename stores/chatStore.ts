import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { AIStatus } from '@/components/chat/AIStatusIndicator';
import { useFileStore } from './fileStore';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
  status: 'sending' | 'streaming' | 'complete' | 'error';
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
  duration?: number;
}

interface WorkspaceChat {
  messages: Message[];
  systemPrompt?: string;
}

interface ChatState {
  // Per-workspace chats
  workspaceChats: Record<string, WorkspaceChat>;
  currentWorkspace: string;
  
  // Current workspace messages (computed)
  messages: Message[];
  isStreaming: boolean;
  aiStatus: AIStatus;
  currentThinking: string;
  currentToolCall: ToolCall | null;
  abortController: AbortController | null;
  
  // Actions
  setWorkspace: (workspace: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp' | 'status'>) => string;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  appendToMessage: (id: string, content: string) => void;
  setAIStatus: (status: AIStatus) => void;
  setThinking: (thinking: string) => void;
  appendThinking: (chunk: string) => void;
  setCurrentToolCall: (toolCall: ToolCall | null) => void;
  updateToolCall: (messageId: string, toolCallId: string, updates: Partial<ToolCall>) => void;
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
  clearChat: () => void;
}

// System prompts per workspace
const WORKSPACE_PROMPTS: Record<string, string> = {
  'cybersecurity': 'You are a cybersecurity expert AI assistant. Help with security scanning, vulnerability assessment, penetration testing guidance, and security best practices. Always emphasize ethical hacking and proper authorization.',
  'software-dev': 'You are an expert software developer AI. Help with coding, debugging, architecture, and best practices across multiple programming languages and frameworks.',
  'book-writing': 'You are a creative writing AI assistant. Help with story development, character creation, plot structure, editing, and publishing guidance.',
  'data-analysis': 'You are a data science AI assistant. Help with data analysis, visualization, machine learning, statistics, and insights generation.',
  'research': 'You are a research AI assistant. Help with literature review, research methodology, academic writing, and citation management.',
  'content-marketing': 'You are a content marketing AI assistant. Help with SEO, copywriting, social media strategy, and content planning.',
  'healthcare': 'You are a healthcare AI assistant. Help with medical research, clinical documentation, and healthcare workflows. Always recommend consulting healthcare professionals for medical decisions.',
  'legal': 'You are a legal AI assistant. Help with legal research, document drafting, and compliance. Always recommend consulting licensed attorneys for legal advice.',
};

export const useChatStore = create<ChatState>((set, get) => ({
  workspaceChats: {},
  currentWorkspace: 'software-dev',
  messages: [],
  isStreaming: false,
  aiStatus: 'idle',
  currentThinking: '',
  currentToolCall: null,
  abortController: null,
  
  setWorkspace: (workspace) => {
    const { workspaceChats } = get();
    // Initialize workspace chat if not exists
    if (!workspaceChats[workspace]) {
      set((state) => ({
        workspaceChats: {
          ...state.workspaceChats,
          [workspace]: { messages: [], systemPrompt: WORKSPACE_PROMPTS[workspace] }
        }
      }));
    }
    set({ 
      currentWorkspace: workspace,
      messages: workspaceChats[workspace]?.messages || [],
    });
  },

  addMessage: (message) => {
    const id = nanoid();
    const { currentWorkspace } = get();
    const newMessage: Message = {
      ...message,
      id,
      timestamp: new Date(),
      status: 'complete',
    };
    set((state) => {
      const workspaceMessages = state.workspaceChats[currentWorkspace]?.messages || [];
      const updatedMessages = [...workspaceMessages, newMessage];
      return {
        messages: updatedMessages,
        workspaceChats: {
          ...state.workspaceChats,
          [currentWorkspace]: {
            ...state.workspaceChats[currentWorkspace],
            messages: updatedMessages,
          }
        }
      };
    });
    return id;
  },
  
  updateMessage: (id, updates) => {
    const { currentWorkspace } = get();
    set((state) => {
      const updatedMessages = state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      );
      return {
        messages: updatedMessages,
        workspaceChats: {
          ...state.workspaceChats,
          [currentWorkspace]: {
            ...state.workspaceChats[currentWorkspace],
            messages: updatedMessages,
          }
        }
      };
    });
  },
  
  appendToMessage: (id, content) => {
    const { currentWorkspace } = get();
    set((state) => {
      const updatedMessages = state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + content } : m
      );
      return {
        messages: updatedMessages,
        workspaceChats: {
          ...state.workspaceChats,
          [currentWorkspace]: {
            ...state.workspaceChats[currentWorkspace],
            messages: updatedMessages,
          }
        }
      };
    });
  },
  
  setAIStatus: (status) => {
    set({ aiStatus: status });
  },
  
  setThinking: (thinking) => {
    set({ currentThinking: thinking });
  },
  
  appendThinking: (chunk) => {
    set((state) => ({
      currentThinking: state.currentThinking + chunk,
    }));
  },
  
  setCurrentToolCall: (toolCall) => {
    set({ currentToolCall: toolCall });
  },
  
  updateToolCall: (messageId, toolCallId, updates) => {
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id !== messageId) return m;
        return {
          ...m,
          toolCalls: m.toolCalls?.map((tc) =>
            tc.id === toolCallId ? { ...tc, ...updates } : tc
          ),
        };
      }),
    }));
  },
  
  sendMessage: async (content) => {
    const { addMessage, updateMessage, appendToMessage, setAIStatus, setThinking, appendThinking, setCurrentToolCall, currentWorkspace, workspaceChats } = get();
    
    // Add user message
    addMessage({
      role: 'user',
      content,
    });
    
    // Create assistant message placeholder
    const assistantId = addMessage({
      role: 'assistant',
      content: '',
    });
    
    updateMessage(assistantId, { status: 'streaming' });
    
    // Create abort controller
    const abortController = new AbortController();
    set({ isStreaming: true, abortController, currentThinking: '' });
    
    try {
      // Start thinking
      setAIStatus('thinking');
      
      // Build history (exclude the latest user message and empty assistant placeholder)
      const history = get().messages.slice(0, -2).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content, // Current user message
          history: history, // Previous conversation
          workspace: currentWorkspace,
          enableTools: true,
          enableCodeExecution: true,
        }),
        signal: abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let currentThinking = '';
      let currentContent = '';
      let currentToolCalls: ToolCall[] = [];
      
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));
        
        for (const line of lines) {
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            
            // Handle different message types from API
            switch (parsed.type) {
              case 'text':
                setAIStatus('generating');
                if (parsed.content) {
                  currentContent += parsed.content;
                  appendToMessage(assistantId, parsed.content);
                }
                break;
                
              case 'tool_call':
                setAIStatus('tool_calling');
                const toolCall: ToolCall = {
                  id: nanoid(),
                  name: parsed.tool,
                  arguments: parsed.args || {},
                  status: 'running',
                };
                currentToolCalls.push(toolCall);
                setCurrentToolCall(toolCall);
                
                // Handle create_file tool call directly (when args contain the file)
                if (parsed.tool === 'create_file' && parsed.args?.path && parsed.args?.content !== undefined) {
                  const { path, content } = parsed.args;
                  const filename = path.split('/').pop() || path;
                  useFileStore.getState().addFile({
                    name: filename,
                    path: path.startsWith('/') ? path : `/${path}`,
                    content: content,
                    language: '',
                  });
                  toolCall.status = 'success';
                  toolCall.result = { success: true, path, content };
                  // Add file created info to message
                  const fileCreatedText = `\n\n📄 **File created:** \`${path}\`\n`;
                  currentContent += fileCreatedText;
                  appendToMessage(assistantId, fileCreatedText);
                } else {
                  // Add tool call info to message
                  const toolCallText = `\n\n🔧 **Calling tool:** \`${parsed.tool}\`\n`;
                  currentContent += toolCallText;
                  appendToMessage(assistantId, toolCallText);
                }
                break;
                
              case 'tool_result':
                setAIStatus('generating');
                const tc = currentToolCalls.find(t => t.name === parsed.tool);
                if (tc) {
                  tc.status = 'success';
                  tc.result = parsed.result;
                }
                setCurrentToolCall(null);
                
                // Handle create_file tool - sync to fileStore
                if (parsed.tool === 'create_file' && parsed.result?.success) {
                  const { path, content } = parsed.result;
                  if (path && content !== undefined) {
                    const filename = path.split('/').pop() || path;
                    useFileStore.getState().addFile({
                      name: filename,
                      path: path.startsWith('/') ? path : `/${path}`,
                      content: content,
                      language: '',
                    });
                  }
                }
                
                // Add formatted tool result to message
                const resultText = formatToolResult(parsed.tool, parsed.result);
                currentContent += resultText;
                appendToMessage(assistantId, resultText);
                break;
                
              case 'code_execution':
                setAIStatus('executing');
                // Append code execution to message
                const codeBlock = `\n\`\`\`python\n${parsed.code}\n\`\`\`\n**Output:**\n\`\`\`\n${parsed.output}\n\`\`\`\n`;
                currentContent += codeBlock;
                appendToMessage(assistantId, codeBlock);
                break;
                
              case 'done':
                // Final response
                if (parsed.content && !currentContent) {
                  appendToMessage(assistantId, parsed.content);
                }
                break;
                
              case 'error':
                throw new Error(parsed.error || 'Unknown error');
            }
            
          } catch (e: any) {
            if (e.message !== 'Unknown error') {
              console.warn('Failed to parse SSE data:', e);
            }
          }
        }
      }
      
      // Update final message
      updateMessage(assistantId, {
        status: 'complete',
        thinking: currentThinking || undefined,
        toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
      });
      
      setAIStatus('completed');
      setTimeout(() => setAIStatus('idle'), 1000);
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        updateMessage(assistantId, { 
          status: 'complete',
          content: get().messages.find(m => m.id === assistantId)?.content || '[Generation stopped]',
        });
      } else {
        updateMessage(assistantId, { 
          status: 'error',
          content: `Error: ${error.message}`,
        });
        setAIStatus('error');
      }
    } finally {
      set({ 
        isStreaming: false, 
        abortController: null,
        currentThinking: '',
        currentToolCall: null,
      });
    }
  },
  
  stopGeneration: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ 
      isStreaming: false, 
      aiStatus: 'idle',
      currentThinking: '',
      currentToolCall: null,
    });
  },
  
  clearChat: () => {
    const { currentWorkspace } = get();
    set((state) => ({
      messages: [],
      currentThinking: '',
      currentToolCall: null,
      aiStatus: 'idle',
      workspaceChats: {
        ...state.workspaceChats,
        [currentWorkspace]: {
          ...state.workspaceChats[currentWorkspace],
          messages: [],
        }
      }
    }));
  },
}));

// ============================================
// HELPER: Format Tool Results
// ============================================

function formatToolResult(toolName: string, result: any): string {
  if (!result) return '\n*No result*\n';
  
  // Handle create_file result
  if (toolName === 'create_file') {
    if (result.success) {
      return `\n✅ **File created:** \`${result.path}\`\n`;
    } else {
      return `\n❌ **Failed to create file:** ${result.error || 'Unknown error'}\n`;
    }
  }
  
  if (toolName === 'security_scan') {
    const { summary, vulnerabilities, recommendations, techInfo, error } = result;
    
    if (error) {
      return `\n❌ **Scan Error:** ${error}\n`;
    }
    
    let output = '\n\n📊 **Security Scan Results:**\n\n';
    
    // Summary
    if (summary) {
      output += '### Summary\n';
      output += `| Severity | Count |\n|----------|-------|\n`;
      output += `| 🔴 Critical | ${summary.critical || 0} |\n`;
      output += `| 🟠 High | ${summary.high || 0} |\n`;
      output += `| 🟡 Medium | ${summary.medium || 0} |\n`;
      output += `| 🟢 Low | ${summary.low || 0} |\n`;
      output += `| ℹ️ Info | ${summary.info || 0} |\n\n`;
    }
    
    // Tech info
    if (techInfo) {
      output += '### Technology Detected\n';
      if (techInfo.server) output += `- **Server:** ${techInfo.server}\n`;
      if (techInfo.poweredBy) output += `- **Powered By:** ${techInfo.poweredBy}\n`;
      if (techInfo.cms?.length) output += `- **CMS:** ${techInfo.cms.join(', ')}\n`;
      if (techInfo.frameworks?.length) output += `- **Frameworks:** ${techInfo.frameworks.join(', ')}\n`;
      output += '\n';
    }
    
    // Vulnerabilities
    if (vulnerabilities?.length > 0) {
      output += '### Vulnerabilities Found\n\n';
      vulnerabilities.forEach((v: any, i: number) => {
        const icon = v.severity === 'critical' ? '🔴' : 
                     v.severity === 'high' ? '🟠' : 
                     v.severity === 'medium' ? '🟡' : 
                     v.severity === 'low' ? '🟢' : 'ℹ️';
        output += `${i + 1}. ${icon} **${v.title}** (${v.severity})\n`;
        output += `   - ${v.description}\n`;
        if (v.remediation) output += `   - *Fix:* ${v.remediation}\n`;
        output += '\n';
      });
    } else {
      output += '✅ **No vulnerabilities found!**\n\n';
    }
    
    // Recommendations
    if (recommendations?.length > 0) {
      output += '### Recommendations\n';
      recommendations.forEach((r: string, i: number) => {
        output += `${i + 1}. ${r}\n`;
      });
    }
    
    return output;
  }
  
  // Default: JSON format for other tools
  return `\n**Result:**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\`\n`;
}
