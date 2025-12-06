# 🔧 Remediation Guide: Missing Security Headers

## Vulnerability Overview

| Property | Value |
|----------|-------|
| **Severity** | 🟡 MEDIUM / 🔵 LOW |
| **CVSS Score** | 4.0 - 6.5 |
| **CWE** | CWE-693 (Protection Mechanism Failure) |
| **OWASP** | A05:2021 - Security Misconfiguration |

## Required Security Headers

| Header | Purpose | Priority |
|--------|---------|----------|
| `Content-Security-Policy` | Mencegah XSS dan injection | HIGH |
| `Strict-Transport-Security` | Force HTTPS | HIGH |
| `X-Content-Type-Options` | Mencegah MIME sniffing | HIGH |
| `X-Frame-Options` | Mencegah Clickjacking | MEDIUM |
| `Referrer-Policy` | Kontrol referrer information | MEDIUM |
| `Permissions-Policy` | Kontrol browser features | MEDIUM |
| `X-XSS-Protection` | XSS filter (legacy) | LOW |

## Implementasi per Platform

### 1. Next.js

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self';
      connect-src 'self' https://api.example.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 2. Express.js dengan Helmet

```javascript
const express = require('express');
const helmet = require('helmet');

const app = express();

// Helmet default configuration
app.use(helmet());

// Custom configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://api.example.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
}));
```

### 3. Nginx

```nginx
# /etc/nginx/conf.d/security-headers.conf

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;

# HSTS - Force HTTPS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Prevent MIME type sniffing
add_header X-Content-Type-Options "nosniff" always;

# Clickjacking protection
add_header X-Frame-Options "DENY" always;

# XSS Protection (legacy browsers)
add_header X-XSS-Protection "1; mode=block" always;

# Referrer Policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Permissions Policy
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;

# Remove server info
server_tokens off;
```

```nginx
# Include in server block
server {
    listen 443 ssl http2;
    server_name example.com;
    
    include /etc/nginx/conf.d/security-headers.conf;
    
    # ... rest of config
}
```

### 4. Apache

```apache
# .htaccess atau httpd.conf

# Content Security Policy
Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';"

# HSTS
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

# Prevent MIME sniffing
Header always set X-Content-Type-Options "nosniff"

# Clickjacking protection
Header always set X-Frame-Options "DENY"

# XSS Protection
Header always set X-XSS-Protection "1; mode=block"

# Referrer Policy
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Permissions Policy
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"

# Remove server signature
ServerTokens Prod
ServerSignature Off
```

### 5. Vercel (vercel.json)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; font-src 'self'; connect-src 'self' https://*.vercel.app"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ]
}
```

### 6. Cloudflare (Workers)

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const response = await fetch(request);
  const newHeaders = new Headers(response.headers);
  
  // Security Headers
  newHeaders.set('Content-Security-Policy', "default-src 'self'");
  newHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  newHeaders.set('X-Content-Type-Options', 'nosniff');
  newHeaders.set('X-Frame-Options', 'DENY');
  newHeaders.set('X-XSS-Protection', '1; mode=block');
  newHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  newHeaders.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Remove unnecessary headers
  newHeaders.delete('Server');
  newHeaders.delete('X-Powered-By');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
```

## Content Security Policy (CSP) in Detail

### Basic CSP Template

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://trusted-cdn.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.example.com;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

### CSP dengan Nonce (untuk inline scripts)

```javascript
// Generate nonce di server
const crypto = require('crypto');
const nonce = crypto.randomBytes(16).toString('base64');

// Set header
res.setHeader('Content-Security-Policy', 
  `script-src 'self' 'nonce-${nonce}'`);

// Render di HTML
<script nonce="${nonce}">
  // Inline script yang aman
</script>
```

### Report-Only Mode (untuk testing)

```
Content-Security-Policy-Report-Only:
  default-src 'self';
  report-uri /csp-violation-report;
```

## Verification Checklist

- [ ] Content-Security-Policy header aktif dan tested
- [ ] Strict-Transport-Security (HSTS) dengan preload
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY atau SAMEORIGIN
- [ ] Referrer-Policy dikonfigurasi
- [ ] Permissions-Policy membatasi fitur tidak perlu
- [ ] Server version information dihilangkan
- [ ] CSP violations di-monitor

## Testing Tools

```bash
# SecurityHeaders.com
curl -I https://example.com | grep -i "security\|csp\|strict\|frame\|content"

# Mozilla Observatory
# https://observatory.mozilla.org/

# Check headers
curl -s -D - https://example.com -o /dev/null

# Test CSP
# https://csp-evaluator.withgoogle.com/
```

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Mozilla Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [SecurityHeaders.com](https://securityheaders.com/)
- [Helmet.js Documentation](https://helmetjs.github.io/)

---

*Document generated by AI Code Studio Security Scanner*
*Last updated: {{DATE}}*
