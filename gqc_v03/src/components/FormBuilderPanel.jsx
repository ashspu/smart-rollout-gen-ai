import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Code, Eye } from 'lucide-react';
import FormPreview from './FormPreview';

// ── Deep context: each step ID maps to a rich schema with domain-aware fields ──
// Keyed by step.id (from the flow definition) for exact matching,
// then falls back to keyword matching on step name + detail + phase.
const STEP_SCHEMAS = {
  // ── IDENTIFY PHASE ──
  'cohort-select': {
    description: 'Defines the target meter population for this deployment wave',
    properties: {
      cohortId: { type: 'string', title: 'Cohort ID', description: 'Unique identifier for this meter cohort' },
      cohortName: { type: 'string', title: 'Cohort Name', description: 'Descriptive name (e.g., "South Region Pre-2010 Analog")' },
      geographicScope: { type: 'string', title: 'Geographic Scope', enum: ['county', 'zip-code', 'route', 'substation', 'feeder', 'district'], description: 'How the population is geographically grouped' },
      meterAgeRange: { type: 'string', title: 'Meter Age Range', enum: ['pre-2005', '2005-2010', '2010-2015', '2015-2020', '2020+'] },
      meterType: { type: 'string', title: 'Meter Type', enum: ['analog-electromechanical', 'digital-non-ami', 'ami-v1-eol', 'gas-ert', 'water-pit'] },
      estimatedPopulation: { type: 'integer', title: 'Estimated Population', minimum: 0, description: 'Number of meters in this cohort' },
      selectionCriteria: { type: 'string', title: 'Selection Criteria', description: 'SQL filter, route list, or manual criteria used' },
      exclusions: { type: 'string', title: 'Exclusions Applied', description: 'Opt-out list, DNI, special conditions excluded' },
    },
    required: ['cohortId', 'meterType', 'estimatedPopulation'],
    uiHints: { selectionCriteria: 'textarea', exclusions: 'textarea' },
  },
  'validate-eligibility': {
    description: 'Checks each meter against opt-out, DNI, and special condition lists',
    properties: {
      meterId: { type: 'string', title: 'Meter ID' },
      accountNumber: { type: 'string', title: 'Account Number' },
      premiseId: { type: 'string', title: 'Premise/Service Point ID' },
      currentMeterType: { type: 'string', title: 'Current Meter Type', enum: ['analog', 'digital-non-ami', 'ami-v1', 'gas-ert', 'unknown'] },
      eligible: { type: 'boolean', title: 'Eligible for Replacement', default: true },
      optOutStatus: { type: 'string', title: 'Opt-Out Status', enum: ['none', 'temporary', 'permanent'] },
      dniFlag: { type: 'boolean', title: 'Do-Not-Install Flag', default: false },
      specialConditions: { type: 'string', title: 'Special Conditions', enum: ['none', 'medical-baseline', 'net-metering', 'demand-response', 'critical-facility'] },
      ineligibilityReason: { type: 'string', title: 'Reason (if ineligible)' },
    },
    required: ['meterId', 'accountNumber', 'eligible'],
    uiHints: { ineligibilityReason: 'textarea' },
  },
  'prioritize': {
    description: 'Assigns meters to deployment waves based on logistics and risk',
    properties: {
      waveNumber: { type: 'integer', title: 'Wave Number', minimum: 1, description: 'Deployment wave assignment' },
      priority: { type: 'string', title: 'Priority Level', enum: ['critical', 'high', 'medium', 'low'] },
      region: { type: 'string', title: 'Region / Zone' },
      scheduledStartDate: { type: 'string', title: 'Wave Start Date', format: 'date' },
      routeOptimization: { type: 'string', title: 'Route Optimization', enum: ['geographic-cluster', 'feeder-based', 'manual-route', 'ai-optimized'] },
      estimatedDuration: { type: 'integer', title: 'Estimated Duration (days)', minimum: 1 },
      justification: { type: 'string', title: 'Prioritization Rationale' },
    },
    required: ['waveNumber', 'priority'],
    uiHints: { justification: 'textarea' },
  },
  'prioritize-risk': {
    description: 'Ranks meters by failure probability for technology refresh',
    properties: {
      meterId: { type: 'string', title: 'Meter ID' },
      failureProbability: { type: 'number', title: 'Failure Probability (%)', minimum: 0, maximum: 100 },
      riskTier: { type: 'string', title: 'Risk Tier', enum: ['critical', 'high', 'medium', 'low'] },
      failureMode: { type: 'string', title: 'Predicted Failure Mode', enum: ['communication-loss', 'reading-drift', 'display-failure', 'battery-eol', 'tamper-flag'] },
      ageYears: { type: 'number', title: 'Meter Age (years)' },
      lastCommunication: { type: 'string', title: 'Last Communication', format: 'date-time' },
      replacementPriority: { type: 'integer', title: 'Replacement Priority Rank', minimum: 1 },
    },
    required: ['meterId', 'riskTier', 'replacementPriority'],
  },
  // ── ENGAGE PHASE ──
  'notify-advance': {
    description: '30-day advance notification to customers about upcoming meter work',
    properties: {
      noticeType: { type: 'string', title: 'Notice Type', enum: ['letter', 'email', 'sms', 'door-hanger', 'phone-call', 'multi-channel'] },
      recipientName: { type: 'string', title: 'Customer Name' },
      recipientAddress: { type: 'string', title: 'Service Address' },
      accountNumber: { type: 'string', title: 'Account Number' },
      sentDate: { type: 'string', title: 'Sent Date', format: 'date' },
      estimatedWorkDate: { type: 'string', title: 'Estimated Work Date', format: 'date' },
      languagePreference: { type: 'string', title: 'Language', enum: ['en', 'es', 'zh', 'ko', 'vi', 'other'], default: 'en' },
      regulatoryNoticeId: { type: 'string', title: 'Regulatory Notice ID', description: 'PUC/PSC notice tracking number' },
      deliveryStatus: { type: 'string', title: 'Delivery Status', enum: ['sent', 'delivered', 'bounced', 'returned'] },
    },
    required: ['noticeType', 'accountNumber', 'sentDate'],
    uiHints: {},
  },
  'schedule-appt': {
    description: 'Customer self-schedules or is auto-assigned an installation window',
    properties: {
      appointmentId: { type: 'string', title: 'Appointment ID' },
      accountNumber: { type: 'string', title: 'Account Number' },
      appointmentDate: { type: 'string', title: 'Appointment Date', format: 'date' },
      timeWindow: { type: 'string', title: 'Time Window', enum: ['8am-10am', '10am-12pm', '12pm-2pm', '2pm-4pm', '4pm-6pm'] },
      schedulingMethod: { type: 'string', title: 'Scheduling Method', enum: ['customer-self-service', 'ivr', 'csr-scheduled', 'auto-assigned', 'walk-in'] },
      accessRequirements: { type: 'string', title: 'Access Requirements', enum: ['indoor-access-needed', 'outdoor-accessible', 'locked-gate', 'dog-on-premises', 'elderly-resident'] },
      customerPhone: { type: 'string', title: 'Contact Phone' },
      specialInstructions: { type: 'string', title: 'Special Instructions' },
    },
    required: ['accountNumber', 'appointmentDate', 'timeWindow'],
    uiHints: { specialInstructions: 'textarea' },
  },
  'remind': {
    description: '48-hour appointment reminder via preferred channel',
    properties: {
      reminderChannel: { type: 'string', title: 'Reminder Channel', enum: ['sms', 'email', 'automated-call', 'push-notification'] },
      sentAt: { type: 'string', title: 'Sent At', format: 'date-time' },
      appointmentDate: { type: 'string', title: 'Appointment Date', format: 'date' },
      timeWindow: { type: 'string', title: 'Time Window' },
      delivered: { type: 'boolean', title: 'Delivered Successfully', default: true },
      customerResponse: { type: 'string', title: 'Customer Response', enum: ['no-response', 'confirmed', 'reschedule-requested', 'cancelled'] },
    },
    required: ['reminderChannel', 'sentAt'],
  },
  'confirm': {
    description: 'Customer acknowledgment or reschedule of the appointment',
    properties: {
      confirmed: { type: 'boolean', title: 'Customer Confirmed', default: false },
      confirmationMethod: { type: 'string', title: 'Confirmation Method', enum: ['phone-call', 'sms-reply', 'email-reply', 'web-portal', 'ivr'] },
      confirmedAt: { type: 'string', title: 'Confirmed At', format: 'date-time' },
      rescheduleRequested: { type: 'boolean', title: 'Reschedule Requested', default: false },
      newPreferredDate: { type: 'string', title: 'Preferred New Date', format: 'date' },
      cancellationReason: { type: 'string', title: 'Cancellation/Reschedule Reason', enum: ['schedule-conflict', 'not-home', 'opted-out', 'safety-concern', 'other'] },
    },
    required: ['confirmed'],
  },
  // ── DEPLOY PHASE ──
  'dispatch': {
    description: 'Assigns field crew, vehicle, and route for the day\'s installations',
    properties: {
      workOrderId: { type: 'string', title: 'Work Order ID' },
      crewId: { type: 'string', title: 'Crew ID' },
      crewLead: { type: 'string', title: 'Crew Lead Name' },
      crewSize: { type: 'integer', title: 'Crew Size', minimum: 1, maximum: 10 },
      vehicleId: { type: 'string', title: 'Vehicle ID' },
      dispatchTime: { type: 'string', title: 'Dispatch Time', format: 'date-time' },
      assignedZone: { type: 'string', title: 'Assigned Zone / Route' },
      estimatedJobs: { type: 'integer', title: 'Estimated Jobs Today', minimum: 1 },
      equipmentChecklist: { type: 'string', title: 'Equipment Verified', enum: ['complete', 'missing-items', 'not-checked'] },
      safetyBriefCompleted: { type: 'boolean', title: 'Safety Brief Completed', default: true },
    },
    required: ['workOrderId', 'crewId', 'crewLead', 'dispatchTime'],
  },
  'arrive': {
    description: 'GPS confirmation of arrival, customer presence check, site assessment',
    properties: {
      workOrderId: { type: 'string', title: 'Work Order ID' },
      arrivalTime: { type: 'string', title: 'Arrival Time', format: 'date-time' },
      gpsLatitude: { type: 'number', title: 'GPS Latitude' },
      gpsLongitude: { type: 'number', title: 'GPS Longitude' },
      siteAccessible: { type: 'boolean', title: 'Site Accessible', default: true },
      customerPresent: { type: 'boolean', title: 'Customer Present', default: false },
      meterLocation: { type: 'string', title: 'Meter Location', enum: ['exterior-wall', 'meter-room', 'basement', 'garage', 'utility-closet', 'underground-vault'] },
      siteConditions: { type: 'string', title: 'Site Conditions', enum: ['normal', 'overgrown-vegetation', 'obstructed', 'hazardous', 'flooded', 'construction-zone'] },
      sitePhoto: { type: 'string', title: 'Site Photo URL', format: 'uri' },
    },
    required: ['workOrderId', 'arrivalTime', 'siteAccessible'],
  },
  'access': {
    description: 'Gaining physical access to meter location, documenting any barriers',
    properties: {
      workOrderId: { type: 'string', title: 'Work Order ID' },
      accessMethod: { type: 'string', title: 'Access Method', enum: ['key-on-file', 'gate-code', 'customer-let-in', 'property-manager', 'lock-removed', 'no-access'] },
      accessGrantedAt: { type: 'string', title: 'Access Granted At', format: 'date-time' },
      noAccessReason: { type: 'string', title: 'No-Access Reason', enum: ['locked-gate', 'aggressive-dog', 'customer-refused', 'unsafe-conditions', 'key-does-not-work', 'no-one-home'] },
      siteConditions: { type: 'string', title: 'Meter Area Conditions', enum: ['clear', 'obstructed', 'hazardous-material', 'water-damage', 'pest-infestation', 'extreme-temperature'] },
      hazardNotes: { type: 'string', title: 'Hazard / Obstruction Details' },
      rescheduleNeeded: { type: 'boolean', title: 'Reschedule Needed', default: false },
    },
    required: ['workOrderId', 'accessMethod'],
    uiHints: { hazardNotes: 'textarea' },
  },
  'final-read': {
    description: 'Captures the final meter reading from the old/legacy meter before removal',
    properties: {
      workOrderId: { type: 'string', title: 'Work Order ID' },
      oldMeterId: { type: 'string', title: 'Old Meter ID (from nameplate)' },
      readingValue: { type: 'number', title: 'Final Reading Value' },
      readingUnit: { type: 'string', title: 'Unit', enum: ['kWh', 'kW', 'therms', 'CCF', 'gallons', 'cubic-feet'], default: 'kWh' },
      demandReading: { type: 'number', title: 'Demand Reading (kW)', description: 'If applicable for commercial/industrial' },
      registerCount: { type: 'integer', title: 'Number of Registers', minimum: 1, default: 1 },
      readingPhoto: { type: 'string', title: 'Meter Face Photo URL', format: 'uri' },
      readingTimestamp: { type: 'string', title: 'Reading Timestamp', format: 'date-time' },
      readingMethod: { type: 'string', title: 'Reading Method', enum: ['visual', 'handheld-device', 'optical-port', 'photo-ocr'] },
    },
    required: ['workOrderId', 'oldMeterId', 'readingValue', 'readingTimestamp'],
  },
  'meter-swap': {
    description: 'Physical removal of old meter and installation of new AMI meter',
    properties: {
      workOrderId: { type: 'string', title: 'Work Order ID' },
      oldMeterId: { type: 'string', title: 'Old Meter ID' },
      oldMeterManufacturer: { type: 'string', title: 'Old Meter Manufacturer' },
      newMeterId: { type: 'string', title: 'New Meter ID (serial number)' },
      newMeterModel: { type: 'string', title: 'New Meter Model', enum: ['Itron-OpenWay-Riva', 'Landis+Gyr-Revelo', 'Honeywell-Elster-Rex2', 'Aclara-I-210+c', 'Sensus-iConA'] },
      newMeterForm: { type: 'string', title: 'Meter Form Factor', enum: ['1S', '2S', '3S', '4S', '5S', '6S', '9S', '12S', '16S', '25S', '36S', 'CT-rated'] },
      finalReadOld: { type: 'number', title: 'Final Read (Old Meter)' },
      initialReadNew: { type: 'number', title: 'Initial Read (New Meter)' },
      swapTimestamp: { type: 'string', title: 'Swap Timestamp', format: 'date-time' },
      socketCondition: { type: 'string', title: 'Socket/Base Condition', enum: ['good', 'corrosion-minor', 'corrosion-major', 'damaged-jaws', 'needs-replacement'] },
      sealNumber: { type: 'string', title: 'New Seal Number' },
      installPhoto: { type: 'string', title: 'Installation Photo URL', format: 'uri' },
      bypassUsed: { type: 'boolean', title: 'Bypass Used During Swap', default: false },
      outageMinutes: { type: 'integer', title: 'Customer Outage Duration (min)', minimum: 0 },
    },
    required: ['workOrderId', 'oldMeterId', 'newMeterId', 'finalReadOld', 'initialReadNew', 'swapTimestamp'],
  },
  'verify-install': {
    description: 'Physical QC checks and photo documentation after installation',
    properties: {
      workOrderId: { type: 'string', title: 'Work Order ID' },
      newMeterId: { type: 'string', title: 'New Meter ID' },
      physicalInspection: { type: 'string', title: 'Physical Inspection', enum: ['pass', 'pass-with-notes', 'fail'] },
      meterSeated: { type: 'boolean', title: 'Meter Properly Seated', default: true },
      sealIntact: { type: 'boolean', title: 'Seal Intact', default: true },
      voltageCheck: { type: 'string', title: 'Voltage Check', enum: ['normal', 'low', 'high', 'phase-loss', 'not-tested'] },
      communicationTest: { type: 'string', title: 'Communication Test', enum: ['pass', 'fail', 'intermittent', 'not-tested'] },
      signalStrength: { type: 'integer', title: 'Signal Strength (dBm)', minimum: -130, maximum: 0 },
      photoFront: { type: 'string', title: 'Front Photo URL', format: 'uri' },
      photoNameplate: { type: 'string', title: 'Nameplate Photo URL', format: 'uri' },
      verifiedBy: { type: 'string', title: 'Verified By (Installer ID)' },
      customerSignoff: { type: 'boolean', title: 'Customer Sign-Off Obtained', default: false },
    },
    required: ['workOrderId', 'newMeterId', 'physicalInspection', 'communicationTest'],
  },
  // ── ACTIVATE PHASE ──
  'register-hes': {
    description: 'Registering the new meter in the Head-End System (HES)',
    properties: {
      newMeterId: { type: 'string', title: 'Meter ID' },
      hesSystem: { type: 'string', title: 'HES Platform', enum: ['Itron-SSN', 'Itron-OpenWay', 'Landis+Gyr-Command-Center', 'Aclara-STAR', 'Sensus-FlexNet', 'Silver-Spring-Networks'] },
      registrationId: { type: 'string', title: 'HES Registration ID' },
      registeredAt: { type: 'string', title: 'Registered At', format: 'date-time' },
      registrationStatus: { type: 'string', title: 'Registration Status', enum: ['success', 'pending-provisioning', 'failed-retrying', 'failed-manual-required'] },
      firmwareVersion: { type: 'string', title: 'Firmware Version' },
      networkId: { type: 'string', title: 'Network/NIC ID' },
      retryCount: { type: 'integer', title: 'Retry Count', minimum: 0, default: 0 },
    },
    required: ['newMeterId', 'hesSystem', 'registrationStatus'],
  },
  'commission': {
    description: 'Network join confirmation and signal/communication verification',
    properties: {
      newMeterId: { type: 'string', title: 'Meter ID' },
      commissionedAt: { type: 'string', title: 'Commissioned At', format: 'date-time' },
      networkJoined: { type: 'boolean', title: 'Network Joined', default: false },
      firstPingReceived: { type: 'boolean', title: 'First Ping Received', default: false },
      signalStrengthDbm: { type: 'integer', title: 'Signal Strength (dBm)', minimum: -130, maximum: 0 },
      signalQuality: { type: 'string', title: 'Signal Quality', enum: ['excellent', 'good', 'marginal', 'poor', 'no-signal'] },
      collectorId: { type: 'string', title: 'Assigned Collector/Router ID' },
      firmwareVersion: { type: 'string', title: 'Active Firmware Version' },
      configurationProfile: { type: 'string', title: 'Configuration Profile', enum: ['residential-standard', 'residential-tou', 'commercial', 'industrial', 'net-metering'] },
    },
    required: ['newMeterId', 'commissionedAt', 'networkJoined'],
  },
  'first-read': {
    description: 'Validates first interval data received from the new meter',
    properties: {
      newMeterId: { type: 'string', title: 'Meter ID' },
      firstReadValue: { type: 'number', title: 'First Reading Value' },
      firstReadTimestamp: { type: 'string', title: 'First Read Timestamp', format: 'date-time' },
      intervalDataReceived: { type: 'boolean', title: '15-min Interval Data Received', default: false },
      hoursOfData: { type: 'integer', title: 'Hours of Data Collected', minimum: 0 },
      dataQuality: { type: 'string', title: 'Data Quality', enum: ['valid', 'gaps-detected', 'estimation-required', 'no-data'] },
      comparisonToOldMeter: { type: 'string', title: 'Comparison to Old Meter', enum: ['within-tolerance', 'variance-flagged', 'not-comparable'] },
    },
    required: ['newMeterId', 'firstReadTimestamp', 'intervalDataReceived'],
  },
  'mdm-validate': {
    description: 'Meter Data Management VEE processing and data quality verification',
    properties: {
      newMeterId: { type: 'string', title: 'Meter ID' },
      mdmSystem: { type: 'string', title: 'MDM System', enum: ['Itron-MV-RS', 'Oracle-Utilities-MDM', 'Landis+Gyr-Gridstream-AIM', 'OSIsoft-PI', 'Custom-MDM'] },
      veeStatus: { type: 'string', title: 'VEE Processing Status', enum: ['passed', 'estimated', 'failed-manual-review', 'pending'] },
      dataCompleteness: { type: 'number', title: 'Data Completeness (%)', minimum: 0, maximum: 100 },
      estimationPercentage: { type: 'number', title: 'Estimation (%)', minimum: 0, maximum: 100 },
      exceptionsFound: { type: 'integer', title: 'Exceptions Found', minimum: 0 },
      validationPassed: { type: 'boolean', title: 'Overall Validation Passed', default: true },
      notes: { type: 'string', title: 'Validation Notes' },
    },
    required: ['newMeterId', 'mdmSystem', 'veeStatus', 'validationPassed'],
    uiHints: { notes: 'textarea' },
  },
  // ── CUSTOMER IMPACT PHASE ──
  'update-cis': {
    description: 'Links new meter to customer account in the CIS (Customer Information System)',
    properties: {
      accountNumber: { type: 'string', title: 'Account Number' },
      premiseId: { type: 'string', title: 'Premise / Service Point ID' },
      oldMeterId: { type: 'string', title: 'Old Meter ID (being retired)' },
      newMeterId: { type: 'string', title: 'New Meter ID' },
      cisSystem: { type: 'string', title: 'CIS System', enum: ['SAP-ISU', 'Oracle-CC&B', 'Oracle-Utilities-C2M', 'Cayenta', 'NISC-iVUE', 'Custom'] },
      updateType: { type: 'string', title: 'Update Type', enum: ['meter-exchange', 'new-install', 'service-point-update', 'rate-reclassification'] },
      effectiveDate: { type: 'string', title: 'Effective Date', format: 'date' },
      updatedAt: { type: 'string', title: 'CIS Updated At', format: 'date-time' },
      verified: { type: 'boolean', title: 'CIS Update Verified', default: false },
    },
    required: ['accountNumber', 'newMeterId', 'cisSystem', 'effectiveDate'],
  },
  'prorate-bill': {
    description: 'Calculates prorated billing for the meter change period',
    properties: {
      accountNumber: { type: 'string', title: 'Account Number' },
      oldMeterFinalRead: { type: 'number', title: 'Old Meter Final Read' },
      newMeterInitialRead: { type: 'number', title: 'New Meter Initial Read' },
      meterChangeDate: { type: 'string', title: 'Meter Change Date', format: 'date' },
      billingPeriodStart: { type: 'string', title: 'Billing Period Start', format: 'date' },
      billingPeriodEnd: { type: 'string', title: 'Billing Period End', format: 'date' },
      usagePreSwap: { type: 'number', title: 'Usage Pre-Swap (kWh)' },
      usagePostSwap: { type: 'number', title: 'Usage Post-Swap (kWh)' },
      prorationMethod: { type: 'string', title: 'Proration Method', enum: ['calendar-day', 'usage-based', 'estimated-split'] },
      adjustmentAmount: { type: 'number', title: 'Adjustment Amount ($)' },
      prorated: { type: 'boolean', title: 'Proration Applied', default: true },
    },
    required: ['accountNumber', 'meterChangeDate', 'prorationMethod'],
  },
  'assign-tariff': {
    description: 'Applies the appropriate rate structure for the new meter capabilities',
    properties: {
      accountNumber: { type: 'string', title: 'Account Number' },
      currentTariffCode: { type: 'string', title: 'Current Tariff Code' },
      newTariffCode: { type: 'string', title: 'New Tariff Code' },
      tariffType: { type: 'string', title: 'Tariff Type', enum: ['flat-rate', 'tiered', 'time-of-use', 'real-time-pricing', 'demand-response', 'net-metering', 'ev-rate'] },
      effectiveDate: { type: 'string', title: 'Effective Date', format: 'date' },
      touEnabled: { type: 'boolean', title: 'TOU Enabled', default: false, description: 'Time-of-Use pricing now available with AMI meter' },
      customerNotified: { type: 'boolean', title: 'Customer Notified of Rate Change', default: false },
      regulatoryApproval: { type: 'string', title: 'Regulatory Approval', enum: ['pre-approved', 'pending', 'not-required'] },
    },
    required: ['accountNumber', 'newTariffCode', 'effectiveDate'],
  },
  'first-bill': {
    description: 'Generates the first bill using new AMI meter data — program milestone',
    properties: {
      accountNumber: { type: 'string', title: 'Account Number' },
      billDate: { type: 'string', title: 'Bill Date', format: 'date' },
      billingPeriodStart: { type: 'string', title: 'Billing Period Start', format: 'date' },
      billingPeriodEnd: { type: 'string', title: 'Billing Period End', format: 'date' },
      totalUsageKwh: { type: 'number', title: 'Total Usage (kWh)' },
      totalAmountDue: { type: 'number', title: 'Total Amount Due ($)' },
      readSource: { type: 'string', title: 'Read Source', enum: ['ami-automated', 'manual-read', 'estimated'] },
      billAccuracyCheck: { type: 'string', title: 'Bill Accuracy Check', enum: ['within-historical-range', 'variance-flagged', 'high-bill-alert', 'low-bill-alert'] },
      customerComplaint: { type: 'boolean', title: 'Customer Complaint Received', default: false },
      milestoneComplete: { type: 'boolean', title: 'Meter-to-Bill Milestone Complete', default: true, description: 'Marks end-to-end program completion for this meter' },
    },
    required: ['accountNumber', 'billDate', 'readSource', 'milestoneComplete'],
  },
  // ── TECH REFRESH SPECIFIC ──
  'failure-analysis': {
    description: 'Identifies meters on the failure curve for proactive replacement',
    properties: {
      meterId: { type: 'string', title: 'Meter ID' },
      manufacturer: { type: 'string', title: 'Manufacturer' },
      modelNumber: { type: 'string', title: 'Model Number' },
      installDate: { type: 'string', title: 'Install Date', format: 'date' },
      ageYears: { type: 'number', title: 'Age (years)' },
      failureIndicators: { type: 'string', title: 'Failure Indicators', enum: ['communication-degraded', 'reading-drift', 'clock-skew', 'memory-errors', 'battery-low', 'firmware-bug'] },
      communicationReliability: { type: 'number', title: 'Communication Reliability (%)', minimum: 0, maximum: 100 },
      lastMaintenanceDate: { type: 'string', title: 'Last Maintenance', format: 'date' },
      recommendedAction: { type: 'string', title: 'Recommended Action', enum: ['replace-immediately', 'replace-next-wave', 'monitor', 'firmware-update'] },
    },
    required: ['meterId', 'failureIndicators', 'recommendedAction'],
  },
  'eol-check': {
    description: 'Flags meters at vendor end-of-life or with parts shortages',
    properties: {
      meterId: { type: 'string', title: 'Meter ID' },
      manufacturer: { type: 'string', title: 'Manufacturer' },
      modelNumber: { type: 'string', title: 'Model Number' },
      eolStatus: { type: 'string', title: 'EOL Status', enum: ['active-support', 'limited-support', 'end-of-life', 'end-of-sale', 'obsolete'] },
      eolDate: { type: 'string', title: 'EOL Date', format: 'date' },
      partsAvailable: { type: 'boolean', title: 'Spare Parts Available', default: true },
      firmwareSupported: { type: 'boolean', title: 'Firmware Still Supported', default: true },
      replacementModel: { type: 'string', title: 'Recommended Replacement Model' },
    },
    required: ['meterId', 'eolStatus'],
  },
  // ── PERIODIC TESTING ──
  'schedule-test': {
    description: 'Schedules periodic meter testing as required by regulation',
    properties: {
      meterId: { type: 'string', title: 'Meter ID' },
      testType: { type: 'string', title: 'Test Type', enum: ['accuracy-test', 'demand-test', 'communication-test', 'full-certification', 'sample-test'] },
      regulatoryRequirement: { type: 'string', title: 'Regulatory Requirement', description: 'PUC/PSC rule requiring this test' },
      scheduledDate: { type: 'string', title: 'Scheduled Date', format: 'date' },
      testingLab: { type: 'string', title: 'Testing Lab/Facility' },
      sampleGroupId: { type: 'string', title: 'Sample Group ID', description: 'If part of statistical sample' },
    },
    required: ['meterId', 'testType', 'scheduledDate'],
    uiHints: { regulatoryRequirement: 'textarea' },
  },
};

