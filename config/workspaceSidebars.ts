import { 
  Home, Search, Shield, FileText, Calculator, Users,
  Code, Terminal, Eye, Package, Rocket, Settings,
  BookOpen, PenTool, MapPin, BarChart3, Database,
  Brain, TrendingUp, FileSpreadsheet, Network, Lock,
  Globe, Zap, Hash, Key, AlertTriangle, Activity,
  FolderOpen, GitBranch, Bug, Wrench, Layout, Layers
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  action?: string;
  badge?: string;
  children?: SidebarItem[];
}

export interface SidebarSection {
  id: string;
  title?: string;
  items: SidebarItem[];
}

export interface WorkspaceSidebarConfig {
  sections: SidebarSection[];
}

// Cybersecurity Workspace Sidebar
export const cybersecuritySidebar: WorkspaceSidebarConfig = {
  sections: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, action: 'dashboard' },
      ]
    },
    {
      id: 'recon',
      title: 'Reconnaissance',
      items: [
        { id: 'subdomain', label: 'Subdomain Finder', icon: Globe, action: 'subdomain-finder' },
        { id: 'port-scan', label: 'Port Scanner', icon: Network, action: 'port-scanner' },
        { id: 'whois', label: 'WHOIS Lookup', icon: Search, action: 'whois-lookup' },
        { id: 'dns', label: 'DNS Lookup', icon: Database, action: 'dns-lookup' },
      ]
    },
    {
      id: 'scanner',
      title: 'Vulnerability Scanner',
      items: [
        { id: 'web-scan', label: 'Web Scanner', icon: Shield, action: 'web-scanner' },
        { id: 'api-scan', label: 'API Scanner', icon: Zap, action: 'api-scanner' },
        { id: 'network-scan', label: 'Network Scanner', icon: Network, action: 'network-scanner' },
      ]
    },
    {
      id: 'tools',
      title: 'Security Tools',
      items: [
        { id: 'cvss', label: 'CVSS Calculator', icon: Calculator, action: 'cvss-calculator' },
        { id: 'hash', label: 'Hash Generator', icon: Hash, action: 'hash-generator' },
        { id: 'encoder', label: 'Encoder/Decoder', icon: Key, action: 'encoder-decoder' },
      ]
    },
    {
      id: 'social',
      title: 'Social Engineering',
      items: [
        { id: 'phishing', label: 'Phishing Simulator', icon: AlertTriangle, action: 'phishing-sim' },
        { id: 'awareness', label: 'Awareness Training', icon: Users, action: 'awareness' },
      ]
    },
    {
      id: 'reports',
      title: 'Reports',
      items: [
        { id: 'history', label: 'Scan History', icon: Activity, action: 'scan-history' },
        { id: 'generate', label: 'Generate Report', icon: FileText, action: 'generate-report' },
        { id: 'templates', label: 'Report Templates', icon: Layout, action: 'report-templates' },
      ]
    },
    {
      id: 'settings',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, action: 'settings' },
      ]
    }
  ]
};

// Software Development Workspace Sidebar
export const softwareDevSidebar: WorkspaceSidebarConfig = {
  sections: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, action: 'dashboard' },
      ]
    },
    {
      id: 'projects',
      title: 'Projects',
      items: [
        { id: 'my-projects', label: 'My Projects', icon: FolderOpen, action: 'my-projects' },
        { id: 'templates', label: 'Templates', icon: Layout, action: 'templates' },
        { id: 'import', label: 'Import Project', icon: Package, action: 'import' },
      ]
    },
    {
      id: 'code',
      title: 'Development',
      items: [
        { id: 'editor', label: 'Code Editor', icon: Code, action: 'editor' },
        { id: 'terminal', label: 'Terminal', icon: Terminal, action: 'terminal' },
        { id: 'preview', label: 'Preview', icon: Eye, action: 'preview' },
      ]
    },
    {
      id: 'tools',
      title: 'Tools',
      items: [
        { id: 'debugger', label: 'Debugger', icon: Bug, action: 'debugger' },
        { id: 'formatter', label: 'Code Formatter', icon: Wrench, action: 'formatter' },
        { id: 'git', label: 'Git', icon: GitBranch, action: 'git' },
      ]
    },
    {
      id: 'deploy',
      title: 'Deployment',
      items: [
        { id: 'build', label: 'Build', icon: Package, action: 'build' },
        { id: 'deploy', label: 'Deploy', icon: Rocket, action: 'deploy' },
      ]
    },
    {
      id: 'settings',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, action: 'settings' },
      ]
    }
  ]
};

