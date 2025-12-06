import { prisma } from './prisma';
import { getPlanById } from '@/config/pricing';

// ============================================
// USAGE TRACKING & QUOTA MANAGEMENT
// ============================================

export interface UserLimits {
  tokensPerDay: number;
  tokensPerMonth: number;
  toolCallsPerDay: number;
  requestsPerDay: number;
  requestsPerMinute: number;
  storageMB: number;
  projectsLimit: number;
}

export interface UsageStats {
  dailyTokensUsed: number;
  dailyToolCalls: number;
  dailyRequests: number;
  monthlyTokensUsed: number;
  monthlyStorageMB: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  limit?: number;
  used?: number;
}

// ============================================
// GET USER LIMITS
// ============================================

export async function getUserLimits(userId: string): Promise<UserLimits> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: {
        include: { plan: true },
      },
    },
  });

  if (!user?.subscription?.plan) {
    // Default to free plan limits
    return {
      tokensPerDay: 5000,
      tokensPerMonth: 100000,
      toolCallsPerDay: 20,
      requestsPerDay: 50,
      requestsPerMinute: 5,
      storageMB: 100,
      projectsLimit: 2,
    };
  }

  const plan = user.subscription.plan;
  const sub = user.subscription;

  // Use custom limits if set, otherwise use plan defaults
  return {
    tokensPerDay: sub.customTokensPerDay ?? plan.tokensPerDay,
    tokensPerMonth: sub.customTokensPerMonth ?? plan.tokensPerMonth,
    toolCallsPerDay: plan.toolCallsPerDay,
    requestsPerDay: plan.requestsPerDay,
    requestsPerMinute: plan.requestsPerMinute,
    storageMB: sub.customStorageMB ?? plan.storageMB,
    projectsLimit: plan.projectsLimit,
  };
}

// ============================================
// GET USAGE STATS
// ============================================

export async function getUserUsage(userId: string): Promise<UsageStats> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      dailyTokensUsed: true,
      dailyToolCalls: true,
      dailyRequests: true,
      monthlyTokensUsed: true,
      monthlyStorageMB: true,
      lastDailyReset: true,
      lastMonthlyReset: true,
    },
  });

  if (!user) {
    return {
      dailyTokensUsed: 0,
      dailyToolCalls: 0,
      dailyRequests: 0,
      monthlyTokensUsed: 0,
      monthlyStorageMB: 0,
    };
  }

  // Check if counters need to be reset
  const now = new Date();
  const lastDaily = new Date(user.lastDailyReset);
  const lastMonthly = new Date(user.lastMonthlyReset);

  let needsUpdate = false;
  const updateData: any = {};

  // Reset daily counters if it's a new day
  if (now.toDateString() !== lastDaily.toDateString()) {
    updateData.dailyTokensUsed = 0;
    updateData.dailyToolCalls = 0;
    updateData.dailyRequests = 0;
    updateData.lastDailyReset = now;
    needsUpdate = true;
  }

  // Reset monthly counters if it's a new month
  if (now.getMonth() !== lastMonthly.getMonth() || now.getFullYear() !== lastMonthly.getFullYear()) {
    updateData.monthlyTokensUsed = 0;
    updateData.lastMonthlyReset = now;
    needsUpdate = true;
  }

  if (needsUpdate) {
    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      dailyTokensUsed: updateData.dailyTokensUsed ?? user.dailyTokensUsed,
      dailyToolCalls: updateData.dailyToolCalls ?? user.dailyToolCalls,
      dailyRequests: updateData.dailyRequests ?? user.dailyRequests,
      monthlyTokensUsed: updateData.monthlyTokensUsed ?? user.monthlyTokensUsed,
      monthlyStorageMB: user.monthlyStorageMB,
    };
  }

  return {
    dailyTokensUsed: user.dailyTokensUsed,
    dailyToolCalls: user.dailyToolCalls,
    dailyRequests: user.dailyRequests,
    monthlyTokensUsed: user.monthlyTokensUsed,
    monthlyStorageMB: user.monthlyStorageMB,
  };
}

// ============================================
// QUOTA CHECKS
// ============================================

export async function checkTokenQuota(
  userId: string,
  requestedTokens: number
): Promise<QuotaCheckResult> {
  const [limits, usage] = await Promise.all([
    getUserLimits(userId),
    getUserUsage(userId),
  ]);

  // Check daily limit
  if (limits.tokensPerDay !== -1) {
    const dailyRemaining = limits.tokensPerDay - usage.dailyTokensUsed;
    if (dailyRemaining <= 0) {
      return {
        allowed: false,
        reason: 'Daily token limit reached. Your quota resets at midnight.',
        remaining: 0,
        limit: limits.tokensPerDay,
        used: usage.dailyTokensUsed,
      };
    }
    if (dailyRemaining < requestedTokens) {
      return {
        allowed: true,
        reason: `Only ${dailyRemaining} tokens remaining today.`,
        remaining: dailyRemaining,
        limit: limits.tokensPerDay,
        used: usage.dailyTokensUsed,
      };
    }
  }

  // Check monthly limit
  if (limits.tokensPerMonth !== -1) {
    const monthlyRemaining = limits.tokensPerMonth - usage.monthlyTokensUsed;
    if (monthlyRemaining <= 0) {
      return {
        allowed: false,
        reason: 'Monthly token limit reached. Upgrade your plan for more tokens.',
        remaining: 0,
        limit: limits.tokensPerMonth,
        used: usage.monthlyTokensUsed,
      };
    }
  }

  return {
    allowed: true,
    remaining: limits.tokensPerDay === -1 ? -1 : limits.tokensPerDay - usage.dailyTokensUsed,
    limit: limits.tokensPerDay,
    used: usage.dailyTokensUsed,
  };
}

