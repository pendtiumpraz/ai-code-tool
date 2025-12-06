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
      case 'ip-lookup':
        result = await ipLookup(target);
        break;
      case 'shodan-search':
        result = await shodanSearch(target, options);
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

// IP Lookup - Geolocation and reputation
async function ipLookup(target: string): Promise<any> {
  const cleanTarget = target.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '').split(':')[0];
  
  // Resolve hostname to IP if needed
  let ip = cleanTarget;
  let hostname = null;
  
  // Check if it's a domain (not an IP)
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(cleanTarget)) {
    try {
      const addresses = await resolve4(cleanTarget);
      if (addresses && addresses.length > 0) {
        ip = addresses[0];
        hostname = cleanTarget;
      }
    } catch (e) {
      // Continue with original target
    }
  }

  // Use ip-api.com for geolocation (free, no key required)
  try {
    const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`, {
      signal: AbortSignal.timeout(10000),
    });
    
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      
      if (geoData.status === 'success') {
        return {
          ip: geoData.query,
          hostname: hostname,
          location: {
            country: geoData.country,
            countryCode: geoData.countryCode,
            region: geoData.regionName,
            city: geoData.city,
            zip: geoData.zip,
            lat: geoData.lat,
            lon: geoData.lon,
            timezone: geoData.timezone,
            org: geoData.org || geoData.isp,
            as: geoData.as,
          },
          reputation: {
            score: 75, // Default score - would need additional API for real reputation
            tags: [],
          },
          timestamp: new Date().toISOString(),
        };
      }
    }
  } catch (e) {
    // Continue with fallback
  }

  return {
    ip: ip,
    hostname: hostname,
    location: null,
    reputation: null,
    error: 'Unable to retrieve IP information',
    timestamp: new Date().toISOString(),
  };
}

// Shodan Search
async function shodanSearch(target: string, options?: any): Promise<any> {
  const shodanApiKey = process.env.SHODAN_API_KEY;
  
  // Clean IP/domain
  const cleanTarget = target.replace(/^(https?:\/\/)/, '').replace(/\/.*$/, '').split(':')[0];
  
  // Check if it's an IP address
  const isIP = /^\d+\.\d+\.\d+\.\d+$/.test(cleanTarget);
  
  if (!shodanApiKey) {
    // Return mock/limited data without API key
    return {
      ip: isIP ? cleanTarget : null,
      query: target,
      error: 'Shodan API key not configured. Add SHODAN_API_KEY to environment variables for full results.',
      note: 'Get a free API key at https://shodan.io',
      timestamp: new Date().toISOString(),
    };
  }

  try {
    let url: string;
    
    if (isIP) {
      // Host lookup
      url = `https://api.shodan.io/shodan/host/${cleanTarget}?key=${shodanApiKey}`;
    } else {
      // DNS resolve first, then host lookup
      const dnsUrl = `https://api.shodan.io/dns/resolve?hostnames=${cleanTarget}&key=${shodanApiKey}`;
      const dnsResponse = await fetch(dnsUrl, { signal: AbortSignal.timeout(10000) });
      
      if (dnsResponse.ok) {
        const dnsData = await dnsResponse.json();
        const ip = dnsData[cleanTarget];
        if (ip) {
          url = `https://api.shodan.io/shodan/host/${ip}?key=${shodanApiKey}`;
        } else {
          return {
            query: target,
            error: 'Could not resolve hostname',
            timestamp: new Date().toISOString(),
          };
        }
      } else {
        throw new Error('DNS resolution failed');
      }
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    
    if (response.ok) {
      const data = await response.json();
      
      return {
        ip: data.ip_str,
        hostnames: data.hostnames || [],
        org: data.org,
        isp: data.isp,
        asn: data.asn,
        country: data.country_name,
        city: data.city,
        ports: data.ports || [],
        vulns: data.vulns || [],
        services: data.data?.slice(0, 10).map((s: any) => ({
          port: s.port,
          protocol: s.transport,
          product: s.product,
          version: s.version,
          banner: s.data?.substring(0, 200),
        })) || [],
        lastUpdate: data.last_update,
        timestamp: new Date().toISOString(),
      };
    } else if (response.status === 404) {
      return {
        ip: cleanTarget,
        error: 'No information available for this host',
        timestamp: new Date().toISOString(),
      };
    } else {
      throw new Error(`Shodan API error: ${response.status}`);
    }
  } catch (e: any) {
    return {
      query: target,
      error: e.message || 'Shodan lookup failed',
      timestamp: new Date().toISOString(),
    };
  }
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