// ── Phase-level context descriptions ──
const PHASE_CONTEXT = {
  identify: 'This phase defines and validates the target meter population. Steps here determine which meters will be included in the program, check eligibility, and prioritize deployment waves.',
  engage: 'This phase manages all customer-facing communications. Steps handle notifications, scheduling, reminders, and confirmations to ensure customers are prepared for meter work.',
  deploy: 'This phase covers physical field operations. Steps track crew dispatch, site arrival, gaining access, taking readings, performing the meter swap, and verifying the installation.',
  activate: 'This phase brings the new meter online. Steps handle HES registration, network commissioning, first data read verification, and MDM data quality validation.',
  'customer-impact': 'This phase updates billing and customer systems. Steps link the new meter to CIS, handle prorated billing, assign appropriate tariffs, and generate the first bill.',
};

function getContextualDescription(step, phase, flowDefinition) {
  const phaseSteps = (flowDefinition?.steps?.[phase.id] || []).filter(s => s.enabled);
  const stepIndex = phaseSteps.findIndex(s => s.id === step.id);
  const prevStep = stepIndex > 0 ? phaseSteps[stepIndex - 1] : null;
  const nextStep = stepIndex < phaseSteps.length - 1 ? phaseSteps[stepIndex + 1] : null;

  const phaseCtx = PHASE_CONTEXT[phase.id] || `Phase: ${phase.name}`;
  const position = `Step ${stepIndex + 1} of ${phaseSteps.length} in **${phase.shortName || phase.name}** phase`;

  let flow = '';
  if (prevStep) flow += `Previous step: **${prevStep.name}** (${prevStep.detail || 'no detail'})\n`;
  flow += `Current step: **${step.name}** (${step.detail || 'no detail'})\n`;
  if (nextStep) flow += `Next step: **${nextStep.name}** (${nextStep.detail || 'no detail'})`;

  return { phaseCtx, position, flow };
}

