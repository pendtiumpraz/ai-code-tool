// ============================================
// WORKSPACE CONFIGURATIONS
// Menu & Tools untuk setiap industri/use case
// ============================================

export interface AgentConfig {
  id?: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxIterations?: number;
  maxTokens?: number;
  enableThinking?: boolean;
}

export interface ToolConfig {
  id: string;
  enabled?: boolean;
  description?: string;
  parameters?: Record<string, any>;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  prompt?: string;
  files?: Record<string, string>;
  fields?: {
    name: string;
    label?: string;
    type: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    default?: string | number | boolean;
  }[];
}

export type OutputType = string | {
  id: string;
  label: string;
  icon: string;
};

export interface WorkspaceConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  gradient?: string;
  agent: AgentConfig;
  tools: ToolConfig[];
  templates: TaskTemplate[];
  menu: MenuItem[];
  quickActions: QuickAction[];
  outputTypes: OutputType[];
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  action?: string;
  submenu?: MenuItem[];
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  color: string;
}

// ============================================
// 1. BOOK WRITING WORKSPACE
// ============================================
export const bookWritingWorkspace: WorkspaceConfig = {
  id: 'book-writing',
  name: 'Book Writing Studio',
  icon: 'book-open',
  description: 'Write novels, non-fiction, e-books, and more',
  color: '#8B5CF6', // Purple
  
  agent: {
    id: 'writer',
    model: 'glm-4.6',
    systemPrompt: `You are a professional author and writing assistant. You help create:
- Novels and fiction
- Non-fiction books
- E-books
- Technical books
- Children's books
- Self-help books

Always structure work with outlines first. Write chapter by chapter.
Maintain consistent voice, style, and pacing throughout.
Save work regularly using file tools.`,
    temperature: 0.8,
    maxIterations: 100,
  },
  
  tools: [
    { id: 'create_file', enabled: true },
    { id: 'edit_file', enabled: true },
    { id: 'search_web', enabled: true },
    { id: 'generate_image', enabled: true, description: 'Generate book cover & illustrations' },
    { id: 'analyze_data', enabled: true, description: 'Analyze writing statistics' },
  ],
  
  menu: [
    {
      id: 'new',
      label: 'New Project',
      icon: 'plus',
      submenu: [
        { id: 'new-novel', label: 'Novel / Fiction', icon: 'book' },
        { id: 'new-nonfiction', label: 'Non-Fiction Book', icon: 'file-text' },
        { id: 'new-ebook', label: 'E-Book', icon: 'tablet' },
        { id: 'new-children', label: "Children's Book", icon: 'baby' },
        { id: 'new-technical', label: 'Technical Book', icon: 'code' },
        { id: 'new-memoir', label: 'Memoir / Biography', icon: 'user' },
        { id: 'new-selfhelp', label: 'Self-Help Book', icon: 'heart' },
      ],
    },
    {
      id: 'outline',
      label: 'Outline Tools',
      icon: 'list',
      submenu: [
        { id: 'create-outline', label: 'Create Book Outline', icon: 'list-tree' },
        { id: 'chapter-plan', label: 'Chapter Planning', icon: 'layers' },
        { id: 'character-sheet', label: 'Character Sheets', icon: 'users' },
        { id: 'world-building', label: 'World Building', icon: 'globe' },
        { id: 'plot-structure', label: 'Plot Structure (3-Act)', icon: 'git-branch' },
        { id: 'timeline', label: 'Story Timeline', icon: 'clock' },
      ],
    },
    {
      id: 'write',
      label: 'Writing',
      icon: 'pen-tool',
      submenu: [
        { id: 'write-chapter', label: 'Write Chapter', icon: 'file-plus' },
        { id: 'continue-writing', label: 'Continue Writing', icon: 'arrow-right' },
        { id: 'expand-scene', label: 'Expand Scene', icon: 'maximize' },
        { id: 'write-dialogue', label: 'Write Dialogue', icon: 'message-circle' },
        { id: 'describe-setting', label: 'Describe Setting', icon: 'map' },
      ],
    },
    {
      id: 'edit',
      label: 'Editing',
      icon: 'edit',
      submenu: [
        { id: 'proofread', label: 'Proofread', icon: 'check-circle' },
        { id: 'grammar-check', label: 'Grammar Check', icon: 'spell-check' },
        { id: 'style-edit', label: 'Style Editing', icon: 'type' },
        { id: 'consistency-check', label: 'Consistency Check', icon: 'shield-check' },
        { id: 'pacing-analysis', label: 'Pacing Analysis', icon: 'activity' },
        { id: 'show-dont-tell', label: "Show Don't Tell", icon: 'eye' },
      ],
    },
    {
      id: 'publish',
      label: 'Publishing',
      icon: 'upload',
      submenu: [
        { id: 'format-epub', label: 'Format for ePub', icon: 'book-open' },
        { id: 'format-pdf', label: 'Format for PDF', icon: 'file' },
        { id: 'format-kindle', label: 'Format for Kindle', icon: 'tablet' },
        { id: 'generate-cover', label: 'Generate Cover', icon: 'image' },
        { id: 'write-blurb', label: 'Write Book Blurb', icon: 'align-left' },
        { id: 'kdp-optimize', label: 'Amazon KDP Optimize', icon: 'trending-up' },
      ],
    },
  ],
  
  quickActions: [
    { id: 'start-novel', label: 'Start New Novel', icon: 'book', prompt: 'Help me start a new novel. Ask me about the genre, theme, and main characters.', color: '#8B5CF6' },
    { id: 'continue', label: 'Continue Writing', icon: 'arrow-right', prompt: 'Continue writing from where I left off. Maintain the same style and voice.', color: '#6366F1' },
    { id: 'create-outline', label: 'Create Outline', icon: 'list', prompt: 'Help me create a detailed book outline with chapters and plot points.', color: '#EC4899' },
    { id: 'edit-chapter', label: 'Edit Chapter', icon: 'edit', prompt: 'Review and edit my current chapter for grammar, style, and pacing.', color: '#10B981' },
  ],
  
  templates: [
    {
      id: 'novel-fiction',
      name: 'Novel (Fiction)',
      fields: [
        { name: 'title', label: 'Book Title', type: 'text' },
        { name: 'genre', label: 'Genre', type: 'select', options: ['Fantasy', 'Sci-Fi', 'Romance', 'Mystery', 'Thriller', 'Horror', 'Literary'] },
        { name: 'wordCount', label: 'Target Word Count', type: 'number', default: 80000 },
        { name: 'synopsis', label: 'Synopsis', type: 'textarea' },
        { name: 'protagonist', label: 'Main Character', type: 'text' },
        { name: 'setting', label: 'Setting', type: 'text' },
      ],
    },
    {
      id: 'nonfiction',
      name: 'Non-Fiction Book',
      fields: [
        { name: 'title', label: 'Book Title', type: 'text' },
        { name: 'topic', label: 'Main Topic', type: 'text' },
        { name: 'audience', label: 'Target Audience', type: 'text' },
        { name: 'chapters', label: 'Number of Chapters', type: 'number', default: 12 },
        { name: 'outline', label: 'Chapter Topics', type: 'textarea' },
      ],
    },
  ],
  
  outputTypes: [
    { id: 'manuscript', label: 'Manuscript (MD)', icon: 'file-text' },
    { id: 'epub', label: 'E-Book (ePub)', icon: 'book' },
    { id: 'pdf', label: 'PDF', icon: 'file' },
    { id: 'docx', label: 'Word Document', icon: 'file-text' },
  ],
};

