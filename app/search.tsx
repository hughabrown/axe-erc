'use server';

import { createStreamableValue } from 'ai/rsc';
import { FirecrawlClient } from '@/lib/core/firecrawl';
import { LangGraphSearchEngine as SearchEngine, SearchEvent } from '@/lib/core/langgraph-search-engine';
import { HRDDWorkflowEngine, HRDDEvent } from '@/lib/hrdd/hrdd-workflow-engine';
import { Dossier } from '@/lib/hrdd/hrdd-state';

// Original search function (for backward compatibility if needed)
export async function search(query: string, context?: { query: string; response: string }[], apiKey?: string) {
  const stream = createStreamableValue<SearchEvent>();

  // Create FirecrawlClient with API key if provided
  const firecrawl = new FirecrawlClient(apiKey);
  const searchEngine = new SearchEngine(firecrawl);

  // Run search in background
  (async () => {
    try {
      // Stream events as they happen
      await searchEngine.search(query, (event) => {
        stream.update(event);
      }, context);

      stream.done();
    } catch (error) {
      stream.error(error);
    }
  })();

  return { stream: stream.value };
}

// HRDD Assessment Server Action
export async function hrddAssessment(dossier: Dossier, apiKey?: string) {
  const stream = createStreamableValue<HRDDEvent>();

  // Check if test mode is enabled
  const testMode = process.env.NEXT_PUBLIC_HRDD_TEST_MODE === 'true';

  // Run assessment in background
  (async () => {
    try {
      if (testMode) {
        // Use mock assessment in test mode (no API calls)
        const { runMockAssessment } = await import('@/lib/hrdd/hrdd-test-mode');
        await runMockAssessment(dossier, (event) => {
          stream.update(event);
        });
      } else {
        // Real assessment with API calls
        const firecrawl = new FirecrawlClient(apiKey);
        const hrddEngine = new HRDDWorkflowEngine(firecrawl);
        await hrddEngine.runAssessment(dossier, (event) => {
          stream.update(event);
        });
      }

      stream.done();
    } catch (error) {
      stream.error(error);
    }
  })();

  return { stream: stream.value };
}
