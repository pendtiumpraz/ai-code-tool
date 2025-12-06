'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, FileText, CheckCircle, AlertTriangle, User,
  Calendar, Globe, Lock, ChevronRight, ChevronDown,
  FileCheck, Scale, AlertCircle
} from 'lucide-react';

export interface EngagementData {
  // Client Info
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  
  // Target Info
  targetUrl: string;
  targetType: 'web' | 'api' | 'mobile' | 'network' | 'cloud';
  environment: 'production' | 'staging' | 'development';
  
  // Scope
  inScope: string[];
  outOfScope: string[];
  testingTypes: string[];
  
  // Authorization
  authorizationType: 'owner' | 'contract' | 'bugbounty' | 'internal';
  authorizationDocument?: File;
  authorizedBy: string;
  authorizationDate: Date;
  validUntil: Date;
  
  // Rules of Engagement
  testingWindow: {
    start: string;
    end: string;
    timezone: string;
  };
  allowedActions: string[];
  restrictedActions: string[];
  emergencyContact: string;
  
  // Acknowledgments
  acknowledgements: {
    legalAgreement: boolean;
    dataHandling: boolean;
    reportingProcedure: boolean;
    incidentResponse: boolean;
  };
}

interface PreEngagementFormProps {
  onSubmit: (data: EngagementData) => void;
  onCancel: () => void;
}

