# 🔧 Remediation Guide: Cross-Site Scripting (XSS)

## Vulnerability Overview

| Property | Value |
|----------|-------|
| **Severity** | 🟠 HIGH / 🟡 MEDIUM |
| **CVSS Score** | 5.4 - 7.5 |
| **CWE** | CWE-79 |
| **OWASP** | A03:2021 - Injection |
| **MITRE ATT&CK** | T1059.007 (JavaScript) |

## Tipe XSS

| Type | Description | Persistence |
|------|-------------|-------------|
| **Reflected XSS** | Payload di-reflect dari request | Non-persistent |
| **Stored XSS** | Payload disimpan di database | Persistent |
| **DOM-based XSS** | Eksekusi di client-side JavaScript | Client-side |

## Langkah Remediasi

### 1. Output Encoding

#### ❌ Kode Rentan (JANGAN GUNAKAN)

```javascript
// React - RENTAN!
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// Vanilla JS - RENTAN!
element.innerHTML = userInput;
document.write(userInput);

// Template literals - RENTAN!
const html = `<div>${userComment}</div>`;
```

```php
// PHP - RENTAN!
echo "<div>" . $_GET['name'] . "</div>";
```

#### ✅ Kode Aman (GUNAKAN INI)

```javascript
// React - AMAN (default behavior)
<div>{userInput}</div>  // React auto-escapes

// Jika perlu HTML, sanitize dulu
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />

// Vanilla JS - AMAN
element.textContent = userInput;  // Tidak parse HTML

// Template dengan encoding
import { encode } from 'html-entities';
const html = `<div>${encode(userComment)}</div>`;
```

```php
// PHP - AMAN
echo "<div>" . htmlspecialchars($_GET['name'], ENT_QUOTES, 'UTF-8') . "</div>";

// Atau gunakan template engine
// Blade (Laravel) - auto escape
{{ $name }}

// Untuk raw output (hati-hati!)
{!! $trustedHtml !!}
```

### 2. Content Security Policy (CSP)

```html
<!-- Meta tag CSP -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'nonce-randomNonce123'; 
               style-src 'self' 'unsafe-inline';
               img-src 'self' data: https:;
               font-src 'self';
               connect-src 'self' https://api.example.com;">
```

```javascript
// Express.js dengan Helmet
const helmet = require('helmet');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.example.com"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));
```

```nginx
# Nginx CSP Header
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';" always;
```

### 3. Input Validation

```javascript
// Server-side validation
const validator = require('validator');

function validateUserInput(input) {
  // Whitelist approach
  if (!validator.isAlphanumeric(input.replace(/\s/g, ''))) {
    throw new Error('Invalid characters in input');
  }
  
  // Length limit
  if (input.length > 1000) {
    throw new Error('Input too long');
  }
  
  // Strip HTML tags jika tidak diperlukan
  return validator.stripLow(input);
}

// Zod validation schema
import { z } from 'zod';

const userInputSchema = z.object({
  name: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z\s]+$/, 'Only letters and spaces allowed'),
  comment: z.string()
    .max(1000)
    .transform(val => DOMPurify.sanitize(val)),
});
```

### 4. Sanitization dengan DOMPurify

```javascript
import DOMPurify from 'dompurify';

// Basic sanitization
const cleanHTML = DOMPurify.sanitize(dirtyHTML);

// Custom configuration
const cleanHTML = DOMPurify.sanitize(dirtyHTML, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
  ALLOWED_ATTR: ['href', 'target'],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'],  // Force target="_blank"
  FORBID_TAGS: ['script', 'style', 'iframe'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick'],
});

// For React
import { sanitize } from 'dompurify';

function SafeHTML({ html }) {
  return (
    <div 
      dangerouslySetInnerHTML={{ 
        __html: sanitize(html, { USE_PROFILES: { html: true } }) 
      }} 
    />
  );
}
```

### 5. HTTP-Only Cookies

```javascript
// Express.js
res.cookie('sessionId', token, {
  httpOnly: true,    // Tidak bisa diakses JavaScript
  secure: true,      // Hanya HTTPS
  sameSite: 'strict', // CSRF protection
  maxAge: 3600000,   // 1 hour
  path: '/',
});

// Next.js API route
import { serialize } from 'cookie';

export default function handler(req, res) {
  res.setHeader('Set-Cookie', serialize('token', value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  }));
}
```

### 6. Framework-Specific Protection

#### React
```jsx
// React auto-escapes by default
function Comment({ text }) {
  return <p>{text}</p>;  // AMAN - auto escaped
}

// Avoid dangerouslySetInnerHTML unless necessary
// If needed, always sanitize first
```

#### Vue.js
```vue
<template>
  <!-- AMAN - auto escaped -->
  <p>{{ userInput }}</p>
  
  <!-- BERBAHAYA - raw HTML -->
  <!-- <p v-html="userInput"></p> -->
  
  <!-- AMAN - sanitized -->
  <p v-html="sanitizedInput"></p>
</template>

<script>
import DOMPurify from 'dompurify';

export default {
  computed: {
    sanitizedInput() {
      return DOMPurify.sanitize(this.userInput);
    }
  }
}
</script>
```

#### Angular
```typescript
// Angular sanitizes by default
// Untuk bypass (hati-hati!):
import { DomSanitizer } from '@angular/platform-browser';

constructor(private sanitizer: DomSanitizer) {}

getSafeHtml(html: string) {
  // Sanitize dengan DOMPurify dulu
  const clean = DOMPurify.sanitize(html);
  return this.sanitizer.bypassSecurityTrustHtml(clean);
}
```

## Security Headers

```javascript
// Express.js dengan Helmet
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: true,
  xContentTypeOptions: true,  // X-Content-Type-Options: nosniff
  xXssProtection: true,       // X-XSS-Protection (legacy browsers)
}));

// Manual headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

## Checklist Verifikasi

- [ ] Semua user input di-encode sebelum di-render
- [ ] Content Security Policy (CSP) header aktif
- [ ] Cookies menggunakan HttpOnly flag
- [ ] DOMPurify atau sanitizer lain digunakan untuk HTML content
- [ ] Input validation di client dan server side
- [ ] Framework security features diaktifkan
- [ ] X-Content-Type-Options: nosniff header aktif
- [ ] Regular XSS testing dilakukan

## Testing

### Manual Testing Payloads

```html
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<svg onload=alert('XSS')>
<body onload=alert('XSS')>
javascript:alert('XSS')
<a href="javascript:alert('XSS')">click</a>
<div onmouseover="alert('XSS')">hover me</div>
"><script>alert('XSS')</script>
'><img src=x onerror=alert('XSS')>
</title><script>alert('XSS')</script>
```

### Automated Testing

```bash
# XSStrike
python xsstrike.py -u "https://target.com/page?q=test"

# Dalfox
dalfox url "https://target.com/page?q=test"

# Burp Suite
# Enable XSS checks in Active Scan
```

## References

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [CWE-79: Cross-site Scripting](https://cwe.mitre.org/data/definitions/79.html)
- [PortSwigger XSS](https://portswigger.net/web-security/cross-site-scripting)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)

---

*Document generated by AI Code Studio Security Scanner*
*Last updated: {{DATE}}*