export async function checkToolCallQuota(userId: string): Promise<QuotaCheckResult> {
  const [limits, usage] = await Promise.all([
    getUserLimits(userId),
    getUserUsage(userId),
  ]);

  if (limits.toolCallsPerDay === -1) {
    return { allowed: true, remaining: -1 };
  }

  const remaining = limits.toolCallsPerDay - usage.dailyToolCalls;
  if (remaining <= 0) {
    return {
      allowed: false,
      reason: 'Daily tool call limit reached. Upgrade your plan for more.',
      remaining: 0,
      limit: limits.toolCallsPerDay,
      used: usage.dailyToolCalls,
    };
  }

  return {
    allowed: true,
    remaining,
    limit: limits.toolCallsPerDay,
    used: usage.dailyToolCalls,
  };
}

export async function checkProjectQuota(userId: string): Promise<QuotaCheckResult> {
  const limits = await getUserLimits(userId);
  
  if (limits.projectsLimit === -1) {
    return { allowed: true, remaining: -1 };
  }

  const projectCount = await prisma.project.count({
    where: { userId },
  });

  const remaining = limits.projectsLimit - projectCount;
  if (remaining <= 0) {
    return {
      allowed: false,
      reason: 'Project limit reached. Upgrade your plan to create more projects.',
      remaining: 0,
      limit: limits.projectsLimit,
      used: projectCount,
    };
  }

  return {
    allowed: true,
    remaining,
    limit: limits.projectsLimit,
    used: projectCount,
  };
}

export async function checkStorageQuota(
  userId: string,
  requestedMB: number
): Promise<QuotaCheckResult> {
  const [limits, usage] = await Promise.all([
    getUserLimits(userId),
    getUserUsage(userId),
  ]);

  if (limits.storageMB === -1) {
    return { allowed: true, remaining: -1 };
  }

  const remaining = limits.storageMB - usage.monthlyStorageMB;
  if (remaining < requestedMB) {
    return {
      allowed: false,
      reason: 'Storage limit reached. Upgrade your plan for more storage.',
      remaining: Math.max(0, remaining),
      limit: limits.storageMB,
      used: usage.monthlyStorageMB,
    };
  }

  return {
    allowed: true,
    remaining,
    limit: limits.storageMB,
    used: usage.monthlyStorageMB,
  };
}

// ============================================
// RECORD USAGE
// ============================================

export async function recordTokenUsage(
  userId: string,
  tokens: number,
  model?: string,
  endpoint?: string
): Promise<void> {
  await prisma.$transaction([
    // Update user counters
    prisma.user.update({
      where: { id: userId },
      data: {
        dailyTokensUsed: { increment: tokens },
        monthlyTokensUsed: { increment: tokens },
      },
    }),
    // Create usage log
    prisma.usageLog.create({
      data: {
        userId,
        type: 'ai_tokens',
        amount: tokens,
        model,
        endpoint,
      },
    }),
  ]);
}

export async function recordToolCall(
  userId: string,
  toolName: string,
  workspace?: string
): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        dailyToolCalls: { increment: 1 },
      },
    }),
    prisma.usageLog.create({
      data: {
        userId,
        type: 'tool_call',
        amount: 1,
        endpoint: toolName,
        workspace,
      },
    }),
  ]);
}

export async function recordRequest(userId: string, endpoint: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyRequests: { increment: 1 },
    },
  });
}

export async function recordStorageUsage(userId: string, sizeMB: number): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        monthlyStorageMB: { increment: sizeMB },
      },
    }),
    prisma.usageLog.create({
      data: {
        userId,
        type: 'storage',
        amount: Math.round(sizeMB * 1024 * 1024), // Store as bytes
      },
    }),
  ]);
}

// ============================================
// USAGE ANALYTICS
// ============================================

export async function getUsageHistory(
  userId: string,
  type?: string,
  days: number = 30
): Promise<{ date: string; amount: number }[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await prisma.usageLog.groupBy({
    by: ['createdAt'],
    where: {
      userId,
      type: type || undefined,
      createdAt: { gte: startDate },
    },
    _sum: { amount: true },
    orderBy: { createdAt: 'asc' },
  });

  // Aggregate by day
  const dailyUsage: Record<string, number> = {};
  for (const log of logs) {
    const date = new Date(log.createdAt).toISOString().split('T')[0];
    dailyUsage[date] = (dailyUsage[date] || 0) + (log._sum.amount || 0);
  }

  return Object.entries(dailyUsage).map(([date, amount]) => ({
    date,
    amount,
  }));
}

export async function getTotalUsage(
  userId: string,
  type: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  const result = await prisma.usageLog.aggregate({
    where: {
      userId,
      type,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: { amount: true },
  });

  return result._sum.amount || 0;
}
