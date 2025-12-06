'use client';

import { useState } from 'react';
import { 
  Globe, Network, Search, Database, Hash, Key, Lock, 
  Calculator, Shield, Loader2, AlertTriangle, CheckCircle,
  Copy, Download, RefreshCw, X
} from 'lucide-react';

interface SecurityToolsPanelProps {
  tool: string;
  onClose: () => void;
}

export function SecurityToolsPanel({ tool, onClose }: SecurityToolsPanelProps) {
  const [input, setInput] = useState('');
  const [options, setOptions] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const toolConfig: Record<string, { 
    title: string; 
    icon: any; 
    color: string;
    placeholder: string;
    api: string;
    apiTool: string;
    description: string;
  }> = {
    // Reconnaissance Tools
    'subdomain-finder': {
      title: 'Subdomain Finder',
      icon: Globe,
      color: 'text-blue-400',
      placeholder: 'example.com',
      api: '/api/security/recon',
      apiTool: 'subdomain-finder',
      description: 'Find subdomains using DNS enumeration',
    },
    'port-scanner': {
      title: 'Port Scanner',
      icon: Network,
      color: 'text-green-400',
      placeholder: 'example.com or IP address',
      api: '/api/security/recon',
      apiTool: 'port-scanner',
      description: 'Scan common ports on target',
    },
    'whois-lookup': {
      title: 'WHOIS Lookup',
      icon: Search,
      color: 'text-purple-400',
      placeholder: 'example.com',
      api: '/api/security/recon',
      apiTool: 'whois-lookup',
      description: 'Get domain registration information',
    },
    'dns-lookup': {
      title: 'DNS Lookup',
      icon: Database,
      color: 'text-cyan-400',
      placeholder: 'example.com',
      api: '/api/security/recon',
      apiTool: 'dns-lookup',
      description: 'Query DNS records (A, AAAA, MX, NS, TXT)',
    },
    'ip-lookup': {
      title: 'IP Reputation',
      icon: Shield,
      color: 'text-orange-400',
      placeholder: '8.8.8.8 or example.com',
      api: '/api/security/recon',
      apiTool: 'ip-lookup',
      description: 'Check IP geolocation and reputation',
    },
    'shodan-search': {
      title: 'Shodan Search',
      icon: Globe,
      color: 'text-red-400',
      placeholder: 'IP address or search query',
      api: '/api/security/recon',
      apiTool: 'shodan-search',
      description: 'Search Shodan for exposed services',
    },
    // Vulnerability Tools
    'cve-lookup': {
      title: 'CVE Lookup',
      icon: Shield,
      color: 'text-red-400',
      placeholder: 'CVE-2024-1234 or keyword',
      api: '/api/security/tools',
      apiTool: 'cve-lookup',
      description: 'Search CVE database for vulnerabilities',
    },
    'virustotal-scan': {
      title: 'VirusTotal Scan',
      icon: Shield,
      color: 'text-blue-400',
      placeholder: 'URL, domain, or file hash',
      api: '/api/security/tools',
      apiTool: 'virustotal-scan',
      description: 'Scan URLs/files with VirusTotal',
    },
    'security-headers': {
      title: 'Security Headers',
      icon: Shield,
      color: 'text-green-400',
      placeholder: 'https://example.com',
      api: '/api/security/tools',
      apiTool: 'security-headers',
      description: 'Analyze HTTP security headers',
    },
    // Utility Tools
    'hash-generator': {
      title: 'Hash Generator',
      icon: Hash,
      color: 'text-yellow-400',
      placeholder: 'Text to hash',
      api: '/api/security/tools',
      apiTool: 'hash-generator',
      description: 'Generate MD5, SHA1, SHA256, SHA512 hashes',
    },
    'encoder-decoder': {
      title: 'Encoder/Decoder',
      icon: Key,
      color: 'text-pink-400',
      placeholder: 'Text to encode/decode',
      api: '/api/security/tools',
      apiTool: 'encoder-decoder',
      description: 'Base64, URL, HTML, Hex encoding/decoding',
    },
    'password-generator': {
      title: 'Password Generator',
      icon: Lock,
      color: 'text-green-400',
      placeholder: '',
      api: '/api/security/tools',
      apiTool: 'password-generator',
      description: 'Generate secure random passwords',
    },
    'jwt-decoder': {
      title: 'JWT Decoder',
      icon: Key,
      color: 'text-purple-400',
      placeholder: 'eyJhbGciOiJIUzI1NiIs...',
      api: '/api/security/tools',
      apiTool: 'jwt-decoder',
      description: 'Decode and analyze JWT tokens',
    },
    // Report tools (placeholder - these don't have API calls yet)
    'scan-history': {
      title: 'Scan History',
      icon: Search,
      color: 'text-blue-400',
      placeholder: '',
      api: '',
      apiTool: 'scan-history',
      description: 'View past scan results',
    },
    'generate-report': {
      title: 'Generate Report',
      icon: Shield,
      color: 'text-green-400',
      placeholder: '',
      api: '',
      apiTool: 'generate-report',
      description: 'Create security assessment reports',
    },
    'report-templates': {
      title: 'Report Templates',
      icon: Key,
      color: 'text-purple-400',
      placeholder: '',
      api: '',
      apiTool: 'report-templates',
      description: 'Manage report templates',
    },
  };

  const config = toolConfig[tool];
  
  // Handle report tools with placeholder UI
  if (tool === 'scan-history' || tool === 'generate-report' || tool === 'report-templates') {
    return (
      <div className="h-full flex flex-col bg-gray-900">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gray-800 ${config?.color || 'text-gray-400'}`}>
              {config?.icon && <config.icon className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-semibold">{config?.title || tool}</h2>
              <p className="text-sm text-gray-500">{config?.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
              {config?.icon && <config.icon className="w-8 h-8 text-gray-500" />}
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">Coming Soon</h3>
            <p className="text-gray-500 max-w-md">
              {tool === 'scan-history' && 'Scan history will show all your past security scans and their results.'}
              {tool === 'generate-report' && 'Generate comprehensive security assessment reports from your scan data.'}
              {tool === 'report-templates' && 'Create and manage custom templates for your security reports.'}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!config) {
    return (
      <div className="p-6 text-center text-gray-500">
        Unknown tool: {tool}
      </div>
    );
  }

  const Icon = config.icon;

  const runTool = async () => {
    if (!input && tool !== 'password-generator') {
      setError('Please enter input');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body = config.api.includes('recon')
        ? { tool: config.apiTool, target: input, options }
        : { tool: config.apiTool, input, options };

      const res = await fetch(config.api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Tool execution failed');
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadResult = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool}-result.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gray-800 ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold">{config.title}</h2>
            <p className="text-sm text-gray-500">{config.description}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Input Area */}
      <div className="p-4 border-b border-gray-800">
        {tool !== 'password-generator' && (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Target / Input</label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={config.placeholder}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              onKeyDown={(e) => e.key === 'Enter' && runTool()}
            />
          </div>
        )}

        {/* Tool-specific options */}
        {tool === 'dns-lookup' && (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Record Type</label>
            <select
              value={options.recordType || 'ALL'}
              onChange={(e) => setOptions({ ...options, recordType: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option value="ALL">All Records</option>
              <option value="A">A (IPv4)</option>
              <option value="AAAA">AAAA (IPv6)</option>
              <option value="MX">MX (Mail)</option>
              <option value="NS">NS (Nameserver)</option>
              <option value="TXT">TXT</option>
              <option value="CNAME">CNAME</option>
            </select>
          </div>
        )}

        {tool === 'encoder-decoder' && (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Operation</label>
            <select
              value={options.operation || 'base64-encode'}
              onChange={(e) => setOptions({ ...options, operation: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <optgroup label="Base64">
                <option value="base64-encode">Base64 Encode</option>
                <option value="base64-decode">Base64 Decode</option>
              </optgroup>
              <optgroup label="URL">
                <option value="url-encode">URL Encode</option>
                <option value="url-decode">URL Decode</option>
              </optgroup>
              <optgroup label="HTML">
                <option value="html-encode">HTML Encode</option>
                <option value="html-decode">HTML Decode</option>
              </optgroup>
              <optgroup label="Hex">
                <option value="hex-encode">Hex Encode</option>
                <option value="hex-decode">Hex Decode</option>
              </optgroup>
              <optgroup label="Other">
                <option value="rot13">ROT13</option>
              </optgroup>
            </select>
          </div>
        )}

        {tool === 'hash-generator' && (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Algorithm</label>
            <select
              value={options.algorithm || 'all'}
              onChange={(e) => setOptions({ ...options, algorithm: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option value="all">All Algorithms</option>
              <option value="md5">MD5</option>
              <option value="sha1">SHA1</option>
              <option value="sha256">SHA256</option>
              <option value="sha512">SHA512</option>
            </select>
          </div>
        )}

        {tool === 'password-generator' && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Length</label>
              <input
                type="number"
                value={options.length || 16}
                onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
                min={8}
                max={64}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.uppercase !== false}
                  onChange={(e) => setOptions({ ...options, uppercase: e.target.checked })}
                />
                <span className="text-sm">Uppercase</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.numbers !== false}
                  onChange={(e) => setOptions({ ...options, numbers: e.target.checked })}
                />
                <span className="text-sm">Numbers</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.symbols !== false}
                  onChange={(e) => setOptions({ ...options, symbols: e.target.checked })}
                />
                <span className="text-sm">Symbols</span>
              </label>
            </div>
          </div>
        )}

        <button
          onClick={runTool}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-lg font-medium transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Run {config.title}
            </>
          )}
        </button>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-400">Error</p>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
              >
                <Copy className="w-4 h-4" />
                Copy JSON
              </button>
              <button
                onClick={downloadResult}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={runTool}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Re-run
              </button>
            </div>

            {/* Result display based on tool */}
            {tool === 'subdomain-finder' && <SubdomainResult data={result} />}
            {tool === 'port-scanner' && <PortScanResult data={result} />}
            {tool === 'whois-lookup' && <WhoisResult data={result} />}
            {tool === 'dns-lookup' && <DnsResult data={result} />}
            {tool === 'ip-lookup' && <IpLookupResult data={result} />}
            {tool === 'shodan-search' && <ShodanResult data={result} />}
            {tool === 'cve-lookup' && <CveResult data={result} />}
            {tool === 'virustotal-scan' && <VirusTotalResult data={result} />}
            {tool === 'security-headers' && <SecurityHeadersResult data={result} />}
            {tool === 'hash-generator' && <HashResult data={result} onCopy={copyToClipboard} />}
            {tool === 'encoder-decoder' && <EncoderResult data={result} onCopy={copyToClipboard} />}
            {tool === 'password-generator' && <PasswordResult data={result} onCopy={copyToClipboard} />}
            {tool === 'jwt-decoder' && <JwtResult data={result} onCopy={copyToClipboard} />}
          </div>
        )}

        {!result && !error && !loading && (
          <div className="text-center text-gray-500 py-12">
            <Icon className={`w-12 h-12 mx-auto mb-4 opacity-50 ${config.color}`} />
            <p>Enter input and click Run to see results</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Result Components
function SubdomainResult({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
        <div>
          <p className="text-sm text-gray-400">Domain</p>
          <p className="font-medium">{data.domain}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Found</p>
          <p className="text-2xl font-bold text-green-400">{data.subdomainsFound}</p>
        </div>
      </div>

      {data.subdomains?.length > 0 ? (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-left text-sm text-gray-400">Subdomain</th>
                <th className="px-4 py-3 text-left text-sm text-gray-400">IP Address</th>
                <th className="px-4 py-3 text-left text-sm text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.subdomains.map((sub: any, i: number) => (
                <tr key={i} className="border-b border-gray-700 last:border-0">
                  <td className="px-4 py-3 font-mono text-sm">{sub.subdomain}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-400">{sub.ip}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      {sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No subdomains found</p>
      )}

      <p className="text-xs text-gray-500">
        Checked {data.checkedPatterns} patterns • {data.timestamp}
      </p>
    </div>
  );
}

function PortScanResult({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
        <div>
          <p className="text-sm text-gray-400">Target</p>
          <p className="font-medium">{data.target}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Open Ports</p>
          <p className="text-2xl font-bold text-green-400">{data.openPorts?.length || 0}</p>
        </div>
      </div>

      {data.openPorts?.length > 0 && (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-left text-sm text-gray-400">Port</th>
                <th className="px-4 py-3 text-left text-sm text-gray-400">Service</th>
                <th className="px-4 py-3 text-left text-sm text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.openPorts.map((port: any, i: number) => (
                <tr key={i} className="border-b border-gray-700 last:border-0">
                  <td className="px-4 py-3 font-mono text-sm">{port.port}</td>
                  <td className="px-4 py-3 text-sm">{port.service}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                      {port.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Scanned {data.portsScanned} ports • {data.timestamp}
      </p>
      {data.note && <p className="text-xs text-yellow-500">{data.note}</p>}
    </div>
  );
}

function WhoisResult({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-400 mb-1">Domain</p>
        <p className="font-medium text-lg">{data.domain}</p>
      </div>

      {data.registrar && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 mb-1">Registrar</p>
          <p>{data.registrar}</p>
        </div>
      )}

      {data.note && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-400">{data.note}</p>
        </div>
      )}

      {data.dns && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">DNS Information</p>
          <pre className="text-sm font-mono overflow-x-auto">
            {JSON.stringify(data.dns.records, null, 2)}
          </pre>
        </div>
      )}

      <p className="text-xs text-gray-500">{data.timestamp}</p>
    </div>
  );
}

function DnsResult({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-400 mb-1">Domain</p>
        <p className="font-medium text-lg">{data.domain}</p>
        <p className="text-xs text-gray-500">Record Type: {data.recordType}</p>
      </div>

      {Object.entries(data.records || {}).map(([type, values]: [string, any]) => (
        values && (
          <div key={type} className="p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400 mb-2">{type} Records</p>
            {Array.isArray(values) ? (
              <ul className="space-y-1">
                {values.map((v: any, i: number) => (
                  <li key={i} className="font-mono text-sm">
                    {typeof v === 'object' ? JSON.stringify(v) : v}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-mono text-sm">{JSON.stringify(values)}</p>
            )}
          </div>
        )
      ))}

      <p className="text-xs text-gray-500">{data.timestamp}</p>
    </div>
  );
}

function HashResult({ data, onCopy }: { data: any; onCopy: (text: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-400 mb-1">Input ({data.inputLength} chars)</p>
        <p className="font-mono text-sm break-all">{data.input}</p>
      </div>

      {Object.entries(data.hashes || {}).map(([algo, hash]: [string, any]) => (
        <div key={algo} className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400 uppercase">{algo}</p>
            <button 
              onClick={() => onCopy(hash)}
              className="p-1 hover:bg-gray-700 rounded"
            >
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <p className="font-mono text-sm break-all text-green-400">{hash}</p>
        </div>
      ))}

      <p className="text-xs text-gray-500">{data.timestamp}</p>
    </div>
  );
}

function EncoderResult({ data, onCopy }: { data: any; onCopy: (text: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-400 mb-1">Input</p>
        <p className="font-mono text-sm break-all">{data.input}</p>
      </div>

      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-400 mb-1">Operation</p>
        <p className="text-purple-400">{data.operation}</p>
      </div>

      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-400">Output</p>
          <button 
            onClick={() => onCopy(data.output)}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <Copy className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <p className="font-mono text-sm break-all text-green-400">{data.output}</p>
      </div>

      <p className="text-xs text-gray-500">{data.timestamp}</p>
    </div>
  );
}

function PasswordResult({ data, onCopy }: { data: any; onCopy: (text: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-400">Generated Password</p>
          <button 
            onClick={() => onCopy(data.password)}
            className="flex items-center gap-1 px-2 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-green-400 text-sm"
          >
            <Copy className="w-4 h-4" />
            Copy
          </button>
        </div>
        <p className="font-mono text-xl break-all text-green-400">{data.password}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 mb-1">Length</p>
          <p className="text-lg font-medium">{data.length} characters</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 mb-1">Entropy</p>
          <p className="text-lg font-medium">{data.entropy} bits</p>
        </div>
      </div>

      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-400 mb-2">Strength</p>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full text-sm ${
            data.strength === 'Very Strong' ? 'bg-green-500/20 text-green-400' :
            data.strength === 'Strong' ? 'bg-blue-500/20 text-blue-400' :
            data.strength === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {data.strength}
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500">{data.timestamp}</p>
    </div>
  );
}

// IP Lookup Result
function IpLookupResult({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 mb-1">IP Address</p>
          <p className="font-mono text-lg">{data.ip}</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 mb-1">Hostname</p>
          <p className="font-mono">{data.hostname || 'N/A'}</p>
        </div>
      </div>

      {data.location && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">Location</p>
          <p>{data.location.city}, {data.location.region}, {data.location.country}</p>
          <p className="text-sm text-gray-500">{data.location.org}</p>
        </div>
      )}

      {data.reputation && (
        <div className={`p-4 rounded-lg ${
          data.reputation.score > 70 ? 'bg-green-500/10 border border-green-500/20' :
          data.reputation.score > 40 ? 'bg-yellow-500/10 border border-yellow-500/20' :
          'bg-red-500/10 border border-red-500/20'
        }`}>
          <p className="text-sm text-gray-400 mb-1">Reputation Score</p>
          <p className="text-2xl font-bold">{data.reputation.score}/100</p>
          {data.reputation.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {data.reputation.tags.map((tag: string, i: number) => (
                <span key={i} className="px-2 py-0.5 bg-gray-700 rounded text-xs">{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-500">{data.timestamp}</p>
    </div>
  );
}

// Shodan Result
function ShodanResult({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.ip && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 mb-1">IP Address</p>
          <p className="font-mono text-lg">{data.ip}</p>
          {data.hostnames?.length > 0 && (
            <p className="text-sm text-gray-500">{data.hostnames.join(', ')}</p>
          )}
        </div>
      )}

      {data.ports?.length > 0 && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">Open Ports ({data.ports.length})</p>
          <div className="flex flex-wrap gap-2">
            {data.ports.map((port: number) => (
              <span key={port} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm font-mono">
                {port}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.vulns?.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400 mb-2">Vulnerabilities ({data.vulns.length})</p>
          <div className="space-y-1">
            {data.vulns.slice(0, 10).map((vuln: string) => (
              <span key={vuln} className="block text-sm font-mono">{vuln}</span>
            ))}
          </div>
        </div>
      )}

      {data.error && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-400">{data.error}</p>
          <p className="text-xs text-gray-500 mt-1">Shodan API key may be required for full results.</p>
        </div>
      )}

      <p className="text-xs text-gray-500">{data.timestamp}</p>
    </div>
  );
}

// CVE Result
function CveResult({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {data.cve && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="font-mono font-bold text-lg">{data.cve.id}</p>
            {data.cve.severity && (
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                data.cve.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                data.cve.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                data.cve.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {data.cve.severity}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-300">{data.cve.description}</p>
          {data.cve.cvss && (
            <p className="text-sm text-gray-500 mt-2">CVSS Score: {data.cve.cvss}</p>
          )}
        </div>
      )}

      {data.results?.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Found {data.results.length} CVEs</p>
          {data.results.slice(0, 10).map((cve: any) => (
            <div key={cve.id} className="p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm">{cve.id}</p>
                {cve.severity && (
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    cve.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                    cve.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {cve.severity}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{cve.description}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">{data.timestamp}</p>
    </div>
  );
}

// VirusTotal Result
function VirusTotalResult({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-400 mb-1">Target</p>
        <p className="font-mono text-sm break-all">{data.target}</p>
      </div>

      {data.stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
            <p className="text-2xl font-bold text-red-400">{data.stats.malicious || 0}</p>
            <p className="text-xs text-gray-400">Malicious</p>
          </div>
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-400">{data.stats.suspicious || 0}</p>
            <p className="text-xs text-gray-400">Suspicious</p>
          </div>
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-400">{data.stats.harmless || 0}</p>
            <p className="text-xs text-gray-400">Clean</p>
          </div>
        </div>
      )}

      {data.detections?.length > 0 && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">Detections</p>
          <div className="space-y-1">
            {data.detections.slice(0, 10).map((d: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{d.engine}</span>
                <span className="text-red-400">{d.result}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.error && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-400">{data.error}</p>
          <p className="text-xs text-gray-500 mt-1">VirusTotal API key may be required.</p>
        </div>
      )}

      <p className="text-xs text-gray-500">{data.timestamp}</p>
    </div>
  );
}

// Security Headers Result
function SecurityHeadersResult({ data }: { data: any }) {
  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (score >= 80) return { grade: 'A', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (score >= 70) return { grade: 'B', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (score >= 60) return { grade: 'C', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    if (score >= 50) return { grade: 'D', color: 'text-orange-400', bg: 'bg-orange-500/20' };
    return { grade: 'F', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const gradeInfo = data.score ? getGrade(data.score) : null;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-400 mb-1">URL</p>
        <p className="font-mono text-sm break-all">{data.url}</p>
      </div>

      {gradeInfo && (
        <div className={`p-4 ${gradeInfo.bg} rounded-lg text-center`}>
          <p className={`text-4xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</p>
          <p className="text-sm text-gray-400">Score: {data.score}/100</p>
        </div>
      )}

      {data.headers && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400">Security Headers</p>
          {Object.entries(data.headers).map(([header, info]: [string, any]) => (
            <div key={header} className={`p-3 rounded-lg ${
              info.present ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{header}</span>
                {info.present ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                )}
              </div>
              {info.value && (
                <p className="text-xs text-gray-500 mt-1 truncate">{info.value}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {data.recommendations?.length > 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-sm text-yellow-400 mb-2">Recommendations</p>
          <ul className="text-sm space-y-1">
            {data.recommendations.map((rec: string, i: number) => (
              <li key={i} className="text-gray-300">• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-500">{data.timestamp}</p>
    </div>
  );
}

// JWT Decoder Result
function JwtResult({ data, onCopy }: { data: any; onCopy: (text: string) => void }) {
  return (
    <div className="space-y-4">
      {data.header && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Header</p>
            <button onClick={() => onCopy(JSON.stringify(data.header, null, 2))} className="p-1 hover:bg-gray-700 rounded">
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <pre className="text-sm font-mono text-blue-400 overflow-x-auto">
            {JSON.stringify(data.header, null, 2)}
          </pre>
        </div>
      )}

      {data.payload && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Payload</p>
            <button onClick={() => onCopy(JSON.stringify(data.payload, null, 2))} className="p-1 hover:bg-gray-700 rounded">
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <pre className="text-sm font-mono text-green-400 overflow-x-auto">
            {JSON.stringify(data.payload, null, 2)}
          </pre>
        </div>
      )}

      {data.expiry && (
        <div className={`p-4 rounded-lg ${
          data.expired ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'
        }`}>
          <p className="text-sm text-gray-400">Expiration</p>
          <p className={data.expired ? 'text-red-400' : 'text-green-400'}>
            {data.expired ? 'EXPIRED' : 'Valid'} - {data.expiry}
          </p>
        </div>
      )}

      {data.signature && (
        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 mb-1">Signature</p>
          <p className="font-mono text-xs text-purple-400 break-all">{data.signature}</p>
        </div>
      )}

      {data.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{data.error}</p>
        </div>
      )}

      <p className="text-xs text-gray-500">{data.timestamp}</p>
    </div>
  );
}
