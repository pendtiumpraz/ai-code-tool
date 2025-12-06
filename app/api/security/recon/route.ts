import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dns from 'dns';
import { promisify } from 'util';

export const dynamic = 'force-dynamic';

const resolveDns = promisify(dns.resolve);
const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveMx = promisify(dns.resolveMx);
const resolveNs = promisify(dns.resolveNs);
const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

// POST /api/security/recon
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tool, target, options } = body;

    if (!tool || !target) {
      return NextResponse.json({ error: 'Tool and target are required' }, { status: 400 });
    }

    let result: any;

    switch (tool) {
      case 'subdomain-finder':
        result = await findSubdomains(target, options);
        break;
      case 'whois-lookup':
        result = await whoisLookup(target);
        break;
      case 'dns-lookup':
        result = await dnsLookup(target, options?.recordType || 'ALL');
        break;
      case 'port-scanner':
        result = await portScan(target, options);
        break;
      default:
        return NextResponse.json({ error: 'Unknown tool' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });

  } catch (error: any) {
    console.error('Recon API error:', error);
    return NextResponse.json({ error: error.message || 'Reconnaissance failed' }, { status: 500 });
  }
}

// Subdomain Finder
async function findSubdomains(domain: string, options?: any): Promise<any> {
  const cleanDomain = domain.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '');
  
  const commonSubdomains = [
    'www', 'mail', 'ftp', 'localhost', 'webmail', 'smtp', 'pop', 'ns1', 'ns2',
    'admin', 'api', 'dev', 'staging', 'test', 'beta', 'app', 'mobile', 'm',
    'portal', 'vpn', 'remote', 'git', 'gitlab', 'github', 'jenkins', 'ci',
    'cdn', 'static', 'assets', 'img', 'images', 'media', 'files', 'download',
    'blog', 'shop', 'store', 'support', 'help', 'docs', 'wiki', 'forum',
    'secure', 'auth', 'login', 'sso', 'oauth', 'dashboard', 'panel',
    'db', 'database', 'mysql', 'postgres', 'redis', 'mongo', 'elastic',
    'cloud', 'aws', 'azure', 'gcp', 's3', 'backup', 'status', 'monitor'
  ];

  const foundSubdomains: any[] = [];
  const errors: string[] = [];

  for (const sub of commonSubdomains) {
    const subdomain = `${sub}.${cleanDomain}`;
    try {
      const addresses = await resolve4(subdomain);
      if (addresses && addresses.length > 0) {
        foundSubdomains.push({
          subdomain,
          ip: addresses[0],
          ipv4: addresses,
          status: 'found',
        });
      }
    } catch (e) {
      // Subdomain not found, skip
    }
  }

  // Also try common patterns
  const patterns = ['www-', 'api-', 'app-', 'dev-', 'staging-', 'prod-'];
  for (const pattern of patterns) {
    for (const suffix of ['1', '2', '01', '02']) {
      const subdomain = `${pattern}${suffix}.${cleanDomain}`;
      try {
        const addresses = await resolve4(subdomain);
        if (addresses && addresses.length > 0) {
          foundSubdomains.push({
            subdomain,
            ip: addresses[0],
            ipv4: addresses,
            status: 'found',
          });
        }
      } catch (e) {
        // Skip
      }
    }
  }

  return {
    domain: cleanDomain,
    subdomainsFound: foundSubdomains.length,
    subdomains: foundSubdomains,
    checkedPatterns: commonSubdomains.length + patterns.length * 4,
    timestamp: new Date().toISOString(),
  };
}

