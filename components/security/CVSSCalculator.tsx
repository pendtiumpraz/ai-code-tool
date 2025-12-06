'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Copy, Check, Info } from 'lucide-react';

interface CVSSInput {
  attackVector: 'N' | 'A' | 'L' | 'P';
  attackComplexity: 'L' | 'H';
  privilegesRequired: 'N' | 'L' | 'H';
  userInteraction: 'N' | 'R';
  scope: 'U' | 'C';
  confidentialityImpact: 'N' | 'L' | 'H';
  integrityImpact: 'N' | 'L' | 'H';
  availabilityImpact: 'N' | 'L' | 'H';
}

const metrics = {
  attackVector: {
    label: 'Attack Vector (AV)',
    description: 'How the vulnerability can be exploited',
    options: [
      { value: 'N', label: 'Network', desc: 'Remotely exploitable over network' },
      { value: 'A', label: 'Adjacent', desc: 'Requires adjacent network access' },
      { value: 'L', label: 'Local', desc: 'Requires local system access' },
      { value: 'P', label: 'Physical', desc: 'Requires physical access' },
    ],
  },
  attackComplexity: {
    label: 'Attack Complexity (AC)',
    description: 'Conditions beyond attacker control',
    options: [
      { value: 'L', label: 'Low', desc: 'No special conditions required' },
      { value: 'H', label: 'High', desc: 'Special conditions required' },
    ],
  },
  privilegesRequired: {
    label: 'Privileges Required (PR)',
    description: 'Level of privileges needed',
    options: [
      { value: 'N', label: 'None', desc: 'No privileges needed' },
      { value: 'L', label: 'Low', desc: 'Basic user privileges' },
      { value: 'H', label: 'High', desc: 'Admin/root privileges' },
    ],
  },
  userInteraction: {
    label: 'User Interaction (UI)',
    description: 'Does it require user action?',
    options: [
      { value: 'N', label: 'None', desc: 'No user interaction needed' },
      { value: 'R', label: 'Required', desc: 'User must take action' },
    ],
  },
  scope: {
    label: 'Scope (S)',
    description: 'Can impact other components?',
    options: [
      { value: 'U', label: 'Unchanged', desc: 'Impact limited to vulnerable component' },
      { value: 'C', label: 'Changed', desc: 'Can impact other components' },
    ],
  },
  confidentialityImpact: {
    label: 'Confidentiality Impact (C)',
    description: 'Impact on data confidentiality',
    options: [
      { value: 'N', label: 'None', desc: 'No impact on confidentiality' },
      { value: 'L', label: 'Low', desc: 'Some data disclosed' },
      { value: 'H', label: 'High', desc: 'All data disclosed' },
    ],
  },
  integrityImpact: {
    label: 'Integrity Impact (I)',
    description: 'Impact on data integrity',
    options: [
      { value: 'N', label: 'None', desc: 'No impact on integrity' },
      { value: 'L', label: 'Low', desc: 'Some data modifiable' },
      { value: 'H', label: 'High', desc: 'All data modifiable' },
    ],
  },
  availabilityImpact: {
    label: 'Availability Impact (A)',
    description: 'Impact on system availability',
    options: [
      { value: 'N', label: 'None', desc: 'No impact on availability' },
      { value: 'L', label: 'Low', desc: 'Reduced performance' },
      { value: 'H', label: 'High', desc: 'Complete denial of service' },
    ],
  },
};

