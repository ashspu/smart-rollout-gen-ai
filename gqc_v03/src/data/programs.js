import { meterProgramTemplates, templateToFlowDefinition } from './meterProgramTemplates';

// Flow definitions for demo programs (mapped from templates)
export const demoFlowDefinitions = {
  'peco-ami-2': templateToFlowDefinition(meterProgramTemplates['initial-ami']),
  'peco-periodic-test': templateToFlowDefinition(meterProgramTemplates['mass-maintenance']),
  'peco-reg-exchange': templateToFlowDefinition(meterProgramTemplates['regulatory']),
};

// Available Meter Management Programs
export const programs = [
  {
    id: 'peco-ami-2',
    name: 'AMI 2.0 Replacement',
    utility: 'PECO Energy',
    type: 'AMI Rollout',
    status: 'active',
    meters: 1720000,
    complete: 438000,
    health: 'on-track',
    startDate: '2025-01-01',
  },
  {
    id: 'peco-periodic-test',
    name: 'Periodic Meter Testing',
    utility: 'PECO Energy',
    type: 'Test Cycle',
    status: 'active',
    meters: 340000,
    complete: 89000,
    health: 'at-risk',
    startDate: '2025-03-01',
  },
  {
    id: 'peco-reg-exchange',
    name: 'Regulatory Exchange 2026',
    utility: 'PECO Energy',
    type: 'Regulatory',
    status: 'planned',
    meters: 125000,
    complete: 0,
    health: 'not-started',
    startDate: '2026-06-01',
  },
];

// Detailed program data for AMI 2.0
export const amiProgram = {
  id: 'peco-ami-2',
  name: 'AMI 2.0 Replacement',
  utility: 'PECO Energy',
  region: 'Southeast Pennsylvania',
  totalMeters: 1720000,
  day: 395,
  
  // Summary stats
  summary: {
    complete: 438000,
    inProgress: 68700,
    exceptions: 8300,
    notStarted: 1205000,
  },

  // Weekly completion data - UNEVEN to show challenges
  weeklyData: [
    { week: 'W1', target: 8500, actual: 9200, exceptions: 180 },
    { week: 'W2', target: 8500, actual: 8900, exceptions: 210 },
    { week: 'W3', target: 8500, actual: 8100, exceptions: 340 },
    { week: 'W4', target: 8500, actual: 7200, exceptions: 520 },  // Holiday week
    { week: 'W5', target: 8500, actual: 8800, exceptions: 190 },
    { week: 'W6', target: 8500, actual: 6100, exceptions: 890 },  // Weather event
    { week: 'W7', target: 8500, actual: 9100, exceptions: 220 },
    { week: 'W8', target: 8500, actual: 8400, exceptions: 310 },
    { week: 'W9', target: 8500, actual: 5800, exceptions: 1100 }, // Access issues spike
    { week: 'W10', target: 8500, actual: 7900, exceptions: 440 },
    { week: 'W11', target: 8500, actual: 8200, exceptions: 280 },
    { week: 'W12', target: 8500, actual: 8600, exceptions: 250 },
  ],

  // Process steps (AWS Step Functions style)
  processSteps: [
    { 
      id: 'identify', 
      name: 'Identify', 
      count: 1205000, 
      description: 'Meters identified for replacement',
      avgDuration: null,
    },
    { 
      id: 'schedule', 
      name: 'Schedule', 
      count: 48000, 
      description: 'Appointment scheduled with customer',
      avgDuration: '3.2 days',
    },
    { 
      id: 'dispatch', 
      name: 'Dispatch', 
      count: 12500, 
      description: 'Work order dispatched to field',
      avgDuration: '0.5 days',
    },
    { 
      id: 'install', 
      name: 'Install', 
      count: 8200, 
      description: 'Field technician on site',
      avgDuration: '0.8 days',
    },
    { 
      id: 'verify', 
      name: 'Verify', 
      count: 8200, 
      description: 'Meter communicating, billing active',
      avgDuration: '1.2 days',
    },
    { 
      id: 'complete', 
      name: 'Complete', 
      count: 438000, 
      description: 'Successfully replaced and verified',
      avgDuration: null,
    },
  ],

  // Exception flows (Celonis-style process variants)
  exceptionFlows: [
    { 
      from: 'Install', 
      to: 'Schedule', 
      reason: 'No Access',
      count: 3200,
      trend: 'up',
      impact: 'Adds 4.5 days avg',
    },
    { 
      from: 'Verify', 
      to: 'Install', 
      reason: 'Comm Failure',
      count: 1800,
      trend: 'stable',
      impact: 'Adds 2.1 days avg',
    },
    { 
      from: 'Install', 
      to: 'Schedule', 
      reason: 'Meter Damage',
      count: 890,
      trend: 'down',
      impact: 'Adds 6.2 days avg',
    },
    { 
      from: 'Dispatch', 
      to: 'Schedule', 
      reason: 'Customer Cancel',
      count: 650,
      trend: 'stable',
      impact: 'Adds 5.8 days avg',
    },
  ],

  // Process intelligence insights
  insights: [
    {
      type: 'bottleneck',
      title: 'Verification bottleneck detected',
      detail: 'Verify step taking 1.2 days avg vs 0.5 day target. 8,200 meters waiting.',
      severity: 'high',
    },
    {
      type: 'pattern',
      title: 'No-access spike in Montgomery County',
      detail: '12% no-access rate vs 6% program average. Concentrated in 3 zip codes.',
      severity: 'medium',
    },
    {
      type: 'forecast',
      title: 'Q2 milestone at risk',
      detail: 'Current trajectory: 91% of Q2 target. Need 15% throughput increase.',
      severity: 'high',
    },
  ],
};
