import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export interface ChatSession {
  id: string;
  title: string;
  workspace: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatState {
  // Sessions
  sessions: ChatSession[];
  currentSessionId: string | null;
  currentWorkspace: string;
  
  // Current session data
  messages: Message[];
  isStreaming: boolean;
  aiStatus: AIStatus;
  currentThinking: string;
  currentToolCall: ToolCall | null;
  abortController: AbortController | null;
  
  // Loading states
  isLoadingSessions: boolean;
  isSaving: boolean;
  
  // Actions - Sessions
  loadSessions: (workspace?: string) => Promise<void>;
  createSession: (workspace?: string, title?: string) => Promise<string>;
  switchSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  saveCurrentSession: () => Promise<void>;
  
  // Actions - Messages
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

// Auto-generate title from first message
function generateTitle(messages: Message[]): string {
  const firstUserMsg = messages.find(m => m.role === 'user');
  if (firstUserMsg) {
    const content = firstUserMsg.content.substring(0, 50);
    return content.length < firstUserMsg.content.length ? content + '...' : content;
  }
  return `Chat ${new Date().toLocaleDateString()}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSessionId: null,
      currentWorkspace: 'software-dev',
      messages: [],
      isStreaming: false,
      aiStatus: 'idle',
      currentThinking: '',
      currentToolCall: null,
      abortController: null,
      isLoadingSessions: false,
      isSaving: false,
      
      // ============================================
      // SESSION MANAGEMENT
      // ============================================
      
      loadSessions: async (workspace) => {
        set({ isLoadingSessions: true });
        try {
          const params = new URLSearchParams();
          if (workspace) params.append('workspace', workspace);
          params.append('limit', '50');
          
          const res = await fetch(`/api/chat/sessions?${params}`);
          if (res.ok) {
            const data = await res.json();
            // Merge server sessions with local ones
            const serverSessions = data.sessions || [];
            set(state => {
              // Keep local sessions that aren't on server yet
              const serverIds = new Set(serverSessions.map((s: any) => s.id));
              const localOnly = state.sessions.filter(s => !serverIds.has(s.id));
              return { 
                sessions: [...serverSessions, ...localOnly].slice(0, 50)
              };
            });
          }
          // If API fails, keep localStorage sessions (handled by persist middleware)
        } catch (error) {
          console.warn('Failed to load sessions from server, using local:', error);
        } finally {
          set({ isLoadingSessions: false });
        }
      },
      
      createSession: async (workspace, title) => {
        const ws = workspace || get().currentWorkspace;
        
        // Always create local session first (works offline/unauthenticated)
        const localId = nanoid();
        const newSession: ChatSession = {
          id: localId,
          title: title || 'New Chat',
          workspace: ws,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set(state => ({
          sessions: [newSession, ...state.sessions],
          currentSessionId: localId,
          messages: [],
          currentWorkspace: ws,
        }));
        
        // Try to sync with server (non-blocking)
        try {
          const res = await fetch('/api/chat/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              workspace: ws,
              title: title || `New Chat`,
              messages: []
            })
          });
          
          if (res.ok) {
            const serverSession = await res.json();
            // Update local session with server ID
            set(state => ({
              sessions: state.sessions.map(s => 
                s.id === localId ? { ...s, id: serverSession.id } : s
              ),
              currentSessionId: serverSession.id,
            }));
            return serverSession.id;
          }
        } catch (error) {
          console.warn('Failed to sync session to server:', error);
        }
        
        return localId;
      },
      
      switchSession: async (sessionId) => {
        // Save current session first
        await get().saveCurrentSession();
        
        // Check local sessions first
        const localSession = get().sessions.find(s => s.id === sessionId);
        if (localSession && localSession.messages) {
          set({
            currentSessionId: sessionId,
            messages: localSession.messages,
            currentWorkspace: localSession.workspace,
          });
          return;
        }
        
        // Load from API
        try {
          const res = await fetch(`/api/chat/sessions/${sessionId}`);
          if (res.ok) {
            const data = await res.json();
            set({
              currentSessionId: sessionId,
              messages: data.messages || [],
              currentWorkspace: data.workspace || 'software-dev',
            });
          }
        } catch (error) {
          console.error('Failed to load session:', error);
        }
      },
      
      deleteSession: async (sessionId) => {
        try {
          await fetch(`/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
        } catch (error) {
          console.error('Failed to delete session:', error);
        }
        
        set(state => {
          const newSessions = state.sessions.filter(s => s.id !== sessionId);
          const needsNewSession = state.currentSessionId === sessionId;
          return {
            sessions: newSessions,
            currentSessionId: needsNewSession ? null : state.currentSessionId,
            messages: needsNewSession ? [] : state.messages,
          };
        });
      },
      
      updateSessionTitle: async (sessionId, title) => {
        try {
          await fetch(`/api/chat/sessions/${sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
          });
        } catch (error) {
          console.error('Failed to update session title:', error);
        }
        
        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === sessionId ? { ...s, title } : s
          )
        }));
      },
      
      saveCurrentSession: async () => {
        const { currentSessionId, messages, currentWorkspace } = get();
        if (!currentSessionId || messages.length === 0) return;
        
        const title = generateTitle(messages);
        
        // Always update local session first (works offline)
        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === currentSessionId 
              ? { ...s, title, messages: [...messages], updatedAt: new Date() }
              : s
          )
        }));
        
        // Try to sync with server (non-blocking)
        set({ isSaving: true });
        try {
          await fetch(`/api/chat/sessions/${currentSessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              messages: messages.map(m => ({
                ...m,
                timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp
              })),
              workspace: currentWorkspace,
              title 
            })
          });
        } catch (error) {
          console.warn('Failed to sync session to server:', error);
        } finally {
          set({ isSaving: false });
        }
      },
      
      // ============================================
      // MESSAGE MANAGEMENT
      // ============================================
      
      setWorkspace: (workspace) => {
        set({ currentWorkspace: workspace });
      },

      addMessage: (message) => {
        const id = nanoid();
        const newMessage: Message = {
          ...message,
          id,
          timestamp: new Date(),
          status: 'complete',
        };
        set(state => ({
          messages: [...state.messages, newMessage],
        }));
        return id;
      },
      
      updateMessage: (id, updates) => {
        set(state => ({
          messages: state.messages.map(m =>
            m.id === id ? { ...m, ...updates } : m
          ),
        }));
      },
      
      appendToMessage: (id, content) => {
        set(state => ({
          messages: state.messages.map(m =>
            m.id === id ? { ...m, content: m.content + content } : m
          ),
        }));
      },
      
      setAIStatus: (status) => set({ aiStatus: status }),
      setThinking: (thinking) => set({ currentThinking: thinking }),
      appendThinking: (chunk) => set(state => ({
        currentThinking: state.currentThinking + chunk,
      })),
      setCurrentToolCall: (toolCall) => set({ currentToolCall: toolCall }),
      
      updateToolCall: (messageId, toolCallId, updates) => {
        set(state => ({
          messages: state.messages.map(m => {
            if (m.id !== messageId) return m;
            return {
              ...m,
              toolCalls: m.toolCalls?.map(tc =>
                tc.id === toolCallId ? { ...tc, ...updates } : tc
              ),
            };
          }),
        }));
      },
      
      // ============================================
      // SEND MESSAGE
      // ============================================
      
      sendMessage: async (content) => {
        const { addMessage, updateMessage, appendToMessage, setAIStatus, currentWorkspace, currentSessionId, createSession, saveCurrentSession } = get();
        
        // Create session if needed
        let sessionId = currentSessionId;
        if (!sessionId) {
          sessionId = await createSession(currentWorkspace);
        }
        
        // Add user message
        addMessage({ role: 'user', content });
        
        // Create assistant placeholder
        const assistantId = addMessage({ role: 'assistant', content: '' });
        updateMessage(assistantId, { status: 'streaming' });
        
        const abortController = new AbortController();
        set({ isStreaming: true, abortController, currentThinking: '' });
        
        try {
          setAIStatus('thinking');
          
          const history = get().messages.slice(0, -2).map(m => ({
            role: m.role,
            content: m.content,
          }));
          
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: content,
              history,
              workspace: currentWorkspace,
              enableTools: true,
            }),
            signal: abortController.signal,
          });
          
          if (!response.ok) {
            throw new Error('Failed to get response');
          }
          
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          
          let currentContent = '';
          let currentToolCalls: ToolCall[] = [];
          
          while (reader) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
            
            for (const line of lines) {
              const data = line.slice(6).trim();
              if (!data || data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                
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
                    set({ currentToolCall: toolCall });
                    
                    // Handle create_file
                    if (parsed.tool === 'create_file' && parsed.args?.path && parsed.args?.content !== undefined) {
                      const { path, content: fileContent } = parsed.args;
                      const filename = path.split('/').pop() || path;
                      useFileStore.getState().addFile({
                        name: filename,
                        path: path.startsWith('/') ? path : `/${path}`,
                        content: fileContent,
                        language: '',
                      });
                      toolCall.status = 'success';
                      toolCall.result = { success: true, path };
                    }
                    
                    // Update message with tool calls
                    updateMessage(assistantId, { toolCalls: [...currentToolCalls] });
                    break;
                    
                  case 'tool_result':
                    setAIStatus('generating');
                    const tc = currentToolCalls.find(t => t.name === parsed.tool);
                    if (tc) {
                      tc.status = parsed.result?.error ? 'error' : 'success';
                      tc.result = parsed.result;
                    }
                    set({ currentToolCall: null });
                    
                    // Handle create_file result
                    if (parsed.tool === 'create_file' && parsed.result?.success) {
                      const { path, content: fileContent } = parsed.result;
                      if (path && fileContent !== undefined) {
                        const filename = path.split('/').pop() || path;
                        useFileStore.getState().addFile({
                          name: filename,
                          path: path.startsWith('/') ? path : `/${path}`,
                          content: fileContent,
                          language: '',
                        });
                      }
                    }
                    
                    updateMessage(assistantId, { toolCalls: [...currentToolCalls] });
                    break;
                    
                  case 'done':
                    if (parsed.content && !currentContent) {
                      appendToMessage(assistantId, parsed.content);
                    }
                    break;
                    
                  case 'error':
                    // Display error message in chat
                    const errorMsg = parsed.error || 'Unknown error occurred';
                    appendToMessage(assistantId, `**Error:** ${errorMsg}`);
                    updateMessage(assistantId, { status: 'error' });
                    setAIStatus('error');
                    break;
                }
              } catch (e: any) {
                if (e.message !== 'Unknown error') {
                  console.warn('Failed to parse SSE:', e);
                }
              }
            }
          }
          
          updateMessage(assistantId, {
            status: 'complete',
            toolCalls: currentToolCalls.length > 0 ? currentToolCalls : undefined,
          });
          
          setAIStatus('completed');
          setTimeout(() => setAIStatus('idle'), 1000);
          
          // Auto-save session after response
          setTimeout(() => saveCurrentSession(), 500);
          
        } catch (error: any) {
          if (error.name === 'AbortError') {
            updateMessage(assistantId, { 
              status: 'complete',
              content: get().messages.find(m => m.id === assistantId)?.content || '[Stopped]',
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
        if (abortController) abortController.abort();
        set({ 
          isStreaming: false, 
          aiStatus: 'idle',
          currentThinking: '',
          currentToolCall: null,
        });
      },
      
      clearChat: () => {
        const { currentSessionId, currentWorkspace, createSession } = get();
        set({
          messages: [],
          currentThinking: '',
          currentToolCall: null,
          aiStatus: 'idle',
        });
        // Create new session
        createSession(currentWorkspace);
      },
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        sessions: state.sessions.slice(0, 20).map(s => ({
          ...s,
          messages: s.messages || [],
        })),
        currentSessionId: state.currentSessionId,
        currentWorkspace: state.currentWorkspace,
        messages: state.messages, // Persist current messages
      }),
      onRehydrateStorage: () => (state) => {
        // Restore current session messages after rehydration
        if (state && state.currentSessionId) {
          const session = state.sessions.find(s => s.id === state.currentSessionId);
          if (session?.messages?.length && !state.messages?.length) {
            state.messages = session.messages;
          }
        }
      },
    }
  )
);
