# Simple Research System
## Manual Query-Based Research with Templated Reports

A straightforward system for conducting research using Firecrawl's Search API with manually defined queries and template-based report generation.

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Quick Start](#quick-start)
4. [Step-by-Step Guide](#step-by-step-guide)
5. [Configuration Files](#configuration-files)
6. [Report Templates](#report-templates)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What This System Does

This system allows you to:

1. **Manually define search queries** in a YAML configuration file
2. **Run all queries** through Firecrawl Search API automatically
3. **Store all results locally** in JSON format (one-step storage)
4. **Generate reports** using customizable templates

### Why This Approach?

- **Full control:** You define exactly what searches to run
- **No AI unpredictability:** No LLM decides what to search for
- **Simple workflow:** Config → Run → Report
- **Reusable:** Same queries can be run for different customers
- **Transparent:** All raw data saved locally for review

### Key Components

```
research-configs/          # Your search query definitions (YAML)
report-templates/          # Report templates with placeholders (Markdown)
scripts/                   # Runner scripts (TypeScript)
research-data/            # Saved research results (JSON)
research-reports/         # Generated reports (Markdown)
```

---

## How It Works

### The 3-Step Process

```
Step 1: Create Config          Step 2: Run Research         Step 3: Generate Report
─────────────────────          ────────────────────         ───────────────────────

 Define your queries     →     Execute via Firecrawl   →    Apply to template
 in YAML file                  Store results locally         Review & finalize

 research-configs/             research-data/                research-reports/
 example.yml                   research-123.json             report-123.md
```

### What Happens Internally

1. **Research Runner** reads your YAML config
2. For each query:
   - Calls Firecrawl Search API with `scrapeOptions`
   - Gets back search results WITH full markdown content
   - Stores everything in JSON
3. **Template Generator** loads the JSON data
4. Fills in template placeholders with research findings
5. Outputs formatted markdown report

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs `js-yaml` and `@types/js-yaml` for reading YAML configs.

### 2. Set Up Environment

Create `.env.local`:

```bash
FIRECRAWL_API_KEY=your_api_key_here
```

### 3. Create Your Research Config

Copy the example:

```bash
cp research-configs/example-hrdd-report.yml research-configs/my-research.yml
```

Edit `my-research.yml` to define your queries (see [Configuration Files](#configuration-files)).

### 4. Run Research

```bash
npm run research -- research-configs/my-research.yml
```

This will:
- Execute all searches
- Save results to `research-data/research-[timestamp]-[customer].json`
- Generate a basic report to `research-reports/research-[timestamp]-[customer].md`

### 5. Generate Templated Report (Optional)

```bash
npm run generate-report -- research-data/research-123.json report-templates/hrdd-assessment-template.md
```

---

## Step-by-Step Guide

### Creating a Research Configuration

A research config is a YAML file that defines:
- Report metadata (title, customer, date)
- Sections with search queries
- Placeholders for templating

#### Basic Structure

```yaml
report:
  title: "My Research Report"
  customer: "Example Corp"
  date: "2025-10-27"

sections:
  - name: "section_id"           # Used for referencing in templates
    title: "Section Title"       # Appears in reports
    queries:
      - id: "query_id"           # Unique ID for this query
        query: "search terms"    # What to search for
        limit: 10                # Number of sources (max 100)
        purpose: "What we're looking for"  # Description

placeholders:
  COUNTRY: "France"              # Replace [COUNTRY] in queries
  CUSTOMER_NAME: "Example Corp"
```

#### Example: HRDD Assessment Config

```yaml
report:
  title: "HRDD Assessment Report"
  customer: "Safran Electronics & Defense"
  date: "2025-10-27"

sections:
  - name: "preliminary_screening"
    title: "Stage 1: Preliminary Screening"
    queries:
      - id: "sanctions_check"
        query: "Safran Electronics OFAC EU UN sanctions list"
        limit: 10
        purpose: "Check sanctions status"

      - id: "weapons_check"
        query: "Safran controversial weapons autonomous systems"
        limit: 10
        purpose: "Check weapons involvement"

  - name: "geographic_context"
    title: "Geographic Context"
    queries:
      - id: "democracy_score"
        query: "[COUNTRY] Freedom House democracy score 2024"
        limit: 5
        purpose: "Democracy indicators"

      - id: "human_rights"
        query: "[COUNTRY] Human Rights Watch report 2024"
        limit: 10
        purpose: "Human rights situation"

placeholders:
  COUNTRY: "France"
```

### Running Research

Execute the research runner:

```bash
npm run research -- research-configs/my-research.yml
```

#### What You'll See

```
🚀 Starting Simple Research Runner

📄 Loading config: research-configs/my-research.yml
   Report: HRDD Assessment Report
   Customer: Safran Electronics & Defense

📋 Section: Stage 1: Preliminary Screening
   Queries: 2

🔍 Running query: Safran Electronics OFAC EU UN sanctions list
   Purpose: Check sanctions status
   Limit: 10 sources
   ✅ Found 10 sources

🔍 Running query: Safran controversial weapons autonomous systems
   Purpose: Check weapons involvement
   Limit: 10 sources
   ✅ Found 8 sources

...

💾 Saved research data: research-data/research-1730049600000-safran.json
📝 Saved report: research-reports/research-1730049600000-safran.md

✅ Research completed successfully!

📊 Summary:
   - Total queries: 4
   - Total sources: 35
   - Report: research-reports/research-1730049600000-safran.md
   - Raw data: research-data/research-1730049600000-safran.json
```

### Understanding the Output

#### 1. Raw Data (JSON)

`research-data/research-[id].json` contains:

```json
{
  "config": { /* Your original config */ },
  "sessionId": "research-1730049600000-safran",
  "timestamp": "2025-10-27T12:00:00.000Z",
  "results": {
    "preliminary_screening": [
      {
        "id": "sanctions_check",
        "query": "Safran Electronics OFAC EU UN sanctions list",
        "purpose": "Check sanctions status",
        "sources": [
          {
            "url": "https://example.com/article",
            "title": "Sanctions List Database",
            "description": "...",
            "markdown": "# Full Content\n\nThe complete text..."
          }
        ]
      }
    ]
  }
}
```

**Key point:** All markdown content is stored here. You have everything locally.

#### 2. Basic Report (Markdown)

`research-reports/research-[id].md` is auto-generated with:

- Report metadata
- All sections organized by query
- Source lists with excerpts
- Full appendix with complete content

This is a reference document. You can use it directly or generate a templated version.

### Creating Report Templates

Templates use placeholders that get filled with research data.

#### Placeholder Types

1. **Simple variables:** `{{VARIABLE_NAME}}`
   - Filled from a variables dictionary
   - Example: `{{CUSTOMER_NAME}}` → "Safran Electronics"

2. **Section references:** `{{SECTION:section_name:query_id}}`
   - Automatically pulls sources from research data
   - Example: `{{SECTION:preliminary_screening:sanctions_check}}`

3. **Special placeholders:**
   - `{{ALL_SOURCES}}` → Complete bibliography
   - `{{SESSION_ID}}` → Research session ID
   - `{{GENERATION_DATE}}` → Report generation timestamp

#### Example Template

```markdown
# {{REPORT_TITLE}}

**Customer:** {{CUSTOMER_NAME}}
**Date:** {{ASSESSMENT_DATE}}

---

## Sanctions Check

{{SECTION:preliminary_screening:sanctions_check}}

**Assessment:** {{SANCTIONS_ASSESSMENT}}

## Democracy Score

{{SECTION:geographic_context:democracy_score}}

**Classification:** {{DEMOCRACY_CLASSIFICATION}}

---

## All Sources

{{ALL_SOURCES}}
```

#### Using Templates

```bash
npm run generate-report -- \
  research-data/research-1730049600000-safran.json \
  report-templates/hrdd-assessment-template.md
```

The script will:
1. Load your research data
2. Load the template
3. Fill in all placeholders
4. Output: `research-reports/research-[id]-templated.md`

**Note:** Some placeholders (like `{{SANCTIONS_ASSESSMENT}}`) need manual values. The script marks these as "TBD" for you to fill in.

---

## Configuration Files

### Full YAML Schema

```yaml
# Report metadata
report:
  title: string              # Report title
  customer: string           # Customer/subject name
  date: string              # Assessment date (YYYY-MM-DD)

# Research sections
sections:
  - name: string            # Section ID (used in templates)
    title: string           # Section display title
    queries:
      - id: string          # Query ID (unique within section)
        query: string       # Search query
        limit: number       # Sources to retrieve (1-100)
        purpose: string     # What this query investigates

# Optional: Template placeholders
placeholders:
  KEY: "value"              # Replace [KEY] in queries with "value"
```

### Advanced: Multiple Placeholders

```yaml
placeholders:
  COUNTRY: "France"
  CUSTOMER: "Safran"
  YEAR: "2024"

sections:
  - name: "research"
    queries:
      - id: "recent_news"
        query: "[CUSTOMER] [COUNTRY] news [YEAR]"
        # Becomes: "Safran France news 2024"
```

### Tips

1. **Query limits:** Start with 10-15 sources per query. You can always re-run with more.
2. **Query IDs:** Use descriptive IDs like `sanctions_check`, `democracy_score`, etc.
3. **Section names:** Use underscores, no spaces (e.g., `preliminary_screening`)
4. **Purpose field:** Be specific - this appears in reports
5. **Placeholders:** Use for values that change between reports (country, customer, year)

---

## Report Templates

### Creating Your Own Template

1. **Start with structure:**
   ```markdown
   # Report Title

   ## Section 1
   {{SECTION:section_id:query_id}}

   ## Section 2
   {{SECTION:section_id:query_id}}
   ```

2. **Add metadata:**
   ```markdown
   **Customer:** {{CUSTOMER_NAME}}
   **Date:** {{ASSESSMENT_DATE}}
   **Analyst:** {{ASSESSOR}}
   ```

3. **Add assessment fields:**
   ```markdown
   **Risk Classification:** {{RISK_CLASSIFICATION}}
   **Recommendation:** {{RECOMMENDATION}}
   ```

4. **Add appendix:**
   ```markdown
   ## References
   {{ALL_SOURCES}}
   ```

### Template Best Practices

1. **Mark what needs manual input:** Use `{{TBD_FIELD}}` for fields you'll fill manually
2. **Include context:** Add instructions in comments: `<!-- Review sources above and classify risk -->`
3. **Structure clearly:** Use headings, bullet points, tables
4. **Reference sources:** Show which section data comes from
5. **Version templates:** Save different templates for different report types

### Example: Minimal Template

```markdown
# {{REPORT_TITLE}}

Customer: {{CUSTOMER_NAME}} | Date: {{ASSESSMENT_DATE}}

## Research Findings

{{SECTION:main_research:key_query}}

## Assessment

**Classification:** _[Review sources and complete]_

**Rationale:** _[Provide justification]_

## Sources

{{ALL_SOURCES}}
```

---

## Examples

### Example 1: Company Background Research

**Config:** `research-configs/company-background.yml`

```yaml
report:
  title: "Company Background Research"
  customer: "TechCorp Inc"
  date: "2025-10-27"

sections:
  - name: "company_basics"
    title: "Company Information"
    queries:
      - id: "company_profile"
        query: "TechCorp Inc company profile founded CEO"
        limit: 10
        purpose: "Basic company information"

      - id: "financial"
        query: "TechCorp Inc financial results revenue 2024"
        limit: 8
        purpose: "Financial performance"

  - name: "reputation"
    title: "Reputation & Track Record"
    queries:
      - id: "news"
        query: "TechCorp Inc news 2024"
        limit: 15
        purpose: "Recent news and developments"

      - id: "controversies"
        query: "TechCorp Inc controversies lawsuits investigations"
        limit: 10
        purpose: "Issues and controversies"
```

**Run:**

```bash
npm run research -- research-configs/company-background.yml
```

### Example 2: Technology Assessment

**Config:** `research-configs/ai-safety-research.yml`

```yaml
report:
  title: "AI Safety Standards Research"
  customer: "N/A"
  date: "2025-10-27"

sections:
  - name: "standards"
    title: "International Standards"
    queries:
      - id: "iso_standards"
        query: "ISO AI safety standards 42001 2024"
        limit: 10
        purpose: "ISO AI standards"

      - id: "nist"
        query: "NIST AI Risk Management Framework"
        limit: 8
        purpose: "NIST guidelines"

  - name: "regulations"
    title: "Regulatory Landscape"
    queries:
      - id: "eu_ai_act"
        query: "EU AI Act requirements 2024"
        limit: 12
        purpose: "EU regulations"

      - id: "us_executive_order"
        query: "US AI Executive Order requirements"
        limit: 10
        purpose: "US regulations"
```

### Example 3: Geographic Risk Assessment

**Config:** `research-configs/country-risk.yml`

```yaml
report:
  title: "Country Risk Assessment"
  customer: "Deployment: [COUNTRY]"
  date: "2025-10-27"

sections:
  - name: "governance"
    title: "Governance & Democracy"
    queries:
      - id: "democracy"
        query: "[COUNTRY] Freedom House democracy score 2024"
        limit: 5
        purpose: "Democracy assessment"

      - id: "corruption"
        query: "[COUNTRY] Transparency International CPI 2024"
        limit: 5
        purpose: "Corruption perception"

  - name: "human_rights"
    title: "Human Rights"
    queries:
      - id: "hrw_amnesty"
        query: "[COUNTRY] Human Rights Watch Amnesty 2024 report"
        limit: 10
        purpose: "HR organizations reports"

      - id: "state_dept"
        query: "[COUNTRY] US State Department human rights 2024"
        limit: 5
        purpose: "Government assessment"

placeholders:
  COUNTRY: "Vietnam"  # Change per assessment
```

---

## Troubleshooting

### Common Issues

#### 1. "FIRECRAWL_API_KEY is required"

**Solution:** Create `.env.local` with your API key:
```bash
echo "FIRECRAWL_API_KEY=your_key_here" > .env.local
```

#### 2. "Config file not found"

**Solution:** Use correct path relative to project root:
```bash
npm run research -- research-configs/my-file.yml  # Correct
npm run research -- my-file.yml                    # Wrong
```

#### 3. Queries returning 0 results

**Causes:**
- Query too specific
- No content available
- Firecrawl couldn't access sites

**Solutions:**
- Broaden search terms
- Try alternative phrasings
- Check if sites block scraping

#### 4. Rate limit errors

**Cause:** Hitting Firecrawl's rate limits

**Solution:** Script includes 500ms delay between queries. For stricter limits:

Edit `scripts/simple-research-runner.ts` line ~95:
```typescript
await new Promise(resolve => setTimeout(resolve, 1000)); // Increase to 1 second
```

#### 5. Template placeholders not replaced

**Cause:** Variable not in variables dictionary

**Solution:** Edit `scripts/template-report-generator.ts` around line 120:

```typescript
const variables: Record<string, string> = {
  // Add your variable here
  MY_VARIABLE: 'my_value',
  ...
};
```

### Getting Help

1. **Check logs:** Runner outputs detailed progress
2. **Inspect JSON:** Open `research-data/[session].json` to see raw data
3. **Test individual queries:** Run one section at a time
4. **Verify API key:** Test with `npm run test:firecrawl`

---

## Best Practices

### Research Configuration

1. **Start small:** Test with 2-3 queries before full runs
2. **Iterate queries:** Run → Review results → Refine queries → Re-run
3. **Use descriptive IDs:** `customer_governance` not `query1`
4. **Group logically:** Organize queries by report section
5. **Document purpose:** Be specific about what each query investigates

### Query Design

1. **Be specific but not narrow:**
   - Good: `"Safran defense contracts controversies 2020-2024"`
   - Too broad: `"Safran"`
   - Too narrow: `"Safran Group Yemen conflict human rights violations April 2022"`

2. **Use multiple queries for complex topics:**
   - Instead of: `"Company X ESG governance controversies"`
   - Use:
     - `"Company X ESG sustainability report"`
     - `"Company X corporate governance"`
     - `"Company X controversies investigations"`

3. **Include temporal context:**
   - Add year: `"France AI regulation 2024"`
   - Add timeframe: `"Company X controversies 2020-2024"`

4. **Leverage placeholders:**
   - Reuse configs: `"[CUSTOMER] financial results [YEAR]"`
   - Easy updates: Change placeholder once, affects all queries

### Report Generation

1. **Review before templating:** Check basic report first
2. **Create template progressively:** Add sections as you understand data structure
3. **Mark manual sections clearly:** Use `{{TBD_*}}` or `_[Complete manually]_`
4. **Keep raw data:** Don't delete JSON files - you might regenerate reports
5. **Version your templates:** Save as `template-v1.md`, `template-v2.md`, etc.

### Workflow Tips

1. **Develop queries iteratively:**
   ```
   Create small config → Run → Review → Refine → Expand
   ```

2. **Reuse configs:**
   ```bash
   cp research-configs/company-a.yml research-configs/company-b.yml
   # Edit customer name and placeholders only
   ```

3. **Archive sessions:**
   ```bash
   mkdir research-data/2025-10-completed/
   mv research-data/research-old-*.json research-data/2025-10-completed/
   ```

4. **Standard naming:**
   - Configs: `[type]-[customer]-[date].yml`
   - Example: `hrdd-safran-2025-10-27.yml`

---

## Advanced Usage

### Running Multiple Configs

Create a batch script:

```bash
#!/bin/bash
for config in research-configs/batch/*.yml; do
  echo "Running $config..."
  npm run research -- "$config"
done
```

### Filtering Results

Edit the JSON to remove irrelevant sources before templating:

```bash
# Open in text editor
code research-data/research-123.json

# Remove sources with low relevance
# Then generate report
npm run generate-report -- research-data/research-123.json report-templates/template.md
```

### Custom Variables File

Create `variables.json`:

```json
{
  "CUSTOMER_NAME": "Safran Electronics",
  "ASSESSOR": "Ethics Review Committee",
  "RISK_CLASSIFICATION": "🟢 LOW RISK",
  "RECOMMENDATION": "APPROVE"
}
```

Load in template generator (requires code modification).

### Integration with Analysis Tools

The JSON output can be processed by other tools:

```typescript
import type { ResearchSession } from './types';

const session: ResearchSession = JSON.parse(
  await fs.readFile('research-data/session.json', 'utf-8')
);

// Analyze with LLM
const analysis = await llm.analyze(session.results);

// Generate custom reports
const customReport = await generateCustomFormat(session);
```

---

## Comparison: This System vs. Existing Firesearch

| Feature | Simple Research System | Existing Firesearch |
|---------|----------------------|---------------------|
| Query definition | Manual (YAML) | AI decomposition |
| Control | Full control | LLM decides |
| Use case | Structured reports | Exploratory research |
| Output | Templated reports | Conversational |
| Learning curve | Lower | Higher |
| Flexibility | Template-based | Real-time synthesis |
| Best for | Repeatable assessments | Ad-hoc questions |

**When to use each:**

- **Simple Research System:** HRDD reports, compliance assessments, standardized research
- **Existing Firesearch:** Open-ended questions, exploratory research, quick answers

---

## Next Steps

1. **Try the example:**
   ```bash
   npm install
   npm run research -- research-configs/example-hrdd-report.yml
   ```

2. **Create your first config:**
   - Copy `example-hrdd-report.yml`
   - Edit queries for your use case
   - Run research

3. **Customize template:**
   - Copy `hrdd-assessment-template.md`
   - Modify structure
   - Generate templated report

4. **Iterate:**
   - Review results
   - Refine queries
   - Improve template

---

## Files Reference

```
firesearch/
├── research-configs/              # Your query definitions
│   └── example-hrdd-report.yml    # Example config
│
├── report-templates/              # Report templates
│   └── hrdd-assessment-template.md # HRDD template
│
├── scripts/                       # Runner scripts
│   ├── simple-research-runner.ts  # Main research runner
│   └── template-report-generator.ts # Template processor
│
├── research-data/                 # Saved research (generated)
│   └── research-[id].json         # Raw research data
│
└── research-reports/              # Generated reports (generated)
    └── research-[id].md           # Output reports
```

---

## Support

- **Documentation:** This file
- **Firecrawl Docs:** [docs.firecrawl.dev](https://docs.firecrawl.dev)
- **Firecrawl Guide:** `docs/FIRECRAWL-RESEARCH-AGENT-GUIDE.md`
- **HRDD Guide:** `docs/hrdd/hrdd-guide.md`

---

*Last updated: 2025-10-27*
