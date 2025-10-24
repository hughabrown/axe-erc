# Search Results

This directory contains saved search results from the Hybrid RAG multi-pass synthesis system.

## File Format

Each search is saved as: `search-YYYY-MM-DD-HH-MM-SS-{sanitized-query}.json`

### Example Filename
```
search-2025-10-23-15-30-45-deepseek-r1-capabilities.json
```

## JSON Structure

```json
{
  "timestamp": "2025-10-23T15:30:45.000Z",
  "query": "deepseek r1 capabilities and performance",
  "searchId": "2025-10-23-15-30-45-deepseek-r1-capabilities",

  "outline": {
    "sections": [
      {
        "id": "section_1",
        "title": "Section Title",
        "description": "Section description",
        "relevantSourcesCount": 15
      }
    ],
    "overallTheme": "Overall narrative theme"
  },

  "finalReport": "Full markdown report with citations...",

  "sources": [
    {
      "url": "https://example.com/article",
      "title": "Article Title",
      "cited": true
    }
  ],

  "stats": {
    "totalSources": 100,
    "citedSources": 73,
    "citationCoverage": 0.73,
    "uniqueCitations": 73,
    "reportLength": 8500,
    "passes": {
      "pass1Complete": true,
      "pass2Complete": true,
      "pass3Complete": true,
      "pass4Complete": true
    }
  },

  "followUpQuestions": [
    "Follow-up question 1?",
    "Follow-up question 2?"
  ],

  "informationGaps": [
    "Couldn't find information about X",
    "No sources addressed Y"
  ]
}
```

## Usage

### Programmatic Access

```typescript
import { loadSearchResults, listSearchResults } from '@/lib/search-results-export';

// List all saved searches
const searchIds = listSearchResults();

// Load a specific search
const results = loadSearchResults('2025-10-23-15-30-45-deepseek-r1-capabilities');
```

### Manual Access

Files are human-readable JSON. You can:
- Open in any text editor
- Use `jq` for command-line processing: `cat search-*.json | jq .stats`
- Import into analysis tools
- Share with team members

## Storage

- **Location**: `search-results/` directory in project root
- **Persistence**: Local filesystem only (not in database)
- **Lifecycle**: Files persist until manually deleted
- **Accumulation**: Each search creates a new file (no overwriting)

## Privacy & Security

- Files contain full search results including scraped content
- No API keys or credentials stored
- Review files before sharing externally
- Consider adding `search-results/` to `.gitignore` if results are sensitive

## Performance

- Each file is typically 50KB-500KB depending on source count
- No performance impact on searches (async save after completion)
- Disk space: ~1MB per 10 searches (approximate)
