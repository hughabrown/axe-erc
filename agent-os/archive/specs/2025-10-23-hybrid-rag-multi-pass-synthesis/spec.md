# Specification: Hybrid RAG Architecture with Multi-Pass Synthesis

## Goal

Transform Firesearch's synthesis pipeline from aggressive single-pass summarization into a hybrid RAG system with multi-pass synthesis to produce comprehensive, deeply-researched reports (50+ citations, 5-10k words) that match Claude Deep Research quality while utilizing all scraped content instead of discarding it.

## User Stories

- As a researcher, I want comprehensive reports that cite 50+ sources (not just 11) so that I have complete coverage of the topic
- As a researcher, I want the system to utilize all 466 sources it scraped (not just summaries) so that no valuable information is lost
- As a researcher, I want multi-pass synthesis that progressively deepens analysis so that reports have both breadth and depth
- As a researcher, I want explicit information gaps flagged so that I know what the system couldn't answer
- As a researcher, I want confidence scoring for findings so that I can assess reliability
- As a researcher, I want conflicting information presented transparently so that I can evaluate different viewpoints

## Core Requirements

### Functional Requirements

**Dual Storage System:**
- Store summaries (1000 chars) for broad context and overview generation
- Preserve full scraped content (markdown) separately for deep-dive analysis
- Enable dynamic retrieval during multi-pass synthesis based on relevance
- Track both summary and full content for each source in state

**Multi-Pass Synthesis Pipeline (4 Passes):**

*Pass 1 - Overview (Summaries Only):*
- Use ALL source summaries to identify key themes and structure
- Generate outline with major sections and subsections
- Flag which sources are most relevant to each section
- Output: Structured outline with source mapping (5 min)

*Pass 2 - Deep Dive (Full Content for Top N):*
- Retrieve full content for top 50-100 sources by relevance
- Analyze in detail for each outline section
- Extract specific facts, quotes, data points with citations
- Output: Detailed findings per section with 30+ citations (15 min)

