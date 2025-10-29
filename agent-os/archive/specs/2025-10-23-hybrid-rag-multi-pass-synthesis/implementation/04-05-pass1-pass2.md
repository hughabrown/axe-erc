# Task Groups 4-5: Pass 1 and Pass 2 Implementation

## Overview
**Task Reference:** Task Groups #4-5 from `agent-os/specs/2025-10-23-hybrid-rag-multi-pass-synthesis/tasks.md`
**Implemented By:** api-engineer
**Date:** 2025-10-23
**Status:** ✅ Complete

### Task Description
Implemented the first two passes of the multi-pass synthesis pipeline:
- **Pass 1 (Overview)**: Generates structured outline from source summaries using GPT-4o-mini
- **Pass 2 (Deep Dive)**: Extracts detailed findings from full source content using GPT-4o

These passes form the foundation of the hybrid RAG architecture, enabling the system to first understand themes across all sources (Pass 1) and then dive deep into relevant content for detailed analysis (Pass 2).

## Implementation Summary

Pass 1 and Pass 2 represent the core transition from summary-based overview to full-content deep dive analysis. The implementation follows a two-stage approach:

**Pass 1** analyzes all source summaries (up to 466 sources) to identify 5-8 major themes, creating a structured outline with relevance-scored source mappings. This uses GPT-4o-mini for cost efficiency while processing large volumes of summary data.

**Pass 2** takes the outline from Pass 1 and retrieves full content from the ContentStore for the top 50 most relevant sources per section. It extracts 10-20 specific findings with citations, evidence, and confidence scores using GPT-4o for high-quality analysis.

The key innovation is the selective content retrieval pattern: Pass 1 sees everything at summary level (breadth), while Pass 2 sees selected sources in full detail (depth). This optimizes token usage while maximizing information utilization.

## Files Changed/Created

### New Files
- `/home/hughbrown/code/firecrawl/firesearch/lib/multi-pass-synthesis.ts` - Core multi-pass synthesis engine with Pass 1 and Pass 2 implementation (440+ lines)
- `/home/hughbrown/code/firecrawl/firesearch/lib/__tests__/multi-pass-synthesis-pass1.test.ts` - Pass 1 focused tests (4 tests covering outline generation)
- `/home/hughbrown/code/firecrawl/firesearch/lib/__tests__/multi-pass-synthesis-pass2.test.ts` - Pass 2 focused tests (5 tests covering deep dive extraction)

### Modified Files
- `/home/hughbrown/code/firecrawl/firesearch/lib/langgraph-search-engine.ts` - Added multi-pass imports, event types, MultiPassState interface, and state annotation fields

## Key Implementation Details

### Pass 1: Overview Generation
**Location:** `/home/hughbrown/code/firecrawl/firesearch/lib/multi-pass-synthesis.ts` (lines 82-162)

**Implementation:**
The `generateOutline()` function concatenates all source summaries and sends them to GPT-4o-mini with a structured prompt requesting 5-8 major themes. The LLM analyzes patterns across sources and returns a JSON outline with:
- Section ID, title, and description
- Relevant sources mapped with relevance scores (0.0-1.0)
- Optional subsections for complex themes
- Overall theme statement

**Key Features:**
- Uses cost-effective GPT-4o-mini model (SYNTHESIS_CONFIG.OVERVIEW_MODEL)
- Handles up to 400k characters of summary content
- Robust JSON parsing with markdown code block extraction
- Fallback outline generation on parsing errors
- Preserves conversation context for follow-up queries

**Rationale:** Pass 1 provides the structural framework for Pass 2. By identifying themes first, we can intelligently select which sources deserve deep analysis for each section, optimizing token usage and analysis quality.

### Pass 2: Deep Dive Analysis
**Location:** `/home/hughbrown/code/firecrawl/firesearch/lib/multi-pass-synthesis.ts` (lines 164-310)

**Implementation:**
The `processSection()` function takes a section from the Pass 1 outline and:
1. Selects top N sources by relevance score (configurable, default 50)
2. Retrieves full content from ContentStore via `retrieveBatch()`
3. Truncates each source to MAX_CHARS_PER_SOURCE (30k chars)
4. Constructs prompt with full content and section context
5. Calls GPT-4o to extract 10-20 findings with citations and evidence
6. Parses JSON response into SectionFindings structure

**Key Features:**
- Uses high-quality GPT-4o model for detailed analysis
- Dynamic source selection per section (not global top-N)
- Graceful fallback to summaries if full content unavailable
- Tracks which sources were actually used
- Token limit protection (stops at 80% of MAX_TOTAL_CHARS)

**Rationale:** Pass 2 maximizes information extraction from the most relevant sources for each section. The per-section source selection ensures diverse coverage across the outline, rather than overusing a few globally high-scoring sources.

### State Management Integration
**Location:** `/home/hughbrown/code/firecrawl/firesearch/lib/langgraph-search-engine.ts` (lines 8-9, 31-35, 62-68, 175-178)

