# Spec Requirements: HRDD Research Orchestration

## Initial Description

**Feature Name**: HRDD Research Orchestration

**Description**: Adapt Firesearch to accept dossier input (customer, use case, deployment country) and generate research queries aligned with HRDD Guide methodology. Target specific authoritative sources from sites.md for each of the three risk factors: Geographic Context (Freedom House, Press Freedom Index, UN reports), Customer Profile (sanctions databases, adverse media, corporate registries), and End-Use Application (autonomous weapons frameworks, dual-use controls). Existing Firecrawl integration handles parallel search and content extraction with citations.

**Context from Roadmap**:
- This is MVP Item #1 (Large effort, 2 weeks)
- Foundation: Firesearch already provides citation tracking, source metadata capture, parallel search orchestration, and answer validation
- The HRDD adaptation focuses on customizing prompts for compliance workflows and outputting structured assessment reports

## Source Material

**Primary Reference Document**: `/home/hughbrown/code/firecrawl/firesearch/docs/hrdd-guide.md`

This HRDD Guide defines the complete methodology that the system must implement:
- Preliminary Screening criteria (controversial weapons, sanctions, high-risk jurisdictions)
- Enhanced Due Diligence risk factors (Geographic Context, Customer Profile, End-Use Application)
- Risk classification system (Low/Medium/High)
- Required research sources for each risk factor
- Decision workflows and approval requirements

## Requirements Discussion

### First Round Questions

**Q1: What input fields should the HRDD dossier form include?**

**Answer:** Simple text inputs (no dropdowns/validation). Three required fields:
- Customer name (text input)
- Use case description (textarea - for detailed description)
- Deployment country (text input - free text, no dropdown)

**Q2: Should the search queries be distinct per risk factor?**

**Answer:** Yes, generate distinct queries per risk factor. End-use queries should be specific to what's described in the use case (e.g., "Vision optronics systems for military binoculars" not generic "autonomous weapons").

**Q3: Does planning need to be split by risk factor?**

**Answer:** Yes, need SEPARATE planning phases for each of the 3 risk factors (Geographic Context, Customer Profile, End-Use Application).

**Q4: How should the HRDD guide's assessment criteria be converted to LLM instructions?**

**Answer:** HRDD guide documents exist (see /home/hughbrown/code/firecrawl/firesearch/docs/hrdd-guide.md) but are not optimized for LLM execution. Need help converting these into clear LLM instructions for automated assessment.

**Q5: Is the proposed sites.md structure acceptable?**

**Answer:** Yes, the proposed sites.md structure is fine - organized by risk domain with descriptions (e.g., "Freedom House - Country Freedom Scores", "OFAC Sanctions Database", etc.).

**Q6: What types of searches are required?**

**Answer:** TWO types of searches are required:
- **Targeted searches**: Site-specific searches to required sites in sites.md (e.g., "find Freedom House score for France on freedomhouse.org")
- **Broader searches**: Firesearch searches beyond sites.md for additional context and information not available in curated sources

**Q7: How should paywalled or inaccessible sources be handled?**

**Answer:** Only free/public data for MVP. Flag paywall/blocked sources in the sites.md file itself (so the system knows upfront which sources may be restricted).

**Q8: Is there a preliminary screening stage before the 3 risk factors?**

**Answer:** YES - IMPORTANT ADDITION. There's a FIRST STAGE before the 3 risk factors:

**Stage 1: Preliminary Screening** (from hrdd-guide.md "Risk Assessment: two-step approach" → "Preliminary Screening (1-2 days)"):
- Quick check for prohibited activities (controversial weapons: nuclear, chemical, biological weapons, cluster munitions, anti-personnel mines, autonomous weapon systems)
- Automatic high-risk triggers:
  - Sanctioned entities check
  - Jurisdictions with systematic IHL/HR violations (credibly accused by UN bodies, international courts, or recognized human rights organizations)

**Stage 2: Enhanced DD** (if preliminary screening passes):
- Geographic Context risk assessment
- Customer Profile risk assessment
- End-Use Application risk assessment

Then synthesis into final report.

**Q9: Where are risk thresholds defined?**

**Answer:** Risk thresholds are defined in hrdd-guide.md (Annex 3). Examples include:
- Freedom House >70 = Green (Low Risk)
- Freedom House <40 = Red (High Risk)
- Press Freedom Index score >60 = Low Risk
- Press Freedom Index score <30 = High Risk
- And similar thresholds for other factors

**Q10: What output format is required for MVP?**

**Answer:** MVP just displays text in web interface. Copy/paste is fine. No PDF/Word export needed for MVP.

**Q11: Should this be a separate route or modify the existing Firesearch page?**

**Answer:** REPURPOSE the existing Firesearch page (app/page.tsx, app/chat.tsx) - modify for HRDD use case, don't create separate route.

**Q12: Should the conversational interface be retained?**

**Answer:** Replace the conversational interface with HRDD application. User will decide whether to modify the existing synthesis function or create a new one.

**Q13: Is follow-up question support needed?**

**Answer:** No follow-up question support needed - one-shot workflow. User submits dossier, system performs full assessment, outputs final report.

**Q14: What is the acceptable processing time?**

**Answer:** Up to 1 hour processing time acceptable - prioritize quality over speed.

**Q15: Should real-time progress be shown?**

**Answer:** Show real-time progress if not too complicated to implement, otherwise deprioritize for MVP. Focus on getting the assessment correct first.

**Q16: How should information gaps be handled?**

