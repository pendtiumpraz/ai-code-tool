import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// POST /api/security/tools
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tool, input, options } = body;

    if (!tool) {
      return NextResponse.json({ error: 'Tool is required' }, { status: 400 });
    }

    let result: any;

    switch (tool) {
      case 'hash-generator':
        result = generateHash(input, options?.algorithm || 'all');
        break;
      case 'encoder-decoder':
        result = encodeDecode(input, options?.operation || 'base64-encode', options?.encoding);
        break;
      case 'cvss-calculator':
        result = calculateCVSS(input);
        break;
      case 'password-generator':
        result = generatePassword(options);
        break;
      case 'jwt-decoder':
        result = decodeJWT(input);
        break;
      default:
        return NextResponse.json({ error: 'Unknown tool' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    console.error('Security tools API error:', error);
    return NextResponse.json({ error: error.message || 'Tool execution failed' }, { status: 500 });
  }
}

// Hash Generator
function generateHash(input: string, algorithm: string): any {
  if (!input) {
    return { error: 'Input is required' };
  }

  const algorithms = algorithm === 'all' 
    ? ['md5', 'sha1', 'sha256', 'sha384', 'sha512'] 
    : [algorithm];

  const hashes: Record<string, string> = {};
  
  for (const algo of algorithms) {
    try {
      hashes[algo] = crypto.createHash(algo).update(input).digest('hex');
    } catch (e) {
      hashes[algo] = 'Unsupported algorithm';
    }
  }

  return {
    input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
    inputLength: input.length,
    hashes,
    timestamp: new Date().toISOString(),
  };
}

// Encoder/Decoder
function encodeDecode(input: string, operation: string, encoding?: string): any {
  if (!input) {
    return { error: 'Input is required' };
  }

  let output: string;

  try {
    switch (operation) {
      case 'base64-encode':
        output = Buffer.from(input).toString('base64');
        break;
      case 'base64-decode':
        output = Buffer.from(input, 'base64').toString('utf8');
        break;
      case 'url-encode':
        output = encodeURIComponent(input);
        break;
      case 'url-decode':
        output = decodeURIComponent(input);
        break;
      case 'html-encode':
        output = input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
        break;
      case 'html-decode':
        output = input
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'");
        break;
      case 'hex-encode':
        output = Buffer.from(input).toString('hex');
        break;
      case 'hex-decode':
        output = Buffer.from(input, 'hex').toString('utf8');
        break;
      case 'unicode-escape':
        output = input.split('').map(c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join('');
        break;
      case 'unicode-unescape':
        output = input.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
        break;
      case 'rot13':
        output = input.replace(/[a-zA-Z]/g, c => 
          String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13))
        );
        break;
      default:
        return { error: 'Unknown operation' };
    }
  } catch (e: any) {
    return { error: `Failed to ${operation}: ${e.message}` };
  }

  return {
    input: input.substring(0, 100) + (input.length > 100 ? '...' : ''),
    operation,
    output,
    timestamp: new Date().toISOString(),
  };
}

// CVSS Calculator
function calculateCVSS(vectorOrMetrics: any): any {
  // If string, parse CVSS vector
  if (typeof vectorOrMetrics === 'string') {
    return parseCVSSVector(vectorOrMetrics);
  }

  // If object with metrics
  const metrics = vectorOrMetrics;
  
  // CVSS 3.1 Base Score calculation
  const { AV, AC, PR, UI, S, C, I, A } = metrics;
  
  // Attack Vector
  const avScore: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
  // Attack Complexity  
  const acScore: Record<string, number> = { L: 0.77, H: 0.44 };
  // Privileges Required (depends on Scope)
  const prScoreUnchanged: Record<string, number> = { N: 0.85, L: 0.62, H: 0.27 };
  const prScoreChanged: Record<string, number> = { N: 0.85, L: 0.68, H: 0.5 };
  // User Interaction
  const uiScore: Record<string, number> = { N: 0.85, R: 0.62 };
  // Impact (C, I, A)
  const impactScore: Record<string, number> = { H: 0.56, L: 0.22, N: 0 };

  const scopeChanged = S === 'C';
  const prScore = scopeChanged ? prScoreChanged : prScoreUnchanged;

  // Calculate Exploitability
  const exploitability = 8.22 * (avScore[AV] || 0) * (acScore[AC] || 0) * (prScore[PR] || 0) * (uiScore[UI] || 0);

  // Calculate Impact Sub Score
  const iscBase = 1 - ((1 - (impactScore[C] || 0)) * (1 - (impactScore[I] || 0)) * (1 - (impactScore[A] || 0)));
  
  let impact: number;
  if (scopeChanged) {
    impact = 7.52 * (iscBase - 0.029) - 3.25 * Math.pow(iscBase - 0.02, 15);
  } else {
    impact = 6.42 * iscBase;
  }

  // Calculate Base Score
  let baseScore: number;
  if (impact <= 0) {
    baseScore = 0;
  } else if (scopeChanged) {
    baseScore = Math.min(1.08 * (impact + exploitability), 10);
  } else {
    baseScore = Math.min(impact + exploitability, 10);
  }

  // Round up to 1 decimal place
  baseScore = Math.ceil(baseScore * 10) / 10;

  // Determine severity
  let severity: string;
  if (baseScore === 0) severity = 'None';
  else if (baseScore < 4.0) severity = 'Low';
  else if (baseScore < 7.0) severity = 'Medium';
  else if (baseScore < 9.0) severity = 'High';
  else severity = 'Critical';

  // Generate vector string
  const vectorString = `CVSS:3.1/AV:${AV}/AC:${AC}/PR:${PR}/UI:${UI}/S:${S}/C:${C}/I:${I}/A:${A}`;

  return {
    baseScore,
    severity,
    vector: vectorString,
    metrics: {
      attackVector: { value: AV, score: avScore[AV] },
      attackComplexity: { value: AC, score: acScore[AC] },
      privilegesRequired: { value: PR, score: prScore[PR] },
      userInteraction: { value: UI, score: uiScore[UI] },
      scope: { value: S, changed: scopeChanged },
      confidentiality: { value: C, score: impactScore[C] },
      integrity: { value: I, score: impactScore[I] },
      availability: { value: A, score: impactScore[A] },
    },
    exploitability: Math.round(exploitability * 100) / 100,
    impact: Math.round(impact * 100) / 100,
    timestamp: new Date().toISOString(),
  };
}

