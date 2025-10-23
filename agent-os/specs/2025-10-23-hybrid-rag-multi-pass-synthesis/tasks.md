# Task Breakdown: Hybrid RAG Architecture with Multi-Pass Synthesis

## Overview

**Total Task Groups:** 8
**Assigned Implementers:** api-engineer, testing-engineer, ui-designer
**Estimated Timeline:** 4-5 weeks
**Total Estimated Tasks:** ~50 sub-tasks

**Success Criteria:**
- Reports contain 50+ unique citations (vs current 11)
- Report length 5-10k words (vs current ~2k)
- Citation coverage >10% of total sources (vs current 2.4%)
- Processing time <1 hour
- Information gaps explicitly identified
- Conflicts presented transparently

## Task List

### Phase 1: Configuration & Content Storage Infrastructure

#### Task Group 1: Configuration Setup
**Assigned implementer:** api-engineer
**Dependencies:** None
**Estimated Effort:** 4-6 hours

- [x] 1.0 Complete configuration setup
  - [x] 1.1 Write 2-4 focused tests for SYNTHESIS_CONFIG
    - Test config values are valid (e.g., PASS_2_FULL_CONTENT_COUNT > 0)
    - Test MAX_TOTAL_CHARS within GPT-4o limits (~512k chars)
    - Test feature flags toggle correctly
    - Skip exhaustive validation testing
  - [x] 1.2 Add SYNTHESIS_CONFIG to `/lib/config.ts`
    - Add all config constants from spec (lines 272-301)
    - Include ENABLE_MULTI_PASS flag (default: true)
    - Include context limits (MAX_TOTAL_CHARS: 400k, MAX_CHARS_PER_SOURCE: 30k)
    - Include pass configuration (PASS_2_FULL_CONTENT_COUNT: 50)
    - Include quality requirements (MIN_TOTAL_CITATIONS: 50)
    - Include model settings (OVERVIEW_MODEL, DEEPDIVE_MODEL)
  - [x] 1.3 Export SYNTHESIS_CONFIG with proper types
    - Use `as const` for type safety
    - Export type inference for TypeScript usage
  - [x] 1.4 Run configuration tests
    - Run ONLY the 2-4 tests written in 1.1
    - Verify config loads correctly
    - Do NOT run entire test suite

**Acceptance Criteria:**
- SYNTHESIS_CONFIG available in `/lib/config.ts`
- All config values match spec requirements
- Config tests pass (2-4 tests)
- TypeScript types properly inferred

---

#### Task Group 2: Content Store Implementation
**Assigned implementer:** api-engineer
**Dependencies:** None
**Estimated Effort:** 8-10 hours

- [x] 2.0 Complete content storage layer
  - [x] 2.1 Write 2-6 focused tests for ContentStore
    - Test store() and retrieve() basic operations
    - Test retrieveBatch() with multiple URLs
    - Test has() returns correct boolean
    - Test getStats() returns accurate counts
    - Test clear() removes all content
    - Skip performance and edge case tests
  - [x] 2.2 Create `/lib/content-store.ts` with IContentStore interface
    - Define interface methods: store(), retrieve(), retrieveBatch(), has(), getStats(), clear()
    - Add TypeScript interfaces for stats and batch results
    - Document each method with JSDoc comments
    - Follow pattern from spec (lines 329-393)
  - [x] 2.3 Implement InMemoryContentStore class
    - Use `Map<string, string>` for in-memory storage
    - Implement all IContentStore interface methods
    - Add character count tracking for stats
    - Handle missing URLs gracefully (return null)
  - [x] 2.4 Add ContentStore to LangGraph state
    - Modify `/lib/langgraph-search-engine.ts` SearchStateAnnotation
    - Add `fullContentStore: Annotation<IContentStore>` field
    - Use reducer: `(_, y) => y ?? new InMemoryContentStore()`
    - Set default: `() => new InMemoryContentStore()`
  - [x] 2.5 Run content store tests
    - Run ONLY the 2-6 tests written in 2.1
    - Verify all CRUD operations work
    - Do NOT run entire test suite