**Changes:**
1. Added imports for multi-pass synthesis types
2. Extended SearchEvent union with 5 new event types for multi-pass tracking
3. Created MultiPassState interface to hold outline, findings, validation results
4. Added multiPassState field to SearchStateAnnotation with null default

**Integration Pattern:**
- Uses LangGraph's `Annotation` pattern with reducers
- Last-write-wins reducer for multiPassState (simple replacement)
- Maintains backward compatibility with existing state fields
- Enables streaming progress updates to frontend

**Rationale:** The state extension follows existing LangGraph patterns, ensuring clean integration without disrupting the current workflow. The multiPassState field acts as a container for all synthesis-specific data.

### Helper Functions
**Location:** `/home/hughbrown/code/firecrawl/firesearch/lib/multi-pass-synthesis.ts` (lines 312-340)

**Implementation:**
Added `selectTopSourcesPerSection()` helper that maps outline sections to their top-N sources. This function:
- Filters sources relevant to each section
- Sorts by relevance score from Pass 1 outline
- Selects top N (default 50) per section
- Returns Map<sectionId, Source[]>

**Rationale:** This helper enables Pass 2 orchestration (to be implemented in Task Group 6) to efficiently process all sections in parallel or sequence, with proper source selection per section.

## Database Changes
No database changes. All state managed in-memory via LangGraph state machine.

## Dependencies
No new dependencies added. Uses existing:
- `@langchain/openai` - ChatOpenAI for LLM calls
- `@langchain/core/messages` - SystemMessage, HumanMessage for prompts

## Testing

### Test Files Created/Updated
- `/home/hughbrown/code/firecrawl/firesearch/lib/__tests__/multi-pass-synthesis-pass1.test.ts` - 4 focused tests for Pass 1
- `/home/hughbrown/code/firecrawl/firesearch/lib/__tests__/multi-pass-synthesis-pass2.test.ts` - 5 focused tests for Pass 2

### Test Coverage
- **Unit tests:** ✅ Complete (9 tests total)
- **Integration tests:** ⚠️ Partial (end-to-end testing in Task Group 10)
- **Edge cases covered:**
  - Empty sources handling (Pass 1)
  - Missing content fallback (Pass 2)
  - Relevance score validation (both passes)
  - Source selection limits (Pass 2)

### Manual Testing Performed
All tests executed successfully with mocked LLM responses:

```bash
# Pass 1 Tests
npm test -- lib/__tests__/multi-pass-synthesis-pass1.test.ts
✓ should generate outline with multiple sections
✓ outline sections should have required structure
✓ should map sources to sections with relevance scores
✓ should handle empty sources gracefully
Test Suites: 1 passed, Tests: 4 passed

# Pass 2 Tests
npm test -- lib/__tests__/multi-pass-synthesis-pass2.test.ts
✓ should retrieve full content from ContentStore
✓ should extract findings with citations
✓ should assign confidence scores in valid range
✓ should select top N sources by relevance
✓ should track which sources were actually used
Test Suites: 1 passed, Tests: 5 passed
```

**Test Approach:**
- Mocked ChatOpenAI to avoid API calls and ensure deterministic test results
- Used realistic mock data structures matching production patterns
- Focused on critical functionality rather than exhaustive edge cases
- Fast execution (<1s per test suite)

## User Standards & Preferences Compliance

### Backend API Standards (`agent-os/standards/backend/api.md`)
**How Implementation Complies:**
- Pass 1 and Pass 2 are pure backend functions with clear input/output contracts
- Both functions handle errors gracefully with try-catch blocks and fallback responses
- Used async/await patterns for LLM calls
- No API routes created (integration happens in Task Group 8)

**Deviations:** None

### Global Coding Style (`agent-os/standards/global/coding-style.md`)
**How Implementation Complies:**
- All functions have JSDoc comments describing parameters and return types
- TypeScript interfaces defined for all data structures (OutlineStructure, SectionFindings, Finding, etc.)
- Clear, descriptive function names (generateOutline, processSection, selectTopSourcesPerSection)
- Consistent indentation and formatting

**Deviations:** None

### Global Error Handling (`agent-os/standards/global/error-handling.md`)
**How Implementation Complies:**
- Both Pass 1 and Pass 2 use try-catch blocks around LLM calls
- Fallback behavior on errors: Pass 1 returns default outline, Pass 2 returns empty findings
- Error logging to console for debugging
- Graceful degradation: missing full content falls back to summaries

**Deviations:** None

### Test Writing Standards (`agent-os/standards/testing/test-writing.md`)
**How Implementation Complies:**
- Wrote 2-6 focused tests per task group (4 for Pass 1, 5 for Pass 2)
- Used descriptive test names explaining what is being tested
- Mocked external dependencies (ChatOpenAI) to avoid flaky API calls
- Fast execution with no integration dependencies
- Clear arrange-act-assert structure in each test

