'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, AlertTriangle, CheckCircle, XCircle, Clock,
  Eye, Globe, Key, Lock, Unlock, User, Monitor,
  Search, Filter, RefreshCw, Download, Settings,
  LogIn, LogOut, Ban, Trash2, Activity
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'login_success' | 'login_failed' | 'password_change' | 'api_key_created' | 'api_key_revoked' | 'suspicious_activity' | '2fa_enabled' | '2fa_disabled' | 'session_revoked';
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  location?: string;
  userAgent?: string;
  timestamp: string;
  details?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ActiveSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  ipAddress: string;
  location: string;
  device: string;
  browser: string;
  lastActive: string;
  createdAt: string;
  isCurrent?: boolean;
}

interface SecurityStats {
  securityScore: number;
  loginAttempts24h: number;
  failedLogins24h: number;
  activeSessions: number;
  suspiciousActivities: number;
  users2FAEnabled: number;
  totalUsers: number;
}

export default function AdminSecurityPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'sessions' | 'settings'>('overview');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const res = await fetch('/api/admin/security');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
        setSessions(data.sessions);
        setStats(data.stats);
      } else {
        // Demo data
        setEvents(generateDemoEvents());
        setSessions(generateDemoSessions());
        setStats({
          securityScore: 85,
          loginAttempts24h: 234,
          failedLogins24h: 12,
          activeSessions: 156,
          suspiciousActivities: 3,
          users2FAEnabled: 456,
          totalUsers: 1247,
        });
      }
    } catch {
      setEvents(generateDemoEvents());
      setSessions(generateDemoSessions());
      setStats({
        securityScore: 85,
        loginAttempts24h: 234,
        failedLogins24h: 12,
        activeSessions: 156,
        suspiciousActivities: 3,
        users2FAEnabled: 456,
        totalUsers: 1247,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDemoEvents = (): SecurityEvent[] => [
    { id: '1', type: 'login_success', userEmail: 'john@example.com', ipAddress: '192.168.1.100', location: 'New York, US', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), severity: 'low' },
    { id: '2', type: 'login_failed', userEmail: 'unknown@test.com', ipAddress: '185.234.56.78', location: 'Unknown', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), details: 'Invalid password - 3 attempts', severity: 'medium' },
    { id: '3', type: 'suspicious_activity', userEmail: 'alice@company.com', ipAddress: '45.67.89.123', location: 'Russia', timestamp: new Date(Date.now() - 30 * 60000).toISOString(), details: 'Login from unusual location', severity: 'high' },
    { id: '4', type: '2fa_enabled', userEmail: 'bob@startup.io', ipAddress: '10.0.0.50', location: 'San Francisco, US', timestamp: new Date(Date.now() - 60 * 60000).toISOString(), severity: 'low' },
    { id: '5', type: 'api_key_created', userEmail: 'dev@techcorp.com', ipAddress: '172.16.0.100', location: 'London, UK', timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(), severity: 'medium' },
    { id: '6', type: 'password_change', userEmail: 'jane@example.com', ipAddress: '192.168.2.50', location: 'Chicago, US', timestamp: new Date(Date.now() - 3 * 60 * 60000).toISOString(), severity: 'low' },
    { id: '7', type: 'login_failed', userEmail: 'admin@test.com', ipAddress: '123.45.67.89', location: 'China', timestamp: new Date(Date.now() - 4 * 60 * 60000).toISOString(), details: 'Brute force attempt detected', severity: 'critical' },
    { id: '8', type: 'session_revoked', userEmail: 'mike@dev.com', ipAddress: '192.168.1.200', location: 'Austin, US', timestamp: new Date(Date.now() - 5 * 60 * 60000).toISOString(), details: 'Admin revoked session', severity: 'medium' },
  ];

  const generateDemoSessions = (): ActiveSession[] => [
    { id: 's1', userId: 'u1', userEmail: 'john@example.com', userName: 'John Doe', ipAddress: '192.168.1.100', location: 'New York, US', device: 'Desktop', browser: 'Chrome 121', lastActive: new Date(Date.now() - 5 * 60000).toISOString(), createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(), isCurrent: true },
    { id: 's2', userId: 'u2', userEmail: 'jane@example.com', userName: 'Jane Smith', ipAddress: '10.0.0.50', location: 'San Francisco, US', device: 'MacBook', browser: 'Safari 17', lastActive: new Date(Date.now() - 15 * 60000).toISOString(), createdAt: new Date(Date.now() - 5 * 60 * 60000).toISOString() },
    { id: 's3', userId: 'u3', userEmail: 'bob@company.com', userName: 'Bob Wilson', ipAddress: '172.16.0.100', location: 'London, UK', device: 'Windows PC', browser: 'Edge 121', lastActive: new Date(Date.now() - 30 * 60000).toISOString(), createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString() },
    { id: 's4', userId: 'u4', userEmail: 'alice@startup.io', userName: 'Alice Brown', ipAddress: '192.168.2.200', location: 'Berlin, DE', device: 'iPhone', browser: 'Safari Mobile', lastActive: new Date(Date.now() - 60 * 60000).toISOString(), createdAt: new Date(Date.now() - 48 * 60 * 60000).toISOString() },
  ];

  const getEventIcon = (type: string) => {
    const icons: Record<string, any> = {
      login_success: LogIn,
      login_failed: XCircle,
      password_change: Key,
      api_key_created: Key,
      api_key_revoked: Key,
      suspicious_activity: AlertTriangle,
      '2fa_enabled': Shield,
      '2fa_disabled': Unlock,
      session_revoked: LogOut,
    };
    return icons[type] || Activity;
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      low: 'text-green-400 bg-green-500/20',
      medium: 'text-yellow-400 bg-yellow-500/20',
      high: 'text-orange-400 bg-orange-500/20',
      critical: 'text-red-400 bg-red-500/20',
    };
    return colors[severity] || colors.low;
  };

  const filteredEvents = events.filter((event) => {
    const matchesFilter = eventFilter === 'all' || event.type === eventFilter || event.severity === eventFilter;
    const matchesSearch = 
      event.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.ipAddress.includes(searchQuery) ||
      event.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleRevokeSession = (sessionId: string) => {
    console.log('Revoke session:', sessionId);
    setSessions(sessions.filter(s => s.id !== sessionId));
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Security</h1>
          <p className="text-gray-400">Monitor and manage platform security</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchSecurityData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export Logs
          </button>
        </div>
      </div>

      {/* Security Score & Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Security Score */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Security Score</span>
              <Shield className={`w-6 h-6 ${stats.securityScore >= 80 ? 'text-green-400' : stats.securityScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`} />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{stats.securityScore}</span>
              <span className="text-gray-500 mb-1">/100</span>
            </div>
            <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${stats.securityScore >= 80 ? 'bg-green-500' : stats.securityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${stats.securityScore}%` }}
              />
            </div>
          </div>

          {/* Login Stats */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Login Attempts (24h)</span>
              <LogIn className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold">{stats.loginAttempts24h}</p>
            <p className="text-sm text-red-400 mt-1">{stats.failedLogins24h} failed</p>
          </div>

          {/* Active Sessions */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">Active Sessions</span>
              <Monitor className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold">{stats.activeSessions}</p>
            <p className="text-sm text-gray-500 mt-1">{stats.suspiciousActivities} suspicious</p>
          </div>

          {/* 2FA Adoption */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400">2FA Enabled</span>
              <Lock className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold">{((stats.users2FAEnabled / stats.totalUsers) * 100).toFixed(1)}%</p>
            <p className="text-sm text-gray-500 mt-1">{stats.users2FAEnabled} of {stats.totalUsers} users</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-800">
        {[
          { id: 'overview', label: 'Overview', icon: Shield },
          { id: 'events', label: 'Security Events', icon: Activity },
          { id: 'sessions', label: 'Active Sessions', icon: Monitor },
          { id: 'settings', label: 'Security Settings', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Alerts */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Recent Alerts
            </h3>
            <div className="space-y-3">
              {events.filter(e => e.severity === 'high' || e.severity === 'critical').slice(0, 5).map((event) => {
                const Icon = getEventIcon(event.type);
                return (
                  <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                    <div className={`p-2 rounded-lg ${getSeverityColor(event.severity)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-400">{event.userEmail || event.ipAddress}</p>
                      {event.details && <p className="text-xs text-gray-500 mt-1">{event.details}</p>}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security Recommendations */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Security Recommendations
            </h3>
            <div className="space-y-3">
              {[
                { text: 'Enforce 2FA for all admin accounts', status: 'completed' },
                { text: 'Review API keys older than 90 days', status: 'pending' },
                { text: 'Update password policy requirements', status: 'pending' },
                { text: 'Enable login notifications', status: 'completed' },
                { text: 'Review suspicious IPs blocklist', status: 'pending' },
              ].map((rec, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                  {rec.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-400" />
                  )}
                  <span className={`flex-1 text-sm ${rec.status === 'completed' ? 'text-gray-500 line-through' : ''}`}>
                    {rec.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          {/* Filters */}
          <div className="p-4 border-b border-gray-800 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search by email, IP, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option value="all">All Events</option>
              <option value="login_success">Login Success</option>
              <option value="login_failed">Login Failed</option>
              <option value="suspicious_activity">Suspicious Activity</option>
              <option value="critical">Critical</option>
              <option value="high">High Severity</option>
            </select>
          </div>

          {/* Events List */}
          <div className="divide-y divide-gray-800">
            {filteredEvents.map((event) => {
              const Icon = getEventIcon(event.type);
              return (
                <div key={event.id} className="p-4 hover:bg-gray-800/50 flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${getSeverityColor(event.severity)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{event.type.replace(/_/g, ' ')}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(event.severity)}`}>
                        {event.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      {event.userEmail && <span>{event.userEmail}</span>}
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {event.ipAddress}
                      </span>
                      {event.location && <span>{event.location}</span>}
                    </div>
                    {event.details && <p className="text-sm text-gray-500 mt-1">{event.details}</p>}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Device / Browser</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Last Active</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm">
                        {session.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {session.userName}
                          {session.isCurrent && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Current</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-400">{session.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{session.device}</p>
                    <p className="text-xs text-gray-400">{session.browser}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm">{session.location}</p>
                    <p className="text-xs text-gray-400">{session.ipAddress}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(session.lastActive).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {!session.isCurrent && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded text-sm transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Authentication Settings */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="font-semibold mb-4">Authentication</h3>
            <div className="space-y-4">
              <SettingToggle 
                label="Require 2FA for admins"
                description="Force all admin accounts to enable 2FA"
                defaultChecked={true}
              />
              <SettingToggle 
                label="Require 2FA for all users"
                description="Force all users to enable 2FA"
                defaultChecked={false}
              />
              <SettingToggle 
                label="Allow social login"
                description="Allow users to sign in with Google, GitHub"
                defaultChecked={true}
              />
              <SettingToggle 
                label="Login notifications"
                description="Send email on new device login"
                defaultChecked={true}
              />
            </div>
          </div>

          {/* Password Policy */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="font-semibold mb-4">Password Policy</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Minimum length</label>
                <select className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                  <option>8 characters</option>
                  <option>10 characters</option>
                  <option>12 characters</option>
                  <option>16 characters</option>
                </select>
              </div>
              <SettingToggle 
                label="Require uppercase"
                defaultChecked={true}
              />
              <SettingToggle 
                label="Require numbers"
                defaultChecked={true}
              />
              <SettingToggle 
                label="Require special characters"
                defaultChecked={false}
              />
              <div>
                <label className="text-sm text-gray-400">Password expiry</label>
                <select className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                  <option>Never</option>
                  <option>30 days</option>
                  <option>60 days</option>
                  <option>90 days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Session Settings */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="font-semibold mb-4">Session Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Session timeout</label>
                <select className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                  <option>1 hour</option>
                  <option>4 hours</option>
                  <option>8 hours</option>
                  <option>24 hours</option>
                  <option>7 days</option>
                </select>
              </div>
              <SettingToggle 
                label="Single session only"
                description="Revoke old sessions on new login"
                defaultChecked={false}
              />
              <SettingToggle 
                label="Remember me option"
                description="Allow users to stay logged in"
                defaultChecked={true}
              />
            </div>
          </div>

          {/* IP & Rate Limiting */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="font-semibold mb-4">Rate Limiting & IP Rules</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Max login attempts</label>
                <select className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                  <option>3 attempts</option>
                  <option>5 attempts</option>
                  <option>10 attempts</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">Lockout duration</label>
                <select className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                  <option>15 minutes</option>
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>24 hours</option>
                </select>
              </div>
              <SettingToggle 
                label="Auto-block suspicious IPs"
                description="Automatically block IPs with multiple failed attempts"
                defaultChecked={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingToggle({ 
  label, 
  description, 
  defaultChecked = false 
}: { 
  label: string; 
  description?: string; 
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-sm">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-purple-500' : 'bg-gray-700'}`}
      >
        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
