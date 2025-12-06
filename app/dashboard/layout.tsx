'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { 
  Home, FolderOpen, Sparkles, Settings, CreditCard,
  HelpCircle, LogOut, Crown, Menu, X, ChevronRight,
  User, Bell, Search, Zap, BarChart3, Shield, Code,
  BookOpen, FileText, PanelLeftClose, PanelLeft
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/projects', icon: FolderOpen, label: 'My Projects' },
    { href: '/dashboard/ai-chat', icon: Sparkles, label: 'AI Chat' },
    { href: '/dashboard/analytics', icon: BarChart3, label: 'Usage Analytics' },
  ];

  const workspaceItems = [
    { href: '/workspace/cybersecurity', icon: Shield, label: 'Cybersecurity', color: 'text-red-400' },
    { href: '/workspace/software-dev', icon: Code, label: 'Software Dev', color: 'text-blue-400' },
    { href: '/workspace/book-writing', icon: BookOpen, label: 'Book Writing', color: 'text-purple-400' },
    { href: '/workspace/data-analysis', icon: BarChart3, label: 'Data Analysis', color: 'text-green-400' },
  ];

  const bottomNavItems = [
    { href: '/dashboard/subscription', icon: CreditCard, label: 'Subscription' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
    { href: '/dashboard/help', icon: HelpCircle, label: 'Help & Support' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-gray-900 border-r border-gray-800
        transform transition-all duration-200 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-16'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
            {sidebarOpen ? (
              <Link href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold">AI Code Studio</span>
              </Link>
            ) : (
              <Link href="/dashboard" className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto">
                <Sparkles className="w-4 h-4 text-white" />
              </Link>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:block p-1 hover:bg-gray-800 rounded"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-4 h-4 text-gray-400" />
              ) : (
                <PanelLeft className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto p-3">
            {/* Main Menu */}
            <div className="mb-6">
              {sidebarOpen && (
                <p className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Menu
                </p>
              )}
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Workspaces */}
            <div className="mb-6">
              {sidebarOpen && (
                <p className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workspaces
                </p>
              )}
              <ul className="space-y-1">
                {workspaceItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <item.icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} />
                        {sidebarOpen && <span className="text-sm">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
                {sidebarOpen && (
                  <li>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-gray-400 transition-colors text-sm"
                    >
                      <ChevronRight className="w-4 h-4" />
                      View all workspaces
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Admin Link */}
            {isAdmin && (
              <div className="mb-6">
                {sidebarOpen && (
                  <p className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </p>
                )}
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
                  title={!sidebarOpen ? 'Admin Panel' : undefined}
                >
                  <Crown className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>Admin Panel</span>}
                </Link>
              </div>
            )}

            {/* Bottom Menu */}
            <div className="pt-4 border-t border-gray-800">
              <ul className="space-y-1">
                {bottomNavItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {sidebarOpen && <span className="text-sm">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          {/* User Section */}
          <div className="p-3 border-t border-gray-800">
            {sidebarOpen ? (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-800/50">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{session.user?.name || 'User'}</p>
                  <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white flex items-center justify-center"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-gray-900/50 backdrop-blur-xl border-b border-gray-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-64 pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="p-2 hover:bg-gray-800 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Quick Actions */}
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm font-medium transition-colors">
              <Zap className="w-4 h-4" />
              New Project
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
