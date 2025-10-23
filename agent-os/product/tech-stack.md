# Tech Stack

## Overview

The HRDD Research Tool is built on the existing Firesearch platform foundation, inheriting its proven Next.js/LangGraph architecture while adding compliance-specific capabilities. The tech stack prioritizes auditability, security, and configurability to meet the stringent requirements of human rights due diligence workflows.

## Application Framework & Runtime

### Next.js 15 (App Router)
- **Rationale:** Proven foundation from Firesearch. Enables server-side orchestration for sensitive research workflows while providing responsive UI for ERC users. App Router architecture supports streaming research progress and incremental report generation.
- **Trade-offs:** Vercel deployment may raise data sovereignty concerns for sensitive customer information. Alternative: Self-hosted Next.js on internal infrastructure.
- **Security Considerations:** Server components isolate API keys and sensitive logic from client. Edge runtime not used for HRDD workflows to maintain full audit trail visibility.

### TypeScript 5
- **Rationale:** Type safety is critical for compliance workflows where runtime errors could compromise assessment quality. Strong typing for dossier schemas, risk assessment logic, and configuration files prevents silent data corruption.
- **Standards Compliance:** Follows existing codebase conventions (strict mode, explicit return types, no any types in production code).

### Node.js 20+
- **Rationale:** LTS support for production stability. Required for LangGraph and LangChain runtime. Native support for streaming APIs used in research orchestration.
- **Alternative Considered:** Python for data processing, but TypeScript unification reduces deployment complexity and maintains consistency with Firesearch.

### Package Manager: npm
- **Rationale:** Consistency with existing Firesearch codebase. Adequate for current dependency management needs.

## Frontend

### React 19 (Server Components + Client Interactivity)
- **Rationale:** Inherited from Firesearch. Server Components enable secure data fetching for sensitive customer information. Client Components provide interactive assessment review interface for ERC.
- **Usage Pattern:** Server Components for dossier intake, report generation, audit trail exports. Client Components for assessment dashboard, real-time research progress, collaborative review.

### Tailwind CSS 4
- **Rationale:** Consistency with Firesearch UI. Rapid prototyping of compliance-focused interfaces (forms, reports, dashboards). Tailwind's utility-first approach supports iterative design as ERC provides feedback.
- **Customization:** Extended with Axelera branding tokens (colors, typography). Custom components for risk classification badges, evidence citation tooltips, audit trail timelines.

### Radix UI + shadcn/ui Components
- **Rationale:** Accessible, customizable primitives for compliance UI. Dialog for dossier intake, Popover for citation details, Tooltip for risk factor explanations, Accordion for report sections.
- **Accessibility:** WCAG 2.1 AA compliance required for ERC members with diverse accessibility needs.

## Orchestration & AI

### LangGraph
- **Rationale:** Core orchestration engine from Firesearch. Multi-step HRDD workflow (intake → research → analysis → synthesis → reporting) maps naturally to LangGraph state machine. Checkpointing enables pause/resume for long-running enhanced DD assessments.
- **HRDD-Specific Extensions:** Custom nodes for sanctions list screening, prohibited activity detection, geographic risk scoring. State management for tracking research coverage across 60+ sources.
- **Auditability:** LangGraph state snapshots provide complete audit trail of workflow execution (which nodes ran, when, with what inputs/outputs).

### LangChain
- **Rationale:** Abstracts LLM provider differences (OpenAI, Anthropic, future local models). Prompt management for risk assessment logic. Document loaders for processing Firecrawl markdown results.
- **Compliance Benefits:** Consistent prompt templates ensure reproducible risk assessments. Versioned prompt registry enables policy evolution tracking.

### OpenAI GPT-4o (Quality Model)
- **Rationale:** Proven synthesis quality from Firesearch. Used for final report generation, complex evidence analysis, and multi-source synthesis.
- **Compliance Considerations:** OpenAI API terms allow commercial use but data is sent to third party. Assess data processing agreement for customer information. Alternative: Azure OpenAI for EU data residency.
- **Cost Management:** GPT-4o reserved for synthesis phase (~1 call per assessment). Estimated $2-5 per enhanced DD assessment.

### OpenAI GPT-4o-mini (Fast Model)
- **Rationale:** Cost-effective for high-volume operations. Used for query decomposition, evidence extraction, sanctions list screening, prohibited activity detection.
- **Performance:** Sub-second latency for preliminary screening enables fast turnaround. Estimated $0.10-0.50 per assessment.

## Web Research & Data Collection

### Firecrawl API
- **Rationale:** Proven web intelligence platform from Firesearch foundation. Single API for search, scrape, and extract across 60+ HRDD sources. Handles complex sites (JavaScript rendering, authentication, rate limiting) that manual scraping cannot reliably process.
- **Key Capabilities:**
  - **Search Mode:** Find relevant documents across authoritative sources (UN, OFAC, Freedom House, etc.)
  - **Scrape Mode:** Extract full content from specific reports, sanctions lists, human rights indices
  - **Extract Mode:** Structured data extraction from semi-structured sources (tables, lists, PDF reports)
