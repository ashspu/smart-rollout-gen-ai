# CODEX BUILD SPEC — SMART ROLLOUT PLATFORM
## Authoritative Build Document

**Version:** 2.0  
**Date:** January 31, 2026  
**Classification:** Internal Build Specification

---

## 0. AMI INDUSTRY CONTEXT (Derived from Industry Research)

This section captures the key concerns, challenges, and value drivers identified across multiple utility AMI programs. Smart Rollout is designed to address **all** of these concerns.

### Industry Sources Analyzed
- **PECO Energy** — AMI 2.0 Failure Curves & Considerations (TesCOOL 2025)
- **BC Hydro** — Smart Metering & Infrastructure Program Business Case
- **NB Power** — AMI Quarterly Status Report (Sept 2024)
- **Hydro One** — Distribution & Transmission Rate Application Executive Summary

### Key AMI Program Challenges (Smart Rollout Must Address)

| Challenge Area | Industry Evidence | Smart Rollout Response |
|---------------|-------------------|----------------------|
| **Meter Failure Lifecycle** | PECO: Meters have 15-year service life; failure modes include capacitor dry-out, crystal oscillator aging, MOV surge suppressor wear, LCD fade, memory cycle limits | Failure probability modeling by installation cohort; proactive replacement scheduling |
| **Deployment Rate Management** | PECO: 10% annual in years 1-5, then 5% continuous; meter shop sized for 25,000/year | Capacity-aware program planning; deployment rate governance |
| **Customer Opt-Out Risk** | NB Power: 1.45% Do Not Install rate (target <2%); 92% satisfaction with upgrade experience | Customer experience tracking; opt-out risk monitoring |
| **Benefits Realization** | BC Hydro: $1.6B in quantified benefits over 20 years; 80% from operational efficiencies | Benefits tracker tied to program execution; variance analysis |
| **Cost Overruns** | NB Power: MDM Capital 143% of budget; Corp Services 337% over due to delays | Budget vs. actual tracking; cost variance alerts |
| **Meter Base Repairs** | NB Power: 0.75% target for base repairs; trending at 0.73% | Installation exception tracking; base repair rate monitoring |
| **Multi-Vendor Coordination** | NB Power: Itron (meters/HES), Siemens (MDM), Olameter (deployment), Utegration (integration) | Vendor milestone tracking; integration checkpoint governance |
| **Regulatory Reporting** | NB Power: Quarterly reports to NBEUB; progress indicators mandated | Built-in regulatory dashboard; compliance reporting |
| **Schedule Accuracy** | All utilities: Mass deployment delays common; COVID impact documented | Schedule variance monitoring; risk-adjusted forecasting |
| **Technology Obsolescence** | PECO: Gen 1 meters from 2011; V2 protocols now available; AMI 2.0 promises more capabilities | Technology migration planning; obsolescence curve modeling |

### Quantified Benefits Categories (Industry-Standard)

From BC Hydro's SMI Business Case — these are the benefit streams Smart Rollout must help realize:

| Benefit Type | Description | Expected Value |
|-------------|-------------|----------------|
| **Meter Reading Automation** | Elimination of manual reads | $182-247M PV |
| **Remote Reconnect Automation** | Reduced truck rolls | $42-52M PV |
| **Outage Management Efficiency** | Faster notification & response | $5-15M PV |
| **Voltage Optimization** | Distribution system & customer sites | $133-298M PV |
| **Theft Detection** | Revenue protection | $632-832M PV |
| **Capacity Savings** | Peak demand reduction via TOU rates | $30-250M PV |
| **Customer Conservation** | In-home feedback tools | $170-270M PV |

### Lessons Learned from Industry (Smart Rollout Design Principles)

