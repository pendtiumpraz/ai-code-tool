'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeft } from 'lucide-react';
import { 
  getSidebarConfig, 
  SidebarItem, 
  SidebarSection,
  WorkspaceSidebarConfig 
} from '@/config/workspaceSidebars';

interface WorkspaceSidebarProps {
  workspace: string;
  isOpen: boolean;
  onToggle: () => void;
  onAction: (action: string) => void;
  activeItem?: string;
}

export function WorkspaceSidebar({ 
  workspace, 
  isOpen, 
  onToggle, 
  onAction,
  activeItem = 'dashboard'
}: WorkspaceSidebarProps) {
  const config = getSidebarConfig(workspace);
  const [expandedSections, setExpandedSections] = useState<string[]>(
    config.sections.map(s => s.id)
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  if (!isOpen) {
    return (
      <div className="w-12 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors mb-4"
          title="Expand sidebar"
        >
          <PanelLeft className="w-5 h-5 text-gray-400" />
        </button>
        
        {/* Collapsed icons */}
        <div className="flex flex-col items-center gap-2">
          {config.sections.flatMap(section => 
            section.items.slice(0, 1).map(item => (
              <button
                key={item.id}
                onClick={() => item.action && onAction(item.action)}
                className={`p-2 rounded-lg transition-colors ${
                  activeItem === item.id 
                    ? 'bg-purple-500/20 text-purple-400' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                }`}
                title={item.label}
              >
                <item.icon className="w-5 h-5" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 240, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-gray-900 border-r border-gray-800 flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-gray-800">
        <span className="text-sm font-medium text-gray-400">Navigation</span>
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Sections */}
      <nav className="flex-1 overflow-y-auto py-2">
        {config.sections.map((section) => (
          <SidebarSectionComponent
            key={section.id}
            section={section}
            isExpanded={expandedSections.includes(section.id)}
            onToggle={() => toggleSection(section.id)}
            onAction={onAction}
            activeItem={activeItem}
          />
        ))}
      </nav>
    </motion.aside>
  );
}

// Section Component
function SidebarSectionComponent({
  section,
  isExpanded,
  onToggle,
  onAction,
  activeItem
}: {
  section: SidebarSection;
  isExpanded: boolean;
  onToggle: () => void;
  onAction: (action: string) => void;
  activeItem: string;
}) {
  return (
    <div className="px-2 mb-1">
      {section.title ? (
        <>
          {/* Section Header */}
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-400 uppercase tracking-wider"
          >
            <span>{section.title}</span>
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>

          {/* Section Items */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                {section.items.map((item) => (
                  <SidebarItemComponent
                    key={item.id}
                    item={item}
                    onAction={onAction}
                    isActive={activeItem === item.id}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        // No title - just show items
        <div>
          {section.items.map((item) => (
            <SidebarItemComponent
              key={item.id}
              item={item}
              onAction={onAction}
              isActive={activeItem === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Item Component
function SidebarItemComponent({
  item,
  onAction,
  isActive,
  depth = 0
}: {
  item: SidebarItem;
  onAction: (action: string) => void;
  isActive: boolean;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else if (item.action) {
      onAction(item.action);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
          ${isActive 
            ? 'bg-purple-500/20 text-purple-400' 
            : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }
        `}
        style={{ paddingLeft: `${12 + depth * 12}px` }}
      >
        <item.icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{item.label}</span>
        
        {item.badge && (
          <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
            {item.badge}
          </span>
        )}
        
        {hasChildren && (
          isExpanded 
            ? <ChevronDown className="w-3 h-3" />
            : <ChevronRight className="w-3 h-3" />
        )}
      </button>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {item.children!.map((child) => (
              <SidebarItemComponent
                key={child.id}
                item={child}
                onAction={onAction}
                isActive={false}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WorkspaceSidebar;
