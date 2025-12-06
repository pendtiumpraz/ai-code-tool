// ============================================
// TOOL REGISTRY - All Available Tools
// ============================================

export type ToolCategory = 
  | 'file'
  | 'code'
  | 'web'
  | 'security'
  | 'data'
  | 'ai'
  | 'communication'
  | 'utility';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
  enum?: string[];
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  
  // For AI model
  parameters: ToolParameter[];
  
  // Execution
  handler: string;  // Handler function name
  
  // Limits & Costs
  tokenCost: number;      // Tokens consumed per call
  timeout: number;        // Max execution time (ms)
  rateLimit?: number;     // Max calls per minute
  
  // Requirements
  requiresAuth: boolean;
  requiredScopes?: string[];  // e.g., ['google_drive']
  minPlan?: string;           // Minimum plan required
  
  // Workspace restrictions
  workspaces?: string[];  // If set, only available in these workspaces
}

// ============================================
// TOOL DEFINITIONS
// ============================================

export const TOOLS: Record<string, ToolDefinition> = {
  // ==========================================
  // FILE OPERATIONS
  // ==========================================
  
  'file_read': {
    id: 'file_read',
    name: 'Read File',
    description: 'Read contents of a file from Google Drive',
    category: 'file',
    parameters: [
      { name: 'path', type: 'string', description: 'File path to read', required: true },
    ],
    handler: 'handleFileRead',
    tokenCost: 10,
    timeout: 30000,
    requiresAuth: true,
    requiredScopes: ['google_drive'],
  },
  
  'file_write': {
    id: 'file_write',
    name: 'Write File',
    description: 'Create or update a file in Google Drive',
    category: 'file',
    parameters: [
      { name: 'path', type: 'string', description: 'File path to write', required: true },
      { name: 'content', type: 'string', description: 'File content', required: true },
      { name: 'overwrite', type: 'boolean', description: 'Overwrite if exists', required: false, default: true },
    ],
    handler: 'handleFileWrite',
    tokenCost: 15,
    timeout: 60000,
    requiresAuth: true,
    requiredScopes: ['google_drive'],
  },
  
  'create_file': {
    id: 'create_file',
    name: 'Create File',
    description: 'Create a new file with the given content. Use this when generating code or creating any files.',
    category: 'file',
    parameters: [
      { name: 'path', type: 'string', description: 'File path (e.g., /src/app.js)', required: true },
      { name: 'content', type: 'string', description: 'File content to write', required: true },
    ],
    handler: 'handleCreateFile',
    tokenCost: 10,
    timeout: 30000,
    requiresAuth: false,
  },
  
  'file_delete': {
    id: 'file_delete',
    name: 'Delete File',
    description: 'Delete a file or folder from Google Drive',
    category: 'file',
    parameters: [
      { name: 'path', type: 'string', description: 'File path to delete', required: true },
    ],
    handler: 'handleFileDelete',
    tokenCost: 10,
    timeout: 30000,
    requiresAuth: true,
    requiredScopes: ['google_drive'],
  },
  
  'file_list': {
    id: 'file_list',
    name: 'List Files',
    description: 'List files in a directory',
    category: 'file',
    parameters: [
      { name: 'path', type: 'string', description: 'Directory path', required: false, default: '/' },
      { name: 'recursive', type: 'boolean', description: 'List recursively', required: false, default: false },
    ],
    handler: 'handleFileList',
    tokenCost: 10,
    timeout: 30000,
    requiresAuth: true,
    requiredScopes: ['google_drive'],
  },
  
  'file_search': {
    id: 'file_search',
    name: 'Search Files',
    description: 'Search files by name or content',
    category: 'file',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query', required: true },
      { name: 'path', type: 'string', description: 'Directory to search in', required: false },
    ],
    handler: 'handleFileSearch',
    tokenCost: 20,
    timeout: 60000,
    requiresAuth: true,
    requiredScopes: ['google_drive'],
  },

  // ==========================================
  // CODE EXECUTION
  // ==========================================
  
  'code_execute': {
    id: 'code_execute',
    name: 'Execute Code',
    description: 'Execute code in WebContainer (JavaScript/TypeScript/Python)',
    category: 'code',
    parameters: [
      { name: 'code', type: 'string', description: 'Code to execute', required: true },
      { name: 'language', type: 'string', description: 'Programming language', required: true, enum: ['javascript', 'typescript', 'python', 'bash'] },
      { name: 'timeout', type: 'number', description: 'Execution timeout (ms)', required: false, default: 30000 },
    ],
    handler: 'handleCodeExecute',
    tokenCost: 100,
    timeout: 60000,
    requiresAuth: true,
    minPlan: 'starter',
  },
  
  'code_analyze': {
    id: 'code_analyze',
    name: 'Analyze Code',
    description: 'Analyze code for issues, complexity, and suggestions',
    category: 'code',
    parameters: [
      { name: 'code', type: 'string', description: 'Code to analyze', required: true },
      { name: 'language', type: 'string', description: 'Programming language', required: true },
    ],
    handler: 'handleCodeAnalyze',
    tokenCost: 50,
    timeout: 30000,
    requiresAuth: true,
  },
  
  'code_format': {
    id: 'code_format',
    name: 'Format Code',
    description: 'Format code according to language standards',
    category: 'code',
    parameters: [
      { name: 'code', type: 'string', description: 'Code to format', required: true },
      { name: 'language', type: 'string', description: 'Programming language', required: true },
    ],
    handler: 'handleCodeFormat',
    tokenCost: 20,
    timeout: 15000,
    requiresAuth: true,
  },

  // ==========================================
  // WEB OPERATIONS
  // ==========================================
  
  'web_search': {
    id: 'web_search',
    name: 'Web Search',
    description: 'Search the web for information',
    category: 'web',
    parameters: [
      { name: 'query', type: 'string', description: 'Search query', required: true },
      { name: 'num_results', type: 'number', description: 'Number of results', required: false, default: 5 },
    ],
    handler: 'handleWebSearch',
    tokenCost: 50,
    timeout: 30000,
    rateLimit: 10,
    requiresAuth: true,
  },
  
  'web_scrape': {
    id: 'web_scrape',
    name: 'Scrape Webpage',
    description: 'Extract content from a webpage',
    category: 'web',
    parameters: [
      { name: 'url', type: 'string', description: 'URL to scrape', required: true },
      { name: 'selector', type: 'string', description: 'CSS selector (optional)', required: false },
    ],
    handler: 'handleWebScrape',
    tokenCost: 30,
    timeout: 30000,
    rateLimit: 5,
    requiresAuth: true,
    minPlan: 'starter',
  },
  
  'web_fetch': {
    id: 'web_fetch',
    name: 'Fetch URL',
    description: 'Fetch data from a URL (API call)',
    category: 'web',
    parameters: [
      { name: 'url', type: 'string', description: 'URL to fetch', required: true },
      { name: 'method', type: 'string', description: 'HTTP method', required: false, default: 'GET', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
      { name: 'headers', type: 'object', description: 'Request headers', required: false },
      { name: 'body', type: 'string', description: 'Request body', required: false },
    ],
    handler: 'handleWebFetch',
    tokenCost: 20,
    timeout: 30000,
    requiresAuth: true,
  },

  // ==========================================
  // SECURITY TOOLS
  // ==========================================
  
  'security_scan': {
    id: 'security_scan',
    name: 'Security Scan',
    description: 'Scan a website for security vulnerabilities including headers, SSL, exposed files, and more',
    category: 'security',
    parameters: [
      { name: 'target', type: 'string', description: 'URL to scan (must start with http:// or https://)', required: true },
      { name: 'scan_type', type: 'string', description: 'Type of scan', required: true, enum: ['web', 'code', 'api', 'config'] },
      { name: 'depth', type: 'string', description: 'Scan depth', required: false, default: 'normal', enum: ['quick', 'normal', 'deep'] },
    ],
    handler: 'handleSecurityScan',
    tokenCost: 50,
    timeout: 120000,  // 2 minutes
    requiresAuth: false,  // Allow without auth for testing
    workspaces: ['cybersecurity'],
  },
  
  'security_cvss': {
    id: 'security_cvss',
    name: 'Calculate CVSS Score',
    description: 'Calculate CVSS 3.1 score for a vulnerability',
    category: 'security',
    parameters: [
      { name: 'vector', type: 'string', description: 'CVSS vector string or metrics object', required: true },
    ],
    handler: 'handleSecurityCVSS',
    tokenCost: 10,
    timeout: 5000,
    requiresAuth: true,
    workspaces: ['cybersecurity'],
  },
  
  'security_report': {
    id: 'security_report',
    name: 'Generate Security Report',
    description: 'Generate a security assessment report in Markdown',
    category: 'security',
    parameters: [
      { name: 'vulnerabilities', type: 'string', description: 'JSON array of vulnerabilities, e.g., [{"title":"XSS","severity":"high"}]', required: true },
      { name: 'format', type: 'string', description: 'Report format', required: false, default: 'markdown', enum: ['markdown', 'html', 'pdf'] },
      { name: 'include_remediation', type: 'boolean', description: 'Include remediation steps', required: false, default: true },
    ],
    handler: 'handleSecurityReport',
    tokenCost: 100,
    timeout: 60000,
    requiresAuth: true,
    minPlan: 'starter',
    workspaces: ['cybersecurity'],
  },
  
  'social_engineering_campaign': {
    id: 'social_engineering_campaign',
    name: 'Social Engineering Campaign',
    description: 'Create and manage social engineering awareness campaigns',
    category: 'security',
    parameters: [
      { name: 'action', type: 'string', description: 'Action to perform', required: true, enum: ['create', 'start', 'pause', 'results', 'report'] },
      { name: 'campaign_type', type: 'string', description: 'Type of campaign', required: false, enum: ['phishing', 'vishing', 'smishing', 'pretexting', 'baiting'] },
      { name: 'campaign_id', type: 'string', description: 'Campaign ID (for existing campaigns)', required: false },
      { name: 'config', type: 'object', description: 'Campaign configuration', required: false },
    ],
    handler: 'handleSocialEngineeringCampaign',
    tokenCost: 150,
    timeout: 120000,
    requiresAuth: true,
    minPlan: 'pro',
    workspaces: ['cybersecurity'],
  },

  'subdomain_finder': {
    id: 'subdomain_finder',
    name: 'Subdomain Finder',
    description: 'Find subdomains for a given domain using DNS enumeration',
    category: 'security',
    parameters: [
      { name: 'domain', type: 'string', description: 'Target domain (e.g., example.com)', required: true },
    ],
    handler: 'handleSubdomainFinder',
    tokenCost: 30,
    timeout: 120000,
    requiresAuth: true,
    workspaces: ['cybersecurity'],
  },

  'port_scanner': {
    id: 'port_scanner',
    name: 'Port Scanner',
    description: 'Scan common ports on a target host',
    category: 'security',
    parameters: [
      { name: 'target', type: 'string', description: 'Target hostname or IP', required: true },
      { name: 'ports', type: 'string', description: 'Comma-separated list of ports to scan (optional, e.g., "22,80,443")', required: false },
    ],
    handler: 'handlePortScanner',
    tokenCost: 40,
    timeout: 60000,
    requiresAuth: true,
    workspaces: ['cybersecurity'],
  },

  'whois_lookup': {
    id: 'whois_lookup',
    name: 'WHOIS Lookup',
    description: 'Get WHOIS information for a domain',
    category: 'security',
    parameters: [
      { name: 'domain', type: 'string', description: 'Domain to lookup', required: true },
    ],
    handler: 'handleWhoisLookup',
    tokenCost: 15,
    timeout: 30000,
    requiresAuth: true,
    workspaces: ['cybersecurity'],
  },

  'dns_lookup': {
    id: 'dns_lookup',
    name: 'DNS Lookup',
    description: 'Get DNS records for a domain (A, AAAA, MX, NS, TXT, CNAME)',
    category: 'security',
    parameters: [
      { name: 'domain', type: 'string', description: 'Domain to lookup', required: true },
      { name: 'record_type', type: 'string', description: 'DNS record type', required: false, default: 'ALL', enum: ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'ALL'] },
    ],
    handler: 'handleDnsLookup',
    tokenCost: 10,
    timeout: 15000,
    requiresAuth: true,
    workspaces: ['cybersecurity'],
  },

  'hash_generator': {
    id: 'hash_generator',
    name: 'Hash Generator',
    description: 'Generate cryptographic hashes (MD5, SHA1, SHA256, SHA512)',
    category: 'security',
    parameters: [
      { name: 'input', type: 'string', description: 'Text to hash', required: true },
      { name: 'algorithm', type: 'string', description: 'Hash algorithm', required: false, default: 'all', enum: ['md5', 'sha1', 'sha256', 'sha512', 'all'] },
    ],
    handler: 'handleHashGenerator',
    tokenCost: 5,
    timeout: 5000,
    requiresAuth: true,
    workspaces: ['cybersecurity'],
  },

  'encoder_decoder': {
    id: 'encoder_decoder',
    name: 'Encoder/Decoder',
    description: 'Encode or decode data (Base64, URL, HTML, Hex, Unicode)',
    category: 'security',
    parameters: [
      { name: 'input', type: 'string', description: 'Text to encode/decode', required: true },
      { name: 'operation', type: 'string', description: 'Operation to perform', required: true, enum: ['base64-encode', 'base64-decode', 'url-encode', 'url-decode', 'html-encode', 'html-decode', 'hex-encode', 'hex-decode', 'rot13'] },
    ],
    handler: 'handleEncoderDecoder',
    tokenCost: 5,
    timeout: 5000,
    requiresAuth: true,
    workspaces: ['cybersecurity'],
  },

  'password_generator': {
    id: 'password_generator',
    name: 'Password Generator',
    description: 'Generate secure random passwords',
    category: 'security',
    parameters: [
      { name: 'length', type: 'number', description: 'Password length', required: false, default: 16 },
      { name: 'uppercase', type: 'boolean', description: 'Include uppercase letters', required: false, default: true },
      { name: 'numbers', type: 'boolean', description: 'Include numbers', required: false, default: true },
      { name: 'symbols', type: 'boolean', description: 'Include symbols', required: false, default: true },
    ],
    handler: 'handlePasswordGenerator',
    tokenCost: 5,
    timeout: 5000,
    requiresAuth: true,
    workspaces: ['cybersecurity'],
  },

  'jwt_decoder': {
    id: 'jwt_decoder',
    name: 'JWT Decoder',
    description: 'Decode and analyze JWT tokens',
    category: 'security',
    parameters: [
      { name: 'token', type: 'string', description: 'JWT token to decode', required: true },
    ],
    handler: 'handleJwtDecoder',
    tokenCost: 5,
    timeout: 5000,
    requiresAuth: true,
    workspaces: ['cybersecurity'],
  },

  // ==========================================
  // DATA ANALYSIS
  // ==========================================
  
  'data_analyze': {
    id: 'data_analyze',
    name: 'Analyze Data',
    description: 'Analyze data from CSV, JSON, or other formats',
    category: 'data',
    parameters: [
      { name: 'data', type: 'string', description: 'Data to analyze (or file path)', required: true },
      { name: 'analysis_type', type: 'string', description: 'Type of analysis', required: false, default: 'summary', enum: ['summary', 'statistics', 'correlation', 'trends'] },
    ],
    handler: 'handleDataAnalyze',
    tokenCost: 80,
    timeout: 60000,
    requiresAuth: true,
    workspaces: ['data-analysis', 'research'],
  },
  
  'data_visualize': {
    id: 'data_visualize',
    name: 'Visualize Data',
    description: 'Create charts and visualizations from data',
    category: 'data',
    parameters: [
      { name: 'data', type: 'string', description: 'Data to visualize', required: true },
      { name: 'chart_type', type: 'string', description: 'Type of chart', required: true, enum: ['bar', 'line', 'pie', 'scatter', 'heatmap', 'histogram'] },
      { name: 'options', type: 'object', description: 'Chart options', required: false },
    ],
    handler: 'handleDataVisualize',
    tokenCost: 60,
    timeout: 30000,
    requiresAuth: true,
    workspaces: ['data-analysis', 'research'],
  },

  // ==========================================
  // AI GENERATION
  // ==========================================
  
  'ai_generate_image': {
    id: 'ai_generate_image',
    name: 'Generate Image',
    description: 'Generate an image using AI',
    category: 'ai',
    parameters: [
      { name: 'prompt', type: 'string', description: 'Image description', required: true },
      { name: 'size', type: 'string', description: 'Image size', required: false, default: '1024x1024', enum: ['256x256', '512x512', '1024x1024'] },
      { name: 'style', type: 'string', description: 'Image style', required: false, enum: ['realistic', 'artistic', 'cartoon', '3d'] },
    ],
    handler: 'handleAIGenerateImage',
    tokenCost: 500,
    timeout: 120000,
    requiresAuth: true,
    minPlan: 'pro',
  },
  
  'ai_summarize': {
    id: 'ai_summarize',
    name: 'Summarize Text',
    description: 'Summarize long text or documents',
    category: 'ai',
    parameters: [
      { name: 'text', type: 'string', description: 'Text to summarize', required: true },
      { name: 'length', type: 'string', description: 'Summary length', required: false, default: 'medium', enum: ['short', 'medium', 'long'] },
    ],
    handler: 'handleAISummarize',
    tokenCost: 40,
    timeout: 30000,
    requiresAuth: true,
  },
  
  'ai_translate': {
    id: 'ai_translate',
    name: 'Translate Text',
    description: 'Translate text to another language',
    category: 'ai',
    parameters: [
      { name: 'text', type: 'string', description: 'Text to translate', required: true },
      { name: 'target_language', type: 'string', description: 'Target language', required: true },
      { name: 'source_language', type: 'string', description: 'Source language (auto-detect if not specified)', required: false },
    ],
    handler: 'handleAITranslate',
    tokenCost: 30,
    timeout: 30000,
    requiresAuth: true,
  },

  // ==========================================
  // UTILITY TOOLS
  // ==========================================
  
  'util_datetime': {
    id: 'util_datetime',
    name: 'Date/Time Operations',
    description: 'Perform date and time calculations',
    category: 'utility',
    parameters: [
      { name: 'operation', type: 'string', description: 'Operation to perform', required: true, enum: ['now', 'format', 'parse', 'diff', 'add', 'subtract'] },
      { name: 'date', type: 'string', description: 'Date string', required: false },
      { name: 'format', type: 'string', description: 'Date format', required: false },
      { name: 'timezone', type: 'string', description: 'Timezone', required: false },
    ],
    handler: 'handleUtilDatetime',
    tokenCost: 5,
    timeout: 5000,
    requiresAuth: false,
  },
  
  'util_json': {
    id: 'util_json',
    name: 'JSON Operations',
    description: 'Parse, format, or transform JSON data',
    category: 'utility',
    parameters: [
      { name: 'operation', type: 'string', description: 'Operation to perform', required: true, enum: ['parse', 'stringify', 'format', 'validate', 'query'] },
      { name: 'data', type: 'string', description: 'JSON data', required: true },
      { name: 'query', type: 'string', description: 'JSONPath query (for query operation)', required: false },
    ],
    handler: 'handleUtilJson',
    tokenCost: 5,
    timeout: 5000,
    requiresAuth: false,
  },
  
  'util_hash': {
    id: 'util_hash',
    name: 'Hash/Encode',
    description: 'Hash or encode data',
    category: 'utility',
    parameters: [
      { name: 'operation', type: 'string', description: 'Operation', required: true, enum: ['md5', 'sha256', 'sha512', 'base64_encode', 'base64_decode', 'url_encode', 'url_decode'] },
      { name: 'data', type: 'string', description: 'Data to process', required: true },
    ],
    handler: 'handleUtilHash',
    tokenCost: 5,
    timeout: 5000,
    requiresAuth: false,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOLS[id];
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return Object.values(TOOLS).filter(t => t.category === category);
}

