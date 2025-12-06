'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, Bot, User, Copy, Check, 
  RefreshCw, Trash2, Plus, MessageSquare,
  Settings, ChevronDown, Zap, Brain
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export default function AIChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: '1',
      title: 'Help with React hooks',
      messages: [
        { id: '1', role: 'user', content: 'Can you explain useEffect?', timestamp: new Date(Date.now() - 3600000) },
        { id: '2', role: 'assistant', content: 'useEffect is a React Hook that lets you synchronize a component with an external system. It runs after render and can optionally clean up before the component unmounts or before the effect runs again.\n\n```jsx\nuseEffect(() => {\n  // Effect code here\n  return () => {\n    // Cleanup code here\n  };\n}, [dependencies]);\n```', timestamp: new Date(Date.now() - 3500000) },
      ],
      createdAt: new Date(Date.now() - 3600000),
    },
    {
      id: '2', 
      title: 'Python data analysis',
      messages: [
        { id: '1', role: 'user', content: 'How do I read a CSV file in pandas?', timestamp: new Date(Date.now() - 86400000) },
        { id: '2', role: 'assistant', content: 'You can use `pd.read_csv()` to read CSV files:\n\n```python\nimport pandas as pd\n\ndf = pd.read_csv("data.csv")\nprint(df.head())\n```', timestamp: new Date(Date.now() - 86300000) },
      ],
      createdAt: new Date(Date.now() - 86400000),
    },
  ]);

  const [activeConversation, setActiveConversation] = useState<string>('1');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === activeConversation);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setConversations(prev => prev.map(c => 
      c.id === activeConversation 
        ? { ...c, messages: [...c.messages, userMessage] }
        : c
    ));
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(input),
        timestamp: new Date(),
      };
      
      setConversations(prev => prev.map(c => 
        c.id === activeConversation 
          ? { ...c, messages: [...c.messages, aiMessage] }
          : c
      ));
      setIsLoading(false);
    }, 1500);
  };

  const generateAIResponse = (query: string): string => {
    const responses = [
      `I understand you're asking about "${query.slice(0, 30)}..."\n\nHere's a helpful response:\n\n1. First, consider the context\n2. Then, analyze the requirements\n3. Finally, implement the solution\n\nWould you like me to elaborate on any of these points?`,
      `Great question! Let me help you with that.\n\nBased on your query, here's what I recommend:\n\n\`\`\`javascript\n// Example code\nconst solution = () => {\n  return "Your answer here";\n};\n\`\`\`\n\nFeel free to ask for more details!`,
      `That's an interesting topic! Here's my take:\n\n**Key Points:**\n- Point 1: Understanding the basics\n- Point 2: Applying best practices\n- Point 3: Testing and iteration\n\nLet me know if you need more specific guidance.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const createNewConversation = () => {
    const newConv: Conversation = {
      id: Date.now().toString(),
      title: 'New conversation',
      messages: [],
      createdAt: new Date(),
    };
    setConversations([newConv, ...conversations]);
    setActiveConversation(newConv.id);
  };

  const deleteConversation = (id: string) => {
    if (conversations.length === 1) return;
    setConversations(conversations.filter(c => c.id !== id));
    if (activeConversation === id) {
      setActiveConversation(conversations.find(c => c.id !== id)?.id || '');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar - Conversations */}
      <div className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-4">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConversation(conv.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 text-left transition-colors group ${
                activeConversation === conv.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate text-sm">{conv.title}</span>
              {conversations.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span>1,247 tokens remaining</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">AI Assistant</h2>
              <p className="text-xs text-gray-500">GPT-4 Turbo</p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-800 rounded-lg">
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentConversation?.messages.length ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
              <p className="text-gray-500 max-w-sm">
                Ask me anything about coding, writing, analysis, or any topic you need help with.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {['Write code', 'Explain concept', 'Debug issue', 'Generate content'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion + ': ')}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-full text-sm text-gray-400"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            currentConversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-2xl ${msg.role === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-800 text-gray-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-1 ml-2">
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="p-1 text-gray-500 hover:text-gray-300"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <span className="text-xs text-gray-600">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-800 px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-sm text-gray-400">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-800">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything..."
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
          <p className="text-xs text-gray-600 mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
