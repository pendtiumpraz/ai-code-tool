'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  User, Mail, Lock, Bell, Palette, Globe,
  Shield, Key, Trash2, Save, Camera, Check,
  Eye, EyeOff, Smartphone, Monitor
} from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'appearance' | 'security'>('profile');
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [profile, setProfile] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    bio: 'Full-stack developer passionate about AI and automation.',
    company: 'Tech Startup Inc.',
    location: 'San Francisco, CA',
    website: 'https://example.com',
  });

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    projectAlerts: true,
    weeklyDigest: false,
    marketingEmails: false,
    securityAlerts: true,
    newFeatures: true,
  });

  const [appearance, setAppearance] = useState({
    theme: 'dark',
    fontSize: 'medium',
    compactMode: false,
    animationsEnabled: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-400">Manage your account preferences</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition-colors"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-2xl">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Profile Picture</h3>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center text-2xl font-bold">
                    {profile.name.charAt(0) || 'U'}
                  </div>
                  <div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
                      <Camera className="w-4 h-4" />
                      Change Photo
                    </button>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm text-gray-400 mb-1">Bio</label>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Company</label>
                    <input
                      type="text"
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Location</label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">New Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm">
                    Update Password
                  </button>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm">
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Email Notifications</h3>
              <div className="space-y-4">
                {[
                  { key: 'emailUpdates', label: 'Product updates', desc: 'News about product and feature updates' },
                  { key: 'projectAlerts', label: 'Project alerts', desc: 'Important alerts about your projects' },
                  { key: 'weeklyDigest', label: 'Weekly digest', desc: 'Weekly summary of your activity' },
                  { key: 'marketingEmails', label: 'Marketing emails', desc: 'Promotional content and offers' },
                  { key: 'securityAlerts', label: 'Security alerts', desc: 'Important security notifications' },
                  { key: 'newFeatures', label: 'New features', desc: 'Be the first to know about new features' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                      className={`w-11 h-6 rounded-full transition-colors ${
                        notifications[item.key as keyof typeof notifications] ? 'bg-purple-500' : 'bg-gray-700'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Theme</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'light', label: 'Light', icon: '☀️' },
                    { id: 'dark', label: 'Dark', icon: '🌙' },
                    { id: 'system', label: 'System', icon: '💻' },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setAppearance({ ...appearance, theme: theme.id })}
                      className={`p-4 rounded-lg border text-center transition-colors ${
                        appearance.theme === theme.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <span className="text-2xl">{theme.icon}</span>
                      <p className="text-sm mt-2">{theme.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Display</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Font Size</label>
                    <select
                      value={appearance.fontSize}
                      onChange={(e) => setAppearance({ ...appearance, fontSize: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-sm">Compact Mode</p>
                      <p className="text-xs text-gray-500">Reduce spacing and padding</p>
                    </div>
                    <button
                      onClick={() => setAppearance({ ...appearance, compactMode: !appearance.compactMode })}
                      className={`w-11 h-6 rounded-full transition-colors ${appearance.compactMode ? 'bg-purple-500' : 'bg-gray-700'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${appearance.compactMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-sm">Animations</p>
                      <p className="text-xs text-gray-500">Enable UI animations</p>
                    </div>
                    <button
                      onClick={() => setAppearance({ ...appearance, animationsEnabled: !appearance.animationsEnabled })}
                      className={`w-11 h-6 rounded-full transition-colors ${appearance.animationsEnabled ? 'bg-purple-500' : 'bg-gray-700'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${appearance.animationsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Add an extra layer of security to your account by enabling 2FA.
                </p>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm">
                  <Smartphone className="w-4 h-4" />
                  Enable 2FA
                </button>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  {[
                    { device: 'Chrome on Windows', location: 'San Francisco, US', current: true },
                    { device: 'Safari on iPhone', location: 'San Francisco, US', current: false },
                  ].map((session, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{session.device}</p>
                          <p className="text-xs text-gray-500">{session.location}</p>
                        </div>
                      </div>
                      {session.current ? (
                        <span className="text-xs text-green-400">Current</span>
                      ) : (
                        <button className="text-xs text-red-400 hover:text-red-300">Revoke</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="font-semibold mb-4">API Keys</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Manage API keys for programmatic access to your account.
                </p>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
                  <Key className="w-4 h-4" />
                  Generate New Key
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
