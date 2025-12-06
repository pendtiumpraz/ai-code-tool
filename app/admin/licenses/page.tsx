'use client';

import { useState, useEffect } from 'react';
import { 
  Key, Plus, Copy, Check, Trash2, Edit2,
  Calendar, User, Shield, Search, Filter
} from 'lucide-react';

interface License {
  id: string;
  code: string;
  plan: string;
  assignedTo: string | null;
  assignedEmail: string | null;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  activationCount: number;
  maxActivations: number;
  createdAt: string;
  notes: string | null;
}

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Create license form state
  const [newLicense, setNewLicense] = useState({
    plan: 'pro',
    validDays: 365,
    maxActivations: 1,
    notes: '',
  });

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
    try {
      const res = await fetch('/api/admin/licenses');
      if (res.ok) {
        const data = await res.json();
        setLicenses(data.licenses);
      } else {
        // Demo data
        setLicenses([
          {
            id: '1',
            code: 'XXXX-XXXX-XXXX-XXXX',
            plan: 'enterprise',
            assignedTo: 'user123',
            assignedEmail: 'enterprise@company.com',
            validFrom: '2024-01-01',
            validUntil: '2025-01-01',
            isActive: true,
            activationCount: 1,
            maxActivations: 1,
            createdAt: '2024-01-01',
            notes: 'Annual enterprise license',
          },
          {
            id: '2',
            code: 'YYYY-YYYY-YYYY-YYYY',
            plan: 'business',
            assignedTo: null,
            assignedEmail: null,
            validFrom: '2024-02-01',
            validUntil: '2024-08-01',
            isActive: true,
            activationCount: 0,
            maxActivations: 5,
            createdAt: '2024-02-01',
            notes: 'Team license - not yet assigned',
          },
          {
            id: '3',
            code: 'ZZZZ-ZZZZ-ZZZZ-ZZZZ',
            plan: 'pro',
            assignedTo: 'user456',
            assignedEmail: 'promo@example.com',
            validFrom: '2024-01-15',
            validUntil: '2024-04-15',
            isActive: false,
            activationCount: 1,
            maxActivations: 1,
            createdAt: '2024-01-15',
            notes: 'Promotional license - expired',
          },
        ]);
      }
    } catch {
      setLicenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateLicense = async () => {
    // Create license API call
    console.log('Creating license:', newLicense);
    setShowCreateModal(false);
    // Refresh licenses
    fetchLicenses();
  };

  const handleRevokeLicense = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this license?')) return;
    // Revoke license API call
    console.log('Revoking license:', id);
    fetchLicenses();
  };

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = 
      license.code.toLowerCase().includes(search.toLowerCase()) ||
      (license.assignedEmail?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (license.notes?.toLowerCase() || '').includes(search.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'active' && license.isActive) ||
      (statusFilter === 'inactive' && !license.isActive) ||
      (statusFilter === 'unassigned' && !license.assignedTo);
    
    return matchesSearch && matchesStatus;
  });

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-yellow-500/20 text-yellow-400';
      case 'business': return 'bg-blue-500/20 text-blue-400';
      case 'pro': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">License Management</h1>
          <p className="text-gray-400">Create and manage license keys for enterprise users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create License
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-2xl font-bold">{licenses.length}</p>
          <p className="text-gray-400 text-sm">Total Licenses</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-2xl font-bold text-green-400">
            {licenses.filter(l => l.isActive).length}
          </p>
          <p className="text-gray-400 text-sm">Active</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-2xl font-bold text-blue-400">
            {licenses.filter(l => !l.assignedTo).length}
          </p>
          <p className="text-gray-400 text-sm">Unassigned</p>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-2xl font-bold text-red-400">
            {licenses.filter(l => !l.isActive).length}
          </p>
          <p className="text-gray-400 text-sm">Expired/Revoked</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search licenses..."
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
          <option value="inactive">Expired/Revoked</option>
          <option value="unassigned">Unassigned</option>
        </select>
      </div>

      {/* Licenses List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center text-gray-500">
            Loading...
          </div>
        ) : filteredLicenses.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center text-gray-500">
            No licenses found
          </div>
        ) : (
          filteredLicenses.map((license) => (
            <div
              key={license.id}
              className={`bg-gray-900 rounded-xl border ${
                license.isActive ? 'border-gray-800' : 'border-red-500/30'
              } p-6`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    license.isActive ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <Key className={`w-6 h-6 ${license.isActive ? 'text-green-400' : 'text-red-400'}`} />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <code className="px-3 py-1 bg-gray-800 rounded font-mono text-sm">
                        {license.code}
                      </code>
                      <button
                        onClick={() => handleCopyCode(license.code)}
                        className="p-1 hover:bg-gray-800 rounded transition-colors"
                      >
                        {copiedCode === license.code ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeColor(license.plan)}`}>
                        {license.plan}
                      </span>
                      {!license.isActive && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      {license.assignedTo ? (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {license.assignedEmail}
                        </div>
                      ) : (
                        <span className="text-yellow-400">Not assigned</span>
                      )}
                      
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {license.validUntil 
                          ? `Valid until ${new Date(license.validUntil).toLocaleDateString()}`
                          : 'No expiry'
                        }
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        {license.activationCount}/{license.maxActivations} activations
                      </div>
                    </div>
                    
                    {license.notes && (
                      <p className="mt-2 text-sm text-gray-500">{license.notes}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleRevokeLicense(license.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create License Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-md">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold">Create New License</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Plan</label>
                <select
                  value={newLicense.plan}
                  onChange={(e) => setNewLicense({ ...newLicense, plan: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="pro">Pro</option>
                  <option value="business">Business</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Valid For (Days)</label>
                <input
                  type="number"
                  value={newLicense.validDays}
                  onChange={(e) => setNewLicense({ ...newLicense, validDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Max Activations</label>
                <input
                  type="number"
                  value={newLicense.maxActivations}
                  onChange={(e) => setNewLicense({ ...newLicense, maxActivations: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Notes</label>
                <textarea
                  value={newLicense.notes}
                  onChange={(e) => setNewLicense({ ...newLicense, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateLicense}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
              >
                Create License
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