**Acceptance Criteria:**
- `/lib/content-store.ts` exists with interface and implementation
- IContentStore interface abstraction allows future vector DB swap
- InMemoryContentStore passes all tests (2-6 tests)
- ContentStore integrated into LangGraph state
- No external dependencies required

---

#### Task Group 3: Content Store Population
**Assigned implementer:** api-engineer
**Dependencies:** Task Group 2
**Estimated Effort:** 6-8 hours

- [x] 3.0 Integrate content storage into search/scrape workflow
  - [x] 3.1 Write 2-4 focused tests for content population
    - Test search node populates ContentStore
    - Test scrape node adds to ContentStore
    - Test full content preserved alongside summaries
    - Skip comprehensive integration tests at this stage
  - [x] 3.2 Modify search node in `/lib/langgraph-search-engine.ts`
    - After creating newSources array (around line 393)
    - Store full content in ContentStore: `contentStore.store(source.url, source.content)`
    - Do this BEFORE summarization
    - Preserve fullContent reference in source object
  - [x] 3.3 Modify scrape node in `/lib/langgraph-search-engine.ts`
    - After successful scrape (around line 522)
    - Store scraped markdown in ContentStore
    - Keep summary generation for Pass 1 usage
    - Ensure both summary and fullContent are available
  - [x] 3.4 Update ProcessedSource interface in `/lib/context-processor.ts`
    - Add `fullContent?: string` field to interface
    - Modify summarizeSource() to preserve original content
    - Store summary in `content` field, full text in `fullContent` field
    - Follow pattern from spec (lines 996-1024)
  - [x] 3.5 Run content population tests
    - Run ONLY the 2-4 tests written in 3.1
    - Verify ContentStore contains full content after search
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Search node populates ContentStore with full markdown
- Scrape node adds scraped content to ContentStore
- ProcessedSource maintains both summary and fullContent
- Content population tests pass (2-4 tests)
- No data loss during summarization

---

### Phase 2: Multi-Pass Synthesis - Pass 1 (Overview)

#### Task Group 4: Pass 1 Implementation
**Assigned implementer:** api-engineer
**Dependencies:** Task Groups 1-3
**Estimated Effort:** 10-12 hours

- [x] 4.0 Complete Pass 1 overview synthesis
  - [x] 4.1 Write 2-6 focused tests for Pass 1
    - Test outline generation with multiple summaries
    - Test outline contains 5-8 sections
    - Test relevantSources mapped to sections
    - Test relevance scores are 0.0-1.0 range
    - Skip exhaustive JSON parsing tests
    - Skip edge case handling
  - [x] 4.2 Create `/lib/multi-pass-synthesis.ts` with base structure
    - Export interfaces: OutlineStructure, OutlineSection
    - Add LLM imports (ChatOpenAI from langchain)
    - Set up module structure for all 4 passes
  - [x] 4.3 Implement PASS1_OVERVIEW_PROMPT
    - Create prompt template from spec (lines 487-526)
    - Include source summaries, query, task description
    - Request JSON output format with sections array
    - Include guidelines for section count and relevance scoring
  - [x] 4.4 Implement generateOutline() function
    - Accept query, sources (with summaries), and context
    - Concatenate all source summaries (stay under 400k char limit)
    - Call GPT-4o-mini with PASS1_OVERVIEW_PROMPT
    - Parse JSON response into OutlineStructure
    - Handle parsing errors with retry logic
  - [x] 4.5 Add multiPassState to LangGraph state
    - Modify SearchStateAnnotation in `/lib/langgraph-search-engine.ts`
    - Add multiPassState field with outline, currentPass, etc.
    - Use reducer: `(_, y) => y` (last-write-wins)
    - Set default: `() => null`
  - [x] 4.6 Run Pass 1 tests
    - Run ONLY the 2-6 tests written in 4.1
    - Verify outline generation works
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Pass 1 generates outline with 5-8 sections
- Sources mapped to sections with relevance scores
- Outline stored in multiPassState
- Pass 1 tests pass (2-6 tests)
- Uses GPT-4o-mini for cost efficiency

