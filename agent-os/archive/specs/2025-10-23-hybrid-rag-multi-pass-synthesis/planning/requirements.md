# Requirements: Hybrid RAG Architecture with Multi-Pass Synthesis

## Problem Statement

### Current System Behavior

The Firesearch system currently produces short, under-cited reports despite extensive web research:

- **Sources Processed:** 466 sources searched and scraped over 30 minutes
- **Citations Generated:** Only 11 citations in final report
- **Report Length:** ~2,000 words
- **Citation Coverage:** 2.4% (11/466 sources actually cited)
- **User Expectation:** Comprehensive, well-researched reports similar to Claude Deep Research

### Example Output

From a recent Human Rights Due Diligence (HRDD) assessment:
- Query processed 466 sources over 30+ minutes
- Final report contained only 11 unique citations: [1][2][3][7][20][29][114][133][144][193][194]
- Report was concise but lacked the depth and comprehensive citation expected for a thorough research task
- Most of the 466 sources' content was not utilized in the final synthesis

## Root Cause Analysis

### Technical Investigation

Through code analysis of the existing Firesearch codebase, we identified the following root causes:

**1. Aggressive Content Summarization** (`lib/context-processor.ts`)

```typescript
// Line 277-282: calculateSummaryLength()
private calculateSummaryLength(sourceCount: number): number {
  if (sourceCount <= 5) return 4000;
  if (sourceCount <= 10) return 3000;
  if (sourceCount <= 20) return 2000;
  if (sourceCount <= 30) return 1500;
  return 1000;  // ← With 466 sources, each gets only 1000 chars
}
```

- With 466 sources, each source is summarized to only **1,000 characters**
- Critical details, nuanced information, and supporting evidence are lost in compression

**2. Full Content Discarded** (`lib/context-processor.ts`)

```typescript
// Line 343-344: summarizeSource()
return {
  ...source,
  content: summary,  // ← Original full content REPLACED by summary
  relevanceScore,
  extractedSections: [summary],
  keywords: this.extractKeywords(query, searchQueries),
  summarized: true
};
```

- After summarization, the **original full markdown content is replaced**
- Full content from Firecrawl's scraping is permanently discarded
- No mechanism to retrieve original content during synthesis

**3. Synthesis Only Sees Summaries** (`lib/langgraph-search-engine.ts`)

```typescript
// Line 721: synthesize node
const sourcesToUse = state.processedSources || state.sources || [];
```

- The final synthesis receives only `processedSources` which contain the 1,000-char summaries
- GPT-4o must generate a comprehensive report from surface-level information
- No access to detailed content, specific quotes, or contextual information

**4. Context Window Underutilization** (`lib/context-processor.ts` + `lib/config.ts`)

```typescript
// lib/context-processor.ts Line 14
private readonly MAX_TOTAL_CHARS = 100000;  // Only 100k chars

// lib/config.ts
// No configuration for synthesis-specific limits
```

- Current limit: 100,000 characters total for all sources
- **GPT-4o capacity:** 128,000 tokens (≈512,000 characters)
- System uses only **~20% of available context window**

**5. Firecrawl Integration Working Correctly** (`lib/firecrawl.ts`)

```typescript
// Lines 103-171: search() method
return {
  url: item.url,
  title: item.title || item.metadata?.title || 'Untitled',
  markdown: item.markdown || '',  // ← Full content available
  content: item.markdown || '',   // ← Full content available
  scraped: true,
  // ...
};
```

- Firecrawl's `/search` endpoint correctly returns **full markdown content**
- All 466 sources are successfully scraped with complete content
- The problem is NOT with data collection, but with content retention and utilization

## User Goals

### Primary Objectives

1. **Increase Citation Density**
   - Current: 11 citations from 466 sources (2.4%)
   - Target: 50+ citations per report (>10% coverage)

2. **Generate Comprehensive Reports**
   - Current: ~2,000 words
   - Target: 5,000-10,000 words with depth and detail

3. **Match Claude Deep Research Quality**
   - Well-cited claims (multiple sources per assertion)
   - Comprehensive coverage of the topic
   - Explicit identification of information gaps
   - Conflicting information presented transparently

4. **Utilize Full Content**
   - Preserve all 466 sources' full scraped content
   - Enable synthesis to access detailed information
   - Don't discard valuable research data after summarization

5. **Maintain Performance**
   - Processing time: <1 hour acceptable
   - No significant degradation in response time

## Technical Constraints

### Model Limitations