**Answer:** Flag information gaps clearly in report. Never hallucinate missing data. If a source is unavailable or doesn't contain the needed information, explicitly state that in the report.

**Q17: Should audit trails be saved?**

**Answer:** Audit trail should be saved (backend), but not shown in frontend for MVP. This includes: queries executed, sources accessed, timestamps, etc.

**Q18: Should Preliminary and Enhanced DD be conducted sequentially or together?**

**Answer:** IMPORTANT: Preliminary AND Enhanced DD should be conducted TOGETHER in the same research task (not sequential user-initiated stages). The system runs both stages automatically.

**Q19: Is authentication/authorization needed?**

**Answer:** No authentication/authorization for MVP.

**Q20: What features are explicitly out of scope for MVP?**

**Answer:** Out of scope for MVP:
- Continuous monitoring (annual basis monitoring mentioned in guide)
- Precedent search (finding similar past assessments)
- Multi-language support
- Collaborative review features (multiple reviewers, comments, etc.)
- ML risk scoring (use rule-based thresholds from guide)

**Q21: Should the system halt when preliminary screening fails, or continue with full assessment?**

**Answer:** (Implicit from Q18) Continue with full assessment even if preliminary screening detects prohibited activities or high-risk flags. The final report should clearly state the preliminary screening result but complete all Enhanced DD research for comprehensive documentation.

**Q22: What level of citation detail is required in the report?**

**Answer:** (Inferred from emphasis on audit trails and research integrity) Every factual claim must have citations to sources for auditability. The citation-aware markdown rendering from Firesearch should be maintained.

**Q23: What are the existing Firesearch components that should be reused?**

**Answer:** User request: "Please review the existing codebase for what we can re-use. Keep the UI simple and functional."

**Reusable Firesearch Components:**
- `app/page.tsx` - Main search interface (to be repurposed for HRDD dossier input)
- `app/chat.tsx` - Chat orchestration (to be adapted for HRDD workflow)
- `app/search-display.tsx` - Real-time progress visualization (37k lines - can show research progress)
- `app/markdown-renderer.tsx` - Citation-aware markdown rendering
- `app/citation-tooltip.tsx` - Interactive citation tooltips
- `lib/langgraph-search-engine.ts` - LangGraph orchestration (core search workflow to adapt)
- `lib/firecrawl.ts` - Firecrawl API client (handles search and scraping)
- `lib/config.ts` - Configuration constants (search limits, timeouts, etc.)
- `lib/context-processor.ts` - Context processing utilities
- `components/ui/*` - Radix UI components (dialog, popover, tooltip, etc.)

**Key Patterns to Maintain:**
- LangGraph state machine for workflow orchestration
- Event-based streaming for real-time progress updates
- Parallel search execution via Firecrawl
- Source deduplication by URL
- Citation tracking with markdown
- Retry logic with alternative search strategies

### Follow-up Questions

**Follow-up 1: Search Orchestration** - Should the system perform broad web searches PLUS targeted site-specific searches, or only search authoritative sites directly? And should searches be parallel or sequential?

**Answer**: Do both broad searches AND site-specific checks. Parallel vs sequential is implementation decision. Choose most efficient way to search within specific sites for required information.

**Follow-up 2: sites.md Storage** - Where should sites.md live and what format should it use?

**Answer**: Put in a `/config` folder. Format doesn't need to be markdown - choose the format most consistent and reliable for LLM use (e.g., JSON, YAML, TypeScript config).

**Follow-up 3: Preliminary Screening Rejection Handling** - If prohibited activities are detected, should the system halt or continue with full assessment?

**Answer**: Complete the FULL assessment even if prohibited activities are detected. Final report should specify "Customer REJECTED due to preliminary screening failure" but continue with all Enhanced DD research.

**Follow-up 4: Report Format** - What level of structure and citation detail is needed in the markdown report?

**Answer**: Markdown with very structured format and clear fields. EVERY claim must have citations to sources (for auditability). Think structured data rendered as formatted markdown.

**Follow-up 5: Prompt Templates** - How should prompts be managed to ensure consistency and modifiability?

**Answer**: Include SPECIFIC prompt templates within the spec. User wants assistance building easily modifiable prompts. Prompts should be the "source of truth" to ensure:
- Output consistency between reports
- Relatively deterministic results
- Easy to modify based on future team feedback

## Existing Code to Reference

### Firesearch Components to Reuse

**Core Search Engine**: `/home/hughbrown/code/firecrawl/firesearch/lib/langgraph-search-engine.ts`
- LangGraph state machine orchestration with multi-phase workflows
- Parallel search execution
- Source deduplication by URL
- Retry logic for failed searches with alternative strategies
- Event streaming for real-time progress updates
- Answer validation with confidence thresholds

**Firecrawl Integration**: `/home/hughbrown/code/firecrawl/firesearch/lib/firecrawl.ts`
- FirecrawlClient class with search() method
- Markdown content extraction from search results in single API call
- Metadata capture (favicon, description)
- Error handling for scraping failures (403 errors, timeouts)
- Configurable timeouts (15s default)

**Configuration**: `/home/hughbrown/code/firecrawl/firesearch/lib/config.ts`
- SEARCH_CONFIG parameters:
  - MAX_SEARCH_QUERIES: 24 - Maximum parallel searches
  - MAX_SOURCES_PER_SEARCH: 10 - Sources per query
  - MIN_ANSWER_CONFIDENCE: 0.3 - Validation threshold
  - MAX_SEARCH_ATTEMPTS: 3 - Retry attempts
  - EARLY_TERMINATION_CONFIDENCE: 0.8 - Skip additional searches if confidence high
