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

interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  aiStatus: AIStatus;
  currentThinking: string;
  currentToolCall: ToolCall | null;
  abortController: AbortController | null;
  
  // Actions
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

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isStreaming: false,
  aiStatus: 'idle',
  currentThinking: '',
  currentToolCall: null,
  abortController: null,
  
  addMessage: (message) => {
    const id = nanoid();
    const newMessage: Message = {
      ...message,
      id,
      timestamp: new Date(),
      status: 'complete',
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
    return id;
  },
  
  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  },
  
  appendToMessage: (id, content) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + content } : m
      ),
    }));
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
    const { addMessage, updateMessage, appendToMessage, setAIStatus, setThinking, appendThinking, setCurrentToolCall } = get();
    
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
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: get().messages.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
          })),
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
    set({ 
      messages: [], 
      currentThinking: '',
      currentToolCall: null,
      aiStatus: 'idle',
    });
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