**Deviations:** None

### Global Conventions (`agent-os/standards/global/conventions.md`)
**How Implementation Complies:**
- Used existing config patterns (SYNTHESIS_CONFIG from `/lib/config.ts`)
- Followed LangGraph state annotation patterns for multiPassState
- Maintained consistent import organization
- Environment variable usage (process.env.OPENAI_API_KEY) follows existing patterns

**Deviations:** None

## Integration Points

### Internal Dependencies
- **Depends on ContentStore** (Task Group 2): Pass 2 retrieves full content via `contentStore.retrieveBatch()`
- **Depends on SYNTHESIS_CONFIG** (Task Group 1): Both passes use config for model selection, limits, and thresholds
- **Provides data for Pass 3** (Task Group 6): Pass 2 findings will be validated in Pass 3
- **Integrates with LangGraph state**: multiPassState field stores outline and findings for downstream nodes

### Future Integration (Task Group 8)
The multiPassSynthesize node will orchestrate:
1. Call generateOutline() for Pass 1
2. Loop through outline.sections calling processSection() for Pass 2
3. Pass findings to Pass 3 validation (Task Group 6)
4. Pass validated findings to Pass 4 final report (Task Group 6)

## Known Issues & Limitations

### Issues
None identified. All tests pass.

### Limitations
1. **LLM JSON Parsing Dependency**
   - Description: Both passes rely on LLM returning valid JSON
   - Impact: If LLM returns malformed JSON, passes use fallback responses
   - Workaround: Implemented markdown code block extraction and fallback outline/findings
   - Future Consideration: Add JSON schema validation and repair logic

2. **Token Limit Handling**
   - Description: Pass 2 truncates sources at MAX_CHARS_PER_SOURCE (30k chars)
   - Impact: Very long sources may lose relevant information
   - Reason: GPT-4o 128k token limit requires constraints
   - Future Consideration: Implement smart chunking or multi-pass source processing

3. **No Parallel Section Processing**
   - Description: Pass 2 processes one section at a time (in processSection function)
   - Impact: Could be slower for outlines with many sections
   - Reason: Task Group 8 will handle orchestration and parallelization
   - Future Consideration: Batch LLM calls or parallel section processing

## Performance Considerations
- **Pass 1 Performance:** Single LLM call with all summaries (~400k chars max). Estimated time: 10-30 seconds.
- **Pass 2 Performance:** One LLM call per section. For 6 sections, estimated time: 60-180 seconds (depends on GPT-4o latency).
- **Token Usage:** Pass 1 uses ~100k tokens (input). Pass 2 uses ~30-50k tokens per section.
- **Optimization Opportunity:** Pass 2 sections could be processed in parallel (to be implemented in Task Group 8).

## Security Considerations
- API key stored in environment variable (process.env.OPENAI_API_KEY)
- No user input directly interpolated into prompts (all content from trusted sources)
- No sensitive data exposure (all data in-memory during processing)

## Dependencies for Other Tasks
- **Task Group 6 (Pass 3 & 4):** Requires SectionFindings structure from Pass 2
- **Task Group 8 (Integration):** Will orchestrate Pass 1 and Pass 2 in workflow

## Notes

### Implementation Decisions
1. **Cost Optimization:** Used GPT-4o-mini for Pass 1 (summary analysis) and reserved GPT-4o for Pass 2 (detailed extraction). This balances cost and quality.

2. **Per-Section Source Selection:** Pass 2 selects top-N sources PER SECTION rather than global top-N. This ensures diverse source coverage across the outline.

3. **Graceful Fallback:** If full content is unavailable, Pass 2 falls back to summaries. This ensures robustness when ContentStore isn't fully populated.

4. **JSON Extraction Robustness:** Both passes handle markdown code blocks around JSON responses. LLMs sometimes wrap JSON in ```json blocks, so we extract the content first.

5. **State Integration:** multiPassState uses null default and last-write-wins reducer for simplicity. The node orchestration (Task Group 8) will update this progressively through the passes.

### Testing Philosophy
Followed the spec's guidance: "2-6 focused tests per task group, skip exhaustive edge cases." Wrote 9 tests total (4 + 5) covering critical functionality with mocked LLM responses for speed and determinism.

### Next Steps (for Task Group 6)
Task Group 6 will implement:
- Pass 3: validateFindings() for cross-reference and conflict detection
- Pass 4: generateFinalReport() for final markdown synthesis
- Additional prompts (PASS3_CROSSREF_PROMPT, PASS4_FINAL_REPORT_PROMPT)
- ConflictReport and ValidationReport structures

### Spec Alignment
This implementation directly follows the spec:
- Pass 1 prompt template matches lines 487-526 of spec
- Pass 2 prompt template matches lines 561-603 of spec
- Interface structures match spec lines 473-483 (outline) and 547-558 (findings)
- Uses specified models: GPT-4o-mini (Pass 1), GPT-4o (Pass 2)
