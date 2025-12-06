'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Filter, MoreHorizontal, FolderOpen,
  Clock, Star, Trash2, Edit2, Copy, ExternalLink,
  Shield, Code, BookOpen, BarChart, FileText, Heart,
  Scale, Grid, List, SortAsc
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  workspace: string;
  lastOpened: string;
  createdAt: string;
  starred: boolean;
  filesCount: number;
}

const workspaceIcons: Record<string, any> = {
  'cybersecurity': Shield,
  'software-dev': Code,
  'book-writing': BookOpen,
  'data-analysis': BarChart,
  'content-marketing': FileText,
  'healthcare': Heart,
  'legal': Scale,
};

const workspaceColors: Record<string, string> = {
  'cybersecurity': 'from-red-500 to-orange-500',
  'software-dev': 'from-blue-500 to-cyan-500',
  'book-writing': 'from-purple-500 to-pink-500',
  'data-analysis': 'from-green-500 to-emerald-500',
  'content-marketing': 'from-pink-500 to-rose-500',
  'healthcare': 'from-teal-500 to-cyan-500',
  'legal': 'from-indigo-500 to-violet-500',
};

export default function ProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<string>('all');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([
    { id: '1', name: 'E-commerce API', description: 'Backend API for online store', workspace: 'software-dev', lastOpened: '2 hours ago', createdAt: '2024-01-15', starred: true, filesCount: 24 },
    { id: '2', name: 'Q4 Security Audit', description: 'Quarterly security assessment', workspace: 'cybersecurity', lastOpened: '1 day ago', createdAt: '2024-01-10', starred: true, filesCount: 12 },
    { id: '3', name: 'Marketing Blog Series', description: 'Content for Q1 campaign', workspace: 'content-marketing', lastOpened: '3 days ago', createdAt: '2024-01-05', starred: false, filesCount: 8 },
    { id: '4', name: 'Mystery Novel Draft', description: 'First draft of thriller novel', workspace: 'book-writing', lastOpened: '1 week ago', createdAt: '2023-12-20', starred: false, filesCount: 15 },
    { id: '5', name: 'Sales Data Analysis', description: 'Q4 2023 sales performance', workspace: 'data-analysis', lastOpened: '2 weeks ago', createdAt: '2023-12-15', starred: false, filesCount: 6 },
    { id: '6', name: 'NDA Template', description: 'Standard NDA for contractors', workspace: 'legal', lastOpened: '3 weeks ago', createdAt: '2023-12-01', starred: false, filesCount: 3 },
  ]);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase()) ||
                          project.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || 
                          filter === 'starred' && project.starred ||
                          filter === project.workspace;
    return matchesSearch && matchesFilter;
  });

  const toggleStar = (id: string) => {
    setProjects(projects.map(p => 
      p.id === id ? { ...p, starred: !p.starred } : p
    ));
  };

  const deleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== id));
    }
    setShowActionMenu(null);
  };

  const handleAction = (action: string, projectId: string) => {
    setShowActionMenu(null);
    switch (action) {
      case 'open':
        const project = projects.find(p => p.id === projectId);
        if (project) router.push(`/workspace/${project.workspace}?project=${projectId}`);
        break;
      case 'duplicate':
        const orig = projects.find(p => p.id === projectId);
        if (orig) {
          setProjects([...projects, { ...orig, id: Date.now().toString(), name: `${orig.name} (Copy)`, starred: false }]);
        }
        break;
      case 'delete':
        deleteProject(projectId);
        break;
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-gray-400">Manage and organize your projects</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Projects</option>
          <option value="starred">Starred</option>
          <option value="software-dev">Software Dev</option>
          <option value="cybersecurity">Cybersecurity</option>
          <option value="book-writing">Book Writing</option>
          <option value="data-analysis">Data Analysis</option>
          <option value="content-marketing">Content Marketing</option>
        </select>

        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Projects */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="w-16 h-16 mx-auto text-gray-700 mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">Create your first project to get started</p>
          <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg">
            Create Project
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const Icon = workspaceIcons[project.workspace] || FolderOpen;
            const color = workspaceColors[project.workspace] || 'from-gray-500 to-gray-600';
            return (
              <div
                key={project.id}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleStar(project.id)}
                      className={`p-1.5 rounded-lg transition-colors ${project.starred ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}
                    >
                      <Star className={`w-4 h-4 ${project.starred ? 'fill-current' : ''}`} />
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowActionMenu(showActionMenu === project.id ? null : project.id)}
                        className="p-1.5 text-gray-500 hover:text-white rounded-lg hover:bg-gray-700"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {showActionMenu === project.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowActionMenu(null)} />
                          <div className="absolute right-0 mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 py-1">
                            <button onClick={() => handleAction('open', project.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700">
                              <ExternalLink className="w-4 h-4" /> Open
                            </button>
                            <button onClick={() => handleAction('duplicate', project.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700">
                              <Copy className="w-4 h-4" /> Duplicate
                            </button>
                            <button onClick={() => handleAction('delete', project.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-gray-700">
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <h3 
                  className="font-semibold mb-1 cursor-pointer hover:text-purple-400"
                  onClick={() => router.push(`/workspace/${project.workspace}?project=${project.id}`)}
                >
                  {project.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.description}</p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {project.lastOpened}
                  </span>
                  <span>{project.filesCount} files</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Workspace</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Last Opened</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Files</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => {
                const Icon = workspaceIcons[project.workspace] || FolderOpen;
                return (
                  <tr key={project.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleStar(project.id)} className={project.starred ? 'text-yellow-400' : 'text-gray-600'}>
                          <Star className={`w-4 h-4 ${project.starred ? 'fill-current' : ''}`} />
                        </button>
                        <span className="font-medium cursor-pointer hover:text-purple-400" onClick={() => router.push(`/workspace/${project.workspace}?project=${project.id}`)}>
                          {project.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Icon className="w-4 h-4" />
                        {project.workspace.replace('-', ' ')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{project.lastOpened}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{project.filesCount}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleAction('open', project.id)} className="p-1.5 hover:bg-gray-700 rounded">
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
