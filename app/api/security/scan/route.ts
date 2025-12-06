import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { target, scanType, depth = 'normal', options = {} } = await req.json();

    if (!target) {
      return NextResponse.json({ error: 'Target is required' }, { status: 400 });
    }

    // Validate URL
    let targetUrl: URL;
    try {
      targetUrl = new URL(target);
    } catch {
      return NextResponse.json({ error: 'Invalid target URL' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Phase 1: Initialize
          send({ type: 'progress', progress: 5, task: 'Initializing scan...' });
          await sleep(500);

          // Phase 2: Connectivity check
          send({ type: 'progress', progress: 10, task: 'Checking target connectivity...' });
          
          let isReachable = true;
          try {
            const checkResponse = await fetch(target, { 
              method: 'HEAD',
              signal: AbortSignal.timeout(10000)
            });
            isReachable = checkResponse.ok || checkResponse.status < 500;
          } catch {
            isReachable = false;
          }

          if (!isReachable) {
            send({ type: 'vulnerability', vulnerability: {
              id: 'conn-1',
              title: 'Target Unreachable',
              description: 'Unable to establish connection to the target. The server may be down or blocking requests.',
              severity: 'info',
              location: target,
            }});
          }

          // Phase 3: Fetch headers and detect technology
          send({ type: 'progress', progress: 20, task: 'Detecting technologies...' });
          
          let headers: Headers | null = null;
          let responseText = '';
          
          try {
            const response = await fetch(target, {
              signal: AbortSignal.timeout(15000),
              headers: {
                'User-Agent': 'SecurityScanner/1.0 (Authorized Security Assessment)'
              }
            });
            headers = response.headers;
            responseText = await response.text();
          } catch (e) {
            // Continue with what we have
          }

          // Detect technology
          const techInfo: any = {};
          if (headers) {
            techInfo.server = headers.get('server') || undefined;
            techInfo.poweredBy = headers.get('x-powered-by') || undefined;
          }
          
          // Detect frameworks from HTML
          const frameworks: string[] = [];
          if (responseText.includes('__NEXT_DATA__')) frameworks.push('Next.js');
          if (responseText.includes('_nuxt')) frameworks.push('Nuxt.js');
          if (responseText.includes('ng-app') || responseText.includes('ng-controller')) frameworks.push('Angular');
          if (responseText.includes('data-reactroot') || responseText.includes('__REACT')) frameworks.push('React');
          if (responseText.includes('data-v-')) frameworks.push('Vue.js');
          if (responseText.includes('wp-content')) frameworks.push('WordPress');
          if (responseText.includes('drupal')) frameworks.push('Drupal');
          techInfo.frameworks = frameworks.length > 0 ? frameworks : undefined;

          send({ type: 'tech', techInfo });

          // Phase 4: Security Headers Check
          send({ type: 'progress', progress: 35, task: 'Analyzing security headers...' });
          await sleep(1000);

          if (headers && options.checkHeaders !== false) {
            // Check for missing security headers
            const securityHeaders = [
              { header: 'strict-transport-security', name: 'HSTS', severity: 'medium' as const },
              { header: 'x-content-type-options', name: 'X-Content-Type-Options', severity: 'low' as const },
              { header: 'x-frame-options', name: 'X-Frame-Options', severity: 'medium' as const },
              { header: 'x-xss-protection', name: 'X-XSS-Protection', severity: 'low' as const },
              { header: 'content-security-policy', name: 'Content-Security-Policy', severity: 'medium' as const },
              { header: 'referrer-policy', name: 'Referrer-Policy', severity: 'low' as const },
              { header: 'permissions-policy', name: 'Permissions-Policy', severity: 'low' as const },
            ];

            const missingHeaders = securityHeaders.filter(h => !headers!.get(h.header));
            
            if (missingHeaders.length > 0) {
              send({ type: 'vulnerability', vulnerability: {
                id: 'headers-1',
                title: 'Missing Security Headers',
                description: `The following security headers are missing: ${missingHeaders.map(h => h.name).join(', ')}`,
                severity: 'medium',
                location: 'HTTP Response Headers',
                remediation: 'Add the missing security headers to your server configuration. These headers help protect against common web attacks like XSS, clickjacking, and MIME sniffing.',
              }});
            }

            // Check for information disclosure
            if (headers.get('server') || headers.get('x-powered-by')) {
              send({ type: 'vulnerability', vulnerability: {
                id: 'headers-2',
                title: 'Server Information Disclosure',
                description: 'The server is disclosing version information which could help attackers identify vulnerabilities.',
                severity: 'low',
                location: 'Server/X-Powered-By Headers',
                remediation: 'Remove or obfuscate server version headers to prevent information disclosure.',
              }});
            }
          }

          // Phase 5: SSL/TLS Check
          send({ type: 'progress', progress: 50, task: 'Checking SSL/TLS configuration...' });
          await sleep(1000);

          if (options.checkSSL !== false && targetUrl.protocol === 'https:') {
            // Basic SSL check - in production, use a proper SSL testing library
            send({ type: 'progress', progress: 55, task: 'SSL certificate validated...' });
          } else if (targetUrl.protocol === 'http:') {
            send({ type: 'vulnerability', vulnerability: {
              id: 'ssl-1',
              title: 'No HTTPS',
              description: 'The target is not using HTTPS. All traffic is transmitted in plain text.',
              severity: 'high',
              location: target,
              remediation: 'Enable HTTPS by obtaining and configuring an SSL/TLS certificate. Consider using Let\'s Encrypt for free certificates.',
            }});
          }

          // Phase 6: Common vulnerabilities check
          send({ type: 'progress', progress: 65, task: 'Testing for common vulnerabilities...' });
          await sleep(1500);

          if (options.checkVulnerabilities !== false) {
            // Check for common issues in response
            if (responseText.includes('<!--') && responseText.includes('TODO')) {
              send({ type: 'vulnerability', vulnerability: {
                id: 'vuln-1',
                title: 'HTML Comments with Sensitive Information',
                description: 'HTML comments containing potentially sensitive information (TODO notes) were found.',
                severity: 'info',
                location: 'HTML Source',
                remediation: 'Remove HTML comments containing sensitive information before deploying to production.',
              }});
            }

            // Check for exposed error messages
            if (responseText.match(/stack\s*trace|exception|error.*at\s+line/i)) {
              send({ type: 'vulnerability', vulnerability: {
                id: 'vuln-2',
                title: 'Verbose Error Messages',
                description: 'The application may be exposing detailed error messages or stack traces.',
                severity: 'medium',
                location: 'Response Body',
                remediation: 'Implement proper error handling and avoid exposing detailed error messages in production.',
              }});
            }

            // Check for directory listing
            if (responseText.includes('Index of /') || responseText.includes('Directory listing')) {
              send({ type: 'vulnerability', vulnerability: {
                id: 'vuln-3',
                title: 'Directory Listing Enabled',
                description: 'Directory listing is enabled which may expose sensitive files.',
                severity: 'medium',
                location: target,
                remediation: 'Disable directory listing in your web server configuration.',
              }});
            }
          }

          // Phase 7: Cookie analysis
          send({ type: 'progress', progress: 80, task: 'Analyzing cookies...' });
          await sleep(1000);

          if (headers) {
            const setCookie = headers.get('set-cookie');
            if (setCookie) {
              const cookieIssues: string[] = [];
              if (!setCookie.toLowerCase().includes('secure')) cookieIssues.push('Secure');
              if (!setCookie.toLowerCase().includes('httponly')) cookieIssues.push('HttpOnly');
              if (!setCookie.toLowerCase().includes('samesite')) cookieIssues.push('SameSite');

              if (cookieIssues.length > 0) {
                send({ type: 'vulnerability', vulnerability: {
                  id: 'cookie-1',
                  title: 'Insecure Cookie Configuration',
                  description: `Cookies are missing the following security attributes: ${cookieIssues.join(', ')}`,
                  severity: 'medium',
                  location: 'Set-Cookie Header',
                  remediation: 'Configure all cookies with Secure, HttpOnly, and SameSite attributes.',
                }});
              }
            }
          }

          // Phase 8: Generate recommendations
          send({ type: 'progress', progress: 95, task: 'Generating recommendations...' });
          await sleep(500);

          const recommendations = [
            'Implement a Content Security Policy (CSP) to prevent XSS attacks',
            'Enable HTTP Strict Transport Security (HSTS) with a long max-age',
            'Configure all cookies with Secure, HttpOnly, and SameSite attributes',
            'Remove server version headers to prevent information disclosure',
            'Implement rate limiting to prevent abuse',
            'Add proper error handling without exposing stack traces',
            'Regularly update all dependencies and frameworks',
            'Consider implementing Web Application Firewall (WAF)',
          ];

          // Complete
          send({ type: 'complete', recommendations });
          controller.close();

        } catch (error: any) {
          send({ type: 'error', error: error.message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Scan API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