---

### Phase 3: Multi-Pass Synthesis - Pass 2 (Deep Dive)

#### Task Group 5: Pass 2 Implementation
**Assigned implementer:** api-engineer
**Dependencies:** Task Group 4
**Estimated Effort:** 12-16 hours

- [x] 5.0 Complete Pass 2 deep dive synthesis
  - [x] 5.1 Write 2-6 focused tests for Pass 2
    - Test processSection() retrieves full content
    - Test findings extracted with citations
    - Test confidence scores assigned
    - Test top N sources selected per section
    - Skip exhaustive finding validation
    - Skip performance tests
  - [x] 5.2 Implement PASS2_DEEPDIVE_PROMPT in `/lib/multi-pass-synthesis.ts`
    - Create prompt template from spec (lines 561-603)
    - Include section title, description, full content
    - Request findings with claims, citations, evidence, confidence
    - Add confidence scoring guidelines
  - [x] 5.3 Implement processSection() function
    - Select top N sources by relevance score (PASS_2_FULL_CONTENT_COUNT)
    - Retrieve full content from ContentStore using retrieveBatch()
    - Truncate content to MAX_CHARS_PER_SOURCE
    - Build prompt with full content
    - Call GPT-4o with PASS2_DEEPDIVE_PROMPT
    - Parse JSON response into SectionFindings
    - Track sources actually used
  - [x] 5.4 Add context processor methods in `/lib/context-processor.ts`
    - Add selectTopSourcesPerSection(sources, outline, N)
    - Add retrieveFullContent(sources, contentStore)
    - Sort sources by relevance score per section
    - Handle missing content gracefully (fallback to summary)
  - [x] 5.5 Create Pass 2 orchestration
    - Loop through all outline sections
    - Call processSection() for each section
    - Aggregate findings into deepDiveFindings array
    - Store in multiPassState
  - [x] 5.6 Run Pass 2 tests
    - Run ONLY the 2-6 tests written in 5.1
    - Verify full content retrieved from ContentStore
    - Verify findings contain citations
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Pass 2 retrieves full content for top 50 sources per section
- Findings extracted with specific evidence and citations
- Confidence scores assigned (0.0-1.0)
- SectionFindings stored in multiPassState
- Pass 2 tests pass (2-6 tests)
- Uses GPT-4o for high quality analysis

---

### Phase 4: Multi-Pass Synthesis - Pass 3 (Cross-Reference)

#### Task Group 6: Pass 3 & Pass 4 Implementation
**Assigned implementer:** api-engineer
**Dependencies:** Task Group 5
**Estimated Effort:** 14-18 hours

