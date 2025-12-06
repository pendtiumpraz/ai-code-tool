'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Bot, Copy, Check, RotateCcw, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronRight, Wrench, CheckCircle, XCircle,
  Brain, Clock, Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AIStatusIndicator, ThinkingDisplay } from './AIStatusIndicator';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
  duration?: number;
}

export interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking?: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
  isStreaming?: boolean;
  status?: 'sending' | 'streaming' | 'complete' | 'error';
}

export function ChatMessage({
  role,
  content,
  thinking,
  toolCalls,
  timestamp,
  isStreaming,
  status,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  
  const isUser = role === 'user';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
        ${isUser 
          ? 'bg-blue-500' 
          : 'bg-gradient-to-br from-purple-500 to-pink-500'
        }
      `}>
        {isUser ? (
          <User className="w-5 h-5 text-white" />
        ) : (
          <Bot className="w-5 h-5 text-white" />
        )}
      </div>
      
      {/* Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Thinking Section (AI only) */}
        {!isUser && thinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full mb-3"
          >
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
            >
              <Brain className="w-4 h-4" />
              <span>View Thinking Process</span>
              {showThinking ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            
            {showThinking && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2"
              >
                <ThinkingDisplay content={thinking} />
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Tool Calls (AI only) */}
        {!isUser && toolCalls && toolCalls.length > 0 && (
          <div className="w-full mb-3 space-y-2">
            {toolCalls.map((tool) => (
              <ToolCallCard key={tool.id} toolCall={tool} />
            ))}
          </div>
        )}
        
        {/* Message Bubble */}
        <div className={`
          rounded-2xl px-4 py-3
          ${isUser 
            ? 'bg-blue-500 text-white rounded-tr-sm' 
            : 'bg-gray-800 text-gray-100 rounded-tl-sm'
          }
        `}>
          {isStreaming && !content ? (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-2 h-5 bg-gray-400 animate-pulse ml-1" />
              )}
            </div>
          )}
        </div>
        
        {/* Actions & Timestamp */}
        <div className={`
          flex items-center gap-3 mt-2 text-xs text-gray-500
          ${isUser ? 'flex-row-reverse' : ''}
        `}>
          <span>{formatTime(timestamp)}</span>
          
          {!isUser && status === 'complete' && (
            <>
              <button
                onClick={handleCopy}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                title="Copy"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <button className="p-1 hover:bg-gray-800 rounded transition-colors" title="Regenerate">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 hover:bg-gray-800 rounded transition-colors" title="Good response">
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 hover:bg-gray-800 rounded transition-colors" title="Bad response">
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// TOOL CALL CARD
// ============================================

function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const statusConfig = {
    pending: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-400/10' },
    running: { icon: Sparkles, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
    error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
  };
  
  const config = statusConfig[toolCall.status];
  const StatusIcon = config.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`rounded-xl border ${config.bg} border-white/5 overflow-hidden`}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`p-2 rounded-lg ${config.bg}`}>
          {toolCall.status === 'running' ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Wrench className={`w-4 h-4 ${config.color}`} />
            </motion.div>
          ) : (
            <Wrench className={`w-4 h-4 ${config.color}`} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-white">{toolCall.name}</span>
            <StatusIcon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div className="text-xs text-gray-500 truncate">
            {Object.keys(toolCall.arguments).length} parameters
            {toolCall.duration && ` • ${toolCall.duration}ms`}
          </div>
        </div>
        
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="border-t border-white/5"
        >
          {/* Arguments */}
          <div className="p-3">
            <div className="text-xs text-gray-500 mb-2">Arguments:</div>
            <pre className="text-xs bg-black/30 p-2 rounded-lg overflow-x-auto text-gray-300">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>
          
          {/* Result */}
          {toolCall.result && (
            <div className="p-3 border-t border-white/5">
              <div className="text-xs text-gray-500 mb-2">Result:</div>
              <pre className="text-xs bg-black/30 p-2 rounded-lg overflow-x-auto text-green-300 max-h-40 overflow-y-auto">
                {typeof toolCall.result === 'string' 
                  ? toolCall.result 
                  : JSON.stringify(toolCall.result, null, 2)
                }
              </pre>
            </div>
          )}
          
          {/* Error */}
          {toolCall.error && (
            <div className="p-3 border-t border-white/5">
              <div className="text-xs text-red-400 mb-2">Error:</div>
              <pre className="text-xs bg-red-950/30 p-2 rounded-lg text-red-300">
                {toolCall.error}
              </pre>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================
// HELPER
// ============================================

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
