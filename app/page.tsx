'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles, Shield, Code, BookOpen, BarChart, Search,
  ArrowRight, Check, Zap, Globe, Lock, Users
} from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">AI Code Studio</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="px-4 py-2 text-gray-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-sm mb-6">
              <Zap className="w-4 h-4" />
              Powered by GLM-4.6 AI
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Multi-purpose{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                AI Workspace
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              One platform for coding, cybersecurity, writing, research, and more.
              AI that understands your context and helps you work smarter.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl font-medium transition-colors"
              >
                Start Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#features"
                className="px-6 py-3 border border-gray-700 hover:border-gray-600 rounded-xl font-medium transition-colors"
              >
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Workspaces */}
      <section id="features" className="py-20 px-6 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">8 Specialized Workspaces</h2>
            <p className="text-gray-400">Choose the right environment for your task</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, name: 'Cybersecurity', desc: 'Red team, pentest, forensics', color: 'from-red-500 to-orange-500' },
              { icon: Code, name: 'Development', desc: 'Full-stack coding', color: 'from-blue-500 to-cyan-500' },
              { icon: BookOpen, name: 'Writing', desc: 'Books, articles, content', color: 'from-purple-500 to-pink-500' },
              { icon: BarChart, name: 'Data Analysis', desc: 'Analytics & visualization', color: 'from-green-500 to-emerald-500' },
              { icon: Search, name: 'Research', desc: 'Academic & market research', color: 'from-yellow-500 to-amber-500' },
              { icon: Users, name: 'Marketing', desc: 'Content & campaigns', color: 'from-pink-500 to-rose-500' },
              { icon: Globe, name: 'Healthcare', desc: 'Clinical documentation', color: 'from-teal-500 to-cyan-500' },
              { icon: Lock, name: 'Legal', desc: 'Contracts & compliance', color: 'from-indigo-500 to-violet-500' },
            ].map((workspace, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 bg-gray-800/50 border border-gray-700 rounded-2xl hover:border-gray-600 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${workspace.color} flex items-center justify-center mb-4`}>
                  <workspace.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold mb-1">{workspace.name}</h3>
                <p className="text-sm text-gray-500">{workspace.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm mb-4">
                <Shield className="w-4 h-4" />
                Security Module
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Complete Red Team & Blue Team Simulation
              </h2>
              <p className="text-gray-400 mb-6">
                Full penetration testing workflow with social engineering simulations,
                vulnerability scanning, and compliance reporting.
              </p>
              <ul className="space-y-3">
                {[
                  'OWASP Top 10 vulnerability scanning',
                  'Phishing & social engineering simulations',
                  'CVSS 3.1 calculator & risk assessment',
                  'Automated report generation (.md, PDF)',
                  'MITRE ATT&CK framework mapping',
                  'Compliance: NIST, ISO 27001, PCI-DSS',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🔴</span>
                  </div>
                  <div>
                    <div className="font-medium text-red-400">2 Critical</div>
                    <div className="text-sm text-gray-500">SQL Injection, RCE</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🟠</span>
                  </div>
                  <div>
                    <div className="font-medium text-orange-400">5 High</div>
                    <div className="text-sm text-gray-500">XSS, CSRF, Auth Bypass</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🟡</span>
                  </div>
                  <div>
                    <div className="font-medium text-yellow-400">8 Medium</div>
                    <div className="text-sm text-gray-500">Headers, Cookies, TLS</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-b from-gray-900/50 to-gray-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-400 mb-8">
            Join thousands of developers, security professionals, and creators
            using AI to work smarter.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-medium text-lg hover:opacity-90 transition-opacity"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium">AI Code Studio</span>
          </div>
          <div className="text-sm text-gray-500">
            © 2024 All rights reserved
          </div>
        </div>
      </footer>
    </div>
  );
}
