'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Filter, MoreHorizontal, Mail, Shield,
  Ban, Trash2, Edit2, Eye, Download, UserPlus,
  Clock, AlertCircle, CheckCircle
} from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  plan: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
  tokensUsed: number;
  subscriptionEndDate?: string;
  trialEndDate?: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      } else {
        // Demo data
        setUsers([
          { id: '1', name: 'John Doe', email: 'john@example.com', role: 'USER', plan: 'pro', status: 'active', createdAt: '2024-01-15', tokensUsed: 45000, subscriptionEndDate: '2025-01-15' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'USER', plan: 'business', status: 'active', createdAt: '2024-01-10', tokensUsed: 120000, subscriptionEndDate: '2025-03-10' },
          { id: '3', name: 'Bob Wilson', email: 'bob@company.com', role: 'ADMIN', plan: 'enterprise', status: 'active', createdAt: '2023-12-20', tokensUsed: 500000, subscriptionEndDate: '2025-12-20' },
          { id: '4', name: 'Alice Brown', email: 'alice@startup.io', role: 'USER', plan: 'starter', status: 'trial', createdAt: '2024-02-01', tokensUsed: 5000, trialEndDate: '2024-12-15' },
          { id: '5', name: null, email: 'guest@test.com', role: 'USER', plan: 'free', status: 'active', createdAt: '2024-02-05', tokensUsed: 1000 },
          { id: '6', name: 'Mike Johnson', email: 'mike@dev.com', role: 'USER', plan: 'pro', status: 'expired', createdAt: '2023-06-15', tokensUsed: 85000, subscriptionEndDate: '2024-06-15' },
        ]);
      }
    } catch {
      // Demo data fallback
      setUsers([
        { id: '1', name: 'John Doe', email: 'john@example.com', role: 'USER', plan: 'pro', status: 'active', createdAt: '2024-01-15', tokensUsed: 45000, subscriptionEndDate: '2025-01-15' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'USER', plan: 'business', status: 'active', createdAt: '2024-01-10', tokensUsed: 120000, subscriptionEndDate: '2025-03-10' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      (user.name?.toLowerCase() || '').includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesPlan = planFilter === 'all' || user.plan === planFilter;
    return matchesSearch && matchesRole && matchesPlan;
  });

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAction = async (action: string, userId: string) => {
    setShowActionMenu(null);
    // Implement actions
    console.log(`Action: ${action} on user: ${userId}`);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-500/20 text-red-400';
      case 'ADMIN': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-yellow-500/20 text-yellow-400';
      case 'business': return 'bg-blue-500/20 text-blue-400';
      case 'pro': return 'bg-purple-500/20 text-purple-400';
      case 'starter': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'trial': return 'bg-blue-500/20 text-blue-400';
      case 'suspended': return 'bg-red-500/20 text-red-400';
      case 'expired': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getSubscriptionDays = (user: User): { days: number; type: 'subscription' | 'trial' | 'none' | 'expired' } => {
    const now = new Date();
    
    if (user.trialEndDate) {
      const trialEnd = new Date(user.trialEndDate);
      const days = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { days: Math.max(0, days), type: days > 0 ? 'trial' : 'expired' };
    }
    
    if (user.subscriptionEndDate) {
      const subEnd = new Date(user.subscriptionEndDate);
      const days = Math.ceil((subEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { days: Math.max(0, days), type: days > 0 ? 'subscription' : 'expired' };
    }
    
    if (user.plan === 'free') {
      return { days: -1, type: 'none' };
    }
    
    return { days: 0, type: 'none' };
  };

  const getSubscriptionColor = (days: number, type: string): string => {
    if (type === 'none') return 'text-gray-500';
    if (type === 'expired' || days <= 0) return 'text-red-400';
    if (days <= 7) return 'text-red-400';
    if (days <= 14) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getProgressBarColor = (days: number, type: string): string => {
    if (type === 'none' || type === 'expired' || days <= 0) return 'bg-gray-600';
    if (days <= 7) return 'bg-red-500';
    if (days <= 14) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-gray-400">Manage user accounts and permissions</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors">
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Roles</option>
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
          <option value="enterprise">Enterprise</option>
        </select>

        <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Selected Actions */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <span className="text-purple-400">{selectedUsers.length} selected</span>
          <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm">
            Change Plan
          </button>
          <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm">
            Send Email
          </button>
          <button className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm">
            Suspend
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-600"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Plan</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Subscription</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Tokens Used</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Joined</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        className="rounded border-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm">
                          {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.name || 'No name'}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(user.plan)}`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const { days, type } = getSubscriptionDays(user);
                        const color = getSubscriptionColor(days, type);
                        const barColor = getProgressBarColor(days, type);
                        
                        if (type === 'none') {
                          return (
                            <span className="text-gray-500 text-sm">No subscription</span>
                          );
                        }
                        
                        if (type === 'expired' || days <= 0) {
                          return (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              <span className="text-red-400 text-sm font-medium">Expired</span>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="min-w-[120px]">
                            <div className="flex items-center gap-2 mb-1">
                              {type === 'trial' ? (
                                <Clock className="w-4 h-4 text-blue-400" />
                              ) : (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              )}
                              <span className={`text-sm font-medium ${color}`}>
                                {days} days left
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${barColor} rounded-full transition-all`}
                                style={{ width: `${Math.min(100, (days / 30) * 100)}%` }}
                              />
                            </div>
                            {type === 'trial' && (
                              <span className="text-xs text-blue-400 mt-0.5">Trial</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {user.tokensUsed.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        
                        {showActionMenu === user.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setShowActionMenu(null)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20">
                              <button
                                onClick={() => handleAction('view', user.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-700 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </button>
                              <button
                                onClick={() => handleAction('edit', user.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-700 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit User
                              </button>
                              <button
                                onClick={() => handleAction('email', user.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-700 transition-colors"
                              >
                                <Mail className="w-4 h-4" />
                                Send Email
                              </button>
                              <button
                                onClick={() => handleAction('role', user.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-700 transition-colors"
                              >
                                <Shield className="w-4 h-4" />
                                Change Role
                              </button>
                              <div className="border-t border-gray-700 my-1" />
                              <button
                                onClick={() => handleAction('suspend', user.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-700 text-yellow-400 transition-colors"
                              >
                                <Ban className="w-4 h-4" />
                                Suspend
                              </button>
                              <button
                                onClick={() => handleAction('delete', user.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-700 text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
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
            Showing {filteredUsers.length} of {users.length} users
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
