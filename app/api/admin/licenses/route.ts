import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

// ============================================
// ADMIN LICENSES API
// ============================================

// Generate license key
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 4;
  const segmentLength = 4;
  
  const parts: string[] = [];
  for (let i = 0; i < segments; i++) {
    let segment = '';
    for (let j = 0; j < segmentLength; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(segment);
  }
  
  return parts.join('-');
}

// GET - List licenses
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const licenses = await prisma.license.findMany({
      include: {
        plan: true,
        createdBy: {
          select: { name: true, email: true },
        },
        assignedTo: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const transformedLicenses = licenses.map(license => ({
      id: license.id,
      code: license.code,
      plan: license.plan.name,
      assignedTo: license.assignedToId,
      assignedEmail: license.assignedTo?.email,
      validFrom: license.validFrom.toISOString(),
      validUntil: license.validUntil?.toISOString(),
      isActive: license.isActive,
      activationCount: license.activationCount,
      maxActivations: license.maxActivations,
      createdAt: license.createdAt.toISOString(),
      notes: license.notes,
      createdBy: license.createdBy.email,
    }));

    return NextResponse.json({ licenses: transformedLicenses });

  } catch (error: any) {
    console.error('List licenses error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create license
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planName, validDays, maxActivations, notes, customTokensPerMonth, customStorageMB } = await req.json();

    if (!planName) {
      return NextResponse.json({ error: 'Plan name required' }, { status: 400 });
    }

    // Get plan
    const plan = await prisma.plan.findUnique({
      where: { name: planName },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // Generate unique license key
    let code = generateLicenseKey();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.license.findUnique({ where: { code } });
      if (!existing) break;
      code = generateLicenseKey();
      attempts++;
    }

    // Calculate validity
    const validUntil = validDays ? new Date(Date.now() + validDays * 24 * 60 * 60 * 1000) : null;

    // Create license
    const license = await prisma.license.create({
      data: {
        code,
        planId: plan.id,
        createdById: session.user.id,
        validUntil,
        maxActivations: maxActivations || 1,
        notes,
        customTokensPerMonth,
        customStorageMB,
      },
      include: {
        plan: true,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: 'create_license',
        resource: 'license',
        resourceId: license.id,
        details: { code: license.code, plan: planName },
      },
    });

    return NextResponse.json({ license });

  } catch (error: any) {
    console.error('Create license error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update/Revoke license
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { licenseId, isActive, notes, validUntil } = await req.json();

    if (!licenseId) {
      return NextResponse.json({ error: 'License ID required' }, { status: 400 });
    }

    const license = await prisma.license.update({
      where: { id: licenseId },
      data: {
        ...(isActive !== undefined ? { isActive } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(validUntil ? { validUntil: new Date(validUntil) } : {}),
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: isActive === false ? 'revoke_license' : 'update_license',
        resource: 'license',
        resourceId: licenseId,
        details: { isActive, notes },
      },
    });

    return NextResponse.json({ license });

  } catch (error: any) {
    console.error('Update license error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete license
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const licenseId = searchParams.get('licenseId');

    if (!licenseId) {
      return NextResponse.json({ error: 'License ID required' }, { status: 400 });
    }

    // Get license info before deletion
    const license = await prisma.license.findUnique({
      where: { id: licenseId },
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    // Delete license
    await prisma.license.delete({
      where: { id: licenseId },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: 'delete_license',
        resource: 'license',
        resourceId: licenseId,
        details: { code: license.code },
      },
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Delete license error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
