// ============================================
// PRICING & PLANS CONFIGURATION
// ============================================

export type PlanId = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';

export interface PlanFeature {
  id: string;
  name: string;
  included: boolean;
  limit?: string;
}

export interface PricingPlan {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  
  // Limits
  tokensPerDay: number;
  tokensPerMonth: number;
  toolCallsPerDay: number;
  requestsPerDay: number;
  requestsPerMinute: number;
  storageMB: number;
  projectsLimit: number;
  teamMembers: number;
  
  // Features
  features: PlanFeature[];
  
  // UI
  highlighted?: boolean;
  badge?: string;
  ctaText: string;
}

// ============================================
// TOKEN COSTS - Z.AI GLM-4.6
// ============================================

export const TOKEN_COSTS = {
  // Z.AI GLM Models (tokens per 1K)
  'glm-4.6': { input: 5, output: 15 },         // Most powerful - default
  'glm-4.5': { input: 3, output: 10 },         // Balanced
  'glm-4.5-air': { input: 1, output: 3 },      // Fast & cheap
  
  // Tool costs (tokens per call)
  TOOLS: {
    WEB_SEARCH: 50,
    CODE_EXECUTION: 100,
    FILE_OPERATION: 10,
    IMAGE_GENERATION: 500,
    SECURITY_SCAN: 200,
    DOCUMENT_ANALYSIS: 150,
    AI_SUMMARIZE: 40,
    AI_TRANSLATE: 30,
  },
} as const;

// Available Z.AI models
export const ZAI_MODELS = {
  'glm-4.6': {
    name: 'GLM-4.6',
    description: 'Most powerful model - best for complex tasks',
    contextWindow: 128000,
    maxOutput: 4096,
  },
  'glm-4.5': {
    name: 'GLM-4.5',
    description: 'Balanced performance and cost',
    contextWindow: 128000,
    maxOutput: 4096,
  },
  'glm-4.5-air': {
    name: 'GLM-4.5 Air',
    description: 'Fast and affordable - good for simple tasks',
    contextWindow: 32000,
    maxOutput: 4096,
  },
} as const;

// Default AI model
export const DEFAULT_AI_MODEL = 'glm-4.6';