**GPT-4o (Primary Model)**
- **Context Window:** 128,000 tokens input
- **Output Tokens:** 16,384 tokens maximum
- **Character Approximation:** ~512,000 characters input, ~65,000 characters output
- **Temperature:** 0 for deterministic outputs (compliance/research requirements)

**GPT-4o-mini (Fast Model)**
- **Context Window:** 128,000 tokens
- **Output Tokens:** 16,000 tokens
- **Use Case:** Query generation, answer validation (not final synthesis)

### System Architecture Constraints

1. **Next.js App Router:** Must work within server components and API routes
2. **LangGraph State Management:** State updates via Annotation.Root with reducers
3. **Event Streaming:** Real-time progress updates to frontend required
4. **Firecrawl API:** No changes to API client (already working correctly)
5. **Memory Constraints:** In-memory storage for 466 sources' full content (~50-100MB)

### Performance Targets

- **Processing Time:** <1 hour for complete assessment (30-45 minutes typical)
- **Memory Usage:** Reasonable for 466 sources (estimate ~100MB peak)
- **API Costs:** GPT-4o primary model acceptable for quality (not optimizing for cost in MVP)

## Requested Solution: Hybrid RAG Architecture

### Core Features

**1. Dual Storage System**

- **Primary Storage:** Lightweight summaries for broad context (current approach)
- **Secondary Storage:** Full scraped content preserved separately
- **Interface Design:** `IContentStore` to allow future vector DB integration
- **MVP Implementation:** In-memory Map-based storage (no database required)

**2. Multi-Pass Synthesis Pipeline**

Four sequential synthesis passes to build comprehensive reports:

- **Pass 1 (Overview):**
  - Input: All summaries (466 sources)
  - Output: 5-8 section outline with key themes
  - Purpose: Structure the report based on what information is available

- **Pass 2 (Deep Dive):**
  - Input: Full content for top 50-100 sources + outline
  - Output: Detailed findings per section with citations
  - Purpose: Extract specific facts, quotes, and evidence from full content

- **Pass 3 (Cross-Reference):**
  - Input: Findings from Pass 2 + additional sources
  - Output: Validated findings with conflict detection
  - Purpose: Fact-check, identify contradictions, flag information gaps

- **Pass 4 (Final Report):**
  - Input: Validated findings + outline + all sources
  - Output: Comprehensive 5-10k word markdown report with 50+ citations
  - Purpose: Generate final report with dense citations and explicit gaps

**3. Context Window Optimization**

- **Increase Limits:**
  - `MAX_TOTAL_CHARS`: 100,000 → 400,000 characters
  - `MAX_CHARS_PER_SOURCE`: 15,000 → 30,000 characters
  - `MIN_CHARS_PER_SOURCE`: 2,000 → 5,000 characters

- **Smart Content Selection:**
  - Full content for top 50-100 most relevant sources
  - Summaries for remaining sources
  - Dynamic selection per synthesis pass based on relevance

- **Token Budget Tracking:**
  - Monitor token usage to stay within GPT-4o's 128k limit
  - Conservative 400k char limit (≈100k tokens, 78% of capacity)

**4. Quality Enhancements**

- **Source Re-Ranking:**
  - LLM-based relevance scoring (vs simple keyword matching)
  - Re-rank after each pass based on which sources contributed
  - Prioritize authoritative sources (if metadata available)

- **Citation Density Requirements:**
  - Minimum 3 citations per major claim
  - Minimum 50 total unique citations in final report
  - Track citation coverage (% of sources cited)

- **Confidence Scoring:**
  - 0.0-1.0 confidence score for each finding
  - Based on: source quality, agreement across sources, specificity
  - Display confidence in report (e.g., "High confidence: [0.9]")

- **Information Gaps Identification:**
  - Explicit "Information Gaps" section in final report
  - List questions that couldn't be answered with available sources
  - Suggest additional research strategies

- **Conflict Handling:**
  - Detect contradictions between sources
  - Present multiple viewpoints with citations
  - Don't arbitrarily choose one version

## New Components Required

### Backend Components

**1. Content Storage (`lib/content-store.ts`)**

```typescript
interface IContentStore {
  store(sourceId: string, content: string, metadata?: any): void;
  retrieve(sourceId: string): string | null;
  retrieveMultiple(sourceIds: string[]): Map<string, string>;
  clear(): void;
  size(): number;
}

class InMemoryContentStore implements IContentStore {
  // Map-based implementation for MVP
}
```

**2. Multi-Pass Synthesis (`lib/multi-pass-synthesis.ts`)**

