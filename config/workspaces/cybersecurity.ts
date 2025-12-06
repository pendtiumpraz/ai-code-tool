// ============================================
// CYBERSECURITY / RED TEAM WORKSPACE CONFIG
// Complete Red Team Simulation Platform
// ============================================

export const cybersecurityWorkspace = {
  id: 'cybersecurity',
  name: 'Cybersecurity Operations Center',
  description: 'Full-spectrum red team, blue team, and purple team operations',
  icon: 'shield',
  color: '#EF4444',
  gradient: 'from-red-500 to-orange-500',

  // ============================================
  // AI AGENT CONFIGURATION
  // ============================================
  agent: {
    model: 'glm-4-plus',
    systemPrompt: `You are an expert cybersecurity professional with deep knowledge in:
- Offensive security (red team operations, penetration testing)
- Defensive security (blue team, SOC operations, incident response)
- Purple team exercises and adversary simulation
- Malware analysis and reverse engineering
- Network security and forensics
- Web application security (OWASP Top 10)
- Cloud security (AWS, Azure, GCP)
- Compliance frameworks (NIST, ISO 27001, PCI-DSS, HIPAA)

You follow ethical hacking principles and only assist with authorized security testing.
Always provide educational context and responsible disclosure guidance.
Reference MITRE ATT&CK framework when discussing attack techniques.
Include remediation recommendations for every vulnerability identified.`,
    temperature: 0.3,
    maxTokens: 8192,
    enableThinking: true,
  },

  // ============================================
  // AVAILABLE TOOLS
  // ============================================
  tools: [
    // Code & Script Tools
    'create_file',
    'edit_file',
    'read_file',
    'execute_code',
    'run_command',
    
    // Research Tools
    'search_web',
    'web_browser',
    'fetch_url',
    
    // Analysis Tools
    'analyze_code',
    'analyze_log',
    'analyze_network',
    
    // Security Specific
    'vulnerability_scan',
    'exploit_search',
    'cve_lookup',
    'malware_analysis',
    'hash_lookup',
    'ip_reputation',
    'domain_intel',
    
    // Reporting
    'generate_report',
    'create_diagram',
  ],

  // ============================================
  // MENU STRUCTURE
  // ============================================
  menu: [
    // ─────────────────────────────────────────
    // RECONNAISSANCE
    // ─────────────────────────────────────────
    {
      id: 'recon',
      label: '🔍 Reconnaissance',
      submenu: [
        {
          id: 'passive-recon',
          label: 'Passive Reconnaissance',
          submenu: [
            { id: 'osint', label: 'OSINT Gathering', prompt: 'Perform comprehensive OSINT gathering on target: ' },
            { id: 'domain-enum', label: 'Domain Enumeration', prompt: 'Enumerate subdomains and DNS records for: ' },
            { id: 'email-harvest', label: 'Email Harvesting', prompt: 'Find email addresses and formats for organization: ' },
            { id: 'social-recon', label: 'Social Media Recon', prompt: 'Gather social media intelligence on: ' },
            { id: 'github-recon', label: 'GitHub/Code Recon', prompt: 'Search for leaked credentials and sensitive data in repos for: ' },
            { id: 'google-dorks', label: 'Google Dorks Generator', prompt: 'Generate Google dorks to find sensitive information for: ' },
            { id: 'shodan-query', label: 'Shodan Query Builder', prompt: 'Create Shodan queries to discover assets for: ' },
          ],
        },
        {
          id: 'active-recon',
          label: 'Active Reconnaissance',
          submenu: [
            { id: 'port-scan', label: 'Port Scanning Script', prompt: 'Generate Nmap scan commands for target: ' },
            { id: 'service-enum', label: 'Service Enumeration', prompt: 'Create service enumeration scripts for: ' },
            { id: 'web-enum', label: 'Web Enumeration', prompt: 'Generate web directory/file enumeration for: ' },
            { id: 'tech-stack', label: 'Technology Stack Detection', prompt: 'Identify technology stack and versions for: ' },
            { id: 'ssl-analysis', label: 'SSL/TLS Analysis', prompt: 'Analyze SSL/TLS configuration for: ' },
          ],
        },
        {
          id: 'attack-surface',
          label: 'Attack Surface Mapping',
          submenu: [
            { id: 'asset-discovery', label: 'Asset Discovery', prompt: 'Map all assets and attack surface for: ' },
            { id: 'network-diagram', label: 'Network Diagram', prompt: 'Create network topology diagram based on: ' },
            { id: 'entry-points', label: 'Entry Points Analysis', prompt: 'Identify potential entry points for: ' },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────
    // VULNERABILITY ASSESSMENT
    // ─────────────────────────────────────────
    {
      id: 'vuln-assessment',
      label: '🎯 Vulnerability Assessment',
      submenu: [
        {
          id: 'web-vulns',
          label: 'Web Application',
          submenu: [
            { id: 'sqli', label: 'SQL Injection Testing', prompt: 'Create SQL injection test payloads and methodology for: ' },
            { id: 'xss', label: 'XSS Testing', prompt: 'Generate XSS test cases and payloads for: ' },
            { id: 'csrf', label: 'CSRF Testing', prompt: 'Test for CSRF vulnerabilities in: ' },
            { id: 'ssrf', label: 'SSRF Testing', prompt: 'Create SSRF test cases for: ' },
            { id: 'idor', label: 'IDOR Testing', prompt: 'Test for Insecure Direct Object References in: ' },
            { id: 'auth-bypass', label: 'Authentication Bypass', prompt: 'Test authentication bypass techniques for: ' },
            { id: 'file-upload', label: 'File Upload Vulnerabilities', prompt: 'Test file upload security for: ' },
            { id: 'api-security', label: 'API Security Testing', prompt: 'Perform API security assessment for: ' },
            { id: 'jwt-analysis', label: 'JWT Token Analysis', prompt: 'Analyze and test JWT implementation: ' },
            { id: 'owasp-top10', label: 'OWASP Top 10 Checklist', prompt: 'Generate OWASP Top 10 test checklist for: ' },
          ],
        },
        {
          id: 'network-vulns',
          label: 'Network',
          submenu: [
            { id: 'network-scan', label: 'Network Vulnerability Scan', prompt: 'Create network vulnerability assessment for: ' },
            { id: 'smb-enum', label: 'SMB Enumeration', prompt: 'Enumerate SMB shares and vulnerabilities on: ' },
            { id: 'ldap-enum', label: 'LDAP Enumeration', prompt: 'Enumerate LDAP directory for: ' },
            { id: 'snmp-enum', label: 'SNMP Enumeration', prompt: 'Enumerate SNMP information on: ' },
            { id: 'wireless', label: 'Wireless Security', prompt: 'Assess wireless security for: ' },
          ],
        },
        {
          id: 'cloud-vulns',
          label: 'Cloud Security',
          submenu: [
            { id: 'aws-audit', label: 'AWS Security Audit', prompt: 'Perform AWS security assessment using: ' },
            { id: 'azure-audit', label: 'Azure Security Audit', prompt: 'Perform Azure security assessment for: ' },
            { id: 'gcp-audit', label: 'GCP Security Audit', prompt: 'Perform GCP security assessment for: ' },
            { id: 's3-bucket', label: 'S3 Bucket Misconfiguration', prompt: 'Check for S3 bucket misconfigurations: ' },
            { id: 'iam-review', label: 'IAM Policy Review', prompt: 'Review and analyze IAM policies: ' },
            { id: 'container-sec', label: 'Container Security', prompt: 'Assess Docker/Kubernetes security for: ' },
          ],
        },
        {
          id: 'code-review',
          label: 'Source Code Review',
          submenu: [
            { id: 'sast', label: 'Static Code Analysis', prompt: 'Perform static security analysis on: ' },
            { id: 'secrets-scan', label: 'Secrets Detection', prompt: 'Scan for hardcoded secrets in: ' },
            { id: 'dependency-check', label: 'Dependency Vulnerabilities', prompt: 'Check for vulnerable dependencies in: ' },
            { id: 'code-injection', label: 'Code Injection Points', prompt: 'Find potential code injection points in: ' },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────
    // EXPLOITATION
    // ─────────────────────────────────────────
    {
      id: 'exploitation',
      label: '💥 Exploitation',
      submenu: [
        {
          id: 'exploit-dev',
          label: 'Exploit Development',
          submenu: [
            { id: 'poc-create', label: 'PoC Development', prompt: 'Create proof-of-concept exploit for: ' },
            { id: 'payload-gen', label: 'Payload Generation', prompt: 'Generate payload for: ' },
            { id: 'shellcode', label: 'Shellcode Development', prompt: 'Create shellcode for: ' },
            { id: 'buffer-overflow', label: 'Buffer Overflow', prompt: 'Develop buffer overflow exploit for: ' },
            { id: 'rop-chain', label: 'ROP Chain Builder', prompt: 'Build ROP chain for: ' },
          ],
        },
        {
          id: 'web-exploit',
          label: 'Web Exploitation',
          submenu: [
            { id: 'sqli-exploit', label: 'SQLi Exploitation', prompt: 'Exploit SQL injection vulnerability: ' },
            { id: 'xss-exploit', label: 'XSS Exploitation', prompt: 'Create XSS exploit payload for: ' },
            { id: 'rce-exploit', label: 'Remote Code Execution', prompt: 'Exploit RCE vulnerability in: ' },
            { id: 'lfi-rfi', label: 'LFI/RFI Exploitation', prompt: 'Exploit file inclusion vulnerability: ' },
            { id: 'deserialization', label: 'Deserialization Attack', prompt: 'Create deserialization exploit for: ' },
            { id: 'ssti', label: 'SSTI Exploitation', prompt: 'Exploit Server-Side Template Injection: ' },
          ],
        },
        {
          id: 'network-exploit',
          label: 'Network Exploitation',
          submenu: [
            { id: 'mitm', label: 'Man-in-the-Middle', prompt: 'Set up MITM attack for: ' },
            { id: 'arp-spoof', label: 'ARP Spoofing', prompt: 'Create ARP spoofing attack: ' },
            { id: 'dns-spoof', label: 'DNS Spoofing', prompt: 'Set up DNS spoofing for: ' },
            { id: 'pass-spray', label: 'Password Spraying', prompt: 'Create password spraying attack for: ' },
            { id: 'kerberoast', label: 'Kerberoasting', prompt: 'Perform Kerberoasting attack on: ' },
            { id: 'as-rep', label: 'AS-REP Roasting', prompt: 'Perform AS-REP roasting on: ' },
          ],
        },
        {
          id: 'social-eng',
          label: 'Social Engineering',
          submenu: [
            { id: 'phishing', label: 'Phishing Campaign', prompt: 'Design phishing campaign template for: ' },
            { id: 'pretexting', label: 'Pretexting Scenarios', prompt: 'Create pretexting scenarios for: ' },
            { id: 'vishing', label: 'Vishing Scripts', prompt: 'Create vishing call scripts for: ' },
            { id: 'usb-drop', label: 'USB Drop Attack', prompt: 'Design USB drop attack for: ' },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────
    // POST-EXPLOITATION
    // ─────────────────────────────────────────
    {
      id: 'post-exploit',
      label: '🚀 Post-Exploitation',
      submenu: [
        {
          id: 'persistence',
          label: 'Persistence',
          submenu: [
            { id: 'backdoor', label: 'Backdoor Installation', prompt: 'Create persistence mechanism for: ' },
            { id: 'scheduled-task', label: 'Scheduled Tasks', prompt: 'Create scheduled task persistence: ' },
            { id: 'registry-keys', label: 'Registry Persistence', prompt: 'Set up registry-based persistence: ' },
            { id: 'service-creation', label: 'Service Creation', prompt: 'Create malicious service for: ' },
            { id: 'startup-folder', label: 'Startup Folder', prompt: 'Startup folder persistence for: ' },
          ],
        },
        {
          id: 'priv-esc',
          label: 'Privilege Escalation',
          submenu: [
            { id: 'windows-privesc', label: 'Windows PrivEsc', prompt: 'Find Windows privilege escalation vectors: ' },
            { id: 'linux-privesc', label: 'Linux PrivEsc', prompt: 'Find Linux privilege escalation vectors: ' },
            { id: 'sudo-abuse', label: 'Sudo Abuse', prompt: 'Check for sudo misconfigurations: ' },
            { id: 'suid-sgid', label: 'SUID/SGID Abuse', prompt: 'Find exploitable SUID/SGID binaries: ' },
            { id: 'kernel-exploit', label: 'Kernel Exploits', prompt: 'Find kernel exploits for: ' },
            { id: 'token-impersonation', label: 'Token Impersonation', prompt: 'Perform token impersonation on: ' },
          ],
        },
        {
          id: 'lateral-movement',
          label: 'Lateral Movement',
          submenu: [
            { id: 'pass-the-hash', label: 'Pass-the-Hash', prompt: 'Perform pass-the-hash attack: ' },
            { id: 'pass-the-ticket', label: 'Pass-the-Ticket', prompt: 'Perform pass-the-ticket attack: ' },
            { id: 'psexec', label: 'PsExec Movement', prompt: 'Move laterally using PsExec: ' },
            { id: 'wmi-exec', label: 'WMI Execution', prompt: 'Execute commands via WMI: ' },
            { id: 'winrm', label: 'WinRM Movement', prompt: 'Move laterally using WinRM: ' },
            { id: 'ssh-pivot', label: 'SSH Pivoting', prompt: 'Set up SSH pivot through: ' },
          ],
        },
        {
          id: 'data-exfil',
          label: 'Data Exfiltration',
          submenu: [
            { id: 'data-discovery', label: 'Data Discovery', prompt: 'Find sensitive data on: ' },
            { id: 'exfil-methods', label: 'Exfiltration Methods', prompt: 'Create data exfiltration strategy for: ' },
            { id: 'covert-channel', label: 'Covert Channels', prompt: 'Set up covert channel using: ' },
            { id: 'dns-exfil', label: 'DNS Exfiltration', prompt: 'Exfiltrate data via DNS: ' },
          ],
        },
        {
          id: 'credential-access',
          label: 'Credential Access',
          submenu: [
            { id: 'mimikatz', label: 'Mimikatz Usage', prompt: 'Extract credentials using Mimikatz: ' },
            { id: 'lsass-dump', label: 'LSASS Dump', prompt: 'Dump LSASS memory for: ' },
            { id: 'sam-dump', label: 'SAM Database', prompt: 'Extract SAM database hashes: ' },
            { id: 'browser-creds', label: 'Browser Credentials', prompt: 'Extract browser credentials from: ' },
            { id: 'keylogging', label: 'Keylogging', prompt: 'Set up keylogger on: ' },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────
    // BLUE TEAM / DEFENSE
    // ─────────────────────────────────────────
    {
      id: 'defense',
      label: '🛡️ Defense / Blue Team',
      submenu: [
        {
          id: 'detection',
          label: 'Threat Detection',
          submenu: [
            { id: 'siem-rules', label: 'SIEM Detection Rules', prompt: 'Create SIEM detection rules for: ' },
            { id: 'yara-rules', label: 'YARA Rules', prompt: 'Write YARA rules to detect: ' },
            { id: 'sigma-rules', label: 'Sigma Rules', prompt: 'Create Sigma rules for: ' },
            { id: 'snort-rules', label: 'Snort/Suricata Rules', prompt: 'Write IDS rules for: ' },
            { id: 'edr-detection', label: 'EDR Detection', prompt: 'Create EDR detection logic for: ' },
          ],
        },
        {
          id: 'incident-response',
          label: 'Incident Response',
          submenu: [
            { id: 'ir-playbook', label: 'IR Playbook', prompt: 'Create incident response playbook for: ' },
            { id: 'containment', label: 'Containment Strategy', prompt: 'Develop containment strategy for: ' },
            { id: 'eradication', label: 'Eradication Steps', prompt: 'Create eradication procedures for: ' },
            { id: 'recovery', label: 'Recovery Plan', prompt: 'Develop recovery plan for: ' },
            { id: 'lessons-learned', label: 'Lessons Learned', prompt: 'Create lessons learned report for: ' },
          ],
        },
        {
          id: 'forensics',
          label: 'Digital Forensics',
          submenu: [
            { id: 'memory-forensics', label: 'Memory Forensics', prompt: 'Analyze memory dump: ' },
            { id: 'disk-forensics', label: 'Disk Forensics', prompt: 'Perform disk forensics on: ' },
            { id: 'network-forensics', label: 'Network Forensics', prompt: 'Analyze network capture: ' },
            { id: 'log-analysis', label: 'Log Analysis', prompt: 'Analyze logs for indicators: ' },
            { id: 'timeline', label: 'Timeline Analysis', prompt: 'Create forensic timeline for: ' },
            { id: 'artifact-analysis', label: 'Artifact Analysis', prompt: 'Analyze forensic artifacts: ' },
          ],
        },
        {
          id: 'threat-hunting',
          label: 'Threat Hunting',
          submenu: [
            { id: 'hunt-hypothesis', label: 'Hunt Hypothesis', prompt: 'Create threat hunting hypothesis for: ' },
            { id: 'ioc-search', label: 'IOC Search', prompt: 'Search for indicators of compromise: ' },
            { id: 'behavior-analysis', label: 'Behavior Analysis', prompt: 'Analyze suspicious behavior: ' },
            { id: 'baseline-deviation', label: 'Baseline Deviation', prompt: 'Find baseline deviations in: ' },
          ],
        },
        {
          id: 'malware-analysis',
          label: 'Malware Analysis',
          submenu: [
            { id: 'static-analysis', label: 'Static Analysis', prompt: 'Perform static analysis on: ' },
            { id: 'dynamic-analysis', label: 'Dynamic Analysis', prompt: 'Perform dynamic/behavioral analysis: ' },
            { id: 'reverse-engineering', label: 'Reverse Engineering', prompt: 'Reverse engineer malware: ' },
            { id: 'sandbox-analysis', label: 'Sandbox Analysis', prompt: 'Analyze in sandbox environment: ' },
            { id: 'c2-analysis', label: 'C2 Infrastructure', prompt: 'Analyze C2 infrastructure of: ' },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────
    // COMPLIANCE & REPORTING
    // ─────────────────────────────────────────
    {
      id: 'compliance',
      label: '📋 Compliance & Reporting',
      submenu: [
        {
          id: 'frameworks',
          label: 'Compliance Frameworks',
          submenu: [
            { id: 'nist-csf', label: 'NIST CSF Assessment', prompt: 'Perform NIST Cybersecurity Framework assessment for: ' },
            { id: 'iso27001', label: 'ISO 27001 Audit', prompt: 'Conduct ISO 27001 gap analysis for: ' },
            { id: 'pci-dss', label: 'PCI-DSS Compliance', prompt: 'Assess PCI-DSS compliance for: ' },
            { id: 'hipaa', label: 'HIPAA Security', prompt: 'Evaluate HIPAA security requirements for: ' },
            { id: 'soc2', label: 'SOC 2 Readiness', prompt: 'Assess SOC 2 readiness for: ' },
            { id: 'gdpr', label: 'GDPR Compliance', prompt: 'Evaluate GDPR compliance for: ' },
            { id: 'cis-controls', label: 'CIS Controls', prompt: 'Map against CIS Controls: ' },
          ],
        },
        {
          id: 'reports',
          label: 'Security Reports',
          submenu: [
            { id: 'pentest-report', label: 'Pentest Report', prompt: 'Generate penetration test report for: ' },
            { id: 'vuln-report', label: 'Vulnerability Report', prompt: 'Create vulnerability assessment report: ' },
            { id: 'risk-assessment', label: 'Risk Assessment', prompt: 'Perform risk assessment for: ' },
            { id: 'executive-summary', label: 'Executive Summary', prompt: 'Write executive summary of findings: ' },
            { id: 'technical-report', label: 'Technical Report', prompt: 'Create detailed technical report: ' },
            { id: 'remediation-plan', label: 'Remediation Plan', prompt: 'Develop remediation roadmap for: ' },
          ],
        },
        {
          id: 'mitre-mapping',
          label: 'MITRE ATT&CK',
          submenu: [
            { id: 'technique-map', label: 'Technique Mapping', prompt: 'Map attack to MITRE ATT&CK techniques: ' },
            { id: 'coverage-analysis', label: 'Coverage Analysis', prompt: 'Analyze detection coverage against MITRE: ' },
            { id: 'navigator-export', label: 'Navigator Export', prompt: 'Create ATT&CK Navigator layer for: ' },
            { id: 'threat-model', label: 'Threat Modeling', prompt: 'Create MITRE-based threat model for: ' },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────
    // TOOLS & SCRIPTS
    // ─────────────────────────────────────────
    {
      id: 'tools',
      label: '🔧 Tools & Scripts',
      submenu: [
        {
          id: 'offensive-tools',
          label: 'Offensive Tools',
          submenu: [
            { id: 'custom-tool', label: 'Custom Tool Development', prompt: 'Develop custom security tool for: ' },
            { id: 'automation-script', label: 'Automation Script', prompt: 'Create automation script for: ' },
            { id: 'c2-framework', label: 'C2 Framework Config', prompt: 'Configure C2 framework for: ' },
            { id: 'evasion-technique', label: 'Evasion Techniques', prompt: 'Implement AV/EDR evasion for: ' },
            { id: 'obfuscation', label: 'Code Obfuscation', prompt: 'Obfuscate payload/script: ' },
          ],
        },
        {
          id: 'defensive-tools',
          label: 'Defensive Tools',
          submenu: [
            { id: 'monitoring-script', label: 'Monitoring Script', prompt: 'Create monitoring script for: ' },
            { id: 'hardening-script', label: 'Hardening Script', prompt: 'Create system hardening script: ' },
            { id: 'audit-script', label: 'Audit Script', prompt: 'Create security audit script for: ' },
            { id: 'backup-script', label: 'Backup Script', prompt: 'Create secure backup script: ' },
          ],
        },
        {
          id: 'analysis-tools',
          label: 'Analysis Tools',
          submenu: [
            { id: 'log-parser', label: 'Log Parser', prompt: 'Create log parser for: ' },
            { id: 'pcap-analyzer', label: 'PCAP Analyzer', prompt: 'Create PCAP analysis script: ' },
            { id: 'hash-cracker', label: 'Hash Analysis', prompt: 'Analyze and crack hashes: ' },
            { id: 'decoder', label: 'Encoder/Decoder', prompt: 'Create encoding/decoding tool: ' },
          ],
        },
      ],
    },
  ],

  // ============================================
  // QUICK ACTIONS
  // ============================================
  quickActions: [
    {
      label: '🔍 Quick Recon',
      prompt: 'Perform quick reconnaissance on target domain: ',
      icon: 'search',
    },
    {
      label: '🎯 OWASP Scan',
      prompt: 'Create OWASP Top 10 vulnerability checklist for web application: ',
      icon: 'target',
    },
    {
      label: '📝 Pentest Report',
      prompt: 'Generate penetration test report template',
      icon: 'file-text',
    },
    {
      label: '🛡️ SIEM Rules',
      prompt: 'Create SIEM detection rules for: ',
      icon: 'shield',
    },
    {
      label: '🔧 Exploit PoC',
      prompt: 'Create proof-of-concept for vulnerability: ',
      icon: 'code',
    },
    {
      label: '📊 Risk Assessment',
      prompt: 'Perform risk assessment for: ',
      icon: 'bar-chart',
    },
  ],

  // ============================================
  // TEMPLATES
  // ============================================
  templates: [
    {
      id: 'pentest-engagement',
      name: 'Penetration Test Engagement',
      description: 'Full pentest project structure with methodology',
      files: {
        'README.md': '# Penetration Test Engagement\n\n## Scope\n\n## Methodology\n\n## Timeline',
        'scope.md': '# Scope Definition\n\n## In Scope\n\n## Out of Scope\n\n## Rules of Engagement',
        'recon/notes.md': '# Reconnaissance Notes',
        'vulnerabilities/findings.md': '# Vulnerability Findings',
        'exploits/README.md': '# Exploits and PoCs',
        'evidence/README.md': '# Evidence and Screenshots',
        'report/executive-summary.md': '# Executive Summary',
        'report/technical-findings.md': '# Technical Findings',
      },
    },
    {
      id: 'incident-response',
      name: 'Incident Response',
      description: 'IR case management structure',
      files: {
        'README.md': '# Incident Response Case',
        'timeline.md': '# Incident Timeline',
        'indicators.md': '# Indicators of Compromise',
        'containment.md': '# Containment Actions',
        'eradication.md': '# Eradication Steps',
        'recovery.md': '# Recovery Plan',
        'lessons-learned.md': '# Lessons Learned',
      },
    },
    {
      id: 'threat-hunt',
      name: 'Threat Hunting Campaign',
      description: 'Threat hunting hypothesis and findings',
      files: {
        'hypothesis.md': '# Hunt Hypothesis',
        'data-sources.md': '# Data Sources',
        'queries.md': '# Detection Queries',
        'findings.md': '# Findings',
        'recommendations.md': '# Recommendations',
      },
    },
    {
      id: 'security-audit',
      name: 'Security Audit',
      description: 'Compliance and security audit structure',
      files: {
        'README.md': '# Security Audit',
        'scope.md': '# Audit Scope',
        'controls-checklist.md': '# Controls Checklist',
        'findings.md': '# Audit Findings',
        'recommendations.md': '# Recommendations',
        'remediation-plan.md': '# Remediation Plan',
      },
    },
  ],

  // ============================================
  // OUTPUT TYPES
  // ============================================
  outputTypes: [
    'pentest_report',
    'vulnerability_report',
    'exploit_code',
    'detection_rule',
    'yara_rule',
    'sigma_rule',
    'forensic_report',
    'incident_report',
    'compliance_report',
    'risk_assessment',
    'executive_summary',
    'technical_brief',
    'remediation_plan',
    'threat_model',
  ],

  // ============================================
  // REFERENCES
  // ============================================
  references: {
    frameworks: [
      { name: 'MITRE ATT&CK', url: 'https://attack.mitre.org/' },
      { name: 'OWASP', url: 'https://owasp.org/' },
      { name: 'NIST CSF', url: 'https://www.nist.gov/cyberframework' },
      { name: 'CIS Controls', url: 'https://www.cisecurity.org/controls' },
      { name: 'PTES', url: 'http://www.pentest-standard.org/' },
    ],
    tools: [
      { name: 'Nmap', category: 'recon' },
      { name: 'Burp Suite', category: 'web' },
      { name: 'Metasploit', category: 'exploit' },
      { name: 'Mimikatz', category: 'post-exploit' },
      { name: 'Volatility', category: 'forensics' },
      { name: 'Wireshark', category: 'network' },
      { name: 'Ghidra', category: 'reverse' },
      { name: 'Splunk', category: 'siem' },
    ],
  },
};

export default cybersecurityWorkspace;
