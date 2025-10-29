# HRDD (Human Rights Due Diligence) Implementation - Architecture Summary

## Overview

The HRDD system is a two-stage AI-powered assessment workflow that evaluates AI technology deployment for human rights risks. It combines preliminary screening (quick disqualification checks) with enhanced due diligence (detailed risk assessments) across three risk factors.

---

## 1. DOSSIER INPUT FORM

### Location
**File:** `/home/hughbrown/code/firecrawl/firesearch/app/chat.tsx` (lines 200-475)

### Form Fields (3 required inputs)
The form collects three key pieces of information from the user:

1. **Customer Name** (text input)
   - State variable: `customer`
   - Placeholder: "e.g., TechCorp EU"
   - Purpose: Identifies the organization deploying the AI system

2. **Use Case Description** (textarea)
   - State variable: `useCase`
   - Placeholder: "Describe the intended use of the AI system..."
   - Min height: 32 lines
   - Purpose: Detailed description of how the AI will be used (critical for weapons check)

3. **Deployment Country** (text input)
   - State variable: `country`
   - Placeholder: "e.g., Germany"
   - Purpose: Identifies jurisdiction for geographic and sanctions checks

### Form Structure
```typescript
interface Dossier {
  customer: string;
  useCase: string;
  country: string;
}
```

### Form Flow
1. User fills all three fields
2. Submit button enabled when all fields have non-empty values
3. Triggers `handleSubmit()` → `performAssessment(dossier)`
4. Assessment starts via Server Action: `hrddAssessment(dossier, apiKey)`

---

## 2. HRDD WORKFLOW ORCHESTRATION

### Workflow Engine
**File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd/hrdd-workflow-engine.ts`

### Class: `HRDDWorkflowEngine`
- Manages LangGraph state machine
- Orchestrates 7 workflow nodes
- Compiles graph on instantiation
- Main method: `runAssessment(dossier, onEvent)` - executes complete assessment

### Workflow Phases (In Execution Order)

#### Stage 1: Preliminary Screening (Quick Checks)
Executes first; can reject applications early:

1. **controversialWeapons** Node
   - Checks if use case involves prohibited weapons
   - Categories: nuclear/chemical/biological, cluster munitions, autonomous weapons
   - Uses text analysis (no searches)

2. **sanctions** Node
   - Checks if customer/country sanctioned
   - Interprets OFAC, UN, EU sanctions lists
   - Note: Preliminary check; detailed analysis in Geographic & Customer phases

3. **jurisdiction** Node
   - Checks if country has UN accusations or ICC cases
   - Looks for "serious and systematic" violations
   - Note: Assessment continues regardless of pass/fail (spec requirement)

#### Stage 2: Enhanced Due Diligence (Detailed Assessments)
Executes sequentially; always runs:

4. **geographicContext** Node
   - Assesses deployment country risk
   - Analyzes: Freedom House scores, press freedom, governance, UN investigations
   - Generates 10-20 search queries across authoritative sources
   - Risk levels: Low, Medium, High

5. **customerProfile** Node
   - Assesses deploying organization risk
   - Analyzes: ethics policies, governance, compliance violations, media findings
   - Searches for corporate human rights issues, sanctions violations, ESG reporting
   - Risk levels: Low, Medium, High

6. **endUse** Node
   - Assesses use case application risk
   - Analyzes: human control degree, proximity to harm, repurposing ease
   - Checks dual-use classification and autonomous weapons comparison
   - Risk levels: Low, Medium, High

#### Stage 3: Synthesis

7. **synthesize** Node
   - Generates final markdown report
   - Streams content in chunks
   - Includes citations [1], [2], etc.
   - Overall risk = highest of three factors

### Workflow Edges (Graph Flow)
```
START → controversialWeapons → sanctions → jurisdiction 
        → geographicContext → customerProfile → endUse 
        → synthesize → END

