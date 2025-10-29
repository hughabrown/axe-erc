# ERC Research Runner

A simple system for conducting structured research with manually defined queries and templated report generation. Built specifically for Ethics Review Committee (ERC) assessments and due diligence reports.

## What This Does

1. **Define queries manually** in YAML config files
2. **Run research** via Firecrawl Search API (one command)
3. **Store data locally** with full content in JSON
4. **Generate reports** using markdown templates

## Quick Start

### 1. Set API Key

```bash
echo "FIRECRAWL_API_KEY=your_key_here" > .env.local
```

### 2. Run Example

```bash
npm run research -- erc-research-runner/configs/example-hrdd-report.yml
```

### 3. View Results

```bash
# See the report
cat erc-research-runner/reports/research-*.md

# See raw data
cat erc-research-runner/data/research-*.json
```

## Directory Structure

```
erc-research-runner/
├── scripts/              # Runner scripts (don't edit)
│   ├── simple-research-runner.ts
│   └── template-report-generator.ts
│
├── configs/              # Your research configurations (YAML)
│   ├── example-hrdd-report.yml
│   └── README.md
│
├── templates/            # Report templates (Markdown)
│   ├── hrdd-assessment-template.md
│   └── README.md
│
├── data/                 # Generated: Research data (JSON)
│   └── research-*.json
│
├── reports/              # Generated: Reports (Markdown)
│   └── research-*.md
│
└── docs/                 # Documentation
    ├── QUICKSTART.md     # Start here
    ├── GUIDE.md          # Complete documentation
    └── FIRECRAWL-API.md  # Firecrawl deep dive
```

## Usage

### Basic Workflow

```bash
# 1. Create config for new assessment
cp erc-research-runner/configs/example-hrdd-report.yml \
   erc-research-runner/configs/acme-corp-assessment.yml

# 2. Edit queries
nano erc-research-runner/configs/acme-corp-assessment.yml

# 3. Run research
npm run research -- erc-research-runner/configs/acme-corp-assessment.yml

# 4. Review results
cat erc-research-runner/reports/research-*-acme-corp.md
```

### Generate Templated Report (Optional)

```bash
npm run generate-report -- \
  erc-research-runner/data/research-123.json \
  erc-research-runner/templates/hrdd-assessment-template.md
```

## Configuration Format

Create a YAML file in `configs/`:

```yaml
report:
  title: "HRDD Assessment Report"
  customer: "Company Name"
  date: "2025-10-27"

sections:
  - name: "section_id"
    title: "Section Title"
    queries:
      - id: "query_id"
        query: "search terms"
        limit: 10
        purpose: "What we're looking for"

placeholders:
  COUNTRY: "France"  # Replace [COUNTRY] in queries
```

## Template Format

Create a markdown file in `templates/`:

```markdown
# {{REPORT_TITLE}}

**Customer:** {{CUSTOMER_NAME}}

## Section

{{SECTION:section_id:query_id}}

**Assessment:** {{YOUR_ASSESSMENT}}

## References

{{ALL_SOURCES}}
```

## Commands

```bash
# Run research
npm run research -- erc-research-runner/configs/my-config.yml

# Generate templated report
npm run generate-report -- \
  erc-research-runner/data/session.json \
  erc-research-runner/templates/template.md
```

## Documentation

- **[QUICKSTART.md](docs/QUICKSTART.md)** - 5-minute quick start
- **[GUIDE.md](docs/GUIDE.md)** - Complete system documentation
- **[FIRECRAWL-API.md](docs/FIRECRAWL-API.md)** - Firecrawl API deep dive

## Why This System?

✅ **Full control** - You define every query manually
✅ **Simple** - YAML configs + Markdown templates
✅ **One-step storage** - Search results include full content
✅ **Reusable** - Same config for multiple assessments
✅ **Transparent** - All data saved locally

## Examples

### HRDD Assessment

The included example (`configs/example-hrdd-report.yml`) shows a typical HRDD workflow:

1. Preliminary Screening (sanctions, weapons)
2. Geographic Context (democracy, human rights)
3. Customer Profile (governance, controversies)
4. End-Use Application (IHL compliance)

### Custom Research

Create your own configs for:
- Due diligence reports
- Compliance assessments
- Background checks
- Country risk assessments
- Technology evaluations

## Support

- Read `docs/QUICKSTART.md` for getting started
- See `configs/README.md` for configuration help
- Check `templates/README.md` for template syntax
- Review example files in `configs/` and `templates/`

---

**Part of Firesearch** - See main README.md for the interactive search system
