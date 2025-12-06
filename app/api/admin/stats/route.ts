import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// ============================================
// ADMIN STATS API
// ============================================

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check admin access
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get stats in parallel
    const [
      totalUsers,
      newUsersToday,
      newUsersThisMonth,
      newUsersLastMonth,
      activeSubscriptions,
      totalTokensUsed,
      totalProjects,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: startOfDay } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfMonth,
          },
        },
      }),
      prisma.subscription.count({
        where: { status: { in: ['ACTIVE', 'TRIAL'] } },
      }),
      prisma.usageLog.aggregate({
        where: {
          type: 'ai_tokens',
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.project.count(),
    ]);

    // Calculate growth
    const userGrowth = newUsersLastMonth > 0 
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 
      : 100;

    // Estimate revenue (simplified)
    const subscriptionStats = await prisma.subscription.groupBy({
      by: ['status'],
      _count: true,
    });

    // Mock revenue calculation (would need actual plan prices)
    const revenueThisMonth = activeSubscriptions * 29; // Assuming average $29/user
    const revenueGrowth = 8.3; // Mock

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      totalTokensUsed: totalTokensUsed._sum.amount || 0,
      totalStorage: 2048, // Mock - would calculate from usage
      newUsersToday,
      revenueThisMonth,
      userGrowth: Math.round(userGrowth * 10) / 10,
      revenueGrowth,
      totalProjects,
      subscriptionStats,
    });

  } catch (error: any) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