export function getToolsForWorkspace(workspace: string): ToolDefinition[] {
  return Object.values(TOOLS).filter(t => 
    !t.workspaces || t.workspaces.includes(workspace)
  );
}

export function getToolsForPlan(planName: string): ToolDefinition[] {
  const planOrder = ['free', 'starter', 'pro', 'business', 'enterprise'];
  const planIndex = planOrder.indexOf(planName);
  
  return Object.values(TOOLS).filter(t => {
    if (!t.minPlan) return true;
    const toolPlanIndex = planOrder.indexOf(t.minPlan);
    return planIndex >= toolPlanIndex;
  });
}

// Convert tools to OpenAI function format
export function getToolsAsOpenAIFunctions(): any[] {
  return Object.values(TOOLS).map(tool => ({
    type: 'function',
    function: {
      name: tool.id,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters.reduce((acc, param) => {
          acc[param.name] = {
            type: param.type,
            description: param.description,
            ...(param.enum ? { enum: param.enum } : {}),
            ...(param.default !== undefined ? { default: param.default } : {}),
          };
          return acc;
        }, {} as Record<string, any>),
        required: tool.parameters.filter(p => p.required).map(p => p.name),
      },
    },
  }));
}

// Get filtered tools as OpenAI functions
export function getFilteredToolsAsOpenAI(
  workspace?: string,
  planName?: string
): any[] {
  let tools = Object.values(TOOLS);
  
  if (workspace) {
    tools = tools.filter(t => !t.workspaces || t.workspaces.includes(workspace));
  }
  
  if (planName) {
    const planOrder = ['free', 'starter', 'pro', 'business', 'enterprise'];
    const planIndex = planOrder.indexOf(planName);
    tools = tools.filter(t => {
      if (!t.minPlan) return true;
      return planIndex >= planOrder.indexOf(t.minPlan);
    });
  }
  
  return tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.id,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters.reduce((acc, param) => {
          acc[param.name] = {
            type: param.type,
            description: param.description,
            ...(param.enum ? { enum: param.enum } : {}),
          };
          return acc;
        }, {} as Record<string, any>),
        required: tool.parameters.filter(p => p.required).map(p => p.name),
      },
    },
  }));
}

export default TOOLS;
