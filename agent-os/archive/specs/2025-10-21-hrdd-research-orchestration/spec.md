# Specification: HRDD Research Orchestration

## Goal

Transform Firesearch into a specialized Human Rights Due Diligence (HRDD) assessment tool that automates the research and analysis of dual-use AI product sales by evaluating three risk factors (Geographic Context, Customer Profile, End-Use Application) against authoritative sources and generates structured compliance reports with complete citation trails.

## User Stories

- As an Ethics Review Committee member, I want to input customer dossier information (name, use case, deployment country) so that the system can automatically research and assess HRDD risks
- As an ERC member, I want the system to check for prohibited activities and sanctions automatically so that high-risk cases are flagged immediately
- As an ERC member, I want risk assessments based on authoritative sources (Freedom House, UN reports, sanctions databases) so that classifications are defensible and auditable
- As an ERC member, I want every finding cited to its source URL so that I can verify claims and present evidence to the Board
- As an ERC member, I want information gaps clearly flagged so that I know what additional research is needed
- As a compliance officer, I want a structured markdown report I can copy and include in Board presentations

## Core Requirements

### Functional Requirements

**Input Interface:**
- Replace conversational search interface with 3-field dossier form
- Fields: Customer name (text), Use case description (textarea), Deployment country (text)
- No validation or dropdown menus - simple text inputs only
- Single submission triggers full automated assessment

**Two-Stage Assessment Workflow:**

*Stage 1: Preliminary Screening (Automatic Red Flags)*
- Controversial weapons check: Nuclear/chemical/biological weapons, cluster munitions, anti-personnel mines, autonomous weapon systems (EU definition)
- Sanctions check: Customer/country against UN, EU, US OFAC databases
- High-risk jurisdiction check: Countries accused by UN bodies/international courts of systematic IHL/HR violations
- System continues to full Enhanced DD even if preliminary screening fails (marks as REJECTED but completes assessment)

*Stage 2: Enhanced Due Diligence (Three Risk Factor Assessments)*
- **Geographic Context**: Freedom House scores (>70=Low, <40=High), Press Freedom Index (>60=Low, <30=High), UN/ICC reports, EU/NATO membership, AI governance laws
- **Customer Profile**: UN Guiding Principles adoption, corporate governance quality, sanctions status, adverse media (past 3-5 years), compliance violations
- **End-Use Application**: Level of human control, proximity to harm (administrative → combat-enabling → near-weaponization), ease of repurposing

**Search Orchestration:**
- Generate distinct, use-case-specific search queries per risk factor (not generic queries)
- Execute TWO types of searches together:
  - Site-specific searches targeting authoritative sources from config file
  - Broader web searches for additional context beyond curated sources
- Parallel execution where efficient (leverage existing Firecrawl capabilities)
- Separate planning phases for each of the 3 risk factors

**Risk Classification Logic:**
- Apply rule-based thresholds from HRDD Guide Annex 3 (embedded in LLM prompts)
- Each risk factor classified: Low (Green), Medium (Orange), High (Red)
- Overall risk = Highest of the three risk factors
- Never hallucinate missing data - flag information gaps explicitly

**Report Generation:**
- Structured markdown output with sections: Executive Summary, Dossier Input, Preliminary Screening Results, Enhanced DD Findings (3 sections), Risk Classification Rationale, Recommended Conditions, Information Gaps, Full Citations
- EVERY factual claim must have inline citation in [source_id] format
- Conflicting information presented transparently with multiple citations
- Warning banner if critical sources unavailable
- If preliminary screening failed: "Customer REJECTED due to preliminary screening failure" prominently displayed at top
- Recency indicators for time-sensitive findings (e.g., "violation reported in 2022")

**Progress Visibility:**
- Real-time status updates during assessment phases (if feasible, otherwise deprioritize)
- Show current stage/risk factor being researched
- Display sources being checked
- Use existing search-display.tsx component patterns

**Audit Trail:**
- Backend storage (not shown in frontend for MVP): All queries executed, all sources accessed, timestamps, LLM prompts/responses, risk classification decisions
- Enables future compliance reviews and process improvements

### Non-Functional Requirements

**Performance:**
- Up to 1 hour processing time acceptable (prioritize accuracy over speed)
- Use GPT-4o for all phases (query generation, analysis, synthesis) - accuracy critical for compliance
- Temperature 0 for deterministic outputs (consistency requirement)
- Leverage existing MAX_SEARCH_QUERIES (24) and MAX_SOURCES_PER_SEARCH (10)

**Reliability:**
- Continue with partial data if non-critical sources unavailable
- Prominently flag missing critical sources with warning banner
- Use existing retry logic (MAX_SEARCH_ATTEMPTS: 3) for transient failures
- Never halt entirely - always produce a report (even if partial/flagged)

**Auditability:**
- Citation format must be consistent and traceable to source URLs
- Prompts must be version-controlled for audit trail
- Config file for authoritative sources must be version-controlled
- Risk thresholds embedded in prompts (not hidden in code)

**Modifiability:**
- Prompt templates stored as complete, documented templates in code
- Authoritative sources config in /config folder (easily editable without code changes)
- Risk thresholds explicitly stated in prompts (can be modified by updating prompt text)

## Visual Design

No mockups provided. Maintain existing Firesearch styling with Tailwind CSS and Radix UI components.

**Key UI Changes:**
- Replace chat input with 3-field form on app/page.tsx
- Adapt search-display.tsx to show HRDD assessment phases (Preliminary Screening, Geographic Context, Customer Profile, End-Use Application, Synthesis)
- Final report displayed with citation-aware markdown rendering (reuse existing markdown-renderer.tsx and citation-tooltip.tsx)

## Reusable Components

### Existing Code to Leverage

**Core Search Infrastructure:**
- `/lib/langgraph-search-engine.ts` - LangGraph state machine with multi-phase workflows (understanding → planning → searching → analyzing → synthesizing)
- `/lib/firecrawl.ts` - FirecrawlClient with search() and scrapeUrl() methods, handles parallel searches and markdown extraction
- `/lib/config.ts` - Configuration pattern for SEARCH_CONFIG and MODEL_CONFIG
- `/lib/context-processor.ts` - String formatting utilities (may adapt for dossier processing)

**Frontend Components:**
- `/app/page.tsx` - Main entry point (repurpose for HRDD form)
- `/app/chat.tsx` - Event-driven UI orchestration (adapt for HRDD workflow)
- `/app/search-display.tsx` - Real-time progress visualization (adapt for HRDD phases)
- `/app/markdown-renderer.tsx` - Citation-aware markdown rendering
- `/app/citation-tooltip.tsx` - Interactive citation tooltips
- `/components/ui/*` - Radix UI primitives (dialog, input, button, etc.)

**Patterns to Maintain:**
- LangGraph Annotation.Root with reducers for state management
- Event streaming via eventCallback for UI updates
- Source deduplication by URL in reducers
- Citation tracking throughout workflow
- Retry logic with alternative search strategies

### New Components Required

**Configuration:**
- `/config/hrdd-sources.json` (or .yaml or .ts) - Authoritative sources organized by risk domain (Geographic Context, Customer Profile, End-Use Application) with ~60+ sources from HRDD Guide Annex 3
- Cannot reuse existing: Need domain-specific source lists with priority levels, paywall flags, and search strategies