- **Reliability:** 15-second timeout with graceful fallback. Retry logic for transient failures. Deduplication of sources across parallel searches.
- **Cost:** Consumption-based pricing. Estimated 100-200 API calls per enhanced DD assessment. Monitor quota usage.

## Data Storage & Persistence

### Database: PostgreSQL (via Supabase)
- **Rationale:** Structured storage for customer dossiers, assessment metadata, audit trails, and historical precedents. Supabase provides managed PostgreSQL with row-level security for ERC/Board/Sales access control.
- **Schema Design:**
  - **Dossiers:** Customer information, use case, deployment context, submission metadata
  - **Assessments:** Risk classification, findings, evidence, ERC decisions, timestamps
  - **Audit Logs:** Immutable event log for all workflow actions, research executed, policy changes
  - **Sources:** Versioned configuration of research sources from sites.md
  - **Templates:** Versioned report templates and risk frameworks
- **Security:** Row-level security policies enforce ERC-only access to sensitive dossiers. Board members restricted to approved assessments. Sales team limited to their own submissions.
- **Backup & Retention:** Daily backups with 90-day retention. Configurable data deletion for GDPR compliance.

### File Storage: Supabase Storage (or S3-compatible)
- **Rationale:** Blob storage for generated reports (PDF exports), extracted evidence documents, source snapshots for audit trail.
- **Organization:** Bucketed by assessment ID. Versioned for report revisions. Immutable for audit trail integrity.
- **Alternative:** Local filesystem for air-gapped deployment if customer data cannot leave internal infrastructure.

### ORM: Prisma
- **Rationale:** Type-safe database access consistent with TypeScript stack. Schema migrations tracked in version control. Client generation ensures compile-time validation of queries.
- **Audit Trail:** Prisma middleware for automatic audit logging of all database writes (who, what, when).

## Configuration Management

### Version-Controlled Policy Files
- **Research Sources (sites.md):** Markdown file listing 60+ authoritative sources by risk domain. Parsed at runtime to generate research queries. Git history provides audit trail of source additions/removals.
- **Risk Frameworks (hrdd-guide.md, esg-policy.md):** Markdown documentation of risk assessment criteria, prohibited activities, scoring thresholds. Referenced by LLM prompts for consistent application.
- **Report Templates:** Markdown templates with placeholders for findings, evidence, risk classification. Versioned for template evolution.
- **Rationale:** Human-readable policy files enable legal review and Board approval of methodology changes. Git commits provide tamper-proof audit trail. No code deployment required for policy updates.

### Environment Variables (.env.local)
- **Secrets:** Firecrawl API key, OpenAI API key, database credentials, JWT signing key
- **Configuration:** Feature flags (enable continuous monitoring, enable ML risk scoring), timeout values, LLM model selection
- **Security:** Never committed to version control. Deployed via Vercel environment variables or internal secrets manager.

## Testing & Quality

### Test Framework: Vitest
- **Rationale:** Fast, TypeScript-native testing. Consistent with existing Firesearch conventions.
- **Coverage:**
  - **Unit Tests:** Risk assessment logic, evidence extraction, citation formatting, configuration parsing
  - **Integration Tests:** LangGraph workflow execution with mocked Firecrawl/LLM responses
  - **Regression Tests:** Known customer scenarios (sanctioned entity, prohibited use case, clean customer) to prevent classification drift
- **Fixtures:** Test dossiers, sample Firecrawl responses, expected report outputs for automated validation.

### End-to-End Testing: Playwright
- **Rationale:** Browser automation for testing full ERC workflow (dossier submission → research → review → report export).
- **Critical Paths:** Preliminary screening workflow, enhanced DD workflow, Board report generation, audit trail export.
- **Trade-offs:** E2E tests consume Firecrawl quota. Use mock mode for CI/CD, live API for weekly regression.

### Linting & Formatting: ESLint + Prettier
- **Rationale:** Code consistency across team. Automated formatting reduces review friction.
- **Custom Rules:** Enforce explicit error handling (no silent failures in compliance workflows), require JSDoc comments for risk assessment functions, ban console.log in production code.

## Deployment & Infrastructure

### Hosting: Vercel (or Internal Infrastructure)
- **Rationale (Vercel):** Zero-config deployment for Next.js. Automatic HTTPS, edge caching, preview deployments for ERC review.
- **Trade-offs:** Customer data sent to Vercel infrastructure may violate data sovereignty requirements. Assess Vercel's data processing agreement and certifications (SOC 2, ISO 27001).
- **Alternative (Internal Hosting):** Self-hosted Next.js on Axelera infrastructure for air-gapped deployment. Requires manual setup for SSL, load balancing, monitoring. Recommended for production if customer data sensitivity requires on-premise hosting.

### CI/CD: GitHub Actions
- **Rationale:** Automated testing and deployment on code changes. Consistent with existing development workflow.
- **Pipeline:**
  1. **Lint & Format:** ESLint, Prettier checks on all PRs
  2. **Unit Tests:** Vitest suite (required for merge)
  3. **Integration Tests:** LangGraph workflow tests with mocked APIs
  4. **Security Scan:** Dependency vulnerability scanning (npm audit, Snyk)
  5. **Build:** Next.js production build validation
  6. **Deploy:** Automatic deployment to staging on main branch merge, manual approval for production
