'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Paperclip, Mic, Settings, Maximize2, Minimize2,
  StopCircle, Brain, Sparkles, Zap, X
} from 'lucide-react';
import { ChatMessage, ChatMessageProps, ToolCall } from './ChatMessage';
import { AIStatusIndicator, AIStatusBar, AIStatus } from './AIStatusIndicator';
import { useChatStore } from '@/stores/chatStore';

type ChatSize = 'normal' | 'expanded' | 'maximized';

export function Chat() {
  const [chatSize, setChatSize] = useState<ChatSize>('normal');
  const [showAISettings, setShowAISettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Cycle through sizes: normal -> expanded -> maximized -> normal
  const cycleSize = () => {
    setChatSize(prev => {
      if (prev === 'normal') return 'expanded';
      if (prev === 'expanded') return 'maximized';
      return 'normal';
    });
  };
  
  // ESC to exit maximized
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && chatSize === 'maximized') {
        setChatSize('normal');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chatSize]);
  
  const messages = useChatStore((state) => state.messages);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const aiStatus = useChatStore((state) => state.aiStatus);
  const currentThinking = useChatStore((state) => state.currentThinking);
  const currentToolCall = useChatStore((state) => state.currentToolCall);
  const inputValue = useChatStore((state) => state.inputValue);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const stopGeneration = useChatStore((state) => state.stopGeneration);
  const setInputValue = useChatStore((state) => state.setInputValue);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, currentThinking]);
  
  // Focus input when prompt is inserted from menu
  useEffect(() => {
    console.log('Chat inputValue changed:', inputValue);
    if (inputValue && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputValue]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    
    await sendMessage(userMessage);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  // Container classes based on size
  const containerClasses = chatSize === 'maximized'
    ? 'fixed inset-0 z-50 flex flex-col bg-gray-900'
    : `flex flex-col h-full bg-gray-900 border-l border-gray-800 transition-all duration-300 flex-shrink-0 ${
        chatSize === 'expanded' ? 'w-[600px]' : 'w-[400px]'
      }`;

  return (
    <div className={containerClasses}>
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
              {chatSize === 'maximized' && (
                <span className="ml-2 text-gray-600">(ESC to exit)</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAISettings(true)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="AI Settings"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
          <button 
            onClick={cycleSize}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title={chatSize === 'maximized' ? 'Minimize' : chatSize === 'expanded' ? 'Maximize' : 'Expand'}
          >
            {chatSize === 'maximized' ? (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {chatSize === 'maximized' && (
            <button 
              onClick={() => setChatSize('normal')}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              title="Close fullscreen"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
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
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
        chatSize === 'maximized' ? 'max-w-4xl mx-auto w-full' : ''
      }`}>
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
      <div className={`p-4 border-t border-gray-800 ${
        chatSize === 'maximized' ? 'max-w-4xl mx-auto w-full' : ''
      }`}>
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
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
                  disabled={!inputValue.trim()}
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
      
      {/* AI Settings Modal */}
      <AnimatePresence>
        {showAISettings && (
          <AISettingsModal onClose={() => setShowAISettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// AI SETTINGS MODAL
// ============================================

function AISettingsModal({ onClose }: { onClose: () => void }) {
  const [model, setModel] = useState('gemini-2.0-flash');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(8192);
  const [enableTools, setEnableTools] = useState(true);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e: React.MouseEvent) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended)</option>
              <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (Faster)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (More capable)</option>
            </select>
          </div>
          
          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Temperature: {temperature}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
          
          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Max Output Tokens: {maxTokens}
            </label>
            <input
              type="range"
              min="1024"
              max="16384"
              step="1024"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1K</span>
              <span>16K</span>
            </div>
          </div>
          
          {/* Enable Tools */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium">Enable Tools</label>
              <p className="text-xs text-gray-500">Allow AI to use security tools</p>
            </div>
            <button
              onClick={() => setEnableTools(!enableTools)}
              className={`w-12 h-6 rounded-full transition-colors ${
                enableTools ? 'bg-purple-500' : 'bg-gray-700'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                enableTools ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm font-medium transition-colors"
          >
            Save Settings
          </button>
        </div>
      </motion.div>
    </motion.div>
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
