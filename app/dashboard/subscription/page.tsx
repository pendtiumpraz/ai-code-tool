'use client';

import { useState } from 'react';
import { 
  CreditCard, Check, Zap, Crown, Sparkles, 
  Calendar, Clock, AlertCircle, ArrowRight,
  Shield, Users, Infinity, Download
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  description: string;
  features: string[];
  tokensPerMonth: number;
  popular?: boolean;
  current?: boolean;
}

export default function SubscriptionPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const currentPlan = {
    name: 'Pro',
    tokensUsed: 45230,
    tokensLimit: 100000,
    nextBillingDate: '2024-03-15',
    amount: 29,
    daysRemaining: 23,
  };

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'monthly',
      description: 'Perfect for trying out',
      tokensPerMonth: 10000,
      features: [
        '10,000 tokens/month',
        'Basic AI models',
        '3 projects',
        'Community support',
      ],
    },
    {
      id: 'starter',
      name: 'Starter',
      price: billingInterval === 'monthly' ? 9 : 7,
      interval: billingInterval,
      description: 'For individual developers',
      tokensPerMonth: 50000,
      features: [
        '50,000 tokens/month',
        'Advanced AI models',
        '10 projects',
        'Email support',
        'Code execution',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingInterval === 'monthly' ? 29 : 24,
      interval: billingInterval,
      description: 'For power users',
      tokensPerMonth: 100000,
      popular: true,
      current: true,
      features: [
        '100,000 tokens/month',
        'All AI models',
        'Unlimited projects',
        'Priority support',
        'Code execution',
        'API access',
        'Custom templates',
      ],
    },
    {
      id: 'business',
      name: 'Business',
      price: billingInterval === 'monthly' ? 99 : 79,
      interval: billingInterval,
      description: 'For teams and businesses',
      tokensPerMonth: 500000,
      features: [
        '500,000 tokens/month',
        'All Pro features',
        'Team collaboration',
        'Admin dashboard',
        'SSO authentication',
        'Dedicated support',
        'Custom integrations',
      ],
    },
  ];

  const invoices = [
    { id: 'INV-001', date: '2024-02-15', amount: 29, status: 'paid' },
    { id: 'INV-002', date: '2024-01-15', amount: 29, status: 'paid' },
    { id: 'INV-003', date: '2023-12-15', amount: 29, status: 'paid' },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Subscription</h1>
        <p className="text-gray-400">Manage your plan and billing</p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Current Plan</span>
            </div>
            <h2 className="text-3xl font-bold mb-1">{currentPlan.name}</h2>
            <p className="text-gray-400">${currentPlan.amount}/month</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Calendar className="w-4 h-4" />
              Next billing: {currentPlan.nextBillingDate}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-medium">{currentPlan.daysRemaining} days remaining</span>
            </div>
          </div>
        </div>

        {/* Usage Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Token Usage</span>
            <span>
              <span className="font-medium">{currentPlan.tokensUsed.toLocaleString()}</span>
              <span className="text-gray-500"> / {currentPlan.tokensLimit.toLocaleString()}</span>
            </span>
          </div>
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
              style={{ width: `${(currentPlan.tokensUsed / currentPlan.tokensLimit) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {((currentPlan.tokensUsed / currentPlan.tokensLimit) * 100).toFixed(1)}% used this billing cycle
          </p>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={billingInterval === 'monthly' ? 'text-white' : 'text-gray-500'}>Monthly</span>
        <button
          onClick={() => setBillingInterval(billingInterval === 'monthly' ? 'yearly' : 'monthly')}
          className="relative w-14 h-7 bg-gray-700 rounded-full transition-colors"
        >
          <div className={`absolute top-1 w-5 h-5 bg-purple-500 rounded-full transition-transform ${
            billingInterval === 'yearly' ? 'translate-x-8' : 'translate-x-1'
          }`} />
        </button>
        <span className={billingInterval === 'yearly' ? 'text-white' : 'text-gray-500'}>
          Yearly
          <span className="ml-1 text-xs text-green-400">Save 20%</span>
        </span>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-gray-800/50 border rounded-2xl p-6 ${
              plan.popular 
                ? 'border-purple-500 ring-2 ring-purple-500/20' 
                : 'border-gray-700'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 rounded-full text-xs font-medium">
                Most Popular
              </div>
            )}
            {plan.current && (
              <div className="absolute -top-3 right-4 px-3 py-1 bg-green-500 rounded-full text-xs font-medium">
                Current
              </div>
            )}

            <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{plan.description}</p>

            <div className="mb-4">
              <span className="text-3xl font-bold">${plan.price}</span>
              <span className="text-gray-500">/{plan.interval === 'yearly' ? 'mo' : 'month'}</span>
              {plan.interval === 'yearly' && (
                <p className="text-xs text-gray-500">billed annually</p>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <Zap className="w-4 h-4 text-yellow-400" />
              {plan.tokensPerMonth.toLocaleString()} tokens/month
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-2 rounded-lg font-medium transition-colors ${
                plan.current
                  ? 'bg-gray-700 text-gray-400 cursor-default'
                  : plan.popular
                    ? 'bg-purple-500 hover:bg-purple-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              disabled={plan.current}
            >
              {plan.current ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade'}
            </button>
          </div>
        ))}
      </div>

      {/* Billing Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            Payment Method
          </h3>
          <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-lg mb-4">
            <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
              VISA
            </div>
            <div className="flex-1">
              <p className="font-medium">•••• •••• •••• 4242</p>
              <p className="text-sm text-gray-500">Expires 12/25</p>
            </div>
            <button className="text-sm text-purple-400 hover:text-purple-300">Edit</button>
          </div>
          <button className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
            <CreditCard className="w-4 h-4" />
            Add payment method
          </button>
        </div>

        {/* Invoices */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-green-400" />
            Billing History
          </h3>
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{invoice.id}</p>
                  <p className="text-xs text-gray-500">{invoice.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">${invoice.amount}</span>
                  <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                    {invoice.status}
                  </span>
                  <button className="p-1 hover:bg-gray-700 rounded">
                    <Download className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="text-sm text-gray-400 hover:text-white mt-4 flex items-center gap-1">
            View all invoices
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cancel Section */}
      <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-400">Cancel Subscription</h4>
            <p className="text-sm text-gray-400 mt-1">
              You can cancel your subscription at any time. Your access will continue until the end of your billing period.
            </p>
            <button className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors">
              Cancel Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
