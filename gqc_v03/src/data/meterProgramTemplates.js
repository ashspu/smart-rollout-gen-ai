// Meter Program Templates - Flow Definitions
// Each template has phases and steps tailored to the program type

export const meterProgramTemplates = {
  'initial-ami': {
    id: 'initial-ami',
    name: 'Initial AMI Rollout',
    description: 'First-time replacement of legacy/manual meters with smart meters',
    phases: [
      {
        id: 'identify',
        name: 'Meter Identification',
        shortName: 'IDENTIFY',
        color: '#3b82f6',
        light: '#eff6ff',
        icon: '🎯',
        steps: [
          { id: 'cohort-select', name: 'Select Cohort', enabled: true, detail: 'Define meter population by geography, age, or route' },
          { id: 'validate-eligibility', name: 'Validate Eligibility', enabled: true, detail: 'Check opt-out list, DNI list, special conditions' },
          { id: 'prioritize', name: 'Prioritize Wave', enabled: true, detail: 'Assign to deployment wave based on logistics' },
        ]
      },
      {
        id: 'engage',
        name: 'Customer Engagement',
        shortName: 'ENGAGE',
        color: '#06b6d4',
        light: '#ecfeff',
        icon: '📬',
        steps: [
          { id: 'notify-advance', name: 'Advance Notice', enabled: true, detail: '30-day advance notification letter/email' },
          { id: 'schedule-appt', name: 'Schedule Appointment', enabled: true, detail: 'Customer self-schedule or auto-assign' },
          { id: 'remind', name: 'Send Reminder', enabled: true, detail: '48-hour appointment reminder' },
          { id: 'confirm', name: 'Customer Confirms', enabled: true, detail: 'Customer acknowledgment or reschedule' },
        ]
      },
      {
        id: 'deploy',
        name: 'Field Deployment',
        shortName: 'DEPLOY',
        color: '#8b5cf6',
        light: '#f5f3ff',
        icon: '🚛',
        steps: [
          { id: 'dispatch', name: 'Dispatch Crew', enabled: true, detail: 'Assign installer and route' },
          { id: 'arrive', name: 'Arrive On-Site', enabled: true, detail: 'GPS confirmation, customer present check' },
          { id: 'access', name: 'Gain Access', enabled: true, detail: 'Verify meter location, check base condition' },
          { id: 'final-read', name: 'Final Read', enabled: true, detail: 'Capture final read from legacy meter' },
          { id: 'meter-swap', name: 'Meter Swap', enabled: true, detail: 'Remove old meter, install new AMI meter' },
          { id: 'verify-install', name: 'Verify Install', enabled: true, detail: 'Physical QC, photo documentation' },
        ]
      },
      {
        id: 'activate',
        name: 'AMI Activation',
        shortName: 'ACTIVATE',
        color: '#f59e0b',
        light: '#fffbeb',
        steps: [
          { id: 'register-hes', name: 'Register in HES', enabled: true, detail: 'Head-end system registration' },
          { id: 'commission', name: 'Commission Meter', enabled: true, detail: 'Network join, signal verification' },
          { id: 'first-read', name: 'First Read Check', enabled: true, detail: 'Validate first interval data received' },
          { id: 'mdm-validate', name: 'MDM Validation', enabled: true, detail: 'VEE processing, data quality check' },
        ]
      },
      {
        id: 'customer-impact',
        name: 'Customer Impact',
        shortName: 'CUSTOMER IMPACT',
        color: '#059669',
        light: '#ecfdf5',
        steps: [
          { id: 'update-cis', name: 'Update CIS', enabled: true, detail: 'Link new meter to customer account' },
          { id: 'prorate-bill', name: 'Prorate Billing', enabled: true, detail: 'Calculate final/initial bill periods' },
          { id: 'assign-tariff', name: 'Assign Tariff', enabled: true, detail: 'Apply appropriate rate structure' },
          { id: 'first-bill', name: 'First Bill', enabled: true, milestone: true, detail: 'Generate first bill on new meter' },
        ]
      }
    ]
  },

  'tech-refresh': {
    id: 'tech-refresh',
    name: 'AMI Technology Refresh',
    description: 'Replacing aging smart meters (AMI 1.0 → AMI 2.0)',
    phases: [
      {
        id: 'identify',
        name: 'Asset Identification',
        shortName: 'IDENTIFY',
        color: '#8b5cf6',
        light: '#f5f3ff',
        icon: '🔍',
        steps: [
          { id: 'failure-analysis', name: 'Failure Analysis', enabled: true, detail: 'Identify meters on failure curve' },
          { id: 'eol-check', name: 'EOL/Obsolescence Check', enabled: true, detail: 'Flag vendor EOL or parts shortage' },
          { id: 'prioritize-risk', name: 'Risk Prioritization', enabled: true, detail: 'Rank by failure probability' },
        ]
      },
      {
        id: 'prioritize',
        name: 'Wave Planning',
        shortName: 'PRIORITIZE',
        color: '#3b82f6',
        light: '#eff6ff',
        icon: '📊',
        steps: [
          { id: 'group-cohorts', name: 'Group Cohorts', enabled: true, detail: 'Batch by model, firmware, location' },
          { id: 'sequence-waves', name: 'Sequence Waves', enabled: true, detail: 'Plan deployment order' },
          { id: 'allocate-inventory', name: 'Allocate Inventory', enabled: true, detail: 'Reserve replacement meters' },
        ]
      },
      {
        id: 'deploy',
        name: 'Field Deployment',
        shortName: 'DEPLOY',
        color: '#f59e0b',
        light: '#fffbeb',
        icon: '🚛',
        steps: [
          { id: 'schedule', name: 'Schedule Install', enabled: true, detail: 'Appointment or drive-by' },
          { id: 'dispatch', name: 'Dispatch Crew', enabled: true, detail: 'Assign technician' },
          { id: 'swap-meter', name: 'Swap Meter', enabled: true, detail: 'AMI 1.0 out, AMI 2.0 in' },
          { id: 'verify', name: 'Verify Install', enabled: true, detail: 'Physical inspection' },
        ]
      },
      {
        id: 'activate',
        name: 'Network Activation',
        shortName: 'ACTIVATE',
        color: '#22c55e',
        light: '#f0fdf4',
        icon: '📡',
        steps: [
          { id: 'decommission-old', name: 'Decommission Old', enabled: true, detail: 'Remove from AMI 1.0 network' },
          { id: 'register-new', name: 'Register New', enabled: true, detail: 'Add to AMI 2.0 head-end' },
          { id: 'commission', name: 'Commission', enabled: true, detail: 'Network join, firmware check' },
          { id: 'validate-comms', name: 'Validate Comms', enabled: true, detail: 'Confirm data flow' },
        ]
      },
      {
        id: 'validate',
        name: 'Data Validation',
        shortName: 'VALIDATE',
        color: '#ec4899',
        light: '#fdf2f8',
        icon: '✅',
        steps: [
          { id: 'compare-reads', name: 'Compare Reads', enabled: true, detail: 'Validate continuity with old meter' },
          { id: 'mdm-sync', name: 'MDM Sync', enabled: true, detail: 'Ensure MDM updated' },
          { id: 'billing-verify', name: 'Billing Verify', enabled: true, milestone: true, detail: 'Confirm billing uninterrupted' },
        ]
      }
    ]
  },

  'regulatory': {
    id: 'regulatory',
    name: 'Regulatory-Driven Exchange',
    description: 'Mandated replacements for compliance',
    phases: [
      {
        id: 'identify',
        name: 'Scope Definition',
        shortName: 'IDENTIFY',
        color: '#ef4444',
        light: '#fef2f2',
        icon: '📋',
        steps: [
          { id: 'mandate-review', name: 'Review Mandate', enabled: true, detail: 'Understand regulatory requirement' },
          { id: 'affected-meters', name: 'Identify Affected', enabled: true, detail: 'Query meters in scope' },
          { id: 'deadline-plan', name: 'Deadline Planning', enabled: true, detail: 'Map to compliance timeline' },
        ]
      },
      {
        id: 'notify',
        name: 'Regulatory Notification',
        shortName: 'NOTIFY',
        color: '#f59e0b',
        light: '#fffbeb',
        icon: '📣',
        steps: [
          { id: 'customer-notice', name: 'Customer Notice', enabled: true, detail: 'Mandatory disclosure letter' },
          { id: 'regulator-filing', name: 'Regulator Filing', enabled: true, detail: 'File compliance plan' },
          { id: 'media-comms', name: 'Public Comms', enabled: false, detail: 'Press release if required' },
        ]
      },
      {
        id: 'schedule',
        name: 'Scheduling',
        shortName: 'SCHEDULE',
        color: '#3b82f6',
        light: '#eff6ff',
        icon: '📅',
        steps: [
          { id: 'appt-windows', name: 'Create Windows', enabled: true, detail: 'Define appointment slots' },
          { id: 'customer-book', name: 'Customer Booking', enabled: true, detail: 'Self-schedule or assign' },
          { id: 'escalation', name: 'Non-Response Escalation', enabled: true, detail: 'Follow up on no-response' },
        ]
      },
      {
        id: 'deploy',
        name: 'Field Deployment',
        shortName: 'DEPLOY',
        color: '#8b5cf6',
        light: '#f5f3ff',
        icon: '🚛',
        steps: [
          { id: 'dispatch', name: 'Dispatch', enabled: true, detail: 'Send certified technician' },
          { id: 'swap', name: 'Meter Exchange', enabled: true, detail: 'Replace non-compliant meter' },
          { id: 'document', name: 'Documentation', enabled: true, detail: 'Capture proof of replacement' },
        ]
      },
      {
        id: 'certify',
        name: 'Certification',
        shortName: 'CERTIFY',
        color: '#22c55e',
        light: '#f0fdf4',
        icon: '🏆',
        steps: [
          { id: 'meter-cert', name: 'Meter Certification', enabled: true, detail: 'Verify meter meets standard' },
          { id: 'accuracy-test', name: 'Accuracy Test', enabled: true, detail: 'Run accuracy verification' },
          { id: 'seal-record', name: 'Seal & Record', enabled: true, detail: 'Apply seal, log serial' },
        ]
      },
      {
        id: 'report',
        name: 'Compliance Reporting',
        shortName: 'REPORT',
        color: '#ec4899',
        light: '#fdf2f8',
        icon: '📊',
        steps: [
          { id: 'progress-report', name: 'Progress Report', enabled: true, detail: 'Submit periodic updates' },
          { id: 'final-attestation', name: 'Final Attestation', enabled: true, milestone: true, detail: 'Certify program complete' },
        ]
      }
    ]
  },

  'failure-driven': {
    id: 'failure-driven',
    name: 'Failure-Driven Replacement',
    description: 'Reactive swaps based on device failures',
    phases: [
      {
        id: 'detect',
        name: 'Failure Detection',
        shortName: 'DETECT',
        color: '#ef4444',
        light: '#fef2f2',
        icon: '🚨',
        steps: [
          { id: 'alarm-receive', name: 'Receive Alarm', enabled: true, detail: 'AMI/MDM failure alert' },
          { id: 'customer-report', name: 'Customer Report', enabled: true, detail: 'Customer complaint intake' },
          { id: 'billing-anomaly', name: 'Billing Anomaly', enabled: true, detail: 'Zero/high usage flag' },
        ]
      },
      {
        id: 'triage',
        name: 'Triage & Diagnosis',
        shortName: 'TRIAGE',
        color: '#f59e0b',
        light: '#fffbeb',
        icon: '🔬',
        steps: [
          { id: 'remote-diag', name: 'Remote Diagnosis', enabled: true, detail: 'Ping, firmware check, reboot' },
          { id: 'classify-failure', name: 'Classify Failure', enabled: true, detail: 'Comm, display, accuracy, tamper' },
          { id: 'repair-or-replace', name: 'Repair vs Replace', enabled: true, detail: 'Decision point' },
        ]
      },
      {
        id: 'dispatch',
        name: 'Field Dispatch',
        shortName: 'DISPATCH',
        color: '#3b82f6',
        light: '#eff6ff',
        icon: '🚛',
        steps: [
          { id: 'create-order', name: 'Create Work Order', enabled: true, detail: 'WFM job creation' },
          { id: 'assign-tech', name: 'Assign Technician', enabled: true, detail: 'Route to available crew' },
          { id: 'customer-notify', name: 'Notify Customer', enabled: true, detail: 'Appointment confirmation' },
        ]
      },
      {
        id: 'replace',
        name: 'Replacement',
        shortName: 'REPLACE',
        color: '#8b5cf6',
        light: '#f5f3ff',
        icon: '🔧',
        steps: [
          { id: 'site-arrival', name: 'Arrive On-Site', enabled: true, detail: 'GPS check-in' },
          { id: 'swap-meter', name: 'Swap Meter', enabled: true, detail: 'Replace failed unit' },
          { id: 'commission', name: 'Commission', enabled: true, detail: 'Network join' },
        ]
      },
      {
        id: 'validate',
        name: 'Validation',
        shortName: 'VALIDATE',
        color: '#22c55e',
        light: '#f0fdf4',
        icon: '✅',
        steps: [
          { id: 'first-read', name: 'First Read', enabled: true, detail: 'Confirm data flowing' },
          { id: 'close-ticket', name: 'Close Ticket', enabled: true, milestone: true, detail: 'Resolve work order' },
        ]
      }
    ]
  },

  'customer-initiated': {
    id: 'customer-initiated',
    name: 'Customer-Initiated Exchange',
    description: 'Opt-in or complaint-driven meter swaps',
    phases: [
      {
        id: 'request',
        name: 'Customer Request',
        shortName: 'REQUEST',
        color: '#06b6d4',
        light: '#ecfeff',
        icon: '📞',
        steps: [
          { id: 'intake', name: 'Request Intake', enabled: true, detail: 'Web, phone, or in-person' },
          { id: 'reason-capture', name: 'Capture Reason', enabled: true, detail: 'Opt-in, complaint, tariff change' },
          { id: 'create-case', name: 'Create Case', enabled: true, detail: 'CRM case logging' },
        ]
      },
      {
        id: 'validate',
        name: 'Eligibility Check',
        shortName: 'VALIDATE',
        color: '#f59e0b',
        light: '#fffbeb',
        icon: '✅',
        steps: [
          { id: 'eligibility', name: 'Check Eligibility', enabled: true, detail: 'Account status, meter type' },
          { id: 'fee-check', name: 'Fee Assessment', enabled: true, detail: 'Determine if fee applies' },
          { id: 'approval', name: 'Approve Request', enabled: true, detail: 'Authorize exchange' },
        ]
      },
      {
        id: 'schedule',
        name: 'Scheduling',
        shortName: 'SCHEDULE',
        color: '#3b82f6',
        light: '#eff6ff',
        icon: '📅',
        steps: [
          { id: 'offer-slots', name: 'Offer Slots', enabled: true, detail: 'Present available times' },
          { id: 'customer-select', name: 'Customer Selects', enabled: true, detail: 'Book appointment' },
          { id: 'confirm', name: 'Confirm Appt', enabled: true, detail: 'Send confirmation' },
        ]
      },
      {
        id: 'deploy',
        name: 'Field Deployment',
        shortName: 'DEPLOY',
        color: '#8b5cf6',
        light: '#f5f3ff',
        icon: '🚛',
        steps: [
          { id: 'dispatch', name: 'Dispatch', enabled: true, detail: 'Assign technician' },
          { id: 'swap', name: 'Meter Swap', enabled: true, detail: 'Install requested meter' },
          { id: 'walkthrough', name: 'Customer Walkthrough', enabled: true, detail: 'Explain new features' },
        ]
      },
      {
        id: 'activate',
        name: 'Activation & Billing',
        shortName: 'ACTIVATE',
        color: '#22c55e',
        light: '#f0fdf4',
        icon: '📡',
        steps: [
          { id: 'commission', name: 'Commission', enabled: true, detail: 'Network registration' },
          { id: 'update-account', name: 'Update Account', enabled: true, detail: 'CIS changes' },
          { id: 'close-case', name: 'Close Case', enabled: true, milestone: true, detail: 'Resolve customer request' },
        ]
      }
    ]
  },

  'tariff-enablement': {
    id: 'tariff-enablement',
    name: 'Tariff-Enablement Rollout',
    description: 'Meter upgrades for TOU, dynamic pricing, or EV tariffs',
    phases: [
      {
        id: 'identify',
        name: 'Customer Identification',
        shortName: 'IDENTIFY',
        color: '#10b981',
        light: '#ecfdf5',
        icon: '🎯',
        steps: [
          { id: 'tariff-eligible', name: 'Tariff Eligibility', enabled: true, detail: 'Customers eligible for new rate' },
          { id: 'meter-capable', name: 'Meter Capability Check', enabled: true, detail: 'Current meter supports tariff?' },
          { id: 'upgrade-list', name: 'Build Upgrade List', enabled: true, detail: 'Meters needing replacement' },
        ]
      },
      {
        id: 'notify',
        name: 'Customer Outreach',
        shortName: 'NOTIFY',
        color: '#06b6d4',
        light: '#ecfeff',
        icon: '📬',
        steps: [
          { id: 'tariff-explain', name: 'Explain Tariff', enabled: true, detail: 'Benefits, requirements' },
          { id: 'opt-in', name: 'Collect Opt-In', enabled: true, detail: 'Customer consent' },
          { id: 'schedule-offer', name: 'Offer Schedule', enabled: true, detail: 'Installation options' },
        ]
      },
      {
        id: 'consent',
        name: 'Consent & Enrollment',
        shortName: 'CONSENT',
        color: '#f59e0b',
        light: '#fffbeb',
        icon: '✍️',
        steps: [
          { id: 'terms-accept', name: 'Accept Terms', enabled: true, detail: 'Rate agreement signature' },
          { id: 'enroll', name: 'Enroll in Tariff', enabled: true, detail: 'CIS enrollment' },
          { id: 'schedule-confirm', name: 'Confirm Install', enabled: true, detail: 'Lock installation date' },
        ]
      },
      {
        id: 'deploy',
        name: 'Meter Deployment',
        shortName: 'DEPLOY',
        color: '#8b5cf6',
        light: '#f5f3ff',
        icon: '🚛',
        steps: [
          { id: 'dispatch', name: 'Dispatch', enabled: true, detail: 'Assign installer' },
          { id: 'swap', name: 'Meter Swap', enabled: true, detail: 'Install TOU-capable meter' },
          { id: 'verify', name: 'Verify Install', enabled: true, detail: 'Confirm proper setup' },
        ]
      },
      {
        id: 'configure',
        name: 'Tariff Configuration',
        shortName: 'CONFIGURE',
        color: '#3b82f6',
        light: '#eff6ff',
        icon: '⚙️',
        steps: [
          { id: 'program-meter', name: 'Program Meter', enabled: true, detail: 'Set TOU registers' },
          { id: 'mdm-config', name: 'MDM Configuration', enabled: true, detail: 'Interval aggregation rules' },
          { id: 'test-reads', name: 'Test Reads', enabled: true, detail: 'Verify TOU data' },
        ]
      },
      {
        id: 'customer-impact',
        name: 'Customer Impact',
        shortName: 'CUSTOMER IMPACT',
        color: '#059669',
        light: '#ecfdf5',
        steps: [
          { id: 'apply-tariff', name: 'Apply Tariff', enabled: true, detail: 'Switch rate in CIS' },
          { id: 'bill-estimate', name: 'Bill Estimate', enabled: true, detail: 'Project customer bill change' },
          { id: 'first-tou-bill', name: 'First TOU Bill', enabled: true, milestone: true, detail: 'Bill under new rate' },
        ]
      }
    ]
  },

  'pilot': {
    id: 'pilot',
    name: 'Pilot / Proof-of-Concept',
    description: 'Limited deployment to validate technology or process',
    phases: [
      {
        id: 'design',
        name: 'Pilot Design',
        shortName: 'DESIGN',
        color: '#a855f7',
        light: '#faf5ff',
        icon: '📐',
        steps: [
          { id: 'objectives', name: 'Define Objectives', enabled: true, detail: 'Success criteria, KPIs' },
          { id: 'scope', name: 'Define Scope', enabled: true, detail: 'Geography, volume, duration' },
          { id: 'plan', name: 'Create Plan', enabled: true, detail: 'Timeline, resources, budget' },
        ]
      },
      {
        id: 'select',
        name: 'Site Selection',
        shortName: 'SELECT',
        color: '#3b82f6',
        light: '#eff6ff',
        icon: '📍',
        steps: [
          { id: 'criteria', name: 'Selection Criteria', enabled: true, detail: 'Representativeness, access' },
          { id: 'recruit', name: 'Recruit Participants', enabled: true, detail: 'Customer opt-in' },
          { id: 'baseline', name: 'Capture Baseline', enabled: true, detail: 'Current state metrics' },
        ]
      },
      {
        id: 'deploy',
        name: 'Pilot Deployment',
        shortName: 'DEPLOY',
        color: '#f59e0b',
        light: '#fffbeb',
        icon: '🚀',
        steps: [
          { id: 'install', name: 'Install Meters', enabled: true, detail: 'Deploy pilot devices' },
          { id: 'commission', name: 'Commission', enabled: true, detail: 'Network setup' },
          { id: 'integrate', name: 'Integrate Systems', enabled: true, detail: 'Connect to back-office' },
        ]
      },
      {
        id: 'monitor',
        name: 'Monitoring',
        shortName: 'MONITOR',
        color: '#22c55e',
        light: '#f0fdf4',
        icon: '📊',
        steps: [
          { id: 'track-kpis', name: 'Track KPIs', enabled: true, detail: 'Performance monitoring' },
          { id: 'collect-feedback', name: 'Collect Feedback', enabled: true, detail: 'Customer, field, ops' },
          { id: 'log-issues', name: 'Log Issues', enabled: true, detail: 'Document problems' },
        ]
      },
      {
        id: 'evaluate',
        name: 'Evaluation',
        shortName: 'EVALUATE',
        color: '#ec4899',
        light: '#fdf2f8',
        icon: '📋',
        steps: [
          { id: 'analyze', name: 'Analyze Results', enabled: true, detail: 'Compare to objectives' },
          { id: 'lessons', name: 'Document Lessons', enabled: true, detail: 'What worked, what didn\'t' },
          { id: 'recommend', name: 'Recommendation', enabled: true, milestone: true, detail: 'Go/No-Go decision' },
        ]
      }
    ]
  },

  'rts-phaseout': {
    id: 'rts-phaseout',
    name: 'RTS / Legacy Tech Phase-Out',
    description: 'Targeted replacement of meters dependent on retired infrastructure or signals',
    phases: [
      {
        id: 'identify',
        name: 'Technology Identification',
        shortName: 'IDENTIFY',
        color: '#f59e0b',
        light: '#fffbeb',
        steps: [
          { id: 'inventory-tech', name: 'Inventory Legacy Tech', enabled: true, detail: 'Identify RTS/paging/obsolete comm meters' },
          { id: 'map-dependencies', name: 'Map Dependencies', enabled: true, detail: 'Network, infrastructure requirements' },
          { id: 'sunset-timeline', name: 'Sunset Timeline', enabled: true, detail: 'Align with carrier/vendor EOL dates' },
        ]
      },
      {
        id: 'schedule',
        name: 'Scheduling',
        shortName: 'SCHEDULE',
        color: '#3b82f6',
        light: '#eff6ff',
        steps: [
          { id: 'wave-plan', name: 'Wave Planning', enabled: true, detail: 'Group by geography/priority' },
          { id: 'customer-notify', name: 'Customer Notification', enabled: true, detail: 'Advance notice of swap' },
          { id: 'book-appt', name: 'Book Appointments', enabled: true, detail: 'Schedule field visits' },
        ]
      },
      {
        id: 'deploy',
        name: 'Field Deployment',
        shortName: 'DEPLOY',
        color: '#8b5cf6',
        light: '#f5f3ff',
        steps: [
          { id: 'dispatch', name: 'Dispatch Crew', enabled: true, detail: 'Assign technician and route' },
          { id: 'remove-old', name: 'Remove Old Meter', enabled: true, detail: 'Capture final read, remove device' },
          { id: 'install-new', name: 'Install New Meter', enabled: true, detail: 'Install AMI-compatible device' },
          { id: 'verify', name: 'Verify Install', enabled: true, detail: 'Physical QC, photo documentation' },
        ]
      },
      {
        id: 'activate',
        name: 'Activation',
        shortName: 'ACTIVATE',
        color: '#22c55e',
        light: '#f0fdf4',
        steps: [
          { id: 'register', name: 'Register in HES', enabled: true, detail: 'Add to head-end system' },
          { id: 'commission', name: 'Commission Meter', enabled: true, detail: 'Network join, signal test' },
          { id: 'validate-data', name: 'Validate Data Flow', enabled: true, detail: 'Confirm interval reads' },
        ]
      },
      {
        id: 'decommission',
        name: 'Decommission',
        shortName: 'DECOMMISSION',
        color: '#64748b',
        light: '#f1f5f9',
        steps: [
          { id: 'retire-asset', name: 'Retire Asset', enabled: true, detail: 'Update asset registry' },
          { id: 'update-billing', name: 'Update Billing', enabled: true, detail: 'Link new meter to account' },
          { id: 'close-out', name: 'Close Out', enabled: true, milestone: true, detail: 'Program completion confirmation' },
        ]
      }
    ]
  },

  'targeted-cohort': {
    id: 'targeted-cohort',
    name: 'Targeted Cohort Replacement',
    description: 'Specific meter models, firmware, or vendors replaced due to systemic issues',
    phases: [
      {
        id: 'identify',
        name: 'Cohort Identification',
        shortName: 'IDENTIFY',
        color: '#ec4899',
        light: '#fdf2f8',
        steps: [
          { id: 'define-criteria', name: 'Define Criteria', enabled: true, detail: 'Model, firmware, vendor, age' },
          { id: 'extract-population', name: 'Extract Population', enabled: true, detail: 'Query asset database' },
          { id: 'risk-assess', name: 'Risk Assessment', enabled: true, detail: 'Prioritize by issue severity' },
        ]
      },
      {
        id: 'validate',
        name: 'Validation',
        shortName: 'VALIDATE',
        color: '#6366f1',
        light: '#eef2ff',
        steps: [
          { id: 'sample-test', name: 'Sample Testing', enabled: true, detail: 'Confirm issue in field sample' },
          { id: 'root-cause', name: 'Root Cause Analysis', enabled: true, detail: 'Document failure mode' },
          { id: 'approve-scope', name: 'Approve Scope', enabled: true, detail: 'Management sign-off' },
        ]
      },
      {
        id: 'schedule',
        name: 'Scheduling',
        shortName: 'SCHEDULE',
        color: '#3b82f6',
        light: '#eff6ff',
        steps: [
          { id: 'plan-waves', name: 'Plan Waves', enabled: true, detail: 'Batch by location, priority' },
          { id: 'notify', name: 'Customer Notification', enabled: true, detail: 'Advance notice' },
          { id: 'appointments', name: 'Schedule Appointments', enabled: true, detail: 'Book field visits' },
        ]
      },
      {
        id: 'deploy',
        name: 'Field Deployment',
        shortName: 'DEPLOY',
        color: '#8b5cf6',
        light: '#f5f3ff',
        steps: [
          { id: 'dispatch', name: 'Dispatch Crew', enabled: true, detail: 'Assign technician' },
          { id: 'swap', name: 'Meter Swap', enabled: true, detail: 'Remove defective, install replacement' },
          { id: 'commission', name: 'Commission', enabled: true, detail: 'Network activation' },
        ]
      },
      {
        id: 'verify',
        name: 'Verification',
        shortName: 'VERIFY',
        color: '#22c55e',
        light: '#f0fdf4',
        steps: [
          { id: 'data-quality', name: 'Data Quality Check', enabled: true, detail: 'Validate reads flowing' },
          { id: 'billing-check', name: 'Billing Verification', enabled: true, detail: 'Confirm account linkage' },
          { id: 'close-cohort', name: 'Close Cohort', enabled: true, milestone: true, detail: 'Program completion' },
        ]
      }
    ]
  },

  'geographic': {
    id: 'geographic',
    name: 'Geographic / Region-Based Rollout',
    description: 'Area-by-area deployment driven by logistics, network readiness, or regulation',
    phases: [
      {
        id: 'plan',
        name: 'Regional Planning',
        shortName: 'PLAN',
        color: '#3b82f6',
        light: '#eff6ff',
        steps: [
          { id: 'define-regions', name: 'Define Regions', enabled: true, detail: 'Geographic boundaries, service areas' },
          { id: 'network-readiness', name: 'Network Readiness', enabled: true, detail: 'Check AMI infrastructure' },
          { id: 'sequence-regions', name: 'Sequence Regions', enabled: true, detail: 'Priority order for rollout' },
          { id: 'resource-plan', name: 'Resource Planning', enabled: true, detail: 'Crews, inventory, logistics' },
        ]
      },
      {
        id: 'notify',
        name: 'Regional Notification',
        shortName: 'NOTIFY',
        color: '#06b6d4',
        light: '#ecfeff',
        steps: [
          { id: 'community-outreach', name: 'Community Outreach', enabled: true, detail: 'Local communications campaign' },
          { id: 'advance-notice', name: 'Advance Notice', enabled: true, detail: '30-day customer notification' },
          { id: 'schedule', name: 'Schedule Appointments', enabled: true, detail: 'Book or auto-assign' },
        ]
      },
      {
        id: 'deploy-wave',
        name: 'Wave Deployment',
        shortName: 'DEPLOY',
        color: '#8b5cf6',
        light: '#f5f3ff',
        steps: [
          { id: 'mobilize', name: 'Mobilize Crews', enabled: true, detail: 'Stage resources in region' },
          { id: 'install', name: 'Install Meters', enabled: true, detail: 'Execute field installations' },
          { id: 'qc', name: 'Quality Control', enabled: true, detail: 'Physical verification' },
          { id: 'wave-complete', name: 'Wave Completion', enabled: true, detail: 'Regional milestone check' },
        ]
      },
      {
        id: 'activate',
        name: 'Regional Activation',
        shortName: 'ACTIVATE',
        color: '#f59e0b',
        light: '#fffbeb',
        steps: [
          { id: 'mass-commission', name: 'Mass Commission', enabled: true, detail: 'Bulk network registration' },
          { id: 'validate-comms', name: 'Validate Communications', enabled: true, detail: 'Signal strength, data flow' },
          { id: 'exception-handling', name: 'Exception Handling', enabled: true, detail: 'Address non-comm meters' },
        ]
      },
      {
        id: 'customer-impact',
        name: 'Customer Impact',
        shortName: 'CUSTOMER IMPACT',
        color: '#059669',
        light: '#ecfdf5',
        steps: [
          { id: 'cis-updates', name: 'CIS Updates', enabled: true, detail: 'Mass account updates' },
          { id: 'bill-impact', name: 'Bill Impact Check', enabled: true, detail: 'Validate billing accuracy' },
          { id: 'billing-cycle', name: 'First Billing Cycle', enabled: true, detail: 'Regional bill generation' },
          { id: 'region-complete', name: 'Region Complete', enabled: true, milestone: true, detail: 'Regional go-live' },
        ]
      }
    ]
  },

  'new-service': {
    id: 'new-service',
    name: 'New Service / New Connection',
    description: 'Smart meters installed as part of new service activation',
    phases: [
      {
        id: 'application',
        name: 'Application',
        shortName: 'APPLICATION',
        color: '#3b82f6',
        light: '#eff6ff',
        steps: [
          { id: 'receive-request', name: 'Receive Request', enabled: true, detail: 'Customer/builder application' },
          { id: 'validate-address', name: 'Validate Address', enabled: true, detail: 'Service point verification' },
          { id: 'credit-check', name: 'Credit Check', enabled: true, detail: 'Customer eligibility' },
        ]
      },
      {
        id: 'provision',
        name: 'Provisioning',
        shortName: 'PROVISION',
        color: '#6366f1',
        light: '#eef2ff',
        steps: [
          { id: 'create-account', name: 'Create Account', enabled: true, detail: 'CIS account setup' },
          { id: 'allocate-meter', name: 'Allocate Meter', enabled: true, detail: 'Reserve from inventory' },
          { id: 'assign-tariff', name: 'Assign Tariff', enabled: true, detail: 'Default rate assignment' },
        ]
      },
      {
        id: 'install',
        name: 'Installation',
        shortName: 'INSTALL',
        color: '#8b5cf6',
        light: '#f5f3ff',
        steps: [
          { id: 'schedule', name: 'Schedule Install', enabled: true, detail: 'Book field appointment' },
          { id: 'dispatch', name: 'Dispatch Crew', enabled: true, detail: 'Assign technician' },
          { id: 'install-meter', name: 'Install Meter', enabled: true, detail: 'Physical installation' },
          { id: 'connect-service', name: 'Connect Service', enabled: true, detail: 'Energize connection' },
        ]
      },
      {
        id: 'activate',
        name: 'Activation',
        shortName: 'ACTIVATE',
        color: '#f59e0b',
        light: '#fffbeb',
        steps: [
          { id: 'register', name: 'Register in HES', enabled: true, detail: 'Head-end registration' },
          { id: 'commission', name: 'Commission Meter', enabled: true, detail: 'Network join' },
          { id: 'first-read', name: 'First Read', enabled: true, detail: 'Validate data flow' },
        ]
      },
      {
        id: 'customer-impact',
        name: 'Customer Impact',
        shortName: 'CUSTOMER IMPACT',
        color: '#059669',
        light: '#ecfdf5',
        steps: [
          { id: 'start-date', name: 'Set Start Date', enabled: true, detail: 'Begin billing period' },
          { id: 'welcome', name: 'Welcome Communication', enabled: true, detail: 'Customer onboarding' },
          { id: 'first-bill', name: 'First Bill', enabled: true, milestone: true, detail: 'Generate initial bill' },
        ]
      }
    ]
  },

  'mass-maintenance': {
    id: 'mass-maintenance',
    name: 'Mass Maintenance / Asset Health',
    description: 'Proactive replacement based on age, condition, or predicted failure risk',
    phases: [
      {
        id: 'analyze',
        name: 'Analysis',
        shortName: 'ANALYZE',
        color: '#6366f1',
        light: '#eef2ff',
        steps: [
          { id: 'health-scoring', name: 'Health Scoring', enabled: true, detail: 'Calculate asset health index' },
          { id: 'failure-prediction', name: 'Failure Prediction', enabled: true, detail: 'ML-based risk modeling' },
          { id: 'cost-benefit', name: 'Cost-Benefit Analysis', enabled: true, detail: 'ROI of proactive replacement' },
        ]
      },
      {
        id: 'prioritize',
        name: 'Prioritization',
        shortName: 'PRIORITIZE',
        color: '#f59e0b',
        light: '#fffbeb',
        steps: [
          { id: 'rank-assets', name: 'Rank Assets', enabled: true, detail: 'Sort by risk/impact' },
          { id: 'define-threshold', name: 'Define Thresholds', enabled: true, detail: 'Set replacement criteria' },
          { id: 'batch-cohorts', name: 'Batch Cohorts', enabled: true, detail: 'Group for execution' },
        ]
      },
      {
        id: 'schedule',
        name: 'Scheduling',
        shortName: 'SCHEDULE',
        color: '#3b82f6',
        light: '#eff6ff',
        steps: [
          { id: 'plan-waves', name: 'Plan Waves', enabled: true, detail: 'Resource-balanced schedule' },
          { id: 'notify', name: 'Customer Notification', enabled: true, detail: 'Advance notice' },
          { id: 'appointments', name: 'Book Appointments', enabled: true, detail: 'Schedule field work' },
        ]
      },
      {
        id: 'deploy',
        name: 'Field Deployment',
        shortName: 'DEPLOY',
        color: '#8b5cf6',
        light: '#f5f3ff',
        steps: [
          { id: 'dispatch', name: 'Dispatch Crew', enabled: true, detail: 'Assign technician' },
          { id: 'swap', name: 'Meter Swap', enabled: true, detail: 'Replace aging meter' },
          { id: 'commission', name: 'Commission', enabled: true, detail: 'Network activation' },
          { id: 'qc', name: 'Quality Control', enabled: true, detail: 'Physical verification' },
        ]
      },
      {
        id: 'validate',
        name: 'Validation',
        shortName: 'VALIDATE',
        color: '#22c55e',
        light: '#f0fdf4',
        steps: [
          { id: 'data-quality', name: 'Data Quality', enabled: true, detail: 'Validate reads' },
          { id: 'billing-check', name: 'Billing Check', enabled: true, detail: 'Confirm account linkage' },
          { id: 'close-batch', name: 'Close Batch', enabled: true, milestone: true, detail: 'Cohort completion' },
        ]
      }
    ]
  },

  'vendor-transition': {
    id: 'vendor-transition',
    name: 'Vendor Transition Program',
    description: 'Meter swaps driven by supplier change or contract exit',
    phases: [
      {
        id: 'plan',
        name: 'Transition Planning',
        shortName: 'PLAN',
        color: '#6366f1',
        light: '#eef2ff',
        steps: [
          { id: 'scope-assessment', name: 'Scope Assessment', enabled: true, detail: 'Inventory of vendor meters' },
          { id: 'contract-timeline', name: 'Contract Timeline', enabled: true, detail: 'Exit dates, SLA requirements' },
          { id: 'new-vendor-setup', name: 'New Vendor Setup', enabled: true, detail: 'Onboard replacement vendor' },
          { id: 'integration-plan', name: 'Integration Plan', enabled: true, detail: 'System compatibility' },
        ]
      },
      {
        id: 'procure',
        name: 'Procurement',
        shortName: 'PROCURE',
        color: '#f59e0b',
        light: '#fffbeb',
        steps: [
          { id: 'order-inventory', name: 'Order Inventory', enabled: true, detail: 'New meter procurement' },
          { id: 'receive-test', name: 'Receive & Test', enabled: true, detail: 'Acceptance testing' },
          { id: 'stage-inventory', name: 'Stage Inventory', enabled: true, detail: 'Warehouse allocation' },
        ]
      },
      {
        id: 'deploy',
        name: 'Field Deployment',
        shortName: 'DEPLOY',
        color: '#8b5cf6',
        light: '#f5f3ff',
        steps: [
          { id: 'schedule', name: 'Schedule Swaps', enabled: true, detail: 'Plan field appointments' },
          { id: 'dispatch', name: 'Dispatch Crew', enabled: true, detail: 'Assign technicians' },
          { id: 'swap', name: 'Meter Swap', enabled: true, detail: 'Remove old, install new vendor' },
          { id: 'qc', name: 'Quality Control', enabled: true, detail: 'Physical verification' },
        ]
      },
      {
        id: 'migrate',
        name: 'System Migration',
        shortName: 'MIGRATE',
        color: '#3b82f6',
        light: '#eff6ff',
        steps: [
          { id: 'hes-migration', name: 'HES Migration', enabled: true, detail: 'Transfer to new head-end' },
          { id: 'data-validation', name: 'Data Validation', enabled: true, detail: 'Verify reads flowing' },
          { id: 'mdm-update', name: 'MDM Update', enabled: true, detail: 'Update meter data management' },
        ]
      },
      {
        id: 'decommission',
        name: 'Decommission',
        shortName: 'DECOMMISSION',
        color: '#64748b',
        light: '#f1f5f9',
        steps: [
          { id: 'retire-old', name: 'Retire Old Meters', enabled: true, detail: 'Remove from old vendor system' },
          { id: 'return-dispose', name: 'Return/Dispose', enabled: true, detail: 'Per contract terms' },
          { id: 'contract-close', name: 'Contract Close', enabled: true, milestone: true, detail: 'Vendor transition complete' },
        ]
      }
    ]
  },

  'post-incident': {
    id: 'post-incident',
    name: 'Post-Incident Remediation',
    description: 'Accelerated rollouts following billing failures, outages, or regulatory findings',
    phases: [
      {
        id: 'assess',
        name: 'Impact Assessment',
        shortName: 'ASSESS',
        color: '#dc2626',
        light: '#fef2f2',
        steps: [
          { id: 'identify-affected', name: 'Identify Affected', enabled: true, detail: 'Scope of impacted meters' },
          { id: 'root-cause', name: 'Root Cause Analysis', enabled: true, detail: 'Determine failure mode' },
          { id: 'customer-impact', name: 'Customer Impact', enabled: true, detail: 'Billing/service effects' },
        ]
      },
      {
        id: 'prioritize',
        name: 'Prioritization',
        shortName: 'PRIORITIZE',
        color: '#f59e0b',
        light: '#fffbeb',
        steps: [
          { id: 'severity-rank', name: 'Severity Ranking', enabled: true, detail: 'Critical vs routine' },
          { id: 'regulatory-req', name: 'Regulatory Requirements', enabled: true, detail: 'Compliance deadlines' },
          { id: 'resource-surge', name: 'Resource Surge', enabled: true, detail: 'Emergency crew allocation' },
        ]
      },
      {
        id: 'remediate',
        name: 'Remediation',
        shortName: 'REMEDIATE',
        color: '#8b5cf6',
        light: '#f5f3ff',
        steps: [
          { id: 'expedite-schedule', name: 'Expedite Scheduling', enabled: true, detail: 'Accelerated appointments' },
          { id: 'dispatch', name: 'Dispatch Crews', enabled: true, detail: 'Field deployment' },
          { id: 'replace-repair', name: 'Replace/Repair', enabled: true, detail: 'Execute remediation' },
          { id: 'validate', name: 'Validate Fix', enabled: true, detail: 'Confirm resolution' },
        ]
      },
      {
        id: 'verify',
        name: 'Verification',
        shortName: 'VERIFY',
        color: '#22c55e',
        light: '#f0fdf4',
        steps: [
          { id: 'data-integrity', name: 'Data Integrity', enabled: true, detail: 'Validate reads/billing' },
          { id: 'customer-comms', name: 'Customer Communications', enabled: true, detail: 'Status updates' },
          { id: 'billing-correction', name: 'Billing Corrections', enabled: true, detail: 'Adjustments if needed' },
        ]
      },
      {
        id: 'report',
        name: 'Reporting',
        shortName: 'REPORT',
        color: '#6366f1',
        light: '#eef2ff',
        steps: [
          { id: 'internal-report', name: 'Internal Report', enabled: true, detail: 'Management summary' },
          { id: 'regulatory-filing', name: 'Regulatory Filing', enabled: true, detail: 'Compliance documentation' },
          { id: 'lessons-learned', name: 'Lessons Learned', enabled: true, detail: 'Process improvements' },
          { id: 'close-incident', name: 'Close Incident', enabled: true, milestone: true, detail: 'Remediation complete' },
        ]
      }
    ]
  }
};

// Helper to get template by ID
export const getTemplateById = (id) => meterProgramTemplates[id] || null;

// Get all templates as array
export const getAllTemplates = () => Object.values(meterProgramTemplates);

// Convert template to flow definition format
export const templateToFlowDefinition = (template) => {
  if (!template) return null;
  
  const steps = {};
  template.phases.forEach(phase => {
    steps[phase.id] = phase.steps.map(step => ({
      ...step,
      conformance: 100, // Default for new templates
    }));
  });

  return {
    name: template.name,
    description: template.description,
    templateId: template.id,
    phases: template.phases.map(p => ({
      id: p.id,
      name: p.name,
      shortName: p.shortName,
      color: p.color,
      light: p.light,
      icon: p.icon,
    })),
    steps,
  };
};
