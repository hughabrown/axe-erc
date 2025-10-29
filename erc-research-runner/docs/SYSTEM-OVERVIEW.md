# Firesearch System Overview

This project contains two research systems:

## 1. Interactive Search (Main Application)

**Location:** Main Next.js app (`app/`, `lib/`)

**What it does:**
- Conversational AI-powered search interface
- Automatic query decomposition via LLM
- Real-time streaming results
- Interactive web UI

**When to use:**
- Exploratory research
- Ad-hoc questions
- Interactive exploration
- Quick answers

**Start:** `npm run dev`

## 2. Simple Research System (NEW)

**Location:** `scripts/`, `research-configs/`, `report-templates/`

**What it does:**
- Manual query definition (YAML)
- Batch execution via Firecrawl
- Local data storage
- Template-based reports

**When to use:**
- Structured assessments (HRDD, due diligence)
- Repeatable research processes
- Templated reports
- Full control over queries

**Start:** See `docs/SIMPLE-RESEARCH-QUICKSTART.md`

## Quick Comparison

| Feature | Interactive Search | Simple Research System |
|---------|-------------------|----------------------|
| Interface | Web UI | CLI |
| Query generation | AI-powered | Manual |
| Use case | Exploration | Structured reports |
| Control | LLM decides | You decide |
| Output | Conversational | Templated documents |
| Learning curve | Lower | Very low |

## Documentation

### Interactive Search
- `CLAUDE.md` - Project overview
- `docs/HRDD-ARCHITECTURE.md` - HRDD implementation
- `lib/core/langgraph-search-engine.ts` - Core engine

### Simple Research System
- `docs/SIMPLE-RESEARCH-QUICKSTART.md` - Quick start
- `docs/SIMPLE-RESEARCH-SYSTEM.md` - Complete guide
- `docs/FIRECRAWL-RESEARCH-AGENT-GUIDE.md` - Firecrawl deep dive

## Choose Your Path

**Want to explore a topic?** → Use the main web app
**Need a structured report?** → Use the simple research system
**Building custom workflows?** → Combine both approaches