| Lesson | Industry Experience | Smart Rollout Implication |
|--------|-------------------|--------------------------|
| **Technology Timing** | Early adopters replaced meters twice | Support for Next-Gen meter identification; phased deployment |
| **Meter Accuracy Concerns** | Heat waves + new meters = perceived inaccuracy complaints | Customer complaint correlation tracking |
| **Rate Structure Timing** | TOU rates + meter install = higher bills = complaints | Tariff validation gate before first bill |
| **Customer Communication** | Poor notice = poor experience | Notification milestone tracking; communication compliance |
| **Privacy & Security** | Afterthought implementation fails | Security checkpoint in commissioning workflow |
| **Portal & App Delivery** | Underbudgeted; RFP delays common | Customer portal enablement as tracked benefit |

### AMI 2.0 Capabilities (Next-Gen Considerations)

From PECO's AMI 2.0 planning:

| Capability | Description |
|------------|-------------|
| **Increased Sample Rates** | 60-, 15-, 5-, 1-minute intervals |
| **Multiple Recording Channels** | Up to 32 independent channels |
| **Distributed Intelligence** | On-board decision making at meter edge |
| **EV Management** | Electric vehicle charging coordination |
| **Voltage Regulation** | Real-time voltage monitoring & control |
| **Non-Intrusive Load Monitoring** | Load disaggregation analytics |
| **PLTE Communications** | Private LTE network options |
| **WiFi-Enabled Meters** | HAN connectivity |
| **Matter Protocol** | In-home device integration |

**Smart Rollout must support both Gen 1 and Next-Gen meter programs.**

---

## 1. PLATFORM INTENT (Non-Negotiable Framing)

**Smart Rollout is an AI-driven, process-aware Meter & Mass-Activity Management Platform that ensures every customer touchpoint in a meter program leads to a successful customer experience — from identification through first bill.**

The platform is designed to:

- Orchestrate and govern **any large-scale, regulator-visible utility program**
- Protect the **end-to-end customer experience** across all touchpoints
- Ensure every meter reaches **billing readiness** without customer friction
- Make benefits realization **observable, defensible, and auditable**

### Core Customer Journey Scope

Smart Rollout manages the **complete customer journey**, not just field operations:

| Phase | Activities | Customer Touchpoints |
|-------|-----------|---------------------|
| **Identification** | Meter identification, eligibility validation | — |
| **Customer Engagement** | Scheduling, notification, confirmation | Appointment letters, notifications, confirmations |
| **Field Deployment** | Dispatch, access, installation, verification | On-site interaction, access coordination |
| **Activation** | AMI registration, commissioning, first comm check, reading validation | — |
| **Billing Setup** | CIS update, tariff assignment, net metering config, billing validation | — |
| **Customer Closure** | First bill generated, customer complete | First bill delivery (success = no billing surprises) |

**Success Metric:** Customer receives accurate first bill on new meter, on time, with correct tariff/rate.

---

## 2. PRIMARY OBJECTIVE

Demonstrate how an **AI-assisted, process-aware control layer** enables utilities to:

- Define a mass program clearly
- Plan work intelligently (without scheduling)
- Track execution via lifecycle signals
- Detect risk early
- Prove control and progress to regulators with confidence

This applies equally to:

- AMI rollouts
- Periodic meter testing
- Regulatory exchange programs
- Safety-driven replacement campaigns
- Any time-bound, high-volume field initiative

---

## 3. WHAT THIS IS (AND IS NOT)

### This **IS**

| Capability | Description |
|------------|-------------|
| Program Definition & Control Platform | Define, govern, and track mass utility programs |
| Process-Native Intelligence Layer | Lifecycle-signal-driven awareness across all program types |
| Regulatory Confidence Engine | Auditable, real-time proof of control and progress |
| Benefits Realization Assurance Mechanism | Observable value delivery against business case commitments |

### This is **NOT**

| Out of Scope | Clarification |
|--------------|---------------|
| Scheduling System | Does not assign time slots or appointments |
| Workforce Management Tool | Does not manage crews, routes, or labor |
| MDMS | Does not store or process meter data |
| Billing System | Does not generate or manage bills — but monitors billing outcomes |
| Device Telemetry Platform | Does not ingest raw meter communications |

**Execution systems remain where they are.**

**Smart Rollout sits above them, watching outcomes — including billing outcomes.**

---

