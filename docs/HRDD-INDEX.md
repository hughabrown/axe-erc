# HRDD Implementation Documentation Index

This directory contains comprehensive documentation of the HRDD (Human Rights Due Diligence) implementation in Firesearch. Use this index to navigate the available documentation.

## Quick Start

**New to HRDD?** Start here:
1. Read the [Quick Reference Guide](./HRDD-QUICK-REFERENCE.md) (5 min) for visual overviews
2. Read the [Full Architecture Guide](./HRDD-ARCHITECTURE.md) (15 min) for complete details
3. Explore the code files referenced in the guides

## Documentation Files

### HRDD-QUICK-REFERENCE.md (12 KB, 322 lines)
**Purpose:** Quick visual overview for rapid understanding

Contents:
- ASCII diagrams of form, research sections, and workflow graph
- Research sections overview (preliminary screening + 3 risk factors)
- Key files map organized by layer
- Data structures (TypeScript interfaces)
- Search execution pattern
- Event emission timeline
- Configuration tuning points
- TODO checklist for checkbox feature implementation

**Best for:** Getting oriented, visual learners, quick lookups

### HRDD-ARCHITECTURE.md (19 KB, 491 lines)
**Purpose:** Comprehensive technical reference

Contents:
1. Dossier Input Form - location, fields, flow
2. HRDD Workflow Orchestration - engine, phases, edges, state
3. Research Sections - preliminary checks & 3 risk factors detailed
4. Report Generation & Synthesis - process, structure, prompts
5. Complete Architecture Diagram - file structure, data flow
6. Configuration & Customization Points - what's hard-coded vs configurable
7. Current Workflow Execution Example - walkthrough with sample data
8. Key Files for Feature Development - what to modify for new features
9. API & Integration Points - Firecrawl, events, audit trail

**Best for:** Deep understanding, reference documentation, implementation details

---

## File Organization in Codebase

### Frontend/UI Layer
```
app/
├── chat.tsx                    # Dossier form (lines 200-475)
├── search.tsx                  # hrddAssessment() Server Action
├── search-display.tsx          # Progress visualization
├── markdown-renderer.tsx       # Markdown + citations
└── citation-tooltip.tsx        # Citation details
```

### Workflow Orchestration
```
lib/hrdd/
├── hrdd-workflow-engine.ts     # Main: HRDDWorkflowEngine class
├── hrdd-state.ts               # LangGraph State Annotation
└── hrdd-config.ts              # Constants & configuration
```

### Processing Nodes (3 Preliminary + 3 Risk Factors + Synthesis)
```
lib/hrdd/
├── hrdd-preliminary-screening.ts    # nodes: weapons, sanctions, jurisdiction
├── hrdd-risk-factors.ts             # nodes: geographic, customer, end-use
└── hrdd-synthesis.ts                # node: report generation
```

### Configuration & Prompts
```
lib/hrdd/
├── hrdd-prompts.ts                  # 11 prompt templates
├── hrdd-sources.json                # 61 authoritative sources
└── hrdd-test-mode.ts                # Mock assessment for testing
```

---

## Key Concepts

### Two-Stage Assessment
1. **Preliminary Screening** (3 compliance-required checks)
   - Weapons Check - text analysis only
   - Sanctions Check - searches databases
   - Jurisdiction Check - searches international bodies

2. **Enhanced Due Diligence** (3 configurable risk factors)
   - Geographic Context - 21 sources, 10-20 searches
   - Customer Profile - 20 sources, 10-20 searches
   - End-Use Application - 20 sources, 10-20 searches

3. **Synthesis** - Generates final markdown report

### Three Risk Factors Explained

**Geographic Context Assessment**
- What: Country risk assessment
- Input: Deployment country
- Sources: Freedom House, UN bodies, Amnesty, HRW, EU institutions
- Analysis: Governance, human rights, democracy scores
- Output: Low/Medium/High risk classification

**Customer Profile Assessment**
- What: Organization risk assessment
- Input: Customer organization name
- Sources: OFAC, OpenCorporates, HRW, SEC, Amnesty
- Analysis: Ethics policies, compliance violations, ESG reporting
- Output: Low/Medium/High risk classification

**End-Use Application Assessment**
- What: Use case risk assessment
- Input: Intended use description
- Sources: EU AI Act, Campaign to Stop Killer Robots, Wassenaar, ICRC, UN LAWS
- Analysis: Human control level, proximity to harm, dual-use potential
- Output: Low/Medium/High risk classification

### Overall Risk Calculation
```
Overall Risk = MAX(GeographicRisk, CustomerRisk, EndUseRisk)
```
If any factor is High → Overall is High
Else if any factor is Medium → Overall is Medium
Else → Overall is Low

---

## Feature Development Guide

### To Add the Checkbox Feature (Make Research Sections Configurable)

1. **UI Layer** (`app/chat.tsx`)
   - Add 3 checkboxes for each risk factor (geographic, customer, end-use)
   - Default: all checked
   - Wire to state: `selectedFactors: string[]`

2. **State** (`lib/hrdd/hrdd-state.ts`)
   - Extend Dossier interface:
     ```typescript
     interface Dossier {
       customer: string;
       useCase: string;
       country: string;
       selectedFactors?: string[];  // ['geographic', 'customer', 'end-use']
     }
     ```

