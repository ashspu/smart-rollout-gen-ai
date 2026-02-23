// PECO AMI 2.0 Rollout Program Definition
// This represents a real program running on the Smart Rollout platform

export const pecoProgram = {
  id: 'peco-ami-2.0',
  name: 'PECO AMI 2.0 Meter Replacement',
  utility: 'PECO Energy',
  region: 'Southeastern Pennsylvania',
  type: 'AMI Rollout',
  status: 'In Progress',
  
  // Program Definition (the control contract)
  definition: {
    programType: 'AMI 2.0 Replacement',
    description: 'Proactive replacement of aging AMI 1.0 meters approaching failure curves before end-of-life',
    
    targetPopulation: {
      total: 1720000,
      scope: 'All residential and small commercial meters',
      selectionCriteria: 'Age-based cohorts prioritized by failure probability',
    },
    
    timeline: {
      start: '2025-01-01',
      plannedEnd: '2029-12-31',
      regulatoryDeadline: '2030-06-30',
      currentPhase: 'Year 1 - High Risk Cohort',
    },
    
    regulatoryCommitments: [
      { milestone: 'Year 1 Complete', target: '2025-12-31', meters: 344000, status: 'on-track' },
      { milestone: 'Year 2 Complete', target: '2026-12-31', meters: 688000, status: 'pending' },
      { milestone: 'Year 3 Complete', target: '2027-12-31', meters: 1032000, status: 'pending' },
      { milestone: 'Year 4 Complete', target: '2028-12-31', meters: 1376000, status: 'pending' },
      { milestone: 'Program Complete', target: '2029-12-31', meters: 1720000, status: 'pending' },
    ],
    
    riskTolerance: {
      maxFailureRate: 0.02, // 2% failure tolerance
      maxUnbilledDays: 3,
      maxRepeatVisits: 0.05, // 5% repeat visit tolerance
      escalationThreshold: 0.15, // 15% behind plan triggers escalation
    },
  },
  
  // Current Program State (lifecycle signals)
  currentState: {
    asOf: '2026-01-30',
    dayInProgram: 395,
    
    // Population breakdown by lifecycle state
    lifecycle: {
      notStarted: 1205000,
      scheduled: 48000,
      inProgress: 12500,
      pendingVerification: 8200,
      complete: 438000,
      failed: 8300,
    },
    
    // Key metrics
    metrics: {
      completionRate: 25.5,
      planVariance: -2.3, // 2.3% behind plan
      firstTimeSuccess: 94.2,
      avgCycleTime: 4.2, // days
      unbilledExposure: 2847000, // dollars
      customersImpacted: 12500,
    },
  },
  
  // Cohort breakdown (age-based risk tiers)
  cohorts: [
    {
      id: 'cohort-a',
      name: '2008-2010 Installs',
      description: 'Highest failure probability - first wave priority',
      size: 285000,
      complete: 248000,
      inProgress: 8500,
      failed: 4200,
      riskLevel: 'critical',
      failureProbability: 0.18,
      status: 'on-track',
    },
    {
      id: 'cohort-b', 
      name: '2011-2012 Installs',
      description: 'Elevated failure risk - second wave',
      size: 342000,
      complete: 156000,
      inProgress: 3200,
      failed: 2800,
      riskLevel: 'high',
      failureProbability: 0.12,
      status: 'at-risk',
    },
    {
      id: 'cohort-c',
      name: '2013-2014 Installs',
      description: 'Moderate risk - third wave',
      size: 398000,
      complete: 34000,
      inProgress: 800,
      failed: 1300,
      riskLevel: 'moderate',
      failureProbability: 0.07,
      status: 'on-track',
    },
    {
      id: 'cohort-d',
      name: '2015-2017 Installs',
      description: 'Lower risk - opportunistic replacement',
      size: 410000,
      complete: 0,
      inProgress: 0,
      failed: 0,
      riskLevel: 'low',
      failureProbability: 0.03,
      status: 'not-started',
    },
    {
      id: 'cohort-e',
      name: '2018-2020 Installs',
      description: 'Lowest risk - end of program',
      size: 285000,
      complete: 0,
      inProgress: 0,
      failed: 0,
      riskLevel: 'minimal',
      failureProbability: 0.01,
      status: 'not-started',
    },
  ],
  
  // Risk signals currently active
  activeRisks: [
    {
      id: 'risk-001',
      type: 'Cohort Delay',
      severity: 'high',
      title: 'Cohort B falling behind schedule',
      description: 'Cohort B (2011-2012 installs) is 8% behind planned completion. Current trajectory misses Q2 milestone.',
      impactedMeters: 27400,
      detectedAt: '2026-01-28',
      recommendation: 'Increase focus on Chester County sub-region where access issues are concentrated.',
    },
    {
      id: 'risk-002',
      type: 'Failure Spike',
      severity: 'medium',
      title: 'Elevated no-access rate in Montgomery County',
      description: 'No-access rate in Montgomery County is 12%, vs 6% program average. 3,200 premises require reschedule.',
      impactedMeters: 3200,
      detectedAt: '2026-01-25',
      recommendation: 'Deploy customer outreach campaign. Consider evening/weekend appointment options.',
    },
    {
      id: 'risk-003',
      type: 'Billing Exposure',
      severity: 'medium',
      title: 'Unbilled exposure approaching threshold',
      description: 'Current unbilled exposure is $2.84M across 12,500 customers. Threshold is $3.5M.',
      impactedMeters: 12500,
      detectedAt: '2026-01-30',
      recommendation: 'Prioritize verification completion for meters in pending state >48 hours.',
    },
  ],
  
  // Regional breakdown
  regions: [
    { name: 'Philadelphia', total: 620000, complete: 158000, rate: 25.5, status: 'on-track' },
    { name: 'Montgomery County', total: 380000, complete: 91000, rate: 23.9, status: 'at-risk' },
    { name: 'Delaware County', total: 290000, complete: 78000, rate: 26.9, status: 'on-track' },
    { name: 'Chester County', total: 245000, complete: 59000, rate: 24.1, status: 'at-risk' },
    { name: 'Bucks County', total: 185000, complete: 52000, rate: 28.1, status: 'ahead' },
  ],
  
  // Benefits realization tracking
  benefits: {
    planned: {
      failuresAvoided: 45000,
      unbilledRevenueProtected: 12500000,
      customerComplaintsAvoided: 8500,
      emergencyDispatchesAvoided: 3200,
    },
    realized: {
      failuresAvoided: 11200,
      unbilledRevenueProtected: 3100000,
      customerComplaintsAvoided: 2100,
      emergencyDispatchesAvoided: 780,
    },
    projected: {
      failuresAvoided: 44200,
      unbilledRevenueProtected: 12100000,
      customerComplaintsAvoided: 8200,
      emergencyDispatchesAvoided: 3050,
    },
  },
};

