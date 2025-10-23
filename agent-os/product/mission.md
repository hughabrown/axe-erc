# Product Mission

## Pitch

The HRDD Research Tool is an internal compliance automation platform that helps Axelera AI's Ethics Review Committee conduct rigorous human rights due diligence on defense sector customers by providing automated evidence collection, consistent risk assessment frameworks, and comprehensive audit trails across 60+ authoritative sources.

## Users

### Primary Customers

- **Ethics Review Committee (ERC)**: Three-member internal committee responsible for evaluating dual-use defense sector opportunities against human rights risk frameworks. Requires consistent, evidence-based assessments that can be completed within regulatory timeframes (1-2 days for preliminary screening, up to 2 weeks for enhanced due diligence).

- **Board of Directors**: Governance body that reviews and approves medium and high-risk defense sector opportunities. Requires clear, structured reports with comprehensive evidence and risk classifications to inform strategic decisions.

### User Personas

**Elena Rodriguez, Head of Legal** (45-55)
- **Role:** Chair of Ethics Review Committee, Chief Legal Officer
- **Context:** Manages regulatory compliance for Axelera AI's dual-use technology sales. Accountable to Board for HRDD process integrity and policy adherence.
- **Pain Points:** Manual research across 60+ sources is time-intensive and inconsistent. Difficulty maintaining audit trails. Evolving regulations require frequent methodology updates. Risk of human error in evidence gathering.
- **Goals:** Accelerate assessment turnaround without compromising quality. Ensure defensible, evidence-based decisions. Maintain flexibility as policies evolve. Create audit-ready documentation.

**Marcus Chen, Director AI Integrated Systems** (40-50)
- **Role:** ERC member, technical expert on AI chip applications and dual-use capabilities
- **Context:** Evaluates end-use application risks and weaponization potential for defense sector deals. Needs deep understanding of how customer use cases align with prohibited activities.
- **Pain Points:** Technical use cases require cross-referencing against multiple frameworks (Wassenaar, CCL, autonomous weapons conventions). Incomplete customer dossiers delay assessments. Difficult to track precedent decisions.
- **Goals:** Quickly identify prohibited use cases. Access comprehensive technical documentation on customer applications. Compare current opportunities against past assessments.

**Sarah Williams, Chief of Staff** (35-45)
- **Role:** ERC member, process owner for cross-functional coordination
- **Context:** Coordinates between Sales, Legal, and Board. Manages ERC workflow and reporting cadence.
- **Pain Points:** Sales team provides inconsistent dossier quality. Board reporting requires reformatting research outputs. No centralized system for tracking assessment status. Manual follow-ups on information gaps.
- **Goals:** Standardize intake process from Sales. Automate status tracking and reporting. Reduce administrative overhead. Enable self-service for Sales team on preliminary assessments.

## The Problem

### Manual Human Rights Due Diligence is Time-Intensive and Error-Prone

Axelera AI's dual-use technology requires rigorous human rights due diligence on defense sector customers to comply with ESG commitments and regulatory frameworks. The current manual process requires ERC members to research 60+ authoritative sources across four risk domains (geographic context, customer profile, end-use application, and cross-cutting frameworks) for every opportunity. This research must be:

- **Consistent**: Same methodology applied to every assessment, regardless of researcher
- **Comprehensive**: All relevant sources checked, no critical evidence missed
- **Fast**: Preliminary screening within 1-2 days, enhanced DD within 2 weeks
- **Defensible**: Full citations and audit trails for Board review and regulatory scrutiny
- **Adaptable**: Methodology must evolve with policy updates and emerging frameworks

Manual research cannot reliably meet all five requirements. ERC members spend 8-16 hours per preliminary assessment and 40-80 hours per enhanced DD, creating bottlenecks in the sales pipeline. Evidence quality varies based on researcher experience and time pressure. Audit trails are incomplete. Policy updates require manual retraining.

**Our Solution:** Automated research orchestration using Firecrawl's web intelligence APIs and LangGraph workflow engine. The system executes consistent research protocols across all specified sources, extracts relevant evidence with full citations, applies risk assessment frameworks, and generates structured reports in standardized templates. Policy updates are implemented via configuration changes rather than manual retraining.

### Inconsistent Risk Assessment Creates Compliance Exposure

