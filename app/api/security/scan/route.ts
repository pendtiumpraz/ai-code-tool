import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  ScanTarget, ScanResult, Vulnerability,
  calculateCVSS, scanModules 
} from '@/lib/security/scanner';
import { generateSecurityReport, generateRemediationFile } from '@/lib/security/report-generator';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { target, modules, authorization } = body;

    // Validate authorization
    if (!authorization || !authorization.confirmed) {
      return NextResponse.json(
        { error: 'Authorization required before scanning' },
        { status: 403 }
      );
    }

    // Create scan result
    const scanResult: ScanResult = {
      id: `scan-${nanoid(10)}`,
      target: {
        url: target.url,
        scope: target.scope || [target.url],
        authorization: {
          type: authorization.type,
          approvedBy: authorization.approvedBy,
          validUntil: authorization.validUntil ? new Date(authorization.validUntil) : undefined,
        },
      },
      startTime: new Date(),
      status: 'running',
      progress: 0,
      vulnerabilities: [],
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
        total: 0,
      },
      recommendations: [],
    };

    // Simulate scanning (in production, this would be real scanning)
    const vulnerabilities = await simulateScan(target.url, modules || ['all']);
    
    // Update results
    scanResult.vulnerabilities = vulnerabilities;
    scanResult.endTime = new Date();
    scanResult.status = 'completed';
    scanResult.progress = 100;

    // Calculate summary
    vulnerabilities.forEach(v => {
      scanResult.summary[v.severity]++;
      scanResult.summary.total++;
    });

    // Generate recommendations
    scanResult.recommendations = generateRecommendations(vulnerabilities);

    return NextResponse.json({
      success: true,
      result: scanResult,
    });

  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { error: 'Scan failed' },
      { status: 500 }
    );
  }
}