// Lifecycle states for visualization
export const lifecycleStates = [
  { key: 'notStarted', label: 'Not Started', color: '#64748b' },
  { key: 'scheduled', label: 'Scheduled', color: '#3b82f6' },
  { key: 'inProgress', label: 'In Progress', color: '#8b5cf6' },
  { key: 'pendingVerification', label: 'Pending Verification', color: '#f59e0b' },
  { key: 'complete', label: 'Complete', color: '#10b981' },
  { key: 'failed', label: 'Failed/Exception', color: '#ef4444' },
];

// Historical progress data (for trend charts)
export const progressHistory = [
  { month: 'Jan 25', planned: 28000, actual: 29500 },
  { month: 'Feb 25', planned: 58000, actual: 61000 },
  { month: 'Mar 25', planned: 90000, actual: 94000 },
  { month: 'Apr 25', planned: 124000, actual: 126000 },
  { month: 'May 25', planned: 160000, actual: 158000 },
  { month: 'Jun 25', planned: 198000, actual: 192000 },
  { month: 'Jul 25', planned: 238000, actual: 228000 },
  { month: 'Aug 25', planned: 280000, actual: 268000 },
  { month: 'Sep 25', planned: 324000, actual: 312000 },
  { month: 'Oct 25', planned: 370000, actual: 358000 },
  { month: 'Nov 25', planned: 418000, actual: 402000 },
  { month: 'Dec 25', planned: 468000, actual: 438000 },
  { month: 'Jan 26', planned: 520000, actual: 438000, projected: 465000 },
  { month: 'Feb 26', planned: 574000, projected: 495000 },
  { month: 'Mar 26', planned: 630000, projected: 528000 },
];

// Failure curve data (from PECO research)
export const failureCurveData = [
  { year: 0, rate: 0.001 },
  { year: 1, rate: 0.002 },
  { year: 2, rate: 0.003 },
  { year: 3, rate: 0.005 },
  { year: 4, rate: 0.008 },
  { year: 5, rate: 0.012 },
  { year: 6, rate: 0.018 },
  { year: 7, rate: 0.027 },
  { year: 8, rate: 0.040 },
  { year: 9, rate: 0.058 },
  { year: 10, rate: 0.082 },
  { year: 11, rate: 0.112 },
  { year: 12, rate: 0.148 },
  { year: 13, rate: 0.190 },
  { year: 14, rate: 0.238 },
  { year: 15, rate: 0.292 },
];