- MODEL_CONFIG settings:
  - FAST_MODEL: "gpt-4o-mini" - Query decomposition, validation
  - QUALITY_MODEL: "gpt-4o" - Final synthesis
  - TEMPERATURE: 0 - Deterministic outputs
- Easily modifiable config object pattern

**Context Processing**: `/home/hughbrown/code/firecrawl/firesearch/lib/context-processor.ts`
- Conversation memory for follow-up questions (may adapt for dossier processing)
- String formatting and truncation utilities
- Context aggregation patterns

**UI Components**:
- `app/page.tsx` - Main search interface entry point (to repurpose for HRDD form)
- `app/chat.tsx` - Main chat interface with search orchestration (to adapt for HRDD workflow)
- `app/search-display.tsx` - Real-time search progress visualization (37k lines - complex streaming UI for showing phases)
- `app/markdown-renderer.tsx` - Citation-aware markdown rendering
- `app/citation-tooltip.tsx` - Interactive citation tooltips
- `app/search.tsx` - Search input component (to adapt for dossier form)
- `components/ui/*` - Radix UI primitives (dialog, popover, tooltip, etc.)

**Error Handling**: `/home/hughbrown/code/firecrawl/firesearch/lib/error-handler.ts`
- Consistent error categorization (search, scrape, LLM, unknown)
- User-friendly error messages
- Retry logic patterns for transient failures

### Similar Features Identified

The existing Firesearch application provides the foundation for HRDD adaptation:
- Multi-phase search workflows (Understanding → Planning → Searching → Analyzing → Synthesis)
- Parallel query execution with answer validation
- Citation tracking throughout the process
- Structured markdown output with source references
- Real-time progress streaming to UI
- LangGraph state management with reducers

The HRDD system will customize these patterns for compliance workflows:
- Replace conversational query decomposition with structured risk factor assessment
- Add preliminary screening phase before enhanced DD
- Target authoritative sources via config-driven site lists
- Generate structured compliance reports instead of conversational responses
- Use deterministic prompts for consistency
- Maintain audit trail for compliance documentation

## Visual Assets

### Files Provided
No visual assets provided.

### Visual Insights
N/A - No visual files found via bash check.

## Requirements Summary

### Functional Requirements

**Input Processing:**
- Simple form with three required fields:
  - Customer name (text input)
  - Use case description (textarea for detailed description)
  - Deployment country (text input, free text, no dropdown)
- No validation or dropdown menus needed for MVP
- One-shot submission workflow (no follow-up questions or conversation)
- Form should replace existing Firesearch conversational interface

**Two-Stage Research Workflow:**

**Stage 1: Preliminary Screening**
- Controversial weapons check:
  - Nuclear, chemical, biological weapons
  - Cluster munitions and anti-personnel mines
  - Autonomous weapon systems (EU definition: weapons without meaningful human control)
- Sanctioned entities check (UN, EU, US OFAC databases)
- High-risk jurisdiction check:
  - Countries credibly accused by UN bodies, international courts, or recognized HR organizations
  - Systematic violations of IHL, human rights law, or atrocity crimes
- If prohibited activities detected: Mark as REJECTED but continue with full Enhanced DD
- If high-risk triggers found: Flag for Board decision but continue with full Enhanced DD

**Stage 2: Enhanced Due Diligence (Three Risk Factors)**

*Risk Factor 1: Geographic Context*
- EU/NATO membership check
- Freedom House rating and trends (>70 = Low, <40 = High)
- Press Freedom Index score (>60 = Low, <30 = High)
- UN Human Rights Council reports
- ICC/ICJ case dockets
- State Department Human Rights Reports
- Sanctions status (comprehensive vs targeted)
- AI governance and surveillance laws in jurisdiction

*Risk Factor 2: Customer Profile*
- Ethics and human rights policies on customer website
- UN Guiding Principles on Business and Human Rights adoption
- Corporate governance structures from registries/annual reports
- Sanctions database checks (UN, EU, US OFAC)
- Adverse media for violations or concerns (past 3-5 years)
- Defense industry association memberships
- Compliance track record
- Ownership transparency
- ESG compliance programs and sustainability reporting

*Risk Factor 3: End-Use Application*
- Level of human control assessment (meaningful human control requirement)
- Proximity to harm analysis (administrative → combat-enabling → near-weaponization)
- Ease of repurposing for harmful use
- Technical documentation review (if provided by Sales Team)
- Defense/security media reporting
- Comparison to autonomous weapon definitions (EU framework)
- Three dimensions: human control, proximity to harm, repurposing ease

**Search Orchestration:**
- Generate distinct queries per risk factor (use-case-specific, not generic)
- Separate planning phases for each risk factor
- TWO types of searches executed together:
  - **Targeted searches**: Site-specific searches to authoritative sources in config
  - **Broader searches**: Firesearch web searches for additional context
- Parallel execution where possible (implementation decision for efficiency)
- Use existing Firecrawl parallel search capabilities
- Prioritize authoritative sources as defined in config
- Date-scoped queries for temporal relevance (e.g., violations in past 3-5 years)

**Risk Assessment:**
- Apply rule-based thresholds from hrdd-guide.md Annex 3 (no ML for MVP)
- Output risk classification per risk factor: Low (Green), Medium (Orange), High (Red)
- Final risk classification: Highest of the three risk factors
- Flag information gaps explicitly - never hallucinate missing data
- Present conflicting information transparently with citations
- Include confidence indicators for factual findings
- Rationale for each risk classification

