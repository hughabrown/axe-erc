# Initial Spec Idea

## User's Initial Description
Implement a hybrid RAG approach with the following optimizations to create well-researched, robust reports similar to Claude Deep Research outputs:

**Problem**: Current search engine returns short reports (11 citations) despite processing 466 sources over 30 minutes because aggressive summarization (1000 chars/source) discards full content and synthesis only sees surface-level summaries.

**Solution - Hybrid RAG + Multi-Pass Synthesis**:

1. **Dual Storage System**:
   - Keep summaries for broad context (current approach)
   - Store full scraped content separately (vector DB or file-based)
   - Enable dynamic retrieval during synthesis

2. **Multi-Pass Synthesis Pipeline**:
   - Pass 1: Quick overview from summaries (identify key themes)
   - Pass 2: Deep dive into top N sources with full content
   - Pass 3: Cross-reference and fact-checking
   - Pass 4: Final synthesis with comprehensive citations

3. **Context Window Optimization**:
   - Increase MAX_TOTAL_CHARS from 100k → 400k
   - Smart content selection (full text for top 50, summaries for rest)
   - Use GPT-4o's full 128k token capacity

4. **Quality Enhancements (Match Claude Deep Research)**:
   - Source relevance scoring with re-ranking
   - Multi-query retrieval (find different aspects)
   - Citation density requirements (min N citations per claim)
   - Confidence scoring for each finding
   - Explicit 'information gaps' section

**Expected Outcomes**:
- Before: 11 citations, short report (~2k words)
- After: 50+ citations, comprehensive report (~5-10k words)
- Quality: Match Claude Deep Research depth and citation density
- Performance: Similar time (30 min), better utilization of scraped content

**Technical Implementation**:
- New: lib/vector-store.ts, lib/multi-pass-synthesis.ts, lib/citation-validator.ts
- Modified: langgraph-search-engine.ts, context-processor.ts, config.ts
- Firecrawl integration already working (no changes needed)

## Metadata
- Date Created: 2025-10-23
- Spec Name: hybrid-rag-multi-pass-synthesis
- Spec Path: agent-os/specs/2025-10-23-hybrid-rag-multi-pass-synthesis
