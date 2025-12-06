'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Shield, Code, BookOpen, BarChart, Search, FileText,
  Heart, Scale, Plus, Clock, Star, ArrowRight,
  Sparkles, Zap, Users, FolderOpen, Settings, LogOut, Crown
} from 'lucide-react';

const workspaceCategories = [
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    description: 'Red team, blue team, pentest, forensics',
    icon: Shield,
    color: 'from-red-500 to-orange-500',
    features: ['Web Scanning', 'Social Engineering', 'CVSS Calculator', 'Report Generation'],
  },
  {
    id: 'software-dev',
    name: 'Software Development',
    description: 'Full-stack development with AI assistance',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    features: ['Code Generation', 'Debugging', 'Refactoring', 'Documentation'],
  },
  {
    id: 'book-writing',
    name: 'Book Writing',
    description: 'Write novels, non-fiction, and more',
    icon: BookOpen,
    color: 'from-purple-500 to-pink-500',
    features: ['Story Outline', 'Character Development', 'Editing', 'Publishing'],
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis',
    description: 'Analyze data and create visualizations',
    icon: BarChart,
    color: 'from-green-500 to-emerald-500',
    features: ['Data Import', 'Statistics', 'Charts', 'Reports'],
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Academic, market, and competitor research',
    icon: Search,
    color: 'from-yellow-500 to-amber-500',
    features: ['Literature Review', 'Market Analysis', 'Competitor Intel', 'Citations'],
  },
  {
    id: 'content-marketing',
    name: 'Content Marketing',
    description: 'Blog posts, social media, SEO content',
    icon: FileText,
    color: 'from-pink-500 to-rose-500',
    features: ['Blog Writing', 'Social Posts', 'Email Campaigns', 'SEO'],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Clinical documentation and patient education',
    icon: Heart,
    color: 'from-teal-500 to-cyan-500',
    features: ['Clinical Notes', 'Patient Education', 'Research', 'Compliance'],
  },
  {
    id: 'legal',
    name: 'Legal',
    description: 'Contracts, compliance, and legal research',
    icon: Scale,
    color: 'from-indigo-500 to-violet-500',
    features: ['Contract Drafting', 'Compliance', 'Legal Research', 'Review'],
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [hoveredWorkspace, setHoveredWorkspace] = useState<string | null>(null);

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  const recentProjects = [
    { id: '1', name: 'E-commerce API', workspace: 'software-dev', lastOpened: '2 hours ago' },
    { id: '2', name: 'Q4 Security Audit', workspace: 'cybersecurity', lastOpened: '1 day ago' },
    { id: '3', name: 'Marketing Blog Series', workspace: 'content-marketing', lastOpened: '3 days ago' },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">AI Code Studio</h1>
              <p className="text-xs text-gray-500">Multi-purpose AI Workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Admin Link */}
            {isAdmin && (
              <Link 
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 rounded-lg text-sm font-medium transition-colors"
              >
                <Crown className="w-4 h-4" />
                Admin
              </Link>
            )}
            
            <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition-colors">
              <Plus className="w-4 h-4" />
              New Project
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
              <div className="text-right">
                <p className="text-sm font-medium">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{session?.user?.role || 'USER'}</p>
              </div>
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-2">Welcome back! 👋</h2>
          <p className="text-gray-400">Choose a workspace to start working with AI assistance.</p>
        </section>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                Recent Projects
              </h3>
              <button className="text-sm text-purple-400 hover:text-purple-300">
                View all
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {recentProjects.map((project) => {
                const workspace = workspaceCategories.find(w => w.id === project.workspace);
                return (
                  <button
                    key={project.id}
                    onClick={() => router.push(`/workspace/${project.workspace}?project=${project.id}`)}
                    className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl text-left hover:border-gray-600 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${workspace?.color} flex items-center justify-center`}>
                        {workspace && <workspace.icon className="w-5 h-5 text-white" />}
                      </div>
                      <span className="text-xs text-gray-500">{project.lastOpened}</span>
                    </div>
                    <h4 className="font-medium mb-1 group-hover:text-purple-400 transition-colors">
                      {project.name}
                    </h4>
                    <p className="text-sm text-gray-500">{workspace?.name}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Workspaces Grid */}
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-gray-500" />
            Workspaces
          </h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {workspaceCategories.map((workspace) => (
              <motion.button
                key={workspace.id}
                onClick={() => router.push(`/workspace/${workspace.id}`)}
                onMouseEnter={() => setHoveredWorkspace(workspace.id)}
                onMouseLeave={() => setHoveredWorkspace(null)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative p-6 bg-gray-800/50 border border-gray-700 rounded-2xl text-left overflow-hidden group hover:border-gray-600 transition-all"
              >
                {/* Gradient Background on Hover */}
                <div 
                  className={`absolute inset-0 bg-gradient-to-br ${workspace.color} opacity-0 group-hover:opacity-10 transition-opacity`}
                />

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${workspace.color} flex items-center justify-center mb-4`}>
                  <workspace.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h4 className="font-semibold mb-1">{workspace.name}</h4>
                <p className="text-sm text-gray-500 mb-4">{workspace.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-1">
                  {workspace.features.slice(0, 3).map((feature, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-400"
                    >
                      {feature}
                    </span>
                  ))}
                  {workspace.features.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-400">
                      +{workspace.features.length - 3}
                    </span>
                  )}
                </div>

                {/* Arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Quick Start Templates */}
        <section className="mt-12">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Quick Start Templates
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'Pentest Report', workspace: 'cybersecurity', icon: '🛡️' },
              { name: 'Next.js App', workspace: 'software-dev', icon: '⚡' },
              { name: 'Novel Outline', workspace: 'book-writing', icon: '📚' },
              { name: 'Market Research', workspace: 'research', icon: '🔍' },
              { name: 'Blog Post Series', workspace: 'content-marketing', icon: '✍️' },
              { name: 'Contract Template', workspace: 'legal', icon: '⚖️' },
            ].map((template, i) => (
              <button
                key={i}
                onClick={() => router.push(`/workspace/${template.workspace}?template=${template.name.toLowerCase().replace(' ', '-')}`)}
                className="flex items-center gap-3 p-4 bg-gray-800/30 border border-gray-800 rounded-xl hover:bg-gray-800/50 hover:border-gray-700 transition-colors text-left"
              >
                <span className="text-2xl">{template.icon}</span>
                <div>
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-gray-500">
                    {workspaceCategories.find(w => w.id === template.workspace)?.name}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="mt-12 grid grid-cols-4 gap-4">
          {[
            { label: 'Projects Created', value: '12', icon: FolderOpen, color: 'blue' },
            { label: 'AI Conversations', value: '847', icon: Sparkles, color: 'purple' },
            { label: 'Files Generated', value: '234', icon: FileText, color: 'green' },
            { label: 'Hours Saved', value: '56+', icon: Clock, color: 'yellow' },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-4 bg-gray-800/30 border border-gray-800 rounded-xl"
            >
              <stat.icon className={`w-5 h-5 text-${stat.color}-500 mb-2`} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