**Report Generation:**
- Structured markdown output with clear sections:
  - Executive Summary with final risk classification
  - Dossier Input (echo back user inputs)
  - Preliminary Screening Results (prohibited activities, sanctions, jurisdiction)
  - Enhanced Due Diligence Findings (one section per risk factor)
  - Risk Classification with detailed rationale
  - Recommended Conditions (if applicable based on risk level)
  - Information Gaps and Recommended Additional Research
  - Full Citations (every claim linked to source URL)
- EVERY factual claim must have citations for auditability
- Conflicting information presented with multiple citations
- Missing data flagged with alternative research suggestions
- Recency indicators for time-sensitive findings (e.g., "violation reported in 2022")
- Warnings for unavailable critical sources
- If preliminary screening fails: "Customer REJECTED due to preliminary screening failure" prominently displayed
- Use existing citation-aware markdown rendering from Firesearch

**Progress Visibility:**
- Real-time status updates during assessment phases (if feasible, otherwise deprioritize)
- Show which stage/risk factor is currently being researched
- Display sources being checked
- Indicate completion progress
- Use existing search-display.tsx component patterns

**Audit Trail:**
- Backend storage (not shown in frontend for MVP):
  - All queries executed
  - All sources accessed
  - Timestamps for each phase
  - Search results and content retrieved
  - LLM prompts and responses
  - Risk classification decisions and rationale

**Processing:**
- Up to 1 hour processing time acceptable (prioritize quality over speed)
- Both Preliminary and Enhanced DD conducted together automatically (not sequential user stages)
- Single-pass process - no interactive validation before final report

### Reusability Opportunities