- [x] 6.0 Complete Pass 3 cross-reference and Pass 4 final report
  - [x] 6.1 Write 2-8 focused tests for Pass 3 and Pass 4
    - Test validateFindings() detects conflicts
    - Test confidence scores updated
    - Test information gaps identified
    - Test generateFinalReport() produces markdown
    - Test report includes all sections from outline
    - Test streaming works with onChunk callback
    - Skip exhaustive conflict detection tests
    - Skip comprehensive validation tests
  - [x] 6.2 Implement PASS3_CROSSREF_PROMPT in `/lib/multi-pass-synthesis.ts`
    - Create prompt template from spec (lines 677-730)
    - Include findings from Pass 2, additional sources
    - Request validation with conflict detection
    - Add confidence upgrade/downgrade rules
  - [x] 6.3 Implement validateFindings() function
    - Accept deepDiveFindings and contentStore
    - Select top 30 sources for cross-reference (PASS_3_CROSS_REF_COUNT)
    - Call GPT-4o with PASS3_CROSSREF_PROMPT
    - Parse validated findings with conflict reports
    - Identify information gaps
    - Return ValidationReport
  - [x] 6.4 Define conflict and validation interfaces
    - Add ConflictReport interface (viewpoint1, viewpoint2, resolution)
    - Add ValidationReport interface (validatedFindings, informationGaps)
    - Export from `/lib/multi-pass-synthesis.ts`
  - [x] 6.5 Implement PASS4_FINAL_REPORT_PROMPT
    - Create prompt template from spec (lines 755-816)
    - Include outline, validated findings, conflicts, gaps
    - Request comprehensive markdown report structure
    - Add formatting rules for citations and confidence indicators
  - [x] 6.6 Implement generateFinalReport() function
    - Accept outline, validationReport, query, onChunk callback
    - Use streaming LLM (GPT-4o)
    - Stream output chunks via onChunk callback
    - Build complete report with all sections
    - Include Information Gaps and Confidence Assessment sections
    - Return complete markdown string
  - [x] 6.7 Run Pass 3 and Pass 4 tests
    - Run ONLY the 2-8 tests written in 6.1
    - Verify conflicts detected
    - Verify final report generated
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Pass 3 validates findings and detects conflicts
- Information gaps explicitly identified
- Pass 4 generates comprehensive markdown report
- Report includes all required sections (outline sections + gaps + confidence)
- Streaming works for real-time UI updates
- Pass 3 and Pass 4 tests pass (2-8 tests)
- Report length targets 5-10k words

---

### Phase 5: Citation Validation System

#### Task Group 7: Citation Tracking and Validation
**Assigned implementer:** api-engineer
**Dependencies:** Task Group 6
**Estimated Effort:** 8-10 hours

- [x] 7.0 Complete citation validation system
  - [x] 7.1 Write 2-6 focused tests for CitationValidator
    - Test addCitation() tracks citations correctly
    - Test parseReportCitations() extracts [url] citations
    - Test validate() checks minimum requirements
    - Test getStats() returns accurate counts
    - Test citation coverage calculation
    - Skip edge case citation format tests
  - [x] 7.2 Create `/lib/citation-validator.ts` with CitationValidator class
    - Define CitationUsage interface (url, title, usageCount, sections)
    - Define ValidationResult interface
    - Use Map for citation storage
    - Follow pattern from spec (lines 846-981)
  - [x] 7.3 Implement citation tracking methods
    - Implement addCitation(url, sectionId, title)
    - Implement parseReportCitations(reportMarkdown)
    - Use regex to extract [url] citations
    - Track which sections cite each source
    - Count unique citations and total usages
  - [x] 7.4 Implement validation logic
    - Implement validate() method
    - Check totalUniqueCitations >= MIN_TOTAL_CITATIONS
    - Check each section has >= MIN_CITATIONS_PER_SECTION
    - Calculate citation coverage (cited / total sources)
    - Generate recommendations for improvement
  - [x] 7.5 Implement citation statistics
    - Implement getStats() method
    - Return most cited sources (top 10)
    - Return citation distribution per section
    - Return total unique citations count
  - [x] 7.6 Run citation validator tests
    - Run ONLY the 2-6 tests written in 7.1
    - Verify citation parsing works
    - Verify validation checks work
    - Do NOT run entire test suite

**Acceptance Criteria:**
- CitationValidator class exists in `/lib/citation-validator.ts`
- Citation parsing extracts all [url] citations from report
- Validation checks minimum 50 citations requirement
- Citation coverage calculated correctly
- Citation validator tests pass (2-6 tests)
- Recommendations generated for low citation counts

---

### Phase 6: Integration & LangGraph Workflow

#### Task Group 8: Multi-Pass Node Integration
**Assigned implementer:** api-engineer
**Dependencies:** Task Groups 4-7
**Estimated Effort:** 10-14 hours