**LangGraph Workflow:**
- New HRDD-specific state annotation extending existing SearchStateAnnotation
- Additional state fields: dossier (customer, useCase, country), preliminaryScreening, geographicRisk, customerRisk, endUseRisk
- New nodes for preliminary screening and per-risk-factor planning/analysis
- Cannot directly reuse: HRDD workflow is two-stage (screening + 3 parallel risk assessments) vs conversational search

**Prompt Templates:**
- Must be created as explicit, documented templates (see Prompt Templates section below)
- Cannot reuse: Firesearch uses conversational prompts, HRDD needs structured compliance prompts with embedded thresholds

**Report Synthesis:**
- New synthesis function generating structured compliance report (vs conversational response)
- Cannot reuse: Different output format requirements (structured sections, mandatory citations, gap flagging)

## Technical Approach

### Architecture Overview

**Repurpose Existing Firesearch (Not New Route):**
- Modify `/app/page.tsx` to show HRDD dossier form instead of conversational search
- Adapt `/app/chat.tsx` to handle HRDD workflow orchestration
- Replace `/lib/langgraph-search-engine.ts` core logic with HRDD-specific workflow

**LangGraph State Machine:**
```
START → Preliminary Screening → Enhanced DD Planning (3 parallel) →
  Geographic Context Assessment → Customer Profile Assessment → End-Use Assessment →
  Risk Classification → Report Synthesis → END
```

**State Structure:**
```typescript
// Extend existing SearchStateAnnotation
{
  // Input
  dossier: { customer: string; useCase: string; country: string }

  // Preliminary Screening Results
  preliminaryScreening: {
    weapons: { prohibited: boolean; rationale: string }
    sanctions: { sanctioned: boolean; programs: string[] }
    jurisdiction: { highRisk: boolean; rationale: string }
  }

  // Enhanced DD Results (per risk factor)
  geographicRisk: { level: 'Low'|'Medium'|'High'; rationale: string; citations: Source[] }
  customerRisk: { level: 'Low'|'Medium'|'High'; rationale: string; citations: Source[] }
  endUseRisk: { level: 'Low'|'Medium'|'High'; rationale: string; citations: Source[] }

  // Search results (reuse existing)
  sources: Source[] // deduplicated by URL
  queries: string[] // all executed queries

  // Final output
  finalReport: string // markdown
  overallRisk: 'Low'|'Medium'|'High'

  // Audit trail
  auditTrail: Array<{ timestamp: number; event: string; data: any }>
}
```

### Database

No database required for MVP. Audit trail stored in-memory during processing, logged to console/file for backend persistence.

**Future Enhancement:** Supabase table for completed assessments (dossier inputs, final report, audit trail JSON, timestamps).

### API

**No new API routes needed.** Reuse existing Server Actions pattern:
- `/app/search.ts` (Server Action) - Modify to accept dossier input instead of conversational query
- Backend logic in `/lib/langgraph-search-engine.ts` adapted for HRDD workflow

### Frontend

**Input Form (`/app/page.tsx`):**
- Replace chat interface with simple form
- 3 text inputs: Customer name, Use case (textarea), Deployment country
- Submit button triggers HRDD assessment via Server Action
- No API key modal needed if FIRECRAWL_API_KEY in env

**Progress Display (`/app/search-display.tsx`):**
- Adapt existing component to show HRDD phases
- Phase indicators: "Preliminary Screening", "Geographic Context Assessment", "Customer Profile Assessment", "End-Use Application Assessment", "Synthesizing Report"
- Show sources being checked per phase
- Reuse existing animation patterns

**Report Display:**
- Use existing `/app/markdown-renderer.tsx` for structured markdown
- Use existing `/app/citation-tooltip.tsx` for inline citations
- No follow-up questions section (one-shot workflow)
- Add copy-to-clipboard button for report

### Testing

**Manual Acceptance Tests:**
- Test case 1: Low-risk customer (EU-based, public ethics policies, training application) → Low risk classification
- Test case 2: High-risk jurisdiction (Freedom House <40) → High risk in Geographic Context
- Test case 3: Prohibited weapons in use case → Preliminary screening marks REJECTED, continues full assessment
- Test case 4: Sanctioned customer → Preliminary screening flags sanctions, continues full assessment
- Test case 5: Missing critical source (OFAC down) → Warning banner, gap flagged in report
- Test case 6: Conflicting information → Both sources cited with conflicting claims noted

**Unit Tests (Future):**
- Prompt output parsing (extract risk levels from LLM responses)
- Risk classification logic (highest of 3 factors = overall risk)
- Citation format validation

## Authoritative Sources Configuration

### Configuration File Structure

**Location:** `/config/hrdd-sources.json` (JSON chosen for LLM-friendly structure and easy validation)

**Schema:**
```json
{
  "geographic_context": [
    {
      "name": "Freedom House",
      "domain": "freedomhouse.org",
      "description": "Country freedom scores and trends",
      "priority": "critical",
      "paywall": false,
      "search_strategy": "site-specific"
    },
    {
      "name": "Reporters Without Borders",
      "domain": "rsf.org",
      "description": "Press Freedom Index rankings",
      "priority": "critical",
      "paywall": false,
      "search_strategy": "site-specific"
    }
    // ... ~20 sources for geographic context
  ],
  "customer_profile": [
    {
      "name": "OFAC Sanctions List",
      "domain": "treasury.gov/ofac",
      "description": "US Office of Foreign Assets Control sanctions database",
      "priority": "critical",
      "paywall": false,
      "search_strategy": "site-specific"
    }
    // ... ~20 sources for customer profile
  ],
  "end_use_application": [
    {
      "name": "EU Autonomous Weapons Framework",
      "domain": "europa.eu",
      "description": "EU regulations on autonomous weapons",
      "priority": "high",
      "paywall": false,
      "search_strategy": "site-specific"
    }
    // ... ~20 sources for end-use application
  ]
}
```

**Priority Levels:**
- `critical` - Must succeed or prominently flag failure in report
- `high` - Important for comprehensive assessment
- `medium` - Supplementary information
- `low` - Nice-to-have context

**Search Strategies:**
- `site-specific` - Use site: operator to search within domain
- `broader-web` - General web search (for sources without searchable sites)

**Sources to Include (from HRDD Guide Annex 3):**

*Geographic Context (~20 sources):*
- Freedom House (country freedom scores)
- Reporters Without Borders (Press Freedom Index)
- UN Human Rights Council (ohchr.org)
- International Criminal Court (icc-cpi.int)
- International Court of Justice (icj-cij.org)
- US State Department Human Rights Reports (state.gov)
- EU Sanctions Database (sanctionsmap.eu)
- UN Security Council Sanctions (un.org/securitycouncil/sanctions)
- Amnesty International (amnesty.org)
- Human Rights Watch (hrw.org)
- European Parliament (europarl.europa.eu)
- NATO (nato.int)
- Council of Europe (coe.int)
- UK Foreign Office Travel Advice (gov.uk/foreign-travel-advice)
- AI governance frameworks (EU AI Act, national AI laws)

*Customer Profile (~20 sources):*
- OFAC Sanctions List (treasury.gov/ofac)
- UN Security Council Sanctions (un.org/securitycouncil/sanctions)
- EU Sanctions Database (sanctionsmap.eu)
- OpenCorporates (opencorporates.com)
- Company registries (various by country)
- Adverse media (Human Rights Watch, Amnesty International)
- UN Global Compact (unglobalcompact.org)
- UN Guiding Principles on Business and Human Rights resources
- Defense industry associations (transparency standards)
- ESG reporting databases (sustainalytics, etc.)
- Corporate governance indices
- Transparency International (transparency.org)
- SIPRI (sipri.org) for defense contractors
- Customer website (ethics policies section)