function resolveSchema(step, phase) {
  // First try exact match on step.id
  if (STEP_SCHEMAS[step.id]) return STEP_SCHEMAS[step.id];

  // Then try keyword match on step name + detail
  const text = `${step.name} ${step.detail || ''} ${phase.name || phase.shortName || ''}`.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;
  for (const [key, schema] of Object.entries(STEP_SCHEMAS)) {
    const desc = (schema.description || '').toLowerCase();
    const keyWords = key.replace(/-/g, ' ').split(/\s+/);
    const descWords = desc.split(/\s+/).filter(w => w.length > 4);
    const allWords = [...keyWords, ...descWords.slice(0, 5)];
    const score = allWords.filter(w => text.includes(w)).length / Math.max(allWords.length, 1);
    if (score > bestScore) { bestScore = score; bestMatch = schema; }
  }
  if (bestScore > 0.2 && bestMatch) return bestMatch;

  // Fallback
  return {
    description: `Generic data capture for ${step.name}`,
    properties: {
      status: { type: 'string', title: 'Step Status', enum: ['completed', 'in-progress', 'blocked', 'skipped', 'failed'] },
      completedBy: { type: 'string', title: 'Completed By' },
      completedAt: { type: 'string', title: 'Completed At', format: 'date-time' },
      notes: { type: 'string', title: 'Notes' },
      evidenceUrl: { type: 'string', title: 'Evidence / Attachment URL', format: 'uri' },
    },
    required: ['status'],
    uiHints: { notes: 'textarea' },
  };
}

