import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { encrypt, decrypt, maskApiKey } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

// GET - Retrieve user's API keys (masked for display)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { securityKeys: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const keys = user.securityKeys;
    
    // Return masked keys for display
    return NextResponse.json({
      success: true,
      keys: {
        shodan: keys?.shodanKey ? {
          configured: true,
          masked: maskApiKey(decrypt(keys.shodanKey)),
        } : { configured: false },
        virusTotal: keys?.virusTotalKey ? {
          configured: true,
          masked: maskApiKey(decrypt(keys.virusTotalKey)),
        } : { configured: false },
      },
    });

  } catch (error: any) {
    console.error('Get security keys error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get keys' }, { status: 500 });
  }
}

// POST - Save/Update user's API keys
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shodanKey, virusTotalKey } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { securityKeys: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare data - only update keys that are provided
    const updateData: any = {};
    
    if (shodanKey !== undefined) {
      updateData.shodanKey = shodanKey ? encrypt(shodanKey) : null;
    }
    if (virusTotalKey !== undefined) {
      updateData.virusTotalKey = virusTotalKey ? encrypt(virusTotalKey) : null;
    }

    // Upsert - create or update
    const securityKeys = await prisma.userSecurityKeys.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        ...updateData,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'API keys saved successfully',
      keys: {
        shodan: { configured: !!securityKeys.shodanKey },
        virusTotal: { configured: !!securityKeys.virusTotalKey },
      },
    });

  } catch (error: any) {
    console.error('Save security keys error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save keys' }, { status: 500 });
  }
}

// DELETE - Remove specific API key
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyType = searchParams.get('key'); // 'shodan' or 'virusTotal'

    if (!keyType || !['shodan', 'virusTotal'].includes(keyType)) {
      return NextResponse.json({ error: 'Invalid key type' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (keyType === 'shodan') {
      updateData.shodanKey = null;
    } else if (keyType === 'virusTotal') {
      updateData.virusTotalKey = null;
    }

    await prisma.userSecurityKeys.update({
      where: { userId: user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `${keyType} API key removed`,
    });

  } catch (error: any) {
    console.error('Delete security key error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete key' }, { status: 500 });
  }
}