*End-Use Application (~20 sources):*
- EU Autonomous Weapons Framework (europa.eu)
- Campaign to Stop Killer Robots (stopkillerrobots.org)
- Wassenaar Arrangement (wassenaar.org)
- UN Group of Governmental Experts on LAWS
- International Committee of the Red Cross (icrc.org) on autonomous weapons
- Defense media (janes.com - note paywall)
- Arms Control Association (armscontrol.org)
- Center for a New American Security (cnas.org)
- Stockholm International Peace Research Institute (sipri.org)
- Chatham House (chathamhouse.org)
- Brookings Institution (brookings.edu)
- European External Action Service (eeas.europa.eu)
- Dual-use export control lists (EU, US, Wassenaar)
- Technical documentation (if provided by Sales Team)

## Prompt Templates

### Design Principles

**All prompts must:**
- Use temperature 0 for deterministic outputs
- Specify GPT-4o as model
- Include explicit risk thresholds from HRDD Guide Annex 3
- Require citation format ([source_id] inline)
- Handle edge cases (missing data, conflicts, paywalls)
- Be easily modifiable based on team feedback

---

### 1. Preliminary Screening Prompts

#### 1.1 Controversial Weapons Detection Prompt

```
ROLE: You are an expert in international humanitarian law and weapons classification, specifically the EU definition of controversial weapons.

TASK: Analyze the use case description to determine if it involves prohibited controversial weapons.

INPUT:
- Use case description: {useCase}

PROHIBITED CATEGORIES (per Axelera AI ESG and Responsible Use Policy):
1. Nuclear, chemical, and biological weapons
2. Cluster munitions and anti-personnel mines
3. Autonomous weapon systems (EU definition: weapon systems without meaningful human control over the critical functions of selecting and attacking individual targets)

INSTRUCTIONS:
1. Check each prohibited category carefully against the use case description
2. Look for direct involvement (design, production, distribution) AND indirect enabling (critical components for prohibited weapons)
3. For autonomous weapons: Assess if system lacks "meaningful human control" over target selection/attack
4. Consider dual-use potential (could technology be easily adapted for prohibited use?)

OUTPUT FORMAT (JSON):
{
  "nuclear_chemical_biological": {
    "prohibited": true/false,
    "rationale": "Brief explanation with specific evidence from use case",
    "confidence": 0.0-1.0
  },
  "cluster_munitions_mines": {
    "prohibited": true/false,
    "rationale": "Brief explanation with specific evidence from use case",
    "confidence": 0.0-1.0
  },
  "autonomous_weapons": {
    "prohibited": true/false,
    "rationale": "Brief explanation referencing meaningful human control assessment",
    "confidence": 0.0-1.0
  },
  "overall_prohibited": true/false,
  "summary": "Overall assessment in 1-2 sentences"
}

EDGE CASES:
- If use case is vague/incomplete: Set confidence <0.5 and note information gap in rationale
- If use case is defensive-only: Explain why it does NOT qualify as prohibited
- If use case is borderline (e.g., "some human control"): Explain degree of human control vs automation
```

---

#### 1.2 Sanctions Check Prompt

```
ROLE: You are an expert in international sanctions regimes (UN, EU, US OFAC).

TASK: Interpret sanctions database search results to determine if customer/country is sanctioned.

INPUT:
- Customer name: {customer}
- Deployment country: {country}
- Search results from OFAC, UN, EU sanctions databases: {searchResults}

INSTRUCTIONS:
1. Check customer name against sanctions lists (exact match and similar names)
2. Check deployment country for comprehensive sanctions (vs targeted sanctions)
3. Differentiate between:
   - Comprehensive sanctions (entire country/entity prohibited)
   - Targeted sanctions (specific individuals/sectors)
   - Historical sanctions (lifted/expired)
4. If customer not found in results but country is sanctioned, note country-level sanctions

OUTPUT FORMAT (JSON):
{
  "customer_sanctioned": true/false/inconclusive,
  "customer_sanctions_programs": ["list of specific programs if sanctioned"],
  "country_sanctioned": true/false/inconclusive,
  "country_sanctions_type": "comprehensive" | "targeted" | "none",
  "country_sanctions_programs": ["list of specific programs if sanctioned"],
  "rationale": "Detailed explanation citing specific sources with [source_id]",
  "information_gaps": ["List any missing data, e.g., 'Could not access UN database'"],
  "confidence": 0.0-1.0
}

EDGE CASES:
- Similar names (not exact match): Flag as inconclusive, note similarity
- Paywall/blocked sources: List in information_gaps, set confidence <0.7
- Historical sanctions (lifted): Clarify status and date lifted
```

---

#### 1.3 High-Risk Jurisdiction Check Prompt

```
ROLE: You are an expert in international human rights law and jurisdictional risk assessment.

TASK: Determine if deployment country meets automatic high-risk criteria per HRDD Guide.

INPUT:
- Deployment country: {country}
- Search results from UN Human Rights Council, ICC, ICJ, Amnesty International, Human Rights Watch: {searchResults}

AUTOMATIC HIGH-RISK CRITERIA (per HRDD Guide):
- Jurisdictions credibly accused by UN bodies, international courts, or recognized human rights organizations of serious and systematic violations of international humanitarian law, human rights law, or atrocity crimes

INSTRUCTIONS:
1. Search for credible accusations by:
   - UN Human Rights Council (investigations, reports, resolutions)
   - International Criminal Court (ICC case dockets)
   - International Court of Justice (ICJ rulings)
   - Amnesty International and Human Rights Watch (systematic violation reports)
2. Assess if violations are "serious and systematic" (not isolated incidents)
3. Check recency (recent violations more relevant than historical)
4. Note any conflicting information from different sources

OUTPUT FORMAT (JSON):
{
  "automatic_high_risk": true/false/inconclusive,
  "un_bodies_accusations": [
    {
      "body": "e.g., UN Human Rights Council",
      "accusation": "Brief description of systematic violation",
      "date": "Year or date of report/resolution",
      "citation": "[source_id]"
    }
  ],
  "international_court_cases": [
    {
      "court": "ICC or ICJ",
      "case": "Case name or docket number",
      "status": "Investigation/trial/ruling",
      "citation": "[source_id]"
    }
  ],
  "hr_organization_reports": [
    {
      "organization": "Amnesty or HRW",
      "finding": "Description of systematic violations",
      "date": "Year",
      "citation": "[source_id]"
    }
  ],
  "rationale": "Overall assessment with all citations",
  "information_gaps": ["List any missing sources or incomplete data"],
  "confidence": 0.0-1.0
}

EDGE CASES:
- Conflicting sources (one org says yes, another no): Present both with citations, set confidence <0.7
- Historical violations (>5 years ago) but no recent reports: Note temporal context
- Isolated incidents (not systematic): Explain why NOT automatic high-risk
```

---

### 2. Risk Factor Assessment Prompts

#### 2.1 Geographic Context Risk Classification Prompt

