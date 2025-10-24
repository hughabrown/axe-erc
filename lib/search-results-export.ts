/**
 * Search Results Export
 *
 * Saves multi-pass synthesis search results to local JSON files for persistence.
 */

import fs from 'fs';
import path from 'path';

export interface SearchResultsExport {
  // Metadata
  timestamp: string;
  query: string;
  searchId: string;

  // Multi-pass state
  outline?: {
    sections: Array<{
      id: string;
      title: string;
      description: string;
      relevantSourcesCount: number;
    }>;
    overallTheme: string;
  };

  // Results
  finalReport: string;
  sources: Array<{
    url: string;
    title: string;
    cited: boolean;
  }>;

  // Statistics
  stats: {
    totalSources: number;
    citedSources: number;
    citationCoverage: number;
    uniqueCitations: number;
    reportLength: number;
    passes: {
      pass1Complete: boolean;
      pass2Complete: boolean;
      pass3Complete: boolean;
      pass4Complete: boolean;
    };
  };

  // Follow-up questions
  followUpQuestions?: string[];

  // Information gaps
  informationGaps?: string[];
}

/**
 * Save search results to local JSON file
 */
export async function saveSearchResults(
  query: string,
  finalReport: string,
  sources: Array<{ url: string; title?: string }>,
  citationMap: Map<string, any>,
  outline?: any,
  informationGaps?: string[],
  followUpQuestions?: string[]
): Promise<string> {
  const timestamp = new Date().toISOString();
  const searchId = generateSearchId(query, timestamp);

  // Calculate statistics
  const citedUrls = new Set(Array.from(citationMap.keys()));
  const totalSources = sources.length;
  const citedSources = citedUrls.size;
  const citationCoverage = totalSources > 0 ? citedSources / totalSources : 0;
  const reportLength = finalReport.split(/\s+/).length; // word count

  // Build export object
  const exportData: SearchResultsExport = {
    timestamp,
    query,
    searchId,
    outline: outline ? {
      sections: outline.sections?.map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        relevantSourcesCount: s.relevantSources?.length || 0
      })) || [],
      overallTheme: outline.overallTheme || ''
    } : undefined,
    finalReport,
    sources: sources.map(s => ({
      url: s.url,
      title: s.title || s.url,
      cited: citedUrls.has(s.url)
    })),
    stats: {
      totalSources,
      citedSources,
      citationCoverage,
      uniqueCitations: citedUrls.size,
      reportLength,
      passes: {
        pass1Complete: !!outline,
        pass2Complete: citedSources > 0,
        pass3Complete: !!informationGaps,
        pass4Complete: !!finalReport
      }
    },
    followUpQuestions,
    informationGaps
  };

  // Save to file
  const filename = `search-${searchId}.json`;
  const filepath = path.join(process.cwd(), 'search-results', filename);

  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write file
  fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf-8');

  console.log(`[Search Results] Saved to: ${filepath}`);
  console.log(`[Search Results] Stats: ${citedSources}/${totalSources} sources cited (${(citationCoverage * 100).toFixed(1)}%)`);

  return filepath;
}

/**
 * Generate unique search ID from query and timestamp
 */
function generateSearchId(query: string, timestamp: string): string {
  const date = new Date(timestamp);
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS

  // Sanitize query for filename (max 50 chars)
  const sanitized = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);

  return `${dateStr}-${timeStr}-${sanitized}`;
}

/**
 * Load search results from file
 */
export function loadSearchResults(searchId: string): SearchResultsExport | null {
  try {
    const filepath = path.join(process.cwd(), 'search-results', `search-${searchId}.json`);
    const data = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`[Search Results] Failed to load ${searchId}:`, error);
    return null;
  }
}

/**
 * List all saved search results
 */
export function listSearchResults(): string[] {
  try {
    const dir = path.join(process.cwd(), 'search-results');
    if (!fs.existsSync(dir)) {
      return [];
    }
    return fs.readdirSync(dir)
      .filter(f => f.startsWith('search-') && f.endsWith('.json'))
      .map(f => f.replace('search-', '').replace('.json', ''))
      .sort()
      .reverse(); // Most recent first
  } catch (error) {
    console.error('[Search Results] Failed to list results:', error);
    return [];
  }
}