export function PreEngagementForm({ onSubmit, onCancel }: PreEngagementFormProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<EngagementData>>({
    inScope: [],
    outOfScope: [],
    testingTypes: [],
    allowedActions: [],
    restrictedActions: [],
    acknowledgements: {
      legalAgreement: false,
      dataHandling: false,
      reportingProcedure: false,
      incidentResponse: false,
    },
  });

  const totalSteps = 5;

  const updateData = (updates: Partial<EngagementData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    onSubmit(data as EngagementData);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.clientName && data.clientEmail && data.targetUrl;
      case 2:
        return data.inScope && data.inScope.length > 0;
      case 3:
        return data.authorizationType && data.authorizedBy;
      case 4:
        return data.testingWindow?.start && data.emergencyContact;
      case 5:
        return Object.values(data.acknowledgements || {}).every(v => v);
      default:
        return false;
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-red-500/10 to-orange-500/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/20 rounded-xl">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Pre-Engagement Checklist</h2>
            <p className="text-sm text-gray-400">Complete before starting security assessment</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${s < step ? 'bg-green-500 text-white' : 
                  s === step ? 'bg-red-500 text-white' : 
                  'bg-gray-800 text-gray-500'}
              `}>
                {s < step ? <CheckCircle className="w-4 h-4" /> : s}
              </div>
              {s < 5 && (
                <div className={`w-12 h-1 mx-2 rounded ${s < step ? 'bg-green-500' : 'bg-gray-800'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Client</span>
          <span>Scope</span>
          <span>Auth</span>
          <span>Rules</span>
          <span>Confirm</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-6">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          {step === 1 && (
            <Step1ClientInfo data={data} updateData={updateData} />
          )}
          {step === 2 && (
            <Step2Scope data={data} updateData={updateData} />
          )}
          {step === 3 && (
            <Step3Authorization data={data} updateData={updateData} />
          )}
          {step === 4 && (
            <Step4Rules data={data} updateData={updateData} />
          )}
          {step === 5 && (
            <Step5Acknowledgements data={data} updateData={updateData} />
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-800 flex justify-between">
        <button
          onClick={step === 1 ? onCancel : handlePrev}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          {step === 1 ? 'Cancel' : 'Previous'}
        </button>
        <button
          onClick={step === totalSteps ? handleSubmit : handleNext}
          disabled={!canProceed()}
          className="px-6 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {step === totalSteps ? 'Start Assessment' : 'Next'}
          {step < totalSteps && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ============================================
// STEP COMPONENTS
// ============================================

function Step1ClientInfo({ data, updateData }: { data: Partial<EngagementData>; updateData: (d: Partial<EngagementData>) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <User className="w-5 h-5 text-red-400" />
        Client & Target Information
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Client Name *</label>
          <input
            type="text"
            value={data.clientName || ''}
            onChange={(e) => updateData({ clientName: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Client Email *</label>
          <input
            type="email"
            value={data.clientEmail || ''}
            onChange={(e) => updateData({ clientEmail: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="john@company.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Company/Organization</label>
        <input
          type="text"
          value={data.clientCompany || ''}
          onChange={(e) => updateData({ clientCompany: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Company Inc."
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Target URL *</label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="url"
            value={data.targetUrl || ''}
            onChange={(e) => updateData({ targetUrl: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="https://example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Target Type</label>
          <select
            value={data.targetType || 'web'}
            onChange={(e) => updateData({ targetType: e.target.value as any })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="web">Web Application</option>
            <option value="api">API</option>
            <option value="mobile">Mobile App</option>
            <option value="network">Network</option>
            <option value="cloud">Cloud Infrastructure</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Environment</label>
          <select
            value={data.environment || 'production'}
            onChange={(e) => updateData({ environment: e.target.value as any })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function Step2Scope({ data, updateData }: { data: Partial<EngagementData>; updateData: (d: Partial<EngagementData>) => void }) {
  const [newInScope, setNewInScope] = useState('');
  const [newOutScope, setNewOutScope] = useState('');

  const testingTypes = [
    'Web Application Testing',
    'API Security Testing',
    'Authentication Testing',
    'Authorization Testing',
    'Input Validation',
    'Session Management',
    'Business Logic',
    'File Upload Testing',
    'SSL/TLS Analysis',
    'Security Headers',
  ];

  const addInScope = () => {
    if (newInScope) {
      updateData({ inScope: [...(data.inScope || []), newInScope] });
      setNewInScope('');
    }
  };

  const addOutScope = () => {
    if (newOutScope) {
      updateData({ outOfScope: [...(data.outOfScope || []), newOutScope] });
      setNewOutScope('');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="w-5 h-5 text-red-400" />
        Scope Definition
      </h3>

      <div>
        <label className="block text-sm text-gray-400 mb-2">In Scope *</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newInScope}
            onChange={(e) => setNewInScope(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addInScope()}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g., https://example.com/*, *.example.com"
          />
          <button onClick={addInScope} className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.inScope?.map((item, i) => (
            <span key={i} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-2">
              {item}
              <button onClick={() => updateData({ inScope: data.inScope?.filter((_, idx) => idx !== i) })}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Out of Scope</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newOutScope}
            onChange={(e) => setNewOutScope(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addOutScope()}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g., /admin/*, third-party services"
          />
          <button onClick={addOutScope} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.outOfScope?.map((item, i) => (
            <span key={i} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm flex items-center gap-2">
              {item}
              <button onClick={() => updateData({ outOfScope: data.outOfScope?.filter((_, idx) => idx !== i) })}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Testing Types</label>
        <div className="grid grid-cols-2 gap-2">
          {testingTypes.map((type) => (
            <label key={type} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750">
              <input
                type="checkbox"
                checked={data.testingTypes?.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateData({ testingTypes: [...(data.testingTypes || []), type] });
                  } else {
                    updateData({ testingTypes: data.testingTypes?.filter(t => t !== type) });
                  }
                }}
                className="w-4 h-4 rounded border-gray-600"
              />
              <span className="text-sm">{type}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3Authorization({ data, updateData }: { data: Partial<EngagementData>; updateData: (d: Partial<EngagementData>) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Lock className="w-5 h-5 text-red-400" />
        Authorization
      </h3>

      <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium">Important Notice</p>
            <p className="text-sm text-yellow-400/80">
              Security testing without proper authorization is illegal. Ensure you have written permission before proceeding.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Authorization Type *</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'owner', label: 'I Own This', desc: 'You are the owner of the target' },
            { value: 'contract', label: 'Contract/Agreement', desc: 'Written authorization from owner' },
            { value: 'bugbounty', label: 'Bug Bounty', desc: 'Public bug bounty program' },
            { value: 'internal', label: 'Internal Test', desc: 'Company internal testing' },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                data.authorizationType === opt.value
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="authType"
                value={opt.value}
                checked={data.authorizationType === opt.value}
                onChange={() => updateData({ authorizationType: opt.value as any })}
                className="hidden"
              />
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs text-gray-500">{opt.desc}</div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Authorized By *</label>
          <input
            type="text"
            value={data.authorizedBy || ''}
            onChange={(e) => updateData({ authorizedBy: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Name of authorizing person"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Valid Until</label>
          <input
            type="date"
            value={data.validUntil?.toISOString().split('T')[0] || ''}
            onChange={(e) => updateData({ validUntil: new Date(e.target.value) })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Authorization Document (Optional)</label>
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-gray-600 transition-colors">
          <FileCheck className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Drop authorization document here or click to upload</p>
          <p className="text-xs text-gray-600 mt-1">PDF, DOC, or image file</p>
          <input type="file" className="hidden" />
        </div>
      </div>
    </div>
  );
}

function Step4Rules({ data, updateData }: { data: Partial<EngagementData>; updateData: (d: Partial<EngagementData>) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Scale className="w-5 h-5 text-red-400" />
        Rules of Engagement
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Testing Window Start *</label>
          <input
            type="datetime-local"
            value={data.testingWindow?.start || ''}
            onChange={(e) => updateData({ 
              testingWindow: { ...data.testingWindow, start: e.target.value } as any 
            })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Testing Window End</label>
          <input
            type="datetime-local"
            value={data.testingWindow?.end || ''}
            onChange={(e) => updateData({ 
              testingWindow: { ...data.testingWindow, end: e.target.value } as any 
            })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Emergency Contact *</label>
        <input
          type="text"
          value={data.emergencyContact || ''}
          onChange={(e) => updateData({ emergencyContact: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Phone or email for urgent issues"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Allowed Actions</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Automated Scanning',
            'Manual Testing',
            'Exploitation (PoC)',
            'Social Engineering',
            'Physical Access',
            'Denial of Service (Rate Limited)',
          ].map((action) => (
            <label key={action} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={data.allowedActions?.includes(action)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateData({ allowedActions: [...(data.allowedActions || []), action] });
                  } else {
                    updateData({ allowedActions: data.allowedActions?.filter(a => a !== action) });
                  }
                }}
                className="w-4 h-4 rounded border-gray-600"
              />
              <span className="text-sm">{action}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Restricted Actions</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Data Modification',
            'Data Exfiltration',
            'Service Disruption',
            'Third-party Testing',
            'Physical Intrusion',
            'Employee Targeting',
          ].map((action) => (
            <label key={action} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={data.restrictedActions?.includes(action)}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateData({ restrictedActions: [...(data.restrictedActions || []), action] });
                  } else {
                    updateData({ restrictedActions: data.restrictedActions?.filter(a => a !== action) });
                  }
                }}
                className="w-4 h-4 rounded border-gray-600"
              />
              <span className="text-sm">{action}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5Acknowledgements({ data, updateData }: { data: Partial<EngagementData>; updateData: (d: Partial<EngagementData>) => void }) {
  const acknowledgements = [
    {
      key: 'legalAgreement',
      title: 'Legal Agreement',
      description: 'I confirm that I have proper authorization to perform security testing on the specified target.',
    },
    {
      key: 'dataHandling',
      title: 'Data Handling',
      description: 'I will handle any discovered data responsibly and will not share or misuse sensitive information.',
    },
    {
      key: 'reportingProcedure',
      title: 'Reporting Procedure',
      description: 'I will follow responsible disclosure practices and report findings only to authorized parties.',
    },
    {
      key: 'incidentResponse',
      title: 'Incident Response',
      description: 'I will immediately stop testing and contact the emergency contact if any unintended impact occurs.',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileCheck className="w-5 h-5 text-red-400" />
        Acknowledgements
      </h3>

      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Final Confirmation Required</p>
            <p className="text-sm text-red-400/80">
              Please read and acknowledge all items below before proceeding with the security assessment.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {acknowledgements.map((ack) => (
          <label
            key={ack.key}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              data.acknowledgements?.[ack.key as keyof typeof data.acknowledgements]
                ? 'border-green-500 bg-green-500/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <input
              type="checkbox"
              checked={data.acknowledgements?.[ack.key as keyof typeof data.acknowledgements] || false}
              onChange={(e) => updateData({
                acknowledgements: {
                  ...data.acknowledgements,
                  [ack.key]: e.target.checked,
                } as any,
              })}
              className="w-5 h-5 rounded border-gray-600 mt-0.5"
            />
            <div>
              <div className="font-medium">{ack.title}</div>
              <div className="text-sm text-gray-400">{ack.description}</div>
            </div>
          </label>
        ))}
      </div>

      {Object.values(data.acknowledgements || {}).every(v => v) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-green-400 font-medium">Ready to Begin</p>
              <p className="text-sm text-green-400/80">
                All acknowledgements confirmed. Click "Start Assessment" to proceed.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default PreEngagementForm;
