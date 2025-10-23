# Specification: HRDD Search Optimization

## Goal
Reduce HRDD workflow Firecrawl API credit consumption by **95%** through PDF exclusion, optimized query generation, temporal filtering, and deduplication, while maintaining risk classification accuracy.

## User Stories
- As a compliance officer, I want HRDD assessments to complete in 12-15 minutes instead of 30-40 minutes, so that I can process more dossiers per day
- As a product manager, I want to reduce Firecrawl API costs by 95% per assessment (from ~5,000-7,000 credits to ~250 credits), so that the HRDD workflow is cost-effective at scale
- As a system operator, I want complete audit trails logging all queries including PDF retrieval patterns, so that I can diagnose wasteful API usage in production
- As a compliance analyst, I want queries to return relevant HTML results without PDF parsing failures or product-specific terms, so that research findings are comprehensive and reliable

## Core Requirements

### Functional Requirements
- **CRITICAL: Exclude PDFs from all searches** - Add PDF exclusion filters to eliminate 1,640-4,100 credit waste per assessment (Requirement #7)
- Use structured HTML APIs for sanctions data instead of PDF downloads (Requirement #8)
- Configure domain-specific PDF handling with preferred paths (Requirement #9)
- Monitor PDF retrieval in audit trail for future diagnosis (Requirement #10)
- Reduce queries per risk factor from 20 to 8 (55% reduction) while maintaining coverage (Requirement #1)
- Generate queries without proprietary product/customer names that don't exist publicly (Requirement #2)
- Use Firecrawl's `tbs` parameter for temporal filtering instead of hardcoded years in query text (Requirement #3)
- Deduplicate queries before execution to prevent redundant API calls (Requirement #4)
- Log all Enhanced DD queries to audit trail (currently only preliminary screening is logged) (Requirement #6)
- Reduce preliminary screening sanctions limit from 5 to 3 sources per query (Requirement #5)

### Non-Functional Requirements
- Processing time: Reduce from 30-40 minutes to 12-15 minutes (60% improvement)
- API credit usage: Reduce from ~5,000-7,000 credits to ~250 credits per assessment (**95% reduction**)
- PDF sources: Reduce from 82 PDFs to 0 PDFs per assessment (100% elimination)
- Content parsing: Increase from 0% to 100% sources with non-zero content length
- Quality: Maintain existing risk classification accuracy (no degradation)
- Observability: 100% of queries logged to audit trail (vs current ~8%)

## Visual Design
No visual changes required - this is a backend optimization.

## Reusable Components

### Existing Code to Leverage

**Query Deduplication Pattern (lib/hrdd-synthesis.ts:19-20)**
```typescript
const uniqueSources = Array.from(
  new Map(allSources.map(s => [s.url, s])).values()
);
```
This deduplication pattern using Map with URL as key can be adapted for query deduplication.

**Audit Trail Logging Pattern (lib/hrdd-preliminary-screening.ts:201-213)**
```typescript
const queryAuditEntry: AuditEntry = {
  timestamp: Date.now(),
  event: 'query_executed',
  data: {
    query,
    phase: 'preliminary-screening-sanctions',
    resultsCount: sources.length
  }
};
if (!state.auditTrail) {
  (state as any).auditTrail = [];
}
(state as any).auditTrail.push(queryAuditEntry);
```
This pattern is currently used in preliminary screening and should be replicated in all three risk factor assessment functions.

**Firecrawl Search Interface (lib/firecrawl.ts:103-119)**
```typescript
async search(query: string, options?: { limit?: number; scrapeOptions?: any }) {
  const searchParams: any = {
    limit: options?.limit || 10,
  };

  if (options?.scrapeOptions !== false) {
    searchParams.scrapeOptions = {
      formats: ['markdown'],
      ...options?.scrapeOptions
    };
  }

  const result = await this.client.search(query, searchParams);
  // ...
}
```
The Firecrawl search method accepts a flexible `options` parameter. We can extend this to pass `tbs` parameter and PDF exclusion patterns.

### New Components Required

**Query Normalization Function**
- Purpose: Normalize queries for deduplication (lowercase, trim, collapse whitespace)
- Why: No existing normalization utility found in codebase
- Location: New helper function in lib/hrdd-risk-factors.ts

**Time-Based Search Parameters**
- Purpose: Add `tbs` parameter to Firecrawl search calls with phase-specific values
- Why: Firecrawl client doesn't currently expose `tbs` parameter
- Location: Extend Firecrawl search options in lib/firecrawl.ts

**PDF Exclusion Parameters**
- Purpose: Add `excludeUrlPatterns` and `ignoreInvalidURLs` to Firecrawl search calls
- Why: Firecrawl client doesn't currently expose these parameters
- Location: Extend Firecrawl search options in lib/firecrawl.ts

## Technical Approach

### Database
No database changes required - this is a workflow optimization.

### API
**Firecrawl Search API Extensions**

Extend the Firecrawl client to support the `tbs` (time-based search) parameter and PDF exclusion:

```typescript
// lib/firecrawl.ts - Update search method signature
async search(query: string, options?: {
  limit?: number;
  scrapeOptions?: any;
  tbs?: string;  // NEW: Time-based search parameter
  excludeUrlPatterns?: string[];  // NEW: PDF exclusion patterns
  ignoreInvalidURLs?: boolean;  // NEW: Skip problematic URLs
}) {
  const searchParams: any = {
    limit: options?.limit || 10,
  };

  // Add tbs parameter if provided
  if (options?.tbs) {
    searchParams.tbs = options.tbs;
  }

  // Add PDF exclusion patterns if provided
  if (options?.excludeUrlPatterns) {
    searchParams.excludeUrlPatterns = options.excludeUrlPatterns;
  }

  // Add ignoreInvalidURLs flag if provided
  if (options?.ignoreInvalidURLs !== undefined) {
    searchParams.ignoreInvalidURLs = options.ignoreInvalidURLs;
  }

  // Existing scrapeOptions logic...
}
```

The `tbs` parameter values per phase:
- Geographic Context: `qdr:y` (last year - for Freedom House scores, current political situation)
- Customer Adverse Media: Custom 3-year range (for recent violations within risk threshold)
- End-Use Application: No filter (search historical dual-use frameworks, regulations)

The `excludeUrlPatterns` parameter (ALL PHASES):
- `['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf']` - Exclude PDF files and download directories

### Frontend
No frontend changes required - this is a backend workflow optimization.

### Testing
- Unit tests: Query normalization and deduplication logic
- Integration tests: Verify audit trail logging for all queries including PDF tracking
- Regression tests: Run on historical dossiers (SAAB, others) to verify risk classifications unchanged
- Performance tests: Measure processing time reduction (target: 12-15 min vs 30-40 min)
- Credit validation: Audit trail analysis to confirm ~250 sources vs previous ~660, 0 PDFs vs previous 82
- Content parsing validation: Verify 100% of sources have non-zero content length

## PDF Optimization Strategy (CRITICAL - 95% Credit Reduction)

### Problem Analysis

**Audit Log Evidence from SAAB Assessment:**
- **82 PDFs retrieved** out of 466 total sources (17.6% of sources)
- **All 466 sources showed 0 content length** - indicating PDF parsing failures or content not being stored
- **Estimated credit waste: 1,640-4,100 credits just on PDFs** (assuming 20-50 pages per PDF × 1 credit per page)
- **Total estimated credits: ~5,000-7,000** (466 sources + PDF page parsing)
- **Target after optimization: ~250 credits** (95% reduction)

**PDF Source Breakdown by Domain:**
1. **Treasury.gov OFAC sanctions**: 5 PDFs (100+ page database dumps like sdnew12.pdf, sdnew07.pdf)
2. **Amnesty.org reports**: 10 PDFs (multi-page human rights reports)
3. **SAAB corporate docs**: 8 PDFs (annual reports, sustainability docs, governance PDFs)
4. **SIPRI databases**: 7 PDFs (arms transfer data, military spending reports)
5. **Stop Killer Robots**: 6 PDFs (policy reports, autonomous weapons frameworks)
6. **European Parliament**: 7 PDFs (resolutions, committee reports)
7. **Various UN domains**: Multiple PDFs (OHCHR reports, Security Council resolutions)

**Why PDFs Are Extremely Costly:**
- Firecrawl charges **1 credit PER PAGE** for PDF parsing (vs 1 credit per HTML scrape)
- Long reports (50-100 pages) consume 50-100 credits EACH
- Many PDFs are structured data dumps (sanctions lists) that don't parse well to markdown
- PDF parsing often fails (content length = 0) but credits are still consumed
- Example: 5 Treasury.gov PDFs × 100 pages = 500 credits wasted on unreadable sanctions data

### Implementation Plan - Four New Requirements

---

#### **Requirement #7: Add PDF Exclusion Filter (CRITICAL - Highest Impact)**

**Change: Add `excludeUrlPatterns` to ALL Firecrawl search calls**

**Files Affected:**
- `lib/firecrawl.ts` - Extend search method signature
- `lib/hrdd-risk-factors.ts` - Add exclusion to all 3 assessment functions
- `lib/hrdd-preliminary-screening.ts` - Add exclusion to sanctions/jurisdiction searches

**Implementation:**

**Step 1: Update Firecrawl Client (lib/firecrawl.ts)**

```typescript
// BEFORE (line 103)
async search(query: string, options?: { limit?: number; scrapeOptions?: any }) {
  const searchParams: any = {
    limit: options?.limit || 10,
  };

  if (options?.scrapeOptions !== false) {
    searchParams.scrapeOptions = {
      formats: ['markdown'],
      ...options?.scrapeOptions
    };
  }

  const result = await this.client.search(query, searchParams);
  // ...
}
```

```typescript
// AFTER
async search(query: string, options?: {
  limit?: number;
  scrapeOptions?: any;
  tbs?: string;
  excludeUrlPatterns?: string[];  // NEW: PDF exclusion patterns
  ignoreInvalidURLs?: boolean;    // NEW: Skip problematic URLs
}) {
  const searchParams: any = {
    limit: options?.limit || 10,
  };

  // Add tbs parameter if provided
  if (options?.tbs) {
    searchParams.tbs = options.tbs;
  }

  // Add PDF exclusion patterns (CRITICAL FOR CREDIT SAVINGS)
  if (options?.excludeUrlPatterns) {
    searchParams.excludeUrlPatterns = options.excludeUrlPatterns;
  }

  // Add ignoreInvalidURLs flag
  if (options?.ignoreInvalidURLs !== undefined) {
    searchParams.ignoreInvalidURLs = options.ignoreInvalidURLs;
  }

  if (options?.scrapeOptions !== false) {
    searchParams.scrapeOptions = {
      formats: ['markdown'],
      ...options?.scrapeOptions
    };
  }

  const result = await this.client.search(query, searchParams);
  // ...
}
```

**Step 2: Update Geographic Context Assessment (lib/hrdd-risk-factors.ts, line 118)**

```typescript
// BEFORE
const results = await firecrawl.search(query, {
  limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
  scrapeOptions: { formats: ['markdown'] }
});
```

```typescript
// AFTER: Add PDF exclusion + tbs parameter
const results = await firecrawl.search(query, {
  limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
  scrapeOptions: { formats: ['markdown'] },
  tbs: 'qdr:y',  // Last year - for current Freedom House scores
  excludeUrlPatterns: ['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf'],  // CRITICAL: Exclude PDFs
  ignoreInvalidURLs: true  // Skip problematic URLs gracefully
});
```

**Step 3: Update Customer Profile Assessment (lib/hrdd-risk-factors.ts, line 284)**

```typescript
// BEFORE
const results = await firecrawl.search(query, {
  limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
  scrapeOptions: { formats: ['markdown'] }
});
```

```typescript
// AFTER: Add PDF exclusion + conditional tbs
const isAdverseMedia = adverseMediaQueries.includes(query);
const results = await firecrawl.search(query, {
  limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
  scrapeOptions: { formats: ['markdown'] },
  ...(isAdverseMedia && { tbs: 'qdr:y3' }),  // 3 years for adverse media
  excludeUrlPatterns: ['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf'],  // CRITICAL: Exclude PDFs
  ignoreInvalidURLs: true
});
```

**Step 4: Update End-Use Assessment (lib/hrdd-risk-factors.ts, line 448)**

```typescript
// BEFORE
const results = await firecrawl.search(query, {
  limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
  scrapeOptions: { formats: ['markdown'] }
});
```

```typescript
// AFTER: Add PDF exclusion (no tbs - need historical context)
const results = await firecrawl.search(query, {
  limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
  scrapeOptions: { formats: ['markdown'] },
  // No tbs parameter - need historical dual-use frameworks
  excludeUrlPatterns: ['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf'],  // CRITICAL: Exclude PDFs
  ignoreInvalidURLs: true
});
```

**Step 5: Update Preliminary Screening Sanctions (lib/hrdd-preliminary-screening.ts, line 186)**

```typescript
// BEFORE
const results = await firecrawl.search(query, {
  limit: 5,
  scrapeOptions: { formats: ['markdown'] }
});
```

```typescript
// AFTER: Add PDF exclusion + reduce limit
const results = await firecrawl.search(query, {
  limit: 3,  // Reduced from 5
  scrapeOptions: { formats: ['markdown'] },
  excludeUrlPatterns: ['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf'],  // CRITICAL: Exclude PDFs (Treasury.gov OFAC has 100+ page PDFs)
  ignoreInvalidURLs: true
});
```

**Step 6: Update Preliminary Screening Jurisdiction (lib/hrdd-preliminary-screening.ts, line 352)**

```typescript
// BEFORE
const results = await firecrawl.search(query, {
  limit: 5,
  scrapeOptions: { formats: ['markdown'] }
});
```

```typescript
// AFTER: Add PDF exclusion + reduce limit
const results = await firecrawl.search(query, {
  limit: 3,  // Reduced from 5
  scrapeOptions: { formats: ['markdown'] },
  excludeUrlPatterns: ['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf'],  // CRITICAL: Exclude PDFs (UN reports often 50+ pages)
  ignoreInvalidURLs: true
});
```

**Expected Impact:**
- **Eliminates 82 PDFs** = 1,640-4,100 credits saved (assuming 20-50 pages/PDF)
- **Total credit reduction: ~5,000-7,000 → ~250 credits (95% reduction)**
- **Improves content parsing success: 0% → 100%** (HTML parses reliably, PDFs often fail)
- **Processing time improvement: Faster search results without PDF rendering delays**

---

#### **Requirement #8: Use Structured APIs for Sanctions Data**

**Change: Direct queries to HTML search interfaces instead of PDF downloads**

**Problem:**
- Current queries find Treasury.gov PDF files (sdnew12.pdf, sdnew07.pdf) that are 100+ page database dumps
- These PDFs cost 100+ credits EACH and don't parse well to markdown
- HTML search interfaces return targeted results with minimal credits

**Files Affected:**
- `lib/hrdd-prompts.ts` - Update SANCTIONS_CHECK_PROMPT and CUSTOMER_QUERY_GENERATION_PROMPT
- `config/hrdd-sources.json` - Add `exclude_paths` configuration

**Implementation:**

**Step 1: Update Sanctions Check Prompt (lib/hrdd-prompts.ts, line 78)**

```typescript
// BEFORE (line 78)
export const SANCTIONS_CHECK_PROMPT = `ROLE: You are an expert in international sanctions regimes (UN, EU, US OFAC).

TASK: Interpret sanctions database search results to determine if customer/country is sanctioned.

INPUT:
- Customer name: {customer}
- Deployment country: {country}
- Search results from OFAC, UN, EU sanctions databases: {searchResults}
```

```typescript
// AFTER: Add PDF avoidance instruction
export const SANCTIONS_CHECK_PROMPT = `ROLE: You are an expert in international sanctions regimes (UN, EU, US OFAC).

TASK: Interpret sanctions database search results to determine if customer/country is sanctioned.

INPUT:
- Customer name: {customer}
- Deployment country: {country}
- Search results from OFAC, UN, EU sanctions databases: {searchResults}

NOTE: Search results may exclude large PDF database dumps. If sanctions are not found in HTML search results from authoritative sources (sanctionssearch.ofac.treas.gov, sanctionsmap.eu, un.org/securitycouncil/sanctions), entity is likely not sanctioned.
```

**Step 2: Update Customer Query Generation Prompt (lib/hrdd-prompts.ts, line 495)**

```typescript
// BEFORE (line 529-534)
"site_specific_queries": [
  {
    "query": "site:treasury.gov/ofac {customer}",
    "source": "OFAC Sanctions",
    "priority": "critical"
  }
],
```

```typescript
// AFTER: Direct to HTML search interface, not PDF downloads
"site_specific_queries": [
  {
    "query": "site:sanctionssearch.ofac.treas.gov {customer}",
    "source": "OFAC Sanctions Search (HTML)",
    "priority": "critical",
    "rationale": "Use HTML search interface instead of PDF downloads for better parsing and lower credits"
  },
  {
    "query": "site:treasury.gov/ofac {customer} -filetype:pdf",
    "source": "OFAC Website (excluding PDFs)",
    "priority": "high",
    "rationale": "Backup query excluding PDF database dumps"
  }
],
```

**Step 3: Add PDF Avoidance Instructions to Customer Prompt (lib/hrdd-prompts.ts, after line 512)**

```typescript
// ADD AFTER LINE 512
CRITICAL PDF AVOIDANCE:
- DO NOT query for PDF downloads or database dumps (e.g., treasury.gov/ofac/downloads)
- PREFER HTML search interfaces (e.g., sanctionssearch.ofac.treas.gov, sanctionsmap.eu)
- For corporate registries, prefer web pages over downloadable reports
- For sanctions, use interactive search pages, not static PDF lists

WHY: PDFs cost 1 credit PER PAGE (vs 1 credit per HTML page). A 100-page PDF consumes 100 credits and often fails to parse to markdown.
```

**Step 4: Update hrdd-sources.json (config/hrdd-sources.json)**

```json
// BEFORE (lines 166-171)
{
  "name": "OFAC Sanctions List",
  "domain": "treasury.gov",
  "description": "US Office of Foreign Assets Control sanctions database",
  "priority": "critical",
  "paywall": false,
  "search_strategy": "site-specific"
}
```

```json
// AFTER: Add preferred_paths and exclude_paths
{
  "name": "OFAC Sanctions List",
  "domain": "treasury.gov",
  "description": "US Office of Foreign Assets Control sanctions database",
  "priority": "critical",
  "paywall": false,
  "search_strategy": "site-specific",
  "preferred_paths": [
    "/resource-center/sanctions/",
    "/policy-issues/financial-sanctions/"
  ],
  "exclude_paths": [
    "/ofac/downloads/",
    "/resource-center/sanctions/OFAC-Enforcement/Pages/"
  ],
  "notes": "Prefer HTML search pages over PDF database dumps (sdnew*.pdf files are 100+ pages)"
}
```

**Expected Impact:**
- **Eliminates 5 Treasury.gov PDFs** = ~500 credits saved (5 PDFs × 100 pages)
- **Better data quality**: HTML search results are more targeted and parse reliably
- **Faster processing**: No PDF rendering delays

---

#### **Requirement #9: Add Domain-Specific PDF Handling**

**Change: Configure preferred paths for each source domain to avoid PDF-heavy directories**

**Problem:**
- Amnesty.org: 10 PDFs retrieved, but `/en/countries/` HTML pages have same info
- SAAB.com: 8 PDFs retrieved (annual reports), but `/sustainability/` pages summarize key info
- Freedom House: HTML country pages are better than PDF annual reports
- European Parliament: 7 PDFs retrieved, but web pages have report summaries

**Files Affected:**
- `config/hrdd-sources.json` - Add `preferred_paths` and `exclude_paths` for each source
- `lib/hrdd-prompts.ts` - Update all 3 query generation prompts with PDF avoidance instructions

**Implementation:**

**Step 1: Update hrdd-sources.json with PDF Handling Configuration**

```json
// ADD to geographic_context sources (amnesty.org example)
{
  "name": "Amnesty International",
  "domain": "amnesty.org",
  "description": "Human rights reports and campaigns",
  "priority": "high",
  "paywall": false,
  "search_strategy": "site-specific",
  "preferred_paths": [
    "/en/countries/",
    "/en/latest/news/",
    "/en/what-we-do/"
  ],
  "exclude_paths": [
    "/en/documents/",
    "/en/wp-content/uploads/"
  ],
  "notes": "Prefer country HTML pages over downloadable PDF reports. PDFs are often 50+ pages."
}
```

```json
// ADD to geographic_context sources (freedom house example)
{
  "name": "Freedom House",
  "domain": "freedomhouse.org",
  "description": "Country freedom scores and trends",
  "priority": "critical",
  "paywall": false,
  "search_strategy": "site-specific",
  "preferred_paths": [
    "/country/",
    "/countries/",
    "/explore-the-map/"
  ],
  "exclude_paths": [
    "/report/",
    "/sites/default/files/"
  ],
  "notes": "Prefer interactive country pages over annual report PDFs. Scores are displayed on HTML pages."
}
```

```json
// ADD to customer_profile sources (SIPRI example)
{
  "name": "SIPRI Arms Transfers Database",
  "domain": "sipri.org",
  "description": "Defense industry and arms transfer data",
  "priority": "high",
  "paywall": false,
  "search_strategy": "site-specific",
  "preferred_paths": [
    "/databases/armstransfers/",
    "/commentary/"
  ],
  "exclude_paths": [
    "/sites/default/files/",
    "/yearbook/"
  ],
  "notes": "Use interactive database pages, not downloadable yearbook PDFs (100+ pages each)."
}
```

```json
// ADD to end_use_application sources (Stop Killer Robots example)
{
  "name": "Campaign to Stop Killer Robots",
  "domain": "stopkillerrobots.org",
  "description": "Advocacy and research on autonomous weapons",
  "priority": "high",
  "paywall": false,
  "search_strategy": "site-specific",
  "preferred_paths": [
    "/learn/",
    "/news/",
    "/country-views/"
  ],
  "exclude_paths": [
    "/wp-content/uploads/"
  ],
  "notes": "Prefer web articles over policy report PDFs. Reports are often 20-40 pages."
}
```

**Step 2: Update Geographic Query Generation Prompt (lib/hrdd-prompts.ts, after line 461)**

```typescript
// ADD AFTER LINE 461 (after "INSTRUCTIONS:")
PDF AVOIDANCE STRATEGY:
1. PREFER HTML pages from authoritative sources:
   - Freedom House: Use /country/ pages, NOT /report/ PDFs
   - Amnesty: Use /en/countries/ pages, NOT /en/documents/ PDFs
   - UN OHCHR: Use /en/countries/ pages, NOT /Documents/ PDFs
2. Use site: operator to target preferred paths: "site:freedomhouse.org/country/ {country}"
3. Avoid queries that return annual reports or database dumps
4. If source has both HTML and PDF versions, ALWAYS prefer HTML

WHY: PDFs cost 1 credit per page. A 50-page Amnesty report = 50 credits. An HTML country page = 1 credit.
```

**Step 3: Update Customer Query Generation Prompt (lib/hrdd-prompts.ts, after line 514)**

```typescript
// ADD AFTER LINE 514 (after existing "CRITICAL PDF AVOIDANCE:")
DOMAIN-SPECIFIC PDF AVOIDANCE:
1. Corporate websites:
   - PREFER: /sustainability/, /about/, /governance/ web pages
   - AVOID: /investors/reports/, /downloads/, /media/documents/
2. Sanctions databases:
   - PREFER: sanctionssearch.ofac.treas.gov (HTML search)
   - AVOID: treasury.gov/ofac/downloads/ (PDF database dumps)
3. ESG databases:
   - PREFER: Company profile web pages
   - AVOID: Downloadable ESG reports (often 50+ pages)

EXAMPLE QUERIES:
- ✅ GOOD: "site:saab.com/sustainability corporate governance ethics"
- ❌ BAD: "site:saab.com annual report 2023" (likely returns PDF)
```

**Step 4: Update End-Use Query Generation Prompt (lib/hrdd-prompts.ts, after line 586)**

```typescript
// ADD AFTER LINE 586 (in INSTRUCTIONS section)
PDF AVOIDANCE FOR AUTONOMOUS WEAPONS RESEARCH:
1. EU frameworks:
   - PREFER: europa.eu/policies/ web pages
   - AVOID: europa.eu/documents/ PDFs (often 50+ page policy docs)
2. Campaign to Stop Killer Robots:
   - PREFER: /learn/ and /news/ web articles
   - AVOID: /wp-content/uploads/ PDFs (20-40 page reports)
3. Dual-use controls:
   - PREFER: wassenaar.org/control-lists/ HTML tables
   - AVOID: Annual report PDFs
4. Defense media:
   - PREFER: News articles and web analysis
   - AVOID: White papers and technical reports (PDFs)

WHY: Framework definitions and legal standards are summarized on web pages. Full policy documents (PDFs) are rarely needed for risk classification.
```

**Expected Impact:**
- **Reduces PDF retrieval across all domains** by directing queries to HTML paths
- **Improves result relevance**: Web pages are more current than annual reports
- **Estimated savings: ~500-1,000 credits** from avoiding domain-specific PDFs

---

#### **Requirement #10: Monitor PDF Retrieval in Audit Trail**

**Change: Track PDF count and estimated credits in audit trail for future diagnosis**

**Problem:**
- Current audit trail doesn't track PDFs vs HTML sources
- Credit waste from PDFs is invisible in audit analysis
- Future assessments need visibility into PDF retrieval patterns

**Files Affected:**
- `lib/hrdd-state.ts` - Update AuditEntry type to include PDF tracking
- `lib/hrdd-risk-factors.ts` - Add PDF tracking to audit entries in all 3 assessment functions
- `lib/hrdd-preliminary-screening.ts` - Add PDF tracking to preliminary screening audit entries

**Implementation:**

**Step 1: Update AuditEntry Type (lib/hrdd-state.ts)**

```typescript
// BEFORE
export interface AuditEntry {
  timestamp: number;
  event: string;
  data: {
    query?: string;
    phase?: string;
    resultsCount?: number;
    result?: any;
    queries?: string[];
    tbs?: string;
  };
}
```

```typescript
// AFTER: Add PDF tracking fields
export interface AuditEntry {
  timestamp: number;
  event: string;
  data: {
    query?: string;
    phase?: string;
    resultsCount?: number;
    result?: any;
    queries?: string[];
    tbs?: string;
    // NEW: PDF tracking fields
    pdfCount?: number;           // Number of PDF sources in results
    pdfUrls?: string[];          // List of PDF URLs for diagnosis
    estimatedPdfCredits?: number; // Estimated credits for PDFs (pdfCount × avg 30 pages)
    contentLengthZeroCount?: number; // Number of sources with zero content length
  };
}
```

**Step 2: Add PDF Detection Helper (lib/hrdd-risk-factors.ts, after query deduplication helpers)**

```typescript
/**
 * Detect if URL is a PDF file
 */
function isPdfUrl(url: string): boolean {
  const urlLower = url.toLowerCase();
  return urlLower.endsWith('.pdf') ||
         urlLower.includes('/pdf/') ||
         urlLower.includes('/downloads/') ||
         urlLower.includes('.pdf?') ||
         urlLower.includes('.pdf#');
}

/**
 * Calculate estimated PDF credits
 * Assumes average 30 pages per PDF × 1 credit per page
 */
function estimatePdfCredits(pdfCount: number): number {
  const AVG_PAGES_PER_PDF = 30;
  return pdfCount * AVG_PAGES_PER_PDF;
}
```

**Step 3: Update Geographic Context Audit Entry (lib/hrdd-risk-factors.ts, after line 130)**

```typescript
// BEFORE
const queryAuditEntry: AuditEntry = {
  timestamp: Date.now(),
  event: 'query_executed',
  data: {
    query,
    phase: 'geographic-context',
    resultsCount: sources.length,
    tbs: 'qdr:y'
  }
};
```

```typescript
// AFTER: Add PDF tracking
// Detect PDFs in results (should be 0 after excludeUrlPatterns is implemented)
const pdfUrls = sources.filter(s => isPdfUrl(s.url)).map(s => s.url);
const pdfCount = pdfUrls.length;
const contentLengthZeroCount = sources.filter(s => !s.content || s.content.length === 0).length;

const queryAuditEntry: AuditEntry = {
  timestamp: Date.now(),
  event: 'query_executed',
  data: {
    query,
    phase: 'geographic-context',
    resultsCount: sources.length,
    tbs: 'qdr:y',
    // PDF tracking (should show 0 PDFs after optimization)
    pdfCount,
    pdfUrls: pdfCount > 0 ? pdfUrls : undefined,
    estimatedPdfCredits: pdfCount > 0 ? estimatePdfCredits(pdfCount) : undefined,
    contentLengthZeroCount
  }
};
```

**Step 4: Update Customer Profile Audit Entry (lib/hrdd-risk-factors.ts, after line 296)**

```typescript
// BEFORE
const isAdverseMedia = adverseMediaQueries.includes(query);
const queryAuditEntry: AuditEntry = {
  timestamp: Date.now(),
  event: 'query_executed',
  data: {
    query,
    phase: 'customer-profile',
    resultsCount: sources.length,
    ...(isAdverseMedia && { tbs: 'qdr:y3' })
  }
};
```

```typescript
// AFTER: Add PDF tracking
const isAdverseMedia = adverseMediaQueries.includes(query);
const pdfUrls = sources.filter(s => isPdfUrl(s.url)).map(s => s.url);
const pdfCount = pdfUrls.length;
const contentLengthZeroCount = sources.filter(s => !s.content || s.content.length === 0).length;

const queryAuditEntry: AuditEntry = {
  timestamp: Date.now(),
  event: 'query_executed',
  data: {
    query,
    phase: 'customer-profile',
    resultsCount: sources.length,
    ...(isAdverseMedia && { tbs: 'qdr:y3' }),
    // PDF tracking
    pdfCount,
    pdfUrls: pdfCount > 0 ? pdfUrls : undefined,
    estimatedPdfCredits: pdfCount > 0 ? estimatePdfCredits(pdfCount) : undefined,
    contentLengthZeroCount
  }
};
```

**Step 5: Update End-Use Audit Entry (lib/hrdd-risk-factors.ts, after line 460)**

```typescript
// BEFORE
const queryAuditEntry: AuditEntry = {
  timestamp: Date.now(),
  event: 'query_executed',
  data: {
    query,
    phase: 'end-use-application',
    resultsCount: sources.length
  }
};
```

```typescript
// AFTER: Add PDF tracking
const pdfUrls = sources.filter(s => isPdfUrl(s.url)).map(s => s.url);
const pdfCount = pdfUrls.length;
const contentLengthZeroCount = sources.filter(s => !s.content || s.content.length === 0).length;

const queryAuditEntry: AuditEntry = {
  timestamp: Date.now(),
  event: 'query_executed',
  data: {
    query,
    phase: 'end-use-application',
    resultsCount: sources.length,
    // PDF tracking
    pdfCount,
    pdfUrls: pdfCount > 0 ? pdfUrls : undefined,
    estimatedPdfCredits: pdfCount > 0 ? estimatePdfCredits(pdfCount) : undefined,
    contentLengthZeroCount
  }
};
```

**Step 6: Update Preliminary Screening Audit Entries (lib/hrdd-preliminary-screening.ts)**

```typescript
// AFTER sanctions/jurisdiction query execution (add PDF tracking to existing audit entries)
const pdfUrls = sources.filter(s => isPdfUrl(s.url)).map(s => s.url);
const pdfCount = pdfUrls.length;
const contentLengthZeroCount = sources.filter(s => !s.content || s.content.length === 0).length;

const queryAuditEntry: AuditEntry = {
  timestamp: Date.now(),
  event: 'query_executed',
  data: {
    query,
    phase: 'preliminary-screening-sanctions', // or 'preliminary-screening-jurisdiction'
    resultsCount: sources.length,
    // PDF tracking
    pdfCount,
    pdfUrls: pdfCount > 0 ? pdfUrls : undefined,
    estimatedPdfCredits: pdfCount > 0 ? estimatePdfCredits(pdfCount) : undefined,
    contentLengthZeroCount
  }
};
```

**Step 7: Add Audit Trail Summary Logging**

Add summary log at end of workflow to show total PDF impact:

```typescript
// Add to hrdd-workflow-engine.ts at end of synthesis phase
const allAuditEntries = state.auditTrail.filter(e => e.event === 'query_executed');
const totalPdfCount = allAuditEntries.reduce((sum, e) => sum + (e.data.pdfCount || 0), 0);
const totalEstimatedPdfCredits = allAuditEntries.reduce((sum, e) => sum + (e.data.estimatedPdfCredits || 0), 0);
const totalContentZeroCount = allAuditEntries.reduce((sum, e) => sum + (e.data.contentLengthZeroCount || 0), 0);

console.log(`[HRDD Audit Summary]
  Total Queries: ${allAuditEntries.length}
  Total Sources: ${state.sources.length}
  PDF Sources: ${totalPdfCount} (${((totalPdfCount / state.sources.length) * 100).toFixed(1)}%)
  Estimated PDF Credits Wasted: ${totalEstimatedPdfCredits}
  Sources with Zero Content: ${totalContentZeroCount} (${((totalContentZeroCount / state.sources.length) * 100).toFixed(1)}%)
`);
```

**Expected Impact:**
- **Complete visibility into PDF retrieval** in audit trail exports
- **Immediately diagnose credit waste** in future assessments
- **Validate PDF exclusion is working**: After optimization, should see 0 PDFs in all audits
- **Track content parsing success**: contentLengthZeroCount should drop from ~466 to 0

---

## Implementation Details by File

### 1. lib/hrdd-config.ts

**Change: Reduce MAX_QUERIES_PER_FACTOR from 20 to 8**

**Before (line 46):**
```typescript
MAX_QUERIES_PER_FACTOR: 20,   // Maximum queries per risk factor
```

**After:**
```typescript
MAX_QUERIES_PER_FACTOR: 8,    // Maximum queries per risk factor (reduced from 20 for cost optimization)
```

**Rationale:** Analysis of SAAB assessment showed diminishing returns after 8 well-crafted queries. This change reduces queries from 60 to 24 across three risk factors (Geographic, Customer, End-Use).

**Impact:** 60% reduction in queries per assessment for Enhanced DD phase.

---

### 2. lib/hrdd-prompts.ts

**Change A: Update Geographic Query Generation Prompt (line 467)**

**Before:**
```typescript
5. Generate 15-20 total queries (mix of site-specific and broader)
```

**After:**
```typescript
5. Generate 6-8 total queries (mix of site-specific and broader)
6. DO NOT include year constraints in queries (e.g., "2024", "2020-2024") - time filtering handled separately

PDF AVOIDANCE STRATEGY:
1. PREFER HTML pages from authoritative sources:
   - Freedom House: Use /country/ pages, NOT /report/ PDFs
   - Amnesty: Use /en/countries/ pages, NOT /en/documents/ PDFs
   - UN OHCHR: Use /en/countries/ pages, NOT /Documents/ PDFs
2. Use site: operator to target preferred paths: "site:freedomhouse.org/country/ {country}"
3. Avoid queries that return annual reports or database dumps
4. If source has both HTML and PDF versions, ALWAYS prefer HTML

WHY: PDFs cost 1 credit per page. A 50-page Amnesty report = 50 credits. An HTML country page = 1 credit.
```

**Additional changes in Geographic prompt:**
- Remove all references to specific years (lines 452-459)
- Update example queries to remove year mentions

**Before (line 472):**
```typescript
{
  "query": "site:freedomhouse.org {country} freedom score 2024",
  "source": "Freedom House",
  "priority": "critical",
  "rationale": "Get numeric freedom score for threshold comparison"
}
```

**After:**
```typescript
{
  "query": "site:freedomhouse.org/country {country} freedom score",
  "source": "Freedom House",
  "priority": "critical",
  "rationale": "Get most recent numeric freedom score for threshold comparison (time-filtered via tbs parameter)"
}
```

---

**Change B: Update Customer Query Generation Prompt (line 519)**

**Before:**
```typescript
5. Generate 15-20 total queries (mix of site-specific, website, broader)
```

**After:**
```typescript
5. Generate 6-8 total queries (mix of site-specific, website, broader)
6. For adverse media queries, do NOT include year ranges in query text - time filtering handled separately

CRITICAL PDF AVOIDANCE:
- DO NOT query for PDF downloads or database dumps (e.g., treasury.gov/ofac/downloads)
- PREFER HTML search interfaces (e.g., sanctionssearch.ofac.treas.gov, sanctionsmap.eu)
- For corporate registries, prefer web pages over downloadable reports
- For sanctions, use interactive search pages, not static PDF lists

WHY: PDFs cost 1 credit PER PAGE (vs 1 credit per HTML page). A 100-page PDF consumes 100 credits and often fails to parse to markdown.

DOMAIN-SPECIFIC PDF AVOIDANCE:
1. Corporate websites:
   - PREFER: /sustainability/, /about/, /governance/ web pages
   - AVOID: /investors/reports/, /downloads/, /media/documents/
2. Sanctions databases:
   - PREFER: sanctionssearch.ofac.treas.gov (HTML search)
   - AVOID: treasury.gov/ofac/downloads/ (PDF database dumps)
3. ESG databases:
   - PREFER: Company profile web pages
   - AVOID: Downloadable ESG reports (often 50+ pages)

EXAMPLE QUERIES:
- ✅ GOOD: "site:saab.com/sustainability corporate governance ethics"
- ❌ BAD: "site:saab.com annual report 2023" (likely returns PDF)
```

**Before (line 538):**
```typescript
{
  "query": "{customer} human rights violation 2020-2024",
  "date_scope": "past 5 years",
  "rationale": "Find recent adverse media"
}
```

**After:**
```typescript
{
  "query": "{customer} human rights violation",
  "date_scope": "past 3 years",
  "rationale": "Find recent adverse media (time-filtered to past 3 years via tbs parameter)"
}
```

---

**Change C: Update End-Use Query Generation Prompt (lines 561-616)**

**Critical Update: Remove product/customer name instructions**

**Before (lines 563-566):**
```typescript
TASK: Generate USE-CASE-SPECIFIC search queries to assess end-use application risk. Queries must reference SPECIFIC technical details from the use case description, NOT generic terms.
```

**After:**
```typescript
TASK: Generate USE-CASE-SPECIFIC search queries to assess end-use application risk. Queries must reference GENERIC technical concepts extracted from the use case, EXCLUDING proprietary product names, customer names, or project-specific identifiers that don't exist publicly.
```

**New instructions to add after line 568:**
```typescript
CRITICAL EXCLUSIONS:
- DO NOT include proprietary product names (e.g., "Metis", "Sigma Connectivity")
- DO NOT include customer-specific project names or codenames
- DO NOT include unrealized sales opportunity identifiers
- ONLY extract generic technical terms that have public search results (e.g., "chip down design", "edge processing", "drone navigation")

WHY: Unrealized sales opportunities have no public documentation. Queries with proprietary names yield zero results and waste API credits.

PDF AVOIDANCE FOR AUTONOMOUS WEAPONS RESEARCH:
1. EU frameworks:
   - PREFER: europa.eu/policies/ web pages
   - AVOID: europa.eu/documents/ PDFs (often 50+ page policy docs)
2. Campaign to Stop Killer Robots:
   - PREFER: /learn/ and /news/ web articles
   - AVOID: /wp-content/uploads/ PDFs (20-40 page reports)
3. Dual-use controls:
   - PREFER: wassenaar.org/control-lists/ HTML tables
   - AVOID: Annual report PDFs
4. Defense media:
   - PREFER: News articles and web analysis
   - AVOID: White papers and technical reports (PDFs)

WHY: Framework definitions and legal standards are summarized on web pages. Full policy documents (PDFs) are rarely needed for risk classification.
```

**Before (line 580):**
```typescript
EXAMPLE:
- GOOD: "vision optronics military binoculars target identification" (uses specific terms from use case)
- BAD: "autonomous weapons AI military" (generic, not use-case-specific)
```

**After:**
```typescript
EXAMPLE USE CASE: "SAAB Sweden is purchasing Metis Chip Down Design for Sigma Connectivity in military drone navigation systems"

EXTRACTED TECHNICAL TERMS:
- ✅ GOOD: ["chip down design", "drone navigation", "military navigation systems"]
- ❌ BAD: ["Metis", "Sigma Connectivity"] (proprietary names with no public results)

EXAMPLE QUERIES:
- ✅ GOOD: "chip down design military drone navigation dual-use export controls"
- ✅ GOOD: "edge processing autonomous navigation human control"
- ❌ BAD: "Metis Chip Down Design Sigma Connectivity dual-use export regulations" (proprietary terms)
```

**Update query count (line 592):**
```typescript
6. Generate 6-8 total queries (mix of site-specific and use-case-specific broader)
```

---

### 3. lib/hrdd-risk-factors.ts

**Change A: Add Query Deduplication Helper (insert at top of file after imports)**

```typescript
/**
 * Normalize query for deduplication
 * - Lowercase
 * - Trim whitespace
 * - Collapse multiple spaces to single space
 */
function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Deduplicate queries using normalized comparison
 * Preserves original query casing but removes duplicates
 */
function deduplicateQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const query of queries) {
    const normalized = normalizeQuery(query);
    if (!seen.has(normalized)) {
      seen.add(normalized);
      unique.push(query); // Preserve original casing
    }
  }

  return unique;
}

/**
 * Detect if URL is a PDF file
 */
function isPdfUrl(url: string): boolean {
  const urlLower = url.toLowerCase();
  return urlLower.endsWith('.pdf') ||
         urlLower.includes('/pdf/') ||
         urlLower.includes('/downloads/') ||
         urlLower.includes('.pdf?') ||
         urlLower.includes('.pdf#');
}

/**
 * Calculate estimated PDF credits
 * Assumes average 30 pages per PDF × 1 credit per page
 */
function estimatePdfCredits(pdfCount: number): number {
  const AVG_PAGES_PER_PDF = 30;
  return pdfCount * AVG_PAGES_PER_PDF;
}
```

---

**Change B: Update Geographic Context Assessment (lines 99-142)**

**After line 99 (where allQueries is created), add deduplication:**

```typescript
// BEFORE deduplication
const allQueries = [...siteSpecificQueries, ...broaderQueries].slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);

// AFTER: Deduplicate then limit
const deduplicatedQueries = deduplicateQueries([...siteSpecificQueries, ...broaderQueries]);
const allQueries = deduplicatedQueries.slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);
```

**Update search call (line 118) to add tbs parameter and PDF exclusion:**

```typescript
// BEFORE
const results = await firecrawl.search(query, {
  limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
  scrapeOptions: { formats: ['markdown'] }
});

// AFTER: Add tbs parameter and PDF exclusion
const results = await firecrawl.search(query, {
  limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
  scrapeOptions: { formats: ['markdown'] },
  tbs: 'qdr:y',  // Last year - for current Freedom House scores, political situation
  excludeUrlPatterns: ['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf'],  // CRITICAL: Exclude PDFs
  ignoreInvalidURLs: true
});
```

**Add audit trail logging with PDF tracking (after line 130, inside the try block):**

```typescript
searchResults.push(...sources);
newQueries.push(query);

// NEW: Add audit entry for query execution with PDF tracking
const pdfUrls = sources.filter(s => isPdfUrl(s.url)).map(s => s.url);
const pdfCount = pdfUrls.length;
const contentLengthZeroCount = sources.filter(s => !s.content || s.content.length === 0).length;

const queryAuditEntry: AuditEntry = {
  timestamp: Date.now(),
  event: 'query_executed',
  data: {
    query,
    phase: 'geographic-context',
    resultsCount: sources.length,
    tbs: 'qdr:y',
    // PDF tracking (should show 0 PDFs after optimization)
    pdfCount,
    pdfUrls: pdfCount > 0 ? pdfUrls : undefined,
    estimatedPdfCredits: pdfCount > 0 ? estimatePdfCredits(pdfCount) : undefined,
    contentLengthZeroCount
  }
};
if (!state.auditTrail) {
  (state as any).auditTrail = [];
}
(state as any).auditTrail.push(queryAuditEntry);

if (eventCallback && sources.length > 0) {
  eventCallback({
    type: 'found',
    sources,
    query
  });
}
```

---

**Change C: Update Customer Profile Assessment (lines 265-308)**

**After line 265 (where allQueries is created), add deduplication:**

```typescript
// BEFORE deduplication
const allQueries = [
  ...customerWebsiteQueries,
  ...siteSpecificQueries,
  ...adverseMediaQueries,
  ...broaderQueries
].slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);

// AFTER: Deduplicate then limit
const combinedQueries = [
  ...customerWebsiteQueries,
  ...siteSpecificQueries,
  ...adverseMediaQueries,
  ...broaderQueries
];
const deduplicatedQueries = deduplicateQueries(combinedQueries);
const allQueries = deduplicatedQueries.slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);
```

**Update search call (line 284) with conditional tbs parameter and PDF exclusion:**

```typescript
// BEFORE
const results = await firecrawl.search(query, {
  limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
  scrapeOptions: { formats: ['markdown'] }
});

// AFTER: Add tbs for adverse media queries + PDF exclusion
const isAdverseMedia = adverseMediaQueries.includes(query);
const results = await firecrawl.search(query, {
  limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
  scrapeOptions: { formats: ['markdown'] },
  ...(isAdverseMedia && { tbs: 'qdr:y3' }),  // 3 years for adverse media (matches violation recency threshold)
  excludeUrlPatterns: ['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf'],  // CRITICAL: Exclude PDFs
  ignoreInvalidURLs: true
});
```

**Add audit trail logging with PDF tracking (after line 296, inside the try block):**

```typescript
searchResults.push(...sources);
newQueries.push(query);

// NEW: Add audit entry for query execution with PDF tracking
const isAdverseMedia = adverseMediaQueries.includes(query);
const pdfUrls = sources.filter(s => isPdfUrl(s.url)).map(s => s.url);
const pdfCount = pdfUrls.length;
const contentLengthZeroCount = sources.filter(s => !s.content || s.content.length === 0).length;

const queryAuditEntry: AuditEntry = {
  timestamp: Date.now(),
  event: 'query_executed',
  data: {
    query,
    phase: 'customer-profile',
    resultsCount: sources.length,
    ...(isAdverseMedia && { tbs: 'qdr:y3' }),
    // PDF tracking
    pdfCount,
    pdfUrls: pdfCount > 0 ? pdfUrls : undefined,
    estimatedPdfCredits: pdfCount > 0 ? estimatePdfCredits(pdfCount) : undefined,
    contentLengthZeroCount
  }
};
if (!state.auditTrail) {
  (state as any).auditTrail = [];
}
(state as any).auditTrail.push(queryAuditEntry);

if (eventCallback && sources.length > 0) {
  eventCallback({
    type: 'found',
    sources,
    query
  });
}
```

---

**Change D: Update End-Use Assessment (lines 429-472)**

**After line 429 (where allQueries is created), add deduplication:**

```typescript
// BEFORE deduplication
const allQueries = [
  ...siteSpecificQueries,
  ...useCaseSpecificQueries,
  ...broaderQueries
].slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);

// AFTER: Deduplicate then limit
const combinedQueries = [
  ...siteSpecificQueries,
  ...useCaseSpecificQueries,
  ...broaderQueries
];
const deduplicatedQueries = deduplicateQueries(combinedQueries);
const allQueries = deduplicatedQueries.slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);
```

**Update search call (line 448) - NO tbs parameter but ADD PDF exclusion:**

```typescript
// BEFORE
const results = await firecrawl.search(query, {
  limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
  scrapeOptions: { formats: ['markdown'] }
});

// AFTER: Add PDF exclusion (no tbs - need historical context)
const results = await firecrawl.search(query, {
  limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
  scrapeOptions: { formats: ['markdown'] },
  // No tbs parameter - need historical dual-use frameworks and regulations
  excludeUrlPatterns: ['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf'],  // CRITICAL: Exclude PDFs
  ignoreInvalidURLs: true
});
```

**Add audit trail logging with PDF tracking (after line 460, inside the try block):**

```typescript
searchResults.push(...sources);
newQueries.push(query);

// NEW: Add audit entry for query execution with PDF tracking
const pdfUrls = sources.filter(s => isPdfUrl(s.url)).map(s => s.url);
const pdfCount = pdfUrls.length;
const contentLengthZeroCount = sources.filter(s => !s.content || s.content.length === 0).length;

const queryAuditEntry: AuditEntry = {
  timestamp: Date.now(),
  event: 'query_executed',
  data: {
    query,
    phase: 'end-use-application',
    resultsCount: sources.length,
    // No tbs - need historical context for dual-use frameworks
    // PDF tracking
    pdfCount,
    pdfUrls: pdfCount > 0 ? pdfUrls : undefined,
    estimatedPdfCredits: pdfCount > 0 ? estimatePdfCredits(pdfCount) : undefined,
    contentLengthZeroCount
  }
};
if (!state.auditTrail) {
  (state as any).auditTrail = [];
}
(state as any).auditTrail.push(queryAuditEntry);

if (eventCallback && sources.length > 0) {
  eventCallback({
    type: 'found',
    sources,
    query
  });
}
```

---

### 4. lib/hrdd-preliminary-screening.ts

**Change: Reduce sanctions screening limit from 5 to 3 and add PDF exclusion**

**Before (line 186):**
```typescript
const results = await firecrawl.search(query, {
  limit: 5,
  scrapeOptions: { formats: ['markdown'] }
});
```

**After:**
```typescript
const results = await firecrawl.search(query, {
  limit: 3,  // Reduced from 5: sanctions are binary (sanctioned or not) - if not in top 3 results, entity is not sanctioned
  scrapeOptions: { formats: ['markdown'] },
  excludeUrlPatterns: ['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf'],  // CRITICAL: Exclude Treasury.gov 100+ page PDFs
  ignoreInvalidURLs: true
});
```

**Before (line 352):**
```typescript
const results = await firecrawl.search(query, {
  limit: 5,
  scrapeOptions: { formats: ['markdown'] }
});
```

**After:**
```typescript
const results = await firecrawl.search(query, {
  limit: 3,  // Reduced from 5: jurisdiction checks binary - if not in top 3 from authoritative sources, no systematic violations
  scrapeOptions: { formats: ['markdown'] },
  excludeUrlPatterns: ['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf'],  // CRITICAL: Exclude UN 50+ page report PDFs
  ignoreInvalidURLs: true
});
```

**Rationale:** Sanctions and jurisdiction checks are binary determinations. If an entity/country is sanctioned or has systematic violations, it appears prominently in top results from authoritative sources (OFAC, UN, ICC, Amnesty, HRW). Reducing from 5 to 3 saves 40% on preliminary screening without quality impact.

**Impact:** Preliminary screening queries: 5 sanctions queries × 3 sources = 15 sources (down from 25), 5 jurisdiction queries × 3 sources = 15 sources (down from 25). Total preliminary screening: 30 sources (down from 50).

---

### 5. lib/firecrawl.ts

**Change: Add tbs parameter and PDF exclusion support to search method**

**Before (line 103):**
```typescript
async search(query: string, options?: { limit?: number; scrapeOptions?: any }) {
  try {
    // Search with scrape - this gets us content immediately!
    const searchParams: any = {
      limit: options?.limit || 10,
    };

    // Add scrapeOptions to get content with search results
    if (options?.scrapeOptions !== false) {
      searchParams.scrapeOptions = {
        formats: ['markdown'],
        ...options?.scrapeOptions
      };
    }
```

**After:**
```typescript
async search(query: string, options?: {
  limit?: number;
  scrapeOptions?: any;
  tbs?: string;  // Time-based search parameter (qdr:h/d/w/m/y or custom like qdr:y3)
  excludeUrlPatterns?: string[];  // PDF exclusion patterns (CRITICAL FOR CREDIT SAVINGS)
  ignoreInvalidURLs?: boolean;    // Skip problematic URLs gracefully
}) {
  try {
    // Search with scrape - this gets us content immediately!
    const searchParams: any = {
      limit: options?.limit || 10,
    };

    // Add tbs parameter for time-based filtering if provided
    if (options?.tbs) {
      searchParams.tbs = options.tbs;
    }

    // Add PDF exclusion patterns (CRITICAL: Saves 1,640-4,100 credits per assessment)
    if (options?.excludeUrlPatterns) {
      searchParams.excludeUrlPatterns = options.excludeUrlPatterns;
    }

    // Add ignoreInvalidURLs flag
    if (options?.ignoreInvalidURLs !== undefined) {
      searchParams.ignoreInvalidURLs = options.ignoreInvalidURLs;
    }

    // Add scrapeOptions to get content with search results
    if (options?.scrapeOptions !== false) {
      searchParams.scrapeOptions = {
        formats: ['markdown'],
        ...options?.scrapeOptions
      };
    }
```

**Rationale:** The Firecrawl API supports the `tbs` (time-based search) parameter for temporal filtering and `excludeUrlPatterns` for PDF exclusion. This enables flexible time filtering without hardcoding years in query text, and eliminates PDF parsing costs.

---

### 6. lib/hrdd-state.ts

**Change: Update AuditEntry type to include PDF tracking fields**

**Before:**
```typescript
export interface AuditEntry {
  timestamp: number;
  event: string;
  data: {
    query?: string;
    phase?: string;
    resultsCount?: number;
    result?: any;
    queries?: string[];
    tbs?: string;
  };
}
```

**After:**
```typescript
export interface AuditEntry {
  timestamp: number;
  event: string;
  data: {
    query?: string;
    phase?: string;
    resultsCount?: number;
    result?: any;
    queries?: string[];
    tbs?: string;
    // NEW: PDF tracking fields
    pdfCount?: number;           // Number of PDF sources in results
    pdfUrls?: string[];          // List of PDF URLs for diagnosis
    estimatedPdfCredits?: number; // Estimated credits for PDFs (pdfCount × avg 30 pages)
    contentLengthZeroCount?: number; // Number of sources with zero content length
  };
}
```

**Rationale:** PDF tracking in audit trail enables immediate diagnosis of credit waste patterns in future assessments. After optimization, pdfCount should be 0 for all queries.

---

### 7. config/hrdd-sources.json

**Change: Add preferred_paths and exclude_paths to sources with PDF-heavy directories**

See detailed examples in Requirement #9 implementation above. Update the following sources:

**Geographic Context Sources:**
- Freedom House: Add preferred_paths: ["/country/", "/countries/"], exclude_paths: ["/report/", "/sites/default/files/"]
- Amnesty International: Add preferred_paths: ["/en/countries/", "/en/latest/news/"], exclude_paths: ["/en/documents/", "/en/wp-content/uploads/"]
- UN OHCHR: Add exclude_paths: ["/Documents/", "/Publications/"]

**Customer Profile Sources:**
- OFAC Sanctions: Add preferred_paths: ["/resource-center/sanctions/"], exclude_paths: ["/ofac/downloads/"]
- SIPRI: Add preferred_paths: ["/databases/armstransfers/"], exclude_paths: ["/sites/default/files/", "/yearbook/"]

**End-Use Application Sources:**
- Stop Killer Robots: Add preferred_paths: ["/learn/", "/news/"], exclude_paths: ["/wp-content/uploads/"]
- EU Frameworks: Add preferred_paths: ["/policies/"], exclude_paths: ["/documents/"]

---

## Out of Scope
- Changing risk classification logic or thresholds in HRDD_RISK_THRESHOLDS
- Modifying preliminary screening criteria (weapons, sanctions, jurisdiction definitions)
- Altering report synthesis prompt or final output format
- Changing LangGraph workflow structure in hrdd-workflow-engine.ts
- Modifying underlying Firecrawl SDK (@mendable/firecrawl-js) - only extending client wrapper
- Adding new risk factors beyond existing three (Geographic, Customer, End-Use)

## Success Criteria

### Quantitative Metrics
1. Queries per assessment: 66 → 30 queries (55% reduction)
   - Preliminary screening: 10 queries (unchanged) × 3 sources/query = 30 sources (was 50)
   - Geographic context: 8 queries × 10 sources/query = 80 sources (was 200)
   - Customer profile: 8 queries × 10 sources/query = 80 sources (was 200)
   - End-use application: 8 queries × 10 sources/query = 80 sources (was 200)
   - **Total: ~250 sources (was ~660)**

2. **Credit usage per assessment: ~5,000-7,000 → ~250 credits (95% reduction)**
   - Before: 466 HTML sources (466 credits) + 82 PDFs × 20-50 pages (1,640-4,100 credits) = 2,106-4,566 credits minimum, likely 5,000-7,000 total
   - After: ~250 HTML sources (250 credits) + 0 PDFs (0 credits) = **~250 credits total**

3. **PDF sources per assessment: 82 → 0 PDFs (100% elimination)**

4. **Content parsing success: 0% → 100%**
   - Before: All 466 sources showed 0 content length (PDF parsing failures)
   - After: All sources should have non-zero content (HTML parses reliably)

5. Processing time: 30-40 min → 12-15 min (60% improvement)

6. Zero-result queries: Current: ~5-10 per assessment → Target: 0
   - Verify via audit trail analysis: no queries with product names like "Metis", "Sigma Connectivity"

7. Duplicate queries: Current: ~3-5 per assessment → Target: 0
   - Verify via audit trail analysis: all queries unique after normalization

### Qualitative Metrics
1. Audit trail completeness: 100% of queries logged (currently ~8% - only preliminary screening)
   - Verify audit trail contains entries for all phases: preliminary-screening-sanctions, preliminary-screening-jurisdiction, geographic-context, customer-profile, end-use-application

2. Query relevance: 100% of queries use generic technical terms (no proprietary product names)
   - Manual review of generated queries from end-use prompt

3. Temporal coverage: Queries find current year + historical data (not limited to hardcoded 2024)
   - Verify Freedom House scores from most recent year (2024 or 2025)
   - Verify adverse media includes articles from past 3 years dynamically

4. **PDF tracking visibility: 100% of audit entries include PDF metrics**
   - Verify all audit entries have pdfCount, estimatedPdfCredits, contentLengthZeroCount fields
   - After optimization, all entries should show pdfCount: 0

### Performance Validation Tests
Run the following assessments and compare before/after metrics:

**Test Case 1: SAAB Sweden (Baseline)**
- Before: 466 sources (82 PDFs), ~5,000-7,000 credits, 34 minutes, 0% content parsing
- After Target: ~250 sources (0 PDFs), ~250 credits, 12-15 minutes, 100% content parsing

**Test Case 2: New Dossier (Generic Dual-Use)**
- Customer: Generic defense contractor in EU member state
- Use Case: Vision optronics for military binoculars (no proprietary names)
- Expected: All queries return results, no zero-result queries, 0 PDFs

**Test Case 3: Audit Trail Completeness**
- Run any assessment
- Export audit trail to CSV using existing /api/audit-trail/export
- Verify all queries from all phases are present (preliminary screening + Enhanced DD)
- **Verify PDF tracking: pdfCount = 0 for all entries, contentLengthZeroCount = 0 for all entries**

## Risk Assessment

### Critical Risk: PDF Exclusion May Block Legitimate Sources
**Risk:** Some critical information may only be available in PDF format
**Mitigation:**
- Most authoritative sources provide HTML versions (Freedom House country pages, Amnesty country reports)
- Sanctions databases have HTML search interfaces (sanctionssearch.ofac.treas.gov)
- If PDF is truly only source, manual review can supplement
- Analysis showed 0% content parsing from PDFs anyway - excluding them removes noise, not signal
- Success criteria includes maintaining risk classification accuracy on regression tests

**Likelihood:** Low
**Impact:** Medium
**Overall Risk:** Low

### High Risk
**Risk:** Reducing queries from 20 to 8 may miss critical information
**Mitigation:**
- GPT-4o prompt engineering emphasizes generating high-quality, diverse queries
- Queries target authoritative sources first (Freedom House, OFAC, UN, etc.)
- Analysis of SAAB case showed diminishing returns after 8 queries
- Success criteria includes maintaining risk classification accuracy on regression tests

### Medium Risk
**Risk:** Removing product names may reduce specificity of end-use research
**Mitigation:**
- Generic technical terms (e.g., "chip down design", "drone navigation") find regulatory frameworks and similar systems
- Proprietary names yield zero results anyway (unrealized sales have no public documentation)
- End-use risk assessment focuses on technical capabilities, not specific product implementations

### Low Risk
**Risk:** Firecrawl API may not support `tbs` parameter
**Mitigation:**
- Firecrawl uses Google Search API which supports `tbs` parameter
- If unsupported, search will ignore parameter gracefully (no breaking change)
- Can verify by testing with Firecrawl playground or API docs

**Risk:** Firecrawl API may not support `excludeUrlPatterns` parameter
**Mitigation:**
- Firecrawl documentation confirms support for excludeUrlPatterns
- If unsupported, search will ignore parameter gracefully (fallback to current behavior)
- Test in sandbox environment before production deployment

**Risk:** Query deduplication may remove intentionally similar queries
**Mitigation:**
- Normalization only removes exact duplicates (case-insensitive, whitespace-normalized)
- Semantically similar but distinct queries (e.g., "Freedom House Sweden score" vs "Sweden Freedom House rating") are preserved
- LLM is prompted to generate diverse queries, so duplicates are accidental

## Testing Strategy

### Unit Tests
Create `/lib/__tests__/hrdd-risk-factors.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('Query Deduplication', () => {
  it('should remove exact duplicates', () => {
    const queries = [
      'site:freedomhouse.org Sweden freedom score',
      'site:freedomhouse.org Sweden freedom score',  // Exact duplicate
      'site:ohchr.org Sweden human rights'
    ];
    const unique = deduplicateQueries(queries);
    expect(unique).toHaveLength(2);
  });

  it('should remove case-insensitive duplicates', () => {
    const queries = [
      'Site:FREEDOMHOUSE.org Sweden Freedom Score',
      'site:freedomhouse.org sweden freedom score',
      'site:ohchr.org Sweden human rights'
    ];
    const unique = deduplicateQueries(queries);
    expect(unique).toHaveLength(2);
  });

  it('should remove whitespace-insensitive duplicates', () => {
    const queries = [
      'site:freedomhouse.org   Sweden  freedom   score',
      'site:freedomhouse.org Sweden freedom score',
      'site:ohchr.org Sweden human rights'
    ];
    const unique = deduplicateQueries(queries);
    expect(unique).toHaveLength(2);
  });

  it('should preserve original casing of first occurrence', () => {
    const queries = [
      'Site:FREEDOMHOUSE.org Sweden Freedom Score',
      'site:freedomhouse.org sweden freedom score',
    ];
    const unique = deduplicateQueries(queries);
    expect(unique[0]).toBe('Site:FREEDOMHOUSE.org Sweden Freedom Score');
  });
});

describe('PDF Detection', () => {
  it('should detect .pdf file extensions', () => {
    expect(isPdfUrl('https://treasury.gov/ofac/downloads/sdnew12.pdf')).toBe(true);
    expect(isPdfUrl('https://amnesty.org/report.PDF')).toBe(true);
  });

  it('should detect /pdf/ directories', () => {
    expect(isPdfUrl('https://example.com/pdf/report.html')).toBe(true);
    expect(isPdfUrl('https://example.com/documents/PDF/file.doc')).toBe(true);
  });

  it('should detect /downloads/ directories', () => {
    expect(isPdfUrl('https://example.com/downloads/report.html')).toBe(true);
  });

  it('should not detect non-PDF URLs', () => {
    expect(isPdfUrl('https://freedomhouse.org/country/sweden')).toBe(false);
    expect(isPdfUrl('https://amnesty.org/en/countries/europe/sweden/')).toBe(false);
  });
});

describe('PDF Credit Estimation', () => {
  it('should estimate credits for PDFs', () => {
    expect(estimatePdfCredits(5)).toBe(150);  // 5 PDFs × 30 pages
    expect(estimatePdfCredits(82)).toBe(2460); // 82 PDFs × 30 pages
  });
});
```

### Integration Tests
Create `/lib/__tests__/hrdd-audit-trail.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { runHRDDWorkflow } from '../hrdd-workflow-engine';

describe('Audit Trail Logging', () => {
  it('should log all queries from all phases', async () => {
    const dossier = {
      customer: 'Test Customer',
      useCase: 'Generic edge processing for drone navigation',
      country: 'Sweden'
    };

    const result = await runHRDDWorkflow(dossier);
    const auditEntries = result.auditTrail.filter(e => e.event === 'query_executed');

    // Should have queries from all phases
    const phases = auditEntries.map(e => e.data.phase);
    expect(phases).toContain('preliminary-screening-sanctions');
    expect(phases).toContain('preliminary-screening-jurisdiction');
    expect(phases).toContain('geographic-context');
    expect(phases).toContain('customer-profile');
    expect(phases).toContain('end-use-application');

    // Total queries should be ~30 (10 preliminary + 8 geographic + 8 customer + 8 end-use - some deduplication)
    expect(auditEntries.length).toBeGreaterThanOrEqual(25);
    expect(auditEntries.length).toBeLessThanOrEqual(35);
  });

  it('should include tbs parameter in geographic context queries', async () => {
    const dossier = {
      customer: 'Test Customer',
      useCase: 'Generic edge processing',
      country: 'Sweden'
    };

    const result = await runHRDDWorkflow(dossier);
    const geoQueries = result.auditTrail.filter(
      e => e.event === 'query_executed' && e.data.phase === 'geographic-context'
    );

    // All geographic queries should have tbs: 'qdr:y'
    geoQueries.forEach(entry => {
      expect(entry.data.tbs).toBe('qdr:y');
    });
  });

  it('should track PDF metrics in all audit entries', async () => {
    const dossier = {
      customer: 'Test Customer',
      useCase: 'Generic edge processing',
      country: 'Sweden'
    };

    const result = await runHRDDWorkflow(dossier);
    const auditEntries = result.auditTrail.filter(e => e.event === 'query_executed');

    // All queries should have PDF tracking fields
    auditEntries.forEach(entry => {
      expect(entry.data).toHaveProperty('pdfCount');
      expect(entry.data).toHaveProperty('contentLengthZeroCount');

      // After optimization, all should be 0
      expect(entry.data.pdfCount).toBe(0);
      expect(entry.data.contentLengthZeroCount).toBe(0);
    });
  });
});
```

### Regression Tests
Run on historical dossiers and compare risk classifications:

```typescript
import { describe, it, expect } from 'vitest';
import { runHRDDWorkflow } from '../hrdd-workflow-engine';

describe('Risk Classification Regression', () => {
  it('SAAB Sweden should maintain same risk classification', async () => {
    const dossier = {
      customer: 'SAAB',
      useCase: 'Vision optronics for military binoculars with edge processing',
      country: 'Sweden'
    };

    const result = await runHRDDWorkflow(dossier);

    // Expected from previous assessment (update with actual baseline)
    expect(result.geographicRisk.level).toBe('Low');  // EU member, Free country
    expect(result.customerRisk.level).toBe('Low');     // Strong governance
    expect(result.endUseRisk.level).toBe('Medium');    // Combat-enabling but defensive
    expect(result.overallRisk).toBe('Medium');         // Highest of three factors

    // Verify PDF exclusion worked
    const totalPdfs = result.auditTrail
      .filter(e => e.event === 'query_executed')
      .reduce((sum, e) => sum + (e.data.pdfCount || 0), 0);
    expect(totalPdfs).toBe(0);

    // Verify content parsing success
    const totalContentZero = result.auditTrail
      .filter(e => e.event === 'query_executed')
      .reduce((sum, e) => sum + (e.data.contentLengthZeroCount || 0), 0);
    expect(totalContentZero).toBe(0);
  });
});
```

### Manual Validation Checklist
1. Run SAAB Sweden assessment
2. Export audit trail to CSV via /api/audit-trail/export
3. Verify:
   - [ ] Total sources ~250 (vs previous ~660)
   - [ ] **Total PDFs 0 (vs previous 82)**
   - [ ] **Estimated PDF credits 0 (vs previous 1,640-4,100)**
   - [ ] **Content length zero count 0 (vs previous 466)**
   - [ ] Processing time 12-15 minutes (vs previous 30-40 min)
   - [ ] All queries logged in audit trail (no missing phases)
   - [ ] No queries contain "Metis", "Sigma", or other proprietary names
   - [ ] Geographic queries have tbs parameter in audit data
   - [ ] No duplicate queries in audit trail
4. Review generated queries from LLM for end-use phase
5. Verify Freedom House score is from most recent year (not hardcoded 2024)
6. **Verify PDF exclusion is working**: Search for ".pdf" in audit trail pdfUrls field - should be empty

## Implementation Sequence

### Phase 1: CRITICAL - PDF Exclusion (Immediate 95% Impact)
1. **Update Firecrawl client to support excludeUrlPatterns and ignoreInvalidURLs** (lib/firecrawl.ts)
2. **Add PDF exclusion to all Firecrawl search calls** (lib/hrdd-risk-factors.ts, lib/hrdd-preliminary-screening.ts)
3. **Update AuditEntry type to include PDF tracking fields** (lib/hrdd-state.ts)
4. **Add PDF detection and tracking helpers** (lib/hrdd-risk-factors.ts)
5. **Add PDF tracking to all audit entries** (lib/hrdd-risk-factors.ts, lib/hrdd-preliminary-screening.ts)

**Expected Impact:** Eliminates 1,640-4,100 credits from PDF parsing, improves content parsing to 100%

### Phase 2: High Priority (Query Optimization)
6. Update HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR: 20 → 8
7. Update Geographic, Customer, End-Use prompts: "15-20 queries" → "6-8 queries"
8. Update End-Use prompt: Add exclusion instructions for proprietary names
9. Reduce sanctions/jurisdiction limits: 5 → 3

**Expected Impact:** 60% query reduction, zero-result queries eliminated

### Phase 3: Medium Priority (Quality Improvements)
10. Add `tbs` parameter support to Firecrawl client
11. Update Geographic, Customer assessments to use `tbs` parameter
12. Remove year constraints from Geographic and Customer prompts
13. Add query deduplication helper functions
14. Apply deduplication in all three assessment functions
15. **Update prompts with PDF avoidance instructions** (Req #8, #9)
16. **Update hrdd-sources.json with preferred_paths and exclude_paths** (Req #9)

**Expected Impact:** More flexible temporal filtering, no duplicate queries, improved query targeting

### Phase 4: Low Priority (Observability)
17. Ensure audit trail logging is complete in all phases
18. Add audit trail summary logging at end of workflow

**Expected Impact:** Complete audit trail coverage for future diagnosis

### Phase 5: Testing & Validation
19. Write unit tests for deduplication and PDF detection
20. Write integration tests for audit trail completeness and PDF tracking
21. Run regression tests on historical dossiers
22. Manual validation with SAAB Sweden assessment
23. Performance validation (timing and credit usage)

## Rollback Plan
If risk classification accuracy degrades or processing fails:

1. **Quick Rollback:** Remove excludeUrlPatterns from all search calls (reverts to current behavior)
2. **Partial Rollback - Config Only:** Revert MAX_QUERIES_PER_FACTOR to 20 (single line change)
3. **Partial Rollback - Prompts Only:** Keep optimized config but revert prompt changes
4. **Full Rollback:** Revert all changes via git (including PDF exclusion)

**Rollback Trigger Criteria:**
- Any regression test fails (risk classification changes unexpectedly)
- Processing errors increase >10%
- Manual review identifies critical information gaps in reports
- **PDF exclusion blocks access to truly critical sources** (monitor first 5 assessments)

## Deployment Notes
- No database migrations required
- No API version changes required
- Changes are backward compatible (existing workflow engine unchanged)
- Can deploy incrementally:
  1. **Phase 1 (PDF Exclusion) FIRST** - highest impact, monitor for 5 assessments
  2. Phase 2 (Query Optimization) - validate risk classification accuracy
  3. Phases 3-4 (Quality + Observability) - lower risk enhancements
- Monitor Firecrawl API usage in Vercel logs post-deployment to confirm credit reduction
- **Monitor audit trail exports for first 5 assessments to validate PDF exclusion working correctly**

## Related Documentation
- Requirements: `/home/hughbrown/code/firecrawl/firesearch/agent-os/specs/2025-01-23-hrdd-search-optimization/planning/requirements.md`
- Firecrawl API Docs: https://docs.firecrawl.dev/features/search
- Google Search tbs Parameter: https://developers.google.com/custom-search/docs/xml_results#tbsp
- HRDD Guide Annex 3: (Internal compliance document - reference for risk thresholds)
