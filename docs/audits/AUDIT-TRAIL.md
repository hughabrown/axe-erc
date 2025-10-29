# HRDD Audit Trail & Logging

## Overview

The HRDD Assessment Tool automatically captures a complete audit trail of all research activities, decisions, and sources consulted during each assessment. This provides full transparency and traceability for regulatory review and internal governance.

## What's Captured

### 1. Research Queries
- All search queries executed
- Timestamps for each query
- Assessment phase (preliminary screening, geographic context, customer profile, end-use application)
- Number of results returned

### 2. Sources Consulted
- URLs of all sources accessed
- Source titles and metadata
- Whether content was successfully scraped
- Phase in which source was consulted

### 3. Risk Classifications
- Risk level determined for each factor (Low/Medium/High)
- Detailed rationale with evidence
- Timestamp of classification decision
- References to supporting sources

### 4. Preliminary Screening
- Weapons check results
- Sanctions check results
- Jurisdiction check results
- Overall screening outcome (PASS/FAIL)

### 5. Assessment Summary
- Total queries executed
- Total sources consulted
- Processing duration
- Overall risk classification
- Whether assessment was rejected

## Export Formats

### JSON Format
**Use case:** Machine-readable data, API integration, archival

**Contains:**
- Complete structured data
- All timestamps in ISO format
- Nested objects for each assessment phase
- Full citation trail

**Example structure:**
```json
{
  "assessmentId": "hrdd-2025-10-22-acme-corp-united-states",
  "timestamp": "2025-10-22T14:00:00.000Z",
  "dossier": {
    "customer": "Acme Corp",
    "useCase": "AI chatbot",
    "country": "United States"
  },
  "summary": {
    "totalQueries": 18,
    "totalSources": 42,
    "totalDuration": 180000,
    "overallRisk": "Low",
    "rejected": false
  },
  "queries": [...],
  "sources": [...],
  "riskClassifications": [...],
  ...
}
```

### CSV Format
**Use case:** Spreadsheet analysis, manual review, reporting

**Contains:**
- Tabular data for queries, sources, and classifications
- Header section with assessment metadata
- Separate sections for different data types
- Compatible with Excel, Google Sheets

**Sections:**
1. Metadata header
2. Queries Executed (timestamp, phase, query, results count)
3. Sources Consulted (timestamp, phase, URL, title, scraped)
4. Risk Classifications (timestamp, factor, level, rationale)
5. Complete Timeline (all audit entries in chronological order)

## How to Access

### During Assessment

After an HRDD assessment completes, the audit trail is:

1. **Automatically exported to file** in `/audit-logs/` directory
   - Filename format: `hrdd-{date}-{customer}-{country}.{format}`
   - Both JSON and CSV available

2. **Stored in memory** for API access during session

3. **Available via download buttons** in the report UI

### UI Download

When viewing an assessment report, you'll see an "Audit Trail" section with two download buttons:

- **JSON**: Download structured data
- **CSV**: Download spreadsheet format

### API Access

**List all audit trails:**
```
GET /api/audit-trail
```

**Get specific audit trail (JSON):**
```
GET /api/audit-trail?id={assessmentId}
```

**Download as CSV:**
```
GET /api/audit-trail?id={assessmentId}&format=csv
```

## Assessment ID Format

Each assessment generates a unique ID:
```
hrdd-{date}-{customer}-{country}
```

**Example:**
```
hrdd-2025-10-22-acme-corp-united-states
```

- `date`: ISO date (YYYY-MM-DD)
- `customer`: Sanitized customer name (lowercase, alphanumeric)
- `country`: Sanitized country name (lowercase, alphanumeric)

## Storage

### Development/Testing
- In-memory storage during session
- Exported to `./audit-logs/` directory
- Files persist between restarts

### Production (Future)
- Planned: Database storage (Supabase)
- Retention policy: 7 years (regulatory compliance)
- Encrypted at rest
- Access controls by user role

## Compliance Features

### Immutability
- Audit trails are write-once
- Timestamps cannot be modified
- Complete history preserved

### Completeness
- Every query captured
- Every source recorded
- Every decision documented
- No gaps in timeline

### Traceability
- Each risk classification links to supporting sources
- Citation trail from claim → source → URL
- Phase tracking shows when each activity occurred

### Auditability
- Human-readable rationales
- Structured data for automated analysis
- Export formats suitable for regulatory review
- Version tracking in metadata

## Example Use Cases

### Regulatory Review
1. ERC receives audit request from regulators
2. Download audit trail for specific assessment
3. Provide JSON for automated compliance checks
4. Provide CSV for manual review by auditors

### Internal Governance
1. Board asks for evidence supporting risk classification
2. Export audit trail showing all sources consulted
3. Review queries executed and results obtained
4. Verify classification logic was applied correctly

### Process Improvement
1. Analyze multiple audit trails to identify patterns
2. Review which sources are most frequently unavailable
3. Measure average processing time by risk level
4. Identify bottlenecks in assessment workflow

## Test Mode

When `NEXT_PUBLIC_HRDD_TEST_MODE=true`, audit trails still work:

- Mock audit trail generated with sample data
- Same export formats available
- Download buttons functional
- Useful for testing UI without API costs

## Limitations (MVP)

- ❌ No database persistence (file-based only)
- ❌ No search/filter across multiple audits
- ❌ No automatic retention policy enforcement
- ❌ No user access controls
- ❌ No encrypted storage

**Planned for post-MVP:** Full database integration with Supabase, user roles, encryption, and retention policies.

## Maintenance

### Log Rotation
Audit logs accumulate in `/audit-logs/`. Recommended:
- Archive old assessments monthly
- Compress archives (gzip)
- Store in long-term archival system

### Backup
- Include `/audit-logs/` in backup strategy
- Test restore procedures regularly
- Maintain off-site backups for disaster recovery

### Monitoring
- Watch disk space usage in `/audit-logs/`
- Monitor export failure rates
- Alert on missing audit trails for completed assessments

## Troubleshooting

### "Audit trail not found" error
**Cause:** Assessment ID incorrect or audit trail not exported

**Solution:**
1. Check assessment ID format
2. Verify file exists in `/audit-logs/`
3. Check server logs for export errors

### Missing data in audit trail
**Cause:** Export occurred before assessment completed

**Solution:**
- Audit trail is exported after synthesis completes
- Wait for "final-result" event before expecting export
- Check server logs for workflow errors

### Download button not appearing
**Cause:** assessmentId missing from final-result event

**Solution:**
1. Check test mode is enabled if testing
2. Verify synthesis node includes assessmentId
3. Check browser console for errors

## Related Files

**Backend:**
- `/lib/audit-trail-export.ts` - Export module
- `/lib/hrdd-workflow-engine.ts` - Workflow integration
- `/lib/hrdd-synthesis.ts` - Assessment ID generation
- `/app/api/audit-trail/route.ts` - API endpoint

**Frontend:**
- `/app/components/audit-trail-download.tsx` - Download UI
- `/app/chat.tsx` - Integration in report display

**Storage:**
- `/audit-logs/` - Exported files directory
- Memory cache for session access

**Documentation:**
- `/docs/AUDIT-TRAIL.md` (this file)
- `/TESTING.md` - Test mode information
