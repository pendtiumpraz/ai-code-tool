'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Check, X, Zap, Shield, Code, Brain,
  Building, Sparkles, ArrowRight, HelpCircle
} from 'lucide-react';
import { PRICING_PLANS, formatPrice, formatLimit, formatStorage } from '@/config/pricing';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const getPrice = (plan: typeof PRICING_PLANS[0]) => {
    if (plan.priceMonthly === -1) return 'Custom';
    const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly / 12;
    return formatPrice(price, plan.currency);
  };

  const getSavings = (plan: typeof PRICING_PLANS[0]) => {
    if (plan.priceMonthly <= 0 || plan.priceYearly <= 0) return null;
    const monthlyCost = plan.priceMonthly * 12;
    const savings = monthlyCost - plan.priceYearly;
    if (savings <= 0) return null;
    return Math.round((savings / monthlyCost) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">AI Code Studio</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/login?mode=register"
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Start free, upgrade when you need more power. All plans include a 14-day free trial.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-gray-900 p-1 rounded-xl">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Yearly
                <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {PRICING_PLANS.map((plan, index) => {
              const savings = getSavings(plan);
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`
                    relative bg-gray-900 rounded-2xl border overflow-hidden
                    ${plan.highlighted 
                      ? 'border-purple-500 ring-2 ring-purple-500/20' 
                      : 'border-gray-800'
                    }
                  `}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      {plan.badge}
                    </div>
                  )}

                  <div className="p-6">
                    {/* Plan Name */}
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">{getPrice(plan)}</span>
                        {plan.priceMonthly > 0 && (
                          <span className="text-gray-500">/mo</span>
                        )}
                      </div>
                      {billingCycle === 'yearly' && savings && (
                        <p className="text-sm text-green-400 mt-1">
                          Save {savings}% with yearly billing
                        </p>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Link
                      href={plan.id === 'enterprise' ? '/contact' : '/login?mode=register'}
                      className={`
                        w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors
                        ${plan.highlighted
                          ? 'bg-purple-500 hover:bg-purple-600 text-white'
                          : 'bg-gray-800 hover:bg-gray-700 text-white'
                        }
                      `}
                    >
                      {plan.ctaText}
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    {/* Limits */}
                    <div className="mt-6 pt-6 border-t border-gray-800 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Daily Tokens</span>
                        <span className="font-medium">{formatLimit(plan.tokensPerDay)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Monthly Tokens</span>
                        <span className="font-medium">{formatLimit(plan.tokensPerMonth)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Tool Calls/Day</span>
                        <span className="font-medium">{formatLimit(plan.toolCallsPerDay)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Storage</span>
                        <span className="font-medium">{formatStorage(plan.storageMB)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Projects</span>
                        <span className="font-medium">{formatLimit(plan.projectsLimit)}</span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mt-6 pt-6 border-t border-gray-800 space-y-3">
                      {plan.features.map((feature) => (
                        <div key={feature.id} className="flex items-start gap-3">
                          {feature.included ? (
                            <Check className="w-5 h-5 text-green-400 shrink-0" />
                          ) : (
                            <X className="w-5 h-5 text-gray-600 shrink-0" />
                          )}
                          <span className={feature.included ? 'text-gray-300' : 'text-gray-600'}>
                            {feature.name}
                            {feature.limit && (
                              <span className="text-gray-500 ml-1">({feature.limit})</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Build Amazing Projects
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Code,
                title: '8 Specialized Workspaces',
                description: 'Software Dev, Cybersecurity, Book Writing, Data Analysis, Research, Content Marketing, Healthcare, Legal',
              },
              {
                icon: Brain,
                title: 'AI-Powered Assistance',
                description: 'Advanced AI that understands context, uses tools, and helps you accomplish complex tasks',
              },
              {
                icon: Shield,
                title: 'Security Tools',
                description: 'Vulnerability scanning, CVSS calculator, social engineering simulations, and security reports',
              },
              {
                icon: Zap,
                title: 'Browser-Based IDE',
                description: 'Full code editor, terminal, and preview - all running in your browser with WebContainer',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-900 p-6 rounded-2xl border border-gray-800"
              >
                <feature.icon className="w-10 h-10 text-purple-400 mb-4" />
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'What is included in the free trial?',
                a: 'All new users get a 14-day free trial of the Pro plan. You\'ll have access to all Pro features including 100,000 daily tokens, 500 tool calls, and 10GB storage.',
              },
              {
                q: 'How do AI tokens work?',
                a: 'AI tokens are used when you interact with the AI assistant. Different operations use different amounts of tokens - simple chat uses fewer tokens, while complex tasks with tool usage consume more.',
              },
              {
                q: 'Can I upgrade or downgrade my plan?',
                a: 'Yes! You can change your plan at any time. Upgrades take effect immediately, while downgrades apply at the start of your next billing cycle.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards, PayPal, and wire transfers for Enterprise plans.',
              },
              {
                q: 'Is my data secure?',
                a: 'Yes. Your data is completely isolated from other users. Files are stored in your own Google Drive folder, and we use encryption for all sensitive data.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes, we offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, contact support for a full refund.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-gray-900 rounded-xl border border-gray-800 p-6"
              >
                <h3 className="font-bold mb-2 flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="text-gray-400 ml-8">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join thousands of developers, writers, and professionals using AI Code Studio
          </p>
          <Link
            href="/login?mode=register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-lg font-bold hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-5 h-5" />
            Start Your Free Trial
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            <span className="font-bold">AI Code Studio</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} AI Code Studio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