function buildUiSchema(properties, hints = {}) {
  const defaults = {
    notes: { 'ui:widget': 'textarea' },
    specialInstructions: { 'ui:widget': 'textarea' },
    conditions: { 'ui:widget': 'textarea' },
    hazardNotes: { 'ui:widget': 'textarea' },
    justification: { 'ui:widget': 'textarea' },
    selectionCriteria: { 'ui:widget': 'textarea' },
    ineligibilityReason: { 'ui:widget': 'textarea' },
    regulatoryRequirement: { 'ui:widget': 'textarea' },
    exclusions: { 'ui:widget': 'textarea' },
  };
  const ui = {};
  for (const key of Object.keys(properties)) {
    if (hints[key]) ui[key] = { 'ui:widget': hints[key] };
    else if (defaults[key]) ui[key] = defaults[key];
  }
  return ui;
}

// ── Fuzzy field finder: matches user text to existing schema fields ──
function findField(text, properties) {
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const words = lower.split(/\s+/);

  let bestField = null;
  let bestScore = 0;

  for (const [key, prop] of Object.entries(properties)) {
    const keyLower = key.toLowerCase().replace(/_/g, ' ');
    const titleLower = (prop.title || '').toLowerCase();
    const combined = keyLower + ' ' + titleLower;

    // Exact substring match in key or title
    if (keyLower.includes(lower) || titleLower.includes(lower)) return key;
    if (lower.includes(keyLower) || lower.includes(titleLower.replace(/[^a-z0-9\s]/g, ''))) return key;

    // Word overlap scoring
    const score = words.filter(w => combined.includes(w)).length / words.length;
    if (score > bestScore) { bestScore = score; bestField = key; }
  }

  return bestScore >= 0.5 ? bestField : null;
}

