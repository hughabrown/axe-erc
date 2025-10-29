# HRDD Quick Reference Guide

## Form Fields (app/chat.tsx)
```
┌─────────────────────────────────────┐
│   Dossier Input Form                │
├─────────────────────────────────────┤
│ Customer Name: [TechCorp EU........] │
│ Use Case: [Describe intended use...] │
│ Deployment Country: [Germany......] │
│                                     │
│         [Start HRDD Assessment]     │
└─────────────────────────────────────┘
```

## Research Sections Overview

### Stage 1: Preliminary Screening (NOT Configurable - Compliance Required)
**3 Quick Checks - Text Analysis Only (no searches except sanctions/jurisdiction)**

```
┌─────────────────────────────────────────┐
│  1. Controversial Weapons Check         │
│  ├─ Input: Use case description         │
│  ├─ Categories: Nuclear, Cluster,       │
│  │             Autonomous weapons       │
│  └─ Method: LLM text analysis          │
├─────────────────────────────────────────┤
│  2. Sanctions Check                     │
│  ├─ Input: Customer + Country           │
│  ├─ Searches: OFAC, UN, EU lists        │
│  └─ Output: Sanctioned? (Y/N/?)         │
├─────────────────────────────────────────┤
│  3. High-Risk Jurisdiction Check        │
│  ├─ Input: Country                      │
│  ├─ Searches: UN bodies, ICC, Amnesty   │
│  └─ Output: Automatic high-risk? (Y/N/?)│
└─────────────────────────────────────────┘
(Assessment continues regardless of pass/fail)
```

### Stage 2: Enhanced Due Diligence (CONFIGURABLE - Main Assessment)
**3 Risk Factors - Each generates 10-20 queries**

```
┌──────────────────────────────────────────────┐
│ 4. Geographic Context Assessment             │
│ ├─ Input: Country                            │
│ ├─ Searches: ~15 sources                     │
│ │  └─ Freedom House, Press Freedom,          │
│ │     UN bodies, EU, NATO, OECD, etc.       │
│ ├─ Analysis:                                 │
│ │  └─ Freedom House scores, governance,      │
│ │     UN investigations, AI governance       │
│ └─ Output: Risk Level (Low/Medium/High)      │
├──────────────────────────────────────────────┤
│ 5. Customer Profile Assessment               │
│ ├─ Input: Customer name                      │
│ ├─ Searches: ~15 sources                     │
│ │  └─ OFAC, OpenCorporates, Amnesty,        │
│ │     HRW, SEC, Companies House, etc.       │
│ ├─ Analysis:                                 │
│ │  └─ Ethics policies, governance,           │
│ │     violations, ESG reporting              │
│ └─ Output: Risk Level (Low/Medium/High)      │
├──────────────────────────────────────────────┤
│ 6. End-Use Application Assessment            │
│ ├─ Input: Use case description               │
│ ├─ Searches: ~15 sources                     │
│ │  └─ EU AI Act, Killer Robots,             │
│ │     Wassenaar, ICRC, UN LAWS, etc.        │
│ ├─ Analysis:                                 │
│ │  └─ Human control, proximity to harm,      │
│ │     repurposing ease, dual-use             │
│ └─ Output: Risk Level (Low/Medium/High)      │
└──────────────────────────────────────────────┘
```

### Stage 3: Synthesis
```
┌──────────────────────────────────────────┐
│ 7. Final Report Generation               │
│ ├─ Overall Risk = MAX(Geo, Customer,     │
│ │                     EndUse) risk level  │
│ ├─ Format: Markdown with inline citations│
│ │          [1], [2], [3]...              │
│ └─ Output: PDF-ready report + sources    │
└──────────────────────────────────────────┘
```

## Workflow Graph (LangGraph)
```
START
  │
  ├─→ controversialWeapons (LLM text analysis)
  │      │
  │      └─→ sanctions (Firecrawl search)
  │              │
  │              └─→ jurisdiction (Firecrawl search)
  │                     │
  │                     └─→ geographicContext (Firecrawl + LLM analysis)
  │                            │
  │                            └─→ customerProfile (Firecrawl + LLM analysis)
  │                                   │
  │                                   └─→ endUse (Firecrawl + LLM analysis)
  │                                        │
  │                                        └─→ synthesize (LLM report generation)
  │                                              │
  └─────────────────────────────────────────────→ END
  
  Error path: Any node error → handleError → END
```

## Key Files Map

```
FORM INPUT LAYER
├─ app/chat.tsx (200-475)
│  └─ Dossier form rendering, state management
├─ app/search.tsx (35-66)
│  └─ hrddAssessment() Server Action
└─ app/search-display.tsx
   └─ Real-time progress visualization

WORKFLOW ORCHESTRATION
├─ lib/hrdd/hrdd-workflow-engine.ts
│  └─ HRDDWorkflowEngine class, graph builder
├─ lib/hrdd/hrdd-state.ts
│  └─ LangGraph state annotation + interfaces
└─ lib/hrdd/hrdd-config.ts
   └─ Constants, timeouts, thresholds

PROCESSING NODES
├─ lib/hrdd/hrdd-preliminary-screening.ts
│  ├─ controversialWeaponsCheck()
│  ├─ sanctionsCheck()
│  └─ highRiskJurisdictionCheck()
├─ lib/hrdd/hrdd-risk-factors.ts
│  ├─ geographicContextAssessment()
│  ├─ customerProfileAssessment()
│  └─ endUseAssessment()
└─ lib/hrdd/hrdd-synthesis.ts
   └─ synthesizeReport()

CONFIGURATION & PROMPTS
├─ lib/hrdd/hrdd-prompts.ts
│  ├─ CONTROVERSIAL_WEAPONS_PROMPT
│  ├─ SANCTIONS_CHECK_PROMPT
│  ├─ HIGH_RISK_JURISDICTION_PROMPT
│  ├─ GEOGRAPHIC_QUERY_GENERATION_PROMPT
│  ├─ CUSTOMER_QUERY_GENERATION_PROMPT
│  ├─ END_USE_QUERY_GENERATION_PROMPT
│  ├─ GEOGRAPHIC_RISK_PROMPT
│  ├─ CUSTOMER_RISK_PROMPT
│  ├─ END_USE_RISK_PROMPT
│  └─ FINAL_REPORT_GENERATION_PROMPT
└─ lib/hrdd/hrdd-sources.json
   ├─ geographic_context: 21 sources
   ├─ customer_profile: 20 sources
   └─ end_use_application: 20 sources
```