// Book Writing Workspace Sidebar
export const bookWritingSidebar: WorkspaceSidebarConfig = {
  sections: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, action: 'dashboard' },
      ]
    },
    {
      id: 'books',
      title: 'My Books',
      items: [
        { id: 'all-books', label: 'All Books', icon: BookOpen, action: 'all-books' },
        { id: 'drafts', label: 'Drafts', icon: FileText, action: 'drafts' },
        { id: 'published', label: 'Published', icon: Rocket, action: 'published' },
      ]
    },
    {
      id: 'write',
      title: 'Writing',
      items: [
        { id: 'new-chapter', label: 'New Chapter', icon: PenTool, action: 'new-chapter' },
        { id: 'outline', label: 'Outline', icon: Layers, action: 'outline' },
        { id: 'notes', label: 'Notes', icon: FileText, action: 'notes' },
      ]
    },
    {
      id: 'world',
      title: 'World Building',
      items: [
        { id: 'characters', label: 'Characters', icon: Users, action: 'characters' },
        { id: 'locations', label: 'Locations', icon: MapPin, action: 'locations' },
        { id: 'timeline', label: 'Timeline', icon: Activity, action: 'timeline' },
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics',
      items: [
        { id: 'word-count', label: 'Word Count', icon: BarChart3, action: 'word-count' },
        { id: 'progress', label: 'Progress', icon: TrendingUp, action: 'progress' },
      ]
    },
    {
      id: 'settings',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, action: 'settings' },
      ]
    }
  ]
};

// Data Analysis Workspace Sidebar
export const dataAnalysisSidebar: WorkspaceSidebarConfig = {
  sections: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, action: 'dashboard' },
      ]
    },
    {
      id: 'data',
      title: 'Datasets',
      items: [
        { id: 'my-data', label: 'My Data', icon: Database, action: 'my-data' },
        { id: 'import', label: 'Import Data', icon: Package, action: 'import-data' },
        { id: 'sample', label: 'Sample Datasets', icon: FileSpreadsheet, action: 'sample-data' },
      ]
    },
    {
      id: 'analysis',
      title: 'Analysis',
      items: [
        { id: 'explore', label: 'Explore', icon: Search, action: 'explore' },
        { id: 'visualize', label: 'Visualize', icon: BarChart3, action: 'visualize' },
        { id: 'statistics', label: 'Statistics', icon: TrendingUp, action: 'statistics' },
      ]
    },
    {
      id: 'ml',
      title: 'Machine Learning',
      items: [
        { id: 'train', label: 'Train Model', icon: Brain, action: 'train-model' },
        { id: 'evaluate', label: 'Evaluate', icon: Activity, action: 'evaluate' },
        { id: 'deploy-ml', label: 'Deploy Model', icon: Rocket, action: 'deploy-model' },
      ]
    },
    {
      id: 'reports',
      title: 'Reports',
      items: [
        { id: 'create-report', label: 'Create Report', icon: FileText, action: 'create-report' },
        { id: 'templates', label: 'Templates', icon: Layout, action: 'report-templates' },
      ]
    },
    {
      id: 'settings',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, action: 'settings' },
      ]
    }
  ]
};