// ── Pattern-match user refinement requests (natural language) ──
function applyRefinement(text, schema, uiSchema) {
  const lower = text.toLowerCase().trim();
  const updated = JSON.parse(JSON.stringify(schema));
  const updatedUi = JSON.parse(JSON.stringify(uiSchema || {}));

  // ── Auto-generate / read-only / not changeable / not editable / system generated / display only ──
  if (/\b(auto[- ]?generat\w*|display[- ]?only|read[- ]?only|not\s+(changeable|editable)|system\s+generat\w*|disabled|non[- ]?editable|uuid|immutable|locked)\b/.test(lower)) {
    const field = findField(lower.replace(/\b(should\s+be|is|make\s+it|make|set|an?|the|field)\b/g, '').replace(/\b(auto[- ]?generat\w*|display[- ]?only|read[- ]?only|not\s+changeable|not\s+editable|disabled|immutable|locked|system\s+generat\w*|uuid)\b/g, ''), updated.properties);
    if (field) {
      updatedUi[field] = { ...(updatedUi[field] || {}), 'ui:readonly': true };
      updated.properties[field].default = updated.properties[field].default || `AUTO-${Date.now().toString(36).toUpperCase()}`;
      updated.properties[field].description = (updated.properties[field].description || '') + ' (auto-generated)';
      return { schema: updated, uiSchema: updatedUi, msg: `Made **"${updated.properties[field].title}"** read-only / auto-generated. It will be pre-filled and locked.` };
    }
  }

  // ── Hidden / hide / don't show ──
  if (/\b(hidden|hide|don'?t\s+show|invisible|remove\s+from\s+view)\b/.test(lower)) {
    const field = findField(lower.replace(/\b(should\s+be|make\s+it|make|set|hidden|hide|don'?t\s+show|invisible)\b/g, ''), updated.properties);
    if (field) {
      updatedUi[field] = { ...(updatedUi[field] || {}), 'ui:widget': 'hidden' };
      return { schema: updated, uiSchema: updatedUi, msg: `Made **"${updated.properties[field].title}"** hidden. It will be included in submissions but not shown to users.` };
    }
  }

  // ── Add a field (flexible) ──
  if (/\b(add|include|need|want|insert)\b/.test(lower) && /\b(field|input|column|for|to\s+capture)\b/.test(lower)) {
    const cleaned = lower
      .replace(/\b(add|include|need|want|insert|please|can\s+you|a|an|the|new|field|input|column|for|to\s+capture)\b/g, '')
      .trim();
    if (cleaned.length > 1) {
      const fieldName = cleaned.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      const title = cleaned.replace(/\b\w/g, c => c.toUpperCase());
      updated.properties[fieldName] = { type: 'string', title };
      return { schema: updated, uiSchema: updatedUi, msg: `Added **"${title}"** field.` };
    }
  }

  // ── Make required ──
  if (/\b(required|mandatory|must\s+fill|compulsory)\b/.test(lower)) {
    const field = findField(lower.replace(/\b(should\s+be|is|make\s+it|make|set|required|mandatory|must\s+fill|compulsory)\b/g, ''), updated.properties);
    if (field) {
      updated.required = [...new Set([...(updated.required || []), field])];
      return { schema: updated, uiSchema: updatedUi, msg: `Made **"${updated.properties[field].title}"** required.` };
    }
  }

  // ── Make optional ──
  if (/\b(optional|not\s+required|unrequired)\b/.test(lower)) {
    const field = findField(lower.replace(/\b(should\s+be|is|make\s+it|make|set|optional|not\s+required)\b/g, ''), updated.properties);
    if (field) {
      updated.required = (updated.required || []).filter(r => r !== field);
      return { schema: updated, uiSchema: updatedUi, msg: `Made **"${updated.properties[field].title}"** optional.` };
    }
  }

  // ── Remove / delete field ──
  if (/\b(remove|delete|drop|get\s+rid\s+of|don'?t\s+need)\b/.test(lower)) {
    const field = findField(lower.replace(/\b(remove|delete|drop|get\s+rid\s+of|don'?t\s+need|the|please|field|input)\b/g, ''), updated.properties);
    if (field) {
      const title = updated.properties[field].title || field;
      delete updated.properties[field];
      delete updatedUi[field];
      updated.required = (updated.required || []).filter(r => r !== field);
      return { schema: updated, uiSchema: updatedUi, msg: `Removed **"${title}"** field.` };
    }
  }

  // ── Change type to number / integer / boolean / date ──
  const typeMatch = lower.match(/\b(number|integer|boolean|date|checkbox|toggle|numeric|text|email|url)\b/);
  if (typeMatch) {
    const typeMap = {
      number: 'number', integer: 'integer', numeric: 'number',
      boolean: 'boolean', checkbox: 'boolean', toggle: 'boolean',
      date: 'string', text: 'string', email: 'string', url: 'string',
    };
    const formatMap = { date: 'date', email: 'email', url: 'uri' };
    const field = findField(lower.replace(/\b(should\s+be|make\s+it|make|set|change|convert|to|a|an|the|type|number|integer|boolean|date|checkbox|toggle|numeric|text|email|url|field)\b/g, ''), updated.properties);
    if (field && typeMap[typeMatch[1]]) {
      updated.properties[field].type = typeMap[typeMatch[1]];
      if (formatMap[typeMatch[1]]) updated.properties[field].format = formatMap[typeMatch[1]];
      else delete updated.properties[field].format;
      if (typeMatch[1] === 'boolean' || typeMatch[1] === 'checkbox' || typeMatch[1] === 'toggle') {
        updated.properties[field].default = updated.properties[field].default ?? false;
      }
      return { schema: updated, uiSchema: updatedUi, msg: `Changed **"${updated.properties[field].title}"** to type **${typeMap[typeMatch[1]]}**${formatMap[typeMatch[1]] ? ` (format: ${formatMap[typeMatch[1]]})` : ''}.` };
    }
  }

  // ── Set default value ──
  const defaultMatch = lower.match(/\b(?:default|pre[- ]?fill|initial)\s+(?:value\s+)?(?:of|for|to|=|:)?\s*(.+?)(?:\s+(?:should|to)\s+(.+))?$/);
  if (defaultMatch) {
    const parts = defaultMatch[0];
    const field = findField(parts.replace(/\b(default|pre[- ]?fill|initial|value|of|for|to|should|be|set)\b/g, ''), updated.properties);
    if (field) {
      const valPart = lower.split(/(?:to|=|:|\bshould\s+be)\s+/).pop()?.trim();
      if (valPart) {
        const val = valPart === 'true' ? true : valPart === 'false' ? false : isNaN(Number(valPart)) ? valPart : Number(valPart);
        updated.properties[field].default = val;
        return { schema: updated, uiSchema: updatedUi, msg: `Set default value of **"${updated.properties[field].title}"** to **${JSON.stringify(val)}**.` };
      }
    }
  }

  // ── Add description / help text ──
  if (/\b(description|help\s+text|tooltip|hint|placeholder)\b/.test(lower)) {
    const field = findField(lower.replace(/\b(add|set|change|update|description|help\s+text|tooltip|hint|placeholder|for|to|on|the)\b/g, ''), updated.properties);
    if (field) {
      const descPart = lower.split(/(?:to|:|=|should\s+(?:be|say))\s+/).pop()?.trim();
      if (descPart && descPart.length > 3) {
        updated.properties[field].description = descPart;
        return { schema: updated, uiSchema: updatedUi, msg: `Set description on **"${updated.properties[field].title}"** to *"${descPart}"*.` };
      }
    }
  }

  // ── Dropdown / options ──
  if (/\b(dropdown|options|choices|select|enum)\b/.test(lower)) {
    const field = findField(lower.replace(/\b(add|change|set|dropdown|options|choices|select|enum|for|to|on|with|the|a)\b/g, ''), updated.properties);
    const optsPart = lower.match(/(?:with|:|options?|choices?)\s+(.+)/);
    if (field && optsPart) {
      const options = optsPart[1].split(/,\s*|;\s*|\s+and\s+/).map(s => s.trim()).filter(Boolean);
      if (options.length > 0) {
        updated.properties[field].enum = options;
        return { schema: updated, uiSchema: updatedUi, msg: `Set dropdown options on **"${updated.properties[field].title}"**: ${options.join(', ')}` };
      }
    }
  }

  // ── Rename ──
  if (/\b(rename|change\s+(?:the\s+)?(?:name|title|label))\b/.test(lower)) {
    const parts = lower.split(/\s+to\s+/);
    if (parts.length === 2) {
      const field = findField(parts[0].replace(/\b(rename|change|the|name|title|label|of|field)\b/g, ''), updated.properties);
      if (field) {
        const newTitle = parts[1].trim().replace(/\b\w/g, c => c.toUpperCase());
        updated.properties[field].title = newTitle;
        return { schema: updated, uiSchema: updatedUi, msg: `Renamed **"${field}"** to **"${newTitle}"**.` };
      }
    }
  }

  // ── Textarea / multiline ──
  if (/\b(textarea|multi[- ]?line|long\s+text|big\s+(?:text|input))\b/.test(lower)) {
    const field = findField(lower.replace(/\b(make|set|change|textarea|multi[- ]?line|long\s+text|big\s+text|big\s+input|the|a|to)\b/g, ''), updated.properties);
    if (field) {
      updatedUi[field] = { ...(updatedUi[field] || {}), 'ui:widget': 'textarea' };
      return { schema: updated, uiSchema: updatedUi, msg: `Made **"${updated.properties[field].title}"** a textarea (multiline).` };
    }
  }

  return null;
}


export default function FormBuilderPanel({ step, phase, programId, existingConfig, onSave, flowDefinition }) {
  const resolved = resolveSchema(step, phase);
  const initialSchema = existingConfig?.formConfig?.jsonSchema || {
    type: 'object',
    title: `${step.name}`,
    description: resolved.description,
    properties: resolved.properties,
    required: resolved.required || [],
  };
  const initialUiSchema = existingConfig?.formConfig?.uiSchema || buildUiSchema(initialSchema.properties || {}, resolved.uiHints || {});

  const [schema, setSchema] = useState(initialSchema);
  const [uiSchema, setUiSchema] = useState(initialUiSchema);
  const [changedFields, setChangedFields] = useState(new Set());

  // Build contextual greeting
  const ctx = getContextualDescription(step, phase, flowDefinition);
  const fieldList = Object.entries(initialSchema.properties || {})
    .map(([k, v]) => `- **${v.title}** ${(initialSchema.required || []).includes(k) ? '(required)' : '(optional)'}${v.enum ? ` — options: ${v.enum.join(', ')}` : ''}${v.description ? ` — ${v.description}` : ''}`)
    .join('\n');

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `**${ctx.position}**\n${ctx.phaseCtx}\n\n**Context:**\n${ctx.flow}\n\n---\n\nBased on this step's purpose — *"${step.detail || resolved.description}"* — I've generated **${Object.keys(initialSchema.properties || {}).length} fields**:\n\n${fieldList}\n\n---\n\n**Powered by Claude** — describe any changes in plain English:\n- *"Cohort ID should be auto-generated and not editable"*\n- *"Add a photo upload field for site conditions"*\n- *"Make the address optional and add a dropdown for region"*\n- *"Remove exclusions, rename selection criteria to filter query"*\n- Or any other change you need!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [showSchema, setShowSchema] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Diff two schemas and return set of changed/added field keys
  const diffSchema = (oldSchema, newSchema) => {
    const changed = new Set();
    const oldProps = oldSchema?.properties || {};
    const newProps = newSchema?.properties || {};
    const oldRequired = new Set(oldSchema?.required || []);
    const newRequired = new Set(newSchema?.required || []);
    // Added or modified fields
    for (const key of Object.keys(newProps)) {
      if (!oldProps[key]) {
        changed.add(key); // new field
      } else if (JSON.stringify(oldProps[key]) !== JSON.stringify(newProps[key])) {
        changed.add(key); // modified
      } else if (oldRequired.has(key) !== newRequired.has(key)) {
        changed.add(key); // required status changed
      }
    }
    return changed;
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsThinking(true);

    try {
      const res = await fetch('/api/form-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema,
          uiSchema,
          message: userMsg,
          stepContext: {
            stepName: step.name,
            stepId: step.id,
            stepDetail: step.detail,
            phaseName: phase.name || phase.shortName,
            phaseId: phase.id,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error === 'no-api-key') throw new Error('no-api-key');
        throw new Error(err.error || 'API error');
      }

      const result = await res.json();
      if (result.schema) {
        const diff = diffSchema(schema, result.schema);
        setChangedFields(diff);
        setSchema(result.schema);
        setUiSchema(result.uiSchema || uiSchema);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `${result.message}\n\nPreview updated — **${Object.keys(result.schema.properties || {}).length} fields** total${diff.size > 0 ? ` · ${diff.size} field(s) changed` : ''}. What else?`,
        }]);
      } else {
        throw new Error('Invalid response');
      }
    } catch (err) {
      // Fallback to local pattern matching when Claude API unavailable
      const result = applyRefinement(userMsg, schema, uiSchema);
      if (result) {
        const diff = diffSchema(schema, result.schema);
        setChangedFields(diff);
        setSchema(result.schema);
        setUiSchema(result.uiSchema || buildUiSchema(result.schema.properties || {}, resolved.uiHints || {}));
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `${result.msg}\n\nPreview updated — **${Object.keys(result.schema.properties || {}).length} fields** total${diff.size > 0 ? ` · ${diff.size} field(s) changed` : ''}. What else?`,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `I couldn't understand that request. Try:\n- **"Make [field] auto-generated / read-only"**\n- **"Add a [field name] field"**\n- **"Remove [field name]"**\n- **"Make [field] required"** or **optional**\n- **"Rename [field] to [new name]"**\n- **"Set dropdown for [field] with option1, option2"**`,
        }]);
      }
    } finally {
      setIsThinking(false);
    }
  };

  const handleDeploy = () => {
    onSave?.({
      configType: 'form',
      formConfig: {
        jsonSchema: schema,
        uiSchema,
        formTitle: schema.title || `${step.name} Form`,
        formDescription: resolved.description || `Form for ${step.name} step`,
      },
    });
  };

  return (
    <div className="flex h-full">
      {/* Left: Chat */}
      <div className="w-[60%] flex flex-col border-r border-slate-200">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'assistant' ? 'bg-purple-100' : 'bg-blue-100'
              }`}>
                {msg.role === 'assistant'
                  ? <Bot className="w-4 h-4 text-purple-600" />
                  : <User className="w-4 h-4 text-blue-600" />
                }
              </div>
              <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'assistant' ? 'bg-slate-100 text-slate-700' : 'bg-blue-600 text-white'
              }`}>
                <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                  __html: msg.content
                    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    .replace(/^---$/gm, '<hr class="my-2 border-slate-300"/>')
                    .replace(/^- /gm, '&bull; ')
                    .replace(/\n/g, '<br/>')
                }} />
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-100">
                <Bot className="w-4 h-4 text-purple-600" />
              </div>
              <div className="bg-slate-100 rounded-xl px-4 py-3 text-sm text-slate-400 flex items-center gap-1.5">
                <span className="animate-pulse">Thinking</span>
                <span className="inline-flex gap-0.5">
                  <span className="animate-bounce [animation-delay:0ms]">.</span>
                  <span className="animate-bounce [animation-delay:150ms]">.</span>
                  <span className="animate-bounce [animation-delay:300ms]">.</span>
                </span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isThinking && handleSend()}
              placeholder={isThinking ? 'Claude is thinking...' : 'Describe changes in plain English — powered by Claude...'}
              disabled={isThinking}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setShowSchema(!showSchema)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700"
            >
              <Code className="w-3.5 h-3.5" />
              {showSchema ? 'Hide' : 'Show'} JSON Schema
            </button>
            <button
              onClick={handleDeploy}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              <Sparkles className="w-4 h-4" />
              Deploy Form
            </button>
          </div>
          {showSchema && (
            <pre className="mt-3 p-3 bg-slate-900 text-green-400 rounded-lg text-xs font-mono overflow-auto max-h-48">
              {JSON.stringify(schema, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* Right: Live Preview */}
      <div className="w-[40%] flex flex-col bg-white">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
          <Eye className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Live Preview</span>
          <span className="text-xs text-slate-400 ml-auto">{Object.keys(schema.properties || {}).length} fields</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <FormPreview schema={schema} uiSchema={uiSchema} changedFields={changedFields} />
        </div>
      </div>
    </div>
  );
}