- `Pass1_Overview()` - Generate outline from summaries
- `Pass2_DeepDive()` - Extract findings from full content
- `Pass3_Validation()` - Cross-reference and validate
- `Pass4_FinalReport()` - Synthesize comprehensive report
- Complete LLM prompts for each pass with JSON schemas

**3. Citation Validation (`lib/citation-validator.ts`)**

```typescript
interface CitationValidator {
  trackCitation(sourceId: string, section: string): void;
  getCitationCoverage(): number;
  getUniqueCitationCount(): number;
  validateMinimumCitations(minTotal: number, minPerSection: number): ValidationResult;
  getUncitedSources(): string[];
}
```

### Modified Components

**1. Configuration (`lib/config.ts`)**

Add new configuration section:

```typescript
export const SYNTHESIS_CONFIG = {
  ENABLE_MULTI_PASS: true,
  MAX_TOTAL_CHARS: 400000,
  MAX_CHARS_PER_SOURCE: 30000,
  MIN_CHARS_PER_SOURCE: 5000,
  PASS_1_SUMMARY_COUNT: -1,  // All sources
  PASS_2_FULL_CONTENT_COUNT: 50,
  PASS_3_CROSS_REF_COUNT: 30,
  MIN_CITATIONS_PER_SECTION: 3,
  MIN_TOTAL_CITATIONS: 50,
  ENABLE_CROSS_REFERENCE: true,
  ENABLE_FACT_CHECKING: true,
  CONFIDENCE_THRESHOLD: 0.7,
} as const;
```

**2. Context Processor (`lib/context-processor.ts`)**

