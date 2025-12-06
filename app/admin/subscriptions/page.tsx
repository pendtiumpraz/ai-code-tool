'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Filter, MoreHorizontal, CreditCard, Calendar,
  DollarSign, TrendingUp, Users, AlertCircle, CheckCircle,
  XCircle, Clock, Download, Plus, RefreshCw, Eye, Ban, Mail
} from 'lucide-react';

interface Subscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial' | 'past_due';
  amount: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  nextBillingDate?: string;
  cancelledAt?: string;
  trialEndsAt?: string;
}

interface SubscriptionStats {
  totalActive: number;
  totalRevenue: number;
  mrr: number;
  arr: number;
  churnRate: number;
  newThisMonth: number;
  cancelledThisMonth: number;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/admin/subscriptions');
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions);
        setStats(data.stats);
      } else {
        // Demo data
        setSubscriptions(generateDemoSubscriptions());
        setStats({
          totalActive: 312,
          totalRevenue: 45680,
          mrr: 8940,
          arr: 107280,
          churnRate: 2.3,
          newThisMonth: 45,
          cancelledThisMonth: 8,
        });
      }
    } catch {
      setSubscriptions(generateDemoSubscriptions());
      setStats({
        totalActive: 312,
        totalRevenue: 45680,
        mrr: 8940,
        arr: 107280,
        churnRate: 2.3,
        newThisMonth: 45,
        cancelledThisMonth: 8,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDemoSubscriptions = (): Subscription[] => [
    {
      id: 'sub_1',
      userId: 'user_1',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      plan: 'Pro',
      status: 'active',
      amount: 29,
      currency: 'USD',
      interval: 'monthly',
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      nextBillingDate: '2024-03-15',
    },
    {
      id: 'sub_2',
      userId: 'user_2',
      userName: 'Jane Smith',
      userEmail: 'jane@company.com',
      plan: 'Business',
      status: 'active',
      amount: 99,
      currency: 'USD',
      interval: 'monthly',
      startDate: '2024-01-10',
      endDate: '2025-01-10',
      nextBillingDate: '2024-03-10',
    },
    {
      id: 'sub_3',
      userId: 'user_3',
      userName: 'TechCorp Inc',
      userEmail: 'billing@techcorp.com',
      plan: 'Enterprise',
      status: 'active',
      amount: 499,
      currency: 'USD',
      interval: 'monthly',
      startDate: '2023-12-01',
      endDate: '2024-12-01',
      nextBillingDate: '2024-03-01',
    },
    {
      id: 'sub_4',
      userId: 'user_4',
      userName: 'Alice Brown',
      userEmail: 'alice@startup.io',
      plan: 'Starter',
      status: 'trial',
      amount: 9,
      currency: 'USD',
      interval: 'monthly',
      startDate: '2024-02-20',
      endDate: '2024-03-20',
      trialEndsAt: '2024-03-06',
    },
    {
      id: 'sub_5',
      userId: 'user_5',
      userName: 'Bob Wilson',
      userEmail: 'bob@freelance.com',
      plan: 'Pro',
      status: 'cancelled',
      amount: 29,
      currency: 'USD',
      interval: 'monthly',
      startDate: '2023-10-15',
      endDate: '2024-02-15',
      cancelledAt: '2024-01-20',
    },
    {
      id: 'sub_6',
      userId: 'user_6',
      userName: 'StartupXYZ',
      userEmail: 'team@startupxyz.io',
      plan: 'Business',
      status: 'past_due',
      amount: 99,
      currency: 'USD',
      interval: 'monthly',
      startDate: '2024-01-05',
      endDate: '2025-01-05',
      nextBillingDate: '2024-02-05',
    },
    {
      id: 'sub_7',
      userId: 'user_7',
      userName: 'Mike Johnson',
      userEmail: 'mike@dev.com',
      plan: 'Pro',
      status: 'expired',
      amount: 290,
      currency: 'USD',
      interval: 'yearly',
      startDate: '2023-02-10',
      endDate: '2024-02-10',
    },
  ];

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = 
      sub.userName.toLowerCase().includes(search.toLowerCase()) ||
      sub.userEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesPlan = planFilter === 'all' || sub.plan.toLowerCase() === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { color: string; icon: any }> = {
      active: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
      trial: { color: 'bg-blue-500/20 text-blue-400', icon: Clock },
      cancelled: { color: 'bg-gray-500/20 text-gray-400', icon: XCircle },
      expired: { color: 'bg-red-500/20 text-red-400', icon: XCircle },
      past_due: { color: 'bg-yellow-500/20 text-yellow-400', icon: AlertCircle },
    };
    const badge = badges[status] || badges.active;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      Starter: 'bg-gray-500/20 text-gray-400',
      Pro: 'bg-purple-500/20 text-purple-400',
      Business: 'bg-blue-500/20 text-blue-400',
      Enterprise: 'bg-yellow-500/20 text-yellow-400',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[plan] || colors.Starter}`}>
        {plan}
      </span>
    );
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const handleAction = (action: string, subId: string) => {
    setShowActionMenu(null);
    console.log(`Action: ${action} on subscription: ${subId}`);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-gray-400">Manage subscription plans and billing</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Add Subscription
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-gray-400">Active</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalActive}</p>
            <p className="text-sm text-green-400 mt-1">+{stats.newThisMonth} this month</p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-gray-400">MRR</span>
            </div>
            <p className="text-3xl font-bold">${stats.mrr.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Monthly Recurring Revenue</p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-gray-400">ARR</span>
            </div>
            <p className="text-3xl font-bold">${stats.arr.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Annual Recurring Revenue</p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-gray-400">Churn Rate</span>
            </div>
            <p className="text-3xl font-bold">{stats.churnRate}%</p>
            <p className="text-sm text-gray-500 mt-1">{stats.cancelledThisMonth} cancelled this month</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
          <option value="past_due">Past Due</option>
        </select>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Plans</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Plan</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Period</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Next Billing</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm">
                          {sub.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{sub.userName}</p>
                          <p className="text-sm text-gray-400">{sub.userEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getPlanBadge(sub.plan)}</td>
                    <td className="px-4 py-3">{getStatusBadge(sub.status)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">${sub.amount}</span>
                      <span className="text-gray-500">/{sub.interval === 'monthly' ? 'mo' : 'yr'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      <div className="text-sm">
                        {new Date(sub.startDate).toLocaleDateString()} - 
                        {new Date(sub.endDate).toLocaleDateString()}
                      </div>
                      {sub.status === 'active' && (
                        <div className="text-xs text-green-400">
                          {getDaysRemaining(sub.endDate)} days remaining
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {sub.nextBillingDate ? (
                        <div>
                          <div className="text-sm">{new Date(sub.nextBillingDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            in {getDaysRemaining(sub.nextBillingDate)} days
                          </div>
                        </div>
                      ) : sub.trialEndsAt ? (
                        <div>
                          <div className="text-sm text-blue-400">Trial ends</div>
                          <div className="text-xs">{new Date(sub.trialEndsAt).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === sub.id ? null : sub.id)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {showActionMenu === sub.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowActionMenu(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
                              <button
                                onClick={() => handleAction('view', sub.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-700 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => handleAction('email', sub.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-700 transition-colors"
                              >
                                <Mail className="w-4 h-4" />
                                Send Invoice
                              </button>
                              {sub.status === 'active' && (
                                <button
                                  onClick={() => handleAction('cancel', sub.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-700 text-red-400 transition-colors"
                                >
                                  <Ban className="w-4 h-4" />
                                  Cancel Subscription
                                </button>
                              )}
                              {(sub.status === 'cancelled' || sub.status === 'expired') && (
                                <button
                                  onClick={() => handleAction('reactivate', sub.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-700 text-green-400 transition-colors"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  Reactivate
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <p className="text-sm text-gray-400">
            Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm disabled:opacity-50" disabled>
              Previous
            </button>
            <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm disabled:opacity-50" disabled>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
