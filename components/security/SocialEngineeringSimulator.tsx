'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Phone, MessageSquare, Users, Target, Shield,
  Play, Pause, BarChart, FileText, AlertTriangle,
  ChevronRight, Check, X, Eye, Send, Download,
  Usb, QrCode, User, Building, Clock
} from 'lucide-react';
import {
  SECampaign, SEAttackType, SETemplate, SETarget,
  phishingTemplates, vishingScripts, smishingTemplates,
  pretextingScenarios, baitingScenarios,
  generateCampaign, generateTrainingReport
} from '@/lib/security/social-engineering';

export function SocialEngineeringSimulator() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'training' | 'reports'>('campaigns');
  const [selectedType, setSelectedType] = useState<SEAttackType | null>(null);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);

  const attackTypes = [
    { type: 'phishing' as SEAttackType, label: 'Email Phishing', icon: Mail, color: 'blue' },
    { type: 'spear_phishing' as SEAttackType, label: 'Spear Phishing', icon: Target, color: 'purple' },
    { type: 'vishing' as SEAttackType, label: 'Vishing (Voice)', icon: Phone, color: 'green' },
    { type: 'smishing' as SEAttackType, label: 'Smishing (SMS)', icon: MessageSquare, color: 'yellow' },
    { type: 'pretexting' as SEAttackType, label: 'Pretexting', icon: User, color: 'orange' },
    { type: 'baiting' as SEAttackType, label: 'Baiting (USB/QR)', icon: Usb, color: 'red' },
    { type: 'business_email_compromise' as SEAttackType, label: 'BEC', icon: Building, color: 'pink' },
  ];

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-orange-500/10 to-red-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <Users className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Social Engineering Simulator</h2>
              <p className="text-sm text-gray-400">Security Awareness Training Platform</p>
            </div>
          </div>
          <button
            onClick={() => setShowCampaignBuilder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        {[
          { id: 'campaigns', label: 'Campaigns', icon: Target },
          { id: 'templates', label: 'Templates', icon: FileText },
          { id: 'training', label: 'Training', icon: Shield },
          { id: 'reports', label: 'Reports', icon: BarChart },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-orange-400 border-b-2 border-orange-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Attack Type Selector */}
      <div className="p-4 border-b border-gray-800 bg-gray-950/50">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedType(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedType === null
                ? 'bg-gray-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
            }`}
          >
            All Types
          </button>
          {attackTypes.map((attack) => (
            <button
              key={attack.type}
              onClick={() => setSelectedType(attack.type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedType === attack.type
                  ? `bg-${attack.color}-500/20 text-${attack.color}-400`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750'
              }`}
            >
              <attack.icon className="w-4 h-4" />
              {attack.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'campaigns' && <CampaignsView selectedType={selectedType} />}
        {activeTab === 'templates' && <TemplatesView selectedType={selectedType} />}
        {activeTab === 'training' && <TrainingView />}
        {activeTab === 'reports' && <ReportsView />}
      </div>

      {/* Campaign Builder Modal */}
      <AnimatePresence>
        {showCampaignBuilder && (
          <CampaignBuilderModal onClose={() => setShowCampaignBuilder(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// CAMPAIGNS VIEW
// ============================================

function CampaignsView({ selectedType }: { selectedType: SEAttackType | null }) {
  const campaigns: Partial<SECampaign>[] = [
    {
      id: '1',
      name: 'Q4 Phishing Awareness',
      type: 'phishing',
      status: 'running',
      results: {
        totalTargets: 150,
        sent: 150,
        opened: 89,
        clicked: 34,
        submitted: 12,
        reported: 23,
        openRate: 59.3,
        clickRate: 22.7,
        submitRate: 8.0,
        reportRate: 15.3,
        overallRisk: 'medium',
        departmentRisk: {},
        delivered: 148,
        timeline: [],
      },
    },
    {
      id: '2',
      name: 'Executive BEC Test',
      type: 'business_email_compromise',
      status: 'completed',
      results: {
        totalTargets: 25,
        sent: 25,
        opened: 22,
        clicked: 8,
        submitted: 3,
        reported: 5,
        openRate: 88.0,
        clickRate: 32.0,
        submitRate: 12.0,
        reportRate: 20.0,
        overallRisk: 'high',
        departmentRisk: {},
        delivered: 25,
        timeline: [],
      },
    },
  ];

  const filteredCampaigns = selectedType
    ? campaigns.filter(c => c.type === selectedType)
    : campaigns;

  return (
    <div className="space-y-4">
      {filteredCampaigns.map((campaign) => (
        <div
          key={campaign.id}
          className="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">{campaign.name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  campaign.status === 'running' ? 'bg-green-500/20 text-green-400' :
                  campaign.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {campaign.status}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {campaign.type?.replace('_', ' ')} • {campaign.results?.totalTargets} targets
              </div>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${
                (campaign.results?.clickRate || 0) > 30 ? 'text-red-400' :
                (campaign.results?.clickRate || 0) > 15 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {campaign.results?.clickRate?.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Click Rate</div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-4 grid grid-cols-5 gap-2">
            {[
              { label: 'Sent', value: campaign.results?.sent, color: 'blue' },
              { label: 'Opened', value: campaign.results?.opened, color: 'purple' },
              { label: 'Clicked', value: campaign.results?.clicked, color: 'yellow' },
              { label: 'Submitted', value: campaign.results?.submitted, color: 'red' },
              { label: 'Reported', value: campaign.results?.reported, color: 'green' },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-2 bg-gray-900 rounded-lg">
                <div className={`text-lg font-semibold text-${stat.color}-400`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex">
              <div 
                className="bg-purple-500 h-full" 
                style={{ width: `${campaign.results?.openRate}%` }}
                title={`Opened: ${campaign.results?.openRate}%`}
              />
              <div 
                className="bg-yellow-500 h-full" 
                style={{ width: `${(campaign.results?.clickRate || 0) - (campaign.results?.submitRate || 0)}%` }}
                title={`Clicked: ${campaign.results?.clickRate}%`}
              />
              <div 
                className="bg-red-500 h-full" 
                style={{ width: `${campaign.results?.submitRate}%` }}
                title={`Submitted: ${campaign.results?.submitRate}%`}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// TEMPLATES VIEW
// ============================================

function TemplatesView({ selectedType }: { selectedType: SEAttackType | null }) {
  const allTemplates = [
    ...phishingTemplates,
    ...vishingScripts,
    ...smishingTemplates,
    ...pretextingScenarios,
    ...baitingScenarios,
  ];

  const filteredTemplates = selectedType
    ? allTemplates.filter(t => t.type === selectedType)
    : allTemplates;

  const difficultyColors = {
    easy: 'bg-green-500/20 text-green-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    hard: 'bg-orange-500/20 text-orange-400',
    expert: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {filteredTemplates.map((template) => (
        <div
          key={template.id}
          className="p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500/50 transition-colors cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold">{template.name}</h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[template.difficulty]}`}>
              {template.difficulty}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <span className="px-2 py-0.5 bg-gray-700 rounded">{template.type}</span>
            <span>{template.category}</span>
          </div>

          {template.redFlags && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-xs text-gray-500 mb-2">Red Flags:</div>
              <div className="flex flex-wrap gap-1">
                {template.redFlags.slice(0, 2).map((flag, i) => (
                  <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs truncate max-w-[150px]">
                    {flag}
                  </span>
                ))}
                {template.redFlags.length > 2 && (
                  <span className="px-2 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">
                    +{template.redFlags.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <button className="flex-1 px-3 py-1.5 bg-orange-500/20 text-orange-400 rounded-lg text-sm hover:bg-orange-500/30">
              Use Template
            </button>
            <button className="px-3 py-1.5 bg-gray-700 text-gray-400 rounded-lg text-sm hover:bg-gray-600">
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// TRAINING VIEW
// ============================================

function TrainingView() {
  const modules = [
    {
      id: 'phishing-101',
      title: 'Phishing Awareness 101',
      description: 'Learn to identify and report phishing attempts',
      duration: '15 min',
      topics: ['Email red flags', 'Link verification', 'Reporting procedures'],
      completion: 78,
    },
    {
      id: 'social-engineering',
      title: 'Social Engineering Defense',
      description: 'Recognize manipulation tactics used by attackers',
      duration: '20 min',
      topics: ['Pretexting', 'Urgency tactics', 'Authority impersonation'],
      completion: 45,
    },
    {
      id: 'password-security',
      title: 'Password & MFA Security',
      description: 'Best practices for credential protection',
      duration: '10 min',
      topics: ['Strong passwords', 'MFA usage', 'Password managers'],
      completion: 92,
    },
    {
      id: 'physical-security',
      title: 'Physical Security Awareness',
      description: 'USB drops, tailgating, and physical threats',
      duration: '12 min',
      topics: ['USB security', 'Badge access', 'Visitor policies'],
      completion: 34,
    },
  ];

  return (
    <div className="space-y-4">
      {modules.map((module) => (
        <div
          key={module.id}
          className="p-4 bg-gray-800 rounded-xl border border-gray-700"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">{module.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{module.description}</p>
              
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {module.duration}
                </span>
                <span>{module.topics.length} topics</span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {module.topics.map((topic, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-700 rounded text-xs">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-blue-400">{module.completion}%</div>
              <div className="text-xs text-gray-500">Completion</div>
              <button className="mt-2 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm">
                {module.completion > 0 ? 'Continue' : 'Start'}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${module.completion}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================
// REPORTS VIEW
// ============================================

function ReportsView() {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Campaigns', value: '12', change: '+3 this month' },
          { label: 'Avg Click Rate', value: '18.4%', change: '-5.2% vs last quarter' },
          { label: 'Employees Trained', value: '847', change: '92% of org' },
          { label: 'Incidents Reported', value: '156', change: '+23% improvement' },
        ].map((stat, i) => (
          <div key={i} className="p-4 bg-gray-800 rounded-xl">
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
            <div className="text-xs text-green-400 mt-1">{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Downloadable Reports */}
      <div>
        <h3 className="font-semibold mb-4">Available Reports</h3>
        <div className="space-y-2">
          {[
            { name: 'Q4 2024 Security Awareness Report', date: 'Dec 1, 2024', type: 'Quarterly' },
            { name: 'Executive Phishing Simulation Results', date: 'Nov 15, 2024', type: 'Campaign' },
            { name: 'Department Risk Assessment', date: 'Nov 1, 2024', type: 'Analysis' },
            { name: 'Training Completion Summary', date: 'Oct 30, 2024', type: 'Training' },
          ].map((report, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="font-medium">{report.name}</div>
                  <div className="text-sm text-gray-500">{report.date} • {report.type}</div>
                </div>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
                <Download className="w-4 h-4" />
                Download .md
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// CAMPAIGN BUILDER MODAL
// ============================================

function CampaignBuilderModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [isLaunching, setIsLaunching] = useState(false);
  const [campaignData, setCampaignData] = useState({
    name: '',
    type: 'phishing' as SEAttackType,
    templateId: '',
    targets: [] as SETarget[],
  });
  
  const handleLaunch = async () => {
    if (!campaignData.name) {
      alert('Please enter a campaign name');
      setStep(1);
      return;
    }
    
    setIsLaunching(true);
    
    // Simulate campaign launch
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert(`Campaign "${campaignData.name}" launched successfully!\n\nType: ${campaignData.type}\nTemplate: ${campaignData.templateId || 'Default'}\nTargets: ${campaignData.targets.length || 'Demo mode'}`);
    
    setIsLaunching(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-2xl max-h-[80vh] overflow-hidden"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold">Create New Campaign</h2>
          <p className="text-sm text-gray-400">Step {step} of 4</p>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 border-b border-gray-800">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${
                  s <= step ? 'bg-orange-500' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Campaign Details</h3>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  placeholder="Q4 Security Awareness Test"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Attack Type</label>
                <select
                  value={campaignData.type}
                  onChange={(e) => setCampaignData({ ...campaignData, type: e.target.value as SEAttackType })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                >
                  <option value="phishing">Email Phishing</option>
                  <option value="spear_phishing">Spear Phishing</option>
                  <option value="vishing">Vishing (Voice)</option>
                  <option value="smishing">Smishing (SMS)</option>
                  <option value="business_email_compromise">Business Email Compromise</option>
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Select Template</h3>
              <div className="grid grid-cols-2 gap-3">
                {phishingTemplates.slice(0, 4).map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setCampaignData({ ...campaignData, templateId: template.id })}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      campaignData.templateId === template.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-sm">{template.name}</div>
                    <div className="text-xs text-gray-500">{template.category}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Add Targets</h3>
              <div className="p-4 border border-dashed border-gray-700 rounded-lg text-center">
                <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">
                  Upload CSV or add targets manually
                </p>
                <button className="mt-2 px-4 py-2 bg-gray-800 rounded-lg text-sm">
                  Upload CSV
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Review & Launch</h3>
              <div className="p-4 bg-gray-800 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Campaign Name:</span>
                  <span>{campaignData.name || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Type:</span>
                  <span>{campaignData.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Template:</span>
                  <span>{campaignData.templateId || 'Not selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Targets:</span>
                  <span>{campaignData.targets.length} users</span>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-yellow-400 font-medium">Important</p>
                    <p className="text-sm text-yellow-400/80">
                      This simulation is for authorized security awareness training only.
                      Ensure you have proper authorization before launching.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 flex justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="px-4 py-2 text-gray-400 hover:text-white"
            disabled={isLaunching}
          >
            {step > 1 ? 'Previous' : 'Cancel'}
          </button>
          <button
            onClick={() => step < 4 ? setStep(step + 1) : handleLaunch()}
            disabled={isLaunching}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 rounded-lg font-medium flex items-center gap-2"
          >
            {isLaunching ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Launching...
              </>
            ) : step < 4 ? (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Launch Campaign
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default SocialEngineeringSimulator;