Error Handler: Any node error → handleError node → END
(Note: Errors don't stop flow; assessment continues)
```

### State Annotation
**File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd/hrdd-state.ts`

Uses LangGraph Annotation with type-safe reducers:
```typescript
export const HRDDStateAnnotation = Annotation.Root({
  dossier: Dossier,
  preliminaryScreening: PreliminaryScreening,
  geographicRisk: GeographicRiskResult | null,
  customerRisk: CustomerRiskResult | null,
  endUseRisk: EndUseRiskResult | null,
  sources: Source[],      // Deduplicated by URL
  queries: string[],      // All executed queries
  finalReport: string | null,
  overallRisk: "Low" | "Medium" | "High" | null,
  auditTrail: AuditEntry[],
  rejected: boolean,
  currentPhase: string,
  error: string | null,
  errorType: "search" | "llm" | "unknown" | null
});
```

---

## 3. RESEARCH SECTIONS (PRELIMINARY CHECKS & THREE RISK FACTORS)

### Preliminary Screening (Not Configurable - Required for Compliance)
**File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd/hrdd-preliminary-screening.ts`

Hard-coded three checks (EU/HRDD Guide requirement):

1. **Controversial Weapons Check**
   - Prompt: `/lib/hrdd/hrdd-prompts.ts` - `CONTROVERSIAL_WEAPONS_PROMPT`
   - Analyzes: Nuclear/chemical/biological, cluster munitions, autonomous weapons
   - Data: Only use case description (text analysis, no web search)
   - Output: `WeaponsCheckResult` with confidence scores per category

2. **Sanctions Check**
   - Prompt: `SANCTIONS_CHECK_PROMPT`
   - Searches: OFAC, UN, EU sanctions databases
   - Analyzes: Customer name + country sanctions status
   - Output: `SanctionsCheckResult` with programs and rationale

3. **High-Risk Jurisdiction Check**
   - Prompt: `HIGH_RISK_JURISDICTION_PROMPT`
   - Searches: UN Human Rights Council, ICC, ICJ, Amnesty, HRW
   - Analyzes: Automatic high-risk criteria per HRDD Guide
   - Output: `JurisdictionCheckResult` with accusations and cases

### Three Risk Factors (Main Assessment - Configurable)
**File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd/hrdd-risk-factors.ts`

Three independent assessment nodes:

1. **Geographic Context Assessment**
   - Location: Node "geographicContext" in workflow
   - Input: Country from dossier
   - Search Phase:
     - Generates 10-20 queries using `GEOGRAPHIC_QUERY_GENERATION_PROMPT`
     - Executes Firecrawl searches in series
     - Uses sources from `hrdd-sources.json` (geographic_context)
   - Analysis Phase:
     - Uses `GEOGRAPHIC_RISK_PROMPT` to classify findings
     - Extracts: Freedom House scores, press freedom index, governance assessment
   - Output: `GeographicRiskResult` with level (Low/Medium/High), citations, confidence
   - Sources: 21 sources including Freedom House, Amnesty, UN bodies, national govts

2. **Customer Profile Assessment**
   - Location: Node "customerProfile" in workflow
   - Input: Customer name from dossier
   - Search Phase:
     - Generates 10-20 queries using `CUSTOMER_QUERY_GENERATION_PROMPT`
     - Executes Firecrawl searches
     - Uses sources from `hrdd-sources.json` (customer_profile)
   - Analysis Phase:
     - Uses `CUSTOMER_RISK_PROMPT` for classification
     - Extracts: Ethics policies, governance, violations, adverse media
   - Output: `CustomerRiskResult` with corporate governance, compliance violations, ESG reporting
   - Sources: 20 sources including OFAC, OpenCorporates, Amnesty, HRW, SEC

3. **End-Use Application Assessment**
   - Location: Node "endUse" in workflow
   - Input: Use case description from dossier
   - Search Phase:
     - Generates 10-20 queries using `END_USE_QUERY_GENERATION_PROMPT`
     - Executes Firecrawl searches
     - Uses sources from `hrdd-sources.json` (end_use_application)
   - Analysis Phase:
     - Uses `END_USE_RISK_PROMPT` for classification
     - Analyzes: Human control degree, proximity to harm, repurposing ease
   - Output: `EndUseRiskResult` with autonomous weapons comparison, dual-use classification
   - Sources: 20 sources including EU AI Act, Campaign to Stop Killer Robots, UN LAWS

### Summary: Currently Hard-Coded Sections
Both preliminary checks and three risk factors are hard-coded in the workflow graph:
- Cannot be skipped
- Cannot be reordered
- Always execute sequentially as designed

---

## 4. REPORT GENERATION & SYNTHESIS

### Synthesis Node
**File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd/hrdd-synthesis.ts`

#### Function: `synthesizeReport(state, config)`

### Process Flow

1. **Calculate Overall Risk**
   - Logic: Highest of three risk factors (geographicRisk, customerRisk, endUseRisk)
   - Risk hierarchy: High > Medium > Low

2. **Prepare Input Data**
   - Converts all state data to JSON strings for prompt injection
   - Includes: preliminary screening results, all three risk assessments, source list
   - Deduplicates sources by URL
   - Creates numbered citation list: {id, title, url}

3. **Generate Report**
   - Uses `FINAL_REPORT_GENERATION_PROMPT` template
   - Injects: customer, useCase, country, all assessment results, sources
   - Model: GPT-4o with streaming enabled
   - Temperature: 0 (deterministic)

4. **Stream Report Content**
   - LLM streams response in chunks
   - Each chunk emitted as `content-chunk` event
   - Frontend accumulates chunks for real-time display

5. **Output Events**
   - `content-chunk` - Streamed report content
   - `final-result` - Complete report + sources + metadata
   - Includes rejection status, missing sources, assessment ID

### Report Structure (Markdown Format)
- Executive summary with overall risk assessment
- Preliminary screening results (brief)
- Three risk factor sections:
  - Geographic Context Risk
  - Customer Profile Risk
  - End-Use Application Risk
- Each section includes:
  - Risk level classification
  - Detailed rationale
  - Key findings with citations [1], [2], etc.
  - Information gaps identified
  - Confidence scores
- Sources section with numbered list

### Report Template Location
**File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd/hrdd-prompts.ts`

Template: `FINAL_REPORT_GENERATION_PROMPT` (includes instructions for formatting and citations)

---

## 5. COMPLETE ARCHITECTURE DIAGRAM

### File Structure
```
app/
├── chat.tsx                          # UI: Dossier form + assessment display
├── search.tsx                        # Server Action: hrddAssessment()
├── search-display.tsx                # UI: Real-time progress visualization
├── markdown-renderer.tsx             # UI: Markdown with citations
└── citation-tooltip.tsx              # UI: Citation hover details

lib/hrdd/
├── hrdd-config.ts                    # Constants: phases, timeouts, thresholds
├── hrdd-state.ts                     # LangGraph State Annotation + interfaces
├── hrdd-workflow-engine.ts           # Main: LangGraph graph builder + runner
├── hrdd-preliminary-screening.ts     # Nodes: weapons, sanctions, jurisdiction
├── hrdd-risk-factors.ts              # Nodes: geographic, customer, end-use
├── hrdd-synthesis.ts                 # Node: report generation
├── hrdd-prompts.ts                   # All prompt templates
├── hrdd-sources.json                 # Authoritative source definitions
└── hrdd-test-mode.ts                 # Mock assessment for testing

lib/core/
├── firecrawl.ts                      # Firecrawl API client
└── langgraph-search-engine.ts        # Standard search (not used for HRDD)

lib/export/
└── audit-trail-export.ts             # Audit trail generation & storage
```

### Data Flow: User Input → Final Report

```
1. User submits dossier form (chat.tsx)
   ↓
2. Server Action called: hrddAssessment(dossier) (search.tsx)
   ↓
3. HRDDWorkflowEngine instantiated with FirecrawlClient
   ↓
4. LangGraph invokes state machine (.invoke with initial state)
   ↓
5. NODE: controversialWeapons
   ├─ LLM analyzes use case (no search)
   └─ Returns WeaponsCheckResult
   ↓
6. NODE: sanctions
   ├─ Searches OFAC, UN, EU databases (Firecrawl)
   └─ Returns SanctionsCheckResult
   ↓
7. NODE: jurisdiction
   ├─ Searches UN bodies, ICC, Amnesty, HRW
   └─ Returns JurisdictionCheckResult
   ↓
8. NODE: geographicContext (CONFIGURABLE)
   ├─ LLM generates 10-20 geographic search queries
   ├─ Executes Firecrawl searches in series
   ├─ LLM analyzes results with geographic risk prompt
   └─ Returns GeographicRiskResult
   ↓
9. NODE: customerProfile (CONFIGURABLE)
   ├─ LLM generates 10-20 customer search queries
   ├─ Executes Firecrawl searches in series
   ├─ LLM analyzes results with customer risk prompt
   └─ Returns CustomerRiskResult
   ↓
10. NODE: endUse (CONFIGURABLE)
    ├─ LLM generates 10-20 end-use search queries
    ├─ Executes Firecrawl searches in series
    ├─ LLM analyzes results with end-use risk prompt
    └─ Returns EndUseRiskResult
    ↓
11. NODE: synthesize
    ├─ Calculate overall risk (highest of 3 factors)
    ├─ Prepare all data for final report prompt
    ├─ Stream GPT-4o response in chunks
    ├─ Emit content-chunk events (for real-time UI)
    └─ Emit final-result event (complete report + sources)
    ↓
12. Event stream sent to frontend via createStreamableValue
    ↓
13. Chat component accumulates events and updates SearchDisplay
    ↓
14. Final report rendered with markdown + citations + sources
```

---

## 6. CONFIGURATION & CUSTOMIZATION POINTS

### Current Hard-Coded Elements
1. **Preliminary screening** - Always 3 checks (compliance requirement)
2. **Three risk factors** - Always geographic + customer + end-use
3. **Workflow sequence** - Always preliminary → 3 factors → synthesis
4. **Phases** - Hard-coded in `HRDD_WORKFLOW_CONFIG.PHASES`

### Configurable Elements
1. **Source lists** - `hrdd-sources.json` (21 geographic, 20 customer, 20 end-use)
2. **Prompts** - All in `hrdd-prompts.ts` (query generation, analysis, report)
3. **Thresholds** - Risk classifications in `hrdd-config.ts`
4. **Search parameters** - Query count, timeout, retry limits in `HRDD_WORKFLOW_CONFIG`
5. **Model settings** - Model choice, temperature in `HRDD_MODEL_CONFIG`

### To Make Research Sections Configurable (Checkbox Feature)
Would need to:
1. Add `selectedFactors` to dossier/config
2. Modify workflow graph to conditionally add nodes
3. Skip synthesis of missing factors in report
4. Update state to support partial assessments
5. Modify UI form to include 3 checkboxes for factors

---

## 7. CURRENT WORKFLOW EXECUTION EXAMPLE

### Example: Assessing ACME Corp in Sweden for civilian AI

**Input Dossier:**
```json
{
  "customer": "ACME Corp",
  "useCase": "Civilian computer vision system for traffic management",
  "country": "Sweden"
}
```

**Execution Flow:**

1. **Preliminary Screening**
   - Weapons Check: ✓ PASS (traffic management, no weapons involvement)
   - Sanctions Check: ✓ PASS (Sweden not sanctioned, ACME Corp not on lists)
   - Jurisdiction Check: ✓ PASS (Sweden has strong democracy, no UN accusations)

2. **Geographic Context**
   - Generates queries about Sweden's governance, freedom scores, UN status
   - Searches ~15 authoritative sources
   - Finds: Freedom House score 92/100 (Free), strong democracy, NATO member
   - Result: **Low Risk**

3. **Customer Profile**
   - Generates queries about ACME Corp's ethics, compliance, governance
   - Searches corporate registries, news archives, human rights databases
   - Finds: Strong ESG policies, no violations, transparent ownership
   - Result: **Low Risk**

4. **End-Use Application**
   - Generates queries about civilian AI governance, human control, traffic systems
   - Searches EU AI regulations, standards bodies, safety frameworks
   - Finds: System includes human oversight, not autonomous weapons, civilian dual-use
   - Result: **Low Risk**

5. **Synthesis**
   - Overall Risk: **Low** (highest of 3 factors = Low)
   - Generates comprehensive markdown report
   - Includes 30-50 citations from authoritative sources
   - User downloads report with audit trail

---

## 8. KEY FILES FOR FEATURE DEVELOPMENT

### For Checkbox Configurability Feature:
- `/home/hughbrown/code/firecrawl/firesearch/app/chat.tsx` - Add checkboxes to form
- `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd/hrdd-state.ts` - Extend Dossier interface
- `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd/hrdd-workflow-engine.ts` - Conditional node building
- `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd/hrdd-synthesis.ts` - Handle missing factors
- `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd/hrdd-prompts.ts` - Adapt report generation

### For Understanding Current Implementation:
- `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd/hrdd-config.ts` - Phase names, event types
- `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd/hrdd-sources.json` - Source definitions
- `/home/hughbrown/code/firecrawl/firesearch/app/search-display.tsx` - Progress visualization

---

## 9. API & INTEGRATION POINTS

### Firecrawl Integration
**File:** `/home/hughbrown/code/firecrawl/firesearch/lib/core/firecrawl.ts`

Methods used by HRDD:
- `search(query, options)` - Executes search, returns markdown content + metadata
- Result structure: `{ data: [{ url, title, markdown, content, ... }] }`
- Called by each risk factor node with 10-20 queries per factor

### Event Callback System
Each node receives `config?.configurable?.eventCallback` to emit progress:
- `hrdd-phase` - Phase transition
- `searching` - Query execution progress
- `found` - Search results discovered
- `risk-classification` - Risk level determined
- `content-chunk` - Report content streamed
- `final-result` - Complete report ready
- `error` - Any errors encountered

### Audit Trail
**File:** `/home/hughbrown/code/firecrawl/firesearch/lib/export/audit-trail-export.ts`
- Exports all events + state to JSON
- Stored in-memory and optionally to file
- Downloadable from UI after assessment completes

---

## Summary

The HRDD system is a sophisticated LangGraph-based workflow that:
1. **Collects** 3-field dossier input (customer, use case, country)
2. **Screens** with 3 mandatory preliminary checks
3. **Assesses** 3 configurable risk factors (geographic, customer, end-use)
4. **Synthesizes** findings into a cited markdown report
5. **Tracks** every decision in audit trail for compliance

The system is designed for **regulatory compliance** with hard-coded preliminary screening but provides flexibility in research sources, prompts, and report generation for the three main risk factors.

