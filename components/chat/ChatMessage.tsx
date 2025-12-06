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
  const [isExpanded, setIsExpanded] = useState(toolCall.status === 'success');
  const [copied, setCopied] = useState(false);
  
  const statusConfig = {
    pending: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-400/10' },
    running: { icon: Sparkles, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    success: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10' },
    error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
  };
  
  const config = statusConfig[toolCall.status];
  const StatusIcon = config.icon;
  
  const copyResult = () => {
    if (toolCall.result) {
      navigator.clipboard.writeText(
        typeof toolCall.result === 'string' 
          ? toolCall.result 
          : JSON.stringify(toolCall.result, null, 2)
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
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
            <span className="font-medium text-sm text-white">{getToolDisplayName(toolCall.name)}</span>
            <StatusIcon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div className="text-xs text-gray-500 truncate">
            {getToolSummary(toolCall)}
          </div>
        </div>
        
        {toolCall.result && (
          <button
            onClick={(e) => { e.stopPropagation(); copyResult(); }}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="Copy result"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-500" />
            )}
          </button>
        )}
        
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
          {/* Rich Result Display */}
          {toolCall.result && (
            <div className="p-3">
              <ToolResultRenderer toolName={toolCall.name} result={toolCall.result} />
            </div>
          )}
          
          {/* Error */}
          {toolCall.error && (
            <div className="p-3">
              <div className="text-xs text-red-400 mb-2">Error:</div>
              <pre className="text-xs bg-red-950/30 p-2 rounded-lg text-red-300">
                {toolCall.error}
              </pre>
            </div>
          )}
          
          {/* Arguments (collapsed by default) */}
          <details className="border-t border-white/5">
            <summary className="p-3 text-xs text-gray-500 cursor-pointer hover:bg-white/5">
              View Arguments
            </summary>
            <div className="px-3 pb-3">
              <pre className="text-xs bg-black/30 p-2 rounded-lg overflow-x-auto text-gray-300">
                {JSON.stringify(toolCall.arguments, null, 2)}
              </pre>
            </div>
          </details>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================
// TOOL RESULT RENDERER
// ============================================

function ToolResultRenderer({ toolName, result }: { toolName: string; result: any }) {
  switch (toolName) {
    case 'subdomain_finder':
      return <SubdomainResult data={result} />;
    case 'port_scanner':
      return <PortScanResult data={result} />;
    case 'whois_lookup':
      return <WhoisResult data={result} />;
    case 'dns_lookup':
      return <DnsResult data={result} />;
    case 'hash_generator':
      return <HashResult data={result} />;
    case 'encoder_decoder':
      return <EncoderResult data={result} />;
    case 'password_generator':
      return <PasswordResult data={result} />;
    case 'jwt_decoder':
      return <JwtResult data={result} />;
    case 'security_scan':
      return <SecurityScanResult data={result} />;
    default:
      return (
        <pre className="text-xs bg-black/30 p-2 rounded-lg overflow-x-auto text-green-300 max-h-60 overflow-y-auto">
          {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
        </pre>
      );
  }
}

// Subdomain Finder Result
function SubdomainResult({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Domain: <span className="text-purple-400">{data.domain}</span></span>
        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
          {data.found} found
        </span>
      </div>
      {data.subdomains?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-white/10">
                <th className="text-left py-2 px-2">Subdomain</th>
                <th className="text-left py-2 px-2">IP Address</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.subdomains.map((sub: any, i: number) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-2 text-blue-400 font-mono">{sub.subdomain}</td>
                  <td className="py-2 px-2 text-gray-300 font-mono">{sub.ip || '-'}</td>
                  <td className="py-2 px-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      sub.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Port Scanner Result
function PortScanResult({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Target: <span className="text-purple-400">{data.target}</span></span>
        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
          {data.openCount} open / {data.scannedPorts} scanned
        </span>
      </div>
      {data.ports?.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {data.ports.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-green-400 font-mono text-sm">{p.port}</span>
              <span className="text-gray-400 text-xs">{p.service}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-4">No open ports found</div>
      )}
    </div>
  );
}

// WHOIS Result
function WhoisResult({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-white mb-2">WHOIS: <span className="text-purple-400">{data.domain}</span></div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {data.registrar && (
          <div className="p-2 bg-black/30 rounded">
            <div className="text-gray-500">Registrar</div>
            <div className="text-gray-300">{data.registrar}</div>
          </div>
        )}
        {data.created && (
          <div className="p-2 bg-black/30 rounded">
            <div className="text-gray-500">Created</div>
            <div className="text-gray-300">{data.created}</div>
          </div>
        )}
        {data.expires && (
          <div className="p-2 bg-black/30 rounded">
            <div className="text-gray-500">Expires</div>
            <div className="text-gray-300">{data.expires}</div>
          </div>
        )}
        {data.nameServers?.length > 0 && (
          <div className="p-2 bg-black/30 rounded col-span-2">
            <div className="text-gray-500">Name Servers</div>
            <div className="text-gray-300">{data.nameServers.join(', ')}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// DNS Result
function DnsResult({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div className="text-sm text-white mb-2">DNS Records: <span className="text-purple-400">{data.domain}</span></div>
      <div className="space-y-2 text-xs">
        {Object.entries(data.records || {}).map(([type, values]: [string, any]) => (
          values && (Array.isArray(values) ? values.length > 0 : true) && (
            <div key={type} className="p-2 bg-black/30 rounded">
              <div className="text-purple-400 font-medium mb-1">{type}</div>
              <div className="text-gray-300 font-mono">
                {Array.isArray(values) 
                  ? values.map((v: any, i: number) => (
                      <div key={i}>
                        {typeof v === 'object' 
                          ? (v.exchange ? `${v.exchange} (priority: ${v.priority})` : JSON.stringify(v))
                          : (Array.isArray(v) ? v.join('') : v)
                        }
                      </div>
                    ))
                  : values
                }
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

// Hash Generator Result
function HashResult({ data }: { data: any }) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  
  const copyHash = (algo: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(algo);
    setTimeout(() => setCopiedHash(null), 2000);
  };
  
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500 mb-2">
        Input: "{data.input}" ({data.inputLength} chars)
      </div>
      {Object.entries(data.hashes || {}).map(([algo, hash]: [string, any]) => (
        <div key={algo} className="flex items-center gap-2 p-2 bg-black/30 rounded group">
          <span className="text-purple-400 font-medium w-16 text-xs uppercase">{algo}</span>
          <code className="flex-1 text-xs text-gray-300 font-mono truncate">{hash}</code>
          <button
            onClick={() => copyHash(algo, hash)}
            className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {copiedHash === algo ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : (
              <Copy className="w-3 h-3 text-gray-500" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}

// Encoder/Decoder Result
function EncoderResult({ data }: { data: any }) {
  const [copied, setCopied] = useState(false);
  
  const copyOutput = () => {
    navigator.clipboard.writeText(data.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-500">
        Operation: <span className="text-purple-400">{data.operation}</span>
      </div>
      <div className="p-2 bg-black/30 rounded">
        <div className="text-gray-500 text-xs mb-1">Input:</div>
        <div className="text-gray-400 text-xs font-mono break-all">{data.input}</div>
      </div>
      <div className="p-2 bg-green-500/10 rounded group">
        <div className="flex items-center justify-between mb-1">
          <span className="text-green-500 text-xs">Output:</span>
          <button
            onClick={copyOutput}
            className="p-1 hover:bg-white/10 rounded"
          >
            {copied ? (
              <Check className="w-3 h-3 text-green-400" />
            ) : (
              <Copy className="w-3 h-3 text-gray-500" />
            )}
          </button>
        </div>
        <div className="text-green-400 text-xs font-mono break-all">{data.output}</div>
      </div>
    </div>
  );
}

// Password Generator Result
function PasswordResult({ data }: { data: any }) {
  const [copied, setCopied] = useState(false);
  
  const copyPassword = () => {
    navigator.clipboard.writeText(data.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const strengthColors: Record<string, string> = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
    very_strong: 'bg-emerald-500',
  };
  
  return (
    <div className="space-y-3">
      <div className="p-3 bg-black/30 rounded-lg group">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500 text-xs">Generated Password</span>
          <button
            onClick={copyPassword}
            className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-xs transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div className="text-lg font-mono text-white break-all select-all">{data.password}</div>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Strength:</span>
          <div className={`px-2 py-0.5 rounded ${strengthColors[data.strength]} text-white`}>
            {data.strength?.replace('_', ' ')}
          </div>
        </div>
        <div className="text-gray-500">
          {data.length} chars • {data.entropy} bits entropy
        </div>
      </div>
    </div>
  );
}

// JWT Decoder Result
function JwtResult({ data }: { data: any }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-white">JWT Token</span>
        {data.isExpired ? (
          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">Expired</span>
        ) : (
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Valid</span>
        )}
      </div>
      <div className="p-2 bg-blue-500/10 rounded">
        <div className="text-blue-400 text-xs mb-1">Header</div>
        <pre className="text-xs text-gray-300 font-mono">{JSON.stringify(data.header, null, 2)}</pre>
      </div>
      <div className="p-2 bg-purple-500/10 rounded">
        <div className="text-purple-400 text-xs mb-1">Payload</div>
        <pre className="text-xs text-gray-300 font-mono">{JSON.stringify(data.payload, null, 2)}</pre>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {data.issuedAt && (
          <div className="p-2 bg-black/30 rounded">
            <div className="text-gray-500">Issued At</div>
            <div className="text-gray-300">{new Date(data.issuedAt).toLocaleString()}</div>
          </div>
        )}
        {data.expiresAt && (
          <div className="p-2 bg-black/30 rounded">
            <div className="text-gray-500">Expires At</div>
            <div className="text-gray-300">{new Date(data.expiresAt).toLocaleString()}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Security Scan Result
function SecurityScanResult({ data }: { data: any }) {
  const severityColors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
    info: 'bg-gray-500',
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Scan: <span className="text-purple-400">{data.target}</span></span>
        <span className="text-xs text-gray-500">{data.scanType}</span>
      </div>
      <div className="flex gap-2">
        {Object.entries(data.summary || {}).map(([severity, count]: [string, any]) => (
          count > 0 && (
            <span key={severity} className={`px-2 py-1 ${severityColors[severity]} text-white text-xs rounded`}>
              {severity}: {count}
            </span>
          )
        ))}
      </div>
      {data.vulnerabilities?.length > 0 && (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {data.vulnerabilities.map((vuln: any, i: number) => (
            <div key={i} className="p-2 bg-black/30 rounded text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${severityColors[vuln.severity?.toLowerCase()] || 'bg-gray-500'}`} />
                <span className="text-white font-medium">{vuln.title}</span>
              </div>
              {vuln.description && <div className="text-gray-400 mt-1">{vuln.description}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getToolDisplayName(toolName: string): string {
  const names: Record<string, string> = {
    subdomain_finder: 'Subdomain Finder',
    port_scanner: 'Port Scanner',
    whois_lookup: 'WHOIS Lookup',
    dns_lookup: 'DNS Lookup',
    hash_generator: 'Hash Generator',
    encoder_decoder: 'Encoder/Decoder',
    password_generator: 'Password Generator',
    jwt_decoder: 'JWT Decoder',
    security_scan: 'Security Scanner',
    file_read: 'Read File',
    file_write: 'Write File',
    web_search: 'Web Search',
    code_execute: 'Execute Code',
  };
  return names[toolName] || toolName;
}

function getToolSummary(toolCall: ToolCall): string {
  const { name, arguments: args, result, duration } = toolCall;
  let summary = '';
  
  switch (name) {
    case 'subdomain_finder':
      summary = args.domain ? `Scanning ${args.domain}` : '';
      if (result?.found) summary = `Found ${result.found} subdomains for ${args.domain}`;
      break;
    case 'port_scanner':
      summary = args.target ? `Scanning ${args.target}` : '';
      if (result?.openCount !== undefined) summary = `${result.openCount} open ports on ${args.target}`;
      break;
    case 'hash_generator':
      summary = result?.hashes ? `Generated ${Object.keys(result.hashes).length} hashes` : 'Generating hashes...';
      break;
    case 'password_generator':
      summary = result?.password ? `${result.length} chars, ${result.strength} strength` : 'Generating password...';
      break;
    case 'encoder_decoder':
      summary = args.operation || '';
      break;
    case 'dns_lookup':
      summary = `${args.domain} (${args.record_type || 'ALL'})`;
      break;
    default:
      summary = `${Object.keys(args).length} parameters`;
  }
  
  if (duration) summary += ` • ${duration}ms`;
  return summary;
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