- [x] 8.0 Complete LangGraph workflow integration
  - [x] 8.1 Write 2-6 focused tests for multiPassSynthesize node
    - Test node executes all 4 passes in sequence
    - Test outline generated in Pass 1
    - Test findings generated in Pass 2
    - Test validation in Pass 3
    - Test final report in Pass 4
    - Test citation validation at end
    - Skip exhaustive error handling tests at this stage
  - [x] 8.2 Add citationMap to LangGraph state
    - Modify SearchStateAnnotation in `/lib/langgraph-search-engine.ts`
    - Add `citationMap: Annotation<Map<string, CitationUsage>>`
    - Use reducer: `(_, y) => y ?? new Map()`
    - Set default: `() => new Map()`
  - [x] 8.3 Remove old synthesize node
    - Remove existing synthesize node (lines ~708-754)
    - Keep references for pattern understanding
    - Remove from workflow edges
  - [x] 8.4 Implement multiPassSynthesize node
    - Create new node in workflow graph
    - Import all Pass functions from `/lib/multi-pass-synthesis.ts`
    - Execute Pass 1: generateOutline()
    - Execute Pass 2: loop processSection() for all sections
    - Execute Pass 3: validateFindings()
    - Execute Pass 4: generateFinalReport()
    - Create CitationValidator and parse report
    - Validate citation requirements
    - Generate follow-up questions (keep existing logic)
    - Return state with finalAnswer, followUpQuestions, multiPassState, citationMap
    - Follow pattern from spec (lines 1121-1271)
  - [x] 8.5 Add event streaming for multi-pass phases
    - Emit 'multi-pass-phase' events for each pass (pass: 1|2|3|4)
    - Emit 'outline-generated' after Pass 1
    - Emit 'deep-dive-section' for each section in Pass 2
    - Emit 'conflict-detected' for conflicts in Pass 3
    - Emit 'citation-stats' after validation
    - Use eventCallback from config
  - [x] 8.6 Update workflow edges
    - Modify conditional edge from analyze node
    - Route to multiPassSynthesize instead of synthesize
    - Update edge map with new node name
    - Add edge from multiPassSynthesize to complete
    - Keep error handling edges
  - [x] 8.7 Run multi-pass integration tests
    - Run ONLY the 2-6 tests written in 8.1
    - Verify all 4 passes execute
    - Verify events emitted correctly
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Old synthesize node removed, replaced with multiPassSynthesize
- All 4 passes execute in sequence
- Events stream to frontend for progress tracking
- Citation validation runs after Pass 4
- State properly updated with multiPassState and citationMap
- Integration tests pass (2-6 tests)
- Workflow routes correctly from analyze → multiPassSynthesize → complete

---

### Phase 7: Frontend Progress Display

#### Task Group 9: UI Updates for Multi-Pass Display
**Assigned implementer:** ui-designer
**Dependencies:** Task Group 8
**Estimated Effort:** 6-8 hours

- [x] 9.0 Complete UI updates for multi-pass synthesis
  - [x] 9.1 Write 2-4 focused tests for UI components
    - Test multi-pass phase indicators display
    - Test progress messages update correctly
    - Test outline display (if added)
    - Test citation stats display
    - Skip comprehensive UI interaction tests
    - Skip visual regression tests
  - [x] 9.2 Add multi-pass event types to `/app/search-display.tsx`
    - Add 'multi-pass-phase' event type with pass number
    - Add 'outline-generated' event type
    - Add 'deep-dive-section' event type
    - Add 'conflict-detected' event type
    - Add 'citation-stats' event type
    - Update SearchEvent union type
  - [x] 9.3 Update phase display logic
    - Add handlers for new event types
    - Display "Pass 1: Analyzing themes across X sources..."
    - Display "Pass 2: Deep diving into top sources..."
    - Display "Pass 3: Validating findings and checking conflicts..."
    - Display "Pass 4: Generating comprehensive report..."
    - Show section names during Pass 2
    - Show conflict alerts during Pass 3
  - [x] 9.4 Add citation statistics display
    - Show total unique citations at end
    - Show citation coverage percentage
    - Display in existing results UI
    - Use existing UI component patterns
  - [x] 9.5 Test UI updates visually
    - Run dev server: `npm run dev`
    - Trigger search with multi-pass synthesis
    - Verify all phase indicators appear
    - Verify progress messages update correctly
    - Do NOT write extensive automated tests at this stage
  - [x] 9.6 Run UI component tests
    - Run ONLY the 2-4 tests written in 9.1
    - Verify event handling works
    - Do NOT run entire test suite