## 4. CUSTOMER EXPERIENCE PROTECTION (Core Value Prop)

The primary value proposition is **protecting the customer experience** throughout meter program execution.

### Why This Matters

Every meter replacement is a customer touchpoint cascade:
- Customer receives appointment notification
- Customer grants access
- Installation occurs
- Meter is commissioned
- CIS is updated with new device
- Tariff/rate structure is validated
- First bill is generated and delivered

**Any failure in this chain = customer complaint risk**

### Observable Customer Experience Metrics

| Metric | What It Tells Us |
|--------|-----------------|
| First Bill Success Rate | % of meters that reach clean first bill |
| Billing Exception Rate | % of meters stuck in billing setup |
| CX at Risk | Meters with potential customer friction |
| Days to First Bill | Time from install to first successful bill |
| Appointment Success Rate | % of scheduled appointments completed |

**Smart Rollout ensures the program doesn't create customer complaints.**

---

## 5. PROGRAM DEFINITION MODEL

The platform allows a utility to **define a program** before execution.

### A Program Definition Includes:

| Element | Description |
|---------|-------------|
| Program Type | AMI, Test Cycle, Exchange, Safety Replacement, etc. |
| Target Population | Premises, meters, regions, cohorts |
| Required Lifecycle Milestones | Process gates that must be passed |
| Expected Outcomes | Process outcomes + business outcomes |
| Regulatory Commitments | Dates, thresholds, reporting requirements |
| Risk Tolerance Bands | Acceptable variance before escalation |

This definition becomes the **control contract**.

---

## 5. AI-ASSISTED PLANNING

### Role of the AI Agent

The AI agent **assists planning** — it does not execute.

It helps answer:

- Is this program definition internally consistent?
- Are milestones realistic given historical signal patterns?
- Where are the highest structural risks likely to emerge?
- What cohorts should be watched more closely?
- What signals must be present to declare success?

### Explicit Boundaries

| AI Agent Does | AI Agent Does NOT |
|---------------|-------------------|
| Validate program definitions | Assign crews |
| Assess milestone feasibility | Sequence appointments |
| Identify structural risks | Optimize routes |
| Recommend cohort focus areas | Override operational systems |
| Define success signal criteria | Control people or field work |

**Planning ≠ Scheduling**  
**Insight ≠ Control of people**

This boundary must be visible in the demo.

---

## 6. PROCESS-AWARE BY DESIGN

Every program is modeled as:

- A **process instance population**
- Governed by lifecycle signals
- With explicit milestones and failure modes

### Cross-Program Portability

| Dimension | Varies by Program | Platform Logic |
|-----------|-------------------|----------------|
| Lifecycle Shape | Yes | Identical |
| Signal Expectations | Yes | Identical |
| Risk Logic | Yes | Identical |
| Regulatory Reporting Lens | Yes | Identical |

AMI, Periodic Testing, and Regulatory Exchanges differ only in configuration.

The platform logic remains identical.

**This proves pluggability into any utility process.**

---

## 7. REGULATORY CONFIDENCE OBJECTIVE

The demo must show how the platform enables a utility to say:

> "We know the exact state of the program, the risks we are carrying, the customers affected, and the mitigations in flight."

| Requirement | Meaning |
|-------------|---------|
| Not after the fact | Real-time awareness |
| Not via manual reconciliation | System-driven truth |
| Not via spreadsheets | Auditable, governed data |

**This is the regulator-facing value.**

---

## 8. BENEFITS REALIZATION LENS

Each program must surface:

| Metric | Purpose |
|--------|---------|
| Progress vs Plan | Are we on track? |
| Risk-Adjusted Completion Outlook | What's the realistic end state? |
| Unbilled / Delayed Exposure | What revenue is at risk? |
| Repeat Work Avoided | Efficiency gains from getting it right |
| SLA Adherence | Contractual and regulatory compliance |
| Evidence of Active Management | Proof of control, not luck |

**This is how the benefits case stays alive beyond the business case slide.**

---

## 9. HOW AMI FITS — PECO AS FLAGSHIP EXAMPLE

