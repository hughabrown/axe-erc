# Product Roadmap

## MVP Development Phase

**Foundation**: Firesearch already provides citation tracking, source metadata capture, parallel search orchestration, and answer validation. The HRDD adaptation focuses on customizing prompts for compliance workflows and outputting structured assessment reports.

1. [x] **HRDD Research Orchestration** — Adapt Firesearch to accept dossier input (customer, use case, deployment country) and generate research queries aligned with HRDD Guide methodology. Target specific authoritative sources from sites.md for each of the three risk factors: Geographic Context (Freedom House, Press Freedom Index, UN reports), Customer Profile (sanctions databases, adverse media, corporate registries), and End-Use Application (autonomous weapons frameworks, dual-use controls). Existing Firecrawl integration handles parallel search and content extraction with citations. `L` (2 weeks) - **COMPLETED 2025-10-22**

2. [x] **Structured HRDD Report with RAG Assessment** — Generate structured assessment reports (not conversational answers) with: Executive summary, Red/Amber/Green classification for each risk factor with evidence and citations, overall Low/Medium/High risk rating, detailed findings by domain, information gaps, and recommendations. Risk classification logic applies HRDD Guide criteria (e.g., Freedom House score >70 = Green for geographic context). Firecrawl content and LLM summaries provide evidence; existing citation system provides traceability. `L` (2 weeks) - **COMPLETED 2025-10-22**

3. [x] **Configurable Research Sources** — Load sites.md configuration as a starting point for required authoritative sources (e.g., Freedom House, OFAC sanctions, UN reports) while maintaining ability to explore beyond this list for additional relevant information. Sites.md ensures critical sources are always checked but does not limit research scope. Allow ERC to add/remove required sources by editing sites.md without code changes. Version control configuration in Git for audit trail. `S` (3 days) - **COMPLETED 2025-10-22**

4. [x] **Configurable Report Templates** — Extract report structure into editable template files that ERC can modify without code changes. Support variables for dossier data (customer name, deployment country, use case) and flexible section ordering. Enable multiple templates for different assessment types. `S` (3 days) - **COMPLETED 2025-10-22**

