# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Firesearch is an AI-powered deep research tool that leverages Firecrawl for web content extraction and LangGraph for orchestrating multi-step search workflows. It decomposes complex queries into focused sub-questions, performs parallel searches, validates answers, and synthesizes comprehensive responses with full citations.

## Development Commands

### Running the Application
```bash
npm run dev           # Start dev server with Turbopack
npm run build         # Build for production
npm start             # Start production server
npm run lint          # Run ESLint
```

### Testing & Benchmarking
```bash
npm run test:firecrawl    # Test Firecrawl integration
npm run benchmark         # Run full benchmark suite
npm run benchmark:quick   # Run quick factual queries benchmark
```

### Environment Setup
Create `.env.local` with:
```
FIRECRAWL_API_KEY=your_firecrawl_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key  # Optional
```

## Architecture

### Core Search Engine (lib/langgraph-search-engine.ts)

The application uses LangGraph to orchestrate a stateful search workflow with the following phases:

1. **Understanding Phase** - LLM analyzes the query and conversation context
2. **Planning Phase** - Decomposes query into focused search queries (up to 24 queries)
3. **Searching Phase** - Executes searches in parallel via Firecrawl's `/search` endpoint
4. **Analyzing Phase** - Validates if sources answer the questions (0.3+ confidence threshold)
5. **Retry Logic** - Generates alternative search strategies for unanswered questions (max 3 attempts)
6. **Synthesis Phase** - GPT-4o combines findings into comprehensive response with citations

Key state management:
- Uses LangGraph `Annotation.Root` with reducers for state management
- Deduplicates sources by URL in the sources reducer
- Maintains conversation context for follow-up questions
- Streams events to frontend for real-time progress updates

### Firecrawl Integration (lib/firecrawl.ts)

The `FirecrawlClient` class wraps the Firecrawl API with three main methods:

- `search(query, options)` - Uses Firecrawl `/search` endpoint with `scrapeOptions.formats: ['markdown']` to get search results AND extracted content in a single API call
- `scrapeUrl(url, timeout)` - Scrapes individual URLs with 15s timeout, handles 403 errors gracefully
- `mapUrl(url, options)` - Maps website structure (not heavily used in current flow)

All search results include markdown content, metadata (favicon, description), and are marked as `scraped: true`.

### Configuration (lib/config.ts)

Three main config objects control behavior:

**SEARCH_CONFIG** - Search engine parameters:
- `MAX_SEARCH_QUERIES: 24` - Maximum parallel searches
- `MAX_SOURCES_PER_SEARCH: 10` - Sources returned per query
- `MIN_ANSWER_CONFIDENCE: 0.3` - Threshold for answer validation
- `MAX_SEARCH_ATTEMPTS: 3` - Retry attempts for unanswered questions
- `EARLY_TERMINATION_CONFIDENCE: 0.8` - Skip additional searches if confidence is high

**MODEL_CONFIG** - LLM settings:
- `FAST_MODEL: "gpt-4o-mini"` - Used for query decomposition, answer validation
- `QUALITY_MODEL: "gpt-4o"` - Used for final synthesis
- `TEMPERATURE: 0` - Deterministic outputs

**UI_CONFIG** - Frontend animation timings

### Context Processing (lib/context-processor.ts)

Handles conversation memory for follow-up questions:
- Formats previous Q&A pairs with truncation (500 char preview)
- Generates contextual search queries that reference prior context
- Maintains coherent multi-turn conversations

### Next.js App Structure

**App Router Layout:**
- `app/page.tsx` - Main search interface entry point
- `app/layout.tsx` - Root layout with theme provider
- `app/globals.css` - Tailwind configuration and custom styles
- `app/api/check-env/route.ts` - Environment validation endpoint

**Key Components:**
- `app/chat.tsx` - Main chat interface with search orchestration
- `app/search-display.tsx` - Real-time search progress visualization (37k lines - complex streaming UI)
- `app/markdown-renderer.tsx` - Citation-aware markdown rendering
- `app/citation-tooltip.tsx` - Interactive citation tooltips
- `app/search.tsx` - Search input component

**UI Components:**
- Built with Radix UI primitives (dialog, popover, tooltip, etc.)
- Styled with Tailwind CSS v4
- Uses `shadcn/ui` component patterns

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4
- **AI/LLM**: LangGraph, LangChain, OpenAI GPT-4o/GPT-4o-mini
- **Web Scraping**: Firecrawl API
- **State Management**: LangGraph state machines with reducers
- **Styling**: Tailwind CSS with Radix UI primitives
- **Type Safety**: TypeScript 5

## Development Patterns

### Working with LangGraph State

State updates use reducers defined in `SearchStateAnnotation`:
- Array fields (`sources`, `scrapedSources`) use append reducers
- Simple fields use last-write-wins (`(_, y) => y`)
- Access state via `state.query`, `state.sources`, etc.

### Event Streaming

The search engine emits typed events via `eventCallback`:
- `phase-update` - Phase transitions with messages
- `searching` - Individual search execution
- `found` - Sources discovered
- `source-processing` / `source-complete` - Scraping progress
- `content-chunk` - Streaming final response
- `final-result` - Complete response with sources and follow-ups

Frontend consumes these events in `app/chat.tsx` to update UI in real-time.

### Error Handling

Use `lib/error-handler.ts` for consistent error handling:
- Categorizes errors by type (search, scrape, LLM, unknown)
- Provides user-friendly error messages
- Includes retry logic for transient failures

### Adding New Search Strategies

To add retry strategies, modify the retry node in `langgraph-search-engine.ts`:
1. Add strategy to `searchStrategies` array in retry logic
2. Each strategy defines: `name`, `why` (explanation), `terms` (alt queries)
3. LLM selects most promising strategy based on previous failures

## Code Organization

```
firesearch/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── *.tsx              # Pages and client components
│   └── globals.css        # Global styles
├── lib/                   # Core business logic
│   ├── langgraph-search-engine.ts  # Main search orchestration
│   ├── firecrawl.ts      # Firecrawl API client
│   ├── context-processor.ts        # Conversation context
│   ├── config.ts          # Configuration
│   └── error-handler.ts   # Error handling
├── components/ui/         # Reusable UI components (Radix/shadcn)
├── hooks/                 # React hooks
├── agent-os/              # Agent OS configuration (Claude Code)
│   ├── config.yml         # Agent settings
│   ├── roles/             # Agent role definitions
│   └── standards/         # Code standards by domain
└── public/                # Static assets
```

## Testing Notes

- `eval/benchmark-runner.ts` - Benchmark harness for search quality
- `eval/test-firecrawl-simple.ts` - Basic Firecrawl API integration tests
- No unit test framework currently configured

## API Keys & Deployment

All API keys are required for core functionality:
- `FIRECRAWL_API_KEY` - Web scraping/search (https://firecrawl.dev/app/api-keys)
- `OPENAI_API_KEY` - LLM operations (https://platform.openai.com/api-keys)

Deploy to Vercel using the Deploy button in README.md, which auto-configures environment variables.