The demo uses **PECO Energy's AMI 2.0 Meter Replacement Program** as the flagship example because:

- It is complex (1.72M meters across 5 counties)
- It is regulator-visible (PUC commitments)
- Failure curves are real (based on PECO's own research)
- Billing impact is material ($12.5M revenue protection target)
- It represents **industry-typical challenges** seen across BC Hydro, NB Power, and others

### Industry Context — Why AMI Programs Fail

Based on industry research, AMI programs fail when:

| Failure Mode | Evidence | Smart Rollout Mitigation |
|-------------|----------|-------------------------|
| **Deployment overwhelms meter shop** | PECO: Shop sized for 25K/year; 10% deployment = 172K needed | Capacity-aware planning gates |
| **Benefits not tracked to execution** | BC Hydro: "Implementing formal benefit realization framework" | Benefits tied to milestones |
| **Customer communication failures** | NB Power: 27% didn't recall pre-install info | Notification compliance tracking |
| **Vendor coordination gaps** | NB Power: 4+ major vendors requiring integration | Vendor milestone checkpoints |
| **Budget overruns from delays** | NB Power: Project team budget exhausted 24 months early | Cost variance alerting |
| **Technology transitions mid-program** | PECO: NextGen meters deployed during Gen 1 program | Technology cohort tracking |
| **Meter base repairs unplanned** | NB Power: Meter base = customer property, repairs add cost | Exception rate monitoring |

### PECO Program Definition (as loaded in demo)

| Element | Value |
|---------|-------|
| Program | AMI 2.0 Proactive Replacement |
| Population | 1,720,000 meters |
| Timeline | 2025-2029 (5 years) |
| Regions | Philadelphia, Montgomery, Delaware, Chester, Bucks |
| Cohorts | 5 age-based tiers (2008-2020 installs) |
| Risk Model | Failure probability by installation year |
| Deployment Rate | 10% Years 1-5, then 5% continuous |
| Meter Shop Capacity | 25,000 meters/year |
| NextGen Target | >75,000 already deployed |
| Vendor Platform | Sensus FlexNet → Next-Gen (Sensus + Aclara) |

### AMI Program Lifecycle — Full Scope

Based on industry programs, Smart Rollout tracks:

| Phase | Key Milestones | Risk Gates |
|-------|---------------|------------|
| **Program Definition** | Population identified, cohorts defined, regulatory commitment set | Definition completeness |
| **Procurement** | Meters ordered, network hardware secured, vendor contracts signed | Supply chain risk |
| **Network Deployment** | TGBs installed, RF coverage verified, HES configured | Communication coverage |
| **Mass Meter Deployment** | Area rollouts, customer notifications, installer dispatch | Deployment rate vs. capacity |
| **Customer Engagement** | Notification sent, access confirmed, opt-out processed | CX satisfaction, opt-out rate |
| **Installation** | Old meter removed, new meter installed, base repair (if needed) | Exception rate |
| **Commissioning** | AMI registration, first comm check, reading validation | Comm success rate |
| **Billing Integration** | CIS update, tariff assignment, rate structure validation | Billing exception rate |
| **First Bill** | Bill generated, delivered, no escalation | First bill success rate |
| **Steady State** | Continuous monitoring, proactive replacement cycle | Failure rate vs. forecast |

**But the takeaway must be:**

> "If you can control AMI at this level, you can control any mass utility program."

AMI is the **proof point**, not the **product boundary**.
PECO is the **example customer**, not the **only customer**.

---

## 10. AMI-SPECIFIC CONCERNS — SMART ROLLOUT COVERAGE

This section maps specific AMI management concerns (from industry research) to Smart Rollout capabilities.

### A. Meter Lifecycle & Failure Management

**Industry Evidence:** 
- PECO: "Electric Meters have no Utility serviceable components. Meter 'Failure' is seen to be a binary event."
- EEI Survey: Utilities see 10-20 year service life; most plan 15 years
- Failure modes: capacitor dry-out, crystal oscillator aging, MOV wear, LCD fade, memory limits

**Smart Rollout Coverage:**

| Capability | Description |
|------------|-------------|
| Cohort-Based Risk Modeling | Installation year drives failure probability |
| Proactive Replacement Prioritization | Oldest cohorts flagged for early action |
| Failure Rate Tracking | Actual vs. predicted failure rates by cohort |
| Obsolescence Planning | Technology generation visibility |

### B. Deployment Capacity Management

**Industry Evidence:**
- PECO: "10% and 5% deployment rate selected to ensure field operations and meter shop will not be overwhelmed"
- PECO Meter Shop: Sized for 25,000 meters/year
- Contract Installers: Used to fill remaining capacity

**Smart Rollout Coverage:**

| Capability | Description |
|------------|-------------|
| Capacity Constraint Modeling | Shop throughput as planning constraint |
| Deployment Rate Governance | Actual installs vs. rate targets |
| Contractor Utilization Tracking | Internal vs. contract split visibility |
| Overwhelm Risk Alerting | Flag when backlog exceeds capacity |

### C. Multi-Vendor Integration Complexity

**Industry Evidence:**
- NB Power: Itron (meters/HES), Siemens (MDM), Olameter (deployment), Utegration (integration)
- PECO: Meters from Aclara, Honeywell, Landis+Gyr, Sensus; head-end hosted by Sensus
- Integration is the #1 source of budget overruns

**Smart Rollout Coverage:**

| Capability | Description |
|------------|-------------|
| Vendor Milestone Tracking | Each vendor's deliverables vs. plan |
| Integration Checkpoint Gates | CIS/WFM/ESB/MDM/HES integration status |
| Handoff Visibility | Data flow between vendor systems |
| Issue Escalation by Vendor | Attribution of delays/failures |

### D. Customer Experience Protection

**Industry Evidence:**
- NB Power: 92% neutral/satisfied; 73% recalled pre-install info; 85% found info helpful
- BC Hydro: "Customer choice and support" — some utilities provided limited info
- Meter Base: Customer-owned; repairs add cost/time

**Smart Rollout Coverage:**

| Capability | Description |
|------------|-------------|
| Notification Compliance | % of customers notified before install |
| Access Success Rate | % of scheduled visits with successful access |
| Opt-Out Monitoring | Do Not Install list tracking (target <2%) |
| Complaint Correlation | Link complaints to program phases |
| First Bill Success | % of installs reaching clean first bill |

### E. Benefits Realization Assurance

**Industry Evidence:**
- BC Hydro: Implementing "formal benefit realization framework, base-lined with benefit streams"
- Benefits: 80% from operational efficiencies (reading automation, remote reconnect, etc.)
- NB Power: Quarterly reporting on quantified benefits realized

**Smart Rollout Coverage:**

| Capability | Description |
|------------|-------------|
| Benefit Stream Tracking | Each benefit category vs. plan |
| Milestone-to-Benefit Linkage | Benefits unlock as milestones pass |
| Variance Analysis | Expected vs. actual by category |
| Regulatory Benefit Reporting | Board-ready benefit status |

### F. Regulatory Compliance & Reporting

**Industry Evidence:**
- NB Power: NBEUB directed quarterly reporting; approved format with specific conditions
- Hydro One: OEB Filing Requirements; Custom IR framework
- All utilities: Regulatory commitments drive program timeline

**Smart Rollout Coverage:**

| Capability | Description |
|------------|-------------|
| Regulatory Dashboard | Real-time compliance visibility |
| Progress Indicators | Rollout, timeline, costs, benefits |
| Stakeholder Communication Log | Engagement history |
| Risk Register | Active risks and mitigations |

### G. Cost Management & Variance Control

**Industry Evidence:**
- NB Power: MDM Capital 143% of budget; Project Team budget exhausted 24 months early
- Drivers: Delays, hired services for project team, RFP requirements for portal
- BC Hydro: $930M authorized including contingency

**Smart Rollout Coverage:**

| Capability | Description |
|------------|-------------|
| Budget vs. Actual by Category | Capital, Operating, by work type |
| Variance Explanation | Root cause attribution |
| Contingency Consumption | Reserve tracking |
| Forecast Accuracy | Predicted vs. actual completion |

### H. Technology Transition Management

**Industry Evidence:**
- PECO: Gen 1 (2011) → Next-Gen (2022+); V2 protocols; new capabilities
- BC Hydro: "Metering technology has stabilized, standards now more open, robust and secure"
- Risk: Buying meters that will be obsolete before deployment complete

**Smart Rollout Coverage:**

| Capability | Description |
|------------|-------------|
| Meter Generation Tracking | Gen 1 vs. NextGen deployed |
| Capability Gap Analysis | Features available vs. activated |
| Protocol Version Visibility | V1 vs. V2 communication status |
| Technology Migration Planning | Transition cohort identification |

---

## 11. CODEX PROMPT HANDOFF

```
Build an AI-driven, process-aware Smart Rollout platform that manages 
large-scale utility programs using lifecycle signals only.

The platform must allow:
- Definition of a program
- AI-assisted planning (not scheduling)
- Process-based execution tracking
- Risk detection
- Regulator-ready assurance

Demonstrate the platform using an AMI 2.0 rollout, while making clear 
it applies equally to periodic testing and regulatory exchange programs.

Do not simulate:
- Meter telemetry
- Workforce scheduling
- Execution systems

Focus on:
- Control
- Risk
- Benefits realization
```

---

## 12. DEMO NARRATIVE REQUIREMENTS

### Opening Frame
The demo opens by establishing Smart Rollout as a **program control platform**, not an AMI tool.

### Program Definition Sequence
Show a utility defining a program with:
- Population scope
- Milestone requirements
- Regulatory commitments
- Risk tolerance

### AI Planning Assistance
Demonstrate the AI agent:
- Validating the program definition
- Identifying structural risks
- Recommending cohort focus
- **Explicitly not scheduling or assigning work**

### Execution Tracking
Show lifecycle signals driving:
- Progress visibility
- Risk emergence
- Cohort health

### Regulatory Confidence
Demonstrate the utility's ability to answer:
- Where are we?
- What's at risk?
- What are we doing about it?
- Can we prove it?

### Benefits Realization
Surface the metrics that keep the business case alive.

### Closing Frame
Reinforce: **This is a program control system. AMI is one use case.**

---

## 13. TECHNICAL BUILD BOUNDARIES

### In Scope for Build

| Component | Description |
|-----------|-------------|
| Program Definition UI | Interface for defining programs |
| AI Planning Agent | Claude-powered planning assistant |
| Lifecycle Signal Processor | Event-driven state management |
| Risk Detection Engine | Pattern-based risk identification |
| Regulatory Dashboard | Control and assurance visibility |
| Benefits Tracker | Value realization metrics |

### Out of Scope for Build

| Component | Reason |
|-----------|--------|
| Meter Telemetry Simulation | Not a device platform |
| Crew Scheduling Logic | Not a WFM tool |
| Route Optimization | Not an execution system |
| Billing Integration | Not a billing system |
| MDMS Functions | Not a meter data system |

---

## 14. SUCCESS CRITERIA

The demo succeeds if an observer concludes:

1. **"This protects the customer experience"** — meters don't become complaints
2. **"This covers the whole journey"** — from identification through first bill
3. **"This is a platform for controlling any mass utility program"** — not an AMI tool
4. **"The AI helps plan, it doesn't run things"** — clear boundary
5. **"I could use this for my next regulatory program"** — cross-program applicability
6. **"This is how I prove control to my regulator"** — confidence engine
7. **"This keeps my benefits case honest"** — value realization

---

## 15. FINAL CALIBRATION

This specification does three important things:

1. **Future-proofs the platform** beyond AMI
2. **Elevates AI** from "cool add-on" to planning intelligence
3. **Anchors value** in regulatory confidence and benefits realization

Most importantly, it prevents anyone from pigeonholing this as "that AMI rollout tool."

**It's a program control system.**

**That's the hill to stand on.**

---

*End of Codex Build Spec*