**Acceptance Criteria:**
- Multi-pass phase indicators display in UI
- Progress messages show current pass and activity
- Citation statistics shown at end of synthesis
- UI updates work with existing design system
- UI component tests pass (2-4 tests)
- No visual regressions in existing UI

---

### Phase 8: Testing & Quality Assurance

#### Task Group 10: Comprehensive Testing & Gap Analysis
**Assigned implementer:** testing-engineer
**Dependencies:** Task Groups 1-9
**Estimated Effort:** 16-20 hours

- [x] 10.0 Complete comprehensive testing and validation
  - [x] 10.1 Review existing tests from Task Groups 1-9
    - Review ~26-50 tests written by api-engineer (Tasks 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1)
    - Review ~2-4 tests written by ui-designer (Task 9.1)
    - Total existing tests: approximately 28-54 tests
    - Document test coverage per component
  - [x] 10.2 Analyze test coverage gaps for Hybrid RAG feature
    - Identify critical end-to-end workflows lacking coverage
    - Focus ONLY on gaps related to multi-pass synthesis
    - Prioritize integration tests over additional unit tests
    - Do NOT assess entire application test coverage
    - List critical gaps (max 10)
  - [x] 10.3 Write up to 10 additional strategic tests
    - Add end-to-end test: Full query through all 4 passes
    - Add integration test: ContentStore → Pass 2 full content retrieval
    - Add integration test: Citation validation with real report
    - Add integration test: Conflict detection with disagreeing sources
    - Add integration test: Information gaps section generation
    - Add integration test: Token limit handling (400k chars)
    - Add integration test: Graceful degradation (missing full content)
    - Add performance test: Processing time <1 hour (if business-critical)
    - Skip: Edge cases, error state exhaustiveness, input validation
    - Focus: Critical workflows that ensure spec requirements met
  - [x] 10.4 Create test fixtures for multi-pass testing
    - Create mock sources with summaries and full content
    - Create mock outline structure for Pass 2/3 testing
    - Create mock findings with conflicts for Pass 3 testing
    - Reuse existing test patterns from codebase
  - [x] 10.5 Write acceptance tests for success criteria
    - Test: Final report contains 50+ unique citations
    - Test: Report length 5-10k words
    - Test: Citation coverage >10%
    - Test: Processing time <1 hour (if feasible to test)
    - Test: Information gaps section exists
    - Test: Conflicts presented with dual citations
    - Use real query examples from spec
  - [x] 10.6 Run feature-specific test suite
    - Run ALL tests related to Hybrid RAG feature
    - Expected total: approximately 38-64 tests maximum
    - Do NOT run entire application test suite
    - Verify all critical workflows pass
    - Document any failures and fix critical issues
  - [x] 10.7 Validate against spec success criteria
    - Run benchmark query: "deepseek r1 capabilities and performance benchmarks"
    - Measure citation count (target: 50+)
    - Measure word count (target: 5-10k)
    - Measure citation coverage (target: >10%)
    - Measure processing time (target: <1 hour)
    - Verify information gaps section present
    - Verify conflicts detected and presented
    - Document results vs targets

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 38-64 tests total)
- No more than 10 additional tests added by testing-engineer
- Critical user workflows covered (query → 4 passes → report generation)
- Acceptance tests validate spec success criteria
- End-to-end test demonstrates 50+ citations
- Performance test confirms <1 hour processing
- Documentation created for test results vs spec targets

---

## Execution Order

Recommended implementation sequence:

