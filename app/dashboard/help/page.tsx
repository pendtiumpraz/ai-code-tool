'use client';

import { useState } from 'react';
import { 
  HelpCircle, Book, MessageCircle, Mail, ExternalLink,
  ChevronDown, ChevronRight, Search, Sparkles, 
  FileText, Video, Users, Zap, Shield, Code
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: Sparkles, color: 'bg-purple-500/20 text-purple-400' },
    { id: 'workspaces', name: 'Workspaces', icon: Code, color: 'bg-blue-500/20 text-blue-400' },
    { id: 'billing', name: 'Billing & Plans', icon: Zap, color: 'bg-yellow-500/20 text-yellow-400' },
    { id: 'security', name: 'Security', icon: Shield, color: 'bg-green-500/20 text-green-400' },
    { id: 'api', name: 'API & Integrations', icon: FileText, color: 'bg-pink-500/20 text-pink-400' },
    { id: 'account', name: 'Account Settings', icon: Users, color: 'bg-orange-500/20 text-orange-400' },
  ];

  const faqs: FAQItem[] = [
    {
      question: 'How do I get started with AI Code Studio?',
      answer: 'To get started, simply create an account and choose a workspace that matches your needs. Each workspace comes with specialized AI tools and templates designed for that industry. You can start chatting with the AI assistant right away or create a new project from templates.',
    },
    {
      question: 'What AI models are available?',
      answer: 'We offer access to multiple AI models including GPT-4, GPT-4 Turbo, and specialized models for code generation, content writing, and data analysis. The available models depend on your subscription plan.',
    },
    {
      question: 'How does token usage work?',
      answer: 'Tokens are the basic units of text processing. Each message you send and response you receive consumes tokens. On average, 1000 tokens equals about 750 words. Your plan includes a monthly token allowance that resets each billing cycle.',
    },
    {
      question: 'Can I collaborate with my team?',
      answer: 'Yes! Business and Enterprise plans include team collaboration features. You can invite team members, share projects, and work together in real-time. Each team member gets their own token allocation.',
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely. We use industry-standard encryption for all data in transit and at rest. Your conversations and files are private and never used to train AI models. We are SOC 2 Type II certified and GDPR compliant.',
    },
    {
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription at any time from the Subscription page in your dashboard. Your access will continue until the end of your current billing period. No refunds are provided for partial months.',
    },
    {
      question: 'Can I export my projects and data?',
      answer: 'Yes, you can export all your projects, conversations, and generated files at any time. Go to Settings > Account > Export Data to download a complete archive of your data.',
    },
    {
      question: 'What happens if I exceed my token limit?',
      answer: 'When you reach your token limit, you can either wait for your next billing cycle or upgrade to a higher plan. You will receive notifications when you are approaching your limit.',
    },
  ];

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">How can we help?</h1>
        <p className="text-gray-400">Search our knowledge base or browse categories below</p>
        
        {/* Search */}
        <div className="max-w-xl mx-auto mt-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors text-center group"
          >
            <div className={`w-12 h-12 mx-auto rounded-xl ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <cat.icon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">{cat.name}</p>
          </button>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-purple-400" />
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-3">
          {filteredFAQs.map((faq, index) => (
            <div
              key={index}
              className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700/30 transition-colors"
              >
                <span className="font-medium pr-4">{faq.question}</span>
                {openFAQ === index ? (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openFAQ === index && (
                <div className="px-4 pb-4">
                  <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFAQs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No results found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Resources */}
      <div className="max-w-3xl mx-auto mb-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Book className="w-5 h-5 text-blue-400" />
          Resources
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="#"
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors group"
          >
            <FileText className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="font-medium mb-1 group-hover:text-purple-400 transition-colors">
              Documentation
            </h3>
            <p className="text-sm text-gray-500">
              Detailed guides and API reference
            </p>
            <span className="inline-flex items-center gap-1 text-sm text-purple-400 mt-3">
              Read docs <ExternalLink className="w-3 h-3" />
            </span>
          </a>

          <a
            href="#"
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors group"
          >
            <Video className="w-8 h-8 text-blue-400 mb-3" />
            <h3 className="font-medium mb-1 group-hover:text-blue-400 transition-colors">
              Video Tutorials
            </h3>
            <p className="text-sm text-gray-500">
              Step-by-step video guides
            </p>
            <span className="inline-flex items-center gap-1 text-sm text-blue-400 mt-3">
              Watch videos <ExternalLink className="w-3 h-3" />
            </span>
          </a>

          <a
            href="#"
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors group"
          >
            <Users className="w-8 h-8 text-green-400 mb-3" />
            <h3 className="font-medium mb-1 group-hover:text-green-400 transition-colors">
              Community
            </h3>
            <p className="text-sm text-gray-500">
              Join our Discord community
            </p>
            <span className="inline-flex items-center gap-1 text-sm text-green-400 mt-3">
              Join now <ExternalLink className="w-3 h-3" />
            </span>
          </a>
        </div>
      </div>

      {/* Contact Support */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-8 text-center">
          <MessageCircle className="w-12 h-12 mx-auto text-purple-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">Still need help?</h2>
          <p className="text-gray-400 mb-6">
            Our support team is here to help you with any questions
          </p>
          <div className="flex items-center justify-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg font-medium transition-colors">
              <MessageCircle className="w-4 h-4" />
              Start Live Chat
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors">
              <Mail className="w-4 h-4" />
              Email Support
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Average response time: 2 hours
          </p>
        </div>
      </div>
    </div>
  );
}
