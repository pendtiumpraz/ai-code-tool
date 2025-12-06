'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Users, Zap, DollarSign,
  Calendar, Download, Filter, RefreshCw, ArrowUpRight,
  ArrowDownRight, Activity, PieChart, Target
} from 'lucide-react';

interface AnalyticsData {
  userGrowth: { date: string; users: number; newUsers: number }[];
  revenue: { date: string; amount: number; subscriptions: number }[];
  tokenUsage: { date: string; tokens: number }[];
  planDistribution: { plan: string; count: number; percentage: number }[];
  topUsers: { id: string; name: string; email: string; tokensUsed: number; plan: string }[];
  metrics: {
    totalUsers: number;
    activeUsers: number;
    newUsersThisMonth: number;
    userGrowthRate: number;
    totalRevenue: number;
    revenueGrowthRate: number;
    avgTokensPerUser: number;
    conversionRate: number;
  };
}

type DateRange = '7d' | '30d' | '90d' | '1y';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${dateRange}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        // Demo data
        setData(generateDemoData());
      }
    } catch {
      setData(generateDemoData());
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const generateDemoData = (): AnalyticsData => {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    
    return {
      userGrowth: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        users: 1000 + Math.floor(Math.random() * 500) + i * 10,
        newUsers: Math.floor(Math.random() * 50) + 10,
      })),
      revenue: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: 5000 + Math.floor(Math.random() * 3000) + i * 50,
        subscriptions: Math.floor(Math.random() * 20) + 5,
      })),
      tokenUsage: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tokens: 100000 + Math.floor(Math.random() * 50000),
      })),
      planDistribution: [
        { plan: 'Free', count: 850, percentage: 55 },
        { plan: 'Starter', count: 320, percentage: 21 },
        { plan: 'Pro', count: 250, percentage: 16 },
        { plan: 'Business', count: 95, percentage: 6 },
        { plan: 'Enterprise', count: 32, percentage: 2 },
      ],
      topUsers: [
        { id: '1', name: 'TechCorp Inc', email: 'admin@techcorp.com', tokensUsed: 2500000, plan: 'Enterprise' },
        { id: '2', name: 'StartupXYZ', email: 'dev@startupxyz.io', tokensUsed: 1800000, plan: 'Business' },
        { id: '3', name: 'Jane Developer', email: 'jane@dev.com', tokensUsed: 950000, plan: 'Pro' },
        { id: '4', name: 'Code Agency', email: 'team@codeagency.com', tokensUsed: 720000, plan: 'Business' },
        { id: '5', name: 'John Smith', email: 'john@example.com', tokensUsed: 450000, plan: 'Pro' },
      ],
      metrics: {
        totalUsers: 1547,
        activeUsers: 892,
        newUsersThisMonth: 234,
        userGrowthRate: 12.5,
        totalRevenue: 45680,
        revenueGrowthRate: 8.3,
        avgTokensPerUser: 35420,
        conversionRate: 25.4,
      },
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-gray-400">Monitor platform metrics and user behavior</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex items-center bg-gray-800 rounded-lg p-1">
            {(['7d', '30d', '90d', '1y'] as DateRange[]).map((range) => (
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
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Users"
          value={data.metrics.totalUsers.toLocaleString()}
          change={data.metrics.userGrowthRate}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Active Users"
          value={data.metrics.activeUsers.toLocaleString()}
          subtitle={`${((data.metrics.activeUsers / data.metrics.totalUsers) * 100).toFixed(1)}% of total`}
          icon={Activity}
          color="green"
        />
        <MetricCard
          title="Revenue"
          value={`$${data.metrics.totalRevenue.toLocaleString()}`}
          change={data.metrics.revenueGrowthRate}
          icon={DollarSign}
          color="yellow"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${data.metrics.conversionRate}%`}
          subtitle="Free to paid"
          icon={Target}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth Chart */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              User Growth
            </h3>
            <span className="text-sm text-gray-400">
              +{data.metrics.newUsersThisMonth} this month
            </span>
          </div>
          <SimpleBarChart 
            data={data.userGrowth.slice(-14)} 
            dataKey="users" 
            color="#3b82f6"
          />
        </div>

        {/* Revenue Chart */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              Revenue
            </h3>
            <span className="text-sm text-gray-400">
              ${data.revenue.slice(-30).reduce((a, b) => a + b.amount, 0).toLocaleString()} total
            </span>
          </div>
          <SimpleBarChart 
            data={data.revenue.slice(-14)} 
            dataKey="amount" 
            color="#eab308"
          />
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Token Usage */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Token Usage
            </h3>
          </div>
          <SimpleBarChart 
            data={data.tokenUsage.slice(-14)} 
            dataKey="tokens" 
            color="#a855f7"
          />
        </div>

        {/* Plan Distribution */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <PieChart className="w-5 h-5 text-green-400" />
              Plan Distribution
            </h3>
          </div>
          <div className="space-y-3">
            {data.planDistribution.map((item) => (
              <div key={item.plan}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{item.plan}</span>
                  <span className="text-gray-400">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Users */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Top Users by Usage
            </h3>
          </div>
          <div className="space-y-3">
            {data.topUsers.map((user, i) => (
              <div key={user.id} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-xs font-medium">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatNumber(user.tokensUsed)}</p>
                  <p className="text-xs text-gray-500">{user.plan}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
          <p className="text-3xl font-bold text-blue-400">{data.metrics.newUsersThisMonth}</p>
          <p className="text-sm text-gray-400 mt-1">New Users This Month</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
          <p className="text-3xl font-bold text-green-400">{formatNumber(data.metrics.avgTokensPerUser)}</p>
          <p className="text-sm text-gray-400 mt-1">Avg Tokens/User</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
          <p className="text-3xl font-bold text-yellow-400">
            ${(data.metrics.totalRevenue / data.metrics.activeUsers).toFixed(2)}
          </p>
          <p className="text-sm text-gray-400 mt-1">Revenue/Active User</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
          <p className="text-3xl font-bold text-purple-400">
            {((data.metrics.activeUsers / data.metrics.totalUsers) * 100).toFixed(1)}%
          </p>
          <p className="text-sm text-gray-400 mt-1">User Engagement</p>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  change, 
  subtitle,
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string; 
  change?: number;
  subtitle?: string;
  icon: any; 
  color: 'blue' | 'green' | 'yellow' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-gray-400 text-sm mt-1">{subtitle || title}</p>
    </div>
  );
}

// Simple Bar Chart Component (using divs)
function SimpleBarChart({ 
  data, 
  dataKey, 
  color 
}: { 
  data: any[]; 
  dataKey: string; 
  color: string;
}) {
  const maxValue = Math.max(...data.map(d => d[dataKey]));
  
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((item, i) => {
        const height = (item[dataKey] / maxValue) * 100;
        return (
          <div 
            key={i} 
            className="flex-1 rounded-t transition-all hover:opacity-80 cursor-pointer group relative"
            style={{ 
              height: `${height}%`, 
              backgroundColor: color,
              minWidth: '8px'
            }}
            title={`${item.date}: ${item[dataKey].toLocaleString()}`}
          >
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {item[dataKey].toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