5. [x] **Information Gap Detection** — Identify missing or insufficient information in research results (e.g., customer not found in sanctions databases, no information on deployment country's surveillance laws). Generate specific follow-up questions for Sales team to fill gaps. `S` (2 days) - **COMPLETED 2025-10-22**

6. [x] **Audit Trail & Logging** — Capture all research queries executed, sources consulted, evidence extracted, and risk classifications assigned with timestamps. Export structured audit logs for regulatory review and internal governance. `M` (1 week) - **COMPLETED 2025-10-22**

## Future Enhancements (Post-MVP)

8. [ ] **Dossier Intake System** — Create structured intake form for Sales team to submit customer assessments with validation logic. Store dossier data in structured format for downstream research orchestration and tracking. `M`

9. [ ] **Assessment Status Dashboard** — Build workflow management interface for Chief of Staff to track all active assessments. Display current phase (intake, research in progress, analysis, ERC review, Board review), elapsed time, assigned ERC members, and blockers (e.g., waiting on Sales information). Enable filtering by risk level, customer, or deadline. `M`

10. [ ] **Board Reporting Package** — Create one-click Board report generator that produces executive summary with key findings, risk classification, evidence highlights, and ERC recommendation. Format for Board portal upload (PDF with table of contents, executive summary on first page, appendices for detailed evidence). Include comparison to recent similar assessments. `S`

11. [ ] **Preliminary vs. Enhanced DD Modes** — Implement two-tier workflow: Preliminary screening mode (1-2 day target) focuses on sanctions lists, conflict zones, and prohibited activities with automated risk classification. Enhanced DD mode (2 week target) adds comprehensive geographic research, customer business activities, supply chain analysis, and precedent review. Allow ERC to promote preliminary to enhanced based on initial findings. `M`

12. [ ] **Precedent Search & Comparison** — Build search interface over historical assessments to find similar customers, use cases, or deployment contexts. Display how past opportunities were classified and key decision factors. Highlight consistency/inconsistency with current assessment. Support "clone assessment" for customers in same industry/region. `M`

13. [ ] **Continuous Monitoring** — Implement periodic re-assessment of approved customers (quarterly or event-triggered). Monitor for material changes: customer added to sanctions lists, deployment country human rights deterioration, use case modifications, adverse media. Generate alerts when risk level changes and trigger re-review workflow. `L`

14. [ ] **Custom Research Queries** — Allow ERC members to supplement automated research with ad-hoc questions during review (e.g., "Has this customer developed autonomous weapons systems?"). Execute additional Firecrawl searches and integrate results into assessment report. Maintain same citation standards. `S`

15. [ ] **Multi-Language Source Research** — Extend research orchestration to sources in languages relevant to deployment contexts (Arabic for Middle East assessments, Mandarin for China, Russian for CIS countries, etc.). Integrate translation APIs for evidence extraction. Display original text and translation in reports. `L`

16. [ ] **Collaborative Review Interface** — Enable multiple ERC members to review same assessment concurrently with inline comments, discussion threads, and voting on risk classification. Track consensus-building process. Capture dissenting opinions in audit trail. Support asynchronous review for distributed teams. `M`

17. [ ] **Policy Configuration Versioning** — Build admin interface for managing policy configuration changes (sources, risk frameworks, templates, prohibited activities). Track rationale for changes, effective dates, and impact on pending assessments. Support "reprocess with new policy" for assessments in progress. `S`

18. [ ] **Sales Team Self-Service** — Create limited-access interface for Sales to check preliminary screening status, view information gap requests, and submit additional context. Provide guidance on likely risk classification based on dossier completeness. Auto-flag obvious disqualifiers (sanctioned entities, prohibited activities). `M`

19. [ ] **Advanced Risk Scoring ML** — Train machine learning models on historical assessments to predict risk classification from dossier inputs. Highlight factors driving prediction. Use as decision support (not replacement) for ERC judgment. Monitor model performance and bias. `XL`

## Technical Debt & Quality

- **Security Hardening** — Implement authentication/authorization for ERC/Board/Sales roles. Encrypt customer data at rest and in transit. Conduct security audit before production deployment. Add penetration testing to CI/CD pipeline. `M`

- **Performance Optimization** — Profile and optimize research orchestration for sub-5-minute preliminary assessments. Implement caching for frequently-accessed sources (sanctions lists, country indices). Add progress indicators for long-running enhanced DD. `S`

- **Error Handling & Resilience** — Improve error handling for Firecrawl API failures, LLM timeouts, and malformed source content. Implement graceful degradation when sources are unavailable. Add manual override for ERC to proceed with partial results. `S`

- **Testing Infrastructure** — Build test harness with fixtures for known customer scenarios (sanctioned entity, prohibited use case, clean customer). Add regression tests for risk classification logic. Implement end-to-end testing for full assessment workflow. `M`

- **Data Privacy Compliance** — Implement GDPR-compliant data retention and deletion. Add data export for customer requests. Document data processing activities. Review compliance with EU/US data transfer regulations if using cloud services. `M`

## Notes

- Roadmap assumes existing Firesearch codebase as foundation (Next.js 15, LangGraph, Firecrawl integration)
- **Items 1-6 COMPLETED 2025-10-22** - HRDD Research Orchestration MVP fully implemented and verified
- Audit trail now includes full export capability (JSON/CSV) with API endpoint and UI download buttons
- Items 8-19 are post-MVP enhancements based on user feedback and evolving requirements
- Technical debt items should be addressed in parallel with feature development
- Effort estimates assume single full-stack developer; adjust for team size
- Security and compliance items (authentication, encryption, audit trails) are prerequisites for production deployment
- Policy configuration system (items 4-5) is critical path for tool adoption; ERC must be able to evolve methodology without engineering dependency
- MVP accepts free-text dossier input rather than structured intake form to accelerate development
- Risk assessment logic (red/amber/green per factor) is integrated directly into report generation (item 3)