3. **Workflow** (`lib/hrdd/hrdd-workflow-engine.ts`)
   - In `buildGraph()`, conditionally add nodes:
     ```typescript
     if (selectedFactors.includes('geographic')) {
       workflow.addNode('geographicContext', ...);
     }
     ```
   - Use conditional edges to skip disabled nodes

4. **Synthesis** (`lib/hrdd/hrdd-synthesis.ts`)
   - Handle missing risk results:
     ```typescript
     const geographicRiskData = state.geographicRisk 
       ? JSON.stringify(state.geographicRisk) 
       : "Not assessed (user selection)";
     ```
   - Adjust overall risk calculation for missing factors

5. **Prompts** (`lib/hrdd/hrdd-prompts.ts`)
   - Update `FINAL_REPORT_GENERATION_PROMPT`
   - Include logic for partial assessments
   - Generate appropriate report sections based on selections

6. **Testing**
   - Add test cases for partial assessments
   - Verify audit trail captures selections
   - Test overall risk calculation with missing factors

---

## Current Configuration

### Model Settings
- Model: GPT-4o
- Temperature: 0 (deterministic outputs for compliance)
- Max tokens: 4096

### Search Configuration
- Max queries per factor: 20
- Max sources per query: 10
- Max retries: 3
- Processing timeout: 1 hour
- Search timeout: 30 seconds
- LLM timeout: 60 seconds

### Risk Classification
- Freedom House Low: >70
- Freedom House High: <40
- Press Freedom Low: >60
- Press Freedom High: <30
- Violation recency (recent): <3 years

---

## Event Types Emitted

The workflow emits typed events to the frontend for real-time UI updates:

| Event Type | Emitted By | Payload |
|------------|-----------|---------|
| hrdd-phase | All nodes | phase, message |
| preliminary-result | Preliminary screening | passed, details |
| risk-classification | Risk factor nodes | factor, level, rationale |
| searching | Risk factor nodes | query, index, total |
| found | Risk factor nodes | sources, query |
| source-processing | Risk factor nodes | url, title, stage |
| source-complete | Risk factor nodes | url, summary |
| content-chunk | Synthesis node | chunk (streamed content) |
| final-result | Synthesis node | content, sources, metadata |
| error | Any node | error message, type |

---

## API Integration Points

### Firecrawl (`lib/core/firecrawl.ts`)
- `search(query, options)` - Called 30-60 times per assessment (10-20 per factor)
- Returns: URLs, titles, markdown content
- Format: { data: [{ url, title, markdown, ... }] }

### OpenAI (`lib/hrdd/hrdd-*`)
- GPT-4o for query generation (3+ calls)
- GPT-4o for risk classification (3 calls)
- GPT-4o for report synthesis (1 call, streamed)
- Total: 7+ API calls per assessment

### Audit Trail (`lib/export/audit-trail-export.ts`)
- Exports complete state after assessment
- Captures all events, queries, decisions
- Stored in-memory and optionally to file
- Downloadable as JSON from UI

---

## Testing & Mock Mode

### Run in Test Mode
```bash
NEXT_PUBLIC_HRDD_TEST_MODE=true npm run dev
```
- Uses mock data from `lib/hrdd/hrdd-test-mode.ts`
- No API calls to Firecrawl or OpenAI
- Instant assessment results

### Test Files
```
lib/__tests__/hrdd/
├── hrdd-config.test.ts
├── hrdd-state.test.ts
├── hrdd-preliminary.test.ts
├── hrdd-risk-factors.test.ts
├── hrdd-synthesis.test.ts
└── hrdd-acceptance.test.ts
```

---

## Common Questions

**Q: Why always execute preliminary screening?**
A: EU HRDD Guide and compliance requirements mandate these checks. Assessment continues regardless of outcome to provide complete due diligence.

**Q: Why are searches sequential, not parallel?**
A: Each risk factor's searches are sequential per implementation. This allows for adaptive query generation based on earlier results if needed.

**Q: How many API calls does an assessment make?**
A: Approximately 37-67 Firecrawl searches (10-20 per factor, 3 factors) + 7 OpenAI calls (query generation, analysis, synthesis).

**Q: Can I customize the sources?**
A: Yes, edit `lib/hrdd/hrdd-sources.json` directly. Add/remove/reorder sources per category.

**Q: Can I change the prompts?**
A: Yes, all prompts are in `lib/hrdd/hrdd-prompts.ts`. Modify template strings to change analysis approach.

**Q: How long does an assessment take?**
A: Typically 5-15 minutes depending on search result quality. Timeout is set to 1 hour max.

---

## Contributing

When modifying HRDD implementation:

1. Update relevant `.ts` and `.json` files
2. Add tests if changing logic
3. Update these documentation files
4. Run `npm run test` to verify
5. Test in mock mode first: `NEXT_PUBLIC_HRDD_TEST_MODE=true npm run dev`

---

## Document Metadata

| File | Lines | Size | Last Updated |
|------|-------|------|--------------|
| HRDD-INDEX.md | This file | ~300 | 2025-10-24 |
| HRDD-QUICK-REFERENCE.md | 322 | 12 KB | 2025-10-24 |
| HRDD-ARCHITECTURE.md | 491 | 19 KB | 2025-10-24 |

Total documentation: ~1100 lines covering complete HRDD system

---

Generated: 2025-10-24
For questions or updates, see the code files and git history.
