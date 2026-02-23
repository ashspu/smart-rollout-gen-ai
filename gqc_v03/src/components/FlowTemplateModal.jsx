import { useState, useEffect } from 'react';
import {
  X, ChevronRight, Zap, RefreshCw, Shield, Radio, AlertTriangle, Target, MapPin, User, DollarSign, Plus, Wrench, Building2, FlaskConical, AlertOctagon, Check,
  LayoutDashboard, GitBranch, Users, Receipt, TrendingUp, Bell, BarChart3, Sparkles, Bookmark, Trash2
} from 'lucide-react';

export default function FlowTemplateModal({ isOpen, onClose, onSelectTemplate }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [customTemplates, setCustomTemplates] = useState([]);

  // Load custom templates from localStorage on mount
  useEffect(() => {
    if (!isOpen) return;
    try {
      const stored = JSON.parse(localStorage.getItem('smartrollout_custom_templates') || '[]');
      setCustomTemplates(stored);
    } catch { setCustomTemplates([]); }
  }, [isOpen]);

  const templates = [
    {
      id: 'initial-ami',
      name: 'Initial AMI Rollout',
      description: 'First-time replacement of legacy/manual meters with smart meters.',
      icon: Zap,
      color: '#3b82f6',
      category: 'deployment',
      complexity: 'high',
      phases: ['identify', 'engage', 'deploy', 'activate', 'billing'],
      typicalDuration: '18-36 months',
      typicalVolume: '500K - 2M meters',
    },
    {
      id: 'tech-refresh',
      name: 'AMI Technology Refresh',
      subtitle: 'AMI 1.0 → AMI 2.0',
      description: 'Replacing aging smart meters due to obsolescence, failure curves, or vendor EOL.',
      icon: RefreshCw,
      color: '#8b5cf6',
      category: 'refresh',
      complexity: 'medium',
      phases: ['identify', 'prioritize', 'deploy', 'activate', 'validate'],
      typicalDuration: '12-24 months',
      typicalVolume: '100K - 500K meters',
    },
    {
      id: 'regulatory',
      name: 'Regulatory-Driven Exchange',
      description: 'Mandated replacements (accuracy standards, safety recalls, compliance deadlines).',
      icon: Shield,
      color: '#ef4444',
      category: 'compliance',
      complexity: 'high',
      phases: ['identify', 'notify', 'schedule', 'deploy', 'certify', 'report'],
      typicalDuration: '6-18 months',
      typicalVolume: 'Varies by mandate',
    },
    {
      id: 'rts-phaseout',
      name: 'RTS / Legacy Tech Phase-Out',
      description: 'Targeted replacement of meters dependent on retired infrastructure or signals.',
      icon: Radio,
      color: '#f59e0b',
      category: 'refresh',
      complexity: 'medium',
      phases: ['identify', 'schedule', 'deploy', 'activate', 'decommission'],
      typicalDuration: '12-18 months',
      typicalVolume: '50K - 200K meters',
    },
    {
      id: 'failure-driven',
      name: 'Failure-Driven Replacement',
      description: 'Reactive or semi-planned swaps based on rising device failure rates.',
      icon: AlertTriangle,
      color: '#ef4444',
      category: 'maintenance',
      complexity: 'low',
      phases: ['detect', 'triage', 'dispatch', 'replace', 'validate'],
      typicalDuration: 'Ongoing',
      typicalVolume: '1-5% annually',
    },
    {
      id: 'targeted-cohort',
      name: 'Targeted Cohort Replacement',
      description: 'Specific meter models, firmware versions, or vendors replaced due to systemic issues.',
      icon: Target,
      color: '#ec4899',
      category: 'maintenance',
      complexity: 'medium',
      phases: ['identify', 'validate', 'schedule', 'deploy', 'verify'],
      typicalDuration: '6-12 months',
      typicalVolume: '10K - 100K meters',
    },
    {
      id: 'geographic',
      name: 'Geographic / Region-Based Rollout',
      description: 'Area-by-area deployment driven by logistics, network readiness, or regulation.',
      icon: MapPin,
      color: '#22c55e',
      category: 'deployment',
      complexity: 'high',
      phases: ['plan', 'notify', 'deploy-wave', 'activate', 'billing'],
      typicalDuration: '24-48 months',
      typicalVolume: 'Region-dependent',
    },
    {
      id: 'customer-initiated',
      name: 'Customer-Initiated Exchange',
      description: 'Opt-in smart meters, tariff changes, or customer complaints triggering swaps.',
      icon: User,
      color: '#06b6d4',
      category: 'customer',
      complexity: 'low',
      phases: ['request', 'validate', 'schedule', 'deploy', 'activate'],
      typicalDuration: 'On-demand',
      typicalVolume: '100 - 1K/month',
    },
    {
      id: 'tariff-enablement',
      name: 'Tariff-Enablement Rollout',
      description: 'Meter upgrades required to support TOU, dynamic pricing, export, or EV tariffs.',
      icon: DollarSign,
      color: '#10b981',
      category: 'customer',
      complexity: 'medium',
      phases: ['identify', 'notify', 'consent', 'deploy', 'configure', 'billing'],
      typicalDuration: '6-12 months',
      typicalVolume: '10K - 50K meters',
    },
    {
      id: 'new-service',
      name: 'New Service / New Connection',
      description: 'Smart meters installed as part of service activation rather than replacement.',
      icon: Plus,
      color: '#3b82f6',
      category: 'deployment',
      complexity: 'low',
      phases: ['application', 'provision', 'install', 'activate', 'billing'],
      typicalDuration: 'Ongoing',
      typicalVolume: '1-3% growth/year',
    },
    {
      id: 'mass-maintenance',
      name: 'Mass Maintenance / Asset Health',
      description: 'Proactive replacement based on age, condition, or predicted failure risk.',
      icon: Wrench,
      color: '#f97316',
      category: 'maintenance',
      complexity: 'medium',
      phases: ['analyze', 'prioritize', 'schedule', 'deploy', 'validate'],
      typicalDuration: '12-24 months',
      typicalVolume: '50K - 200K meters',
    },
    {
      id: 'vendor-transition',
      name: 'Vendor Transition Program',
      description: 'Meter swaps driven by supplier change or contract exit.',
      icon: Building2,
      color: '#6366f1',
      category: 'refresh',
      complexity: 'high',
      phases: ['plan', 'procure', 'deploy', 'migrate', 'decommission'],
      typicalDuration: '18-36 months',
      typicalVolume: 'Contract-dependent',
    },
    {
      id: 'pilot',
      name: 'Pilot / Proof-of-Concept',
      description: 'Limited deployments to validate technology, vendors, or operating models.',
      icon: FlaskConical,
      color: '#a855f7',
      category: 'pilot',
      complexity: 'low',
      phases: ['design', 'select', 'deploy', 'monitor', 'evaluate'],
      typicalDuration: '3-6 months',
      typicalVolume: '100 - 5K meters',
    },
    {
      id: 'post-incident',
      name: 'Post-Incident Remediation',
      description: 'Accelerated rollouts following billing failures, outages, or regulatory findings.',
      icon: AlertOctagon,
      color: '#dc2626',
      category: 'compliance',
      complexity: 'high',
      phases: ['assess', 'prioritize', 'remediate', 'verify', 'report'],
      typicalDuration: '3-12 months',
      typicalVolume: 'Incident-dependent',
    },
  ];

  const categories = [
    { id: 'deployment', name: 'Major Deployments', color: '#3b82f6' },
    { id: 'refresh', name: 'Technology Refresh', color: '#8b5cf6' },
    { id: 'maintenance', name: 'Maintenance & Failures', color: '#f97316' },
    { id: 'customer', name: 'Customer-Driven', color: '#06b6d4' },
    { id: 'compliance', name: 'Compliance & Regulatory', color: '#ef4444' },
    { id: 'pilot', name: 'Pilots & POCs', color: '#a855f7' },
  ];

  const handleContinue = () => {
    if (!selectedTemplate) return;
    if (selectedTemplate._custom) {
      // Custom template — pass the full template object
      onSelectTemplate({ type: 'custom', template: selectedTemplate._templateData });
    } else {
      // Built-in template — pass the ID
      onSelectTemplate({ type: 'builtIn', id: selectedTemplate.id });
    }
  };

  const deleteCustomTemplate = (templateId) => {
    const updated = customTemplates.filter(t => t.id !== templateId && t.templateId !== templateId);
    setCustomTemplates(updated);
    localStorage.setItem('smartrollout_custom_templates', JSON.stringify(updated));
    if (selectedTemplate?._templateData?.id === templateId || selectedTemplate?._templateData?.templateId === templateId) {
      setSelectedTemplate(null);
    }
  };

  if (!isOpen) return null;

  const displayTemplate = hoveredTemplate || selectedTemplate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[90vh] max-w-[1400px] flex overflow-hidden">
        
        {/* Left: Template Grid */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Pick a Meter Program Template</h2>
                <p className="text-sm text-slate-500">Choose the rollout type that matches your program</p>
              </div>
            </div>
          </div>

          {/* Template Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplate?.id === template.id;
                
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    onMouseEnter={() => setHoveredTemplate(template)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                    className={`relative text-left p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                    
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${template.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: template.color }} />
                    </div>
                    
                    <h3 className="font-semibold text-slate-800 text-sm mb-1 pr-6">
                      {template.name}
                    </h3>
                    {template.subtitle && (
                      <div className="text-xs font-medium mb-1" style={{ color: template.color }}>
                        {template.subtitle}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <span 
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: `${template.color}15`,
                          color: template.color 
                        }}
                      >
                        {template.complexity} complexity
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* My Templates — from localStorage */}
            {customTemplates.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2">My Templates</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {customTemplates.map((ct) => {
                    const templateId = ct.templateId || ct.id;
                    const phaseCount = ct.phases?.length || 0;
                    const stepCount = ct.phases?.reduce((sum, p) => sum + (p.steps?.length || 0), 0) || 0;
                    const color = ct.phases?.[0]?.color || '#6366f1';
                    // Build a selectable object that mirrors built-in templates for the detail panel
                    const selectableTemplate = {
                      id: templateId,
                      name: ct.name,
                      description: ct.description || 'Custom template',
                      icon: Bookmark,
                      color,
                      category: 'custom',
                      complexity: 'custom',
                      phases: ct.phases?.map(p => p.shortName?.toLowerCase() || p.id) || [],
                      typicalDuration: 'Custom',
                      typicalVolume: `${stepCount} steps`,
                      _custom: true,
                      _templateData: ct,
                    };
                    const isSelected = selectedTemplate?.id === templateId;

                    return (
                      <button
                        key={templateId}
                        onClick={() => setSelectedTemplate(selectableTemplate)}
                        onMouseEnter={() => setHoveredTemplate(selectableTemplate)}
                        onMouseLeave={() => setHoveredTemplate(null)}
                        className={`relative text-left p-5 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}

                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteCustomTemplate(templateId); }}
                          className="absolute top-3 right-3 p-1 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ opacity: isSelected ? 0 : undefined }}
                          title="Delete template"
                        >
                          {!isSelected && <Trash2 className="w-3.5 h-3.5 text-red-400" />}
                        </button>

                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Bookmark className="w-5 h-5" style={{ color }} />
                        </div>

                        <h3 className="font-semibold text-slate-800 text-sm mb-1 pr-6">
                          {ct.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {ct.description || 'Custom template'}
                        </p>

                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {phaseCount} phases
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {stepCount} steps
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!selectedTemplate}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                selectedTemplate
                  ? 'bg-slate-800 text-white hover:bg-slate-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Continue to Flow Definition
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Template Details */}
        <div className="w-96 border-l border-slate-200 bg-slate-50 flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Template Details</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {displayTemplate ? (
            <div className="flex-1 overflow-y-auto p-6">
              {/* Template Header */}
              <div className="mb-6">
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${displayTemplate.color}15` }}
                >
                  <displayTemplate.icon className="w-7 h-7" style={{ color: displayTemplate.color }} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{displayTemplate.name}</h3>
                {displayTemplate.subtitle && (
                  <div className="text-sm font-medium mb-2" style={{ color: displayTemplate.color }}>
                    {displayTemplate.subtitle}
                  </div>
                )}
                <p className="text-sm text-slate-600">{displayTemplate.description}</p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Duration</div>
                  <div className="text-sm font-bold text-slate-800">{displayTemplate.typicalDuration}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Volume</div>
                  <div className="text-sm font-bold text-slate-800">{displayTemplate.typicalVolume}</div>
                </div>
              </div>

              {/* Phases */}
              <div className="mb-6">
                <div className="text-[10px] text-slate-400 uppercase font-semibold mb-3">Default Phases</div>
                <div className="space-y-2">
                  {displayTemplate.phases.map((phase, idx) => (
                    <div key={phase} className="flex items-center gap-3">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: displayTemplate.color }}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-sm text-slate-700 capitalize">{phase.replace('-', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <div className="text-[10px] text-slate-400 uppercase font-semibold mb-2">Category</div>
                <span 
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full"
                  style={{ 
                    backgroundColor: `${displayTemplate.color}15`,
                    color: displayTemplate.color 
                  }}
                >
                  {categories.find(c => c.id === displayTemplate.category)?.name}
                </span>
              </div>

              {/* What gets generated */}
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-4">What Gets Generated</div>
                
                {/* Orchestration */}
                <div className="mb-4">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-2">Orchestration</div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                      <span>AWS Step Functions state machine</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-slate-400" />
                      <span>API endpoints for system integrations</span>
                    </div>
                  </div>
                </div>

                {/* Process Intelligence */}
                <div className="mb-4">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-2">Process Intelligence</div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Celonis process model & event definitions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                      <span>Conformance rules & deviation detection</span>
                    </div>
                  </div>
                </div>

                {/* AI-Powered Dashboard */}
                <div className="mb-4">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-2">AI-Powered Dashboard</div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                      <span>Real-time deployment progress tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Customer impact surface monitoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-slate-400" />
                      <span>Billing accuracy & first-bill readiness</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-slate-400" />
                      <span>Proactive alerts & exception handling</span>
                    </div>
                  </div>
                </div>

                {/* Business Value */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mb-2">Benefit Realization</div>
                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                      <span>End-to-end program visibility</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-slate-400" />
                      <span>Business case tracking & ROI metrics</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">Select a template to see details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
