'use client';

import { useState, useEffect } from 'react';
import { 
  Users, CreditCard, Zap, HardDrive,
  TrendingUp, TrendingDown, Activity,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalTokensUsed: number;
  totalStorage: number;
  newUsersToday: number;
  revenueThisMonth: number;
  userGrowth: number;
  revenueGrowth: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stats from API
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          // Demo data
          setStats({
            totalUsers: 1247,
            activeSubscriptions: 312,
            totalTokensUsed: 45678900,
            totalStorage: 2048,
            newUsersToday: 23,
            revenueThisMonth: 8940,
            userGrowth: 12.5,
            revenueGrowth: 8.3,
          });
        }
      } catch {
        // Demo data
        setStats({
          totalUsers: 1247,
          activeSubscriptions: 312,
          totalTokensUsed: 45678900,
          totalStorage: 2048,
          newUsersToday: 23,
          revenueThisMonth: 8940,
          userGrowth: 12.5,
          revenueGrowth: 8.3,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-gray-400">Monitor your platform metrics and performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${stats!.userGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats!.userGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(stats!.userGrowth)}%
            </div>
          </div>
          <p className="text-3xl font-bold">{formatNumber(stats!.totalUsers)}</p>
          <p className="text-gray-400 text-sm">Total Users</p>
          <p className="text-gray-500 text-xs mt-2">+{stats!.newUsersToday} today</p>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold">{stats!.activeSubscriptions}</p>
          <p className="text-gray-400 text-sm">Active Subscriptions</p>
          <p className="text-gray-500 text-xs mt-2">
            {((stats!.activeSubscriptions / stats!.totalUsers) * 100).toFixed(1)}% conversion
          </p>
        </div>

        {/* Tokens Used */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <p className="text-3xl font-bold">{formatNumber(stats!.totalTokensUsed)}</p>
          <p className="text-gray-400 text-sm">Tokens Used (This Month)</p>
        </div>

        {/* Revenue */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${stats!.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {stats!.revenueGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(stats!.revenueGrowth)}%
            </div>
          </div>
          <p className="text-3xl font-bold">${formatNumber(stats!.revenueThisMonth)}</p>
          <p className="text-gray-400 text-sm">Revenue (This Month)</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth Chart Placeholder */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="font-bold mb-4">User Growth</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <Activity className="w-12 h-12 opacity-20" />
          </div>
        </div>

        {/* Revenue Chart Placeholder */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="font-bold mb-4">Revenue</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <TrendingUp className="w-12 h-12 opacity-20" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="font-bold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[
            { action: 'New user registered', user: 'john@example.com', time: '5 minutes ago' },
            { action: 'Subscription upgraded', user: 'jane@example.com', time: '15 minutes ago' },
            { action: 'License activated', user: 'bob@company.com', time: '1 hour ago' },
            { action: 'New user registered', user: 'alice@startup.io', time: '2 hours ago' },
            { action: 'Subscription cancelled', user: 'test@demo.com', time: '3 hours ago' },
          ].map((activity, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
              <div>
                <p className="font-medium">{activity.action}</p>
                <p className="text-sm text-gray-400">{activity.user}</p>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
