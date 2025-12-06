import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d';
    
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: { include: { plan: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get usage logs
    const usageLogs = await prisma.usageLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get projects count
    const projectsCount = await prisma.project.count({ where: { userId } });

    // Get chat history count
    const messagesCount = await prisma.chatHistory.count({ where: { userId } });

    // Get files count
    const filesCount = await prisma.userFile.count({ where: { userId } });

    // Calculate token usage
    const tokenLogs = usageLogs.filter((log: any) => log.type === 'ai_tokens');
    const totalTokens = tokenLogs.reduce((sum: number, log: any) => sum + log.amount, 0);

    // Group by date
    const usageByDate = tokenLogs.reduce((acc: Record<string, { tokens: number; messages: number; files: number }>, log: any) => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { tokens: 0, messages: 0, files: 0 };
      }
      acc[date].tokens += log.amount;
      return acc;
    }, {});

    // Group by workspace
    const workspaceUsage = usageLogs.reduce((acc: Record<string, number>, log: any) => {
      const workspace = log.workspace || 'other';
      acc[workspace] = (acc[workspace] || 0) + log.amount;
      return acc;
    }, {});

    // Calculate percentages for workspace
    const totalWorkspaceTokens = Object.values(workspaceUsage).reduce((a, b) => (a as number) + (b as number), 0) as number;
    const workspaceStats = Object.entries(workspaceUsage).map(([name, tokens]) => ({
      name: formatWorkspaceName(name),
      percentage: totalWorkspaceTokens > 0 ? Math.round(((tokens as number) / totalWorkspaceTokens) * 100) : 0,
      tokens: tokens as number,
      color: getWorkspaceColor(name),
    }));

    // Recent activity
    const recentActivity = usageLogs.slice(0, 10).map((log: any) => ({
      type: log.type === 'ai_tokens' ? 'chat' : 'file',
      description: getActivityDescription(log),
      time: formatTimeAgo(log.createdAt),
      tokens: log.amount,
    }));

    // Get plan limits
    const tokensLimit = user.subscription?.plan?.tokensPerMonth || 10000;
    const tokensUsedMonth = user.monthlyTokensUsed;

    return NextResponse.json({
      stats: {
        tokensUsed: tokensUsedMonth,
        tokensLimit,
        messagesCount,
        filesGenerated: filesCount,
        projectsCount,
        hoursActive: Math.round(totalTokens / 1000), // Rough estimate
        avgResponseTime: 1.2,
        tokensGrowth: calculateGrowth(tokenLogs),
        messagesGrowth: 15.2,
      },
      usageData: Object.entries(usageByDate).map(([date, data]: [string, any]) => ({
        date,
        ...data,
      })),
      workspaceUsage: workspaceStats,
      recentActivity,
    });

  } catch (error: any) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatWorkspaceName(name: string): string {
  const names: Record<string, string> = {
    'software-dev': 'Software Dev',
    'cybersecurity': 'Cybersecurity',
    'content-marketing': 'Content Marketing',
    'data-analysis': 'Data Analysis',
    'book-writing': 'Book Writing',
    'other': 'Others',
  };
  return names[name] || name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getWorkspaceColor(name: string): string {
  const colors: Record<string, string> = {
    'software-dev': 'bg-blue-500',
    'cybersecurity': 'bg-red-500',
    'content-marketing': 'bg-pink-500',
    'data-analysis': 'bg-green-500',
    'book-writing': 'bg-purple-500',
    'other': 'bg-gray-500',
  };
  return colors[name] || 'bg-gray-500';
}

function getActivityDescription(log: any): string {
  if (log.type === 'ai_tokens') {
    return `Chat session in ${formatWorkspaceName(log.workspace || 'Unknown')}`;
  }
  return log.endpoint || 'Activity';
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return date.toLocaleDateString();
}

function calculateGrowth(logs: any[]): number {
  const now = new Date();
  const thisWeek = logs.filter(l => 
    l.createdAt >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  ).reduce((sum, l) => sum + l.amount, 0);
  
  const lastWeek = logs.filter(l => 
    l.createdAt >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) &&
    l.createdAt < new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  ).reduce((sum, l) => sum + l.amount, 0);
  
  if (lastWeek === 0) return thisWeek > 0 ? 100 : 0;
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100 * 10) / 10;
}