// ============================================
// PRICING PLANS
// ============================================

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic AI assistance',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'USD',
    
    tokensPerDay: 5000,
    tokensPerMonth: 100000,
    toolCallsPerDay: 20,
    requestsPerDay: 50,
    requestsPerMinute: 5,
    storageMB: 100,
    projectsLimit: 2,
    teamMembers: 1,
    
    features: [
      { id: 'ai_chat', name: 'AI Chat Assistant', included: true },
      { id: 'workspaces', name: 'All 8 Workspaces', included: true },
      { id: 'code_editor', name: 'Browser Code Editor', included: true },
      { id: 'google_drive', name: 'Google Drive Storage', included: true, limit: '100 MB' },
      { id: 'projects', name: 'Projects', included: true, limit: '2' },
      { id: 'daily_tokens', name: 'Daily AI Tokens', included: true, limit: '5,000' },
      { id: 'security_scan', name: 'Security Scanning', included: false },
      { id: 'priority_support', name: 'Priority Support', included: false },
      { id: 'api_access', name: 'API Access', included: false },
      { id: 'custom_agents', name: 'Custom AI Agents', included: false },
    ],
    
    ctaText: 'Get Started Free',
  },
  
  {
    id: 'starter',
    name: 'Starter',
    description: 'For individuals who need more power',
    priceMonthly: 9,
    priceYearly: 90,
    currency: 'USD',
    
    tokensPerDay: 25000,
    tokensPerMonth: 500000,
    toolCallsPerDay: 100,
    requestsPerDay: 200,
    requestsPerMinute: 15,
    storageMB: 1024,  // 1 GB
    projectsLimit: 10,
    teamMembers: 1,
    
    features: [
      { id: 'ai_chat', name: 'AI Chat Assistant', included: true },
      { id: 'workspaces', name: 'All 8 Workspaces', included: true },
      { id: 'code_editor', name: 'Browser Code Editor', included: true },
      { id: 'google_drive', name: 'Google Drive Storage', included: true, limit: '1 GB' },
      { id: 'projects', name: 'Projects', included: true, limit: '10' },
      { id: 'daily_tokens', name: 'Daily AI Tokens', included: true, limit: '25,000' },
      { id: 'security_scan', name: 'Basic Security Scanning', included: true },
      { id: 'priority_support', name: 'Email Support', included: true },
      { id: 'api_access', name: 'API Access', included: false },
      { id: 'custom_agents', name: 'Custom AI Agents', included: false },
    ],
    
    ctaText: 'Start Free Trial',
  },
  
  {
    id: 'pro',
    name: 'Pro',
    description: 'For professionals and power users',
    priceMonthly: 29,
    priceYearly: 290,
    currency: 'USD',
    highlighted: true,
    badge: 'Most Popular',
    
    tokensPerDay: 100000,
    tokensPerMonth: 2000000,
    toolCallsPerDay: 500,
    requestsPerDay: 1000,
    requestsPerMinute: 30,
    storageMB: 10240,  // 10 GB
    projectsLimit: 50,
    teamMembers: 1,
    
    features: [
      { id: 'ai_chat', name: 'AI Chat Assistant', included: true },
      { id: 'workspaces', name: 'All 8 Workspaces', included: true },
      { id: 'code_editor', name: 'Browser Code Editor + Terminal', included: true },
      { id: 'google_drive', name: 'Google Drive Storage', included: true, limit: '10 GB' },
      { id: 'projects', name: 'Projects', included: true, limit: '50' },
      { id: 'daily_tokens', name: 'Daily AI Tokens', included: true, limit: '100,000' },
      { id: 'security_scan', name: 'Full Security Suite', included: true },
      { id: 'priority_support', name: 'Priority Support', included: true },
      { id: 'api_access', name: 'API Access', included: true },
      { id: 'custom_agents', name: 'Custom AI Agents', included: true, limit: '5' },
    ],
    
    ctaText: 'Start Free Trial',
  },
  
  {
    id: 'business',
    name: 'Business',
    description: 'For teams and organizations',
    priceMonthly: 79,
    priceYearly: 790,
    currency: 'USD',
    
    tokensPerDay: 500000,
    tokensPerMonth: 10000000,
    toolCallsPerDay: 2000,
    requestsPerDay: 5000,
    requestsPerMinute: 60,
    storageMB: 102400,  // 100 GB
    projectsLimit: -1,  // Unlimited
    teamMembers: 10,
    
    features: [
      { id: 'ai_chat', name: 'AI Chat Assistant', included: true },
      { id: 'workspaces', name: 'All 8 Workspaces', included: true },
      { id: 'code_editor', name: 'Full IDE Experience', included: true },
      { id: 'google_drive', name: 'Google Drive Storage', included: true, limit: '100 GB' },
      { id: 'projects', name: 'Projects', included: true, limit: 'Unlimited' },
      { id: 'daily_tokens', name: 'Daily AI Tokens', included: true, limit: '500,000' },
      { id: 'security_scan', name: 'Enterprise Security', included: true },
      { id: 'priority_support', name: '24/7 Priority Support', included: true },
      { id: 'api_access', name: 'Full API Access', included: true },
      { id: 'custom_agents', name: 'Custom AI Agents', included: true, limit: 'Unlimited' },
      { id: 'team', name: 'Team Collaboration', included: true, limit: '10 members' },
      { id: 'sso', name: 'SSO (SAML)', included: true },
    ],
    
    ctaText: 'Start Free Trial',
  },
  
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for large organizations',
    priceMonthly: -1,  // Custom pricing
    priceYearly: -1,
    currency: 'USD',
    
    tokensPerDay: -1,  // Unlimited
    tokensPerMonth: -1,
    toolCallsPerDay: -1,
    requestsPerDay: -1,
    requestsPerMinute: 120,
    storageMB: -1,
    projectsLimit: -1,
    teamMembers: -1,
    
    features: [
      { id: 'all_features', name: 'Everything in Business', included: true },
      { id: 'unlimited', name: 'Unlimited Usage', included: true },
      { id: 'dedicated', name: 'Dedicated Infrastructure', included: true },
      { id: 'sla', name: '99.99% SLA', included: true },
      { id: 'custom_models', name: 'Custom AI Models', included: true },
      { id: 'on_premise', name: 'On-Premise Deployment', included: true },
      { id: 'audit', name: 'Advanced Audit Logs', included: true },
      { id: 'compliance', name: 'Compliance (SOC2, HIPAA)', included: true },
      { id: 'account_manager', name: 'Dedicated Account Manager', included: true },
    ],
    
    ctaText: 'Contact Sales',
  },
];

