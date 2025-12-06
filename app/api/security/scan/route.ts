import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { realScan } from '@/lib/security/scanner';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { target, authorization } = body;

    // Validate target URL
    if (!target?.url) {
      return NextResponse.json(
        { error: 'Target URL is required' },
        { status: 400 }
      );
    }

    // Validate authorization
    if (!authorization || !authorization.confirmed) {
      return NextResponse.json(
        { error: 'Authorization required before scanning. You must confirm you own or have permission to scan this website.' },
        { status: 403 }
      );
    }

    console.log(`[Scan API] Starting real scan for: ${target.url}`);
    
    // Run REAL scan
    const scanResult = await realScan(target.url);

    console.log(`[Scan API] Scan completed. Found ${scanResult.summary.total} issues.`);

    return NextResponse.json({
      success: true,
      result: scanResult,
    });

  } catch (error: any) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { error: error.message || 'Scan failed' },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving scan results
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST to run a scan with target URL and authorization',
  });
}
