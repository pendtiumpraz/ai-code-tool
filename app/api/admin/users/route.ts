import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// ============================================
// ADMIN USERS API
// ============================================

// GET - List all users
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const plan = searchParams.get('plan');

    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (role && role !== 'all') {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          subscription: {
            include: { plan: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Transform for response
    const transformedUsers = users.map((user: typeof users[number]) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      plan: user.subscription?.plan?.name || 'free',
      status: user.subscription?.status || 'active',
      createdAt: user.createdAt.toISOString(),
      tokensUsed: user.monthlyTokensUsed,
    }));

    return NextResponse.json({
      users: transformedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });

  } catch (error: any) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, role, status } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Prevent self-demotion
    if (userId === session.user.id && role && role !== session.user.role) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    // Only SUPER_ADMIN can create other admins
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      if (session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Only super admins can create admins' }, { status: 403 });
      }
    }

    const updates: any = {};
    if (role) updates.role = role;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    // Update subscription status if provided
    if (status) {
      await prisma.subscription.updateMany({
        where: { userId },
        data: { status },
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        userId,
        action: 'update_user',
        resource: 'user',
        resourceId: userId,
        details: { role, status },
      },
    });

    return NextResponse.json({ success: true, user });

  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // Delete user (cascades to all related data)
    await prisma.user.delete({
      where: { id: userId },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: 'delete_user',
        resource: 'user',
        resourceId: userId,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