export function CVSSCalculator() {
  const [input, setInput] = useState<CVSSInput>({
    attackVector: 'N',
    attackComplexity: 'L',
    privilegesRequired: 'N',
    userInteraction: 'N',
    scope: 'U',
    confidentialityImpact: 'H',
    integrityImpact: 'H',
    availabilityImpact: 'H',
  });

  const [result, setResult] = useState<{ score: number; severity: string; vector: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const calculated = calculateCVSS(input);
    setResult(calculated);
  }, [input]);

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.vector);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-red-500 bg-red-500';
      case 'High': return 'text-orange-500 bg-orange-500';
      case 'Medium': return 'text-yellow-500 bg-yellow-500';
      case 'Low': return 'text-blue-500 bg-blue-500';
      default: return 'text-gray-500 bg-gray-500';
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Calculator className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">CVSS 3.1 Calculator</h2>
            <p className="text-sm text-gray-400">Common Vulnerability Scoring System</p>
          </div>
        </div>
      </div>

      {/* Score Display */}
      {result && (
        <div className="p-6 border-b border-gray-800 bg-gray-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getSeverityColor(result.severity).split(' ')[0]}`}>
                  {result.score.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Score</div>
              </div>
              <div className={`px-4 py-2 rounded-lg ${getSeverityColor(result.severity).split(' ')[1]}/20`}>
                <span className={`font-bold ${getSeverityColor(result.severity).split(' ')[0]}`}>
                  {result.severity}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <code className="px-3 py-2 bg-gray-800 rounded-lg text-sm font-mono text-gray-300">
                {result.vector}
              </code>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Copy vector"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Score Bar */}
          <div className="mt-4">
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.score * 10}%` }}
                className={`h-full rounded-full ${getSeverityColor(result.severity).split(' ')[1]}`}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>0</span>
              <span>None</span>
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
              <span>Critical</span>
              <span>10</span>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="p-6 space-y-6">
        {/* Exploitability Metrics */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Exploitability Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {(['attackVector', 'attackComplexity', 'privilegesRequired', 'userInteraction'] as const).map((key) => (
              <MetricSelector
                key={key}
                metric={metrics[key]}
                value={input[key]}
                onChange={(value) => setInput({ ...input, [key]: value })}
              />
            ))}
          </div>
        </div>

        {/* Scope */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Scope
          </h3>
          <MetricSelector
            metric={metrics.scope}
            value={input.scope}
            onChange={(value) => setInput({ ...input, scope: value as any })}
          />
        </div>

        {/* Impact Metrics */}
        <div>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Impact Metrics
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {(['confidentialityImpact', 'integrityImpact', 'availabilityImpact'] as const).map((key) => (
              <MetricSelector
                key={key}
                metric={metrics[key]}
                value={input[key]}
                onChange={(value) => setInput({ ...input, [key]: value })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// METRIC SELECTOR COMPONENT
// ============================================

function MetricSelector({
  metric,
  value,
  onChange,
}: {
  metric: typeof metrics.attackVector;
  value: string;
  onChange: (value: string) => void;
}) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{metric.label}</label>
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <Info className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      
      {showInfo && (
        <p className="text-xs text-gray-500 bg-gray-800 p-2 rounded">
          {metric.description}
        </p>
      )}
      
      <div className="flex flex-wrap gap-2">
        {metric.options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            title={opt.desc}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              value === opt.value
                ? 'bg-purple-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// CVSS CALCULATION
// ============================================

function calculateCVSS(input: CVSSInput): { score: number; severity: string; vector: string } {
  const AV = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
  const AC = { L: 0.77, H: 0.44 };
  const PR_U = { N: 0.85, L: 0.62, H: 0.27 };
  const PR_C = { N: 0.85, L: 0.68, H: 0.5 };
  const UI = { N: 0.85, R: 0.62 };
  const CIA = { N: 0, L: 0.22, H: 0.56 };

  const PR = input.scope === 'U' ? PR_U : PR_C;

  const exploitability = 8.22 * AV[input.attackVector] * AC[input.attackComplexity] * 
                         PR[input.privilegesRequired] * UI[input.userInteraction];

  const iscBase = 1 - (
    (1 - CIA[input.confidentialityImpact]) *
    (1 - CIA[input.integrityImpact]) *
    (1 - CIA[input.availabilityImpact])
  );

  let impact: number;
  if (input.scope === 'U') {
    impact = 6.42 * iscBase;
  } else {
    impact = 7.52 * (iscBase - 0.029) - 3.25 * Math.pow(iscBase - 0.02, 15);
  }

  let score: number;
  if (impact <= 0) {
    score = 0;
  } else if (input.scope === 'U') {
    score = Math.min(impact + exploitability, 10);
  } else {
    score = Math.min(1.08 * (impact + exploitability), 10);
  }

  score = Math.round(score * 10) / 10;

  let severity: string;
  if (score === 0) severity = 'None';
  else if (score <= 3.9) severity = 'Low';
  else if (score <= 6.9) severity = 'Medium';
  else if (score <= 8.9) severity = 'High';
  else severity = 'Critical';

  const vector = `CVSS:3.1/AV:${input.attackVector}/AC:${input.attackComplexity}/PR:${input.privilegesRequired}/UI:${input.userInteraction}/S:${input.scope}/C:${input.confidentialityImpact}/I:${input.integrityImpact}/A:${input.availabilityImpact}`;

  return { score, severity, vector };
}

export default CVSSCalculator;