// Healthcare Workspace Sidebar
export const healthcareSidebar: WorkspaceSidebarConfig = {
  sections: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, action: 'dashboard' },
      ]
    },
    {
      id: 'patients',
      title: 'Patients',
      items: [
        { id: 'patient-list', label: 'Patient List', icon: Users, action: 'patient-list' },
        { id: 'add-patient', label: 'Add Patient', icon: Users, action: 'add-patient' },
      ]
    },
    {
      id: 'records',
      title: 'Medical Records',
      items: [
        { id: 'records', label: 'Records', icon: FileText, action: 'records' },
        { id: 'prescriptions', label: 'Prescriptions', icon: FileSpreadsheet, action: 'prescriptions' },
        { id: 'lab-results', label: 'Lab Results', icon: Activity, action: 'lab-results' },
      ]
    },
    {
      id: 'research',
      title: 'Research',
      items: [
        { id: 'literature', label: 'Literature Search', icon: Search, action: 'literature' },
        { id: 'studies', label: 'Clinical Studies', icon: BookOpen, action: 'studies' },
      ]
    },
    {
      id: 'settings',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, action: 'settings' },
      ]
    }
  ]
};

// Legal Workspace Sidebar
export const legalSidebar: WorkspaceSidebarConfig = {
  sections: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, action: 'dashboard' },
      ]
    },
    {
      id: 'cases',
      title: 'Cases',
      items: [
        { id: 'all-cases', label: 'All Cases', icon: FolderOpen, action: 'all-cases' },
        { id: 'active', label: 'Active Cases', icon: Activity, action: 'active-cases' },
        { id: 'archived', label: 'Archived', icon: Package, action: 'archived' },
      ]
    },
    {
      id: 'documents',
      title: 'Documents',
      items: [
        { id: 'contracts', label: 'Contracts', icon: FileText, action: 'contracts' },
        { id: 'templates', label: 'Templates', icon: Layout, action: 'templates' },
        { id: 'drafts', label: 'Drafts', icon: PenTool, action: 'drafts' },
      ]
    },
    {
      id: 'research',
      title: 'Research',
      items: [
        { id: 'case-law', label: 'Case Law', icon: Search, action: 'case-law' },
        { id: 'statutes', label: 'Statutes', icon: BookOpen, action: 'statutes' },
      ]
    },
    {
      id: 'settings',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, action: 'settings' },
      ]
    }
  ]
};

// Generic/Default Workspace Sidebar
export const defaultSidebar: WorkspaceSidebarConfig = {
  sections: [
    {
      id: 'main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Home, action: 'dashboard' },
      ]
    },
    {
      id: 'workspace',
      title: 'Workspace',
      items: [
        { id: 'editor', label: 'Editor', icon: Code, action: 'editor' },
        { id: 'terminal', label: 'Terminal', icon: Terminal, action: 'terminal' },
        { id: 'preview', label: 'Preview', icon: Eye, action: 'preview' },
      ]
    },
    {
      id: 'files',
      title: 'Files',
      items: [
        { id: 'my-files', label: 'My Files', icon: FolderOpen, action: 'my-files' },
        { id: 'import', label: 'Import', icon: Package, action: 'import' },
      ]
    },
    {
      id: 'settings',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, action: 'settings' },
      ]
    }
  ]
};

// Map workspace category to sidebar config
export const workspaceSidebars: Record<string, WorkspaceSidebarConfig> = {
  'cybersecurity': cybersecuritySidebar,
  'software-dev': softwareDevSidebar,
  'book-writing': bookWritingSidebar,
  'data-analysis': dataAnalysisSidebar,
  'healthcare': healthcareSidebar,
  'legal': legalSidebar,
  // Add more as needed
};

// Get sidebar config for a workspace, fallback to default
export function getSidebarConfig(workspace: string): WorkspaceSidebarConfig {
  return workspaceSidebars[workspace] || defaultSidebar;
}