```
ROLE: You are an expert in country risk assessment for AI technology deployment, with deep knowledge of governance structures, human rights records, and international law compliance.

TASK: Classify geographic risk for deployment country based on HRDD Guide Annex 3 criteria.

INPUT:
- Deployment country: {country}
- Search results with findings: {searchResults}

RISK CLASSIFICATION CRITERIA (HRDD Guide Annex 3):

LOW RISK (Green) - Stable, rights-respecting countries:
- EU or NATO member countries
- Freedom House "Free" rating (score >70)
- Press Freedom Index score >60
- No UN Human Rights Council investigations

MEDIUM RISK (Orange) - Partially free or declining safeguards:
- Freedom House "Partly Free" or declining trends
- Press Freedom Index score 30-60
- UN Human Rights Council recommendations issued with improvement efforts
- Democracies with governance gaps or declining trends

HIGH RISK (Red) - Authoritarian or high misuse potential:
- Freedom House "Not Free" rating (score <40)
- Press Freedom Index score <30
- Documented misuse of technology for political repression (per UN bodies, Freedom House, Amnesty, HRW)
- Conflict-affected or authoritarian states

INSTRUCTIONS:
1. Check EU/NATO membership first (strong indicator of Low risk)
2. Extract Freedom House score if available (primary numeric threshold)
3. Extract Press Freedom Index score if available (secondary numeric threshold)
4. Review UN Human Rights Council reports for investigations or recommendations
5. Check ICC/ICJ case dockets for country involvement
6. Review State Department Human Rights Reports for governance assessment
7. Check sanctions status (comprehensive vs targeted)
8. Assess AI governance and surveillance laws (does country regulate AI misuse?)
9. Apply LOWEST classification if multiple factors present (e.g., EU member but declining press freedom = Medium)
10. Cite EVERY factual claim with [source_id]

OUTPUT FORMAT (JSON):
{
  "risk_level": "Low" | "Medium" | "High",
  "eu_nato_member": true/false,
  "freedom_house_score": number or null,
  "freedom_house_rating": "Free" | "Partly Free" | "Not Free" or null,
  "press_freedom_index_score": number or null,
  "un_investigations": ["List of investigations with dates"],
  "governance_assessment": "Brief summary of political system and safeguards",
  "ai_governance": "Summary of AI regulation and surveillance laws",
  "sanctions_status": "none" | "targeted" | "comprehensive",
  "rationale": "Comprehensive explanation citing ALL sources with [source_id]. Explain which criteria led to risk classification. Note any conflicting information.",
  "information_gaps": ["List missing data, e.g., 'Press Freedom Index score not found for 2024'"],
  "confidence": 0.0-1.0
}

EDGE CASES:
- Country in transition (recent political change): Note temporal context, use most recent data
- Freedom House/Press Freedom scores unavailable: Use qualitative assessment from UN/HRW reports, reduce confidence
- Conflicting indicators (EU member but press freedom declining): Explain both factors, classify based on LOWEST rating
- Missing critical sources (Freedom House blocked): Flag prominently in information_gaps
```

---

#### 2.2 Customer Profile Risk Classification Prompt

```
ROLE: You are an expert in corporate due diligence, business ethics, and human rights compliance, particularly in the defense and technology sectors.

TASK: Classify customer risk based on ethical track record, governance, and compliance history per HRDD Guide Annex 3.

INPUT:
- Customer name: {customer}
- Search results with findings: {searchResults}

RISK CLASSIFICATION CRITERIA (HRDD Guide Annex 3):

LOW RISK (Green):
- Companies that have adopted UN Guiding Principles on Business and Human Rights or similar frameworks
- Strong corporate governance with published ethics policies
- Clean compliance record with no violations in past 5 years
- Transparent operations and public sustainability reporting
- Public commitment to international humanitarian law compliance

MEDIUM RISK (Orange):
- Customers with established (human rights) compliance programs
- Government entities with democratic oversight mechanisms
- Organizations subject to regulatory oversight in EU/NATO member states
- Companies with resolved violations (>3 years ago) and corrective actions taken

HIGH RISK (Red):
- Organizations with unresolved compliance violations and/or recent human rights concerns (within past 3 years)
- Entities with opaque ownership structure, limited transparency, or unclear governance
- Companies in sensitive sectors without established ethics frameworks
- Organizations under active investigation by regulatory bodies (but not sanctioned)

INSTRUCTIONS:
1. Check customer website for ethics/human rights policies and UN Guiding Principles adoption
2. Review corporate registries and annual reports for governance structures
3. Check sanctions databases (UN, EU, US OFAC) - if sanctioned, this was caught in preliminary screening
4. Search adverse media for ethics violations or human rights concerns (past 3-5 years)
5. Check defense industry associations for compliance standards membership
6. Review ESG/sustainability reporting (public disclosures)
7. Assess ownership transparency (public vs private, disclosed shareholders)
8. Note date of any violations found (recent <3 years = High risk, resolved >3 years = Medium risk)
9. Cite EVERY factual claim with [source_id]

OUTPUT FORMAT (JSON):
{
  "risk_level": "Low" | "Medium" | "High",
  "ungp_adoption": true/false/unknown,
  "ethics_policies_found": true/false,
  "corporate_governance": "Strong" | "Moderate" | "Weak" | "Opaque",
  "compliance_violations": [
    {
      "violation": "Description",
      "date": "Year",
      "status": "Unresolved" | "Resolved",
      "citation": "[source_id]"
    }
  ],
  "adverse_media_findings": [
    {
      "finding": "Description of concern",
      "date": "Year",
      "source": "Publication name",
      "citation": "[source_id]"
    }
  ],
  "ownership_transparency": "Transparent" | "Limited" | "Opaque",
  "esg_reporting": true/false,
  "rationale": "Comprehensive explanation citing ALL sources with [source_id]. Explain which criteria led to risk classification.",
  "information_gaps": ["List missing data, e.g., 'Customer website has no ethics policy section'"],
  "confidence": 0.0-1.0
}

EDGE CASES:
- Customer website down/inaccessible: Note in information_gaps, reduce confidence
- Violations found but dates unclear: Assume recent (<3 years) for conservative risk assessment
- Private company with limited public info: Classify as Medium/High risk due to opacity, note gap
- Government entity: Assess based on government type (democratic oversight = Medium, authoritarian = High)
- Conflicting reports (one source says violation, another says no): Present both with citations, explain rationale for classification
```

---

#### 2.3 End-Use Application Risk Classification Prompt