// WHOIS Lookup
async function whoisLookup(domain: string): Promise<any> {
  const cleanDomain = domain.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '');
  
  // Since we can't use native WHOIS easily in Node, we'll use a public API
  try {
    const response = await fetch(`https://whois.freeaiapi.xyz/?domain=${encodeURIComponent(cleanDomain)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        domain: cleanDomain,
        ...data,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (e) {
    // Fallback to basic info
  }

  // Fallback: just return DNS info
  const dnsInfo = await dnsLookup(cleanDomain, 'ALL');
  return {
    domain: cleanDomain,
    registrar: 'Unable to retrieve WHOIS data',
    note: 'WHOIS lookup via external API failed. Showing DNS information instead.',
    dns: dnsInfo,
    timestamp: new Date().toISOString(),
  };
}

// DNS Lookup
async function dnsLookup(domain: string, recordType: string = 'ALL'): Promise<any> {
  const cleanDomain = domain.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '');
  const records: any = {};

  const lookupRecord = async (type: string, resolver: Function) => {
    try {
      const result = await resolver(cleanDomain);
      return result;
    } catch (e) {
      return null;
    }
  };

  if (recordType === 'ALL' || recordType === 'A') {
    records.A = await lookupRecord('A', resolve4);
  }
  if (recordType === 'ALL' || recordType === 'AAAA') {
    records.AAAA = await lookupRecord('AAAA', resolve6);
  }
  if (recordType === 'ALL' || recordType === 'MX') {
    records.MX = await lookupRecord('MX', resolveMx);
  }
  if (recordType === 'ALL' || recordType === 'NS') {
    records.NS = await lookupRecord('NS', resolveNs);
  }
  if (recordType === 'ALL' || recordType === 'TXT') {
    records.TXT = await lookupRecord('TXT', resolveTxt);
  }
  if (recordType === 'ALL' || recordType === 'CNAME') {
    records.CNAME = await lookupRecord('CNAME', resolveCname);
  }

  return {
    domain: cleanDomain,
    records,
    recordType,
    timestamp: new Date().toISOString(),
  };
}

// Port Scanner (limited ports for safety)
async function portScan(target: string, options?: any): Promise<any> {
  const cleanTarget = target.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '').split(':')[0];
  
  // Common ports to scan
  const commonPorts = options?.ports || [21, 22, 23, 25, 53, 80, 110, 143, 443, 465, 587, 993, 995, 3306, 3389, 5432, 8080, 8443];
  const openPorts: any[] = [];
  const closedPorts: number[] = [];
  const timeout = options?.timeout || 2000;

  // Port service mapping
  const serviceMap: Record<number, string> = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    465: 'SMTPS',
    587: 'Submission',
    993: 'IMAPS',
    995: 'POP3S',
    3306: 'MySQL',
    3389: 'RDP',
    5432: 'PostgreSQL',
    8080: 'HTTP-Alt',
    8443: 'HTTPS-Alt',
  };

  // Simple TCP port check using fetch with timeout
  for (const port of commonPorts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // Try HTTP/HTTPS
      const protocol = [443, 8443].includes(port) ? 'https' : 'http';
      try {
        await fetch(`${protocol}://${cleanTarget}:${port}`, {
          method: 'HEAD',
          signal: controller.signal,
        });
        openPorts.push({
          port,
          service: serviceMap[port] || 'Unknown',
          status: 'open',
        });
      } catch (e: any) {
        if (e.name !== 'AbortError' && e.code !== 'ECONNREFUSED') {
          // Connection was attempted, port might be open
          openPorts.push({
            port,
            service: serviceMap[port] || 'Unknown',
            status: 'open (filtered)',
          });
        } else {
          closedPorts.push(port);
        }
      }
      
      clearTimeout(timeoutId);
    } catch (e) {
      closedPorts.push(port);
    }
  }

  return {
    target: cleanTarget,
    portsScanned: commonPorts.length,
    openPorts,
    closedPorts,
    timestamp: new Date().toISOString(),
    note: 'This is a basic port scan. For comprehensive scanning, use specialized tools.',
  };
}

// GET endpoint for info
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Security Reconnaissance API',
    availableTools: [
      { tool: 'subdomain-finder', description: 'Find subdomains of a domain' },
      { tool: 'whois-lookup', description: 'Get WHOIS information for a domain' },
      { tool: 'dns-lookup', description: 'Get DNS records for a domain' },
      { tool: 'port-scanner', description: 'Scan common ports on a target' },
    ],
    usage: {
      method: 'POST',
      body: { tool: 'string', target: 'string', options: 'object (optional)' },
    },
  });
}
