'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Zap, Clock, FileText,
  MessageSquare, FolderOpen, Calendar, ArrowUpRight,
  ArrowDownRight, Activity
} from 'lucide-react';

interface UsageData {
  date: string;
  tokens: number;
  messages: number;
  files: number;
}

interface Stats {
  tokensUsed: number;
  tokensLimit: number;
  messagesCount: number;
  filesGenerated: number;
  projectsCount: number;
  hoursActive: number;
  avgResponseTime: number;
  tokensGrowth: number;
  messagesGrowth: number;
}

interface WorkspaceUsage {
  name: string;
  percentage: number;
  tokens: number;
  color: string;
}

interface RecentActivity {
  type: string;
  description: string;
  time: string;
  tokens: number;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    tokensUsed: 0,
    tokensLimit: 10000,
    messagesCount: 0,
    filesGenerated: 0,
    projectsCount: 0,
    hoursActive: 0,
    avgResponseTime: 0,
    tokensGrowth: 0,
    messagesGrowth: 0,
  });
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [workspaceUsage, setWorkspaceUsage] = useState<WorkspaceUsage[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/analytics?range=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || stats);
        setUsageData(data.usageData || []);
        setWorkspaceUsage(data.workspaceUsage || []);
        setRecentActivity(data.recentActivity || []);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Usage Analytics</h1>
          <p className="text-gray-400">Track your AI usage and activity</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                dateRange === range
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Tokens Used */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex items-center gap-1 text-sm text-green-400">
              <ArrowUpRight className="w-4 h-4" />
              {stats.tokensGrowth}%
            </div>
          </div>
          <p className="text-2xl font-bold">{stats.tokensUsed.toLocaleString()}</p>
          <p className="text-sm text-gray-400">Tokens Used</p>
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{((stats.tokensUsed / stats.tokensLimit) * 100).toFixed(1)}% used</span>
              <span>{stats.tokensLimit.toLocaleString()} limit</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${(stats.tokensUsed / stats.tokensLimit) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex items-center gap-1 text-sm text-green-400">
              <ArrowUpRight className="w-4 h-4" />
              {stats.messagesGrowth}%
            </div>
          </div>
          <p className="text-2xl font-bold">{stats.messagesCount}</p>
          <p className="text-sm text-gray-400">AI Messages</p>
        </div>

        {/* Files Generated */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold">{stats.filesGenerated}</p>
          <p className="text-sm text-gray-400">Files Generated</p>
        </div>

        {/* Hours Active */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <p className="text-2xl font-bold">{stats.hoursActive}+</p>
          <p className="text-sm text-gray-400">Hours Saved</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Token Usage Chart */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Token Usage
            </h3>
            <span className="text-sm text-gray-400">Last 30 days</span>
          </div>
          <div className="flex items-end gap-1 h-40">
            {usageData.slice(-30).map((day, i) => {
              const height = (day.tokens / 6000) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 bg-purple-500/50 hover:bg-purple-500 rounded-t transition-colors cursor-pointer group relative"
                  style={{ height: `${Math.max(height, 5)}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    {day.tokens.toLocaleString()} tokens
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workspace Distribution */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Usage by Workspace
            </h3>
          </div>
          <div className="space-y-4">
            {workspaceUsage.map((workspace) => (
              <div key={workspace.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{workspace.name}</span>
                  <span className="text-gray-400">{workspace.tokens.toLocaleString()} tokens</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${workspace.color} rounded-full transition-all`}
                    style={{ width: `${workspace.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            Recent Activity
          </h3>
          <button className="text-sm text-purple-400 hover:text-purple-300">View all</button>
        </div>
        <div className="space-y-3">
          {recentActivity.map((activity, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activity.type === 'chat' ? 'bg-blue-500/20' : 'bg-green-500/20'
                }`}>
                  {activity.type === 'chat' ? (
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-green-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{activity.tokens.toLocaleString()}</p>
                <p className="text-xs text-gray-500">tokens</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
