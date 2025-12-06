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
  };

  const config = toolConfig[tool];
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
            {tool === 'hash-generator' && <HashResult data={result} onCopy={copyToClipboard} />}
            {tool === 'encoder-decoder' && <EncoderResult data={result} onCopy={copyToClipboard} />}
            {tool === 'password-generator' && <PasswordResult data={result} onCopy={copyToClipboard} />}
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