Without standardized templates and scoring frameworks, different ERC members may reach different risk classifications for similar opportunities. This inconsistency creates:

- **Regulatory Risk**: Inability to demonstrate consistent application of HRDD frameworks
- **Reputational Risk**: Inconsistent decisions may signal weak governance
- **Operational Risk**: Sales team cannot predict assessment outcomes, complicating pipeline management

**Our Solution:** Configurable risk assessment templates that encode HRDD Guide criteria into automated scoring logic. Every assessment applies the same framework, ensuring consistency while maintaining flexibility for ERC judgment on edge cases.

### Incomplete Audit Trails Undermine Defensibility

Current assessments live in email threads and shared documents. When questioned by Board or regulators, reconstructing the evidence trail for a past decision requires manual archaeology. This undermines the defensibility of the HRDD process.

**Our Solution:** Comprehensive audit trails capturing all sources consulted, evidence extracted, risk factors identified, and decision rationale. Every assessment is self-documenting and immediately available for review.

## Differentiators

### Purpose-Built for Human Rights Due Diligence Workflows

Unlike general-purpose research tools or generic compliance software, the HRDD Research Tool is architected specifically for the three-factor risk assessment framework (geographic context, customer profile, end-use application) mandated by Axelera's ESG policy. The system:

- **Understands HRDD Frameworks**: Encodes knowledge of UNGP, OECD guidance, Wassenaar Arrangement, and other authoritative frameworks
- **Follows Compliance Workflows**: Orchestrates research in the exact sequence required by the HRDD Guide
- **Generates Compliant Outputs**: Produces reports in the exact template format required for ERC and Board review

This results in zero training time for ERC members and immediate compliance readiness.

### Configurable Methodology Supports Policy Evolution

Unlike rigid compliance platforms that require vendor updates, the HRDD Research Tool exposes policy as configuration. When regulations change or Axelera updates its HRDD Guide:

- **Research Sources**: Add/remove websites without code changes
- **Report Templates**: Modify output structure via template files
- **Risk Scoring**: Adjust weighting and thresholds via configuration
- **Prohibited Activities**: Update screening criteria in policy files

This results in same-day policy implementation instead of months-long vendor engagement cycles.

### Evidence-First Architecture Ensures Defensibility

Unlike AI systems that generate opinionated summaries, the HRDD Research Tool prioritizes evidence provenance. Every claim in the output report links to:

- **Source URL**: Direct link to authoritative source
- **Extract Date**: Timestamp of data collection
- **Relevant Quote**: Exact text supporting the finding
- **Risk Factor**: Which HRDD criterion the evidence addresses

This results in audit-ready documentation that withstands Board scrutiny and regulatory review.

### Built on Proven Firesearch Foundation

Unlike building from scratch, the HRDD Research Tool extends Axelera's existing Firesearch platform, which has demonstrated:

- **Scalability**: Handles 24 parallel searches across complex multi-step workflows
- **Reliability**: Production-tested error handling and retry logic
- **Quality**: GPT-4o synthesis with citation validation
- **Performance**: Sub-minute turnaround on complex research queries

This results in faster time-to-value (months instead of years) and lower technical risk.

## Key Features

### Core Features (MVP)

- **Automated Source Coverage:** Systematically researches all 60+ authoritative sources specified in sites.md across four risk domains (geographic context, customer profile, end-use application, cross-cutting frameworks). Ensures no critical evidence is missed due to time pressure or human oversight.

- **Evidence Extraction & Citation:** Processes web research results to identify relevant findings, extract specific quotes, capture source URLs and metadata. Every finding includes complete citation trail for audit defensibility.

- **Three-Factor Risk Assessment with RAG Classification:** Generates structured reports with Red/Amber/Green risk assessment for each of the three risk factors (Geographic Context, Customer Profile, End-Use Application). Includes overall risk classification (Low/Medium/High), detailed findings with full citations, information gaps, and recommended next steps. Integrated into report generation to ensure consistent evaluation framework.

- **Configurable Research Sources:** Configuration system that reads sites.md to determine which sources to research. ERC can add/remove sources without code changes. Version-controlled configuration changes track policy evolution.

- **Configurable Report Templates:** Template engine that separates report structure from content generation. ERC can modify report sections, ordering, and formatting via template files without engineering dependencies.

### Workflow Features (MVP)