- **Secrets Management:** GitHub Secrets for API keys in CI environment. Rotate quarterly.

## Authentication & Authorization

### Supabase Auth
- **Rationale:** Integrated with Supabase database. Supports SSO/SAML for Axelera corporate identity provider.
- **User Roles:**
  - **ERC Member:** Full access to all assessments, research orchestration, policy configuration
  - **Board Member:** Read-only access to approved assessments and Board reports
  - **Sales Team:** Submit dossiers, view own submissions, see information gap requests
  - **Admin:** User management, policy configuration, audit log access
- **Session Management:** JWT tokens with 8-hour expiration. Refresh tokens for extended sessions. Automatic logout on inactivity.
- **Alternative:** Auth0 or internal identity provider if Supabase Auth does not meet compliance requirements.

## Monitoring & Observability

### Application Monitoring: Sentry
- **Rationale:** Error tracking for production issues. Performance monitoring for slow research queries. User feedback integration for ERC bug reports.
- **Privacy:** Scrub customer names and sensitive dossier data from error reports. Retain only assessment IDs and error context.
- **Alerting:** Notify on-call engineer for critical errors (Firecrawl outage, LLM failures, database unavailability).

### Infrastructure Monitoring: Vercel Observability (or Prometheus/Grafana)
- **Rationale (Vercel):** Built-in metrics for serverless functions, edge network, database connections.
- **Key Metrics:** Research orchestration latency, Firecrawl API success rate, LLM token usage, assessment completion rate.
- **Alternative (Self-Hosted):** Prometheus for metrics collection, Grafana for dashboards, Alertmanager for notifications. Required if deploying on internal infrastructure.

### Audit Logging: Database + File Export
- **Rationale:** Compliance requirement for immutable audit trail. All workflow actions logged to database with timestamps and user attribution. Periodic export to append-only file storage for regulatory review.
- **Retention:** 7-year retention for audit logs per compliance standards. Automated archival to cold storage after 1 year.

## Security Considerations

### Data Encryption
- **At Rest:** Supabase database encryption (AES-256) for customer dossiers and assessment reports. File storage encryption for PDF exports.
- **In Transit:** TLS 1.3 for all API communication (Firecrawl, OpenAI, database). Strict transport security headers.
- **Alternative:** Encrypt sensitive fields at application layer if database-level encryption is insufficient (e.g., customer names, use case descriptions).

### Access Controls
- **Principle of Least Privilege:** Sales team cannot access ERC deliberations. Board members cannot access preliminary assessments. ERC members cannot modify audit logs.
- **API Key Rotation:** Quarterly rotation of Firecrawl and OpenAI API keys. Automated reminder via CI/CD.
- **Network Security:** Restrict database access to application servers. No public internet access to PostgreSQL. VPN required for admin access.

### Compliance Certifications
- **Target:** SOC 2 Type II compliance for handling sensitive customer data. GDPR compliance for EU customer assessments.
- **Vendor Assessment:** Review Firecrawl, OpenAI, and Supabase certifications and data processing agreements. Ensure GDPR-compliant data transfer mechanisms (SCCs, etc.).

## Future Technology Considerations

### Alternative LLM Providers
- **Anthropic Claude:** Evaluate Claude 3.5 Sonnet for synthesis quality comparison. May offer better constitutional AI alignment for ethics-focused assessments.
- **Local Models:** Assess viability of on-premise LLM deployment (Llama 3, Mistral) for air-gapped installations. Trade-off: quality vs. data sovereignty.
- **Hybrid Approach:** Use local models for sensitive preliminary screening, cloud LLMs for non-sensitive synthesis.

### Advanced Analytics
- **ML Risk Prediction:** Train classification model on historical assessments to predict risk level from dossier features. Requires 100+ labeled examples for viable model.
- **Anomaly Detection:** Identify unusual patterns in research results (e.g., sanctioned customer with clean adverse media search) for ERC review prioritization.

### Integration Capabilities
- **CRM Integration:** Sync customer dossiers from Salesforce or internal CRM. Auto-populate assessment intake from opportunity records.
- **Document Management:** Export to SharePoint or internal document management system for Board portal integration.
- **Notification Systems:** Integrate with Slack or Microsoft Teams for assessment status updates and information gap alerts.

## Technology Decision Principles

1. **Auditability Over Performance:** Choose technologies that provide complete visibility into decision-making process, even if slower.
2. **Configurability Over Optimization:** Prioritize policy flexibility over hard-coded efficiency. ERC must control methodology.
3. **Proven Over Novel:** Inherit battle-tested Firesearch components where possible. Minimize new technology risk.
4. **Security by Default:** Encryption, access controls, and audit logging are non-negotiable. No shortcuts for MVP.
5. **Data Sovereignty Awareness:** Assume customer data is sensitive. Design for on-premise deployment option even if initially cloud-hosted.