*Pass 3 - Cross-Reference and Validation:*
- Compare findings across multiple sources
- Flag conflicting information (present both viewpoints)
- Validate numerical claims across sources
- Identify information gaps (what wasn't found)
- Output: Validated findings with conflict notes (10 min)

*Pass 4 - Final Synthesis:*
- Generate comprehensive report from validated findings
- Ensure minimum 50+ unique citations distributed across report
- Include confidence scores for each major finding (0.0-1.0)
- Add "Information Gaps" section explicitly
- Output: Final markdown report (10 min)

**Context Window Optimization:**
- Increase MAX_TOTAL_CHARS: 100k → 400k (utilize GPT-4o's 128k token capacity)
- Increase per-source limits: MIN 5k chars, MAX 30k chars (vs current 2k/15k)
- Smart selection: Full content for top 50-100, summaries for rest
- Token tracking: Monitor usage to stay under GPT-4o's 128k token limit (1 token ≈ 4 chars)

**Source Relevance Re-Ranking:**
- After Pass 1: Re-rank sources based on which sections they support
- After Pass 2: Re-rank based on quality of extracted findings
- LLM-based relevance scoring (0.0-1.0) for each source-to-section mapping
- Dynamic top-N selection per section (not global top-N)

**Citation Density Requirements:**
- Minimum 3 citations per major claim in final report
- Track citation coverage: % of sources actually cited in output
- Ensure 50+ unique citations in final report (vs current 11)
- Citation distribution: Each section should cite multiple sources

**Quality Enhancements:**
- Confidence scoring: Each finding rated 0.0-1.0 based on source agreement
- Information gaps: Explicit section listing what wasn't answered
- Conflicting information: Present multiple viewpoints with citations
- Source quality indicators: Note authoritative vs general web sources

### Non-Functional Requirements

**Performance:**
- Total processing time: <1 hour (maintain current target)
- Pass 1: ~5 min, Pass 2: ~15 min, Pass 3: ~10 min, Pass 4: ~10 min
- Parallel operations where possible (source retrieval, LLM calls)
- Streaming updates to frontend for each pass

**Reliability:**
- Graceful degradation if full content unavailable (fall back to summary)
- Handle GPT-4o token limits by truncating oldest content first
- Retry logic for LLM failures (existing MAX_RETRIES: 2)
- Progress saved between passes (use LangGraph state)

**Maintainability:**
- Multi-pass prompts stored as documented templates in code
- Configuration clearly separated (SYNTHESIS_CONFIG in lib/config.ts)
- Content store abstraction (easy to swap in-memory → vector DB later)
- Clear state transitions in LangGraph workflow

## Visual Design

No visual changes to UI. Reuse existing components:
- `/app/search-display.tsx` - Add new phase indicators: "Pass 1: Overview", "Pass 2: Deep Dive", "Pass 3: Cross-Reference", "Pass 4: Final Synthesis"
- `/app/markdown-renderer.tsx` - No changes (already handles citations)
- `/app/citation-tooltip.tsx` - No changes
- Progress messaging shows current pass and what it's analyzing

## Reusable Components

### Existing Code to Leverage

**Core Infrastructure:**
- `/lib/langgraph-search-engine.ts` - LangGraph state machine patterns (SearchStateAnnotation with reducers, node definitions, conditional edges)
- `/lib/firecrawl.ts` - Already returns full markdown content in search results (lines 103-171)
- `/lib/config.ts` - Configuration patterns (SEARCH_CONFIG, MODEL_CONFIG)
- `/lib/context-processor.ts` - Keyword extraction (lines 47-62), relevance scoring (lines 121-138)

**State Management Patterns:**
- `Annotation.Root` with reducers for arrays (sources, queries) and single values
- Source deduplication by URL in reducer (lines 82-90 in langgraph-search-engine.ts)
- Event streaming via `eventCallback` for real-time UI updates
- LangGraph node structure: async functions returning `Partial<State>`

**Existing Summarization:**
- `/lib/context-processor.ts` summarizeSource() method (lines 288-361) - Keep for Pass 1
- Uses GPT-4o-mini for cost efficiency in overview pass
- Already calculates relevance scores (lines 366-425)

**Frontend Components:**
- `/app/search-display.tsx` - Phase indicators and progress display (37k lines)
- `/app/markdown-renderer.tsx` - Citation-aware markdown rendering
- `/app/citation-tooltip.tsx` - Interactive source tooltips

**Patterns to Maintain:**
- Temperature 0 for deterministic outputs (MODEL_CONFIG.TEMPERATURE)
- Streaming responses with `onChunk` callback
- Error handling with graceful degradation
- Retry logic with alternative strategies

### New Components Required

**Content Storage (lib/content-store.ts):**
- Store full scraped content alongside summaries
- Retrieve content by source URL with filtering
- In-memory implementation first (Map<url, fullContent>)
- Interface allows future swap to vector DB
- Cannot reuse: Current context-processor REPLACES content with summaries (line 344)

**Multi-Pass Synthesis (lib/multi-pass-synthesis.ts):**
- Orchestrate 4-pass synthesis pipeline
- Pass 1: Overview generation from summaries
- Pass 2: Deep dive with full content retrieval
- Pass 3: Cross-reference and validation
- Pass 4: Final report generation
- Cannot reuse: Current synthesis is single-pass only (lines 708-754 in langgraph-search-engine.ts)

**Citation Validator (lib/citation-validator.ts):**
- Track citation usage across report
- Validate minimum 3 citations per major section
- Calculate citation coverage (% of sources cited)
- Ensure 50+ unique citations in final output
- Cannot reuse: No existing citation tracking beyond inline [id] format

**Enhanced Context Processor (modify lib/context-processor.ts):**
- Add method: `selectTopSourcesPerSection(sources, outline, N)` for Pass 2
- Add method: `retrieveFullContent(sourceUrls)` using ContentStore
- Keep existing: summarizeSource() for Pass 1, relevance scoring
- Modification needed: Don't replace content with summaries, store both

**State Extension (modify lib/langgraph-search-engine.ts):**
- Add state fields: `multiPassState`, `synthesisOutline`, `citationMap`
- Add node: `multiPassSynthesizeNode` replaces existing `synthesize` node
- Keep existing: All other nodes (understand, plan, search, scrape, analyze)

## Technical Approach

### Architecture Overview

**Modified LangGraph Workflow:**
```
START → Understand → Plan → Search (24 queries) → Scrape → Analyze →
  Multi-Pass Synthesis (4 passes) → Complete → END
```

**New Multi-Pass Synthesis Node:**
```
analyze → multiPassSynthesize (with internal sub-states):
  - Pass1Overview (summaries only)
  - Pass2DeepDive (full content top 50-100)
  - Pass3CrossRef (validation)
  - Pass4Final (report generation)
→ complete
```

**State Structure Extensions:**
```typescript
// Extend existing SearchStateAnnotation
{
  // Existing fields (keep all)
  sources: Source[] // Now includes BOTH summary and fullContent
  processedSources: Source[] // Keep for backward compatibility

  // New fields for multi-pass synthesis
  multiPassState: {
    currentPass: 1 | 2 | 3 | 4
    outline: OutlineStructure | null
    deepDiveFindings: SectionFindings[] | null
    conflicts: ConflictReport[] | null
    informationGaps: string[] | null
  }

  citationMap: Map<sourceId, { url: string; usageCount: number }>

  // Full content storage (separate from summaries)
  fullContentStore: Map<url, string> // In-memory for MVP
}
```

**Source Object Structure (Enhanced):**
```typescript
interface Source {
  url: string
  title: string
  content?: string        // Summary (1000 chars) - for Pass 1
  fullContent?: string    // Complete markdown - for Pass 2
  quality?: number
  summary?: string        // Deprecated (merged into content)
  relevanceScores?: Map<sectionId, number> // Pass 1 output
}
```

### Database

No database for MVP. All state in-memory during processing.

**Content Store Implementation:**
- `Map<url, fullMarkdown>` in memory
- Populated during search/scrape phase (content already available from Firecrawl)
- Retrieved on-demand during Pass 2
- Cleared after synthesis complete

**Future Enhancement:** Supabase storage for completed reports with full content preserved.

### API

No new API routes. Reuse existing:
- `/app/search.ts` Server Action - No changes to signature
- Backend logic in `/lib/langgraph-search-engine.ts` - Add multi-pass synthesis node

### Frontend

**Progress Display (app/search-display.tsx):**
- Add phase indicators for multi-pass synthesis:
  - "Pass 1: Analyzing themes across 466 sources..."
  - "Pass 2: Deep diving into top 50 sources..."
  - "Pass 3: Validating findings and checking for conflicts..."
  - "Pass 4: Generating comprehensive report..."
- Show which section being analyzed in Pass 2
- Show conflicts detected in Pass 3

**Event Types (add to SearchEvent union):**
```typescript
| { type: 'multi-pass-phase'; pass: 1|2|3|4; message: string }
| { type: 'outline-generated'; outline: OutlineStructure }
| { type: 'deep-dive-section'; sectionName: string; sourcesUsed: number }
| { type: 'conflict-detected'; claim: string; sources: string[] }
| { type: 'citation-stats'; total: number; coverage: number }
```

### Configuration

**New SYNTHESIS_CONFIG (add to lib/config.ts):**
```typescript
export const SYNTHESIS_CONFIG = {
  // Multi-pass control
  ENABLE_MULTI_PASS: true,

  // Context limits (increased from 100k)
  MAX_TOTAL_CHARS: 400000,      // 4x increase (GPT-4o supports ~512k chars)
  MAX_CHARS_PER_SOURCE: 30000,  // 2x increase (for full content)
  MIN_CHARS_PER_SOURCE: 5000,   // 2.5x increase

  // Pass configuration
  PASS_1_SUMMARY_COUNT: -1,     // All sources (use summaries)
  PASS_2_FULL_CONTENT_COUNT: 50, // Top 50 sources (use full content)
  PASS_3_CROSS_REF_COUNT: 30,   // Top 30 for validation

  // Quality requirements
  MIN_CITATIONS_PER_SECTION: 3,
  MIN_TOTAL_CITATIONS: 50,
  TARGET_REPORT_LENGTH: 7500,   // ~5-10k words

  // Features
  ENABLE_CROSS_REFERENCE: true,
  ENABLE_FACT_CHECKING: true,
  ENABLE_CONFLICT_DETECTION: true,
  CONFIDENCE_THRESHOLD: 0.7,

  // Model settings for synthesis
  OVERVIEW_MODEL: "gpt-4o-mini", // Pass 1 (cost-effective)
  DEEPDIVE_MODEL: "gpt-4o",      // Pass 2-4 (high quality)
} as const;
```

### Testing

**Unit Tests (lib/__tests__/):**
- `content-store.test.ts` - Store, retrieve, handle missing content
- `multi-pass-synthesis.test.ts` - Each pass generates expected output
- `citation-validator.test.ts` - Citation counting, coverage calculation

**Integration Tests:**
- Test full pipeline with 466 sources (use existing eval data)
- Verify 50+ citations in output
- Verify information gaps section present
- Verify conflicts detected and presented

**Acceptance Criteria:**
- Report contains 50+ unique citations (vs current 11)
- Report length 5-10k words (vs current ~2k)
- Citation coverage >10% of total sources (vs current 2.4%)
- Processing time <1 hour
- All 466 sources' full content utilized (not discarded)
- Information gaps explicitly identified in dedicated section
- Conflicts presented with multiple citations

## Content Storage Architecture

### Interface Design (lib/content-store.ts)

```typescript
/**
 * Content Store Interface
 * Abstracts full content storage for future extensibility
 */
export interface IContentStore {
  // Store full content for a source
  store(url: string, fullContent: string): void;

  // Retrieve full content by URL
  retrieve(url: string): string | null;

  // Retrieve multiple sources by URLs
  retrieveBatch(urls: string[]): Map<string, string>;

  // Check if content exists
  has(url: string): boolean;

  // Get statistics
  getStats(): { totalSources: number; totalChars: number };

  // Clear all content (after synthesis complete)
  clear(): void;
}

/**
 * In-Memory Content Store (MVP Implementation)
 */
export class InMemoryContentStore implements IContentStore {
  private store: Map<string, string> = new Map();

  store(url: string, fullContent: string): void {
    this.store.set(url, fullContent);
  }

  retrieve(url: string): string | null {
    return this.store.get(url) || null;
  }

  retrieveBatch(urls: string[]): Map<string, string> {
    const results = new Map<string, string>();
    urls.forEach(url => {
      const content = this.retrieve(url);
      if (content) results.set(url, content);
    });
    return results;
  }

  has(url: string): boolean {
    return this.store.has(url);
  }

  getStats() {
    let totalChars = 0;
    this.store.forEach(content => totalChars += content.length);
    return {
      totalSources: this.store.size,
      totalChars
    };
  }

  clear(): void {
    this.store.clear();
  }
}
```

**Why In-Memory First:**
- Simple implementation (no dependencies)
- Fast retrieval (no I/O overhead)
- Sufficient for MVP (content cleared after each search)
- Easy to swap for vector DB later (same interface)

**Future: Vector Store (Post-MVP):**
- Replace with `VectorContentStore implements IContentStore`
- Use embeddings for semantic retrieval
- Enable multi-query retrieval for different aspects
- Persist across searches for caching

### Population Strategy

**During Search Phase (lib/langgraph-search-engine.ts, search node):**
```typescript
// Existing code at lines 388-393
const newSources: Source[] = results.data.map((r: SearchResult) => ({
  url: r.url,
  title: r.title,
  content: r.markdown || r.content || '', // This is FULL content
  quality: 0
}));

// NEW: Store full content separately
newSources.forEach(source => {
  if (source.content && source.content.length > 0) {
    contentStore.store(source.url, source.content); // Save full content
  }
});

// MODIFIED: Generate summary but keep full content reference
await Promise.all(newSources.map(async (source) => {
  const summary = await summarizeContent(source.content, searchQuery);
  source.content = summary; // Replace with summary for Pass 1
  // Full content preserved in contentStore
}));
```

**During Scrape Phase (lib/langgraph-search-engine.ts, scrape node):**
```typescript
// Existing code at lines 515-522
const scraped = await firecrawl.scrapeUrl(source.url, SEARCH_CONFIG.SCRAPE_TIMEOUT);
if (scraped.success && scraped.markdown) {
  const enrichedSource = {
    ...source,
    content: scraped.markdown, // Full content
    quality: scoreContent(scraped.markdown, state.query)
  };

  // NEW: Store full content
  contentStore.store(source.url, scraped.markdown);

  // Generate summary for Pass 1
  const summary = await summarizeContent(scraped.markdown, state.query);
  enrichedSource.content = summary; // Replace with summary
}
```

## Multi-Pass Synthesis Architecture

### Pass 1: Overview Generation (Summaries Only)

**Objective:** Generate structured outline identifying key themes

**Input:**
- All source summaries (~1000 chars each, 466 sources = ~466k chars)
- Original query
- Search queries executed

**Process:**
1. Concatenate all summaries (fit within 400k char limit)
2. LLM prompt: Analyze summaries to identify 5-8 major themes
3. Generate outline with sections and subsections
4. Map which sources are relevant to each section (relevance scores)

**Output:**
```typescript
interface OutlineStructure {
  sections: Array<{
    id: string
    title: string
    description: string
    relevantSources: Array<{ url: string; relevanceScore: number }>
    subsections?: Array<{ title: string; relevantSources: string[] }>
  }>
  overallTheme: string
}
```

**Prompt Template (lib/multi-pass-synthesis.ts):**
```typescript
const PASS1_OVERVIEW_PROMPT = `You are analyzing source summaries to create a structured outline for a comprehensive research report.

QUERY: {query}

SOURCE SUMMARIES (${sources.length} sources):
{allSummaries}

TASK:
1. Identify 5-8 major themes across all sources
2. Create a structured outline with sections and subsections
3. Map which sources support each section (use source URLs)
4. Assign relevance scores (0.0-1.0) for each source-to-section mapping

OUTPUT FORMAT (JSON):
{
  "sections": [
    {
      "id": "section_1",
      "title": "Main Theme 1",
      "description": "Brief description of what this section covers",
      "relevantSources": [
        { "url": "https://...", "relevanceScore": 0.9 },
        { "url": "https://...", "relevanceScore": 0.7 }
      ],
      "subsections": [
        { "title": "Subtopic A", "relevantSources": ["url1", "url2"] }
      ]
    }
  ],
  "overallTheme": "One sentence describing the overarching narrative"
}

GUIDELINES:
- Each section should have 5-15 relevant sources
- Relevance scores: 0.9+ (highly relevant), 0.7-0.9 (relevant), 0.5-0.7 (somewhat relevant)
- Subsections are optional but recommended for complex themes
- Focus on themes that can be supported by multiple sources (avoid single-source sections)
`;
```

### Pass 2: Deep Dive (Full Content for Top N)

**Objective:** Extract detailed findings from full content

**Input:**
- Outline from Pass 1
- Top 50-100 sources per section (by relevance score)
- Full content retrieved from ContentStore

**Process:**
1. For each section in outline:
   - Select top N sources (sorted by relevanceScore)
   - Retrieve full content from ContentStore
   - LLM prompt: Extract specific facts, quotes, data for this section
   - Cite every finding with [source_url]
2. Aggregate findings per section
3. Track which sources actually contributed citations

**Output:**
```typescript
interface SectionFindings {
  sectionId: string
  findings: Array<{
    claim: string
    citations: string[] // source URLs
    confidence: number
    evidence: string // extracted quote or data
  }>
  sourcesUsed: string[] // URLs of sources cited in this section
}
```

**Prompt Template:**
```typescript
const PASS2_DEEPDIVE_PROMPT = `You are extracting detailed findings from source content for a specific section of a research report.

SECTION: {sectionTitle}
DESCRIPTION: {sectionDescription}

FULL CONTENT FROM TOP SOURCES (${sources.length} sources, ~${totalChars} chars):
{fullContent}

TASK:
1. Extract 10-20 specific findings relevant to this section
2. Each finding must include:
   - Clear claim statement
   - Direct evidence (quote or data) from source content
   - Citation (source URL)
   - Confidence score (0.0-1.0)
3. Prioritize findings supported by multiple sources
4. Include specific numbers, dates, names when available

OUTPUT FORMAT (JSON):
{
  "findings": [
    {
      "claim": "Specific factual claim",
      "citations": ["https://source1.com", "https://source2.com"],
      "confidence": 0.9,
      "evidence": "Direct quote or data point from source content"
    }
  ]
}

CONFIDENCE SCORING:
- 0.9-1.0: Multiple authoritative sources agree
- 0.7-0.9: Single authoritative source or multiple general sources
- 0.5-0.7: Single general source or indirect evidence
- <0.5: Speculative or weak evidence

GUIDELINES:
- Cite EVERY claim with source URLs
- Extract exact quotes when possible (use "quotation marks")
- Include recency indicators for time-sensitive info (e.g., "as of 2024")
- If sources conflict, note that in claim (will be handled in Pass 3)
`;
```

**Section Processing:**
```typescript
async function processSection(
  section: OutlineSection,
  contentStore: IContentStore
): Promise<SectionFindings> {
  // Select top N sources for this section
  const topSources = section.relevantSources
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, SYNTHESIS_CONFIG.PASS_2_FULL_CONTENT_COUNT);

  // Retrieve full content
  const urls = topSources.map(s => s.url);
  const fullContentMap = contentStore.retrieveBatch(urls);

  // Build prompt with full content
  let fullContentText = '';
  let totalChars = 0;
  for (const [url, content] of fullContentMap) {
    const truncated = content.slice(0, SYNTHESIS_CONFIG.MAX_CHARS_PER_SOURCE);
    fullContentText += `\n\n--- SOURCE: ${url} ---\n${truncated}`;
    totalChars += truncated.length;

    // Stop if approaching token limit
    if (totalChars > SYNTHESIS_CONFIG.MAX_TOTAL_CHARS * 0.8) break;
  }

  // Call LLM with pass 2 prompt
  const response = await llm.invoke(/* PASS2_DEEPDIVE_PROMPT */);
  return JSON.parse(response);
}
```

### Pass 3: Cross-Reference and Validation

**Objective:** Validate findings, detect conflicts, identify gaps

**Input:**
- All section findings from Pass 2
- Top 30 sources for cross-referencing
- Full content from ContentStore

**Process:**
1. For each finding with confidence <0.8:
   - Check if other sources support or contradict
   - Upgrade confidence if multiple sources agree
   - Flag as conflict if sources disagree
2. Validate numerical claims across sources
3. Identify information gaps (questions not answered)

**Output:**
```typescript
interface ValidationReport {
  validatedFindings: Array<{
    originalFinding: Finding
    updatedConfidence: number
    supportingSources: string[]
    conflictDetected: boolean
    conflictDetails?: ConflictReport
  }>
  informationGaps: string[] // Questions that couldn't be answered
}

interface ConflictReport {
  claim: string
  viewpoint1: { claim: string; citations: string[] }
  viewpoint2: { claim: string; citations: string[] }
  resolution: "present_both" | "favor_viewpoint1" | "favor_viewpoint2"
}
```

**Prompt Template:**
```typescript
const PASS3_CROSSREF_PROMPT = `You are validating research findings by cross-referencing multiple sources.

FINDINGS TO VALIDATE (from Pass 2):
{findings}

ADDITIONAL SOURCES FOR CROSS-REFERENCE (${sources.length} sources):
{fullContent}

TASK:
1. For each finding, check if additional sources support or contradict it
2. Upgrade confidence if multiple sources agree
3. Flag conflicts when sources significantly disagree
4. Identify which questions couldn't be answered from sources

OUTPUT FORMAT (JSON):
{
  "validatedFindings": [
    {
      "findingId": "finding_1",
      "updatedConfidence": 0.95,
      "supportingSources": ["url3", "url4"],
      "conflictDetected": false
    },
    {
      "findingId": "finding_2",
      "updatedConfidence": 0.6,
      "conflictDetected": true,
      "conflictDetails": {
        "viewpoint1": { "claim": "X says A", "citations": ["url1"] },
        "viewpoint2": { "claim": "Y says B", "citations": ["url2"] },
        "resolution": "present_both"
      }
    }
  ],
  "informationGaps": [
    "Couldn't find information about specific timeline",
    "No sources addressed the cost implications"
  ]
}

CONFLICT DETECTION:
- Flag conflict if sources provide contradictory facts or numbers
- Flag conflict if one source says "yes" and another says "no"
- Do NOT flag different perspectives/opinions as conflicts
- Resolution strategy: "present_both" (show both viewpoints with citations)

CONFIDENCE UPGRADES:
- If 3+ sources agree: upgrade to 0.95
- If 2 sources agree: upgrade to 0.85
- If only 1 source but authoritative: keep at 0.75
- If sources conflict: downgrade to 0.6
`;
```

### Pass 4: Final Report Generation

**Objective:** Generate comprehensive markdown report

**Input:**
- Outline (Pass 1)
- Validated findings (Pass 3)
- All sources with citation map

**Process:**
1. Generate report section by section using validated findings
2. Ensure minimum 3 citations per major section
3. Include information gaps section
4. Add conflict notes where detected
5. Include confidence scores for major claims
6. Stream output to frontend

**Output:**
- Final markdown report (5-10k words)
- Citation map with usage counts

**Prompt Template:**
```typescript
const PASS4_FINAL_REPORT_PROMPT = `You are synthesizing validated research findings into a comprehensive report.

OUTLINE:
{outline}

VALIDATED FINDINGS:
{validatedFindings}

CONFLICTS DETECTED:
{conflicts}

INFORMATION GAPS:
{gaps}

TASK:
Generate a comprehensive research report in markdown format following this structure:

# {Query Title}

## Executive Summary
- 3-5 bullet points summarizing key findings
- Overall theme/conclusion

{For each section in outline:}
## {Section Title}

{Section content with:}
- Multiple paragraphs covering findings
- Minimum 3 citations per major claim using [url] format
- Confidence indicators for key claims: (High confidence), (Medium confidence), (Low confidence)
- Conflicting information presented as: "Source A reports X [url1], while Source B reports Y [url2]"
- Specific data, quotes, dates included

{End sections}

## Information Gaps

{List gaps from Pass 3:}
- Gap 1 description
- Gap 2 description

## Confidence Assessment

{For major findings:}
- Finding X: High confidence (0.95) - Supported by 5 authoritative sources
- Finding Y: Medium confidence (0.70) - Supported by 2 sources, limited data available

FORMATTING RULES:
1. Use markdown: ##, ###, **, -, `code`
2. Every factual claim must have citation [url]
3. Include confidence indicators where relevant
4. Present conflicts transparently (don't hide disagreements)
5. Use specific numbers, dates, names (not vague terms)
6. Target length: 5,000-10,000 words
7. Ensure 50+ unique citations distributed across report

TONE:
- Professional, objective, evidence-based
- Clear and accessible (avoid jargon unless necessary)
- Transparent about limitations and conflicts
`;
```

**Streaming Implementation:**
```typescript
async function generateFinalReport(
  outline: OutlineStructure,
  validatedFindings: ValidationReport,
  onChunk: (chunk: string) => void
): Promise<string> {
  let fullReport = '';

  // Stream from GPT-4o
  const stream = await streamingLLM.stream([
    new SystemMessage(PASS4_FINAL_REPORT_PROMPT),
    new HumanMessage(JSON.stringify({ outline, validatedFindings }))
  ]);

  for await (const chunk of stream) {
    const content = chunk.content as string;
    fullReport += content;
    onChunk(content); // Stream to frontend
  }

  return fullReport;
}
```

## Citation Validation Architecture

### Citation Tracker (lib/citation-validator.ts)

```typescript
/**
 * Citation Validator
 * Tracks citation usage and ensures quality requirements
 */
export class CitationValidator {
  private citationMap: Map<string, CitationUsage> = new Map();

  interface CitationUsage {
    url: string
    title: string
    usageCount: number
    sections: string[] // Which sections cited this source
  }

  /**
   * Register a citation from the report
   */
  addCitation(url: string, sectionId: string, title?: string): void {
    if (!this.citationMap.has(url)) {
      this.citationMap.set(url, {
        url,
        title: title || url,
        usageCount: 0,
        sections: []
      });
    }

    const citation = this.citationMap.get(url)!;
    citation.usageCount++;
    if (!citation.sections.includes(sectionId)) {
      citation.sections.push(sectionId);
    }
  }

  /**
   * Parse report markdown and extract all [url] citations
   */
  parseReportCitations(reportMarkdown: string): void {
    const citationRegex = /\[(https?:\/\/[^\]]+)\]/g;
    let match;
    let currentSection = 'intro';

    // Track sections via ## headers
    const lines = reportMarkdown.split('\n');
    lines.forEach(line => {
      if (line.startsWith('## ')) {
        currentSection = line.replace('## ', '').toLowerCase();
      }

      // Find citations in line
      while ((match = citationRegex.exec(line)) !== null) {
        this.addCitation(match[1], currentSection);
      }
    });
  }

  /**
   * Validate citation requirements
   */
  validate(): ValidationResult {
    const totalCitations = this.citationMap.size;
    const totalUsages = Array.from(this.citationMap.values())
      .reduce((sum, c) => sum + c.usageCount, 0);

    const sectionCounts = new Map<string, number>();
    this.citationMap.forEach(citation => {
      citation.sections.forEach(section => {
        sectionCounts.set(section, (sectionCounts.get(section) || 0) + 1);
      });
    });

    return {
      totalUniqueCitations: totalCitations,
      totalUsages,
      meetsMinimum: totalCitations >= SYNTHESIS_CONFIG.MIN_TOTAL_CITATIONS,
      citationCoverage: totalCitations / allSourcesCount,
      sectionsWithLowCitations: Array.from(sectionCounts.entries())
        .filter(([_, count]) => count < SYNTHESIS_CONFIG.MIN_CITATIONS_PER_SECTION)
        .map(([section, _]) => section),
      recommendations: this.generateRecommendations(totalCitations, sectionCounts)
    };
  }

  /**
   * Generate recommendations for improving citation quality
   */
  private generateRecommendations(
    totalCitations: number,
    sectionCounts: Map<string, number>
  ): string[] {
    const recommendations: string[] = [];

    if (totalCitations < SYNTHESIS_CONFIG.MIN_TOTAL_CITATIONS) {
      recommendations.push(
        `Add ${SYNTHESIS_CONFIG.MIN_TOTAL_CITATIONS - totalCitations} more citations to meet minimum of ${SYNTHESIS_CONFIG.MIN_TOTAL_CITATIONS}`
      );
    }

    sectionCounts.forEach((count, section) => {
      if (count < SYNTHESIS_CONFIG.MIN_CITATIONS_PER_SECTION) {
        recommendations.push(
          `Section "${section}" has only ${count} citation(s), needs ${SYNTHESIS_CONFIG.MIN_CITATIONS_PER_SECTION - count} more`
        );
      }
    });

    return recommendations;
  }

  /**
   * Get citation statistics
   */
  getStats() {
    return {
      totalUniqueCitations: this.citationMap.size,
      mostCitedSources: Array.from(this.citationMap.values())
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10),
      citationDistribution: this.getCitationDistribution()
    };
  }

  private getCitationDistribution(): Map<string, number> {
    const distribution = new Map<string, number>();
    this.citationMap.forEach(citation => {
      citation.sections.forEach(section => {
        distribution.set(section, (distribution.get(section) || 0) + 1);
      });
    });
    return distribution;
  }
}
```

## Enhanced Context Processor Integration

### Modifications to lib/context-processor.ts

**Current Issue (Line 344):**
```typescript
// PROBLEM: Full content is REPLACED with summary
content: summary, // <-- Original content lost
```

**Solution: Store both summary and full content**
```typescript
// MODIFIED: Keep both summary and full content
export interface ProcessedSource extends Source {
  content: string;        // Summary (1000 chars) - for Pass 1
  fullContent?: string;   // Original content - for Pass 2+
  relevanceScore: number;
  extractedSections: string[];
  keywords: string[];
  summarized?: boolean;
}

// In summarizeSource method (lines 288-361):
private async summarizeSource(
  source: Source,
  query: string,
  searchQueries: string[],
  targetLength: number,
  _onProgress?: (message: string, sourceUrl?: string) => void
): Promise<ProcessedSource> {
  // ... existing summarization logic ...

  return {
    ...source,
    content: summary,        // Summary for Pass 1
    fullContent: source.content, // PRESERVE original for Pass 2+
    relevanceScore,
    extractedSections: [summary],
    keywords: this.extractKeywords(query, searchQueries),
    summarized: true
  };
}
```

**New Methods to Add:**

```typescript
/**
 * Select top N sources per section for Pass 2 deep dive
 */
async selectTopSourcesPerSection(
  sources: ProcessedSource[],
  outline: OutlineStructure,
  N: number = SYNTHESIS_CONFIG.PASS_2_FULL_CONTENT_COUNT
): Promise<Map<string, ProcessedSource[]>> {
  const sectionSources = new Map<string, ProcessedSource[]>();

  outline.sections.forEach(section => {
    // Get sources relevant to this section
    const relevantSources = sources
      .filter(s => section.relevantSources.some(rs => rs.url === s.url))
      .sort((a, b) => {
        const scoreA = section.relevantSources.find(rs => rs.url === a.url)?.relevanceScore || 0;
        const scoreB = section.relevantSources.find(rs => rs.url === b.url)?.relevanceScore || 0;
        return scoreB - scoreA;
      })
      .slice(0, N);

    sectionSources.set(section.id, relevantSources);
  });

  return sectionSources;
}

/**
 * Retrieve full content for sources (from ContentStore or fallback)
 */
retrieveFullContent(
  sources: ProcessedSource[],
  contentStore: IContentStore
): ProcessedSource[] {
  return sources.map(source => {
    // Try to get from ContentStore first
    let fullContent = contentStore.retrieve(source.url);

    // Fallback to source.fullContent if not in store
    if (!fullContent && source.fullContent) {
      fullContent = source.fullContent;
    }

    // If still no full content, use summary
    if (!fullContent) {
      fullContent = source.content || '';
    }

    return {
      ...source,
      fullContent
    };
  });
}
```

## LangGraph State and Node Integration

### State Extension (modify lib/langgraph-search-engine.ts)

**Add to SearchStateAnnotation (lines 55-151):**
```typescript
// Add after existing fields
multiPassState: Annotation<{
  currentPass: 1 | 2 | 3 | 4;
  outline: OutlineStructure | null;
  deepDiveFindings: SectionFindings[] | null;
  validationReport: ValidationReport | null;
  informationGaps: string[] | null;
} | null>({
  reducer: (_, y) => y,
  default: () => null
}),

citationMap: Annotation<Map<string, CitationUsage>>({
  reducer: (_, y) => y ?? new Map(),
  default: () => new Map()
}),

fullContentStore: Annotation<IContentStore>({
  reducer: (_, y) => y ?? new InMemoryContentStore(),
  default: () => new InMemoryContentStore()
})
```

### New Synthesis Node (replace existing synthesize node)

**Remove lines 708-754 (current single-pass synthesis)**

**Add new multi-pass node:**
```typescript
.addNode("multiPassSynthesize", async (state: SearchState, config?: GraphConfig): Promise<Partial<SearchState>> => {
  const eventCallback = config?.configurable?.eventCallback;
  const contentStore = state.fullContentStore;
  const sourcesToUse = state.processedSources || state.sources || [];

  if (eventCallback) {
    eventCallback({
      type: 'phase-update',
      phase: 'synthesizing',
      message: 'Multi-pass synthesis starting...'
    });
  }

  try {
    // PASS 1: Overview Generation
    if (eventCallback) {
      eventCallback({
        type: 'multi-pass-phase',
        pass: 1,
        message: `Analyzing themes across ${sourcesToUse.length} sources...`
      });
    }

    const outline = await generateOutline(
      state.query,
      sourcesToUse, // Uses summaries only
      state.context
    );

    if (eventCallback) {
      eventCallback({
        type: 'outline-generated',
        outline
      });
    }

    // PASS 2: Deep Dive
    if (eventCallback) {
      eventCallback({
        type: 'multi-pass-phase',
        pass: 2,
        message: 'Deep diving into top sources...'
      });
    }

    const deepDiveFindings: SectionFindings[] = [];
    for (const section of outline.sections) {
      if (eventCallback) {
        eventCallback({
          type: 'deep-dive-section',
          sectionName: section.title,
          sourcesUsed: section.relevantSources.length
        });
      }

      const findings = await processSection(
        section,
        contentStore,
        sourcesToUse
      );
      deepDiveFindings.push(findings);
    }

    // PASS 3: Cross-Reference
    if (eventCallback) {
      eventCallback({
        type: 'multi-pass-phase',
        pass: 3,
        message: 'Validating findings and checking for conflicts...'
      });
    }

    const validationReport = await validateFindings(
      deepDiveFindings,
      contentStore,
      sourcesToUse
    );

    if (validationReport.conflicts.length > 0 && eventCallback) {
      validationReport.conflicts.forEach(conflict => {
        eventCallback({
          type: 'conflict-detected',
          claim: conflict.claim,
          sources: [...conflict.viewpoint1.citations, ...conflict.viewpoint2.citations]
        });
      });
    }

    // PASS 4: Final Report
    if (eventCallback) {
      eventCallback({
        type: 'multi-pass-phase',
        pass: 4,
        message: 'Generating comprehensive report...'
      });
    }

    const finalReport = await generateFinalReport(
      outline,
      validationReport,
      state.query,
      (chunk) => {
        if (eventCallback) {
          eventCallback({ type: 'content-chunk', chunk });
        }
      },
      state.context
    );

    // Validate citations
    const citationValidator = new CitationValidator();
    citationValidator.parseReportCitations(finalReport);
    const citationStats = citationValidator.validate();

    if (eventCallback) {
      eventCallback({
        type: 'citation-stats',
        total: citationStats.totalUniqueCitations,
        coverage: citationStats.citationCoverage
      });
    }

    // Generate follow-up questions
    const followUpQuestions = await generateFollowUpQuestions(
      state.query,
      finalReport,
      sourcesToUse,
      state.context
    );

    return {
      finalAnswer: finalReport,
      followUpQuestions,
      multiPassState: {
        currentPass: 4,
        outline,
        deepDiveFindings,
        validationReport,
        informationGaps: validationReport.informationGaps
      },
      citationMap: citationValidator.citationMap,
      phase: 'complete' as SearchPhase
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Multi-pass synthesis failed',
      errorType: 'llm' as ErrorType,
      phase: 'error' as SearchPhase
    };
  }
})
```

### Workflow Edge Update

**Modify conditional edge (lines 854-865):**
```typescript
.addConditionalEdges(
  "analyze",
  (state: SearchState) => {
    if (state.phase === 'error') return "handleError";
    if (state.phase === 'planning') return "plan";  // Retry with new searches
    return "multiPassSynthesize"; // CHANGED from "synthesize"
  },
  {
    handleError: "handleError",
    plan: "plan",
    multiPassSynthesize: "multiPassSynthesize" // CHANGED
  }
)
.addConditionalEdges(
  "multiPassSynthesize", // CHANGED
  (state: SearchState) => state.phase === 'error' ? "handleError" : "complete",
  {
    handleError: "handleError",
    complete: "complete"
  }
)
```

## Prompt Templates (Complete)

All prompts documented in Multi-Pass Synthesis Architecture section above:
- PASS1_OVERVIEW_PROMPT (lines for outline generation)
- PASS2_DEEPDIVE_PROMPT (lines for section-specific extraction)
- PASS3_CROSSREF_PROMPT (lines for validation and conflict detection)
- PASS4_FINAL_REPORT_PROMPT (lines for final synthesis)

**Storage Location:**
- Stored as constants in `/lib/multi-pass-synthesis.ts`
- Version controlled in git for audit trail
- Easy to modify based on quality feedback

## Out of Scope

**Not Included in Initial Implementation:**
- Vector database (use in-memory Map first, interface allows swap later)
- GPT-4o Long Output mode with 64k token output (keep standard GPT-4o with 16k output)
- Embeddings-based semantic retrieval (use LLM-based relevance scoring first)
- Report versioning or comparison across multiple searches
- Persistent storage of reports (in-memory only, cleared after search)
- Multi-modal content analysis (images, tables) - text only
- Automated re-ranking with ML models (use rule-based scoring)
- Custom section templates (use fixed structure from Pass 1)
- Interactive outline editing (system-generated only)
- Real-time collaboration on reports (single-user, one-shot)
- Export to PDF/Word (markdown only, copy/paste to external tools)

**Future Enhancements:**
- Vector database integration (Pinecone, Weaviate, or Supabase pgvector)
- Embeddings for semantic similarity (OpenAI text-embedding-3-small)
- Report persistence with Supabase (store outline, findings, final report)
- Multi-query retrieval (find different aspects of topic)
- Incremental updates (re-run synthesis with new sources)
- Custom prompt templates per domain (research vs compliance vs analysis)
- Confidence threshold tuning per use case
- Report comparison (diff between searches)
- Source quality scoring (domain authority, recency, consistency)

## Success Criteria

**MVP Complete When:**
- Final reports contain 50+ unique citations (vs current 11)
- Report length averages 5-10k words (vs current ~2k)
- Citation coverage >10% of total sources processed (vs current 2.4%)
- Processing time remains <1 hour per search
- All scraped sources' full content utilized in Pass 2 (not discarded)
- Information gaps explicitly identified in dedicated section
- Conflicting information presented transparently with citations from both sides
- Confidence scores included for major findings
- Multi-pass synthesis completes all 4 passes without errors

**Quality Indicators:**
- Pass 1 generates outline with 5-8 sections covering all major themes
- Pass 2 extracts 10-20 findings per section with specific evidence
- Pass 3 detects and flags conflicts when sources disagree
- Pass 4 produces coherent narrative integrating validated findings
- Citations distributed across report (not clustered in one section)
- Each section has minimum 3 citations
- Information gaps section lists specific missing information
- Confidence scores correlate with source agreement (high confidence = multiple sources)

**Acceptance Tests:**

*Test 1: Citation Quantity (Current: 11 → Target: 50+)*
- Input: Any complex query (e.g., "deepseek r1 capabilities and performance benchmarks")
- Expected: Final report cites 50+ unique sources
- Measurement: Count unique URLs in [url] citations

*Test 2: Report Length (Current: ~2k words → Target: 5-10k words)*
- Input: Same query as Test 1
- Expected: Report contains 5,000-10,000 words
- Measurement: Word count of final markdown output

*Test 3: Citation Coverage (Current: 2.4% → Target: >10%)*
- Input: Search with 466 sources
- Expected: At least 47 sources (10%) cited in final report
- Measurement: Unique cited sources / total sources

*Test 4: Full Content Utilization (Current: Discarded → Target: Used)*
- Input: Any query
- Expected: Pass 2 retrieves full content for top 50 sources from ContentStore
- Measurement: ContentStore.getStats() shows retrieval calls in logs

*Test 5: Information Gaps Identification*
- Input: Query on topic with incomplete public information
- Expected: Information Gaps section lists specific missing data
- Measurement: Final report contains "## Information Gaps" section with items

*Test 6: Conflict Detection*
- Input: Query on controversial topic with disagreeing sources
- Expected: Conflicts flagged in Pass 3, presented in Pass 4 with citations from both sides
- Measurement: Report contains "Source A reports X [url1], while Source B reports Y [url2]"

*Test 7: Processing Time*
- Input: Any complex query
- Expected: Total time <1 hour
- Measurement: Time from start to "complete" phase

*Test 8: Confidence Scoring*
- Input: Any query
- Expected: Major findings include confidence indicators
- Measurement: Report contains "(High confidence)", "(Medium confidence)" annotations

## Implementation Guidance

### Phase 1: Content Storage (Week 1)

1. Create `/lib/content-store.ts` with `IContentStore` interface and `InMemoryContentStore` implementation
2. Modify `/lib/langgraph-search-engine.ts`:
   - Add `fullContentStore` to state annotation
   - Modify search node: Store full content in ContentStore before summarization
   - Modify scrape node: Store scraped content in ContentStore
3. Modify `/lib/context-processor.ts`:
   - Update `ProcessedSource` interface to include `fullContent` field
   - Modify `summarizeSource()` to preserve original content
4. Test: Verify ContentStore populates during search, content retrievable

### Phase 2: Pass 1 - Overview (Week 1-2)

1. Create `/lib/multi-pass-synthesis.ts` with `PASS1_OVERVIEW_PROMPT`
2. Implement `generateOutline()` function:
   - Concatenate all summaries
   - Call GPT-4o-mini with prompt
   - Parse JSON output into `OutlineStructure`
3. Add `multiPassState.outline` to state
4. Test: Verify outline generated with 5-8 sections, sources mapped by relevance

### Phase 3: Pass 2 - Deep Dive (Week 2)

1. Add `PASS2_DEEPDIVE_PROMPT` to `/lib/multi-pass-synthesis.ts`
2. Implement `processSection()` function:
   - Select top N sources by relevance
   - Retrieve full content from ContentStore
   - Call GPT-4o with prompt per section
   - Parse findings with citations
3. Add context processor method: `selectTopSourcesPerSection()`
4. Test: Verify full content retrieved, findings extracted with citations

### Phase 4: Pass 3 - Validation (Week 2-3)

1. Add `PASS3_CROSSREF_PROMPT` to `/lib/multi-pass-synthesis.ts`
2. Implement `validateFindings()` function:
   - Cross-reference findings against additional sources
   - Detect conflicts (contradictory claims)
   - Upgrade/downgrade confidence scores
   - Identify information gaps
3. Add `multiPassState.validationReport` to state
4. Test: Verify conflicts detected, confidence scores updated

### Phase 5: Pass 4 - Final Report (Week 3)

1. Add `PASS4_FINAL_REPORT_PROMPT` to `/lib/multi-pass-synthesis.ts`
2. Implement `generateFinalReport()` function:
   - Stream output with GPT-4o
   - Include outline structure
   - Integrate validated findings
   - Add information gaps section
3. Test: Verify report generated, streaming works, gaps included

### Phase 6: Citation Validation (Week 3-4)

1. Create `/lib/citation-validator.ts` with `CitationValidator` class
2. Implement citation parsing from markdown
3. Implement validation logic (min citations, coverage)
4. Integrate into Pass 4 final report generation
5. Test: Verify 50+ citations counted, coverage calculated

### Phase 7: Integration & Config (Week 4)

1. Add `SYNTHESIS_CONFIG` to `/lib/config.ts`
2. Replace `synthesize` node with `multiPassSynthesize` node in workflow
3. Update conditional edges to route to new node
4. Add event types for multi-pass phases
5. Update `/app/search-display.tsx` to show pass indicators
6. Test: End-to-end with real query, verify all passes execute

### Phase 8: Testing & Optimization (Week 4-5)

1. Write unit tests for each pass
2. Write integration tests for full pipeline
3. Performance profiling (identify bottlenecks)
4. Optimize token usage (stay under 128k limit)
5. Validate against acceptance criteria
6. Fix bugs, refine prompts based on quality

### Development Notes

**Token Budget Management:**
- GPT-4o: 128k input tokens ≈ 512k chars
- Current MAX_TOTAL_CHARS: 100k → New: 400k (still 78% of limit)
- Reserve 25% for prompts, system messages, JSON structure
- Monitor token usage per pass, truncate oldest content if approaching limit

**Error Handling:**
- If ContentStore empty (no full content): Fall back to summaries
- If Pass 2 fails: Skip to Pass 4 with Pass 1 outline only
- If LLM returns invalid JSON: Retry with explicit format instruction
- If citation count <50: Warn in report, don't fail synthesis

**Performance Tips:**
- Pass 1: Batch all summaries (single LLM call)
- Pass 2: Parallelize section processing where possible
- Pass 3: Only validate findings with confidence <0.8 (skip high-confidence)
- Pass 4: Stream output for better UX (don't wait for complete report)

**Debugging:**
- Log ContentStore stats at each phase (console output)
- Log token usage per LLM call
- Log citation counts after Pass 4
- Save intermediate outputs (outline, findings) to state for inspection

### File Structure Summary

**New Files:**
```
/lib/content-store.ts              (150 lines)
/lib/multi-pass-synthesis.ts       (800 lines)
/lib/citation-validator.ts         (200 lines)
```

**Modified Files:**
```
/lib/config.ts                     (add SYNTHESIS_CONFIG, ~50 lines)
/lib/context-processor.ts          (add methods, modify ProcessedSource, ~100 lines)
/lib/langgraph-search-engine.ts    (replace synthesize node, ~200 lines changed)
/app/search-display.tsx            (add multi-pass phase display, ~50 lines)
```

**Total New Code:** ~1,400 lines
**Total Modified:** ~400 lines

---

**Implementation Timeline:** 4-5 weeks for full MVP
**Technical Risk:** Medium (LLM output parsing, token budget management)
**User Impact:** High (10x increase in report quality and citation depth)
