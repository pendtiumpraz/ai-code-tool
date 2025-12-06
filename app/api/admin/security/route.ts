import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get audit logs as security events
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Get active sessions
    const sessions = await prisma.session.findMany({
      where: { expires: { gt: now } },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { expires: 'desc' },
    });

    // Calculate stats
    const [
      totalUsers,
      activeSessions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.session.count({ where: { expires: { gt: now } } }),
    ]);

    // Count login events (from audit logs)
    const loginEvents = auditLogs.filter(
      (log: any) => log.action.includes('login') && log.createdAt >= last24h
    );
    const loginAttempts24h = loginEvents.length;
    const failedLogins24h = loginEvents.filter(
      (log: any) => log.action === 'login_failed'
    ).length;

    // Count suspicious activities
    const suspiciousActivities = auditLogs.filter(
      (log: any) => log.action === 'suspicious_activity' && log.createdAt >= last24h
    ).length;

    // Count users with 2FA (stored in settings JSON)
    const usersWithSettings = await prisma.user.findMany({
      select: { settings: true },
    });
    const users2FAEnabled = usersWithSettings.filter(
      (u: any) => (u.settings as any)?.twoFactorEnabled === true
    ).length;

    // Calculate security score
    const securityScore = calculateSecurityScore({
      users2FAEnabled,
      totalUsers,
      failedLogins24h,
      suspiciousActivities,
    });

    // Transform audit logs to events
    const events = auditLogs.map((log: any) => ({
      id: log.id,
      type: mapActionToEventType(log.action),
      userId: log.userId,
      userEmail: '', // Would need to join with user
      ipAddress: log.ipAddress || 'Unknown',
      location: 'Unknown', // Would need GeoIP lookup
      userAgent: log.userAgent,
      timestamp: log.createdAt.toISOString(),
      details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details),
      severity: getSeverity(log.action),
    }));

    // Transform sessions
    const activeSess = sessions.map((sess: any) => ({
      id: sess.id,
      userId: sess.userId,
      userEmail: sess.user.email,
      userName: sess.user.name || 'Unknown',
      ipAddress: 'Unknown', // Session doesn't store IP by default
      location: 'Unknown',
      device: 'Unknown',
      browser: 'Unknown',
      lastActive: sess.expires.toISOString(),
      createdAt: sess.expires.toISOString(), // Sessions don't have createdAt by default
      isCurrent: sess.sessionToken === session.user.id,
    }));

    return NextResponse.json({
      events,
      sessions: activeSess,
      stats: {
        securityScore,
        loginAttempts24h,
        failedLogins24h,
        activeSessions,
        suspiciousActivities,
        users2FAEnabled,
        totalUsers,
      },
    });

  } catch (error: any) {
    console.error('Admin security error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Security actions (revoke session, block IP, etc.)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, sessionId, userId } = await req.json();

    switch (action) {
      case 'revoke_session':
        if (!sessionId) {
          return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }
        await prisma.session.delete({ where: { id: sessionId } });
        
        await prisma.auditLog.create({
          data: {
            adminId: session.user.id,
            action: 'session_revoked',
            resource: 'session',
            resourceId: sessionId,
          },
        });
        break;

      case 'revoke_all_sessions':
        if (!userId) {
          return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }
        await prisma.session.deleteMany({ where: { userId } });
        
        await prisma.auditLog.create({
          data: {
            adminId: session.user.id,
            userId,
            action: 'all_sessions_revoked',
            resource: 'user',
            resourceId: userId,
          },
        });
        break;

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Security action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function calculateSecurityScore(data: {
  users2FAEnabled: number;
  totalUsers: number;
  failedLogins24h: number;
  suspiciousActivities: number;
}): number {
  let score = 100;
  
  // 2FA adoption (up to -20 points)
  const twoFARate = data.totalUsers > 0 ? data.users2FAEnabled / data.totalUsers : 0;
  score -= Math.round((1 - twoFARate) * 20);
  
  // Failed logins (up to -15 points)
  score -= Math.min(data.failedLogins24h * 2, 15);
  
  // Suspicious activities (up to -20 points)
  score -= Math.min(data.suspiciousActivities * 5, 20);
  
  return Math.max(0, Math.min(100, score));
}

function mapActionToEventType(action: string): string {
  const mapping: Record<string, string> = {
    'login': 'login_success',
    'login_failed': 'login_failed',
    'logout': 'logout',
    'password_change': 'password_change',
    'create_api_key': 'api_key_created',
    'delete_api_key': 'api_key_revoked',
    'enable_2fa': '2fa_enabled',
    'disable_2fa': '2fa_disabled',
    'session_revoked': 'session_revoked',
    'suspicious_activity': 'suspicious_activity',
  };
  return mapping[action] || action;
}

function getSeverity(action: string): 'low' | 'medium' | 'high' | 'critical' {
  const high = ['login_failed', 'suspicious_activity', 'all_sessions_revoked'];
  const critical = ['brute_force', 'account_compromised'];
  const medium = ['password_change', 'api_key_created', 'api_key_revoked', '2fa_disabled'];
  
  if (critical.includes(action)) return 'critical';
  if (high.includes(action)) return 'high';
  if (medium.includes(action)) return 'medium';
  return 'low';
}
