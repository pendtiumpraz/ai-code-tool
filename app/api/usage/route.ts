import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUserLimits, getUserUsage, getUsageHistory } from '@/lib/usage';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// ============================================
// USAGE API - Get user's usage stats
// ============================================

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Get current limits and usage
    const [limits, usage, tokenHistory, toolHistory] = await Promise.all([
      getUserLimits(session.user.id),
      getUserUsage(session.user.id),
      getUsageHistory(session.user.id, 'ai_tokens', days),
      getUsageHistory(session.user.id, 'tool_call', days),
    ]);

    // Calculate percentages
    const dailyTokenPercent = limits.tokensPerDay === -1 
      ? 0 
      : Math.round((usage.dailyTokensUsed / limits.tokensPerDay) * 100);
    
    const monthlyTokenPercent = limits.tokensPerMonth === -1 
      ? 0 
      : Math.round((usage.monthlyTokensUsed / limits.tokensPerMonth) * 100);
    
    const toolCallPercent = limits.toolCallsPerDay === -1 
      ? 0 
      : Math.round((usage.dailyToolCalls / limits.toolCallsPerDay) * 100);
    
    const storagePercent = limits.storageMB === -1 
      ? 0 
      : Math.round((usage.monthlyStorageMB / limits.storageMB) * 100);

    return NextResponse.json({
      limits,
      usage,
      percentages: {
        dailyTokens: dailyTokenPercent,
        monthlyTokens: monthlyTokenPercent,
        toolCalls: toolCallPercent,
        storage: storagePercent,
      },
      history: {
        tokens: tokenHistory,
        tools: toolHistory,
      },
      plan: session.user.planId || 'free',
      status: session.user.subscriptionStatus || 'active',
    });

  } catch (error: any) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