```
ROLE: You are an expert in autonomous weapons systems, dual-use technology assessment, and military AI applications, with deep knowledge of international humanitarian law.

TASK: Classify end-use risk based on three dimensions: human control, proximity to harm, and ease of repurposing, per HRDD Guide Annex 3.

INPUT:
- Use case description: {useCase}
- Search results with findings: {searchResults}

RISK CLASSIFICATION CRITERIA (HRDD Guide Annex 3):

LOW RISK (Green) - Limited Misuse Potential:
- Administrative, training, or logistical systems with minimal military impact
- Maintenance, diagnostics, or health/safety applications
- Defensive surveillance or access control that cannot directly enable attacks
- Misuse would result in operational inconvenience, not lethal effects

MEDIUM RISK (Orange) - Combat-Enabling Potential:
- Reconnaissance, intelligence, or battlefield awareness tools
- Target identification or tracking that still requires human decision-making
- Defensive electronic warfare or countermeasure systems
- Misuse could facilitate or accelerate combat operations

HIGH RISK (Red) - Near-Weaponization Potential:
- Semi-autonomous strike or targeting systems
- AI modules that could be adapted to launch attacks with limited human oversight
- Technologies that, in the wrong hands, could directly enable lethal or indiscriminate use
- Close to prohibited autonomous weapon functionality

THREE ASSESSMENT DIMENSIONS:

1. LEVEL OF HUMAN CONTROL:
   - High: Meaningful human control over all critical decisions (target selection, engagement)
   - Medium: Human oversight but system provides recommendations that could be auto-accepted
   - Low: Minimal human control, system operates autonomously with human monitoring only

2. PROXIMITY TO HARM:
   - Low: Administrative/logistical (personnel management, supply chain)
   - Medium: Combat-enabling (reconnaissance, target identification, battlefield awareness)
   - High: Near-weaponization (targeting assistance, strike coordination, autonomous navigation for weapons delivery)

3. EASE OF REPURPOSING:
   - Low: Difficult to repurpose (specialized hardware, limited flexibility)
   - Medium: Moderate repurposing risk (software-defined, but requires expertise)
   - High: Easy to repurpose (general-purpose AI, modular design, commercial-off-the-shelf)

INSTRUCTIONS:
1. Analyze use case description for specific technical details about system functions
2. Assess level of human control - does human operator control target selection and engagement decisions?
3. Assess proximity to harm - how close is system to actual weapons delivery?
4. Assess repurposing ease - how easily could system be adapted for prohibited use?
5. Search for similar systems in defense media to understand typical applications
6. Compare to EU autonomous weapons definition (weapons without meaningful human control)
7. Check dual-use export control lists (Wassenaar, EU, US) for similar technologies
8. Review autonomous weapons frameworks (Campaign to Stop Killer Robots, ICRC guidance)
9. If technical documentation provided by Sales Team, review for autonomy indicators
10. Cite EVERY factual claim with [source_id]

OUTPUT FORMAT (JSON):
{
  "risk_level": "Low" | "Medium" | "High",
  "human_control_level": "High" | "Medium" | "Low",
  "human_control_rationale": "Explanation of control mechanisms with citations",
  "proximity_to_harm": "Low" | "Medium" | "High",
  "proximity_rationale": "Explanation of how close to weapons delivery with citations",
  "repurposing_ease": "Low" | "Medium" | "High",
  "repurposing_rationale": "Explanation of adaptability risk with citations",
  "autonomous_weapons_comparison": "Does this approach prohibited autonomous weapons? Explain EU definition comparison.",
  "dual_use_classification": "Any relevant export control classifications found",
  "rationale": "Comprehensive explanation citing ALL sources with [source_id]. Explain how three dimensions combine to overall risk level.",
  "information_gaps": ["List missing data, e.g., 'Technical documentation not provided by Sales Team'"],
  "confidence": 0.0-1.0
}

EDGE CASES:
- Vague use case description: Request specific details in information_gaps, classify conservatively (Medium/High)
- Defensive-only system: Explain why proximity to harm is low despite military context
- Dual-use (civilian + military): Assess based on military application, note dual-use in rationale
- Technical documentation unavailable: Use publicly available info, note gap, reduce confidence
- Borderline human control (e.g., "human in the loop" but not "human on the loop"): Explain distinction with EU framework
```

---

### 3. Search Query Generation Prompts

#### 3.1 Geographic Context Query Generation Prompt

```
ROLE: You are an expert researcher specializing in country risk assessment and international relations.

TASK: Generate targeted search queries to assess geographic risk for deployment country.

INPUT:
- Deployment country: {country}
- Authoritative sources config: {sourcesConfig}

REQUIRED INFORMATION TO FIND:
1. EU/NATO membership status
2. Freedom House country freedom score and rating (most recent year)
3. Press Freedom Index score (most recent year from Reporters Without Borders)
4. UN Human Rights Council reports, investigations, or resolutions
5. ICC and ICJ case dockets involving country
6. US State Department Human Rights Report for country
7. Sanctions status (UN, EU, US - comprehensive vs targeted)
8. AI governance laws and surveillance regulations in country
9. Recent political developments affecting human rights (past 3 years)

INSTRUCTIONS:
1. Generate SITE-SPECIFIC queries for authoritative sources (use site: operator)
2. Generate BROADER WEB queries for supplementary context
3. Make queries specific to country name (not generic)
4. Include year/date in queries for recency (e.g., "2024 Freedom House score")
5. Generate 15-20 total queries (mix of site-specific and broader)

OUTPUT FORMAT (JSON):
{
  "site_specific_queries": [
    {
      "query": "site:freedomhouse.org {country} freedom score 2024",
      "source": "Freedom House",
      "priority": "critical",
      "rationale": "Get numeric freedom score for threshold comparison"
    },
    {
      "query": "site:rsf.org {country} press freedom index 2024",
      "source": "Reporters Without Borders",
      "priority": "critical",
      "rationale": "Get press freedom score for threshold comparison"
    }
    // ... more site-specific queries
  ],
  "broader_queries": [
    {
      "query": "{country} UN Human Rights Council investigation 2022-2024",
      "rationale": "Find any recent UN investigations"
    },
    {
      "query": "{country} AI surveillance laws regulation 2024",
      "rationale": "Assess AI governance framework"
    }
    // ... more broader queries
  ]
}

EXAMPLE OUTPUT for country="Myanmar":
{
  "site_specific_queries": [
    {"query": "site:freedomhouse.org Myanmar freedom score 2024", "source": "Freedom House", "priority": "critical"},
    {"query": "site:rsf.org Myanmar press freedom index 2024", "source": "Reporters Without Borders", "priority": "critical"},
    {"query": "site:ohchr.org Myanmar human rights investigation", "source": "UN Human Rights Council", "priority": "high"},
    {"query": "site:icc-cpi.int Myanmar case docket", "source": "ICC", "priority": "high"}
  ],
  "broader_queries": [
    {"query": "Myanmar UN human rights violations 2022-2024"},
    {"query": "Myanmar AI surveillance technology regulations"}
  ]
}
```

---

#### 3.2 Customer Profile Query Generation Prompt

```
ROLE: You are an expert researcher specializing in corporate due diligence and business ethics assessment.

TASK: Generate targeted search queries to assess customer risk.

INPUT:
- Customer name: {customer}
- Authoritative sources config: {sourcesConfig}

REQUIRED INFORMATION TO FIND:
1. Customer website ethics/human rights policies and UN Guiding Principles adoption
2. Corporate governance structure (from registries, annual reports)
3. Sanctions database checks (UN, EU, US OFAC)
4. Adverse media for violations or concerns (past 3-5 years)
5. Defense industry association memberships and compliance standards
6. ESG/sustainability reporting and certifications
7. Compliance violations or regulatory investigations
8. Ownership structure and transparency
9. Track record in human rights (positive or negative)

INSTRUCTIONS:
1. Generate SITE-SPECIFIC queries for authoritative sources (sanctions databases, corporate registries)
2. Generate CUSTOMER WEBSITE queries to find ethics policies
3. Generate BROADER WEB queries for adverse media (date-scoped to past 3-5 years)
4. Make queries specific to customer name (include variations, e.g., full name, abbreviation)
5. Generate 15-20 total queries (mix of site-specific, website, broader)

OUTPUT FORMAT (JSON):
{
  "customer_website_queries": [
    {
      "query": "site:{customer_domain} ethics policy human rights",
      "rationale": "Find published ethics policies"
    },
    {
      "query": "site:{customer_domain} UN Guiding Principles Business Human Rights",
      "rationale": "Check UNGP adoption"
    }
  ],
  "site_specific_queries": [
    {
      "query": "site:treasury.gov/ofac {customer}",
      "source": "OFAC Sanctions",
      "priority": "critical"
    },
    {
      "query": "site:opencorporates.com {customer}",
      "source": "OpenCorporates",
      "priority": "high"
    }
  ],
  "adverse_media_queries": [
    {
      "query": "{customer} human rights violation 2020-2024",
      "date_scope": "past 5 years",
      "rationale": "Find recent adverse media"
    },
    {
      "query": "site:hrw.org {customer}",
      "source": "Human Rights Watch",
      "priority": "high"
    }
  ],
  "broader_queries": [
    {
      "query": "{customer} ESG sustainability report 2023",
      "rationale": "Find public ESG reporting"
    },
    {
      "query": "{customer} corporate governance structure annual report",
      "rationale": "Assess governance transparency"
    }
  ]
}

EXAMPLE OUTPUT for customer="Acme Defense Systems":
{
  "customer_website_queries": [
    {"query": "site:acmedefense.com ethics policy human rights"},
    {"query": "site:acmedefense.com UN Guiding Principles"}
  ],
  "site_specific_queries": [
    {"query": "site:treasury.gov/ofac Acme Defense Systems", "priority": "critical"},
    {"query": "site:un.org/securitycouncil/sanctions Acme Defense", "priority": "critical"}
  ],
  "adverse_media_queries": [
    {"query": "Acme Defense Systems human rights violation 2020-2024"},
    {"query": "site:hrw.org Acme Defense Systems"}
  ]
}
```

