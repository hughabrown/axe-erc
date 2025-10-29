# HRDD Search Optimization Specification - Initialization

## Date
2025-01-23

## Specification Name
hrdd-search-optimization

## Initial Context

The user identified critical inefficiencies in the HRDD (Human Rights Due Diligence) workflow's search strategy based on Firecrawl API audit logs:

1. **Excessive credit usage**: SAAB assessment used 466 sources across 5 logged queries (93.2 sources/query average), taking 34 minutes
2. **Wasteful queries**: Some searches with product-specific terms (e.g., "Metis Chip Down Design Sigma Connectivity dual-use export regulations") yielded zero results
3. **Time-bounded queries**: Queries hardcoded to 2024 miss current year (2025) and historical data
4. **Missing optimization**: No query deduplication, excessive queries per risk factor (20 queries when 8 would suffice)

## User Requirements Summary

The user requested help to:
- Diagnose wasteful search patterns from audit logs
- Understand Firecrawl /search endpoint best practices
- Optimize query generation to reduce credit usage without sacrificing quality
- Fix time-bounding issues in queries
- Implement query deduplication

## Analysis Completed

Comprehensive analysis identified:
- **Current config**: MAX_QUERIES_PER_FACTOR: 20, MAX_SOURCES_PER_QUERY: 10
- **Theoretical max**: ~66 queries → ~660 sources per assessment
- **Actual behavior**: Queries include product names that don't exist publicly, time bounds exclude relevant data
- **Root causes**: Prompt engineering issues in lib/hrdd-prompts.ts, missing deduplication logic

## Success Criteria

1. Reduce queries per assessment by ~55% (66 → 30 queries)
2. Reduce source scraping by ~62% (660 → 250 sources)
3. Eliminate zero-result queries from over-specific product names
4. Use Firecrawl's `tbs` parameter for time filtering instead of hardcoded years
5. Add query deduplication to prevent redundant API calls
6. Fix audit trail logging to capture all enhanced DD queries

## Expected Impact

- **Credit savings**: ~400 credits per assessment (62% reduction)
- **Speed improvement**: 30-40 minutes → 12-15 minutes per assessment (60% faster)
- **Quality**: Minimal to no impact (removing redundant/zero-result queries only)