1. **Phase 1: Foundation** (Task Groups 1-3)
   - Configuration and content storage infrastructure
   - Critical foundation for all subsequent work
   - Estimated: 1 week

2. **Phase 2: Pass 1** (Task Group 4)
   - Overview synthesis with outline generation
   - First synthesis pass, testable independently
   - Estimated: 3-4 days

3. **Phase 3: Pass 2** (Task Group 5)
   - Deep dive with full content retrieval
   - Depends on ContentStore and Pass 1 outline
   - Estimated: 4-5 days

4. **Phase 4: Pass 3 & Pass 4** (Task Group 6)
   - Cross-reference and final report generation
   - Completes synthesis pipeline
   - Estimated: 5-6 days

5. **Phase 5: Citation System** (Task Group 7)
   - Citation tracking and validation
   - Can be developed in parallel with Pass 3/4
   - Estimated: 3-4 days

6. **Phase 6: Integration** (Task Group 8)
   - LangGraph workflow integration
   - Brings everything together
   - Estimated: 4-5 days

7. **Phase 7: UI Updates** (Task Group 9)
   - Frontend progress display
   - Can happen in parallel with late-stage backend work
   - Estimated: 3-4 days

8. **Phase 8: Testing** (Task Group 10)
   - Comprehensive testing and validation
   - Final quality assurance phase
   - Estimated: 5-6 days

**Total Timeline:** 4-5 weeks with sequential execution, potentially 3-4 weeks with parallel work

---

## Implementation Notes

### Key Technical Constraints

- **Token Budget:** Stay under 400k chars (GPT-4o 128k token limit ≈ 512k chars)
- **Processing Time:** Target <1 hour total processing
- **Testing Philosophy:** Write 2-8 focused tests per task group, comprehensive tests at end
- **Error Handling:** Graceful degradation if full content unavailable (fallback to summaries)
- **Streaming:** All passes should emit progress events for UI updates

### Dependencies Summary

- **Task Groups 1-3:** No dependencies (can start immediately)
- **Task Group 4:** Depends on 1-3 (ContentStore required)
- **Task Group 5:** Depends on 4 (Pass 1 outline required)
- **Task Group 6:** Depends on 5 (Pass 2 findings required)
- **Task Group 7:** Depends on 6 (Pass 4 report required for citation parsing)
- **Task Group 8:** Depends on 4-7 (all passes and citation validator)
- **Task Group 9:** Depends on 8 (workflow integration complete)
- **Task Group 10:** Depends on 1-9 (all implementation complete)

### Parallel Execution Opportunities

- Task Groups 1-3 can be executed in parallel (independent infrastructure)
- Task Group 7 can be developed in parallel with Task Group 6 (independent systems)
- Task Group 9 can start once Task Group 8 begins (UI can use mock events)

### Testing Strategy

- **During Development:** Each task group writes 2-8 focused tests (total: ~28-54 tests)
- **Test Scope:** Cover critical behaviors only, skip edge cases
- **Test Execution:** Run only tests for current task group, NOT entire suite
- **Final Phase:** Testing-engineer adds up to 10 strategic tests for critical gaps
- **Total Expected:** Approximately 38-64 tests maximum for entire feature

### Configuration Alignment

All tasks align with user standards:
- **Tech Stack:** Next.js 15, TypeScript, React 19, LangGraph, OpenAI GPT-4o
- **Testing:** Minimal tests during development, comprehensive tests at end
- **Conventions:** Clear documentation, environment variables, no secrets in code
- **Code Style:** TypeScript strict mode, JSDoc comments, interface abstractions

### Success Validation

After Task Group 10 completion, validate:
- [x] 50+ unique citations in final reports
- [x] 5-10k word comprehensive reports
- [x] >10% citation coverage
- [ ] Processing time <1 hour
- [x] Information gaps explicitly flagged
- [x] Conflicts presented transparently
- [x] All 4 passes execute without errors
- [ ] UI displays progress through all passes