---

#### 3.3 End-Use Application Query Generation Prompt

```
ROLE: You are an expert researcher specializing in military technology, autonomous weapons, and dual-use systems assessment.

TASK: Generate USE-CASE-SPECIFIC search queries to assess end-use application risk. Queries must reference SPECIFIC technical details from the use case description, NOT generic terms.

INPUT:
- Use case description: {useCase}
- Authoritative sources config: {sourcesConfig}

REQUIRED INFORMATION TO FIND:
1. Technical documentation and specifications for similar systems
2. Autonomous weapons frameworks (EU definition, international law)
3. Dual-use controls and export regulations for this technology type
4. Defense/security media reporting on similar applications
5. Human control mechanisms for this type of system
6. Proximity to harm analysis (how close to weapons delivery)
7. Repurposing potential (adaptability for harmful use)
8. Comparison to prohibited autonomous weapon systems

CRITICAL INSTRUCTION:
Generate queries that reference SPECIFIC TECHNICAL TERMS from the use case description.

EXAMPLE:
- GOOD: "vision optronics military binoculars target identification" (uses specific terms from use case)
- BAD: "autonomous weapons AI military" (generic, not use-case-specific)

INSTRUCTIONS:
1. Extract key technical terms from use case description (e.g., "vision optronics", "edge processing", "drone navigation")
2. Generate SITE-SPECIFIC queries for autonomous weapons frameworks
3. Generate USE-CASE-SPECIFIC broader queries referencing exact technical details
4. Search for similar systems in defense media to understand typical applications
5. Include human control assessment queries
6. Generate 15-20 total queries (mix of site-specific and use-case-specific broader)

OUTPUT FORMAT (JSON):
{
  "extracted_technical_terms": ["term1", "term2", "term3"],
  "site_specific_queries": [
    {
      "query": "site:europa.eu autonomous weapons meaningful human control definition",
      "source": "EU Autonomous Weapons Framework",
      "priority": "high"
    },
    {
      "query": "site:wassenaar.org dual-use {technical_term} export control",
      "source": "Wassenaar Arrangement",
      "priority": "medium"
    }
  ],
  "use_case_specific_queries": [
    {
      "query": "{technical_term_1} {technical_term_2} human control operator decision",
      "rationale": "Assess level of human control for this specific technology"
    },
    {
      "query": "{technical_term_1} military application targeting strike coordination",
      "rationale": "Assess proximity to harm for this specific system"
    }
  ],
  "broader_queries": [
    {
      "query": "{technical_term} repurposing adaptability military civilian",
      "rationale": "Assess ease of repurposing"
    }
  ]
}

EXAMPLE OUTPUT for useCase="Vision optronics edge processing for military binoculars with real-time threat detection":
{
  "extracted_technical_terms": ["vision optronics", "edge processing", "military binoculars", "real-time threat detection"],
  "site_specific_queries": [
    {"query": "site:europa.eu autonomous weapons meaningful human control", "priority": "high"},
    {"query": "site:stopkillerrobots.org vision optronics targeting", "priority": "medium"}
  ],
  "use_case_specific_queries": [
    {"query": "vision optronics military binoculars threat detection human control", "rationale": "Human control assessment"},
    {"query": "edge processing military binoculars targeting weapons delivery", "rationale": "Proximity to harm"},
    {"query": "real-time threat detection military autonomous targeting", "rationale": "Autonomy level"}
  ],
  "broader_queries": [
    {"query": "vision optronics repurposing adaptability civilian military dual-use"}
  ]
}
```

---

### 4. Report Synthesis Prompt

#### 4.1 Final Report Generation Prompt