- Preserve `fullContent` field in `ProcessedSource` (don't replace with summary)
- Store full content in `ContentStore` during summarization
- Add section-based content selection (retrieve relevant sources per section)
- Increase character limits as per `SYNTHESIS_CONFIG`

**3. Search Engine (`lib/langgraph-search-engine.ts`)**

- Replace single `synthesize` node with `multiPassSynthesize` node
- Add state fields: `outline`, `findings`, `validatedFindings`, `citationTracker`
- Integrate with `ContentStore` to retrieve full content
- Stream progress events for each pass to frontend

**4. Frontend Display (`app/search-display.tsx`)**

- Add phase indicators for 4 synthesis passes
- Display: "Pass 1: Generating outline...", "Pass 2: Deep dive analysis...", etc.
- Show citation count in real-time as report builds

## Out of Scope (MVP)

The following are explicitly **NOT** included in the initial implementation:

1. **Vector Database Integration**
   - Use in-memory Map-based storage first
   - Vector DB can be added later via `IContentStore` interface

2. **GPT-4o Long Output Model**
   - Use standard GPT-4o (16k output tokens)
   - Long Output variant (64k tokens) can be tested later

3. **Embeddings-Based Retrieval**
   - Use LLM-based relevance scoring first
   - Embeddings add complexity and API costs

4. **Report Versioning**
   - No storage of multiple report versions
   - No diff/comparison features

5. **Custom Source Quality Scoring**
   - No manual curation of source authority
   - Use LLM's inherent understanding of source quality

6. **Real-Time Collaboration**
   - Single-user workflow only
   - No multi-user editing or comments

## Success Criteria

### Quantitative Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Unique Citations | 11 | 50+ | Count of `[n]` citations in final report |
| Report Length | ~2,000 words | 5,000-10,000 words | Word count of final markdown |
| Citation Coverage | 2.4% (11/466) | >10% (>46/466) | (Citations / Sources) × 100 |
| Processing Time | ~30 minutes | <60 minutes | Total workflow duration |
| Context Utilization | ~20% | ~75% | (Chars used / GPT-4o limit) × 100 |

### Qualitative Criteria

**Report Quality:**
- ✅ Multiple citations per major claim (minimum 3)
- ✅ Detailed explanations with specific facts and quotes
- ✅ Explicit identification of information gaps
- ✅ Transparent presentation of conflicting information
- ✅ Confidence scores for key findings
- ✅ Comprehensive coverage of the research topic

**System Reliability:**
- ✅ Graceful handling of missing sources
- ✅ No content loss during processing
- ✅ Consistent output quality across different queries
- ✅ Clear error messages when issues occur

**Developer Experience:**
- ✅ Clear configuration options in `lib/config.ts`
- ✅ Well-documented component interfaces
- ✅ Testable individual passes (unit testing)
- ✅ Observable synthesis progress (event streaming)

## Acceptance Tests

### Test Case 1: Citation Density
- **Input:** Query that generates 400+ sources
- **Expected:** Final report contains 50+ unique citations
- **Validation:** Count `[n]` patterns in markdown, verify all are unique

### Test Case 2: Content Utilization
- **Input:** Query with detailed sources (long articles)
- **Expected:** Report includes specific facts/quotes from full content (not just summaries)
- **Validation:** Manual review of report depth and detail

### Test Case 3: Information Gaps
- **Input:** Query on niche topic with limited information
- **Expected:** Report explicitly states what couldn't be answered
- **Validation:** "Information Gaps" section present and non-empty

### Test Case 4: Conflicting Information
- **Input:** Query on controversial topic with contradictory sources
- **Expected:** Report presents multiple viewpoints with citations for each
- **Validation:** Check for phrases like "Source A claims... while Source B states..."

### Test Case 5: Processing Time
- **Input:** Standard HRDD assessment (466 sources)
- **Expected:** Complete within 60 minutes
- **Validation:** Measure end-to-end workflow duration

### Test Case 6: Context Window Usage
- **Input:** Query generating maximum sources
- **Expected:** No token limit errors, graceful degradation if limits approached
- **Validation:** Monitor token usage logs, ensure <128k tokens

## Dependencies

### External Dependencies
- **Firecrawl API:** Already integrated, no changes required
- **OpenAI API:** GPT-4o model (already in use)
- **LangGraph:** State machine framework (already in use)

### Internal Dependencies
- **Existing Firesearch codebase:** Search workflow, event streaming, UI components
- **Configuration system:** `lib/config.ts` pattern
- **TypeScript:** Type safety for all new components

### Development Dependencies
- **Testing framework:** Jest or Vitest (spec to clarify which)
- **Type checking:** TypeScript strict mode
- **Linting:** ESLint with project rules

## Implementation Timeline

**Estimated Duration:** 4-5 weeks

### Week 1: Foundation
- Configuration updates (`SYNTHESIS_CONFIG`)
- Content storage implementation (`IContentStore`, `InMemoryContentStore`)
- Pass 1 (Overview) implementation and testing

### Week 2: Core Synthesis
- Pass 2 (Deep Dive) implementation
- Context processor modifications (preserve full content)
- Initial integration testing

### Week 3: Validation & Completion
- Pass 3 (Cross-Reference) implementation
- Pass 4 (Final Report) implementation
- Citation validator implementation

### Week 4: Integration & Testing
- LangGraph workflow integration
- Frontend progress display updates
- End-to-end testing with real queries

### Week 5: Optimization & QA
- Performance tuning (if needed)
- Comprehensive test suite
- Bug fixes and refinements
- Documentation updates

## Risk Mitigation

### Technical Risks

**Risk 1: Token Limit Exceeded**
- **Mitigation:** Conservative 400k char limit (78% of capacity), monitoring, graceful fallback
- **Fallback:** Reduce `PASS_2_FULL_CONTENT_COUNT` from 50 to 30

**Risk 2: Processing Time Too Long**
- **Mitigation:** Parallel processing where possible, caching summaries
- **Fallback:** Reduce number of passes (merge Pass 3 into Pass 2)

**Risk 3: Memory Constraints**
- **Mitigation:** In-memory storage efficient, estimated ~100MB for 466 sources
- **Fallback:** Implement file-based `ContentStore` if memory issues arise

**Risk 4: LLM Output Inconsistency**
- **Mitigation:** Temperature 0, structured prompts with JSON schemas
- **Fallback:** Add validation and retry logic for malformed outputs

### Integration Risks

**Risk 1: Breaking Existing Workflows**
- **Mitigation:** Changes isolated to synthesis phase, search/scrape unchanged
- **Fallback:** Feature flag to toggle multi-pass synthesis on/off

**Risk 2: UI Streaming Compatibility**
- **Mitigation:** Reuse existing event streaming patterns
- **Fallback:** Simplify to single progress bar if detailed pass tracking causes issues

## References

### Code Files Analyzed
- `/lib/langgraph-search-engine.ts` - Main search workflow (1,358 lines)
- `/lib/context-processor.ts` - Content summarization (426 lines)
- `/lib/firecrawl.ts` - Firecrawl API client (172 lines)
- `/lib/config.ts` - Configuration constants (41 lines)

### External Documentation
- [GPT-4o Model Documentation](https://platform.openai.com/docs/models/gpt-4o)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Firecrawl API Documentation](https://docs.firecrawl.dev)

### User Requirements Source
- User conversation on October 23, 2025
- Analysis of HRDD assessment output (466 sources → 11 citations)
- Request to match "Claude Deep Research" quality standards

---

**Document Version:** 1.0
**Created:** October 23, 2025
**Last Updated:** October 23, 2025
**Status:** APPROVED
