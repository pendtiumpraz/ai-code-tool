'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Plus, Trash2, Edit2, Check, X,
  ChevronLeft, ChevronRight, Search, Clock, MoreVertical
} from 'lucide-react';
import { useChatStore, ChatSession } from '@/stores/chatStore';

interface ChatSessionSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  workspace?: string;
}

export function ChatSessionSidebar({ isOpen, onToggle, workspace }: ChatSessionSidebarProps) {
  const {
    sessions,
    currentSessionId,
    isLoadingSessions,
    loadSessions,
    createSession,
    switchSession,
    deleteSession,
    updateSessionTitle,
    currentWorkspace,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions(workspace || currentWorkspace);
  }, [workspace, currentWorkspace]);

  // Filter sessions by search
  const filteredSessions = sessions.filter(s =>
    s.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group sessions by date
  const groupedSessions = groupSessionsByDate(filteredSessions);

  const handleCreateSession = async () => {
    await createSession(workspace || currentWorkspace);
  };

  const handleSwitchSession = async (sessionId: string) => {
    if (sessionId !== currentSessionId) {
      await switchSession(sessionId);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this chat?')) {
      await deleteSession(sessionId);
    }
    setMenuOpenId(null);
  };

  const handleEditStart = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title || '');
    setMenuOpenId(null);
  };

  const handleEditSave = async (sessionId: string) => {
    if (editTitle.trim()) {
      await updateSessionTitle(sessionId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // Collapsed view
  if (!isOpen) {
    return (
      <div className="w-12 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors mb-4"
          title="Expand chat history"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        
        <button
          onClick={handleCreateSession}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors mb-2"
          title="New chat"
        >
          <Plus className="w-5 h-5 text-gray-400" />
        </button>

        <div className="flex-1 overflow-y-auto w-full px-1.5 space-y-1">
          {sessions.slice(0, 10).map((session) => (
            <button
              key={session.id}
              onClick={() => handleSwitchSession(session.id)}
              className={`w-full p-2 rounded-lg transition-colors ${
                currentSessionId === session.id
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
              }`}
              title={session.title}
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-gray-900 border-r border-gray-800 flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Chat History</h3>
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
            title="Collapse"
          >
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* New Chat Button */}
        <button
          onClick={handleCreateSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingSessions ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No chats yet</p>
          </div>
        ) : (
          Object.entries(groupedSessions).map(([group, groupSessions]) => (
            <div key={group} className="px-2 py-2">
              <div className="px-2 py-1 text-xs text-gray-500 font-medium uppercase">
                {group}
              </div>
              {groupSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={currentSessionId === session.id}
                  isEditing={editingId === session.id}
                  editTitle={editTitle}
                  menuOpen={menuOpenId === session.id}
                  onSelect={() => handleSwitchSession(session.id)}
                  onEditStart={(e) => handleEditStart(session, e)}
                  onEditSave={() => handleEditSave(session.id)}
                  onEditCancel={handleEditCancel}
                  onEditChange={setEditTitle}
                  onDelete={(e) => handleDeleteSession(session.id, e)}
                  onMenuToggle={() => setMenuOpenId(menuOpenId === session.id ? null : session.id)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </motion.aside>
  );
}

// Session Item Component
function SessionItem({
  session,
  isActive,
  isEditing,
  editTitle,
  menuOpen,
  onSelect,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditChange,
  onDelete,
  onMenuToggle,
}: {
  session: ChatSession;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  menuOpen: boolean;
  onSelect: () => void;
  onEditStart: (e: React.MouseEvent) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditChange: (value: string) => void;
  onDelete: (e: React.MouseEvent) => void;
  onMenuToggle: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`relative group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-purple-500/20 text-white'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0" />
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => onEditChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onEditSave();
              if (e.key === 'Escape') onEditCancel();
            }}
            className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            autoFocus
          />
          <button
            onClick={(e) => { e.stopPropagation(); onEditSave(); }}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <Check className="w-3 h-3 text-green-400" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEditCancel(); }}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X className="w-3 h-3 text-red-400" />
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-sm truncate">{session.title || 'Untitled'}</span>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <MoreVertical className="w-3 h-3" />
            </button>
          </div>
        </>
      )}

      {/* Dropdown Menu */}
      <AnimatePresence>
        {menuOpen && !isEditing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute right-0 top-full mt-1 z-10 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px]"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <button
              onClick={onEditStart}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700"
            >
              <Edit2 className="w-3 h-3" />
              Rename
            </button>
            <button
              onClick={onDelete}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Group sessions by date
function groupSessionsByDate(sessions: ChatSession[]): Record<string, ChatSession[]> {
  const groups: Record<string, ChatSession[]> = {};
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  sessions.forEach((session) => {
    const date = new Date(session.updatedAt || session.createdAt);
    let group: string;

    if (date >= today) {
      group = 'Today';
    } else if (date >= yesterday) {
      group = 'Yesterday';
    } else if (date >= lastWeek) {
      group = 'Last 7 Days';
    } else {
      group = 'Older';
    }

    if (!groups[group]) groups[group] = [];
    groups[group].push(session);
  });

  return groups;
}

export default ChatSessionSidebar;
