// ============================================
// SECURITY SCANNER - Live Website Testing
// ============================================

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