// Simulated vulnerability scan
async function simulateScan(url: string, modules: string[]): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];

  // Simulate finding vulnerabilities based on common issues
  const possibleVulns = [
    {
      title: 'Missing Content-Security-Policy Header',
      severity: 'medium' as const,
      category: 'Security Headers',
      description: 'The Content-Security-Policy header is not set. This header helps prevent XSS attacks by controlling which resources can be loaded.',
      cvssInput: {
        attackVector: 'N' as const,
        attackComplexity: 'L' as const,
        privilegesRequired: 'N' as const,
        userInteraction: 'R' as const,
        scope: 'U' as const,
        confidentialityImpact: 'L' as const,
        integrityImpact: 'L' as const,
        availabilityImpact: 'N' as const,
      },
      remediation: `Add the Content-Security-Policy header to your server configuration:

\`\`\`
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
\`\`\`

For Next.js, add to next.config.js:
\`\`\`javascript
async headers() {
  return [{
    source: '/:path*',
    headers: [{
      key: 'Content-Security-Policy',
      value: "default-src 'self'"
    }]
  }]
}
\`\`\``,
      references: [
        'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
        'https://owasp.org/www-project-secure-headers/',
      ],
      cwe: 'CWE-693',
      owasp: 'A05:2021',
    },
    {
      title: 'Missing X-Frame-Options Header',
      severity: 'medium' as const,
      category: 'Security Headers',
      description: 'The X-Frame-Options header is not set. This makes the site vulnerable to clickjacking attacks.',
      cvssInput: {
        attackVector: 'N' as const,
        attackComplexity: 'L' as const,
        privilegesRequired: 'N' as const,
        userInteraction: 'R' as const,
        scope: 'U' as const,
        confidentialityImpact: 'N' as const,
        integrityImpact: 'L' as const,
        availabilityImpact: 'N' as const,
      },
      remediation: `Add the X-Frame-Options header:

\`\`\`
X-Frame-Options: DENY
\`\`\`

Or use CSP frame-ancestors directive:
\`\`\`
Content-Security-Policy: frame-ancestors 'none';
\`\`\``,
      references: [
        'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options',
        'https://owasp.org/www-community/attacks/Clickjacking',
      ],
      cwe: 'CWE-1021',
      owasp: 'A05:2021',
    },
    {
      title: 'Potential SQL Injection',
      severity: 'high' as const,
      category: 'SQL Injection',
      description: 'The application may be vulnerable to SQL injection attacks. User input appears to be directly concatenated into SQL queries.',
      cvssInput: {
        attackVector: 'N' as const,
        attackComplexity: 'L' as const,
        privilegesRequired: 'N' as const,
        userInteraction: 'N' as const,
        scope: 'U' as const,
        confidentialityImpact: 'H' as const,
        integrityImpact: 'H' as const,
        availabilityImpact: 'H' as const,
      },
      remediation: `Use parameterized queries or prepared statements:

**Node.js (mysql2):**
\`\`\`javascript
// WRONG
const query = \`SELECT * FROM users WHERE id = \${userId}\`;

// CORRECT
const query = 'SELECT * FROM users WHERE id = ?';
connection.query(query, [userId]);
\`\`\`

**Prisma ORM:**
\`\`\`javascript
const user = await prisma.user.findUnique({
  where: { id: userId }
});
\`\`\``,
      references: [
        'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html',
        'https://owasp.org/www-community/attacks/SQL_Injection',
      ],
      cwe: 'CWE-89',
      owasp: 'A03:2021',
    },
    {
      title: 'Cookie Without HttpOnly Flag',
      severity: 'low' as const,
      category: 'Cookie Security',
      description: 'Session cookies are set without the HttpOnly flag, making them accessible to JavaScript and vulnerable to XSS-based session hijacking.',
      cvssInput: {
        attackVector: 'N' as const,
        attackComplexity: 'H' as const,
        privilegesRequired: 'N' as const,
        userInteraction: 'R' as const,
        scope: 'U' as const,
        confidentialityImpact: 'L' as const,
        integrityImpact: 'N' as const,
        availabilityImpact: 'N' as const,
      },
      remediation: `Set the HttpOnly flag on all sensitive cookies:

\`\`\`javascript
res.cookie('sessionId', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});
\`\`\``,
      references: [
        'https://owasp.org/www-community/HttpOnly',
      ],
      cwe: 'CWE-1004',
      owasp: 'A05:2021',
    },
    {
      title: 'Server Version Disclosure',
      severity: 'info' as const,
      category: 'Information Disclosure',
      description: 'The server response headers disclose version information that could help attackers identify known vulnerabilities.',
      cvssInput: {
        attackVector: 'N' as const,
        attackComplexity: 'L' as const,
        privilegesRequired: 'N' as const,
        userInteraction: 'N' as const,
        scope: 'U' as const,
        confidentialityImpact: 'N' as const,
        integrityImpact: 'N' as const,
        availabilityImpact: 'N' as const,
      },
      remediation: `Remove or obfuscate server version headers:

**Nginx:**
\`\`\`nginx
server_tokens off;
\`\`\`

**Express.js:**
\`\`\`javascript
app.disable('x-powered-by');
\`\`\``,
      references: [
        'https://owasp.org/www-project-web-security-testing-guide/',
      ],
      cwe: 'CWE-200',
      owasp: 'A05:2021',
    },
  ];

  // Randomly select vulnerabilities to simulate finding
  const numVulns = Math.floor(Math.random() * 4) + 2;
  const selectedVulns = possibleVulns
    .sort(() => Math.random() - 0.5)
    .slice(0, numVulns);

  for (const v of selectedVulns) {
    const cvss = calculateCVSS(v.cvssInput);
    
    vulnerabilities.push({
      id: `vuln-${nanoid(8)}`,
      title: v.title,
      severity: v.severity,
      cvss: {
        score: cvss.score,
        vector: cvss.vector,
      },
      category: v.category,
      description: v.description,
      evidence: {
        url: url,
        parameter: v.category === 'SQL Injection' ? 'id' : undefined,
        payload: v.category === 'SQL Injection' ? "' OR '1'='1" : undefined,
      },
      remediation: v.remediation,
      references: v.references,
      cwe: v.cwe,
      owasp: v.owasp,
    });
  }

  return vulnerabilities;
}

function generateRecommendations(vulnerabilities: Vulnerability[]): string[] {
  const recommendations: string[] = [];
  
  const hasCritical = vulnerabilities.some(v => v.severity === 'critical');
  const hasHigh = vulnerabilities.some(v => v.severity === 'high');
  const hasHeaders = vulnerabilities.some(v => v.category === 'Security Headers');
  const hasSQLi = vulnerabilities.some(v => v.category === 'SQL Injection');

  if (hasCritical) {
    recommendations.push('URGENT: Address critical vulnerabilities immediately');
  }
  if (hasHigh) {
    recommendations.push('Prioritize fixing high-severity issues within 1 week');
  }
  if (hasHeaders) {
    recommendations.push('Implement all recommended security headers');
  }
  if (hasSQLi) {
    recommendations.push('Review all database queries for injection vulnerabilities');
  }
  
  recommendations.push('Schedule regular security assessments');
  recommendations.push('Implement security training for development team');
  
  return recommendations;
}

// Generate report endpoint
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const scanId = searchParams.get('id');
  const format = searchParams.get('format') || 'md';

  // In production, fetch from database
  // For now, return sample report
  
  return NextResponse.json({
    message: 'Use POST to run a scan, or provide scan ID to get results',
  });
}
