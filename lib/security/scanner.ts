// ============================================
// SECURITY SCANNER - Live Website Testing
// ============================================

// Real Scanner Functions
export async function realScan(targetUrl: string): Promise<ScanResult> {
  const startTime = new Date();
  const vulnerabilities: Vulnerability[] = [];
  const url = normalizeUrl(targetUrl);
  
  console.log(`[Scanner] Starting scan for: ${url}`);
  
  try {
    // 1. Basic connectivity check
    const basicCheck = await checkConnectivity(url);
    if (!basicCheck.success) {
      throw new Error(`Cannot connect to ${url}: ${basicCheck.error}`);
    }
    
    // 2. Security Headers Check
    const headerVulns = await checkSecurityHeaders(url);
    vulnerabilities.push(...headerVulns);
    
    // 3. SSL/TLS Check
    if (url.startsWith('https://')) {
      const sslVulns = await checkSSL(url);
      vulnerabilities.push(...sslVulns);
    } else {
      vulnerabilities.push({
        id: 'no-https',
        title: 'Website Not Using HTTPS',
        severity: 'high',
        cvss: { score: 7.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N' },
        category: 'Transport Security',
        description: 'The website is not using HTTPS, which means all traffic is unencrypted.',
        evidence: { url },
        remediation: 'Configure SSL/TLS certificate and redirect all HTTP traffic to HTTPS.',
        references: ['https://letsencrypt.org/'],
        cwe: 'CWE-319',
        owasp: 'A02:2021'
      });
    }
    
    // 4. Technology Detection
    const techInfo = await detectTechnology(url);
    
    // 5. Common Files/Paths Check
    const exposedFiles = await checkExposedFiles(url);
    vulnerabilities.push(...exposedFiles);
    
    // 6. Cookie Security Check
    const cookieVulns = await checkCookies(url);
    vulnerabilities.push(...cookieVulns);
    
    // Calculate summary
    const summary = {
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      medium: vulnerabilities.filter(v => v.severity === 'medium').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length,
      info: vulnerabilities.filter(v => v.severity === 'info').length,
      total: vulnerabilities.length,
    };
    
    return {
      id: `scan-${Date.now()}`,
      target: { url, scope: ['full'], authorization: { type: 'owner' } },
      startTime,
      endTime: new Date(),
      status: 'completed',
      progress: 100,
      vulnerabilities,
      summary,
      recommendations: generateRecommendations(vulnerabilities),
      techInfo,
    };
    
  } catch (error: any) {
    return {
      id: `scan-${Date.now()}`,
      target: { url, scope: ['full'], authorization: { type: 'owner' } },
      startTime,
      endTime: new Date(),
      status: 'failed',
      progress: 0,
      vulnerabilities: [],
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 },
      recommendations: [],
      error: error.message,
    };
  }
}

function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url.replace(/\/$/, '');
}

