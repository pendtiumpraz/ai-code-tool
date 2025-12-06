import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET - Get user settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        settings: true,
        timezone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get active sessions
    const sessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        expires: { gt: new Date() },
      },
      select: {
        id: true,
        expires: true,
      },
    });

    // Get API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        lastUsed: true,
        usageCount: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // Default settings structure
    const defaultSettings = {
      notifications: {
        emailUpdates: true,
        projectAlerts: true,
        weeklyDigest: false,
        marketingEmails: false,
        securityAlerts: true,
        newFeatures: true,
      },
      appearance: {
        theme: 'dark',
        fontSize: 'medium',
        compactMode: false,
        animationsEnabled: true,
      },
      privacy: {
        showProfile: true,
        showActivity: false,
      },
    };

    // Merge with stored settings
    const userSettings = {
      ...defaultSettings,
      ...(user.settings as object || {}),
    };

    return NextResponse.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        timezone: user.timezone,
        createdAt: user.createdAt.toISOString(),
      },
      settings: userSettings,
      sessions: sessions.map((s: any) => ({
        id: s.id,
        expires: s.expires.toISOString(),
        isCurrent: true, // Simplified - in production, compare session tokens
      })),
      apiKeys: apiKeys.map((k: any) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        scopes: k.scopes,
        lastUsed: k.lastUsed?.toISOString(),
        usageCount: k.usageCount,
        expiresAt: k.expiresAt?.toISOString(),
        createdAt: k.createdAt.toISOString(),
      })),
    });

  } catch (error: any) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update user settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { profile, settings, password } = await req.json();

    const updates: any = {};

    // Update profile fields
    if (profile) {
      if (profile.name !== undefined) updates.name = profile.name;
      if (profile.timezone !== undefined) updates.timezone = profile.timezone;
      
      // Email change requires verification in production
      if (profile.email && profile.email !== session.user.email) {
        // Check if email is already taken
        const existing = await prisma.user.findUnique({
          where: { email: profile.email },
        });
        if (existing && existing.id !== userId) {
          return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
        }
        updates.email = profile.email;
      }
    }

    // Update settings
    if (settings) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
      });
      updates.settings = {
        ...(currentUser?.settings as object || {}),
        ...settings,
      };
    }

    // Update password
    if (password) {
      const { currentPassword, newPassword } = password;
      
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'Current and new password required' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (user?.password) {
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }
      }

      updates.password = await bcrypt.hash(newPassword, 10);

      // Log password change
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'password_change',
          resource: 'user',
          resourceId: userId,
        },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updates,
      select: {
        id: true,
        name: true,
        email: true,
        settings: true,
        timezone: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });

  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Special actions (create API key, revoke session, etc.)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { action, data } = await req.json();

    switch (action) {
      case 'create_api_key': {
        const { name, scopes, expiresIn } = data || {};
        
        // Generate API key
        const keyValue = generateApiKey();
        const hashedKey = await bcrypt.hash(keyValue, 10);
        
        const apiKey = await prisma.apiKey.create({
          data: {
            userId,
            name: name || 'API Key',
            key: hashedKey,
            prefix: keyValue.slice(0, 8),
            scopes: scopes || ['read'],
            expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) : null,
          },
        });

        await prisma.auditLog.create({
          data: {
            userId,
            action: 'create_api_key',
            resource: 'api_key',
            resourceId: apiKey.id,
          },
        });

        return NextResponse.json({
          success: true,
          apiKey: {
            id: apiKey.id,
            name: apiKey.name,
            key: keyValue, // Only shown once!
            prefix: apiKey.prefix,
          },
        });
      }

      case 'revoke_api_key': {
        const { keyId } = data || {};
        
        await prisma.apiKey.deleteMany({
          where: { id: keyId, userId },
        });

        await prisma.auditLog.create({
          data: {
            userId,
            action: 'delete_api_key',
            resource: 'api_key',
            resourceId: keyId,
          },
        });

        return NextResponse.json({ success: true });
      }

      case 'revoke_session': {
        const { sessionId } = data || {};
        
        await prisma.session.deleteMany({
          where: { id: sessionId, userId },
        });

        return NextResponse.json({ success: true });
      }

      case 'revoke_all_sessions': {
        await prisma.session.deleteMany({
          where: { userId },
        });

        return NextResponse.json({ success: true });
      }

      case 'delete_account': {
        // In production, this should be a more careful process
        // with confirmation, data export option, etc.
        await prisma.user.delete({
          where: { id: userId },
        });

        return NextResponse.json({ success: true, message: 'Account deleted' });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Settings action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'acs_'; // prefix for AI Code Studio
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}
