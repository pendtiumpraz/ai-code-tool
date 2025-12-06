'use client';

import { useState, useMemo } from 'react';
import { 
  Folder, FolderOpen, File, FileText, FileCode, FileJson,
  Image, FileType, ChevronRight, ChevronDown, Plus, 
  Upload, Download, Trash2, Edit2, Search, RefreshCw,
  MoreHorizontal, FolderPlus, FilePlus
} from 'lucide-react';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  modified?: Date;
  content?: string;
}

interface FileExplorerProps {
  files: FileNode[];
  selectedPath?: string;
  onSelect?: (node: FileNode) => void;
  onCreate?: (path: string, type: 'file' | 'directory') => void;
  onDelete?: (path: string) => void;
  onRename?: (oldPath: string, newPath: string) => void;
  onUpload?: (files: FileList, targetPath: string) => void;
  onRefresh?: () => void;
  className?: string;
}

// File icon mapping
const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const iconMap: Record<string, { icon: any; color: string }> = {
    // Code
    'js': { icon: FileCode, color: 'text-yellow-400' },
    'jsx': { icon: FileCode, color: 'text-yellow-400' },
    'ts': { icon: FileCode, color: 'text-blue-400' },
    'tsx': { icon: FileCode, color: 'text-blue-400' },
    'py': { icon: FileCode, color: 'text-green-400' },
    'rb': { icon: FileCode, color: 'text-red-400' },
    'go': { icon: FileCode, color: 'text-cyan-400' },
    'rs': { icon: FileCode, color: 'text-orange-400' },
    'java': { icon: FileCode, color: 'text-red-500' },
    'php': { icon: FileCode, color: 'text-purple-400' },
    'c': { icon: FileCode, color: 'text-blue-500' },
    'cpp': { icon: FileCode, color: 'text-blue-500' },
    'h': { icon: FileCode, color: 'text-purple-500' },
    
    // Web
    'html': { icon: FileCode, color: 'text-orange-500' },
    'css': { icon: FileCode, color: 'text-blue-500' },
    'scss': { icon: FileCode, color: 'text-pink-400' },
    'less': { icon: FileCode, color: 'text-indigo-400' },
    
    // Data
    'json': { icon: FileJson, color: 'text-yellow-500' },
    'yaml': { icon: FileText, color: 'text-red-400' },
    'yml': { icon: FileText, color: 'text-red-400' },
    'xml': { icon: FileText, color: 'text-orange-400' },
    'csv': { icon: FileText, color: 'text-green-500' },
    
    // Docs
    'md': { icon: FileText, color: 'text-blue-300' },
    'txt': { icon: FileText, color: 'text-gray-400' },
    'pdf': { icon: FileType, color: 'text-red-500' },
    'doc': { icon: FileType, color: 'text-blue-500' },
    'docx': { icon: FileType, color: 'text-blue-500' },
    
    // Images
    'png': { icon: Image, color: 'text-purple-400' },
    'jpg': { icon: Image, color: 'text-purple-400' },
    'jpeg': { icon: Image, color: 'text-purple-400' },
    'gif': { icon: Image, color: 'text-purple-400' },
    'svg': { icon: Image, color: 'text-orange-400' },
    'ico': { icon: Image, color: 'text-yellow-400' },
    
    // Config
    'env': { icon: FileText, color: 'text-yellow-600' },
    'gitignore': { icon: FileText, color: 'text-gray-500' },
    'dockerfile': { icon: FileText, color: 'text-blue-400' },
    'prisma': { icon: FileText, color: 'text-teal-400' },
  };

  return iconMap[ext || ''] || { icon: File, color: 'text-gray-400' };
};

export function FileExplorer({
  files,
  selectedPath,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  onUpload,
  onRefresh,
  className = '',
}: FileExplorerProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/']));
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; type: string } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path: node.path,
      type: node.type,
    });
  };

  const handleRename = (path: string, name: string) => {
    setRenamingPath(path);
    setNewName(name);
  };

  const submitRename = () => {
    if (renamingPath && newName && onRename) {
      const parentPath = renamingPath.split('/').slice(0, -1).join('/');
      const newPath = parentPath ? `${parentPath}/${newName}` : newName;
      onRename(renamingPath, newPath);
    }
    setRenamingPath(null);
    setNewName('');
  };

  // Filter files by search query
  const filterFiles = (nodes: FileNode[]): FileNode[] => {
    if (!searchQuery) return nodes;
    
    return nodes.reduce<FileNode[]>((acc, node) => {
      if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        acc.push(node);
      } else if (node.children) {
        const filteredChildren = filterFiles(node.children);
        if (filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren });
        }
      }
      return acc;
    }, []);
  };

  const filteredFiles = useMemo(() => filterFiles(files), [files, searchQuery]);

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedPath === node.path;
    const isRenaming = renamingPath === node.path;
    const { icon: FileIcon, color: iconColor } = node.type === 'directory' 
      ? { icon: isExpanded ? FolderOpen : Folder, color: 'text-yellow-500' }
      : getFileIcon(node.name);

    return (
      <div key={node.path}>
        <div
          className={`
            flex items-center gap-1 px-2 py-1 cursor-pointer rounded
            ${isSelected ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-800'}
          `}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleExpand(node.path);
            }
            onSelect?.(node);
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          {/* Expand Icon */}
          {node.type === 'directory' ? (
            <button className="p-0.5" onClick={(e) => { e.stopPropagation(); toggleExpand(node.path); }}>
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-500" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* File Icon */}
          <FileIcon className={`w-4 h-4 ${iconColor}`} />

          {/* Name */}
          {isRenaming ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={submitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') {
                  setRenamingPath(null);
                  setNewName('');
                }
              }}
              className="flex-1 px-1 py-0.5 bg-gray-800 border border-blue-500 rounded text-sm focus:outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 text-sm truncate">{node.name}</span>
          )}
        </div>

        {/* Children */}
        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children
              .sort((a, b) => {
                // Directories first
                if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
                return a.name.localeCompare(b.name);
              })
              .map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-400">Explorer</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onCreate?.('/', 'file')}
              className="p-1 hover:bg-gray-800 rounded"
              title="New file"
            >
              <FilePlus className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => onCreate?.('/', 'directory')}
              className="p-1 hover:bg-gray-800 rounded"
              title="New folder"
            >
              <FolderPlus className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={onRefresh}
              className="p-1 hover:bg-gray-800 rounded"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredFiles.length > 0 ? (
          filteredFiles.map((node) => renderNode(node))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Folder className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm">No files found</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {contextMenu.type === 'directory' && (
              <>
                <button
                  onClick={() => {
                    onCreate?.(contextMenu.path, 'file');
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                >
                  <FilePlus className="w-4 h-4" />
                  New File
                </button>
                <button
                  onClick={() => {
                    onCreate?.(contextMenu.path, 'directory');
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  New Folder
                </button>
                <div className="border-t border-gray-700 my-1" />
              </>
            )}
            <button
              onClick={() => {
                const name = contextMenu.path.split('/').pop() || '';
                handleRename(contextMenu.path, name);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-700 flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Rename
            </button>
            <button
              onClick={() => {
                onDelete?.(contextMenu.path);
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-700 flex items-center gap-2 text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default FileExplorer;