async function checkConnectivity(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function checkSecurityHeaders(url: string): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];
  
  try {
    const response = await fetch(url, { method: 'GET' });
    const headers = response.headers;
    
    const requiredHeaders = [
      { 
        name: 'Strict-Transport-Security',
        missing: {
          title: 'Missing HSTS Header',
          severity: 'medium' as const,
          score: 5.3,
          description: 'HTTP Strict Transport Security (HSTS) header is not set. This allows downgrade attacks.',
          remediation: 'Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains',
          cwe: 'CWE-319'
        }
      },
      {
        name: 'X-Content-Type-Options',
        missing: {
          title: 'Missing X-Content-Type-Options Header',
          severity: 'low' as const,
          score: 3.1,
          description: 'X-Content-Type-Options header is not set. This could allow MIME type sniffing attacks.',
          remediation: 'Add header: X-Content-Type-Options: nosniff',
          cwe: 'CWE-16'
        }
      },
      {
        name: 'X-Frame-Options',
        missing: {
          title: 'Missing X-Frame-Options Header',
          severity: 'medium' as const,
          score: 4.3,
          description: 'X-Frame-Options header is not set. This could allow clickjacking attacks.',
          remediation: 'Add header: X-Frame-Options: DENY or SAMEORIGIN',
          cwe: 'CWE-1021'
        }
      },
      {
        name: 'Content-Security-Policy',
        missing: {
          title: 'Missing Content-Security-Policy Header',
          severity: 'medium' as const,
          score: 5.0,
          description: 'Content-Security-Policy header is not set. This reduces protection against XSS attacks.',
          remediation: 'Implement a Content-Security-Policy header appropriate for your application.',
          cwe: 'CWE-16'
        }
      },
      {
        name: 'X-XSS-Protection',
        missing: {
          title: 'Missing X-XSS-Protection Header',
          severity: 'low' as const,
          score: 2.1,
          description: 'X-XSS-Protection header is not set (legacy browser protection).',
          remediation: 'Add header: X-XSS-Protection: 1; mode=block',
          cwe: 'CWE-79'
        }
      },
      {
        name: 'Referrer-Policy',
        missing: {
          title: 'Missing Referrer-Policy Header',
          severity: 'low' as const,
          score: 2.0,
          description: 'Referrer-Policy header is not set. This could leak sensitive URL information.',
          remediation: 'Add header: Referrer-Policy: strict-origin-when-cross-origin',
          cwe: 'CWE-200'
        }
      },
      {
        name: 'Permissions-Policy',
        missing: {
          title: 'Missing Permissions-Policy Header',
          severity: 'info' as const,
          score: 0,
          description: 'Permissions-Policy header is not set. This controls browser features.',
          remediation: 'Add Permissions-Policy header to restrict browser features.',
          cwe: 'CWE-16'
        }
      },
    ];
    
    for (const header of requiredHeaders) {
      if (!headers.get(header.name)) {
        vulnerabilities.push({
          id: `missing-${header.name.toLowerCase()}`,
          title: header.missing.title,
          severity: header.missing.severity,
          cvss: { score: header.missing.score, vector: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N` },
          category: 'Security Headers',
          description: header.missing.description,
          evidence: { url, parameter: header.name },
          remediation: header.missing.remediation,
          references: ['https://owasp.org/www-project-secure-headers/'],
          cwe: header.missing.cwe,
          owasp: 'A05:2021'
        });
      }
    }
    
    // Check for dangerous headers
    const serverHeader = headers.get('Server');
    if (serverHeader && /\d+\.\d+/.test(serverHeader)) {
      vulnerabilities.push({
        id: 'server-version-disclosure',
        title: 'Server Version Disclosure',
        severity: 'info',
        cvss: { score: 0, vector: '' },
        category: 'Information Disclosure',
        description: `Server header reveals version information: ${serverHeader}`,
        evidence: { url, response: serverHeader },
        remediation: 'Remove or obfuscate the Server header version information.',
        references: ['https://owasp.org/www-project-web-security-testing-guide/'],
        cwe: 'CWE-200'
      });
    }
    
    const poweredBy = headers.get('X-Powered-By');
    if (poweredBy) {
      vulnerabilities.push({
        id: 'x-powered-by-disclosure',
        title: 'Technology Stack Disclosure',
        severity: 'low',
        cvss: { score: 2.0, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N' },
        category: 'Information Disclosure',
        description: `X-Powered-By header reveals technology: ${poweredBy}`,
        evidence: { url, response: poweredBy },
        remediation: 'Remove the X-Powered-By header from responses.',
        references: ['https://owasp.org/www-project-web-security-testing-guide/'],
        cwe: 'CWE-200'
      });
    }
    
  } catch (error) {
    console.error('Header check error:', error);
  }
  
  return vulnerabilities;
}

async function checkSSL(url: string): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];
  // Note: Full SSL analysis requires server-side tools
  // This is a basic check
  
  try {
    const response = await fetch(url);
    // If we got here over HTTPS, basic SSL is working
    // For detailed SSL analysis, would need server-side tools like ssllabs API
  } catch (error: any) {
    if (error.message.includes('certificate')) {
      vulnerabilities.push({
        id: 'ssl-certificate-issue',
        title: 'SSL Certificate Issue',
        severity: 'high',
        cvss: { score: 7.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N' },
        category: 'Transport Security',
        description: `SSL certificate error: ${error.message}`,
        evidence: { url },
        remediation: 'Fix the SSL certificate issue - ensure valid, non-expired certificate from trusted CA.',
        references: ['https://letsencrypt.org/'],
        cwe: 'CWE-295'
      });
    }
  }
  
  return vulnerabilities;
}

async function detectTechnology(url: string): Promise<any> {
  const tech: any = { server: null, framework: null, cms: null, libraries: [] };
  
  try {
    const response = await fetch(url);
    const html = await response.text();
    const headers = response.headers;
    
    // Server detection
    tech.server = headers.get('Server') || 'Unknown';
    tech.poweredBy = headers.get('X-Powered-By');
    
    // CMS Detection
    if (html.includes('wp-content') || html.includes('wordpress')) tech.cms = 'WordPress';
    else if (html.includes('Joomla')) tech.cms = 'Joomla';
    else if (html.includes('drupal')) tech.cms = 'Drupal';
    else if (html.includes('shopify')) tech.cms = 'Shopify';
    
    // Framework Detection
    if (html.includes('__next')) tech.framework = 'Next.js';
    else if (html.includes('ng-version')) tech.framework = 'Angular';
    else if (html.includes('__nuxt')) tech.framework = 'Nuxt.js';
    else if (html.includes('react')) tech.framework = 'React';
    else if (html.includes('vue')) tech.framework = 'Vue.js';
    else if (html.includes('laravel')) tech.framework = 'Laravel';
    
    // Library Detection
    if (html.includes('jquery')) tech.libraries.push('jQuery');
    if (html.includes('bootstrap')) tech.libraries.push('Bootstrap');
    if (html.includes('tailwind')) tech.libraries.push('Tailwind CSS');
    
  } catch (error) {
    console.error('Tech detection error:', error);
  }
  
  return tech;
}

async function checkExposedFiles(url: string): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];
  
  const sensitiveFiles = [
    { path: '/.git/config', name: 'Git Configuration' },
    { path: '/.env', name: 'Environment File' },
    { path: '/wp-config.php', name: 'WordPress Config' },
    { path: '/config.php', name: 'PHP Config' },
    { path: '/backup.sql', name: 'SQL Backup' },
    { path: '/database.sql', name: 'Database Dump' },
    { path: '/.htaccess', name: 'Apache Config' },
    { path: '/web.config', name: 'IIS Config' },
    { path: '/phpinfo.php', name: 'PHP Info' },
    { path: '/admin', name: 'Admin Panel' },
    { path: '/administrator', name: 'Administrator Panel' },
    { path: '/robots.txt', name: 'Robots.txt' },
    { path: '/sitemap.xml', name: 'Sitemap' },
    { path: '/.well-known/security.txt', name: 'Security.txt' },
  ];
  
  for (const file of sensitiveFiles) {
    try {
      const response = await fetch(`${url}${file.path}`, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok && response.status === 200) {
        const severity = file.path.includes('.git') || file.path.includes('.env') || file.path.includes('config') 
          ? 'critical' 
          : file.path.includes('backup') || file.path.includes('.sql')
          ? 'high'
          : file.path.includes('admin')
          ? 'medium'
          : 'info';
        
        const isSensitive = ['critical', 'high'].includes(severity);
        
        if (isSensitive) {
          vulnerabilities.push({
            id: `exposed-${file.path.replace(/[^a-z0-9]/gi, '-')}`,
            title: `Exposed Sensitive File: ${file.name}`,
            severity: severity as any,
            cvss: { 
              score: severity === 'critical' ? 9.1 : severity === 'high' ? 7.5 : 4.0, 
              vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N' 
            },
            category: 'Information Disclosure',
            description: `Sensitive file "${file.path}" is publicly accessible.`,
            evidence: { url: `${url}${file.path}` },
            remediation: `Remove or restrict access to ${file.path}. Configure web server to deny access to sensitive files.`,
            references: ['https://owasp.org/www-project-web-security-testing-guide/'],
            cwe: 'CWE-538',
            owasp: 'A01:2021'
          });
        }
      }
    } catch (error) {
      // File not accessible - that's good
    }
  }
  
  return vulnerabilities;
}

async function checkCookies(url: string): Promise<Vulnerability[]> {
  const vulnerabilities: Vulnerability[] = [];
  
  try {
    const response = await fetch(url);
    const cookies = response.headers.get('set-cookie');
    
    if (cookies) {
      const cookieList = cookies.split(',');
      
      for (const cookie of cookieList) {
        const cookieName = cookie.split('=')[0]?.trim();
        
        if (!cookie.toLowerCase().includes('httponly')) {
          vulnerabilities.push({
            id: `cookie-no-httponly-${cookieName}`,
            title: `Cookie Missing HttpOnly Flag: ${cookieName}`,
            severity: 'medium',
            cvss: { score: 4.3, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:N/A:N' },
            category: 'Cookie Security',
            description: `Cookie "${cookieName}" is missing the HttpOnly flag, making it accessible via JavaScript.`,
            evidence: { url, response: cookie },
            remediation: 'Add HttpOnly flag to sensitive cookies.',
            references: ['https://owasp.org/www-community/HttpOnly'],
            cwe: 'CWE-1004'
          });
        }
        
        if (url.startsWith('https://') && !cookie.toLowerCase().includes('secure')) {
          vulnerabilities.push({
            id: `cookie-no-secure-${cookieName}`,
            title: `Cookie Missing Secure Flag: ${cookieName}`,
            severity: 'medium',
            cvss: { score: 4.3, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:L/I:N/A:N' },
            category: 'Cookie Security',
            description: `Cookie "${cookieName}" is missing the Secure flag on HTTPS site.`,
            evidence: { url, response: cookie },
            remediation: 'Add Secure flag to cookies on HTTPS sites.',
            references: ['https://owasp.org/www-community/controls/SecureCookieAttribute'],
            cwe: 'CWE-614'
          });
        }
        
        if (!cookie.toLowerCase().includes('samesite')) {
          vulnerabilities.push({
            id: `cookie-no-samesite-${cookieName}`,
            title: `Cookie Missing SameSite Attribute: ${cookieName}`,
            severity: 'low',
            cvss: { score: 3.1, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N' },
            category: 'Cookie Security',
            description: `Cookie "${cookieName}" is missing SameSite attribute.`,
            evidence: { url, response: cookie },
            remediation: 'Add SameSite=Strict or SameSite=Lax to cookies.',
            references: ['https://owasp.org/www-community/SameSite'],
            cwe: 'CWE-1275'
          });
        }
      }
    }
  } catch (error) {
    console.error('Cookie check error:', error);
  }
  
  return vulnerabilities;
}

function generateRecommendations(vulnerabilities: Vulnerability[]): string[] {
  const recommendations: string[] = [];
  const categories = new Set(vulnerabilities.map(v => v.category));
  
  if (categories.has('Security Headers')) {
    recommendations.push('Implement all recommended security headers (CSP, HSTS, X-Frame-Options, etc.)');
  }
  if (categories.has('Transport Security')) {
    recommendations.push('Ensure HTTPS is properly configured with a valid SSL certificate');
  }
  if (categories.has('Information Disclosure')) {
    recommendations.push('Remove or restrict access to sensitive files and disable server version disclosure');
  }
  if (categories.has('Cookie Security')) {
    recommendations.push('Secure all cookies with HttpOnly, Secure, and SameSite attributes');
  }
  
  if (vulnerabilities.some(v => v.severity === 'critical')) {
    recommendations.unshift('🚨 CRITICAL: Address critical vulnerabilities immediately!');
  }
  
  return recommendations;
}

export interface ScanTarget {
  url: string;
  scope: string[];
  excludePaths?: string[];
  authorization: {
    type: 'owner' | 'contract' | 'bugbounty' | 'internal';
    documentId?: string;
    approvedBy?: string;
    validUntil?: Date;
  };
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss: {
    score: number;
    vector: string;
  };
  category: string;
  description: string;
  evidence: {
    url: string;
    parameter?: string;
    payload?: string;
    response?: string;
    screenshot?: string;
  };
  remediation: string;
  references: string[];
  cwe?: string;
  owasp?: string;
  mitreAttack?: string;
}

export interface ScanResult {
  id: string;
  target: ScanTarget;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  vulnerabilities: Vulnerability[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  recommendations: string[];
  techInfo?: any;
  error?: string;
}

// ============================================
// SCAN MODULES
// ============================================

export const scanModules = {
  // Reconnaissance
  recon: {
    subdomainEnum: {
      name: 'Subdomain Enumeration',
      description: 'Discover subdomains using passive and active techniques',
    },
    techDetection: {
      name: 'Technology Detection',
      description: 'Identify web technologies, frameworks, and versions',
    },
    portScan: {
      name: 'Port Scanning',
      description: 'Discover open ports and services',
    },
    dnsEnum: {
      name: 'DNS Enumeration',
      description: 'Enumerate DNS records and zone information',
    },
  },

  // Web Application
  webApp: {
    sqlInjection: {
      name: 'SQL Injection',
      description: 'Test for SQL injection vulnerabilities',
      payloads: ["'", "\"", "1' OR '1'='1", "1; DROP TABLE users--"],
    },
    xss: {
      name: 'Cross-Site Scripting (XSS)',
      description: 'Test for reflected, stored, and DOM-based XSS',
      payloads: ['<script>alert(1)</script>', '"><img src=x onerror=alert(1)>'],
    },
    csrf: {
      name: 'CSRF Testing',
      description: 'Check for Cross-Site Request Forgery protection',
    },
    ssrf: {
      name: 'SSRF Testing',
      description: 'Test for Server-Side Request Forgery',
    },
    idor: {
      name: 'IDOR Testing',
      description: 'Check for Insecure Direct Object References',
    },
    authBypass: {
      name: 'Authentication Bypass',
      description: 'Test authentication mechanisms for bypasses',
    },
    fileUpload: {
      name: 'File Upload Testing',
      description: 'Test file upload functionality for vulnerabilities',
    },
    lfiRfi: {
      name: 'LFI/RFI Testing',
      description: 'Test for Local/Remote File Inclusion',
    },
  },

  // Configuration
  config: {
    securityHeaders: {
      name: 'Security Headers',
      description: 'Check for missing or misconfigured security headers',
      headers: [
        'Content-Security-Policy',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Strict-Transport-Security',
        'Referrer-Policy',
        'Permissions-Policy',
      ],
    },
    sslTls: {
      name: 'SSL/TLS Analysis',
      description: 'Analyze SSL/TLS configuration and certificates',
    },
    cors: {
      name: 'CORS Configuration',
      description: 'Check for CORS misconfigurations',
    },
    cookies: {
      name: 'Cookie Security',
      description: 'Analyze cookie security attributes',
      flags: ['HttpOnly', 'Secure', 'SameSite'],
    },
    serverInfo: {
      name: 'Server Information Disclosure',
      description: 'Check for sensitive server information leakage',
    },
  },

  // API Security
  api: {
    authentication: {
      name: 'API Authentication',
      description: 'Test API authentication mechanisms',
    },
    authorization: {
      name: 'API Authorization',
      description: 'Test for broken access controls',
    },
    rateLimiting: {
      name: 'Rate Limiting',
      description: 'Check for rate limiting implementation',
    },
    inputValidation: {
      name: 'Input Validation',
      description: 'Test API input validation',
    },
    massAssignment: {
      name: 'Mass Assignment',
      description: 'Test for mass assignment vulnerabilities',
    },
  },
};

// ============================================
// CVSS 3.1 CALCULATOR
// ============================================

export interface CVSSInput {
  // Attack Vector
  attackVector: 'N' | 'A' | 'L' | 'P'; // Network, Adjacent, Local, Physical
  // Attack Complexity
  attackComplexity: 'L' | 'H'; // Low, High
  // Privileges Required
  privilegesRequired: 'N' | 'L' | 'H'; // None, Low, High
  // User Interaction
  userInteraction: 'N' | 'R'; // None, Required
  // Scope
  scope: 'U' | 'C'; // Unchanged, Changed
  // Confidentiality Impact
  confidentialityImpact: 'N' | 'L' | 'H'; // None, Low, High
  // Integrity Impact
  integrityImpact: 'N' | 'L' | 'H';
  // Availability Impact
  availabilityImpact: 'N' | 'L' | 'H';
}

export function calculateCVSS(input: CVSSInput): { score: number; severity: string; vector: string } {
  const AV = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
  const AC = { L: 0.77, H: 0.44 };
  const PR_U = { N: 0.85, L: 0.62, H: 0.27 }; // Scope Unchanged
  const PR_C = { N: 0.85, L: 0.68, H: 0.5 };  // Scope Changed
  const UI = { N: 0.85, R: 0.62 };
  const CIA = { N: 0, L: 0.22, H: 0.56 };

  const PR = input.scope === 'U' ? PR_U : PR_C;

  // Exploitability
  const exploitability = 8.22 * AV[input.attackVector] * AC[input.attackComplexity] * 
                         PR[input.privilegesRequired] * UI[input.userInteraction];

  // Impact
  const iscBase = 1 - (
    (1 - CIA[input.confidentialityImpact]) *
    (1 - CIA[input.integrityImpact]) *
    (1 - CIA[input.availabilityImpact])
  );

  let impact: number;
  if (input.scope === 'U') {
    impact = 6.42 * iscBase;
  } else {
    impact = 7.52 * (iscBase - 0.029) - 3.25 * Math.pow(iscBase - 0.02, 15);
  }

  // Base Score
  let score: number;
  if (impact <= 0) {
    score = 0;
  } else if (input.scope === 'U') {
    score = Math.min(impact + exploitability, 10);
  } else {
    score = Math.min(1.08 * (impact + exploitability), 10);
  }

  score = Math.round(score * 10) / 10;

  // Severity
  let severity: string;
  if (score === 0) severity = 'None';
  else if (score <= 3.9) severity = 'Low';
  else if (score <= 6.9) severity = 'Medium';
  else if (score <= 8.9) severity = 'High';
  else severity = 'Critical';

  // Vector String
  const vector = `CVSS:3.1/AV:${input.attackVector}/AC:${input.attackComplexity}/PR:${input.privilegesRequired}/UI:${input.userInteraction}/S:${input.scope}/C:${input.confidentialityImpact}/I:${input.integrityImpact}/A:${input.availabilityImpact}`;

  return { score, severity, vector };
}

// ============================================
// SEVERITY COLORS
// ============================================

export const severityColors = {
  critical: { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500' },
  high: { bg: 'bg-orange-500', text: 'text-orange-500', border: 'border-orange-500' },
  medium: { bg: 'bg-yellow-500', text: 'text-yellow-500', border: 'border-yellow-500' },
  low: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
  info: { bg: 'bg-gray-500', text: 'text-gray-500', border: 'border-gray-500' },
};