function parseCVSSVector(vector: string): any {
  // Parse CVSS:3.1/AV:N/AC:L/... format
  const match = vector.match(/CVSS:3\.[01]\/(.+)/i);
  if (!match) {
    return { error: 'Invalid CVSS vector format. Expected format: CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' };
  }

  const parts = match[1].split('/');
  const metrics: Record<string, string> = {};

  for (const part of parts) {
    const [key, value] = part.split(':');
    metrics[key] = value;
  }

  // Validate required metrics
  const required = ['AV', 'AC', 'PR', 'UI', 'S', 'C', 'I', 'A'];
  for (const key of required) {
    if (!metrics[key]) {
      return { error: `Missing required metric: ${key}` };
    }
  }

  return calculateCVSS(metrics);
}

// Password Generator
function generatePassword(options?: any): any {
  const length = options?.length || 16;
  const includeUppercase = options?.uppercase !== false;
  const includeLowercase = options?.lowercase !== false;
  const includeNumbers = options?.numbers !== false;
  const includeSymbols = options?.symbols !== false;
  const excludeAmbiguous = options?.excludeAmbiguous || false;

  let chars = '';
  if (includeLowercase) chars += excludeAmbiguous ? 'abcdefghjkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  if (includeUppercase) chars += excludeAmbiguous ? 'ABCDEFGHJKMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeNumbers) chars += excludeAmbiguous ? '23456789' : '0123456789';
  if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!chars) {
    return { error: 'No character sets selected' };
  }

  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }

  // Calculate entropy
  const entropy = Math.log2(Math.pow(chars.length, length));

  return {
    password,
    length,
    entropy: Math.round(entropy * 100) / 100,
    strength: entropy < 40 ? 'Weak' : entropy < 60 ? 'Moderate' : entropy < 80 ? 'Strong' : 'Very Strong',
    characterSets: {
      uppercase: includeUppercase,
      lowercase: includeLowercase,
      numbers: includeNumbers,
      symbols: includeSymbols,
    },
    timestamp: new Date().toISOString(),
  };
}

// JWT Decoder
function decodeJWT(token: string): any {
  if (!token) {
    return { error: 'JWT token is required' };
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { error: 'Invalid JWT format. Expected 3 parts separated by dots.' };
    }

    const [headerB64, payloadB64, signature] = parts;

    // Decode header
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

    // Check expiration
    let isExpired = false;
    let expiresAt = null;
    if (payload.exp) {
      const expDate = new Date(payload.exp * 1000);
      isExpired = expDate < new Date();
      expiresAt = expDate.toISOString();
    }

    let issuedAt = null;
    if (payload.iat) {
      issuedAt = new Date(payload.iat * 1000).toISOString();
    }

    return {
      header,
      payload,
      signature: signature.substring(0, 20) + '...',
      analysis: {
        algorithm: header.alg,
        type: header.typ,
        isExpired,
        expiresAt,
        issuedAt,
        issuer: payload.iss,
        subject: payload.sub,
        audience: payload.aud,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (e: any) {
    return { error: `Failed to decode JWT: ${e.message}` };
  }
}

// GET endpoint for info
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Security Tools API',
    availableTools: [
      { tool: 'hash-generator', description: 'Generate hashes (MD5, SHA1, SHA256, SHA512)', options: { algorithm: 'md5|sha1|sha256|sha512|all' } },
      { tool: 'encoder-decoder', description: 'Encode/decode data', options: { operation: 'base64-encode|base64-decode|url-encode|url-decode|html-encode|html-decode|hex-encode|hex-decode|unicode-escape|unicode-unescape|rot13' } },
      { tool: 'cvss-calculator', description: 'Calculate CVSS 3.1 score', input: 'CVSS vector string or metrics object' },
      { tool: 'password-generator', description: 'Generate secure passwords', options: { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true } },
      { tool: 'jwt-decoder', description: 'Decode and analyze JWT tokens' },
    ],
    usage: {
      method: 'POST',
      body: { tool: 'string', input: 'string', options: 'object (optional)' },
    },
  });
}
