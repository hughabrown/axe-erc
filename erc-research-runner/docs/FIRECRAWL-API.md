# Firecrawl Research Agent Guide
## Building Deep Research Tools with Long-Form Report Generation

This guide provides a comprehensive overview of Firecrawl's API capabilities, specifically focused on building research agents that compile long-form reports. It covers the Search endpoint in depth, data storage patterns, and practical workflows for research automation.

---

## Table of Contents

1. [Firecrawl Overview](#firecrawl-overview)
2. [The Search Endpoint: Deep Dive](#the-search-endpoint-deep-dive)
3. [Content Extraction & Storage](#content-extraction--storage)
4. [Other Core Endpoints](#other-core-endpoints)
5. [Building a Research Agent Workflow](#building-a-research-agent-workflow)
6. [Code Examples & Implementation](#code-examples--implementation)
7. [Rate Limits & Pricing](#rate-limits--pricing)
8. [Best Practices](#best-practices)

---

## Firecrawl Overview

### What is Firecrawl?

Firecrawl is an API service that transforms websites into clean, LLM-ready data formats. It handles complex web scraping challenges including:

- JavaScript-rendered content
- Anti-bot mechanisms and CAPTCHAs
- Dynamic content loading
- PDF/DOCX parsing
- Proxy rotation and rate limiting

### Core Capabilities

**Five Main API Endpoints:**

1. **Search** - Perform web searches with automatic content extraction
2. **Scrape** - Extract content from single URLs
3. **Crawl** - Recursively discover and scrape entire websites
4. **Extract** - AI-powered structured data extraction from multiple pages
5. **Map** - Quick URL discovery without full content extraction

### Output Formats

Firecrawl can return data in multiple formats:

- **Markdown** - Clean, formatted text perfect for LLMs
- **HTML** - Raw or cleaned HTML
- **JSON** - Structured data with custom schemas
- **Screenshots** - Visual captures of pages
- **Links** - Extracted hyperlinks
- **Metadata** - Titles, descriptions, OpenGraph tags, favicons

---

## The Search Endpoint: Deep Dive

### Why Search is Perfect for Research Agents

The `/search` endpoint is uniquely powerful because it combines two operations in one API call:

1. **Web search** - Find relevant URLs across the web
2. **Automatic scraping** - Extract full content from results

This means you get both search results AND their markdown content in a single request, making it ideal for research workflows.

### Endpoint Details

**Base URL:** `https://api.firecrawl.dev/v2/search`

**Method:** POST

**Authentication:** Bearer token via API key

### Key Parameters

#### Required Parameters

```javascript
{
  "query": "your search query"  // The search terms
}
```

#### Search Configuration

```javascript
{
  "limit": 10,           // Results per request (default: 5, max: 100)
  "sources": [           // Types of results to return
    {"type": "web"},     // Web pages (default)
    {"type": "news"},    // News articles
    {"type": "images"}   // Image results
  ],
  "categories": [        // Filter by content type
    {"type": "github"},  // GitHub repositories
    {"type": "research"}, // Academic papers
    {"type": "pdf"}      // PDF documents
  ]
}
```

#### Time-Based Filtering

```javascript
{
  "tbs": "qdr:d"  // Past day
  // Options: qdr:h (hour), qdr:d (day), qdr:w (week), qdr:m (month), qdr:y (year)
  // Custom ranges: "cdr:1,cd_min:1/1/2024,cd_max:12/31/2024"
}
```

#### Geographic Targeting

```javascript
{
  "location": "United States",
  "country": "us"
}
```

### The Critical Part: scrapeOptions

This is where the magic happens for research agents. By configuring `scrapeOptions`, you control what content is extracted:

```javascript
{
  "scrapeOptions": {
    "formats": ["markdown", "html"],  // What formats to return
    "onlyMainContent": true,           // Strip headers/footers (default: true)
    "maxAge": 172800000,               // Cache duration in ms (default: 2 days)
    "includeTags": ["article", "main"], // Specific HTML elements
    "excludeTags": ["nav", "footer"],  // Elements to remove
    "waitFor": 2000,                   // Wait for dynamic content (ms)
    "blockAds": true                   // Remove advertisements
  }
}
```

### Response Structure

```javascript
{
  "success": true,
  "data": [
    {
      "url": "https://example.com/article",
      "title": "Article Title",
      "description": "Brief description",

      // The gold: Full extracted content
      "markdown": "# Full Article Content\n\nThe complete text...",
      "html": "<html>...</html>",

      // Metadata
      "metadata": {
        "title": "Article Title",
        "description": "Meta description",
        "language": "en",
        "favicon": "https://example.com/favicon.ico",
        "ogImage": "https://example.com/image.jpg",
        "statusCode": 200
      },

      // Additional data
      "links": ["https://related-link.com"],
      "screenshot": "base64-encoded-image"
    }
  ]
}
```

### Practical Example: Research Query

Here's how to search for information and get full content in one call:

```typescript
const searchResult = await firecrawl.search("climate change impact on agriculture", {
  limit: 20,
  sources: [{"type": "web"}, {"type": "research"}],
  categories: [{"type": "research"}, {"type": "pdf"}],
  tbs: "qdr:y",  // Past year only
  scrapeOptions: {
    formats: ["markdown"],
    onlyMainContent: true,
    maxAge: 86400000  // 1 day cache
  }
});

// Result contains 20 sources with full markdown content
// Ready to save locally and use for report generation
```

---

## Content Extraction & Storage

### How Content is Gathered

The Search endpoint returns an array of results, each containing:

1. **Metadata** - URL, title, description, favicon
2. **Content** - Full markdown/HTML of the page
3. **Context** - Links, screenshots, metadata

All of this is scraped and returned in the initial API call, so there's no need for follow-up scraping.

### Local Storage Strategy

Here's a recommended workflow for saving research data:

#### 1. Create a Research Session

```typescript
interface ResearchSession {
  id: string;
  query: string;
  timestamp: Date;
  sources: Source[];
  metadata: {
    totalSources: number;
    categories: string[];
    dateRange?: string;
  };
}

interface Source {
  url: string;
  title: string;
  markdown: string;
  metadata: any;
  relevanceScore?: number;
}
```

#### 2. Save Search Results to JSON

```typescript
import fs from 'fs/promises';
import path from 'path';

async function saveResearchData(
  query: string,
  searchResults: any[]
): Promise<string> {
  const sessionId = `research-${Date.now()}`;
  const filename = `${sessionId}.json`;
  const filepath = path.join(process.cwd(), 'research-data', filename);

  const session: ResearchSession = {
    id: sessionId,
    query: query,
    timestamp: new Date(),
    sources: searchResults.map(result => ({
      url: result.url,
      title: result.title,
      markdown: result.markdown,
      metadata: result.metadata
    })),
    metadata: {
      totalSources: searchResults.length,
      categories: [...new Set(searchResults.map(r => r.metadata?.category))]
    }
  };

  await fs.mkdir(path.dirname(filepath), { recursive: true });
  await fs.writeFile(filepath, JSON.stringify(session, null, 2));

  return filepath;
}
```

#### 3. Save Individual Articles (Optional)

For large research projects, you might want individual markdown files:

```typescript
async function saveArticlesSeparately(
  sessionId: string,
  sources: Source[]
): Promise<void> {
  const baseDir = path.join(process.cwd(), 'research-data', sessionId);
  await fs.mkdir(baseDir, { recursive: true });

  // Save index
  await fs.writeFile(
    path.join(baseDir, 'index.json'),
    JSON.stringify({
      sessionId,
      sourceCount: sources.length,
      sources: sources.map(s => ({
        url: s.url,
        title: s.title,
        filename: `${slugify(s.title)}.md`
      }))
    }, null, 2)
  );

  // Save each article as markdown
  for (const source of sources) {
    const filename = `${slugify(source.title)}.md`;
    const content = `---
url: ${source.url}
title: ${source.title}
date: ${new Date().toISOString()}
---

${source.markdown}
`;
    await fs.writeFile(path.join(baseDir, filename), content);
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}
```

### Loading Data for Report Generation

```typescript
async function loadResearchSession(sessionId: string): Promise<ResearchSession> {
  const filepath = path.join(process.cwd(), 'research-data', `${sessionId}.json`);
  const content = await fs.readFile(filepath, 'utf-8');
  return JSON.parse(content);
}

async function generateReport(sessionId: string): Promise<string> {
  const session = await loadResearchSession(sessionId);

  // Now you have all the content locally to feed to your LLM
  const allContent = session.sources
    .map(s => `## ${s.title}\nSource: ${s.url}\n\n${s.markdown}`)
    .join('\n\n---\n\n');

  // Feed to LLM for synthesis
  const report = await synthesizeReport(session.query, allContent);

  return report;
}
```

---

## Other Core Endpoints

### Scrape Endpoint

For scraping individual URLs you already know about:

```typescript
const result = await firecrawl.scrape('https://example.com/article', {
  formats: ['markdown', 'html'],
  onlyMainContent: true
});

// Returns: { markdown, html, metadata }
```

**Use cases:**
- Scraping specific URLs from citations
- Following up on references
- Re-scraping outdated content

### Crawl Endpoint

For comprehensive website extraction:

```typescript
const crawlResult = await firecrawl.crawl('https://example.com', {
  limit: 100,                    // Max pages
  scrapeOptions: {
    formats: ['markdown']
  },
  crawlEntireDomain: true,       // Include all subpages
  allowSubdomains: false         // Stay on main domain
});

// Returns array of all discovered pages with content
```

**How it works:**
1. Scans sitemap
2. Recursively follows links
3. Extracts content from each page
4. Returns all results when complete

**Use cases:**
- Company research (crawl entire corporate site)
- Documentation extraction
- Comprehensive competitor analysis

### Extract Endpoint

For structured data extraction across multiple pages:

```typescript
const extractResult = await firecrawl.extract({
  urls: [
    'https://company1.com/about',
    'https://company2.com/about',
    'https://company3.com/about'
  ],
  schema: {
    type: 'object',
    properties: {
      companyName: { type: 'string' },
      foundedYear: { type: 'number' },
      ceo: { type: 'string' },
      products: { type: 'array', items: { type: 'string' } }
    }
  }
});

// Returns structured data matching your schema
```

**Or use prompt-based extraction:**

```typescript
const extractResult = await firecrawl.extract({
  urls: ['https://company.com/*'],  // Wildcard crawls the domain
  prompt: 'Extract the company mission statement, key products, and leadership team'
});
```

**Use cases:**
- Competitive analysis (extract same data from multiple competitors)
- Data aggregation (collect structured info from many sources)
- Market research

### Map Endpoint

For quick URL discovery without full scraping:

```typescript
const mapResult = await firecrawl.mapUrl('https://example.com', {
  search: 'product documentation',
  limit: 50
});

// Returns: { links: ['url1', 'url2', ...], metadata }
```

**Use cases:**
- Pre-crawl reconnaissance
- Letting users select which pages to scrape
- Finding specific types of pages before detailed extraction

---

## Building a Research Agent Workflow

### Recommended Architecture

Here's an end-to-end workflow for a deep research agent:

```
1. Query Decomposition
   ↓
2. Parallel Search Operations (Firecrawl Search API)
   ↓
3. Content Storage (Local JSON/Markdown)
   ↓
4. Content Analysis & Filtering
   ↓
5. Report Synthesis (LLM)
   ↓
6. Citation Management
```

### Step-by-Step Implementation

#### Step 1: Query Decomposition

Break complex queries into focused sub-questions:

```typescript
async function decompose Query(mainQuery: string): Promise<string[]> {
  // Use an LLM to break down the query
  const subQueries = await llm.generateSubQueries(mainQuery);

  // Example output:
  // Main: "Impact of AI on healthcare"
  // Sub-queries:
  // - "AI diagnostic tools accuracy studies"
  // - "AI in drug discovery recent developments"
  // - "AI medical imaging applications"
  // - "Healthcare AI regulatory landscape"

  return subQueries;
}
```

#### Step 2: Parallel Search Operations

Execute searches concurrently:

```typescript
async function gatherResearchData(
  subQueries: string[]
): Promise<ResearchSession[]> {
  const firecrawl = new FirecrawlClient(process.env.FIRECRAWL_API_KEY);

  // Execute all searches in parallel
  const searchPromises = subQueries.map(query =>
    firecrawl.search(query, {
      limit: 15,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true
      }
    })
  );

  const results = await Promise.all(searchPromises);

  // Save each result set
  const sessions = await Promise.all(
    results.map((result, i) =>
      saveResearchData(subQueries[i], result.data)
    )
  );

  return sessions;
}
```

#### Step 3: Content Storage

Already covered in the [Content Extraction & Storage](#content-extraction--storage) section.

#### Step 4: Content Analysis & Filtering

Score and filter sources for relevance:

```typescript
async function analyzeAndFilterSources(
  session: ResearchSession,
  originalQuery: string
): Promise<Source[]> {
  // Score each source for relevance
  const scoredSources = await Promise.all(
    session.sources.map(async source => {
      const relevance = await llm.scoreRelevance(
        originalQuery,
        source.title,
        source.markdown.substring(0, 1000)  // First 1000 chars
      );

      return { ...source, relevanceScore: relevance };
    })
  );

  // Filter and sort
  return scoredSources
    .filter(s => s.relevanceScore > 0.6)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
```

#### Step 5: Report Synthesis

Generate a comprehensive report:

```typescript
async function generateLongFormReport(
  mainQuery: string,
  sessions: ResearchSession[]
): Promise<string> {
  // Aggregate all sources
  const allSources = sessions.flatMap(s => s.sources);

  // Filter for highest quality
  const topSources = await analyzeAndFilterSources(
    { ...sessions[0], sources: allSources },
    mainQuery
  );

  // Create context for LLM
  const context = topSources
    .slice(0, 30)  // Top 30 sources
    .map((source, i) => `
[Source ${i + 1}]
Title: ${source.title}
URL: ${source.url}
Content:
${source.markdown.substring(0, 4000)}  // Truncate for token limits
    `)
    .join('\n\n---\n\n');

  // Generate report with citations
  const prompt = `
You are a research analyst. Based on the following sources, write a comprehensive
long-form report answering: "${mainQuery}"

Requirements:
- Minimum 2000 words
- Include proper citations [1], [2], etc.
- Organize into clear sections
- Synthesize information across sources
- Include contradictory findings when present

Sources:
${context}

Generate the report:
  `;

  const report = await llm.generate(prompt);

  // Append bibliography
  const bibliography = topSources
    .map((s, i) => `[${i + 1}] ${s.title}. ${s.url}`)
    .join('\n');

  return `${report}\n\n## References\n\n${bibliography}`;
}
```

#### Step 6: Save Final Report

```typescript
async function saveReport(
  query: string,
  report: string,
  sessions: ResearchSession[]
): Promise<string> {
  const reportId = `report-${Date.now()}`;
  const reportPath = path.join(process.cwd(), 'reports', `${reportId}.md`);

  const fullReport = `---
title: ${query}
date: ${new Date().toISOString()}
sources: ${sessions.map(s => s.id).join(', ')}
---

# ${query}

${report}
  `;

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, fullReport);

  return reportPath;
}
```

### Complete Workflow Function

```typescript
async function runDeepResearch(query: string): Promise<string> {
  console.log('1. Decomposing query...');
  const subQueries = await decomposeQuery(query);

  console.log('2. Gathering research data...');
  const sessions = await gatherResearchData(subQueries);

  console.log('3. Generating report...');
  const report = await generateLongFormReport(query, sessions);

  console.log('4. Saving report...');
  const reportPath = await saveReport(query, report, sessions);

  console.log(`✓ Report saved to: ${reportPath}`);
  return reportPath;
}

// Usage
await runDeepResearch("How is climate change affecting global food security?");
```

---

## Code Examples & Implementation

### Your Current Implementation

Looking at your existing `lib/core/firecrawl.ts`, you're already using best practices:

```typescript
// From your codebase
async search(query: string, options?: { limit?: number; scrapeOptions?: any }) {
  const searchParams: any = {
    limit: options?.limit || 10,
  };

  // Key: Enabling scrapeOptions to get content with search results
  if (options?.scrapeOptions !== false) {
    searchParams.scrapeOptions = {
      formats: ['markdown'],
      ...options?.scrapeOptions
    };
  }

  const result = await this.client.search(query, searchParams);

  // Transform to include scraped content
  const enrichedData = data.map((item: any) => ({
    url: item.url,
    title: item.title || item.metadata?.title || 'Untitled',
    description: item.description || item.metadata?.description || '',
    markdown: item.markdown || '',  // Full content!
    html: item.html || '',
    metadata: { ...item.metadata, favicon: favicon },
    scraped: true,  // Already has content
    content: item.markdown || ''
  }));

  return { data: enrichedData };
}
```

This is exactly right - you're getting full content in one API call.

### Enhanced Version for Research Agent

Here's an enhanced version with better storage:

```typescript
export class ResearchAgent {
  private firecrawl: FirecrawlClient;
  private storageDir: string;

  constructor(apiKey?: string, storageDir: string = './research-data') {
    this.firecrawl = new FirecrawlClient(apiKey);
    this.storageDir = storageDir;
  }

  async search AndStore(
    query: string,
    options?: {
      limit?: number;
      sources?: string[];
      categories?: string[];
      tbs?: string;
    }
  ): Promise<{ sessionId: string; sources: Source[] }> {
    // Execute search with full content extraction
    const result = await this.firecrawl.search(query, {
      limit: options?.limit || 20,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true
      }
    });

    // Create session
    const sessionId = `research-${Date.now()}-${this.slugify(query)}`;
    const session: ResearchSession = {
      id: sessionId,
      query: query,
      timestamp: new Date(),
      sources: result.data,
      metadata: {
        totalSources: result.data.length,
        categories: options?.categories || []
      }
    };

    // Save to disk
    const filepath = path.join(this.storageDir, `${sessionId}.json`);
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, JSON.stringify(session, null, 2));

    console.log(`✓ Saved ${result.data.length} sources to ${filepath}`);

    return { sessionId, sources: result.data };
  }

  async loadSession(sessionId: string): Promise<ResearchSession> {
    const filepath = path.join(this.storageDir, `${sessionId}.json`);
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  }

  async generateReport(sessionIds: string[], mainQuery: string): Promise<string> {
    // Load all sessions
    const sessions = await Promise.all(
      sessionIds.map(id => this.loadSession(id))
    );

    // Aggregate sources
    const allSources = sessions.flatMap(s => s.sources);

    // Generate report (integrate with your LLM)
    const report = await this.synthesizeReport(mainQuery, allSources);

    return report;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  private async synthesizeReport(
    query: string,
    sources: Source[]
  ): Promise<string> {
    // Your synthesis logic here
    // See "Report Synthesis" section above
  }
}
```

### Usage Example

```typescript
// Initialize agent
const agent = new ResearchAgent(process.env.FIRECRAWL_API_KEY);

// Multi-step research
const step1 = await agent.searchAndStore(
  "machine learning frameworks 2024 comparison"
);

const step2 = await agent.searchAndStore(
  "PyTorch vs TensorFlow performance benchmarks"
);

const step3 = await agent.searchAndStore(
  "JAX deep learning adoption industry"
);

// Generate comprehensive report
const report = await agent.generateReport(
  [step1.sessionId, step2.sessionId, step3.sessionId],
  "What are the best machine learning frameworks in 2024?"
);

console.log(report);
```

---

## Rate Limits & Pricing

### Pricing Plans (2025)

| Plan | Cost | Credits/Month | Concurrent Browsers | Best For |
|------|------|---------------|---------------------|----------|
| **Free** | $0 | 500 (one-time) | 2 | Testing |
| **Hobby** | $16/mo | 3,000 | 5 | Personal projects |
| **Standard** | $83/mo | 100,000 | 50 | Production apps |
| **Growth** | $333/mo | 500,000 | 100 | Scale operations |

**Note:** 1 credit = 1 page scraped under standard conditions.

### Rate Limits

| Plan | Crawl Requests/Min |
|------|-------------------|
| Free | 1 |
| Hobby | 3 |
| Standard | 10 |
| Growth | 50 |

### Cost Optimization Tips

1. **Use caching** - Set `maxAge` to 2+ days for content that doesn't change frequently
2. **Filter before scraping** - Use Map endpoint to identify URLs, then selectively scrape
3. **Batch operations** - Group URLs into single Extract calls instead of individual scrapes
4. **Target main content** - Use `onlyMainContent: true` to avoid scraping navigation/footer
5. **Set reasonable limits** - Don't scrape 100 results when 20 will suffice

### Budget Planning for Research Agent

Example: Monthly research agent serving 100 users

- Average queries/user: 10/month = 1,000 queries
- Sub-queries per query: 5 = 5,000 searches
- Sources per search: 15 = 75,000 pages
- **Total credits needed:** 75,000
- **Recommended plan:** Standard ($83/mo, 100k credits)
- **Cost per research query:** $0.08

---

## Best Practices

### 1. Structured Data Storage

Always save metadata along with content:

```typescript
interface StoredSource {
  url: string;
  title: string;
  markdown: string;
  scrapedAt: string;
  query: string;          // What search led to this
  relevanceScore?: number; // Your internal scoring
  metadata: {
    favicon: string;
    description: string;
    language: string;
  };
}
```

### 2. Deduplication

When running multiple searches, deduplicate by URL:

```typescript
function deduplicateSources(sources: Source[]): Source[] {
  const seen = new Set<string>();
  return sources.filter(source => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}
```

### 3. Content Chunking for LLMs

Most LLMs have token limits. Chunk long content:

```typescript
function chunkContent(markdown: string, maxChars: number = 4000): string[] {
  const paragraphs = markdown.split('\n\n');
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxChars) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = para;
    } else {
      currentChunk += '\n\n' + para;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}
```

### 4. Progressive Report Generation

For very long reports, generate section by section:

```typescript
async function generateProgressiveReport(
  query: string,
  sources: Source[]
): Promise<string> {
  const sections = [
    'Executive Summary',
    'Background & Context',
    'Key Findings',
    'Analysis',
    'Conclusions',
    'Recommendations'
  ];

  const reportSections = await Promise.all(
    sections.map(section =>
      generateSection(section, query, sources)
    )
  );

  return reportSections.join('\n\n');
}
```

### 5. Citation Management

Track citations properly:

```typescript
interface Citation {
  id: number;
  source: Source;
  usedIn: string[];  // Which sections used this citation
}

function manageCitations(report: string, sources: Source[]): {
  report: string;
  citations: Citation[];
} {
  const citations: Citation[] = [];
  let citationId = 1;

  // Replace source references with citation numbers
  sources.forEach(source => {
    const regex = new RegExp(`\\[${source.url}\\]`, 'g');
    if (report.match(regex)) {
      citations.push({
        id: citationId,
        source: source,
        usedIn: []
      });
      report = report.replace(regex, `[${citationId}]`);
      citationId++;
    }
  });

  return { report, citations };
}
```

### 6. Error Handling

Firecrawl can fail on difficult sites. Handle gracefully:

```typescript
async function robustSearch(
  query: string,
  maxRetries: number = 3
): Promise<Source[]> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await firecrawl.search(query, {
        limit: 20,
        scrapeOptions: { formats: ['markdown'] }
      });

      return result.data;
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;

      // Exponential backoff
      await new Promise(resolve =>
        setTimeout(resolve, 1000 * Math.pow(2, attempt))
      );
    }
  }

  return [];
}
```

### 7. Cache Research Sessions

Avoid re-running expensive searches:

```typescript
async function cachedSearch(
  query: string,
  cacheDuration: number = 86400000  // 24 hours
): Promise<Source[]> {
  const cacheKey = `search:${query}`;
  const cached = await loadFromCache(cacheKey);

  if (cached && Date.now() - cached.timestamp < cacheDuration) {
    console.log('Using cached results');
    return cached.sources;
  }

  const sources = await firecrawl.search(query);
  await saveToCache(cacheKey, {
    timestamp: Date.now(),
    sources: sources.data
  });

  return sources.data;
}
```

---

## Conclusion

Firecrawl's Search API is perfectly suited for building research agents because it:

1. **Combines search and scraping** - Get full content in one API call
2. **Returns clean markdown** - Perfect for LLM consumption
3. **Handles complexity** - JavaScript, auth, anti-bot measures
4. **Scales well** - Concurrent operations, reasonable rate limits

### Key Takeaways

- Use the `/search` endpoint with `scrapeOptions.formats: ['markdown']` to get search results with full content
- Save everything to JSON/markdown locally in one step after the search
- Structure your storage with session IDs for easy retrieval
- Use the saved content to generate reports without additional API calls
- Implement proper deduplication, chunking, and citation management

### Next Steps

1. Implement the `ResearchAgent` class above
2. Test with simple queries to understand the data structure
3. Build out your report synthesis logic
4. Add progressive generation for long reports
5. Optimize with caching and filtering

---

## Additional Resources

- **Firecrawl Docs:** https://docs.firecrawl.dev
- **API Reference:** https://docs.firecrawl.dev/api-reference
- **Python SDK:** https://docs.firecrawl.dev/sdks/python
- **Node SDK:** https://docs.firecrawl.dev/sdks/node
- **Pricing:** https://www.firecrawl.dev/pricing
- **Your Implementation:** `/lib/core/firecrawl.ts`

---

*Generated: 2025-10-27*
