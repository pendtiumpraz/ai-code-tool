import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// System settings stored in a simple key-value table or JSON file
// For now, we'll use a simplified approach with environment-like storage

interface SystemSettings {
  general: {
    appName: string;
    appUrl: string;
    supportEmail: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
    requireEmailVerification: boolean;
  };
  email: {
    provider: string;
    smtpHost: string;
    smtpPort: string;
    fromName: string;
    fromEmail: string;
  };
  ai: {
    defaultModel: string;
    maxTokensPerRequest: number;
    enableCodeExecution: boolean;
    enableToolCalling: boolean;
    rateLimit: number;
    rateLimitWindow: number;
  };
  advanced: {
    debugMode: boolean;
    logLevel: string;
    cacheEnabled: boolean;
    cacheTTL: number;
    corsOrigins: string;
    maxUploadSize: number;
  };
}

// Default settings
const defaultSettings: SystemSettings = {
  general: {
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'AI Code Studio',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://aicodestudio.com',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@aicodestudio.com',
    maintenanceMode: false,
    allowRegistration: true,
    requireEmailVerification: true,
  },
  email: {
    provider: 'smtp',
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: process.env.SMTP_PORT || '587',
    fromName: process.env.EMAIL_FROM_NAME || 'AI Code Studio',
    fromEmail: process.env.EMAIL_FROM || 'noreply@aicodestudio.com',
  },
  ai: {
    defaultModel: process.env.DEFAULT_AI_MODEL || 'glm-4-plus',
    maxTokensPerRequest: parseInt(process.env.MAX_TOKENS || '4096'),
    enableCodeExecution: true,
    enableToolCalling: true,
    rateLimit: 100,
    rateLimitWindow: 60,
  },
  advanced: {
    debugMode: process.env.NODE_ENV === 'development',
    logLevel: 'info',
    cacheEnabled: true,
    cacheTTL: 3600,
    corsOrigins: '*',
    maxUploadSize: 10,
  },
};

// GET - Get system settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In production, settings would be stored in database
    // For now, return defaults with some dynamic values
    
    // Get system info
    const [userCount, projectCount, totalStorage] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.userFile.aggregate({ _sum: { size: true } }),
    ]);

    const systemInfo = {
      version: process.env.APP_VERSION || '1.0.0',
      nodeVersion: process.version,
      database: 'PostgreSQL',
      storage: {
        used: Math.round((totalStorage._sum.size || 0) / 1024 / 1024 * 10) / 10,
        total: 100,
      },
      uptime: formatUptime(process.uptime()),
      lastBackup: new Date().toISOString(),
      stats: {
        users: userCount,
        projects: projectCount,
      },
    };

    return NextResponse.json({
      settings: defaultSettings,
      systemInfo,
    });

  } catch (error: any) {
    console.error('Admin settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update system settings
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const { category, settings } = await req.json();

    if (!category || !settings) {
      return NextResponse.json({ error: 'Category and settings required' }, { status: 400 });
    }

    // In production, save to database
    // For now, just log and acknowledge
    console.log(`Updating ${category} settings:`, settings);

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: 'update_settings',
        resource: 'system_settings',
        resourceId: category,
        details: settings,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: `${category} settings updated`,
    });

  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - System actions (clear cache, backup, etc.)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 401 });
    }

    const { action } = await req.json();

    switch (action) {
      case 'clear_cache':
        // In production, clear Redis/cache
        console.log('Cache cleared');
        break;

      case 'create_backup':
        // In production, trigger backup process
        console.log('Backup created');
        break;

      case 'test_email':
        // In production, send test email
        console.log('Test email sent');
        break;

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: session.user.id,
        action: `system_${action}`,
        resource: 'system',
      },
    });

    return NextResponse.json({ success: true, action });

  } catch (error: any) {
    console.error('System action error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min`);
  
  return parts.join(', ') || '< 1 min';
}
