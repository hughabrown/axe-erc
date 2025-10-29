# Task Breakdown: HRDD Search Optimization

## Overview
Total Task Groups: 5
Estimated Total Effort: 4-5.25 hours
Target Outcome: 95% reduction in Firecrawl API credit usage (~5,000-7,000 → ~250 credits per assessment)

## Available Implementers
- **api-engineer**: Backend business logic, API integration, configuration changes
- **testing-engineer**: Test coverage analysis and strategic test writing

## Task List

---

### Task Group 0: CRITICAL - PDF Exclusion (Highest Impact - 95% Credit Reduction)
**Assigned implementer:** api-engineer
**Dependencies:** None
**Priority:** CRITICAL - Delivers 95% of total optimization impact
**Estimated Effort:** Medium (60-75 minutes)

- [ ] 0.0 Implement PDF exclusion across all search phases (CRITICAL)
  - [ ] 0.1 Update Firecrawl Client to support PDF exclusion parameters
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/firecrawl.ts`
    - **Location:** Line 103 (search method signature)
    - **Action 1:** Update method signature to include excludeUrlPatterns and ignoreInvalidURLs:
      ```typescript
      // BEFORE (line 103):
      async search(query: string, options?: { limit?: number; scrapeOptions?: any }) {

      // AFTER:
      async search(query: string, options?: {
        limit?: number;
        scrapeOptions?: any;
        tbs?: string;  // Time-based search parameter
        excludeUrlPatterns?: string[];  // PDF exclusion patterns (CRITICAL FOR CREDIT SAVINGS)
        ignoreInvalidURLs?: boolean;    // Skip problematic URLs gracefully
      }) {
      ```
    - **Action 2:** After line 107 (after limit is set), add PDF exclusion parameter handling:
      ```typescript
      // Add PDF exclusion patterns (CRITICAL: Saves 1,640-4,100 credits per assessment)
      if (options?.excludeUrlPatterns) {
        searchParams.excludeUrlPatterns = options.excludeUrlPatterns;
      }

      // Add ignoreInvalidURLs flag
      if (options?.ignoreInvalidURLs !== undefined) {
        searchParams.ignoreInvalidURLs = options.ignoreInvalidURLs;
      }
      ```
    - **Verification:** Test that excludeUrlPatterns parameter is passed through to Firecrawl API

  - [ ] 0.2 Add PDF exclusion to Geographic Context Assessment searches
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** Line 118 (search call in geographicContextAssessment)
    - **Action:** Update search call to include PDF exclusion and tbs parameter:
      ```typescript
      // BEFORE (line 118):
      const results = await firecrawl.search(query, {
        limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
        scrapeOptions: { formats: ['markdown'] }
      });

      // AFTER: Add PDF exclusion + tbs parameter
      const results = await firecrawl.search(query, {
        limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
        scrapeOptions: { formats: ['markdown'] },
        tbs: 'qdr:y',  // Last year - for current Freedom House scores
        excludeUrlPatterns: ['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf'],  // CRITICAL: Exclude PDFs
        ignoreInvalidURLs: true  // Skip problematic URLs gracefully
      });
      ```
    - **Expected Impact:** Eliminates ~10 Amnesty/Freedom House PDFs (200-500 credits saved)

  - [ ] 0.3 Add PDF exclusion to Customer Profile Assessment searches
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** Line 284 (search call in customerProfileAssessment)
    - **Action:** Update search call to include PDF exclusion and conditional tbs:
      ```typescript
      // BEFORE (line 284):
      const results = await firecrawl.search(query, {
        limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
        scrapeOptions: { formats: ['markdown'] }
      });

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
    - **Expected Impact:** Eliminates ~8 SAAB corporate report PDFs (240-400 credits saved)

  - [ ] 0.4 Add PDF exclusion to End-Use Assessment searches
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** Line 448 (search call in endUseAssessment)
    - **Action:** Update search call to include PDF exclusion (no tbs - need historical context):
      ```typescript
      // BEFORE (line 448):
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
    - **Expected Impact:** Eliminates ~13 Stop Killer Robots/EU policy PDFs (390-650 credits saved)

  - [ ] 0.5 Add PDF exclusion to Preliminary Screening Sanctions searches
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-preliminary-screening.ts`
    - **Location:** Line 186 (sanctions check search call)
    - **Action:** Update search call to include PDF exclusion and reduce limit:
      ```typescript
      // BEFORE (line 186):
      const results = await firecrawl.search(query, {
        limit: 5,
        scrapeOptions: { formats: ['markdown'] }
      });

      // AFTER: Add PDF exclusion + reduce limit
      const results = await firecrawl.search(query, {
        limit: 3,  // Reduced from 5: sanctions are binary (sanctioned or not)
        scrapeOptions: { formats: ['markdown'] },
        excludeUrlPatterns: ['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf'],  // CRITICAL: Exclude Treasury.gov 100+ page PDFs
        ignoreInvalidURLs: true
      });
      ```
    - **Expected Impact:** Eliminates ~5 Treasury.gov OFAC PDFs (500+ credits saved - largest single savings)

  - [ ] 0.6 Add PDF exclusion to Preliminary Screening Jurisdiction searches
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-preliminary-screening.ts`
    - **Location:** Line 352 (jurisdiction check search call)
    - **Action:** Update search call to include PDF exclusion and reduce limit:
      ```typescript
      // BEFORE (line 352):
      const results = await firecrawl.search(query, {
        limit: 5,
        scrapeOptions: { formats: ['markdown'] }
      });

      // AFTER: Add PDF exclusion + reduce limit
      const results = await firecrawl.search(query, {
        limit: 3,  // Reduced from 5: jurisdiction checks binary
        scrapeOptions: { formats: ['markdown'] },
        excludeUrlPatterns: ['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf'],  // CRITICAL: Exclude UN 50+ page report PDFs
        ignoreInvalidURLs: true
      });
      ```
    - **Expected Impact:** Eliminates UN/ICC PDFs (300-500 credits saved)

  - [ ] 0.7 Update AuditEntry type to include PDF tracking fields
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-state.ts`
    - **Location:** Line 141 (AuditEntry interface)
    - **Action:** Add PDF tracking fields to data object:
      ```typescript
      // BEFORE (lines 141-145):
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
    - **Rationale:** PDF tracking enables immediate diagnosis of credit waste patterns

  - [ ] 0.8 Add PDF detection and tracking helper functions
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** After imports, before first exported function (before line 50)
    - **Action:** Add helper functions for PDF detection and credit estimation:
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
    - **Verification:** Functions should be private (not exported)

  - [ ] 0.9 Add PDF tracking to Geographic Context audit entries
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** After line 130 (inside try block after searchResults.push)
    - **Action:** Add PDF tracking to audit entry creation:
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

  - [ ] 0.10 Add PDF tracking to Customer Profile audit entries
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** After line 296 (inside try block after searchResults.push)
    - **Action:** Add PDF tracking with conditional tbs:
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

  - [ ] 0.11 Add PDF tracking to End-Use audit entries
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** After line 460 (inside try block after searchResults.push)
    - **Action:** Add PDF tracking without tbs:
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

  - [ ] 0.12 Add PDF avoidance instructions to Geographic Query Generation Prompt
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-prompts.ts`
    - **Location:** After line 461 (after "INSTRUCTIONS:")
    - **Action:** Add PDF avoidance strategy section:
      ```typescript
      // ADD AFTER LINE 461:
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

  - [ ] 0.13 Add PDF avoidance instructions to Customer Query Generation Prompt
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-prompts.ts`
    - **Location:** After line 514 (in INSTRUCTIONS section)
    - **Action:** Add domain-specific PDF avoidance:
      ```typescript
      // ADD AFTER LINE 514:
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

  - [ ] 0.14 Add PDF avoidance instructions to End-Use Query Generation Prompt
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-prompts.ts`
    - **Location:** After line 586 (in INSTRUCTIONS section)
    - **Action:** Add autonomous weapons research PDF avoidance:
      ```typescript
      // ADD AFTER LINE 586:
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

  - [ ] 0.15 Update Sanctions Check Prompt to note PDF exclusion
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-prompts.ts`
    - **Location:** After line 85 (in INPUT section)
    - **Action:** Add note about HTML results:
      ```typescript
      // ADD AFTER LINE 85:
      NOTE: Search results may exclude large PDF database dumps. If sanctions are not found in HTML search results from authoritative sources (sanctionssearch.ofac.treas.gov, sanctionsmap.eu, un.org/securitycouncil/sanctions), entity is likely not sanctioned.
      ```

  - [ ] 0.16 Verify all PDF exclusion changes compile successfully
    - **Action:** Run `npm run build` to ensure TypeScript compilation succeeds
    - **Expected:** No build errors, warnings acceptable

**Acceptance Criteria:**
- Firecrawl client accepts and passes through excludeUrlPatterns and ignoreInvalidURLs parameters
- All 5 search functions (3 risk factors + 2 preliminary screening) include PDF exclusion
- AuditEntry type includes pdfCount, pdfUrls, estimatedPdfCredits, contentLengthZeroCount fields
- PDF detection helpers (isPdfUrl, estimatePdfCredits) are implemented and private
- All audit entries include PDF tracking metrics
- All 3 query generation prompts include PDF avoidance instructions
- Code compiles successfully with no errors

**Expected Impact:**
- **Eliminates 82 PDFs** = 1,640-4,100 credits saved (assuming 20-50 pages/PDF)
- **Total credit reduction: ~5,000-7,000 → ~250 credits (95% reduction)**
- **Improves content parsing success: 0% → 100%** (HTML parses reliably, PDFs often fail)
- **Processing time improvement:** Faster search results without PDF rendering delays
- **Complete visibility:** Audit trail tracks PDF count and estimated credits for future diagnosis

---

### Task Group 1: High Priority Configuration & Prompt Changes (Query Optimization)
**Assigned implementer:** api-engineer
**Dependencies:** None (can run parallel with Task Group 0, but 0 is higher priority)
**Priority:** HIGH - Delivers 55% query reduction (after PDF exclusion)
**Estimated Effort:** Medium (45-60 minutes)

- [ ] 1.0 Apply high-impact configuration and prompt optimizations
  - [ ] 1.1 Update MAX_QUERIES_PER_FACTOR configuration
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-config.ts`
    - **Action:** Change line 46 from `MAX_QUERIES_PER_FACTOR: 20` to `MAX_QUERIES_PER_FACTOR: 8`
    - **Add comment:** `// Reduced from 20 for cost optimization (analysis shows diminishing returns after 8 queries)`
    - **Verification:** Value should be 8, type should remain const

  - [ ] 1.2 Update Geographic Query Generation Prompt
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-prompts.ts`
    - **Location:** Line 467 in GEOGRAPHIC_QUERY_GENERATION_PROMPT
    - **Action 1:** Change instruction 5 from "Generate 15-20 total queries" to "Generate 6-8 total queries"
    - **Action 2:** Add new instruction 6: "DO NOT include year constraints in queries (e.g., '2024', '2020-2024') - time filtering handled separately"
    - **Action 3:** Remove year references from example queries (lines 472-483)
    - **Example:** Change `"site:freedomhouse.org {country} freedom score 2024"` to `"site:freedomhouse.org {country} freedom score"`
    - **Rationale in example:** Change to "Get most recent numeric freedom score for threshold comparison"

  - [ ] 1.3 Update Customer Query Generation Prompt
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-prompts.ts`
    - **Location:** Line 519 in CUSTOMER_QUERY_GENERATION_PROMPT
    - **Action 1:** Change instruction 5 from "Generate 15-20 total queries" to "Generate 6-8 total queries"
    - **Action 2:** Add new instruction 6: "For adverse media queries, do NOT include year ranges in query text - time filtering handled separately"
    - **Action 3:** Update adverse media example (line 538): Change `"{customer} human rights violation 2020-2024"` to `"{customer} human rights violation"`
    - **Action 4:** Update date_scope from "past 5 years" to "past 3 years"
    - **Action 5:** Update rationale to "Find recent adverse media (time-filtered to past 3 years)"

  - [ ] 1.4 Update End-Use Query Generation Prompt - Remove Product Name Instructions
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-prompts.ts`
    - **Location:** Lines 561-616 in END_USE_QUERY_GENERATION_PROMPT
    - **Action 1:** Replace line 563 task description with: "Generate USE-CASE-SPECIFIC search queries to assess end-use application risk. Queries must reference GENERIC technical concepts extracted from the use case, EXCLUDING proprietary product names, customer names, or project-specific identifiers that don't exist publicly."
    - **Action 2:** Add new section after line 568:
      ```
      CRITICAL EXCLUSIONS:
      - DO NOT include proprietary product names (e.g., "Metis", "Sigma Connectivity")
      - DO NOT include customer-specific project names or codenames
      - DO NOT include unrealized sales opportunity identifiers
      - ONLY extract generic technical terms that have public search results (e.g., "chip down design", "edge processing", "drone navigation")

      WHY: Unrealized sales opportunities have no public documentation. Queries with proprietary names yield zero results and waste API credits.
      ```
    - **Action 3:** Replace example section (lines 580-584) with:
      ```
      EXAMPLE USE CASE: "SAAB Sweden is purchasing Metis Chip Down Design for Sigma Connectivity in military drone navigation systems"

      EXTRACTED TECHNICAL TERMS:
      - ✅ GOOD: ["chip down design", "drone navigation", "military navigation systems"]
      - ❌ BAD: ["Metis", "Sigma Connectivity"] (proprietary names with no public results)

      EXAMPLE QUERIES:
      - ✅ GOOD: "chip down design military drone navigation dual-use export controls"
      - ✅ GOOD: "edge processing autonomous navigation human control"
      - ❌ BAD: "Metis Chip Down Design Sigma Connectivity dual-use export regulations" (proprietary terms)
      ```
    - **Action 4:** Update instruction 6 (line 592) from "Generate 15-20 total queries" to "Generate 6-8 total queries"

  - [ ] 1.5 Verify all changes compile successfully
    - **Action:** Run `npm run build` to ensure TypeScript compilation succeeds
    - **Expected:** No build errors, warnings acceptable

**Acceptance Criteria:**
- MAX_QUERIES_PER_FACTOR is 8 (down from 20)
- All three query generation prompts instruct LLM to generate 6-8 queries
- Geographic and Customer prompts exclude year references
- End-Use prompt excludes proprietary product name instructions with clear examples
- Code compiles successfully with no errors

**Expected Impact:**
- Queries per assessment: 66 → ~30 (55% reduction)
- End-use queries: Zero-result queries eliminated
- Combined with Task Group 0 PDF exclusion: Total sources ~660 → ~250 (62% reduction)

---

### Task Group 2: Query Deduplication & Temporal Filtering (Quality Improvements)
**Assigned implementer:** api-engineer
**Dependencies:** Task Groups 0 and 1 (should be completed first for testing)
**Priority:** MEDIUM - Prevents duplicate queries and enables flexible time filtering
**Estimated Effort:** Large (75-90 minutes)

- [ ] 2.0 Implement query deduplication and Firecrawl tbs parameter support
  - [ ] 2.1 Add tbs parameter support to Firecrawl client (if not already added in Task Group 0)
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/firecrawl.ts`
    - **Location:** Line 103 (search method signature)
    - **Note:** If this was already added in Task Group 0 step 0.1, skip to step 2.2
    - **Action 1:** Update method signature to include tbs parameter (see Task Group 0 step 0.1)
    - **Action 2:** After line 107, add tbs parameter handling:
      ```typescript
      // Add tbs parameter for time-based filtering if provided
      if (options?.tbs) {
        searchParams.tbs = options.tbs;
      }
      ```
    - **Verification:** Test that tbs parameter is passed through to Firecrawl API

  - [ ] 2.2 Add query deduplication helper functions
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** After imports, before first exported function (before line 50)
    - **Note:** Place after PDF detection helpers added in Task Group 0
    - **Action:** Add two helper functions:
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
      ```
    - **Verification:** Functions should be private (not exported) and follow TypeScript best practices

  - [ ] 2.3 Apply deduplication in Geographic Context Assessment
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** Line 99 (where allQueries is created)
    - **Action:** Replace query array slicing with deduplication:
      ```typescript
      // BEFORE (line 99):
      const allQueries = [...siteSpecificQueries, ...broaderQueries].slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);

      // AFTER:
      const deduplicatedQueries = deduplicateQueries([...siteSpecificQueries, ...broaderQueries]);
      const allQueries = deduplicatedQueries.slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);
      ```

  - [ ] 2.4 Apply deduplication in Customer Profile Assessment
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** Lines 260-265 (where allQueries is created)
    - **Action:** Replace query array slicing with deduplication:
      ```typescript
      // BEFORE (lines 260-265):
      const allQueries = [
        ...customerWebsiteQueries,
        ...siteSpecificQueries,
        ...adverseMediaQueries,
        ...broaderQueries
      ].slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);

      // AFTER:
      const combinedQueries = [
        ...customerWebsiteQueries,
        ...siteSpecificQueries,
        ...adverseMediaQueries,
        ...broaderQueries
      ];
      const deduplicatedQueries = deduplicateQueries(combinedQueries);
      const allQueries = deduplicatedQueries.slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);
      ```

  - [ ] 2.5 Apply deduplication in End-Use Assessment
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** Lines 425-429 (where allQueries is created)
    - **Action:** Replace query array slicing with deduplication:
      ```typescript
      // BEFORE (lines 425-429):
      const allQueries = [
        ...siteSpecificQueries,
        ...useCaseSpecificQueries,
        ...broaderQueries
      ].slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);

      // AFTER:
      const combinedQueries = [
        ...siteSpecificQueries,
        ...useCaseSpecificQueries,
        ...broaderQueries
      ];
      const deduplicatedQueries = deduplicateQueries(combinedQueries);
      const allQueries = deduplicatedQueries.slice(0, HRDD_WORKFLOW_CONFIG.MAX_QUERIES_PER_FACTOR);
      ```

  - [ ] 2.6 Verify End-Use searches have NO tbs parameter
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** Line 448 (search call in endUseAssessment)
    - **Note:** This should already be correct from Task Group 0 step 0.4
    - **Action:** Verify comment is present clarifying no temporal restriction:
      ```typescript
      // Line 448 - NO CHANGE to search call, just verify comment is present:
      // No tbs parameter - need historical context for dual-use frameworks, regulations, and autonomous weapons definitions
      const results = await firecrawl.search(query, {
        limit: HRDD_WORKFLOW_CONFIG.MAX_SOURCES_PER_QUERY,
        scrapeOptions: { formats: ['markdown'] },
        excludeUrlPatterns: ['*.pdf', '*/pdf/*', '*/downloads/*', '*/documents/*.pdf'],
        ignoreInvalidURLs: true
      });
      ```

  - [ ] 2.7 Verify all changes compile successfully
    - **Action:** Run `npm run build` to ensure TypeScript compilation succeeds
    - **Expected:** No build errors, warnings acceptable

**Acceptance Criteria:**
- Firecrawl client accepts and passes through tbs parameter (if not already done in Task Group 0)
- Query deduplication helper functions are implemented and private
- Deduplication applied in all three risk factor assessment functions
- Geographic queries use `tbs: 'qdr:y'` (last year) - from Task Group 0
- Customer adverse media queries use `tbs: 'qdr:y3'` (last 3 years) - from Task Group 0
- End-use queries have NO tbs parameter (with clarifying comment)
- Code compiles successfully with no errors

**Expected Impact:**
- Duplicate queries eliminated (currently ~3-5 per assessment)
- More flexible temporal filtering without hardcoded years
- Future-proof against year changes (2024 → 2025, etc.)

---

### Task Group 3: Audit Trail Logging (Observability)
**Assigned implementer:** api-engineer
**Dependencies:** Task Groups 0, 1, and 2 (should be completed first)
**Priority:** LOW - Improves observability but doesn't affect core functionality (PDF tracking already added in Task Group 0)
**Estimated Effort:** Small (15-30 minutes)

- [ ] 3.0 Verify comprehensive audit trail logging in Enhanced DD phases
  - [ ] 3.1 Verify audit logging in Geographic Context Assessment
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** After line 130 (inside try block)
    - **Note:** This should already be implemented in Task Group 0 step 0.9
    - **Action:** Verify audit entry creation includes PDF tracking:
      ```typescript
      // VERIFY THIS EXISTS (added in Task Group 0 step 0.9):
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
          pdfCount,
          pdfUrls: pdfCount > 0 ? pdfUrls : undefined,
          estimatedPdfCredits: pdfCount > 0 ? estimatePdfCredits(pdfCount) : undefined,
          contentLengthZeroCount
        }
      };
      ```

  - [ ] 3.2 Verify audit logging in Customer Profile Assessment
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** After line 296 (inside try block)
    - **Note:** This should already be implemented in Task Group 0 step 0.10
    - **Action:** Verify audit entry creation with conditional tbs and PDF tracking exists

  - [ ] 3.3 Verify audit logging in End-Use Assessment
    - **File:** `/home/hughbrown/code/firecrawl/firesearch/lib/hrdd-risk-factors.ts`
    - **Location:** After line 460 (inside try block)
    - **Note:** This should already be implemented in Task Group 0 step 0.11
    - **Action:** Verify audit entry creation without tbs but with PDF tracking exists

  - [ ] 3.4 Verify all changes compile successfully
    - **Action:** Run `npm run build` to ensure TypeScript compilation succeeds
    - **Expected:** No build errors, warnings acceptable

**Acceptance Criteria:**
- All three Enhanced DD phases log query executions to audit trail (from Task Group 0)
- Audit entries include: query, phase, resultsCount, tbs (where applicable), and PDF tracking fields
- Audit trail pattern matches existing preliminary screening pattern
- Code compiles successfully with no errors

**Expected Impact:**
- 100% of queries logged to audit trail (up from ~8%)
- Complete observability for future diagnosis of wasteful queries
- Audit trail export includes all phases (preliminary + Enhanced DD)
- PDF tracking provides visibility into credit waste patterns

---

### Task Group 4: Testing & Validation
**Assigned implementer:** testing-engineer
**Dependencies:** Task Groups 0, 1, 2, and 3 (all implementation must be complete)
**Priority:** HIGH - Validates optimization works without breaking functionality
**Estimated Effort:** Medium (45-60 minutes)

- [ ] 4.0 Write strategic tests and validate optimization impact
  - [ ] 4.1 Write 2-4 focused tests for query deduplication logic
    - **File:** Create `/home/hughbrown/code/firecrawl/firesearch/lib/__tests__/hrdd-risk-factors.test.ts`
    - **Test Framework:** Vitest (per tech-stack.md)
    - **Action:** Write tests for normalizeQuery and deduplicateQueries functions:
      ```typescript
      import { describe, it, expect } from 'vitest';
      // Note: Will need to export helper functions temporarily or test via integration

      describe('Query Deduplication', () => {
        it('should remove exact duplicates', () => {
          // Test exact duplicate removal
        });

        it('should remove case-insensitive duplicates', () => {
          // Test case-insensitive deduplication
        });

        it('should remove whitespace-insensitive duplicates', () => {
          // Test whitespace normalization
        });

        it('should preserve original casing of first occurrence', () => {
          // Test that first occurrence casing is preserved
        });
      });
      ```
    - **Focus:** Only test deduplication logic, not full workflow

  - [ ] 4.2 Write 2-4 focused tests for PDF detection and tracking
    - **File:** Create `/home/hughbrown/code/firecrawl/firesearch/lib/__tests__/hrdd-pdf-tracking.test.ts`
    - **Test Framework:** Vitest
    - **Action:** Write tests for PDF detection helpers:
      ```typescript
      import { describe, it, expect } from 'vitest';
      // Note: Will need to export helper functions temporarily or test via integration

      describe('PDF Detection', () => {
        it('should detect .pdf file extensions', () => {
          // Test isPdfUrl with various PDF URLs
        });

        it('should detect /pdf/ directories', () => {
          // Test isPdfUrl with PDF directory paths
        });

        it('should not detect non-PDF URLs', () => {
          // Test isPdfUrl returns false for HTML URLs
        });
      });

      describe('PDF Credit Estimation', () => {
        it('should estimate credits for PDFs', () => {
          expect(estimatePdfCredits(5)).toBe(150);  // 5 PDFs × 30 pages
          expect(estimatePdfCredits(82)).toBe(2460); // 82 PDFs × 30 pages
        });
      });
      ```
    - **Focus:** Test PDF detection logic and credit estimation

  - [ ] 4.3 Write 2-4 focused tests for audit trail logging with PDF tracking
    - **File:** Create `/home/hughbrown/code/firecrawl/firesearch/lib/__tests__/hrdd-audit-trail.test.ts`
    - **Test Framework:** Vitest with mocked Firecrawl client
    - **Action:** Write integration tests verifying audit trail completeness:
      ```typescript
      import { describe, it, expect, vi } from 'vitest';
      import { geographicContextAssessment, customerProfileAssessment, endUseAssessment } from '../hrdd-risk-factors';

      describe('Audit Trail Logging with PDF Tracking', () => {
        it('should log all geographic context queries with PDF tracking', async () => {
          // Mock state and config
          // Call geographicContextAssessment
          // Verify audit entries with phase: 'geographic-context'
          // Verify tbs: 'qdr:y' present in audit data
          // Verify pdfCount, estimatedPdfCredits, contentLengthZeroCount fields present
        });

        it('should log all customer profile queries with conditional tbs and PDF tracking', async () => {
          // Mock state and config
          // Call customerProfileAssessment
          // Verify audit entries with phase: 'customer-profile'
          // Verify tbs: 'qdr:y3' present for adverse media queries only
          // Verify PDF tracking fields present
        });

        it('should log all end-use queries without tbs but with PDF tracking', async () => {
          // Mock state and config
          // Call endUseAssessment
          // Verify audit entries with phase: 'end-use-application'
          // Verify NO tbs parameter in audit data
          // Verify PDF tracking fields present
        });
      });
      ```
    - **Focus:** Test audit trail structure and completeness, including PDF tracking

  - [ ] 4.4 Validate optimization metrics with manual test run
    - **Action:** Run a test HRDD assessment (e.g., SAAB Sweden dossier or generic test case)
    - **Verification Checklist:**
      - [ ] Total queries executed is ~30 (down from 66)
      - [ ] Total sources retrieved is ~250 (down from 660)
      - [ ] **Total PDFs is 0 (down from 82) - CRITICAL VALIDATION**
      - [ ] **Estimated PDF credits is 0 (down from 1,640-4,100) - CRITICAL VALIDATION**
      - [ ] **Content length zero count is 0 (down from 466) - CRITICAL VALIDATION**
      - [ ] Processing time is 12-15 minutes (down from 30-40 minutes)
      - [ ] No queries contain proprietary product names (e.g., "Metis", "Sigma Connectivity")
      - [ ] Geographic queries have tbs parameter logged in audit trail
      - [ ] No duplicate queries found in audit trail
      - [ ] All phases present in audit trail (preliminary + Enhanced DD)
    - **Document findings:** Note actual metrics in task comments

  - [ ] 4.5 Run feature-specific tests
    - **Action:** Run only the tests created in this task group:
      ```bash
      npm test lib/__tests__/hrdd-risk-factors.test.ts
      npm test lib/__tests__/hrdd-pdf-tracking.test.ts
      npm test lib/__tests__/hrdd-audit-trail.test.ts
      ```
    - **Expected:** All new tests pass (6-12 tests total)
    - **Do NOT run:** Full application test suite (per testing standards)

**Acceptance Criteria:**
- 6-12 focused tests written and passing
- Query deduplication logic verified
- PDF detection and credit estimation logic verified
- Audit trail logging verified for all Enhanced DD phases with PDF tracking
- Manual validation confirms optimization metrics:
  - ~30 queries (down from 66)
  - ~250 sources (down from 660)
  - **0 PDFs (down from 82) - CRITICAL**
  - **0 estimated PDF credits (down from 1,640-4,100) - CRITICAL**
  - **0 sources with zero content length (down from 466) - CRITICAL**
  - 12-15 min processing time (down from 30-40 min)
  - Zero queries with product names
  - Complete audit trail coverage including PDF tracking
- No regressions in risk classification logic

**Expected Impact:**
- Confidence in optimization correctness
- Regression protection for deduplication, PDF exclusion, and audit logging
- Baseline metrics documented for future comparison
- **Validation that 95% credit reduction target is achieved**

---

## Execution Order & Dependencies

**Sequential execution required:**

1. **Task Group 0** (CRITICAL priority) - Complete FIRST for maximum impact
   - Independent, no dependencies
   - Provides 95% of credit savings (PDF exclusion)
   - **MUST be deployed and validated before other groups**
   - Estimated: 60-75 minutes

2. **Task Group 1** (HIGH priority) - Complete second (can run parallel with Task Group 0)
   - Independent query optimization changes
   - Provides query reduction benefits
   - Estimated: 45-60 minutes

3. **Task Group 2** (MEDIUM priority) - Complete third
   - Depends on Task Groups 0 and 1 being in place
   - Builds on configuration and parameter changes
   - Estimated: 75-90 minutes

4. **Task Group 3** (LOW priority) - Complete fourth
   - Depends on Task Groups 0, 1, and 2 being complete
   - Verification of audit logging (mostly already done in Task Group 0)
   - Estimated: 15-30 minutes

5. **Task Group 4** (HIGH priority validation) - Complete last
   - Depends on all implementation (Task Groups 0-3)
   - Validates entire optimization including PDF exclusion
   - Estimated: 45-60 minutes

**Total Estimated Time:** 4-5.25 hours

---

## Success Metrics

### Quantitative Targets
- **PDF sources per assessment:** 82 → 0 (100% elimination) ✓ **CRITICAL**
- **Estimated PDF credits:** 1,640-4,100 → 0 (100% elimination) ✓ **CRITICAL**
- **Content parsing success:** 0% → 100% (zero content length sources) ✓ **CRITICAL**
- **Total API credits per assessment:** ~5,000-7,000 → ~250 credits (95% reduction) ✓ **PRIMARY SUCCESS METRIC**
- **Queries per assessment:** 66 → 30 (55% reduction) ✓
- **Sources per assessment:** 660 → 250 (62% reduction) ✓
- **Processing time:** 30-40 min → 12-15 min (60% improvement) ✓
- **Zero-result queries:** Current: ~5-10 → Target: 0 ✓
- **Duplicate queries:** Current: ~3-5 → Target: 0 ✓

### Qualitative Targets
- **Audit trail coverage:** 100% of queries logged (all phases) including PDF tracking ✓
- **Query relevance:** 0 queries with proprietary product names ✓
- **Temporal flexibility:** Queries find current + historical data (no hardcoded years) ✓
- **PDF visibility:** Complete tracking of PDF retrieval patterns in audit trail ✓

### Performance Breakdown
- **Preliminary screening:** 50 → 30 sources (40% reduction) + 0 PDFs (was 5 Treasury.gov PDFs = 500+ credits)
- **Geographic context:** 200 → 80 sources (60% reduction) + 0 PDFs (was ~10 Amnesty/Freedom House PDFs = 200-500 credits)
- **Customer profile:** 200 → 80 sources (60% reduction) + 0 PDFs (was ~8 SAAB corporate PDFs = 240-400 credits)
- **End-use application:** 200 → 80 sources (60% reduction) + 0 PDFs (was ~13 Stop Killer Robots/EU PDFs = 390-650 credits)
- **Total sources:** 650 → 270 sources (58% reduction, conservative estimate)
- **Total PDF elimination:** 82 → 0 PDFs = 1,640-4,100 credits saved (**71-85% of total credit reduction**)

---

## Rollback Plan

If optimization causes issues:

**Quick Rollback - PDF Exclusion Only (5 minutes):**
```typescript
// Remove excludeUrlPatterns from all search calls in:
// - lib/firecrawl.ts (search method signature)
// - lib/hrdd-risk-factors.ts (3 assessment functions)
// - lib/hrdd-preliminary-screening.ts (2 check functions)
// Reverts to current behavior
```

**Quick Rollback - Query Limit Only (5 minutes):**
```bash
# Revert single line change
# File: lib/hrdd-config.ts, line 46
MAX_QUERIES_PER_FACTOR: 20  # Change back from 8
```

**Partial Rollback (15 minutes):**
- Keep PDF exclusion and PDF tracking (95% of benefit)
- Keep optimized prompts
- Increase query limit to 12 (middle ground)
- Keep deduplication and audit logging

**Full Rollback:**
```bash
git checkout main -- lib/hrdd-config.ts lib/hrdd-prompts.ts lib/hrdd-risk-factors.ts lib/hrdd-preliminary-screening.ts lib/firecrawl.ts lib/hrdd-state.ts
```

**Rollback Triggers:**
- Risk classification changes unexpectedly on known dossiers
- Processing errors increase >10%
- Manual review identifies critical information gaps
- **PDF exclusion blocks access to truly critical sources** (monitor first 5 assessments)
- **Content parsing fails (sources have zero content length)**

---

## Notes

- **Task Group 0 is CRITICAL** - Delivers 95% of credit reduction through PDF exclusion
- **Task Groups 0 and 1 can run in parallel** - Both have no dependencies
- **API engineer tasks** involve configuration, prompts, deduplication, tbs parameters, PDF exclusion, and audit logging
- **Testing engineer tasks** focus on verification and validation only
- **No database changes** required
- **No frontend changes** required
- **Backward compatible** - no breaking changes to existing API or workflow structure
- **Incremental deployment** possible - can deploy Task Group 0 first (PDF exclusion), validate with 3-5 assessments, then deploy Groups 1-2
- **Monitor first 5 assessments** post-deployment to validate PDF exclusion is working correctly and not blocking critical sources
