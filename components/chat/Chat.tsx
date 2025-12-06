'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Paperclip, Mic, Settings, Maximize2, Minimize2,
  StopCircle, Brain, Sparkles, Zap
} from 'lucide-react';
import { ChatMessage, ChatMessageProps, ToolCall } from './ChatMessage';
import { AIStatusIndicator, AIStatusBar, AIStatus } from './AIStatusIndicator';
import { useChatStore } from '@/stores/chatStore';

export function Chat() {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    messages,
    isStreaming,
    aiStatus,
    currentThinking,
    currentToolCall,
    addMessage,
    sendMessage,
    stopGeneration,
  } = useChatStore();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, currentThinking]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    const userMessage = input.trim();
    setInput('');
    
    await sendMessage(userMessage);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  return (
    <div className={`
      flex flex-col bg-gray-900 border-l border-gray-800 transition-all duration-300
      ${isExpanded ? 'w-[600px]' : 'w-[400px]'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${
                aiStatus === 'idle' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'
              }`} />
              {aiStatus === 'idle' ? 'Ready' : 'Working...'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>
      
      {/* Status Bar */}
      <AnimatePresence>
        {aiStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 border-b border-gray-800"
          >
            <AIStatusIndicator
              status={aiStatus}
              currentAction={getStatusAction(aiStatus, currentToolCall?.name)}
              thinkingContent={currentThinking}
              toolName={currentToolCall?.name}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} {...msg} />
          ))
        )}
        
        {/* Streaming Indicator */}
        {isStreaming && aiStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-sm text-gray-500"
          >
            <Brain className="w-4 h-4 animate-pulse text-purple-400" />
            <span>AI is {getStatusLabel(aiStatus)}...</span>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-800">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask AI to help you..."
              className="w-full px-4 py-3 pr-24 bg-gray-800 border border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={1}
              disabled={isStreaming}
            />
            
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <button
                type="button"
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4 text-gray-400" />
              </button>
              
              {isStreaming ? (
                <button
                  type="button"
                  onClick={stopGeneration}
                  className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                  title="Stop generation"
                >
                  <StopCircle className="w-4 h-4 text-white" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  title="Send message"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>
        </form>
        
        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-3">
          <QuickActionButton icon={Brain} label="Think deeply" />
          <QuickActionButton icon={Zap} label="Quick response" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-purple-400" />
      </div>
      <h3 className="font-semibold mb-2">Start a conversation</h3>
      <p className="text-sm text-gray-500 max-w-[250px]">
        Ask the AI to help you with coding, writing, research, or any task.
      </p>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-xs text-gray-400 transition-colors">
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}

// ============================================
// HELPERS
// ============================================

function getStatusAction(status: AIStatus, toolName?: string): string {
  switch (status) {
    case 'thinking':
      return 'Analyzing your request and planning approach...';
    case 'planning':
      return 'Creating execution plan...';
    case 'tool_calling':
      return `Executing ${toolName || 'tool'}...`;
    case 'executing':
      return 'Running operations...';
    case 'generating':
      return 'Generating response...';
    case 'reviewing':
      return 'Reviewing output...';
    default:
      return '';
  }
}

function getStatusLabel(status: AIStatus): string {
  switch (status) {
    case 'thinking': return 'thinking';
    case 'planning': return 'planning';
    case 'tool_calling': return 'using tools';
    case 'executing': return 'executing';
    case 'generating': return 'writing';
    case 'reviewing': return 'reviewing';
    default: return 'processing';
  }
}
