import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { AIStatus } from '@/components/chat/AIStatusIndicator';

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
      
      // Get system prompt for current workspace
      const systemPrompt = workspaceChats[currentWorkspace]?.systemPrompt || WORKSPACE_PROMPTS[currentWorkspace] || WORKSPACE_PROMPTS['software-dev'];
      
      // Build messages with system prompt
      const chatMessages = [
        { role: 'system', content: systemPrompt },
        ...get().messages.slice(0, -1).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ];
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          workspace: currentWorkspace,
          stream: true,
          enableThinking: true,
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
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            
            // Handle thinking content
            if (parsed.thinking) {
              setAIStatus('thinking');
              currentThinking += parsed.thinking;
              setThinking(currentThinking);
            }
            
            // Handle tool calls
            if (parsed.tool_calls) {
              setAIStatus('tool_calling');
              for (const tc of parsed.tool_calls) {
                const toolCall: ToolCall = {
                  id: tc.id || nanoid(),
                  name: tc.function?.name || tc.name,
                  arguments: tc.function?.arguments 
                    ? JSON.parse(tc.function.arguments) 
                    : tc.arguments,
                  status: 'running',
                };
                currentToolCalls.push(toolCall);
                setCurrentToolCall(toolCall);
                
                // Execute tool (simulated)
                await executeToolCall(toolCall, (result) => {
                  toolCall.status = 'success';
                  toolCall.result = result;
                  setCurrentToolCall(null);
                });
              }
            }
            
            // Handle content
            if (parsed.choices?.[0]?.delta?.content) {
              setAIStatus('generating');
              const content = parsed.choices[0].delta.content;
              currentContent += content;
              appendToMessage(assistantId, content);
            }
            
            // Handle status updates
            if (parsed.status) {
              setAIStatus(parsed.status);
            }
            
          } catch (e) {
            console.warn('Failed to parse SSE data:', e);
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
// TOOL EXECUTION (Simulated)
// ============================================

async function executeToolCall(
  toolCall: ToolCall,
  onComplete: (result: any) => void
): Promise<void> {
  // Simulate tool execution
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const mockResults: Record<string, any> = {
    search_web: { results: ['Result 1', 'Result 2', 'Result 3'] },
    create_file: { success: true, path: toolCall.arguments.path },
    run_command: { output: 'Command executed successfully', exitCode: 0 },
    generate_image: { url: 'https://example.com/image.png' },
  };
  
  onComplete(mockResults[toolCall.name] || { success: true });
}
