'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, Search, Code, FileText, Image, Globe, 
  Loader2, CheckCircle, XCircle, Pause, Play,
  Sparkles, Zap, Clock, MessageSquare, Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type AIStatus = 
  | 'idle'
  | 'thinking'
  | 'planning'
  | 'executing'
  | 'tool_calling'
  | 'generating'
  | 'reviewing'
  | 'completed'
  | 'error'
  | 'paused';

export interface AIStatusIndicatorProps {
  status: AIStatus;
  currentAction?: string;
  thinkingContent?: string;
  toolName?: string;
  progress?: number;
  duration?: number;
}

const statusConfig: Record<AIStatus, { 
  icon: any; 
  label: string; 
  color: string; 
  bgColor: string;
  animate?: boolean;
}> = {
  idle: {
    icon: MessageSquare,
    label: 'Ready',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
  },
  thinking: {
    icon: Brain,
    label: 'Thinking...',
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    animate: true,
  },
  planning: {
    icon: Sparkles,
    label: 'Planning...',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    animate: true,
  },
  executing: {
    icon: Zap,
    label: 'Executing...',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/10',
    animate: true,
  },
  tool_calling: {
    icon: Wrench,
    label: 'Using Tool...',
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
    animate: true,
  },
  generating: {
    icon: FileText,
    label: 'Generating...',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
    animate: true,
  },
  reviewing: {
    icon: Search,
    label: 'Reviewing...',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-400/10',
    animate: true,
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  error: {
    icon: XCircle,
    label: 'Error',
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
  },
  paused: {
    icon: Pause,
    label: 'Paused',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/10',
  },
};

const toolIcons: Record<string, any> = {
  search_web: Globe,
  web_browser: Globe,
  create_file: FileText,
  edit_file: FileText,
  run_command: Code,
  execute_code: Code,
  generate_image: Image,
  analyze_data: Search,
};

export function AIStatusIndicator({
  status,
  currentAction,
  thinkingContent,
  toolName,
  progress,
  duration,
}: AIStatusIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const ToolIcon = toolName ? toolIcons[toolName] || Wrench : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-4 ${config.bgColor} border border-white/5`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            {config.animate ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Icon className={`w-5 h-5 ${config.color}`} />
              </motion.div>
            ) : (
              <Icon className={`w-5 h-5 ${config.color}`} />
            )}
          </div>
          <div>
            <div className={`font-medium ${config.color}`}>{config.label}</div>
            {currentAction && (
              <div className="text-sm text-gray-400">{currentAction}</div>
            )}
          </div>
        </div>
        
        {duration !== undefined && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{duration}s</span>
          </div>
        )}
      </div>

      {/* Tool Indicator */}
      {status === 'tool_calling' && toolName && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 mb-3 p-2 bg-black/20 rounded-lg"
        >
          {ToolIcon && <ToolIcon className="w-4 h-4 text-orange-400" />}
          <span className="text-sm text-orange-300">Calling: {toolName}</span>
          <Loader2 className="w-4 h-4 text-orange-400 animate-spin ml-auto" />
        </motion.div>
      )}

      {/* Progress Bar */}
      {progress !== undefined && progress > 0 && (
        <div className="mb-3">
          <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={`h-full rounded-full ${config.color.replace('text-', 'bg-')}`}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">{progress}%</div>
        </div>
      )}

      {/* Thinking Content */}
      {thinkingContent && (
        <ThinkingDisplay content={thinkingContent} />
      )}
    </motion.div>
  );
}

// ============================================
// THINKING DISPLAY COMPONENT
// ============================================

interface ThinkingDisplayProps {
  content: string;
  maxHeight?: number;
}

export function ThinkingDisplay({ content, maxHeight = 200 }: ThinkingDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-3"
    >
      <div 
        className="flex items-center gap-2 text-xs text-purple-400 mb-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Brain className="w-3 h-3" />
        <span>AI Thinking Process</span>
        <span className="text-gray-600">
          {isExpanded ? '(click to collapse)' : '(click to expand)'}
        </span>
      </div>
      
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : maxHeight }}
        className="relative overflow-hidden"
      >
        <div className="p-3 bg-purple-950/30 rounded-lg border border-purple-500/20 font-mono text-xs text-purple-300 whitespace-pre-wrap">
          <TypewriterText text={content} />
        </div>
        
        {!isExpanded && content.length > 500 && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 to-transparent" />
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================
// TYPEWRITER EFFECT
// ============================================

function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    if (text.length <= displayedText.length) return;
    
    const timeout = setTimeout(() => {
      setDisplayedText(text.slice(0, displayedText.length + 3));
    }, 10);
    
    return () => clearTimeout(timeout);
  }, [text, displayedText]);
  
  useEffect(() => {
    setDisplayedText('');
  }, [text]);
  
  return (
    <>
      {displayedText}
      {displayedText.length < text.length && (
        <span className="animate-pulse">▊</span>
      )}
    </>
  );
}

// ============================================
// COMPACT STATUS BAR
// ============================================

export function AIStatusBar({ 
  status, 
  toolName 
}: { 
  status: AIStatus; 
  toolName?: string;
}) {
  const config = statusConfig[status];
  const Icon = config.icon;
  
  if (status === 'idle') return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`flex items-center gap-2 px-3 py-2 ${config.bgColor} rounded-lg text-sm`}
    >
      {config.animate ? (
        <Loader2 className={`w-4 h-4 ${config.color} animate-spin`} />
      ) : (
        <Icon className={`w-4 h-4 ${config.color}`} />
      )}
      <span className={config.color}>{config.label}</span>
      {toolName && (
        <>
          <span className="text-gray-600">•</span>
          <span className="text-gray-400">{toolName}</span>
        </>
      )}
    </motion.div>
  );
}
