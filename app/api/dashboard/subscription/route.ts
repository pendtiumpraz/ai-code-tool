import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Get user's subscription
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all available plans
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Format current subscription
    const currentPlan = user.subscription ? {
      id: user.subscription.id,
      name: user.subscription.plan?.name || 'Free',
      displayName: user.subscription.plan?.displayName || 'Free Plan',
      status: user.subscription.status,
      tokensUsed: user.monthlyTokensUsed,
      tokensLimit: user.subscription.plan?.tokensPerMonth || 10000,
      currentPeriodStart: user.subscription.currentPeriodStart?.toISOString(),
      currentPeriodEnd: user.subscription.currentPeriodEnd?.toISOString(),
      trialEndsAt: user.subscription.trialEndsAt?.toISOString(),
      canceledAt: user.subscription.canceledAt?.toISOString(),
      amount: user.subscription.plan?.priceMonthly || 0,
      interval: 'monthly',
      daysRemaining: calculateDaysRemaining(user.subscription.currentPeriodEnd),
    } : {
      id: null,
      name: 'Free',
      displayName: 'Free Plan',
      status: 'ACTIVE',
      tokensUsed: user.monthlyTokensUsed,
      tokensLimit: 10000,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      amount: 0,
      interval: 'monthly',
      daysRemaining: null,
    };

    // Format plans for display
    const formattedPlans = plans.map((plan: any) => ({
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      tokensPerMonth: plan.tokensPerMonth,
      features: plan.features,
      highlighted: plan.highlighted,
      current: user.subscription?.planId === plan.id,
    }));

    // Get invoices/payment history (from audit logs for now)
    const invoices = await prisma.auditLog.findMany({
      where: {
        userId,
        action: { in: ['payment', 'subscription_created', 'subscription_renewed'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const formattedInvoices = invoices.map((inv: any, i: number) => ({
      id: `INV-${String(i + 1).padStart(3, '0')}`,
      date: inv.createdAt.toISOString().split('T')[0],
      amount: currentPlan.amount,
      status: 'paid',
    }));

    return NextResponse.json({
      currentPlan,
      plans: formattedPlans,
      invoices: formattedInvoices,
      usage: {
        tokensUsed: user.monthlyTokensUsed,
        tokensLimit: currentPlan.tokensLimit,
        percentage: Math.round((user.monthlyTokensUsed / currentPlan.tokensLimit) * 100),
        resetDate: getNextResetDate(),
      },
    });

  } catch (error: any) {
    console.error('Dashboard subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Update subscription (upgrade/downgrade)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { planId, action } = await req.json();

    if (action === 'cancel') {
      // Cancel subscription
      const subscription = await prisma.subscription.update({
        where: { userId },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });

      await prisma.auditLog.create({
        data: {
          userId,
          action: 'subscription_cancelled',
          resource: 'subscription',
          resourceId: subscription.id,
        },
      });

      return NextResponse.json({ success: true, message: 'Subscription cancelled' });
    }

    if (!planId) {
      return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });
    }

    // Check if plan exists
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        planId,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: getNextBillingDate(),
        canceledAt: null,
      },
      create: {
        userId,
        planId,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: getNextBillingDate(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'subscription_updated',
        resource: 'subscription',
        resourceId: subscription.id,
        details: { planId, planName: plan.name },
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Upgraded to ${plan.displayName}`,
      subscription,
    });

  } catch (error: any) {
    console.error('Update subscription error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function calculateDaysRemaining(endDate: Date | null | undefined): number | null {
  if (!endDate) return null;
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getNextResetDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString().split('T')[0];
}

function getNextBillingDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
