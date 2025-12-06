'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, AlertTriangle, AlertCircle, Info, CheckCircle,
  ChevronDown, ChevronRight, Download, FileText, Code,
  ExternalLink, Copy, Check, Filter, Search
} from 'lucide-react';
import { ScanResult, Vulnerability, severityColors } from '@/lib/security/scanner';
import { generateSecurityReport, generateRemediationFile } from '@/lib/security/report-generator';

interface ScanResultsProps {
  result: ScanResult;
  onDownloadReport: (format: 'md' | 'pdf' | 'html') => void;
  onGenerateRemediation: (vuln: Vulnerability) => void;
}

export function ScanResults({ result, onDownloadReport, onGenerateRemediation }: ScanResultsProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedVuln, setExpandedVuln] = useState<string | null>(null);

  const filteredVulns = result.vulnerabilities.filter(v => {
    if (selectedSeverity && v.severity !== selectedSeverity) return false;
    if (searchQuery && !v.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const severityIcon = {
    critical: <AlertCircle className="w-5 h-5" />,
    high: <AlertTriangle className="w-5 h-5" />,
    medium: <AlertTriangle className="w-5 h-5" />,
    low: <Info className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Scan Results</h2>
              <p className="text-sm text-gray-400">{result.target.url}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownloadReport('md')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 border-b border-gray-800">
        {[
          { label: 'Critical', count: result.summary.critical, color: 'red' },
          { label: 'High', count: result.summary.high, color: 'orange' },
          { label: 'Medium', count: result.summary.medium, color: 'yellow' },
          { label: 'Low', count: result.summary.low, color: 'blue' },
          { label: 'Info', count: result.summary.info, color: 'gray' },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setSelectedSeverity(selectedSeverity === item.label.toLowerCase() ? null : item.label.toLowerCase())}
            className={`p-4 text-center transition-colors ${
              selectedSeverity === item.label.toLowerCase() 
                ? `bg-${item.color}-500/20` 
                : 'hover:bg-gray-800'
            }`}
          >
            <div className={`text-3xl font-bold text-${item.color}-500`}>
              {item.count}
            </div>
            <div className="text-sm text-gray-500">{item.label}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-800 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vulnerabilities..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" />
          <span>{filteredVulns.length} of {result.vulnerabilities.length} findings</span>
        </div>
      </div>

      {/* Vulnerability List */}
      <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
        <AnimatePresence>
          {filteredVulns.map((vuln) => (
            <VulnerabilityCard
              key={vuln.id}
              vulnerability={vuln}
              isExpanded={expandedVuln === vuln.id}
              onToggle={() => setExpandedVuln(expandedVuln === vuln.id ? null : vuln.id)}
              onGenerateRemediation={() => onGenerateRemediation(vuln)}
            />
          ))}
        </AnimatePresence>

        {filteredVulns.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p>No vulnerabilities found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// VULNERABILITY CARD
// ============================================

function VulnerabilityCard({
  vulnerability: vuln,
  isExpanded,
  onToggle,
  onGenerateRemediation,
}: {
  vulnerability: Vulnerability;
  isExpanded: boolean;
  onToggle: () => void;
  onGenerateRemediation: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const severityConfig = {
    critical: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    high: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    low: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    info: { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
  };

  const config = severityConfig[vuln.severity];

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(vuln, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="border-l-4 border-transparent hover:border-l-4"
      style={{ borderLeftColor: isExpanded ? severityConfig[vuln.severity].text.replace('text-', '') : 'transparent' }}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        className="p-4 cursor-pointer hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${config.bg}`}>
            {vuln.severity === 'critical' || vuln.severity === 'high' ? (
              <AlertTriangle className={`w-5 h-5 ${config.text}`} />
            ) : (
              <Info className={`w-5 h-5 ${config.text}`} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold truncate">{vuln.title}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}>
                {vuln.severity.toUpperCase()}
              </span>
              <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                CVSS {vuln.cvss.score}
              </span>
            </div>
            
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>{vuln.category}</span>
              {vuln.cwe && <span>{vuln.cwe}</span>}
              {vuln.owasp && <span>{vuln.owasp}</span>}
            </div>
          </div>

          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                <p className="text-sm text-gray-300">{vuln.description}</p>
              </div>

              {/* Evidence */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Evidence</h4>
                <div className="p-3 bg-gray-800 rounded-lg space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">URL:</span>
                    <code className="text-blue-400">{vuln.evidence.url}</code>
                  </div>
                  {vuln.evidence.parameter && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Parameter:</span>
                      <code className="text-yellow-400">{vuln.evidence.parameter}</code>
                    </div>
                  )}
                  {vuln.evidence.payload && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Payload:</span>
                      <code className="text-red-400">{vuln.evidence.payload}</code>
                    </div>
                  )}
                </div>
              </div>

              {/* Remediation */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Remediation</h4>
                <p className="text-sm text-gray-300">{vuln.remediation}</p>
              </div>

              {/* References */}
              {vuln.references.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">References</h4>
                  <div className="flex flex-wrap gap-2">
                    {vuln.references.map((ref, i) => (
                      <a
                        key={i}
                        href={ref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded text-xs text-blue-400 hover:bg-gray-700"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {new URL(ref).hostname}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-800">
                <button
                  onClick={onGenerateRemediation}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Generate Remediation Guide (.md)
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default ScanResults;