// ============================================
// 2. CYBERSECURITY WORKSPACE
// ============================================
export const cybersecurityWorkspace: WorkspaceConfig = {
  id: 'cybersecurity',
  name: 'Cybersecurity Lab',
  icon: 'shield',
  description: 'Security assessment, red teaming, and compliance',
  color: '#EF4444', // Red
  
  agent: {
    id: 'security',
    model: 'glm-4.6-thinking',
    systemPrompt: `You are a cybersecurity expert specializing in:
- Vulnerability assessment
- Penetration testing methodology
- Security code review (SAST/DAST)
- Threat modeling
- Compliance auditing (PCI-DSS, HIPAA, SOC2, ISO27001)
- Incident response
- Security architecture review

Always operate ethically and within scope.
Document all findings with CVSS severity ratings.
Provide remediation recommendations with priority.
Use thinking mode for complex analysis.`,
    temperature: 0.2,
    maxIterations: 50,
    enableThinking: true,
  },
  
  tools: [
    { id: 'create_file', enabled: true },
    { id: 'search_web', enabled: true, description: 'Search CVE databases, security advisories' },
    { id: 'read_url', enabled: true, description: 'Analyze target URLs' },
    { id: 'run_command', enabled: true, description: 'Run security tools (simulated)' },
    { id: 'analyze_data', enabled: true, description: 'Analyze logs and findings' },
  ],
  
  menu: [
    {
      id: 'assessment',
      label: 'Security Assessment',
      icon: 'search',
      submenu: [
        { id: 'vuln-scan', label: 'Vulnerability Assessment', icon: 'bug' },
        { id: 'pentest', label: 'Penetration Test Plan', icon: 'target' },
        { id: 'code-review', label: 'Security Code Review', icon: 'code' },
        { id: 'config-audit', label: 'Configuration Audit', icon: 'settings' },
        { id: 'network-scan', label: 'Network Security Scan', icon: 'wifi' },
        { id: 'api-security', label: 'API Security Test', icon: 'server' },
      ],
    },
    {
      id: 'redteam',
      label: 'Red Team',
      icon: 'crosshair',
      submenu: [
        { id: 'recon', label: 'Reconnaissance (OSINT)', icon: 'eye' },
        { id: 'social-eng', label: 'Social Engineering', icon: 'users' },
        { id: 'phishing', label: 'Phishing Simulation', icon: 'mail' },
        { id: 'exploit-dev', label: 'Exploit Analysis', icon: 'terminal' },
        { id: 'post-exploit', label: 'Post-Exploitation', icon: 'key' },
        { id: 'report', label: 'Red Team Report', icon: 'file-text' },
      ],
    },
    {
      id: 'blueteam',
      label: 'Blue Team',
      icon: 'shield',
      submenu: [
        { id: 'log-analysis', label: 'Log Analysis', icon: 'file-search' },
        { id: 'threat-hunt', label: 'Threat Hunting', icon: 'search' },
        { id: 'incident-response', label: 'Incident Response', icon: 'alert-triangle' },
        { id: 'forensics', label: 'Digital Forensics', icon: 'hard-drive' },
        { id: 'malware-analysis', label: 'Malware Analysis', icon: 'bug' },
        { id: 'ioc-extraction', label: 'IOC Extraction', icon: 'database' },
      ],
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: 'clipboard-check',
      submenu: [
        { id: 'pci-dss', label: 'PCI-DSS Assessment', icon: 'credit-card' },
        { id: 'hipaa', label: 'HIPAA Compliance', icon: 'heart' },
        { id: 'soc2', label: 'SOC 2 Audit', icon: 'shield' },
        { id: 'iso27001', label: 'ISO 27001', icon: 'award' },
        { id: 'gdpr', label: 'GDPR Assessment', icon: 'lock' },
        { id: 'nist', label: 'NIST Framework', icon: 'layers' },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'file-text',
      submenu: [
        { id: 'executive-summary', label: 'Executive Summary', icon: 'briefcase' },
        { id: 'technical-report', label: 'Technical Report', icon: 'code' },
        { id: 'remediation-plan', label: 'Remediation Plan', icon: 'check-circle' },
        { id: 'risk-matrix', label: 'Risk Matrix', icon: 'grid' },
      ],
    },
  ],
  
  quickActions: [
    { id: 'vuln-assess', label: 'Vulnerability Assessment', icon: 'bug', prompt: 'Perform a vulnerability assessment. I will provide the target scope.', color: '#EF4444' },
    { id: 'code-review', label: 'Security Code Review', icon: 'code', prompt: 'Review my code for security vulnerabilities (OWASP Top 10).', color: '#F59E0B' },
    { id: 'threat-model', label: 'Threat Modeling', icon: 'crosshair', prompt: 'Help me create a threat model using STRIDE methodology.', color: '#8B5CF6' },
    { id: 'incident', label: 'Incident Response', icon: 'alert-triangle', prompt: 'Guide me through incident response steps for a potential breach.', color: '#EF4444' },
  ],
  
  templates: [
    {
      id: 'pentest-report',
      name: 'Penetration Test Report',
      fields: [
        { name: 'target', label: 'Target/Scope', type: 'text' },
        { name: 'type', label: 'Test Type', type: 'select', options: ['Web Application', 'Network', 'API', 'Mobile', 'Cloud'] },
        { name: 'methodology', label: 'Methodology', type: 'select', options: ['OWASP', 'PTES', 'OSSTMM', 'NIST'] },
        { name: 'scope', label: 'Detailed Scope', type: 'textarea' },
      ],
    },
    {
      id: 'compliance-audit',
      name: 'Compliance Audit',
      fields: [
        { name: 'framework', label: 'Framework', type: 'select', options: ['PCI-DSS', 'HIPAA', 'SOC 2', 'ISO 27001', 'GDPR'] },
        { name: 'organization', label: 'Organization', type: 'text' },
        { name: 'scope', label: 'Audit Scope', type: 'textarea' },
      ],
    },
  ],
  
  outputTypes: [
    { id: 'report', label: 'Security Report', icon: 'file-text' },
    { id: 'findings', label: 'Findings (JSON)', icon: 'code' },
    { id: 'remediation', label: 'Remediation Plan', icon: 'check-circle' },
    { id: 'executive', label: 'Executive Summary', icon: 'briefcase' },
  ],
};

// ============================================
// 3. SOFTWARE DEVELOPMENT WORKSPACE
// ============================================
export const softwareDevWorkspace: WorkspaceConfig = {
  id: 'software-dev',
  name: 'Code Studio',
  icon: 'code',
  description: 'Build full-stack applications',
  color: '#3B82F6', // Blue
  
  agent: {
    id: 'coder',
    model: 'glm-4.6',
    systemPrompt: `You are an expert full-stack developer. You can build:
- Web applications (React, Next.js, Vue, Svelte)
- Backend APIs (Node.js, Express, FastAPI)
- Mobile apps (React Native, Flutter concepts)
- Database schemas and queries
- DevOps configurations

Always:
- Write clean, maintainable code
- Include error handling
- Add comments for complex logic
- Write tests when appropriate
- Follow best practices`,
    temperature: 0.7,
    maxIterations: 50,
  },
  
  tools: [
    { id: 'create_file', enabled: true },
    { id: 'edit_file', enabled: true },
    { id: 'delete_file', enabled: true },
    { id: 'run_command', enabled: true },
    { id: 'install_package', enabled: true },
    { id: 'search_web', enabled: true },
    { id: 'read_url', enabled: true },
  ],
  
  menu: [
    {
      id: 'new-project',
      label: 'New Project',
      icon: 'plus',
      submenu: [
        { id: 'nextjs', label: 'Next.js App', icon: 'layout' },
        { id: 'react', label: 'React App', icon: 'code' },
        { id: 'vue', label: 'Vue App', icon: 'code' },
        { id: 'node-api', label: 'Node.js API', icon: 'server' },
        { id: 'express', label: 'Express Server', icon: 'server' },
        { id: 'fullstack', label: 'Full Stack (Next.js + API)', icon: 'layers' },
      ],
    },
    {
      id: 'generate',
      label: 'Generate',
      icon: 'sparkles',
      submenu: [
        { id: 'component', label: 'UI Component', icon: 'square' },
        { id: 'page', label: 'Page', icon: 'file' },
        { id: 'api-route', label: 'API Route', icon: 'server' },
        { id: 'hook', label: 'React Hook', icon: 'anchor' },
        { id: 'util', label: 'Utility Function', icon: 'tool' },
        { id: 'test', label: 'Unit Test', icon: 'check-circle' },
      ],
    },
    {
      id: 'refactor',
      label: 'Refactor',
      icon: 'refresh-cw',
      submenu: [
        { id: 'optimize', label: 'Optimize Code', icon: 'zap' },
        { id: 'typescript', label: 'Convert to TypeScript', icon: 'type' },
        { id: 'extract', label: 'Extract Component', icon: 'scissors' },
        { id: 'rename', label: 'Rename Symbol', icon: 'edit' },
        { id: 'cleanup', label: 'Code Cleanup', icon: 'trash' },
      ],
    },
    {
      id: 'debug',
      label: 'Debug',
      icon: 'bug',
      submenu: [
        { id: 'fix-error', label: 'Fix Error', icon: 'alert-circle' },
        { id: 'explain', label: 'Explain Code', icon: 'help-circle' },
        { id: 'trace', label: 'Trace Issue', icon: 'search' },
        { id: 'add-logs', label: 'Add Debug Logs', icon: 'file-text' },
      ],
    },
    {
      id: 'deploy',
      label: 'Deploy',
      icon: 'upload-cloud',
      submenu: [
        { id: 'vercel', label: 'Deploy to Vercel', icon: 'triangle' },
        { id: 'netlify', label: 'Deploy to Netlify', icon: 'globe' },
        { id: 'docker', label: 'Create Dockerfile', icon: 'box' },
        { id: 'github-actions', label: 'Setup CI/CD', icon: 'git-branch' },
      ],
    },
  ],
  
  quickActions: [
    { id: 'new-nextjs', label: 'New Next.js App', icon: 'plus', prompt: 'Create a new Next.js application with TypeScript and Tailwind CSS.', color: '#3B82F6' },
    { id: 'fix-bug', label: 'Fix Bug', icon: 'bug', prompt: 'Help me fix this bug. I will share the error message and code.', color: '#EF4444' },
    { id: 'add-feature', label: 'Add Feature', icon: 'sparkles', prompt: 'Help me add a new feature to my application.', color: '#10B981' },
    { id: 'review', label: 'Code Review', icon: 'eye', prompt: 'Review my code for best practices, performance, and security.', color: '#8B5CF6' },
  ],
  
  templates: [
    {
      id: 'nextjs-app',
      name: 'Next.js Application',
      fields: [
        { name: 'name', label: 'Project Name', type: 'text' },
        { name: 'description', label: 'Description', type: 'textarea' },
        { name: 'features', label: 'Features', type: 'textarea', placeholder: 'List features, one per line' },
        { name: 'auth', label: 'Authentication', type: 'select', options: ['None', 'NextAuth', 'Clerk', 'Custom'] },
        { name: 'database', label: 'Database', type: 'select', options: ['None', 'Prisma + PostgreSQL', 'Supabase', 'MongoDB'] },
      ],
    },
  ],
  
  outputTypes: [
    { id: 'code', label: 'Source Code', icon: 'code' },
    { id: 'preview', label: 'Live Preview', icon: 'eye' },
    { id: 'download', label: 'Download ZIP', icon: 'download' },
  ],
};

// ============================================
// 4. DATA ANALYSIS WORKSPACE
// ============================================
export const dataAnalysisWorkspace: WorkspaceConfig = {
  id: 'data-analysis',
  name: 'Data Lab',
  icon: 'bar-chart-2',
  description: 'Data analysis, visualization, and insights',
  color: '#10B981', // Green
  
  agent: {
    id: 'data',
    model: 'glm-4.6',
    systemPrompt: `You are a data analyst expert in:
- Statistical analysis
- Data visualization
- Pattern recognition
- Predictive modeling
- Report generation

Always:
- Clean and validate data first
- Use appropriate statistical methods
- Create clear visualizations
- Explain findings in plain language
- Provide actionable insights`,
    temperature: 0.3,
    maxIterations: 40,
  },
  
  tools: [
    { id: 'create_file', enabled: true },
    { id: 'analyze_data', enabled: true },
    { id: 'create_chart', enabled: true },
    { id: 'run_command', enabled: true },
    { id: 'search_web', enabled: true },
  ],
  
  menu: [
    {
      id: 'import',
      label: 'Import Data',
      icon: 'upload',
      submenu: [
        { id: 'csv', label: 'CSV File', icon: 'file' },
        { id: 'json', label: 'JSON File', icon: 'code' },
        { id: 'excel', label: 'Excel File', icon: 'table' },
        { id: 'api', label: 'From API', icon: 'globe' },
        { id: 'paste', label: 'Paste Data', icon: 'clipboard' },
      ],
    },
    {
      id: 'analyze',
      label: 'Analysis',
      icon: 'activity',
      submenu: [
        { id: 'summary', label: 'Summary Statistics', icon: 'hash' },
        { id: 'correlation', label: 'Correlation Analysis', icon: 'git-merge' },
        { id: 'regression', label: 'Regression Analysis', icon: 'trending-up' },
        { id: 'clustering', label: 'Clustering', icon: 'grid' },
        { id: 'timeseries', label: 'Time Series', icon: 'clock' },
        { id: 'anomaly', label: 'Anomaly Detection', icon: 'alert-circle' },
      ],
    },
    {
      id: 'visualize',
      label: 'Visualize',
      icon: 'pie-chart',
      submenu: [
        { id: 'bar', label: 'Bar Chart', icon: 'bar-chart-2' },
        { id: 'line', label: 'Line Chart', icon: 'trending-up' },
        { id: 'pie', label: 'Pie Chart', icon: 'pie-chart' },
        { id: 'scatter', label: 'Scatter Plot', icon: 'circle' },
        { id: 'heatmap', label: 'Heat Map', icon: 'grid' },
        { id: 'histogram', label: 'Histogram', icon: 'bar-chart' },
      ],
    },
    {
      id: 'report',
      label: 'Report',
      icon: 'file-text',
      submenu: [
        { id: 'insights', label: 'Generate Insights', icon: 'lightbulb' },
        { id: 'dashboard', label: 'Create Dashboard', icon: 'layout' },
        { id: 'export', label: 'Export Report', icon: 'download' },
      ],
    },
  ],
  
  quickActions: [
    { id: 'analyze', label: 'Analyze Data', icon: 'activity', prompt: 'Analyze my data and provide key insights.', color: '#10B981' },
    { id: 'visualize', label: 'Create Charts', icon: 'pie-chart', prompt: 'Create visualizations for my data.', color: '#3B82F6' },
    { id: 'predict', label: 'Predict Trends', icon: 'trending-up', prompt: 'Predict future trends based on my data.', color: '#8B5CF6' },
    { id: 'report', label: 'Generate Report', icon: 'file-text', prompt: 'Generate a comprehensive data analysis report.', color: '#F59E0B' },
  ],
  
  templates: [
    {
      id: 'data-report',
      name: 'Data Analysis Report',
      fields: [
        { name: 'title', label: 'Report Title', type: 'text' },
        { name: 'dataSource', label: 'Data Source', type: 'text' },
        { name: 'objectives', label: 'Analysis Objectives', type: 'textarea' },
        { name: 'metrics', label: 'Key Metrics', type: 'textarea' },
      ],
    },
  ],
  
  outputTypes: [
    { id: 'report', label: 'Analysis Report', icon: 'file-text' },
    { id: 'charts', label: 'Charts & Graphs', icon: 'pie-chart' },
    { id: 'data', label: 'Processed Data', icon: 'database' },
  ],
};

// ============================================
// 5. RESEARCH WORKSPACE
// ============================================
export const researchWorkspace: WorkspaceConfig = {
  id: 'research',
  name: 'Research Hub',
  icon: 'search',
  description: 'Academic and market research',
  color: '#6366F1', // Indigo
  
  agent: {
    id: 'researcher',
    model: 'glm-4.6-thinking',
    systemPrompt: `You are a thorough research assistant capable of:
- Academic research and literature review
- Market research and competitive analysis
- Technical research and documentation
- Fact-checking and verification
- Synthesizing information from multiple sources

Always:
- Cite your sources
- Distinguish facts from opinions
- Identify knowledge gaps
- Provide balanced perspectives
- Use thinking mode for complex analysis`,
    temperature: 0.3,
    maxIterations: 50,
    enableThinking: true,
  },
  
  tools: [
    { id: 'search_web', enabled: true },
    { id: 'read_url', enabled: true },
    { id: 'create_file', enabled: true },
    { id: 'analyze_data', enabled: true },
  ],
  
  menu: [
    {
      id: 'research-type',
      label: 'Research Type',
      icon: 'search',
      submenu: [
        { id: 'literature', label: 'Literature Review', icon: 'book' },
        { id: 'market', label: 'Market Research', icon: 'trending-up' },
        { id: 'competitor', label: 'Competitor Analysis', icon: 'users' },
        { id: 'technical', label: 'Technical Research', icon: 'cpu' },
        { id: 'user', label: 'User Research', icon: 'user' },
      ],
    },
    {
      id: 'sources',
      label: 'Sources',
      icon: 'globe',
      submenu: [
        { id: 'search-web', label: 'Web Search', icon: 'search' },
        { id: 'academic', label: 'Academic Papers', icon: 'graduation-cap' },
        { id: 'news', label: 'News Articles', icon: 'newspaper' },
        { id: 'patents', label: 'Patents', icon: 'file-text' },
      ],
    },
    {
      id: 'output',
      label: 'Output',
      icon: 'file-text',
      submenu: [
        { id: 'summary', label: 'Executive Summary', icon: 'align-left' },
        { id: 'full-report', label: 'Full Report', icon: 'file' },
        { id: 'presentation', label: 'Presentation', icon: 'monitor' },
        { id: 'bibliography', label: 'Bibliography', icon: 'list' },
      ],
    },
  ],
  
  quickActions: [
    { id: 'research', label: 'Start Research', icon: 'search', prompt: 'Help me research a topic. I will provide the subject and scope.', color: '#6366F1' },
    { id: 'summarize', label: 'Summarize Sources', icon: 'align-left', prompt: 'Summarize and synthesize information from multiple sources.', color: '#10B981' },
    { id: 'compare', label: 'Compare Options', icon: 'git-merge', prompt: 'Help me compare different options or solutions.', color: '#F59E0B' },
    { id: 'fact-check', label: 'Fact Check', icon: 'check-circle', prompt: 'Verify the accuracy of specific claims or information.', color: '#EF4444' },
  ],
  
  templates: [
    {
      id: 'market-research',
      name: 'Market Research',
      fields: [
        { name: 'market', label: 'Market/Industry', type: 'text' },
        { name: 'geography', label: 'Geographic Focus', type: 'text' },
        { name: 'questions', label: 'Research Questions', type: 'textarea' },
        { name: 'competitors', label: 'Known Competitors', type: 'textarea' },
      ],
    },
    {
      id: 'literature-review',
      name: 'Literature Review',
      fields: [
        { name: 'topic', label: 'Research Topic', type: 'text' },
        { name: 'scope', label: 'Scope', type: 'textarea' },
        { name: 'timeframe', label: 'Publication Timeframe', type: 'text' },
      ],
    },
  ],
  
  outputTypes: [
    { id: 'report', label: 'Research Report', icon: 'file-text' },
    { id: 'summary', label: 'Executive Summary', icon: 'align-left' },
    { id: 'sources', label: 'Source List', icon: 'list' },
  ],
};

// ============================================
// 6. CONTENT MARKETING WORKSPACE
// ============================================
export const contentMarketingWorkspace: WorkspaceConfig = {
  id: 'content-marketing',
  name: 'Content Studio',
  icon: 'edit-3',
  description: 'Blog posts, social media, and marketing content',
  color: '#EC4899', // Pink
  
  agent: {
    id: 'content',
    model: 'glm-4.6',
    systemPrompt: `You are a content marketing expert skilled in:
- Blog post writing
- Social media content
- Email marketing
- SEO optimization
- Copywriting
- Content strategy

Always:
- Write engaging, audience-focused content
- Optimize for SEO when relevant
- Include clear calls-to-action
- Maintain brand voice consistency`,
    temperature: 0.8,
    maxIterations: 40,
  },
  
  tools: [
    { id: 'create_file', enabled: true },
    { id: 'search_web', enabled: true },
    { id: 'generate_image', enabled: true },
    { id: 'analyze_data', enabled: true },
  ],
  
  menu: [
    {
      id: 'blog',
      label: 'Blog',
      icon: 'file-text',
      submenu: [
        { id: 'blog-post', label: 'Write Blog Post', icon: 'edit' },
        { id: 'listicle', label: 'Listicle', icon: 'list' },
        { id: 'how-to', label: 'How-To Guide', icon: 'help-circle' },
        { id: 'case-study', label: 'Case Study', icon: 'briefcase' },
        { id: 'pillar', label: 'Pillar Page', icon: 'columns' },
      ],
    },
    {
      id: 'social',
      label: 'Social Media',
      icon: 'share-2',
      submenu: [
        { id: 'twitter', label: 'Twitter/X Thread', icon: 'twitter' },
        { id: 'linkedin', label: 'LinkedIn Post', icon: 'linkedin' },
        { id: 'instagram', label: 'Instagram Caption', icon: 'instagram' },
        { id: 'facebook', label: 'Facebook Post', icon: 'facebook' },
        { id: 'calendar', label: 'Content Calendar', icon: 'calendar' },
      ],
    },
    {
      id: 'email',
      label: 'Email',
      icon: 'mail',
      submenu: [
        { id: 'newsletter', label: 'Newsletter', icon: 'send' },
        { id: 'drip', label: 'Drip Campaign', icon: 'droplet' },
        { id: 'welcome', label: 'Welcome Sequence', icon: 'user-plus' },
        { id: 'promo', label: 'Promotional Email', icon: 'tag' },
      ],
    },
    {
      id: 'seo',
      label: 'SEO',
      icon: 'search',
      submenu: [
        { id: 'keyword', label: 'Keyword Research', icon: 'key' },
        { id: 'meta', label: 'Meta Descriptions', icon: 'tag' },
        { id: 'optimize', label: 'Content Optimization', icon: 'trending-up' },
        { id: 'audit', label: 'Content Audit', icon: 'clipboard' },
      ],
    },
  ],
  
  quickActions: [
    { id: 'blog', label: 'Write Blog Post', icon: 'edit', prompt: 'Help me write a blog post. I will provide the topic and target keywords.', color: '#EC4899' },
    { id: 'social', label: 'Social Content', icon: 'share-2', prompt: 'Create social media content for multiple platforms.', color: '#3B82F6' },
    { id: 'email', label: 'Email Campaign', icon: 'mail', prompt: 'Write an email marketing campaign.', color: '#10B981' },
    { id: 'seo', label: 'SEO Optimize', icon: 'search', prompt: 'Optimize my content for SEO.', color: '#F59E0B' },
  ],
  
  templates: [
    {
      id: 'blog-post',
      name: 'SEO Blog Post',
      fields: [
        { name: 'title', label: 'Topic/Title', type: 'text' },
        { name: 'keywords', label: 'Target Keywords', type: 'text' },
        { name: 'audience', label: 'Target Audience', type: 'text' },
        { name: 'wordCount', label: 'Word Count', type: 'number', default: 1500 },
        { name: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Casual', 'Friendly', 'Authoritative'] },
      ],
    },
  ],
  
  outputTypes: [
    { id: 'article', label: 'Article/Post', icon: 'file-text' },
    { id: 'social', label: 'Social Posts', icon: 'share-2' },
    { id: 'images', label: 'Images', icon: 'image' },
  ],
};

// ============================================
// 7. HEALTHCARE WORKSPACE
// ============================================
export const healthcareWorkspace: WorkspaceConfig = {
  id: 'healthcare',
  name: 'Healthcare Assistant',
  icon: 'heart',
  description: 'Medical documentation and research',
  color: '#14B8A6', // Teal
  
  agent: {
    id: 'healthcare',
    model: 'glm-4.6-thinking',
    systemPrompt: `You are a healthcare documentation and research assistant.
You can help with:
- Medical documentation
- Clinical research summaries
- Patient education materials
- Healthcare compliance documentation
- Medical literature review

IMPORTANT: You provide informational support only. 
Always recommend consulting healthcare professionals for medical decisions.
Never provide direct medical advice or diagnoses.`,
    temperature: 0.3,
    maxIterations: 40,
    enableThinking: true,
  },
  
  tools: [
    { id: 'create_file', enabled: true },
    { id: 'search_web', enabled: true },
    { id: 'read_url', enabled: true },
    { id: 'analyze_data', enabled: true },
  ],
  
  menu: [
    {
      id: 'documentation',
      label: 'Documentation',
      icon: 'file-text',
      submenu: [
        { id: 'clinical-notes', label: 'Clinical Note Templates', icon: 'file' },
        { id: 'discharge', label: 'Discharge Summaries', icon: 'log-out' },
        { id: 'referral', label: 'Referral Letters', icon: 'send' },
        { id: 'consent', label: 'Consent Forms', icon: 'check-square' },
      ],
    },
    {
      id: 'education',
      label: 'Patient Education',
      icon: 'book-open',
      submenu: [
        { id: 'condition', label: 'Condition Explainers', icon: 'info' },
        { id: 'medication', label: 'Medication Guides', icon: 'pill' },
        { id: 'procedure', label: 'Procedure Prep', icon: 'clipboard' },
        { id: 'lifestyle', label: 'Lifestyle Guidance', icon: 'heart' },
      ],
    },
    {
      id: 'research',
      label: 'Research',
      icon: 'search',
      submenu: [
        { id: 'literature', label: 'Literature Review', icon: 'book' },
        { id: 'clinical-trial', label: 'Clinical Trial Info', icon: 'flask' },
        { id: 'drug-info', label: 'Drug Information', icon: 'pill' },
        { id: 'guidelines', label: 'Clinical Guidelines', icon: 'file-text' },
      ],
    },
  ],
  
  quickActions: [
    { id: 'document', label: 'Create Document', icon: 'file-text', prompt: 'Help me create medical documentation.', color: '#14B8A6' },
    { id: 'patient-ed', label: 'Patient Education', icon: 'book-open', prompt: 'Create patient education material about a condition or treatment.', color: '#3B82F6' },
    { id: 'research', label: 'Research Topic', icon: 'search', prompt: 'Research a medical topic from current literature.', color: '#8B5CF6' },
  ],
  
  templates: [],
  outputTypes: [
    { id: 'document', label: 'Document', icon: 'file-text' },
    { id: 'education', label: 'Education Material', icon: 'book-open' },
  ],
};

// ============================================
// 8. LEGAL WORKSPACE
// ============================================
export const legalWorkspace: WorkspaceConfig = {
  id: 'legal',
  name: 'Legal Assistant',
  icon: 'scale',
  description: 'Legal document drafting and research',
  color: '#78716C', // Stone
  
  agent: {
    id: 'legal',
    model: 'glm-4.6-thinking',
    systemPrompt: `You are a legal research and documentation assistant.
You can help with:
- Legal document drafting
- Contract analysis
- Legal research
- Compliance documentation
- Policy writing

DISCLAIMER: You provide legal information, not legal advice.
Always recommend consulting a licensed attorney for legal decisions.`,
    temperature: 0.2,
    maxIterations: 40,
    enableThinking: true,
  },
  
  tools: [
    { id: 'create_file', enabled: true },
    { id: 'search_web', enabled: true },
    { id: 'read_url', enabled: true },
    { id: 'analyze_data', enabled: true },
  ],
  
  menu: [
    {
      id: 'contracts',
      label: 'Contracts',
      icon: 'file-signature',
      submenu: [
        { id: 'nda', label: 'NDA', icon: 'lock' },
        { id: 'service', label: 'Service Agreement', icon: 'handshake' },
        { id: 'employment', label: 'Employment Contract', icon: 'user' },
        { id: 'license', label: 'License Agreement', icon: 'key' },
        { id: 'review', label: 'Contract Review', icon: 'eye' },
      ],
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: 'shield',
      submenu: [
        { id: 'privacy', label: 'Privacy Policy', icon: 'lock' },
        { id: 'terms', label: 'Terms of Service', icon: 'file-text' },
        { id: 'gdpr', label: 'GDPR Compliance', icon: 'globe' },
        { id: 'policy', label: 'Company Policies', icon: 'clipboard' },
      ],
    },
    {
      id: 'research',
      label: 'Research',
      icon: 'search',
      submenu: [
        { id: 'case-law', label: 'Case Law Research', icon: 'book' },
        { id: 'statute', label: 'Statute Analysis', icon: 'file' },
        { id: 'regulatory', label: 'Regulatory Research', icon: 'shield' },
      ],
    },
  ],
  
  quickActions: [
    { id: 'contract', label: 'Draft Contract', icon: 'file-signature', prompt: 'Help me draft a contract or legal document.', color: '#78716C' },
    { id: 'review', label: 'Review Document', icon: 'eye', prompt: 'Review a legal document for potential issues.', color: '#3B82F6' },
    { id: 'policy', label: 'Write Policy', icon: 'clipboard', prompt: 'Help me write a company policy or compliance document.', color: '#10B981' },
  ],
  
  templates: [],
  outputTypes: [
    { id: 'document', label: 'Legal Document', icon: 'file-text' },
    { id: 'analysis', label: 'Analysis', icon: 'eye' },
  ],
};

// ============================================
// MASTER WORKSPACE REGISTRY
// ============================================
export const workspaceConfigs: Record<string, WorkspaceConfig> = {
  'book-writing': bookWritingWorkspace,
  'cybersecurity': cybersecurityWorkspace,
  'software-dev': softwareDevWorkspace,
  'data-analysis': dataAnalysisWorkspace,
  'research': researchWorkspace,
  'content-marketing': contentMarketingWorkspace,
  'healthcare': healthcareWorkspace,
  'legal': legalWorkspace,
};

// ============================================
// WORKSPACE CATEGORIES FOR MAIN MENU
// ============================================
export const workspaceCategories = [
  {
    id: 'creative',
    name: 'Creative',
    icon: 'palette',
    workspaces: ['book-writing', 'content-marketing'],
  },
  {
    id: 'technical',
    name: 'Technical',
    icon: 'code',
    workspaces: ['software-dev', 'cybersecurity'],
  },
  {
    id: 'business',
    name: 'Business',
    icon: 'briefcase',
    workspaces: ['data-analysis', 'research'],
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: 'award',
    workspaces: ['healthcare', 'legal'],
  },
];

// Alias for backward compatibility
export const workspaces = workspaceConfigs;
