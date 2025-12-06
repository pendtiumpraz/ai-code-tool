import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - List all subscriptions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const planId = searchParams.get('plan');
    const search = searchParams.get('search');

    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    if (planId && planId !== 'all') {
      where.planId = planId;
    }

    if (search) {
      where.user = {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          plan: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscription.count({ where }),
    ]);

    // Calculate stats
    const [
      totalActive,
      totalCancelled,
      totalTrial,
      monthlyRevenue,
    ] = await Promise.all([
      prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      prisma.subscription.count({ where: { status: 'CANCELED' } }),
      prisma.subscription.count({ where: { status: 'TRIAL' } }),
      prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        include: { plan: true },
      }),
    ]);

    const mrr = monthlyRevenue.reduce((sum: number, sub: any) => sum + (sub.plan?.priceMonthly || 0), 0);

    // Transform subscriptions
    const transformedSubs = subscriptions.map((sub: any) => ({
      id: sub.id,
      userId: sub.userId,
      userName: sub.user.name || 'No name',
      userEmail: sub.user.email,
      plan: sub.plan?.name || 'Unknown',
      status: sub.status.toLowerCase(),
      amount: sub.plan?.priceMonthly || 0,
      currency: 'USD',
      interval: 'monthly' as const,
      startDate: sub.currentPeriodStart?.toISOString().split('T')[0] || sub.createdAt.toISOString().split('T')[0],
      endDate: sub.currentPeriodEnd?.toISOString().split('T')[0] || '',
      nextBillingDate: sub.currentPeriodEnd?.toISOString().split('T')[0],
      trialEndsAt: sub.trialEndsAt?.toISOString().split('T')[0],
      cancelledAt: sub.canceledAt?.toISOString().split('T')[0],
    }));

    // Calculate churn rate
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const cancelledThisMonth = await prisma.subscription.count({
      where: {
        status: 'CANCELED',
        canceledAt: { gte: startOfMonth },
      },
    });
    
    const churnRate = totalActive > 0 
      ? Math.round((cancelledThisMonth / totalActive) * 1000) / 10 
      : 0;

    // New subscriptions this month
    const newThisMonth = await prisma.subscription.count({
      where: {
        createdAt: { gte: startOfMonth },
      },
    });

    return NextResponse.json({
      subscriptions: transformedSubs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalActive,
        totalRevenue: mrr * 12,
        mrr,
        arr: mrr * 12,
        churnRate,
        newThisMonth,
        cancelledThisMonth,
      },
    });

  } catch (error: any) {
    console.error('Admin subscriptions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update subscription
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscriptionId, status, planId } = await req.json();

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
    }

    const updates: any = {};
    if (status) updates.status = status.toUpperCase();
    if (planId) updates.planId = planId;
    if (status === 'CANCELED') updates.canceledAt = new Date();

    const subscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: updates,
      include: { user: true, plan: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        userId: subscription.userId,
        action: 'update_subscription',
        resource: 'subscription',
        resourceId: subscriptionId,
        details: { status, planId },
      },
    });

    return NextResponse.json({ success: true, subscription });

  } catch (error: any) {
    console.error('Update subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create manual subscription
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, planId, status, periodEnd } = await req.json();

    if (!userId || !planId) {
      return NextResponse.json({ error: 'User ID and Plan ID required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already has subscription
    const existing = await prisma.subscription.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json({ error: 'User already has subscription' }, { status: 400 });
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planId,
        status: status?.toUpperCase() || 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd ? new Date(periodEnd) : undefined,
      },
      include: { user: true, plan: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        userId,
        action: 'create_subscription',
        resource: 'subscription',
        resourceId: subscription.id,
        details: { planId, status },
      },
    });

    return NextResponse.json({ success: true, subscription });

  } catch (error: any) {
    console.error('Create subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
