# Simple Research System - Quick Start

A dead-simple system for running manual research queries and generating templated reports.

## What You Get

✅ **Manual query control** - Define exactly what to search
✅ **One-step storage** - All data saved locally automatically
✅ **Template-based reports** - Reusable report formats
✅ **No AI unpredictability** - You control everything

## 5-Minute Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set API Key

```bash
echo "FIRECRAWL_API_KEY=your_key_here" > .env.local
```

### 3. Run Example Research

```bash
npm run research -- research-configs/example-hrdd-report.yml
```

This will:
- Execute searches defined in the config
- Save all results to `research-data/`
- Generate a report in `research-reports/`

### 4. View Results

```bash
# See the report
cat research-reports/research-*.md

# See raw data
cat research-data/research-*.json
```

## How It Works

### 1. Define Queries (YAML)

```yaml
# research-configs/my-research.yml
report:
  title: "My Research"
  customer: "Example Corp"
  date: "2025-10-27"

sections:
  - name: "background"
    title: "Company Background"
    queries:
      - id: "company_info"
        query: "Example Corp company profile"
        limit: 10
        purpose: "Basic information"
```

### 2. Run Research

```bash
npm run research -- research-configs/my-research.yml
```

Firecrawl searches and scrapes automatically. Everything saved locally.

### 3. Generate Templated Report (Optional)

```bash
npm run generate-report -- \
  research-data/research-123.json \
  report-templates/hrdd-assessment-template.md
```

## File Structure

```
research-configs/          # Your query definitions (YAML)
  └── example-hrdd-report.yml

report-templates/          # Report templates (Markdown)
  └── hrdd-assessment-template.md

research-data/            # Saved results (JSON)
  └── research-[id].json

research-reports/         # Generated reports (Markdown)
  └── research-[id].md
```

## Example Use Cases

### 1. Company Due Diligence

```yaml
queries:
  - query: "Company X sanctions OFAC EU"
  - query: "Company X controversies lawsuits"
  - query: "Company X ESG sustainability report"
```

### 2. Country Risk Assessment

```yaml
queries:
  - query: "[COUNTRY] Freedom House democracy 2024"
  - query: "[COUNTRY] Human Rights Watch report"
  - query: "[COUNTRY] corruption transparency index"

placeholders:
  COUNTRY: "France"
```

### 3. Technology Standards Research

```yaml
queries:
  - query: "ISO AI safety standards 42001"
  - query: "NIST AI Risk Management Framework"
  - query: "EU AI Act requirements 2024"
```

## What Gets Saved?

### JSON (Raw Data)

```json
{
  "sessionId": "research-1730049600000-example",
  "results": {
    "section_name": [
      {
        "id": "query_id",
        "query": "the search query",
        "sources": [
          {
            "url": "https://...",
            "title": "Article Title",
            "markdown": "# Full Content\n\n..."
          }
        ]
      }
    ]
  }
}
```

**Key:** `markdown` contains FULL extracted content. No need to scrape again.

### Markdown (Basic Report)

Auto-generated report with:
- All sections organized
- Source lists with excerpts
- Full content appendix

Use directly or as reference for template generation.

## Commands

```bash
# Run research
npm run research -- research-configs/my-config.yml

# Generate templated report
npm run generate-report -- \
  research-data/research-123.json \
  report-templates/template.md

# Test Firecrawl connection
npm run test:firecrawl
```

## Tips

1. **Start small:** Test with 2-3 queries first
2. **Iterate:** Run → Review → Refine queries → Re-run
3. **Use placeholders:** `[COUNTRY]`, `[CUSTOMER]` for reusable configs
4. **Keep raw data:** Don't delete JSON files - regenerate reports anytime
5. **Check limits:** 10-15 sources per query is usually enough

## Common Issues

### No results returned

- Make queries more general
- Try alternative phrasings
- Check if sites block scraping

### Rate limits

- Script has 500ms delay between queries
- Increase to 1000ms if needed (edit `simple-research-runner.ts`)

### API key error

- Verify `.env.local` exists
- Check key is valid at firecrawl.dev

## Full Documentation

- **Complete Guide:** `docs/SIMPLE-RESEARCH-SYSTEM.md`
- **Firecrawl Guide:** `docs/FIRECRAWL-RESEARCH-AGENT-GUIDE.md`
- **HRDD Examples:** `docs/hrdd/safran-example.md`

## Example Workflow

```bash
# 1. Create config for new customer
cp research-configs/example-hrdd-report.yml \
   research-configs/safran-assessment.yml

# 2. Edit queries
nano research-configs/safran-assessment.yml

# 3. Run research
npm run research -- research-configs/safran-assessment.yml

# 4. Review results
cat research-reports/research-*-safran.md

# 5. Generate templated report
npm run generate-report -- \
  research-data/research-*-safran.json \
  report-templates/hrdd-assessment-template.md

# 6. Review and complete template
nano research-reports/research-*-safran-templated.md
```

## Why This Approach?

| Feature | Benefit |
|---------|---------|
| Manual queries | You know exactly what's being searched |
| One-step storage | All data saved in single API call |
| YAML configs | Easy to edit, version, and reuse |
| Templates | Consistent report format |
| Local storage | Full control over your data |

## Next Steps

1. Try the example (see step 3 above)
2. Create your own config
3. Customize the template
4. Build your workflow

---

**Need help?** Read `docs/SIMPLE-RESEARCH-SYSTEM.md` for complete documentation.
