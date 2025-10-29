# Requirements: HRDD Search Optimization

## Problem Statement

The HRDD workflow's search strategy is inefficient, consuming excessive Firecrawl API credits while generating queries that yield redundant or zero results. The SAAB Sweden assessment demonstrated:

- 466 sources retrieved (far exceeding useful information threshold)
- **82 PDFs (17.6% of sources) consuming 1,640-4,100 credits for PDF parsing** (1 credit per page)
- 34-minute processing time
- Queries with product-specific terms that don't exist publicly (e.g., "Metis Chip Down Design Sigma Connectivity")
- Hardcoded year constraints (2024) that miss current and historical data
- No query deduplication despite similar queries being generated
- **All 466 sources showed 0 content length in audit trail** - indicating parsing failures or content not being stored

## Core Requirements

### 1. Reduce Query Volume Per Risk Factor
**Current**: MAX_QUERIES_PER_FACTOR = 20 queries per risk factor (Geographic, Customer, End-Use)
**Target**: 8 queries per risk factor (55% reduction)
**Rationale**: Analysis shows diminishing returns after 8 well-crafted queries

**Affected Files**:
- `lib/hrdd-config.ts` - Update MAX_QUERIES_PER_FACTOR
- `lib/hrdd-prompts.ts` - Update all query generation prompts (Geographic, Customer, End-Use) from "15-20 queries" to "6-8 queries"

### 2. Remove Product/Customer Names from End-Use Queries
**Current**: End-use query generation includes specific product names and customer names from dossier
**Target**: Extract generic technical concepts only, excluding proprietary/project-specific identifiers
**Rationale**: Unrealized sales opportunities have no public search results; generic terms find regulatory frameworks and similar systems

**Example**:
- ❌ BAD: "Metis Chip Down Design Sigma Connectivity dual-use export regulations"
- ✅ GOOD: "chip down design military drone navigation dual-use export controls"

**Affected Files**:
- `lib/hrdd-prompts.ts` - Update END_USE_QUERY_GENERATION_PROMPT (lines 561-616)

### 3. Use Firecrawl's `tbs` Parameter for Time Filtering
**Current**: Queries include hardcoded years (e.g., "2024 Freedom House score", "2020-2024 violations")
**Target**: Remove year constraints from queries, use Firecrawl's `tbs` parameter instead
**Rationale**:
- Current year changes (2024 → 2025) make queries stale
- Historical data (e.g., company founded 2018) gets excluded
- `tbs` parameter provides flexible time filtering without polluting query text

**Firecrawl `tbs` Options**:
- `qdr:h` - Last hour
- `qdr:d` - Last day
- `qdr:w` - Last week
- `qdr:m` - Last month
- `qdr:y` - Last year
- Custom: `qdr:y3` - Last 3 years

**Affected Files**:
- `lib/hrdd-risk-factors.ts` - Add `tbs` parameter to Firecrawl search calls (Geographic: `qdr:y`, Customer adverse media: custom 3-year range, End-Use: no filter)
- `lib/hrdd-prompts.ts` - Remove year-related instructions from Geographic and Customer query generation prompts

### 4. Add Query Deduplication
**Current**: No deduplication - similar queries execute separately
**Target**: Normalize and deduplicate queries before execution (case-insensitive, whitespace-normalized)
**Rationale**: LLM may generate semantically similar queries; deduplication prevents redundant API calls

**Affected Files**:
- `lib/hrdd-risk-factors.ts` - Add deduplication logic after query generation in all 3 assessment functions

### 5. Reduce Preliminary Screening Query Limits
**Current**: Sanctions checks use `limit: 5` sources per query
**Target**: Reduce to `limit: 3` sources per query
**Rationale**: Sanctions are binary (sanctioned or not); if not in top 3 results from OFAC/UN/EU sites, entity is not sanctioned

**Affected Files**:
- `lib/hrdd-preliminary-screening.ts` - Update limit parameter (lines 186, 352)

### 6. Fix Audit Trail Logging
**Current**: Only preliminary screening queries logged to audit trail; Enhanced DD queries (Geographic, Customer, End-Use) not logged
**Target**: Log ALL queries to audit trail for complete observability
**Rationale**: Complete audit trail enables diagnosis of wasteful queries in production

**Affected Files**:
- `lib/hrdd-risk-factors.ts` - Add audit entry creation after each search in all 3 assessment functions (mimic pattern from hrdd-preliminary-screening.ts:201-213)

### 7. Add PDF Exclusion Filter (CRITICAL - Highest Impact)
**Current**: 82 PDFs retrieved in SAAB assessment (17.6% of sources), consuming 1,640-4,100 credits
**Target**: Exclude PDF files from search results using Firecrawl's `excludeUrlPatterns` parameter
**Rationale**:
- PDFs cost 1 credit PER PAGE (vs 1 credit per HTML scrape)
- Many PDFs are structured data (sanctions lists) that don't parse well to markdown
- Long reports (50+ pages) consume 50+ credits each with minimal useful content
- Example: Treasury.gov OFAC PDFs are 100+ page database dumps
- **This single change saves ~1,640-4,100 credits per assessment**

**Affected Files**:
- `lib/hrdd-risk-factors.ts` - Add `excludeUrlPatterns` to all search calls
- `lib/hrdd-preliminary-screening.ts` - Add `excludeUrlPatterns` to sanctions/jurisdiction searches
- `lib/firecrawl.ts` - Update search method signature to support `excludeUrlPatterns` and `ignoreInvalidURLs`