// ============================================
// TRIAL CONFIGURATION
// ============================================

export const TRIAL_CONFIG = {
  // New users get 14-day trial of Pro plan
  defaultTrialPlan: 'pro' as PlanId,
  trialDays: 14,
  
  // After trial, downgrade to this plan
  postTrialPlan: 'free' as PlanId,
  
  // Trial limits (can be different from plan limits)
  trialLimits: {
    tokensPerDay: 50000,
    toolCallsPerDay: 200,
    storageMB: 5120,  // 5 GB
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getPlanById(id: PlanId): PricingPlan | undefined {
  return PRICING_PLANS.find(p => p.id === id);
}

export function formatPrice(price: number, currency: string = 'USD'): string {
  if (price === -1) return 'Custom';
  if (price === 0) return 'Free';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price);
}

export function formatLimit(value: number): string {
  if (value === -1) return 'Unlimited';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

export function formatStorage(mb: number): string {
  if (mb === -1) return 'Unlimited';
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`;
  return `${mb} MB`;
}

export function calculateTokenCost(
  model: keyof typeof TOKEN_COSTS,
  inputTokens: number,
  outputTokens: number
): number {
  const cost = TOKEN_COSTS[model as keyof Omit<typeof TOKEN_COSTS, 'TOOLS'>];
  if (!cost || typeof cost === 'object' && 'input' in cost) {
    const c = cost as { input: number; output: number };
    return (inputTokens * c.input + outputTokens * c.output) / 1000;
  }
  return 0;
}

export function getToolCost(tool: keyof typeof TOKEN_COSTS.TOOLS): number {
  return TOKEN_COSTS.TOOLS[tool] || 0;
}

// Check if user can perform action based on usage
export interface UsageCheck {
  allowed: boolean;
  reason?: string;
  remaining?: number;
}

export function checkTokenUsage(
  used: number,
  limit: number,
  requested: number
): UsageCheck {
  if (limit === -1) return { allowed: true, remaining: -1 };
  
  const remaining = limit - used;
  if (remaining <= 0) {
    return {
      allowed: false,
      reason: 'Daily token limit reached. Upgrade your plan for more tokens.',
      remaining: 0,
    };
  }
  
  if (remaining < requested) {
    return {
      allowed: true,
      reason: `Only ${remaining} tokens remaining today.`,
      remaining,
    };
  }
  
  return { allowed: true, remaining };
}

export function checkToolUsage(used: number, limit: number): UsageCheck {
  if (limit === -1) return { allowed: true, remaining: -1 };
  
  const remaining = limit - used;
  if (remaining <= 0) {
    return {
      allowed: false,
      reason: 'Daily tool call limit reached. Upgrade your plan for more.',
      remaining: 0,
    };
  }
  
  return { allowed: true, remaining };
}