**Components that exist in Firesearch:**
- LangGraph state machine for multi-phase workflows (lib/langgraph-search-engine.ts)
- FirecrawlClient for parallel search and content extraction (lib/firecrawl.ts)
- Citation tracking and markdown rendering with tooltips (app/markdown-renderer.tsx, app/citation-tooltip.tsx)
- Event streaming for real-time UI updates (SearchEvent types)
- Error handling with retry logic (lib/error-handler.ts)
- Config-based model selection (lib/config.ts)
- UI components from Radix UI (components/ui/*)

**Backend patterns to leverage:**
- State annotation with reducers for managing sources (Annotation.Root pattern)
- Event callback pattern for progress streaming
- Parallel query execution with answer validation
- Source deduplication by URL
- Markdown content processing
- Retry logic with max attempts and alternative strategies
- Confidence scoring for findings

**UI components to adapt:**
- Search progress display (app/search-display.tsx) - adapt for HRDD phases
- Citation tooltips (app/citation-tooltip.tsx)
- Markdown renderer with citation support (app/markdown-renderer.tsx)
- Form inputs (app/page.tsx, app/search.tsx) - repurpose for HRDD dossier form
- Radix UI primitives for consistent styling

**New patterns needed:**
- Config-driven authoritative source targeting (config file for sites)
- Structured compliance report generation (distinct from conversational synthesis)
- Risk factor scoring logic with rule-based thresholds
- Preliminary screening validation (prohibited activities, sanctions, jurisdiction)
- Prompt template management system (deterministic, easily modifiable)
- Two-stage workflow orchestration (preliminary + enhanced DD)
- Audit trail persistence to backend

### Scope Boundaries

**In Scope:**
- Repurpose existing Firesearch page (app/page.tsx, app/chat.tsx) for HRDD
- Simple dossier input form (3 text fields, no validation/dropdowns)
- Two-stage automated research workflow (preliminary screening + enhanced DD)
- Three risk factor assessments (Geographic, Customer, End-Use)
- Site-specific searches targeting authoritative sources from config
- Broader web searches for additional context
- Structured markdown report with complete citations for every claim
- Risk classification (Low/Medium/High) with detailed rationale
- Information gap identification and research recommendations
- Backend audit trail storage (queries, sources, timestamps)
- Continue full assessment even if preliminary screening fails
- Real-time progress updates (if feasible)
- Copy/paste report from web interface
- Config file for authoritative sources in /config folder (JSON/YAML/TypeScript)
- Prompt templates in spec for deterministic, modifiable outputs
- Simple, functional UI (no fancy features)
- Rule-based risk thresholds from HRDD Guide Annex 3
- One-shot workflow (no follow-up questions)

**Out of Scope:**
- Authentication/authorization (no user roles for MVP)
- Separate route (/hrdd) - repurpose existing Firesearch page instead
- PDF/Word export (markdown copy/paste only)
- Multi-country deployment assessments in single report
- Follow-up questions or conversational interface
- Interactive validation/editing before final report
- Report storage and case management database
- Report versioning and edit history
- Continuous monitoring (annual basis checks mentioned in guide)
- Precedent search (finding similar past assessments)
- Multi-language support
- Collaborative review features (multiple reviewers, comments)
- ML-based risk scoring (use rule-based thresholds only)
- Input validation or dropdown menus
- Frontend display of audit trail
- Board approval workflows
- Email notifications or Slack alerts
- Integration with external compliance systems or Sales CRM
- Paid/paywalled data sources (free/public data only)
- Report comparison or trend analysis across cases
- Batch processing of multiple dossiers

**Future Enhancements Mentioned:**
- Persistent storage for completed assessments
- User roles and permissions (Sales Team vs ERC)
- PDF export and additional formats
- Multi-country deployment support
- Interactive report editing
- Annual monitoring automation
- Case management dashboard
- Integration with Sales CRM systems
- Precedent search functionality
- Collaborative review and commenting
- ML-enhanced risk scoring
- Paid data source integrations

### Technical Considerations

**Integration Points:**
- Repurpose app/page.tsx and app/chat.tsx for HRDD workflow (don't create new route)
- Adapt lib/langgraph-search-engine.ts for two-stage HRDD process
- Add authoritative sources config in /config folder (format: JSON, YAML, or TypeScript - choose most LLM-friendly)
- Convert hrdd-guide.md criteria to LLM prompt templates (spec must include specific prompts)
- Maintain existing Firecrawl API integration
- Keep OpenAI API for LLM operations
- Use existing Next.js App Router structure
- Preserve Radix UI + Tailwind CSS styling approach

**Technology Stack:**
- Frontend: Next.js 15 (App Router), React 19, Tailwind CSS 4
- Backend: LangGraph, LangChain, OpenAI GPT models
- Web Scraping: Firecrawl API
- State Management: LangGraph state machines with Annotation.Root
- Type Safety: TypeScript 5
- UI Components: Radix UI primitives
- Styling: Tailwind CSS with existing global styles

**Model Selection:**
- For HRDD: Use GPT-4o for all phases (prioritize accuracy for compliance over speed/cost)
  - Preliminary screening analysis
  - Risk factor query generation
  - Search result analysis
  - Risk classification decisions
  - Final report synthesis
- Fallback: GPT-4o-mini if cost becomes prohibitive (but GPT-4o preferred)
- Temperature: 0 for deterministic outputs (consistency critical for compliance)
- Justification: Higher stakes than general research require maximum reliability

**Configuration Strategy:**
- Authoritative sources: `/config/hrdd-sources.json` (or .yaml or .ts - choose most reliable for LLM)
- Structure by risk factor with domains, descriptions, search strategies
- Flag paywalled/restricted sources in config (system knows upfront which may be inaccessible)
- Prompt templates: Include in spec as specific, complete templates (source of truth)
- Easily modifiable without code changes
- Version controlled for audit trail

**Performance Targets:**
- Up to 1 hour processing time acceptable (prioritize quality over speed)
- Leverage existing MAX_SEARCH_QUERIES (24) and MAX_SOURCES_PER_SEARCH (10)
- Prioritize authoritative sources over quantity
- Parallel execution where efficient (implementation decision)
- Both preliminary and enhanced DD together in one automated task

**Error Handling:**
- Continue with partial data if non-critical sources unavailable
- Prominently flag missing critical sources in report with warning banner
- Use Firesearch's retry logic for transient failures (MAX_SEARCH_ATTEMPTS: 3)
- Never hallucinate missing data - explicitly state information gaps
- Include "WARNING: Unable to access [source name] - manual verification required" when critical sources fail

**Code Patterns to Follow:**
- LangGraph Annotation.Root with reducers for state management
- Event streaming via eventCallback for UI updates
- Config objects in /lib/config.ts pattern (maintain existing structure)
- Component composition with Radix UI primitives
- TypeScript strict mode with full type safety
- Parallel search execution patterns from existing Firesearch
- Source deduplication by URL in reducers
- Citation tracking throughout workflow
- Retry logic with alternative search strategies

**Similar Code to Reference:**
- `/lib/langgraph-search-engine.ts` - Multi-phase workflow orchestration with LangGraph
- `/lib/firecrawl.ts` - API integration patterns, error handling
- `/lib/config.ts` - Configuration management approach
- `/app/chat.tsx` - Event-driven UI updates and state management
- `/app/search-display.tsx` - Progress visualization patterns (adapt for HRDD phases)
- `/lib/error-handler.ts` - Error categorization and recovery
- `/app/markdown-renderer.tsx` - Citation-aware markdown rendering
- `/app/citation-tooltip.tsx` - Interactive citation tooltips
- `/lib/context-processor.ts` - String formatting and processing utilities

### Prompt Engineering Requirements

**CRITICAL: Prompts as Source of Truth**

The spec must include SPECIFIC, COMPLETE prompt templates for:

**1. Preliminary Screening Prompts:**

*Controversial Weapons Detection Prompt:*
- Input: Use case description
- Task: Identify if use case involves prohibited weapons
- Output: Boolean + explanation for each category:
  - Nuclear, chemical, biological weapons
  - Cluster munitions and anti-personnel mines
  - Autonomous weapon systems (EU definition: weapons without meaningful human control)
- Format: Structured JSON with findings and confidence

*High-Risk Jurisdiction Check Prompt:*
- Input: Deployment country name
- Task: Determine if country has automatic high-risk triggers
- Output: Risk level + rationale with specific UN/court/HR org citations
- Criteria: Systematic violations of IHL, human rights law, or atrocity crimes

*Sanctions Database Interpretation Prompt:*
- Input: Customer name and country
- Task: Interpret sanctions database results
- Output: Sanctioned status (yes/no/inconclusive) + specific sanctions programs if applicable

**2. Risk Factor Assessment Prompts (one per factor):**

*Geographic Context Risk Classification Prompt:*
- Input: Deployment country + research findings
- Task: Classify geographic risk based on hrdd-guide.md Annex 3 criteria
- Output: Risk level (Low/Medium/High) + rationale with citations for:
  - EU/NATO membership
  - Freedom House score (>70 = Low, <40 = High)
  - Press Freedom Index (>60 = Low, <30 = High)
  - UN/ICC/ICJ reports
  - Sanctions status
  - AI governance laws
- Format: Structured with clear risk level and supporting evidence

*Customer Profile Risk Classification Prompt:*
- Input: Customer name + research findings
- Task: Classify customer risk based on hrdd-guide.md Annex 3 criteria
- Output: Risk level (Low/Medium/High) + rationale with citations for:
  - UN Guiding Principles adoption
  - Corporate governance quality
  - Ethics policies and transparency
  - Violations in past 3-5 years (with dates)
  - Sanctions status
  - Adverse media findings
- Format: Structured with clear risk level and supporting evidence

*End-Use Application Risk Classification Prompt:*
- Input: Use case description + research findings
- Task: Classify end-use risk based on hrdd-guide.md Annex 3 criteria
- Output: Risk level (Low/Medium/High) + rationale with analysis of:
  - Level of human control (meaningful human control requirement)
  - Proximity to harm (administrative → combat-enabling → near-weaponization)
  - Ease of repurposing for harmful use
- Format: Structured with clear risk level and supporting evidence

**3. Search Query Generation Prompts:**

*Geographic Context Query Generation:*
- Input: Deployment country name
- Output: List of targeted search queries for:
  - Freedom House scores and trends
  - Press Freedom Index rankings
  - UN Human Rights Council reports
  - ICC/ICJ case dockets
  - State Department reports
  - Sanctions databases
  - AI governance laws
- Format: Array of specific, actionable queries (not generic)

*Customer Profile Query Generation:*
- Input: Customer name
- Output: List of targeted search queries for:
  - Corporate website (ethics policies, UNGP adoption)
  - Corporate registries and annual reports
  - Sanctions databases (UN, EU, OFAC)
  - Adverse media (with date scoping for past 3-5 years)
  - Defense industry associations
  - Compliance violations
- Format: Array of specific, actionable queries

*End-Use Application Query Generation:*
- Input: Use case description (specific technical details)
- Output: List of targeted search queries for:
  - Technical documentation and specifications
  - Autonomous weapons frameworks (EU definition)
  - Dual-use controls and export regulations
  - Defense/security media reporting
  - Similar systems and their applications
- Format: Array of specific, use-case-specific queries (NOT generic "autonomous weapons")

**4. Report Synthesis Prompt:**

*Final Report Generation:*
- Input: All research findings, preliminary screening results, risk factor classifications
- Output: Structured markdown report with sections:
  - Executive Summary (final risk classification, key findings)
  - Dossier Input (customer, use case, country)
  - Preliminary Screening Results (prohibited activities, sanctions, jurisdiction)
  - Enhanced DD Findings (one section per risk factor with citations)
  - Risk Classification Rationale (why each factor received its rating)
  - Recommended Conditions (if Medium/High risk)
  - Information Gaps and Recommended Additional Research
  - Full Citations (appendix with all source URLs)
- Requirements:
  - Every factual claim must have citation in format [source_id]
  - Conflicting information presented transparently
  - Missing data flagged explicitly, never hallucinated
  - Recency indicators for time-sensitive findings
  - Warning banner if critical sources unavailable
  - If preliminary screening failed: "Customer REJECTED due to preliminary screening failure" prominently at top
- Format: Valid markdown with consistent section structure

**Prompt Design Principles:**
- Deterministic outputs (temperature 0, consistent structure)
- Explicit risk level criteria from HRDD Guide Annex 3 embedded in prompts
- Required citation format specification ([source_id] inline)
- Structured output format (JSON for intermediate, markdown for final)
- Edge case handling instructions (missing data, conflicts, paywalls)
- Easy to modify based on team feedback (clear sections, comments)
- Use-case-specific (not generic) - e.g., "vision optronics for military binoculars" not "autonomous weapons"

**Storage and Management:**
- Store in spec document as complete, copy-pasteable templates
- Group by phase (screening, assessment by factor, query generation, synthesis)
- Include version comments for change tracking
- Document expected inputs and outputs for each prompt
- Provide examples of desired outputs in comments
- Mark which prompts are deterministic (temperature 0) vs creative
- Indicate which model to use (GPT-4o for all HRDD prompts)

**Testing and Validation:**
- Prompts should produce consistent outputs for same inputs
- Risk classifications should match HRDD Guide examples where provided
- Citations should be properly formatted and traceable
- Information gaps should be flagged, not filled with assumptions
- Structure should match spec requirements exactly

### Data Flow

**End-to-End Workflow:**

1. **User Input** (app/page.tsx repurposed):
   - User fills dossier form with 3 fields: customer name, use case description, deployment country
   - Submit triggers HRDD assessment workflow

2. **System Initialization** (adapted lib/langgraph-search-engine.ts):
   - Initialize LangGraph state with dossier data
   - Load authoritative sources config from /config folder
   - Start event streaming to frontend for progress updates

3. **Preliminary Screening Phase**:
   - **Controversial Weapons Check**:
     - Use prompt to analyze use case description
     - Search for weapons-related indicators
     - Output: PROHIBITED / NOT_PROHIBITED + rationale
   - **Sanctions Check**:
     - Generate queries for customer + country against sanctions databases
     - Execute targeted searches (OFAC, UN, EU sanctions lists)
     - Output: SANCTIONED / NOT_SANCTIONED + programs if applicable
   - **High-Risk Jurisdiction Check**:
     - Generate queries for country + UN/ICC/ICJ reports
     - Search for systematic IHL/HR violations
     - Output: AUTO_HIGH_RISK / NOT_AUTO_HIGH_RISK + evidence
   - **Preliminary Result**:
     - If PROHIBITED or SANCTIONED: Mark as REJECTED but continue to Enhanced DD
     - If AUTO_HIGH_RISK: Flag for Board but continue to Enhanced DD
     - Emit preliminary screening event to frontend

4. **Enhanced Due Diligence Phase (Three Parallel/Sequential Risk Factors)**:

   **Risk Factor 1: Geographic Context**
   - Generate queries using geographic query generation prompt
   - Execute targeted searches:
     - Site-specific: Freedom House, Reporters Without Borders, UN sites
     - Broader web: Additional context about country's legal framework
   - Analyze findings using geographic risk classification prompt
   - Apply thresholds: Freedom House >70 = Low, <40 = High; Press Freedom >60 = Low, <30 = High
   - Output: Risk level (Low/Medium/High) + rationale + citations
   - Emit progress events to frontend

   **Risk Factor 2: Customer Profile**
   - Generate queries using customer query generation prompt
   - Execute targeted searches:
     - Site-specific: OFAC, UN sanctions, corporate registries
     - Customer website: Ethics policies, UNGP adoption
     - Broader web: Adverse media with date scoping (past 3-5 years)
   - Analyze findings using customer risk classification prompt
   - Check: Ethics policies, governance transparency, violations, sanctions
   - Output: Risk level (Low/Medium/High) + rationale + citations
   - Emit progress events to frontend

   **Risk Factor 3: End-Use Application**
   - Generate use-case-specific queries using end-use query generation prompt
   - Execute targeted searches:
     - Site-specific: Autonomous weapons frameworks, dual-use controls
     - Broader web: Technical documentation, defense media
   - Analyze findings using end-use risk classification prompt
   - Assess: Human control level, proximity to harm, repurposing ease
   - Output: Risk level (Low/Medium/High) + rationale + citations
   - Emit progress events to frontend

5. **Report Synthesis Phase**:
   - Aggregate all findings: preliminary screening + three risk factors
   - Determine final risk classification: Highest of three risk factors
   - Generate structured markdown report using synthesis prompt:
     - Executive Summary with final classification
     - Preliminary Screening Results
     - Enhanced DD Findings per risk factor
     - Risk Classification Rationale
     - Recommended Conditions
     - Information Gaps and Additional Research Recommendations
     - Full Citations
   - Ensure every claim has citation in [source_id] format
   - Flag missing data explicitly
   - Add warning banner if critical sources unavailable
   - If preliminary screening failed: Add "Customer REJECTED" notice at top
   - Emit final report to frontend

6. **Audit Trail Persistence** (backend only, not shown in frontend):
   - Save to database/file:
     - Dossier inputs (customer, use case, country)
     - All queries generated and executed
     - All sources accessed with timestamps
     - LLM prompts and responses
     - Preliminary screening results
     - Risk factor classifications
     - Final report
     - Processing duration

7. **Frontend Display** (app/search-display.tsx adapted):
   - Show real-time progress during phases (if feasible)
   - Display final structured markdown report with citation tooltips
   - Enable copy/paste of complete report
   - No export to PDF/Word for MVP

**State Management:**
- Use LangGraph Annotation.Root with reducers
- State fields:
  - dossier: {customer, useCase, country}
  - preliminaryScreening: {weapons, sanctions, jurisdiction}
  - geographicRisk: {level, rationale, citations}
  - customerRisk: {level, rationale, citations}
  - endUseRisk: {level, rationale, citations}
  - sources: [] (deduplicated by URL)
  - queries: [] (all executed queries)
  - finalReport: string (markdown)
  - auditTrail: [] (all events and decisions)

**Event Streaming:**
- Emit typed events for frontend:
  - phase-update: "Preliminary Screening", "Geographic Context Assessment", etc.
  - searching: Individual query execution
  - found: Sources discovered
  - source-processing / source-complete: Scraping progress
  - content-chunk: Streaming final report (if streaming synthesis)
  - final-result: Complete report with sources

**Error Handling Throughout:**
- Transient failures: Retry up to MAX_SEARCH_ATTEMPTS (3)
- Critical source unavailable: Continue with warning, flag in report
- Parse failures: Log to audit trail, present raw data with note
- LLM errors: Retry with exponential backoff, fallback to GPT-4o-mini if needed
- Never halt entirely - always produce a report (even if partial/flagged)

### Configuration Schema (Conceptual)

**Authoritative Sources Config (`/config/hrdd-sources.json` or `.yaml` or `.ts`):**

```json
{
  "geographic_context": [
    {
      "name": "Freedom House",
      "domain": "freedomhouse.org",
      "description": "Country freedom scores and trends",
      "search_strategy": "site-specific",
      "priority": "high",
      "paywall": false
    },
    {
      "name": "Reporters Without Borders",
      "domain": "rsf.org",
      "description": "Press Freedom Index rankings",
      "search_strategy": "site-specific",
      "priority": "high",
      "paywall": false
    },
    {
      "name": "UN Human Rights Council",
      "domain": "ohchr.org",
      "description": "Human rights reports and investigations",
      "search_strategy": "site-specific",
      "priority": "high",
      "paywall": false
    },
    {
      "name": "International Criminal Court",
      "domain": "icc-cpi.int",
      "description": "ICC case dockets and investigations",
      "search_strategy": "site-specific",
      "priority": "high",
      "paywall": false
    },
    {
      "name": "US State Department",
      "domain": "state.gov",
      "description": "Human Rights Reports",
      "search_strategy": "site-specific",
      "priority": "medium",
      "paywall": false
    }
  ],
  "customer_profile": [
    {
      "name": "OFAC Sanctions",
      "domain": "treasury.gov/ofac",
      "description": "US Office of Foreign Assets Control sanctions list",
      "search_strategy": "site-specific",
      "priority": "critical",
      "paywall": false
    },
    {
      "name": "UN Sanctions",
      "domain": "un.org/securitycouncil/sanctions",
      "description": "UN Security Council sanctions",
      "search_strategy": "site-specific",
      "priority": "critical",
      "paywall": false
    },
    {
      "name": "EU Sanctions",
      "domain": "sanctionsmap.eu",
      "description": "EU sanctions database",
      "search_strategy": "site-specific",
      "priority": "critical",
      "paywall": false
    },
    {
      "name": "OpenCorporates",
      "domain": "opencorporates.com",
      "description": "Global corporate registry",
      "search_strategy": "site-specific",
      "priority": "medium",
      "paywall": false
    },
    {
      "name": "Human Rights Watch",
      "domain": "hrw.org",
      "description": "Adverse media and investigations",
      "search_strategy": "site-specific",
      "priority": "high",
      "paywall": false
    },
    {
      "name": "Amnesty International",
      "domain": "amnesty.org",
      "description": "Human rights concerns and reports",
      "search_strategy": "site-specific",
      "priority": "high",
      "paywall": false
    }
  ],
  "end_use_application": [
    {
      "name": "EU Autonomous Weapons Framework",
      "domain": "europa.eu",
      "description": "EU regulations on autonomous weapons",
      "search_strategy": "site-specific",
      "priority": "high",
      "paywall": false
    },
    {
      "name": "Campaign to Stop Killer Robots",
      "domain": "stopkillerrobots.org",
      "description": "Autonomous weapons definitions and advocacy",
      "search_strategy": "site-specific",
      "priority": "medium",
      "paywall": false
    },
    {
      "name": "Wassenaar Arrangement",
      "domain": "wassenaar.org",
      "description": "Dual-use and arms export controls",
      "search_strategy": "site-specific",
      "priority": "medium",
      "paywall": false
    },
    {
      "name": "Defense Media",
      "domain": "janes.com",
      "description": "Defense systems and capabilities",
      "search_strategy": "broader-web",
      "priority": "low",
      "paywall": true,
      "note": "Paywall - use broader web searches for publicly available defense media"
    }
  ]
}
```

**Usage Notes:**
- `priority`: "critical" = must succeed or flag prominently; "high" = important; "medium" = supplementary; "low" = nice-to-have
- `paywall`: true = flag as potentially restricted, don't fail if unavailable
- `search_strategy`: "site-specific" = use site: operator; "broader-web" = general search
- Config should be easily editable by ERC without code changes
- Version control this file for audit trail

### Success Criteria

**MVP Complete When:**
- User can input dossier via simple form (3 fields, no validation)
- System performs two-stage assessment automatically (preliminary + enhanced DD)
- Preliminary screening correctly identifies prohibited activities, sanctions, high-risk jurisdictions
- Three risk factors assessed with distinct queries per factor
- Site-specific searches target authoritative sources from config
- Broader web searches supplement findings
- Complete structured markdown report generated in <1 hour
- Report includes all required sections per HRDD Guide
- Every factual claim has source citation with tooltip
- Risk classification matches HRDD Guide definitions (Low/Medium/High with thresholds)
- Information gaps flagged explicitly, never hallucinated
- System continues full assessment even if preliminary screening fails (marks as REJECTED but completes)
- Missing critical sources prominently warned in report
- Audit trail saved to backend (queries, sources, timestamps)
- Report can be copied from web interface
- Prompts are modifiable via config/spec without code changes
- Real-time progress shown (if feasible) or omitted (if too complex)

**Quality Indicators:**
- **Consistency**: Same dossier inputs produce similar reports with same risk classifications
- **Completeness**: All sections present (preliminary screening + 3 risk factors + synthesis)
- **Auditability**: Clear citation trail for every claim with source URLs
- **Accuracy**: Risk classifications align with HRDD Guide Annex 3 thresholds
- **Reliability**: Graceful degradation when sources unavailable (warnings, not failures)
- **Usability**: ERC member can complete assessment without technical support
- **Transparency**: Conflicting information presented with multiple citations
- **Honesty**: Missing data explicitly flagged, never filled with assumptions
- **Efficiency**: Parallel searches where possible, completion within 1 hour target

**Acceptance Tests:**
- Test case 1: Low-risk customer (EU-based, public ethics policies, training application) → Report classifies as Low risk
- Test case 2: High-risk jurisdiction (Freedom House <40) → Report classifies Geographic Context as High risk
- Test case 3: Prohibited weapons in use case → Preliminary screening marks REJECTED, continues full assessment
- Test case 4: Sanctioned customer → Preliminary screening flags sanctions, marks REJECTED, continues full assessment
- Test case 5: Missing critical source (OFAC down) → Report includes warning banner, flags gap in Customer Profile
- Test case 6: Conflicting information (different Freedom House scores) → Report presents both with citations
- Test case 7: Use-case-specific queries → Queries mention specific technical terms from use case, not generic "autonomous weapons"