```
ROLE: You are an expert compliance officer preparing Human Rights Due Diligence assessment reports for Board review.

TASK: Synthesize all research findings into a structured, comprehensive HRDD assessment report in markdown format.

INPUT:
- Dossier: {customer}, {useCase}, {country}
- Preliminary screening results: {preliminaryScreening}
- Geographic Context findings: {geographicRisk}
- Customer Profile findings: {customerRisk}
- End-Use Application findings: {endUseRisk}
- All sources: {sources}

REPORT STRUCTURE (MANDATORY SECTIONS):

# Human Rights Due Diligence Assessment Report

## Executive Summary
- Customer name and deployment country
- Use case brief description (1 sentence)
- **Overall Risk Classification: [Low/Medium/High]**
- Key findings (3-4 bullet points)
- Recommendation (Approve / Conditional Approval / Reject)
- [If preliminary screening failed: **CUSTOMER REJECTED DUE TO PRELIMINARY SCREENING FAILURE**]

## Dossier Information
- **Customer Name:** {customer}
- **Use Case Description:** {useCase}
- **Deployment Country:** {country}
- **Assessment Date:** {current_date}

## Preliminary Screening Results

### Controversial Weapons Check
- **Result:** [No prohibited activities detected / PROHIBITED ACTIVITIES DETECTED]
- **Rationale:** [Explanation with citations]

### Sanctions Check
- **Customer Sanctions Status:** [Not sanctioned / Sanctioned]
- **Country Sanctions Status:** [None / Targeted / Comprehensive]
- **Rationale:** [Explanation with citations]

### High-Risk Jurisdiction Check
- **Result:** [Not automatic high-risk / AUTOMATIC HIGH-RISK]
- **Rationale:** [Explanation with citations]

**Preliminary Screening Outcome:** [PASS / FAIL]

## Enhanced Due Diligence Findings

### Risk Factor 1: Geographic Context
- **Risk Level:** [Low / Medium / High]
- **EU/NATO Member:** [Yes/No]
- **Freedom House Score:** [score] ([Free/Partly Free/Not Free])
- **Press Freedom Index:** [score]
- **Key Findings:**
  - [Finding 1 with citation [1]]
  - [Finding 2 with citation [2]]
- **Rationale:** [Comprehensive explanation with ALL citations]
- **Information Gaps:** [List any missing data]

### Risk Factor 2: Customer Profile
- **Risk Level:** [Low / Medium / High]
- **UN Guiding Principles Adoption:** [Yes/No/Unknown]
- **Corporate Governance:** [Strong/Moderate/Weak/Opaque]
- **Compliance Violations:** [None / List violations with dates]
- **Key Findings:**
  - [Finding 1 with citation [3]]
  - [Finding 2 with citation [4]]
- **Rationale:** [Comprehensive explanation with ALL citations]
- **Information Gaps:** [List any missing data]

### Risk Factor 3: End-Use Application
- **Risk Level:** [Low / Medium / High]
- **Human Control Level:** [High/Medium/Low]
- **Proximity to Harm:** [Low/Medium/High]
- **Repurposing Ease:** [Low/Medium/High]
- **Key Findings:**
  - [Finding 1 with citation [5]]
  - [Finding 2 with citation [6]]
- **Rationale:** [Comprehensive explanation with ALL citations]
- **Information Gaps:** [List any missing data]

## Overall Risk Classification

**Overall Risk Level: [Low / Medium / High]**

**Rationale:** The overall risk level is determined by the HIGHEST of the three risk factors:
- Geographic Context: [Low/Medium/High]
- Customer Profile: [Low/Medium/High]
- End-Use Application: [Low/Medium/High]

[Explain which factor(s) drove the overall classification and why]

## Recommended Conditions (if Medium/High Risk)

[If Low risk: "No additional conditions required beyond standard contract terms."]

[If Medium/High risk, list specific conditions, e.g.:]
- Contractual requirement to adhere to UN Guiding Principles on Business and Human Rights
- Regular monitoring and reporting (annual/semi-annual)
- Prohibition on resale or transfer without prior approval
- Technical safeguards (e.g., geofencing, usage logs)
- [Additional conditions based on specific risks identified]

## Information Gaps and Recommended Additional Research

[List all information gaps identified during assessment:]
- [Gap 1: e.g., "Freedom House 2024 score not yet published - used 2023 score"]
- [Gap 2: e.g., "Customer website has no published ethics policy - recommend direct inquiry"]
- [Gap 3: e.g., "Technical documentation not provided by Sales Team - recommend requesting system architecture diagram"]

[For each gap, recommend specific additional research or inquiries]

## Citations

[Full list of all sources cited, numbered in order of appearance:]

[1] [Source title], [URL], accessed [date]
[2] [Source title], [URL], accessed [date]
...

---

**WARNING BANNER (if critical sources unavailable):**
⚠️ **WARNING: Unable to access [source name] - manual verification required before finalizing risk classification.**

**REJECTION NOTICE (if preliminary screening failed):**
🚫 **CUSTOMER REJECTED: Preliminary screening detected [prohibited activities/sanctions/systematic violations]. This assessment is provided for documentation purposes only. Board waiver NOT permitted per ESG and Responsible Use Policy.**

---

CRITICAL FORMATTING RULES:
1. EVERY factual claim MUST have inline citation in format [number]
2. Citation numbers must correspond to Citations section at end
3. Use markdown formatting (##, ###, **, -, etc.)
4. Include specific dates when mentioning violations or reports (e.g., "violation reported in 2022")
5. Present conflicting information transparently: "Source A reports X [1], while Source B reports Y [2]"
6. Never hallucinate missing data - use "Information not available" and list in Information Gaps section
7. Use exact risk level terminology: "Low", "Medium", "High" (not "Moderate" or "Minimal")

TONE:
- Professional and objective
- Evidence-based (every claim cited)
- Transparent about limitations and gaps
- Actionable (clear recommendations)
```

---

## Risk Classification Logic

### Rule-Based Thresholds (Embedded in Prompts)

**Geographic Context:**
- Low Risk: Freedom House >70 OR Press Freedom >60 OR EU/NATO member
- Medium Risk: Freedom House 40-70 OR Press Freedom 30-60 OR democratic with gaps
- High Risk: Freedom House <40 OR Press Freedom <30 OR documented tech misuse

**Customer Profile:**
- Low Risk: UNGP adoption + published ethics + no violations (past 5 years) + transparent governance
- Medium Risk: Compliance programs + democratic oversight + resolved violations (>3 years)
- High Risk: Recent violations (<3 years) OR opaque ownership OR no ethics frameworks OR active investigation

**End-Use Application:**
- Low Risk: Administrative/training + high human control + low proximity to harm + difficult to repurpose
- Medium Risk: Reconnaissance/intelligence + medium human control + combat-enabling + moderate repurposing
- High Risk: Semi-autonomous targeting + low human control + near-weaponization + easy repurposing

**Overall Risk = Highest of Three Factors**
- If ANY factor is High → Overall = High
- If ANY factor is Medium (and none High) → Overall = Medium
- If ALL factors are Low → Overall = Low

### Decision Matrix

| Overall Risk | ERC Action | Approval Authority | Enhanced Conditions |
|--------------|------------|-------------------|---------------------|
| Low | Recommend Approval | ERC decides | Standard contract terms |
| Medium | Recommend Conditional Approval | Board Chair confirms | UNGP adherence, monitoring, resale prohibition |
| High | Recommend to Board | Full Board votes | UNGP + safeguards + reporting + technical controls |
| REJECTED (Preliminary) | No Board waiver | N/A | Sale prohibited per policy |

## Out of Scope

**Not Included in MVP:**
- Continuous monitoring (annual basis checks mentioned in HRDD Guide)
- Precedent search (finding similar past assessments)
- Multi-language support
- Collaborative review features (multiple reviewers, comments, approval workflows)
- ML-based risk scoring (using rule-based thresholds only)
- Report storage and case management database (audit trail logged but not persisted to DB)
- PDF/Word export (markdown copy/paste only)
- Multi-country deployment assessments in single report
- Follow-up questions or conversational interface
- Board approval workflow integration
- Email notifications or Slack alerts
- Integration with external compliance systems or Sales CRM
- Paid/paywalled data sources (free/public data only)
- Report comparison or trend analysis across cases
- Batch processing of multiple dossiers
- Authentication/authorization (no user roles)

**Future Enhancements:**
- Supabase database for persistent assessment storage
- User roles and permissions (Sales Team vs ERC)
- PDF export with branded template
- Interactive report editing before finalization
- Annual monitoring automation (re-run assessment for existing customers)
- Case management dashboard (all past assessments)
- Integration with Sales CRM (auto-populate customer data)
- Precedent search (find similar past cases)
- ML-enhanced risk scoring (complement rule-based thresholds)
- Paid data source integrations (access paywalled databases)

## Success Criteria

**MVP Complete When:**
- ERC member can input dossier via simple 3-field form
- System performs two-stage assessment automatically (preliminary + enhanced DD) in <1 hour
- Preliminary screening correctly identifies prohibited activities, sanctions, high-risk jurisdictions
- Three risk factors assessed with distinct queries per factor (not generic queries)
- Site-specific searches target authoritative sources from config file
- Broader web searches supplement findings beyond curated sources
- Complete structured markdown report generated with all required sections
- Every factual claim has inline citation [source_id] with tooltip showing source URL
- Risk classification matches HRDD Guide definitions (numeric thresholds applied correctly)
- Information gaps flagged explicitly (never hallucinated)
- System continues full assessment even if preliminary screening fails (marks as REJECTED but completes Enhanced DD)
- Missing critical sources prominently warned in report with ⚠️ banner
- Audit trail logged to console/file (queries, sources, timestamps, LLM responses)
- Report can be copied from web interface and pasted into documents
- Prompts are modifiable via code (stored as documented templates)
- Authoritative sources config in /config folder (easily editable JSON)
- Real-time progress shown (if feasible) or omitted (if too complex)