### 8. Use Structured APIs for Sanctions Data
**Current**: Queries find Treasury.gov PDF files (sdnew12.pdf, sdnew07.pdf) that are 100+ pages
**Target**: Direct queries to HTML search interfaces instead of PDF downloads
**Rationale**:
- Interactive search pages return targeted results, not entire databases
- HTML parses reliably to markdown, PDFs often fail
- Example: sanctionssearch.ofac.treas.gov (HTML) vs treasury.gov/ofac/downloads (PDFs)

**Affected Files**:
- `lib/hrdd-prompts.ts` - Update SANCTIONS_CHECK_PROMPT and CUSTOMER_QUERY_GENERATION_PROMPT to avoid PDF-heavy paths
- `config/hrdd-sources.json` - Add `exclude_paths` configuration for PDF-heavy domains

### 9. Add Domain-Specific PDF Handling
**Current**: Queries don't distinguish between HTML reports and PDF downloads from same domain
**Target**: Configure preferred paths for each source domain (e.g., /country/ pages, not /documents/)
**Rationale**:
- Amnesty.org: 10 PDFs retrieved, but /en/countries/ HTML pages have same info
- SAAB.com: 8 PDFs retrieved (annual reports), but /sustainability/ pages summarize key info
- Freedom House: HTML country pages are better than PDF annual reports

**Affected Files**:
- `config/hrdd-sources.json` - Add `preferred_paths` and `exclude_paths` for each source
- `lib/hrdd-prompts.ts` - Update all query generation prompts with PDF avoidance instructions

### 10. Monitor PDF Retrieval in Audit Trail
**Current**: Audit trail doesn't track PDFs vs HTML, making credit waste invisible
**Target**: Log PDF count, estimated credits per query in audit trail
**Rationale**: Future audits should immediately show PDF retrieval patterns for diagnosis

**Affected Files**:
- `lib/hrdd-risk-factors.ts` - Add `isPdf`, `pdfCount`, `estimatedPdfCredits` to audit entries
- `lib/hrdd-state.ts` - Update AuditEntry type to include PDF tracking fields

## Non-Functional Requirements

### Performance
- **Target**: Reduce assessment time from 30-40 minutes to 12-15 minutes (60% improvement)
- **Credit Usage**: Reduce from ~660 sources to ~250 sources per assessment (62% reduction)

### Quality
- **Maintain**: Existing risk classification accuracy
- **Improve**: Eliminate zero-result queries from over-specific terms
- **Improve**: Better temporal coverage with flexible time filtering

### Observability
- **Complete audit trail**: All queries logged with phase, timestamp, and result count
- **Enable diagnosis**: Future credit usage analysis should see all executed queries

## Out of Scope

- Changing risk classification logic or thresholds
- Modifying preliminary screening criteria (weapons, sanctions, jurisdiction)
- Altering report synthesis or final output format
- Changing Firecrawl client implementation (lib/firecrawl.ts)
- Modifying LangGraph workflow structure (lib/hrdd-workflow-engine.ts)

## Success Metrics

### Quantitative
1. **Queries per assessment**: 66 → 30 queries (55% reduction)
2. **Sources per assessment**: 660 → 250 sources (62% reduction)
3. **PDF sources per assessment**: 82 → 0 PDFs (100% elimination)
4. **Credit usage per assessment**: ~5,000-7,000 → ~250 credits (**95% reduction**)
5. **Processing time**: 30-40 min → 12-15 min (60% improvement)
6. **Zero-result queries**: Current: ~5-10 per assessment → Target: 0
7. **Duplicate queries**: Current: ~3-5 per assessment → Target: 0

### Qualitative
1. **Audit trail completeness**: 100% of queries logged (currently ~8% logged)
2. **Query relevance**: 100% of queries use terms with public search results (no proprietary product names)
3. **Temporal coverage**: Queries find current year + historical data (not limited to 2024)
4. **Content parsing success**: 100% of sources have non-zero content (currently 0%)

## Implementation Priority

### Critical Priority (Immediate 95% Impact)
1. ✅ **Add PDF exclusion filter** (Req #7) - **Saves 1,640-4,100 credits per assessment** (highest impact)
2. ✅ Reduce MAX_QUERIES_PER_FACTOR (20 → 8) (Req #1) - 60% query reduction
3. ✅ Remove product/customer names from end-use queries (Req #2) - Fixes zero-result queries

### High Priority (Quality Improvements)
4. ✅ **Use structured APIs for sanctions** (Req #8) - Better data quality, avoid PDF databases
5. ✅ Use `tbs` parameter for time filtering (Req #3) - More flexible, better results
6. ✅ Reduce preliminary screening limits (5 → 3) (Req #5) - Quick win, no quality impact

### Medium Priority (Enhancements)
7. ✅ **Domain-specific PDF handling** (Req #9) - Source configuration for preferred paths
8. ✅ Add query deduplication (Req #4) - Prevents redundant API calls
9. ✅ **Monitor PDF retrieval in audit** (Req #10) - Observability for future diagnosis

### Low Priority (Observability)
10. ✅ Fix audit trail logging (Req #6) - Helps future diagnosis

## Dependencies

- Firecrawl API `/search` endpoint (already integrated)
- OpenAI GPT-4o for query generation (already integrated)
- Existing HRDD workflow structure (no changes required)

## Testing Requirements

1. **Regression testing**: Run assessments on historical dossiers (SAAB, other test cases) to verify no quality degradation
2. **Credit usage validation**: Audit trail should show ~250 sources vs previous ~660
3. **Query quality validation**: Manual review of generated queries to ensure no product names, appropriate temporal scope
4. **Deduplication verification**: Audit trail should show no duplicate queries
5. **Performance validation**: Assessment time should be ~12-15 minutes vs previous 30-40 minutes
