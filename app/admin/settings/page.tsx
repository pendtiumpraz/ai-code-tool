'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, Save, Upload, Globe, Mail, Bell, 
  Database, Cpu, Shield, Palette, Code, Zap,
  Server, HardDrive, RefreshCw, AlertTriangle,
  CheckCircle, Info, ExternalLink
} from 'lucide-react';

interface SystemInfo {
  version: string;
  nodeVersion: string;
  database: string;
  storage: { used: number; total: number };
  uptime: string;
  lastBackup: string;
  stats: { users: number; projects: number };
}

const defaultSettings = {
  general: {
    appName: 'AI Code Studio',
    appUrl: 'https://aicodestudio.com',
    supportEmail: 'support@aicodestudio.com',
    logo: '/logo.png',
    favicon: '/favicon.ico',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
  },
  email: {
    provider: 'smtp',
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromName: 'AI Code Studio',
    fromEmail: 'noreply@aicodestudio.com',
  },
  ai: {
    defaultModel: 'glm-4-plus',
    maxTokensPerRequest: 4096,
    enableCodeExecution: true,
    enableToolCalling: true,
    rateLimit: 100,
    rateLimitWindow: 60,
  },
  advanced: {
    debugMode: false,
    logLevel: 'info',
    cacheEnabled: true,
    cacheTTL: 3600,
    corsOrigins: '*',
    maxUploadSize: 10,
  },
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'ai' | 'advanced' | 'system'>('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(defaultSettings);
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    version: '1.0.0',
    nodeVersion: '20.10.0',
    database: 'PostgreSQL 15',
    storage: { used: 0, total: 100 },
    uptime: '0',
    lastBackup: '-',
    stats: { users: 0, projects: 0 },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.systemInfo) setSystemInfo(data.systemInfo);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: activeTab, settings: settings[activeTab as keyof typeof settings] }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value,
      },
    }));
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
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-400">Configure platform settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-lg transition-colors"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-gray-800 overflow-x-auto">
        {[
          { id: 'general', label: 'General', icon: Settings },
          { id: 'email', label: 'Email', icon: Mail },
          { id: 'ai', label: 'AI Configuration', icon: Cpu },
          { id: 'advanced', label: 'Advanced', icon: Code },
          { id: 'system', label: 'System Info', icon: Server },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 whitespace-nowrap transition-colors ${
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
      <div className="max-w-4xl">
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* App Identity */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                App Identity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">App Name</label>
                  <input
                    type="text"
                    value={settings.general.appName}
                    onChange={(e) => updateSetting('general', 'appName', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">App URL</label>
                  <input
                    type="text"
                    value={settings.general.appUrl}
                    onChange={(e) => updateSetting('general', 'appUrl', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Branding */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                Branding
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Logo</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                      <Settings className="w-8 h-8 text-gray-600" />
                    </div>
                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Favicon</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                      <Settings className="w-6 h-6 text-gray-600" />
                    </div>
                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Upload
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Registration */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-400" />
                Registration & Access
              </h3>
              <div className="space-y-4">
                <ToggleSetting
                  label="Maintenance Mode"
                  description="Disable access for non-admin users"
                  checked={settings.general.maintenanceMode}
                  onChange={(v) => updateSetting('general', 'maintenanceMode', v)}
                  warning
                />
                <ToggleSetting
                  label="Allow Registration"
                  description="Allow new users to create accounts"
                  checked={settings.general.allowRegistration}
                  onChange={(v) => updateSetting('general', 'allowRegistration', v)}
                />
                <ToggleSetting
                  label="Require Email Verification"
                  description="Users must verify email before access"
                  checked={settings.general.requireEmailVerification}
                  onChange={(v) => updateSetting('general', 'requireEmailVerification', v)}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-400" />
                Email Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email Provider</label>
                  <select
                    value={settings.email.provider}
                    onChange={(e) => updateSetting('email', 'provider', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  >
                    <option value="smtp">SMTP</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                    <option value="ses">Amazon SES</option>
                  </select>
                </div>

                {settings.email.provider === 'smtp' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">SMTP Host</label>
                        <input
                          type="text"
                          value={settings.email.smtpHost}
                          onChange={(e) => updateSetting('email', 'smtpHost', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">SMTP Port</label>
                        <input
                          type="text"
                          value={settings.email.smtpPort}
                          onChange={(e) => updateSetting('email', 'smtpPort', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">SMTP Username</label>
                        <input
                          type="text"
                          value={settings.email.smtpUser}
                          onChange={(e) => updateSetting('email', 'smtpUser', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">SMTP Password</label>
                        <input
                          type="password"
                          value={settings.email.smtpPassword}
                          onChange={(e) => updateSetting('email', 'smtpPassword', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">From Name</label>
                    <input
                      type="text"
                      value={settings.email.fromName}
                      onChange={(e) => updateSetting('email', 'fromName', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">From Email</label>
                    <input
                      type="email"
                      value={settings.email.fromEmail}
                      onChange={(e) => updateSetting('email', 'fromEmail', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm">
                    Send Test Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                AI Model Configuration
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Default Model</label>
                  <select
                    value={settings.ai.defaultModel}
                    onChange={(e) => updateSetting('ai', 'defaultModel', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  >
                    <option value="glm-4-plus">GLM-4 Plus (Recommended)</option>
                    <option value="glm-4">GLM-4</option>
                    <option value="glm-4-flash">GLM-4 Flash (Fast)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Tokens per Request</label>
                  <input
                    type="number"
                    value={settings.ai.maxTokensPerRequest}
                    onChange={(e) => updateSetting('ai', 'maxTokensPerRequest', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>

                <ToggleSetting
                  label="Enable Code Execution"
                  description="Allow AI to execute code in sandbox"
                  checked={settings.ai.enableCodeExecution}
                  onChange={(v) => updateSetting('ai', 'enableCodeExecution', v)}
                />

                <ToggleSetting
                  label="Enable Tool Calling"
                  description="Allow AI to use tools (search, create files, etc)"
                  checked={settings.ai.enableToolCalling}
                  onChange={(v) => updateSetting('ai', 'enableToolCalling', v)}
                />
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Rate Limiting
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Requests per Window</label>
                  <input
                    type="number"
                    value={settings.ai.rateLimit}
                    onChange={(e) => updateSetting('ai', 'rateLimit', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Window (seconds)</label>
                  <input
                    type="number"
                    value={settings.ai.rateLimitWindow}
                    onChange={(e) => updateSetting('ai', 'rateLimitWindow', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-400">Advanced Settings</p>
                <p className="text-sm text-gray-400">
                  Changing these settings may affect system stability. Proceed with caution.
                </p>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="font-semibold mb-4">Debug & Logging</h3>
              <div className="space-y-4">
                <ToggleSetting
                  label="Debug Mode"
                  description="Enable detailed error messages"
                  checked={settings.advanced.debugMode}
                  onChange={(v) => updateSetting('advanced', 'debugMode', v)}
                  warning
                />
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Log Level</label>
                  <select
                    value={settings.advanced.logLevel}
                    onChange={(e) => updateSetting('advanced', 'logLevel', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="font-semibold mb-4">Cache</h3>
              <div className="space-y-4">
                <ToggleSetting
                  label="Enable Cache"
                  description="Cache API responses for better performance"
                  checked={settings.advanced.cacheEnabled}
                  onChange={(v) => updateSetting('advanced', 'cacheEnabled', v)}
                />
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Cache TTL (seconds)</label>
                  <input
                    type="number"
                    value={settings.advanced.cacheTTL}
                    onChange={(e) => updateSetting('advanced', 'cacheTTL', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>
                <button className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm">
                  Clear Cache
                </button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="font-semibold mb-4">Security & CORS</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">CORS Origins</label>
                  <input
                    type="text"
                    value={settings.advanced.corsOrigins}
                    onChange={(e) => updateSetting('advanced', 'corsOrigins', e.target.value)}
                    placeholder="* or https://example.com"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Use * for all origins or comma-separated domains</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Upload Size (MB)</label>
                  <input
                    type="number"
                    value={settings.advanced.maxUploadSize}
                    onChange={(e) => updateSetting('advanced', 'maxUploadSize', parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-400" />
                System Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="Version" value={systemInfo.version} />
                <InfoItem label="Node.js" value={systemInfo.nodeVersion} />
                <InfoItem label="Database" value={systemInfo.database} />
                <InfoItem label="Uptime" value={systemInfo.uptime} />
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-green-400" />
                Storage
              </h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Used</span>
                  <span>{systemInfo.storage.used} GB / {systemInfo.storage.total} GB</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                    style={{ width: `${(systemInfo.storage.used / systemInfo.storage.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-400" />
                Backup & Restore
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Last Backup</p>
                    <p className="text-sm text-gray-400">{systemInfo.lastBackup}</p>
                  </div>
                  <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm">
                    Create Backup
                  </button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div>
                    <p className="font-medium">Restore from Backup</p>
                    <p className="text-sm text-gray-400">Upload a backup file to restore</p>
                  </div>
                  <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Restart Server
                </button>
                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Run Migrations
                </button>
                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View Logs
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleSetting({ 
  label, 
  description, 
  checked, 
  onChange,
  warning = false
}: { 
  label: string; 
  description?: string; 
  checked: boolean;
  onChange: (value: boolean) => void;
  warning?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className={`font-medium text-sm ${warning && checked ? 'text-yellow-400' : ''}`}>{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors ${
          checked 
            ? warning ? 'bg-yellow-500' : 'bg-purple-500' 
            : 'bg-gray-700'
        }`}
      >
        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
