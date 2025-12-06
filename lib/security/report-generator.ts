// ============================================
// SECURITY REPORT GENERATOR
// Generates .md files with findings & solutions
// ============================================

import { ScanResult, Vulnerability, calculateCVSS } from './scanner';

export interface ReportOptions {
  includeExecutiveSummary: boolean;
  includeTechnicalDetails: boolean;
  includeRemediation: boolean;
  includeEvidence: boolean;
  includeTimeline: boolean;
  format: 'full' | 'executive' | 'technical';
  language: 'en' | 'id';
}

// ============================================
// MAIN REPORT GENERATOR
// ============================================

export function generateSecurityReport(
  result: ScanResult,
  options: ReportOptions = {
    includeExecutiveSummary: true,
    includeTechnicalDetails: true,
    includeRemediation: true,
    includeEvidence: true,
    includeTimeline: true,
    format: 'full',
    language: 'en',
  }
): string {
  const lines: string[] = [];
  
  // Header
  lines.push('# 🛡️ Security Assessment Report');
  lines.push('');
  lines.push(`**Target:** ${result.target.url}`);
  lines.push(`**Date:** ${result.startTime.toISOString().split('T')[0]}`);
  lines.push(`**Report ID:** ${result.id}`);
  lines.push(`**Status:** ${result.status}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Table of Contents
  lines.push('## 📑 Table of Contents');
  lines.push('');
  lines.push('1. [Executive Summary](#executive-summary)');
  lines.push('2. [Scope](#scope)');
  lines.push('3. [Findings Overview](#findings-overview)');
  lines.push('4. [Detailed Findings](#detailed-findings)');
  lines.push('5. [Remediation Plan](#remediation-plan)');
  lines.push('6. [Appendix](#appendix)');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Executive Summary
  if (options.includeExecutiveSummary) {
    lines.push('## 📊 Executive Summary');
    lines.push('');
    lines.push(generateExecutiveSummary(result));
    lines.push('');
  }

  // Scope
  lines.push('## 🎯 Scope');
  lines.push('');
  lines.push('### In Scope');
  lines.push('');
  result.target.scope.forEach(s => lines.push(`- ${s}`));
  lines.push('');
  if (result.target.excludePaths?.length) {
    lines.push('### Out of Scope');
    lines.push('');
    result.target.excludePaths.forEach(p => lines.push(`- ${p}`));
    lines.push('');
  }
  lines.push('### Authorization');
  lines.push('');
  lines.push(`- **Type:** ${result.target.authorization.type}`);
  if (result.target.authorization.approvedBy) {
    lines.push(`- **Approved By:** ${result.target.authorization.approvedBy}`);
  }
  if (result.target.authorization.validUntil) {
    lines.push(`- **Valid Until:** ${result.target.authorization.validUntil.toISOString().split('T')[0]}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // Findings Overview
  lines.push('## 📈 Findings Overview');
  lines.push('');
  lines.push(generateFindingsOverview(result));
  lines.push('');
  lines.push('---');
  lines.push('');

  // Detailed Findings
  if (options.includeTechnicalDetails) {
    lines.push('## 🔍 Detailed Findings');
    lines.push('');
    
    // Group by severity
    const critical = result.vulnerabilities.filter(v => v.severity === 'critical');
    const high = result.vulnerabilities.filter(v => v.severity === 'high');
    const medium = result.vulnerabilities.filter(v => v.severity === 'medium');
    const low = result.vulnerabilities.filter(v => v.severity === 'low');
    const info = result.vulnerabilities.filter(v => v.severity === 'info');

    if (critical.length) {
      lines.push('### 🔴 Critical Severity');
      lines.push('');
      critical.forEach((v, i) => lines.push(generateVulnerabilitySection(v, i + 1, options)));
    }

    if (high.length) {
      lines.push('### 🟠 High Severity');
      lines.push('');
      high.forEach((v, i) => lines.push(generateVulnerabilitySection(v, i + 1, options)));
    }

    if (medium.length) {
      lines.push('### 🟡 Medium Severity');
      lines.push('');
      medium.forEach((v, i) => lines.push(generateVulnerabilitySection(v, i + 1, options)));
    }

    if (low.length) {
      lines.push('### 🔵 Low Severity');
      lines.push('');
      low.forEach((v, i) => lines.push(generateVulnerabilitySection(v, i + 1, options)));
    }

    if (info.length) {
      lines.push('### ⚪ Informational');
      lines.push('');
      info.forEach((v, i) => lines.push(generateVulnerabilitySection(v, i + 1, options)));
    }

    lines.push('---');
    lines.push('');
  }

  // Remediation Plan
  if (options.includeRemediation) {
    lines.push('## 🔧 Remediation Plan');
    lines.push('');
    lines.push(generateRemediationPlan(result));
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Appendix
  lines.push('## 📎 Appendix');
  lines.push('');
  lines.push('### A. Methodology');
  lines.push('');
  lines.push('This assessment followed industry-standard methodologies:');
  lines.push('- OWASP Testing Guide v4.2');
  lines.push('- PTES (Penetration Testing Execution Standard)');
  lines.push('- NIST SP 800-115');
  lines.push('');
  lines.push('### B. Tools Used');
  lines.push('');
  lines.push('- AI Security Scanner (Custom)');
  lines.push('- Passive reconnaissance tools');
  lines.push('- Web application security testing tools');
  lines.push('');
  lines.push('### C. CVSS 3.1 Scoring');
  lines.push('');
  lines.push('| Score Range | Severity |');
  lines.push('|-------------|----------|');
  lines.push('| 9.0 - 10.0 | Critical |');
  lines.push('| 7.0 - 8.9 | High |');
  lines.push('| 4.0 - 6.9 | Medium |');
  lines.push('| 0.1 - 3.9 | Low |');
  lines.push('| 0.0 | None |');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*Report generated by AI Code Studio Security Scanner*');
  lines.push(`*Generated at: ${new Date().toISOString()}*`);

  return lines.join('\n');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateExecutiveSummary(result: ScanResult): string {
  const total = result.summary.total;
  const critical = result.summary.critical;
  const high = result.summary.high;
  
  let riskLevel = 'Low';
  if (critical > 0) riskLevel = 'Critical';
  else if (high > 0) riskLevel = 'High';
  else if (result.summary.medium > 0) riskLevel = 'Medium';

  return `
### Overview

A security assessment was conducted on **${result.target.url}** to identify potential vulnerabilities and security weaknesses. This assessment was performed with proper authorization.

### Key Findings

| Severity | Count |
|----------|-------|
| 🔴 Critical | ${result.summary.critical} |
| 🟠 High | ${result.summary.high} |
| 🟡 Medium | ${result.summary.medium} |
| 🔵 Low | ${result.summary.low} |
| ⚪ Info | ${result.summary.info} |
| **Total** | **${total}** |

### Overall Risk Level: **${riskLevel}**

### Key Recommendations

${result.recommendations.slice(0, 5).map((r, i) => `${i + 1}. ${r}`).join('\n')}

### Assessment Timeline

- **Start:** ${result.startTime.toISOString()}
- **End:** ${result.endTime?.toISOString() || 'In Progress'}
`;
}

function generateFindingsOverview(result: ScanResult): string {
  return `
### Vulnerability Distribution

\`\`\`
Critical: ${'█'.repeat(result.summary.critical)} (${result.summary.critical})
High:     ${'█'.repeat(result.summary.high)} (${result.summary.high})
Medium:   ${'█'.repeat(result.summary.medium)} (${result.summary.medium})
Low:      ${'█'.repeat(result.summary.low)} (${result.summary.low})
Info:     ${'█'.repeat(result.summary.info)} (${result.summary.info})
\`\`\`

### Findings by Category

| Category | Count | Highest Severity |
|----------|-------|------------------|
${getCategoryTable(result.vulnerabilities)}
`;
}

function getCategoryTable(vulnerabilities: Vulnerability[]): string {
  const categories: Record<string, { count: number; severity: string }> = {};
  
  vulnerabilities.forEach(v => {
    if (!categories[v.category]) {
      categories[v.category] = { count: 0, severity: 'info' };
    }
    categories[v.category].count++;
    
    const severityOrder = ['critical', 'high', 'medium', 'low', 'info'];
    if (severityOrder.indexOf(v.severity) < severityOrder.indexOf(categories[v.category].severity)) {
      categories[v.category].severity = v.severity;
    }
  });

  return Object.entries(categories)
    .map(([cat, data]) => `| ${cat} | ${data.count} | ${data.severity} |`)
    .join('\n');
}

function generateVulnerabilitySection(vuln: Vulnerability, index: number, options: ReportOptions): string {
  const severityEmoji = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
    info: '⚪',
  };

  let section = `
#### ${index}. ${vuln.title}

| Property | Value |
|----------|-------|
| **Severity** | ${severityEmoji[vuln.severity]} ${vuln.severity.toUpperCase()} |
| **CVSS Score** | ${vuln.cvss.score} |
| **CVSS Vector** | \`${vuln.cvss.vector}\` |
| **Category** | ${vuln.category} |
${vuln.cwe ? `| **CWE** | ${vuln.cwe} |` : ''}
${vuln.owasp ? `| **OWASP** | ${vuln.owasp} |` : ''}
${vuln.mitreAttack ? `| **MITRE ATT&CK** | ${vuln.mitreAttack} |` : ''}

**Description:**

${vuln.description}

`;

  if (options.includeEvidence && vuln.evidence) {
    section += `
**Evidence:**

- **URL:** \`${vuln.evidence.url}\`
${vuln.evidence.parameter ? `- **Parameter:** \`${vuln.evidence.parameter}\`` : ''}
${vuln.evidence.payload ? `- **Payload:** \`${vuln.evidence.payload}\`` : ''}

${vuln.evidence.response ? `
**Response:**
\`\`\`
${vuln.evidence.response.substring(0, 500)}${vuln.evidence.response.length > 500 ? '...' : ''}
\`\`\`
` : ''}
`;
  }

  if (options.includeRemediation) {
    section += `
**Remediation:**

${vuln.remediation}

`;
  }

  if (vuln.references.length) {
    section += `
**References:**

${vuln.references.map(r => `- ${r}`).join('\n')}

`;
  }

  return section;
}

function generateRemediationPlan(result: ScanResult): string {
  const critical = result.vulnerabilities.filter(v => v.severity === 'critical');
  const high = result.vulnerabilities.filter(v => v.severity === 'high');
  const medium = result.vulnerabilities.filter(v => v.severity === 'medium');

  return `
### Priority Matrix

| Priority | Timeframe | Action Items |
|----------|-----------|--------------|
| P1 - Immediate | 24-48 hours | Fix all Critical vulnerabilities |
| P2 - Urgent | 1 week | Fix all High vulnerabilities |
| P3 - Important | 2-4 weeks | Fix all Medium vulnerabilities |
| P4 - Normal | 1-3 months | Fix Low & Informational issues |

### Immediate Actions (P1)

${critical.length > 0 ? critical.map((v, i) => `
**${i + 1}. ${v.title}**

${v.remediation}
`).join('\n') : 'No critical vulnerabilities found.'}

### Urgent Actions (P2)

${high.length > 0 ? high.map((v, i) => `
**${i + 1}. ${v.title}**

${v.remediation}
`).join('\n') : 'No high severity vulnerabilities found.'}

### Important Actions (P3)

${medium.length > 0 ? medium.map((v, i) => `
**${i + 1}. ${v.title}**

${v.remediation}
`).join('\n') : 'No medium severity vulnerabilities found.'}

### Additional Recommendations

1. **Implement Security Headers** - Add all recommended security headers
2. **Regular Security Testing** - Schedule periodic security assessments
3. **Security Training** - Provide security awareness training to developers
4. **Patch Management** - Keep all software and dependencies updated
5. **Monitoring** - Implement security monitoring and alerting
`;
}

// ============================================
// INDIVIDUAL REMEDIATION FILE GENERATOR
// ============================================

export function generateRemediationFile(vuln: Vulnerability): string {
  return `# 🔧 Remediation Guide: ${vuln.title}

## Vulnerability Details

| Property | Value |
|----------|-------|
| **ID** | ${vuln.id} |
| **Severity** | ${vuln.severity.toUpperCase()} |
| **CVSS Score** | ${vuln.cvss.score} |
| **Category** | ${vuln.category} |
${vuln.cwe ? `| **CWE** | ${vuln.cwe} |` : ''}
${vuln.owasp ? `| **OWASP** | ${vuln.owasp} |` : ''}

## Description

${vuln.description}

## Affected Location

- **URL:** \`${vuln.evidence.url}\`
${vuln.evidence.parameter ? `- **Parameter:** \`${vuln.evidence.parameter}\`` : ''}

## Remediation Steps

${vuln.remediation}

## Code Examples

### ❌ Vulnerable Code

\`\`\`javascript
// Example of vulnerable code pattern
// DO NOT USE THIS
${getVulnerableCodeExample(vuln.category)}
\`\`\`

### ✅ Secure Code

\`\`\`javascript
// Example of secure code pattern
// USE THIS INSTEAD
${getSecureCodeExample(vuln.category)}
\`\`\`

## Verification Steps

1. Apply the recommended fix
2. Re-test the affected endpoint
3. Verify the vulnerability is no longer exploitable
4. Review similar code patterns in the application

## References

${vuln.references.map(r => `- ${r}`).join('\n')}

## Additional Resources

- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Database](https://cwe.mitre.org/)
- [NIST NVD](https://nvd.nist.gov/)

---
*Generated by AI Code Studio Security Scanner*
`;
}

function getVulnerableCodeExample(category: string): string {
  const examples: Record<string, string> = {
    'SQL Injection': `
// Vulnerable: String concatenation in SQL query
const query = "SELECT * FROM users WHERE id = " + userId;
db.query(query);
`,
    'XSS': `
// Vulnerable: Direct innerHTML assignment
element.innerHTML = userInput;
`,
    'CSRF': `
// Vulnerable: No CSRF token validation
app.post('/transfer', (req, res) => {
  // Process without CSRF check
});
`,
    'Authentication': `
// Vulnerable: Weak password comparison
if (password === storedPassword) {
  // Login success
}
`,
  };
  return examples[category] || '// No example available';
}

function getSecureCodeExample(category: string): string {
  const examples: Record<string, string> = {
    'SQL Injection': `
// Secure: Parameterized query
const query = "SELECT * FROM users WHERE id = $1";
db.query(query, [userId]);
`,
    'XSS': `
// Secure: Use textContent or sanitize
element.textContent = userInput;
// Or use DOMPurify
element.innerHTML = DOMPurify.sanitize(userInput);
`,
    'CSRF': `
// Secure: Validate CSRF token
app.post('/transfer', csrfProtection, (req, res) => {
  // CSRF token validated by middleware
});
`,
    'Authentication': `
// Secure: Use bcrypt for password comparison
const isValid = await bcrypt.compare(password, hashedPassword);
if (isValid) {
  // Login success
}
`,
  };
  return examples[category] || '// No example available';
}