- **Information Gap Identification:** Flags missing or insufficient information in research results. Generates specific questions for Sales team follow-up. Helps ERC identify what additional information is needed.

- **Complete Audit Trail:** Comprehensive logging of all research executed (queries, sources, timestamps), evidence extracted, risk factors identified, and decision rationale. Immutable and exportable for regulatory review.

### Future Workflow Enhancements

- **Structured Dossier Intake:** Guided form for Sales team to submit customer information with validation logic. (MVP accepts free-text input to accelerate development)

- **Preliminary vs. Enhanced DD Modes:** Two-tier assessment workflow matching ERC process. Preliminary screening (1-2 days) focuses on sanctions lists, conflict zones, and prohibited activities. Enhanced DD (2 weeks) adds comprehensive geographic context, customer business activities, supply chain analysis, and precedent review.

- **Assessment Status Dashboard:** Dashboard view of all active assessments with current phase, elapsed time, assigned ERC members, and blockers. Enables Chief of Staff to manage workflow and identify bottlenecks.

- **Board Reporting Package:** One-click generation of Board-ready summary report with executive overview, risk classification, key findings, supporting evidence, and ERC recommendation.

- **Precedent Comparison:** Search historical assessments for similar customers, use cases, or deployment contexts. Identify how past opportunities were classified. Ensure consistency with established precedent.

- **Data Retention Controls:** Configurable retention policies for customer dossiers and assessment reports. Support for data deletion requests. Compliance with privacy regulations (GDPR, etc.).

### Advanced Features

- **Continuous Monitoring:** Optional periodic re-assessment of approved customers for material changes in risk profile (e.g., customer sanctioned, deployment country human rights deterioration, use case modification). Automated alerts when risk level changes.

- **Custom Research Queries:** Allow ERC members to supplement automated research with ad-hoc queries on specific concerns (e.g., "Has customer been involved in autonomous weapons development?"). Results integrated into assessment report.

- **Multi-Language Source Support:** Research sources in multiple languages relevant to deployment contexts (Arabic, Mandarin, Russian, etc.). Automated translation of findings for ERC review.

- **Collaborative Review:** Enable multiple ERC members to review same assessment concurrently with inline comments and discussion threads. Track consensus-building on risk classification.

## Success Metrics

### Operational Efficiency

- **Assessment Turnaround Time:** Reduce preliminary screening from 8-16 hours to 1-2 hours. Reduce enhanced DD from 40-80 hours to 8-16 hours.
- **Source Coverage Completeness:** Achieve 100% coverage of specified sources for every assessment (up from estimated 60-80% with manual research).
- **ERC Time Allocation:** Shift ERC time from evidence gathering (currently 70% of effort) to evidence analysis and decision-making (target 70% of effort).

### Quality & Consistency

- **Assessment Consistency:** Eliminate variance in risk classification for similar opportunities (measured by inter-rater reliability before/after tool adoption).
- **Evidence Quality:** Achieve 100% citation coverage for all findings in assessment reports (up from estimated 40-60% with manual reports).
- **Policy Compliance:** Zero instances of missed prohibited activities or sanctions list hits (currently unquantified risk with manual screening).

### Defensibility & Governance

- **Audit Readiness:** Reduce audit trail reconstruction time from hours/days to minutes (immediate export of complete assessment documentation).
- **Board Confidence:** Measure Board satisfaction with assessment quality and presentation (qualitative survey before/after).
- **Regulatory Compliance:** Zero findings of inadequate HRDD process in external audits or regulatory reviews.

### Business Impact

- **Sales Pipeline Velocity:** Reduce time-to-decision for defense sector opportunities by 50% (currently 2-4 weeks from dossier submission to ERC decision).
- **Deal Volume Capacity:** Increase ERC capacity to assess 2-3x more opportunities per quarter without additional headcount.
- **Risk-Adjusted Revenue:** Maintain or improve risk profile (no increase in high-risk approvals) while increasing deal volume in low/medium-risk categories.

### Adoption & Usability

- **ERC Adoption Rate:** Achieve 100% usage for all new assessments within 3 months of launch.
- **Sales Dossier Quality:** Improve dossier completeness on first submission from estimated 40% to 80% (measured by information gap rate).
- **System Reliability:** Maintain 99%+ uptime during business hours. Sub-5-minute latency for preliminary assessment completion.