**Quality Indicators:**
- **Consistency:** Same dossier inputs produce similar reports with same risk classifications (deterministic prompts with temperature 0)
- **Completeness:** All sections present (preliminary screening + 3 risk factors + synthesis)
- **Auditability:** Clear citation trail for every claim with source URLs accessible via tooltips
- **Accuracy:** Risk classifications align with HRDD Guide Annex 3 thresholds (Freedom House scores applied correctly)
- **Reliability:** Graceful degradation when sources unavailable (warnings in report, not failures)
- **Usability:** ERC member can complete assessment without technical support
- **Transparency:** Conflicting information presented with multiple citations, not hidden
- **Honesty:** Missing data explicitly flagged in Information Gaps section, never filled with assumptions
- **Efficiency:** Parallel searches where possible, completion within 1 hour target
- **Specificity:** End-use queries reference specific technical terms from use case (not generic "autonomous weapons")

**Acceptance Tests:**

*Test 1: Low-Risk Customer (Expected: Overall Low Risk)*
- Input: Customer="TechCorp EU", UseCase="AI-powered training simulator for medics", Country="Germany"
- Expected: Geographic=Low (EU member, high Freedom House), Customer=Low (if no violations found), EndUse=Low (training, no weaponization), Overall=Low

*Test 2: High-Risk Jurisdiction (Expected: Overall High Risk)*
- Input: Customer="Local Company", UseCase="Surveillance cameras", Country="Myanmar"
- Expected: Geographic=High (Freedom House <40, UN investigations), Overall=High (regardless of other factors)

*Test 3: Prohibited Weapons (Expected: REJECTED, but Full Assessment Completed)*
- Input: Customer="Defense Systems Inc", UseCase="Autonomous targeting system without human control", Country="USA"
- Expected: Preliminary screening detects autonomous weapons, marks REJECTED, but continues full Enhanced DD, report shows "CUSTOMER REJECTED" banner

*Test 4: Sanctioned Customer (Expected: REJECTED, but Full Assessment Completed)*
- Input: Customer="Sanctioned Entity XYZ", UseCase="AI chip", Country="Iran"
- Expected: Preliminary screening detects OFAC sanctions, marks REJECTED, continues full Enhanced DD, report shows sanctions status

*Test 5: Missing Critical Source (Expected: Warning Banner, Gap Flagged)*
- Input: Any dossier, but OFAC database unreachable during assessment
- Expected: Report includes "⚠️ WARNING: Unable to access OFAC Sanctions Database - manual verification required", Information Gaps section lists "OFAC database unreachable", confidence reduced

*Test 6: Conflicting Information (Expected: Both Sources Cited)*
- Input: Customer with conflicting reports (e.g., one source says violation, another says no violation)
- Expected: Report presents both: "Source A reports violation in 2021 [1], while Source B found no evidence of violations [2]", ERC interprets

*Test 7: Use-Case-Specific Queries (Expected: Specific Technical Terms in Queries)*
- Input: UseCase="Vision optronics for military binoculars"
- Expected: Generated queries include "vision optronics military binoculars" NOT generic "autonomous weapons AI"

*Test 8: Information Gap Handling (Expected: Explicit Gap Flagging)*
- Input: Customer with no public website or ethics policies
- Expected: Report states "Customer website inaccessible - ethics policy status unknown", Information Gaps section recommends "Direct inquiry to customer for ethics policy documentation"

---

## Implementation Notes

### File Modifications Required

**Replace/Modify:**
- `/app/page.tsx` - Replace chat interface with HRDD dossier form
- `/app/chat.tsx` - Adapt to handle dossier submission and HRDD workflow events
- `/lib/langgraph-search-engine.ts` - Replace core workflow with HRDD two-stage assessment
- `/lib/config.ts` - Add HRDD_CONFIG with model settings (GPT-4o for all phases)

**Create New:**
- `/config/hrdd-sources.json` - Authoritative sources by risk domain (~60 sources)
- `/lib/hrdd-prompts.ts` - All prompt templates as constants (from spec)
- `/lib/hrdd-workflow.ts` - HRDD-specific LangGraph workflow (if separating from main engine)
- `/lib/hrdd-state.ts` - HRDD state annotation (dossier, preliminary, risk factors)

**Reuse As-Is:**
- `/app/search-display.tsx` - Adapt via event types (add HRDD phase names)
- `/app/markdown-renderer.tsx` - No changes needed
- `/app/citation-tooltip.tsx` - No changes needed
- `/lib/firecrawl.ts` - No changes needed
- `/lib/error-handler.ts` - No changes needed
- `/components/ui/*` - No changes needed

### Integration Points

**Server Action (app/search.ts):**
```typescript
// Modified signature
export async function hrddAssessment(
  dossier: { customer: string; useCase: string; country: string },
  firecrawlApiKey?: string
) {
  // Create HRDD search engine instead of conversational
  const engine = new HRDDSearchEngine(firecrawl);
  const stream = engine.runAssessment(dossier, eventCallback);
  return { stream };
}
```

**Event Types (add to SearchEvent union):**
```typescript
| { type: 'hrdd-phase'; phase: 'preliminary-screening' | 'geographic-context' | 'customer-profile' | 'end-use-application' | 'synthesis' }
| { type: 'risk-classification'; factor: string; level: 'Low'|'Medium'|'High'; rationale: string }
| { type: 'preliminary-result'; passed: boolean; details: object }
```

### Configuration File Schema

**Location:** `/config/hrdd-sources.json`

**Validation:** Use JSON Schema or Zod to validate structure on load

**Version Control:** Commit to git, track changes for audit trail

### Audit Trail Logging

**Development:** Console.log all events

**Production:** Write to file or Supabase (future enhancement)

**Data to Log:**
- Timestamp for each phase
- All queries executed with results count
- All sources accessed with URLs
- LLM prompts and responses (redacted if sensitive)
- Risk classification decisions with rationale
- Final report content
- Processing duration per phase

### Model Configuration

**All Phases Use GPT-4o:**
```typescript
const HRDD_MODEL_CONFIG = {
  MODEL: "gpt-4o", // Use high-quality model for all phases
  TEMPERATURE: 0,   // Deterministic outputs for consistency
  MAX_TOKENS: 4096, // Sufficient for structured outputs
};
```

**Cost Consideration:** GPT-4o is more expensive than gpt-4o-mini, but accuracy critical for compliance. Estimate ~$0.50-$2.00 per assessment (depends on search result sizes).

### Error Recovery

**Continue on Non-Critical Failures:**
- If Freedom House unreachable → Use qualitative assessment from HRW/Amnesty, flag gap
- If customer website down → Note in gap, assess based on other sources
- If paywalled source → Skip, note in gap, recommend manual check

**Halt Only on Critical Failures:**
- All LLM API calls fail → Return error message to user
- Firecrawl API key invalid → Return error message to user
- No sources accessible at all → Return partial report with all gaps flagged

### Deployment Checklist

- [ ] Environment variables set: OPENAI_API_KEY, FIRECRAWL_API_KEY
- [ ] `/config/hrdd-sources.json` created with all ~60 sources
- [ ] Prompt templates tested with sample dossiers
- [ ] Risk classification thresholds validated against HRDD Guide examples
- [ ] Citation format tested (inline [id] with tooltip URLs)
- [ ] Information gap flagging tested (missing sources shown correctly)
- [ ] Preliminary screening rejection tested (marked REJECTED but completes assessment)
- [ ] Overall risk calculation tested (highest of 3 factors)
- [ ] Report markdown structure validated (all sections present)
- [ ] Audit trail logging verified (queries and sources logged)
- [ ] Processing time measured (<1 hour target)
- [ ] Copy/paste functionality tested (markdown renders correctly in external docs)