## Data Structures

### Input: Dossier
```typescript
interface Dossier {
  customer: string;        // Organization name
  useCase: string;         // Intended use description
  country: string;         // Deployment country
}
```

### Preliminary Screening Results
```typescript
interface PreliminaryScreening {
  weapons: WeaponsCheckResult | null;
  sanctions: SanctionsCheckResult | null;
  jurisdiction: JurisdictionCheckResult | null;
  outcome: "PASS" | "FAIL" | null;
}
```

### Risk Assessment Results
```typescript
interface GeographicRiskResult extends RiskFactorResult {
  level: "Low" | "Medium" | "High";
  rationale: string;
  citations: string[];      // URLs
  information_gaps: string[];
  confidence: number;        // 0.0-1.0
  // Geographic-specific fields:
  freedom_house_score: number | null;
  press_freedom_index_score: number | null;
  // ... more fields
}

// Similar for CustomerRiskResult and EndUseRiskResult
```

## Search Execution Pattern (Each Risk Factor)

```
FOR EACH Risk Factor (Geographic, Customer, EndUse):
  1. Generate Queries
     └─ LLM + prompt template + relevant sources config
        → 10-20 queries
  
  2. Execute Searches
     ├─ For each query:
     │  ├─ Firecrawl.search(query)
     │  ├─ Get URLs, titles, markdown content
     │  └─ Emit 'searching' + 'found' events
     └─ All searches in series (not parallel)
  
  3. Classify Risk
     ├─ Format search results for LLM
     ├─ LLM + risk prompt
     └─ Return: {level, rationale, citations, confidence}
```

## Event Emission Timeline

```
User submits form
  ↓
hrdd-phase: 'preliminary-screening'
  ↓
searching: (1/3) Controversial weapons check
  ↓
searching: (2/3) Sanctions check
  ↓
found: (sanctions results)
  ↓
searching: (3/3) Jurisdiction check
  ↓
found: (jurisdiction results)
  ↓
preliminary-result: { passed: true/false, details: {...} }
  ↓
hrdd-phase: 'geographic-context'
  ↓
searching: Geographic query 1/15
  ↓
found: (results)
  ↓
searching: Geographic query 2/15
  ↓
[... more searching/found events ...]
  ↓
risk-classification: { factor: 'Geographic Context', level: 'Low', ... }
  ↓
hrdd-phase: 'customer-profile'
  ↓
[... similar searching/found/risk-classification ...]
  ↓
hrdd-phase: 'end-use-application'
  ↓
[... similar searching/found/risk-classification ...]
  ↓
hrdd-phase: 'synthesis'
  ↓
content-chunk: (streamed report content)
  ↓
content-chunk: (more content)
  ↓
[... more chunks ...]
  ↓
final-result: { content: "...", sources: [...], rejected?: boolean }
  ↓
END
```

## Making Research Sections Configurable (TODO)

To add checkboxes for enabling/disabling the three risk factors:

1. **Form UI** (app/chat.tsx)
   - Add 3 checkboxes for geographic, customer, end-use
   - Default: all checked

2. **State** (lib/hrdd/hrdd-state.ts)
   - Extend Dossier: `selectedFactors: string[]`

3. **Workflow** (lib/hrdd/hrdd-workflow-engine.ts)
   - Conditionally add nodes based on selectedFactors
   - Use conditional edges to skip disabled factors

4. **Synthesis** (lib/hrdd/hrdd-synthesis.ts)
   - Handle missing risk assessment results
   - Only include sections for selected factors
   - Adjust overall risk calculation

5. **Prompts** (lib/hrdd/hrdd-prompts.ts)
   - Update FINAL_REPORT_GENERATION_PROMPT
   - Handle partial assessment scenarios

## Configuration Tuning Points

| Parameter | Location | Current | Purpose |
|-----------|----------|---------|---------|
| MAX_QUERIES_PER_FACTOR | hrdd-config.ts | 20 | Limit searches per assessment |
| MAX_SOURCES_PER_QUERY | hrdd-config.ts | 10 | Limit results per search |
| PROCESSING_TIMEOUT | hrdd-config.ts | 3600000ms | Overall assessment timeout |
| LLM_TIMEOUT | hrdd-config.ts | 60000ms | LLM call timeout |
| MODEL | hrdd-config.ts | gpt-4o | LLM choice |
| TEMPERATURE | hrdd-config.ts | 0 | Determinism (0 = deterministic) |

## Testing

- **Mock Mode**: Set `NEXT_PUBLIC_HRDD_TEST_MODE=true` in .env
  - Uses `lib/hrdd/hrdd-test-mode.ts`
  - Returns canned assessments without API calls

- **Test Files**: `lib/__tests__/hrdd/`
  - hrdd-config.test.ts
  - hrdd-preliminary.test.ts
  - hrdd-risk-factors.test.ts
  - hrdd-synthesis.test.ts
  - hrdd-state.test.ts
  - hrdd-acceptance.test.ts

