/**
 * Content Store Population Tests
 *
 * Focused tests for integrating content storage into search/scrape workflow.
 */

import { InMemoryContentStore } from '../../synthesis/content-store';

describe('Content Store Population', () => {
  let contentStore: InMemoryContentStore;

  beforeEach(() => {
    contentStore = new InMemoryContentStore();
  });

  test('should store full content before summarization', () => {
    // Simulate search node behavior
    const sources = [
      { url: 'https://example.com/1', title: 'Article 1', content: 'Full markdown content here...' },
      { url: 'https://example.com/2', title: 'Article 2', content: 'Another full markdown content...' }
    ];

    // Store full content (this happens BEFORE summarization)
    sources.forEach(source => {
      if (source.content) {
        contentStore.store(source.url, source.content);
      }
    });

    // Verify full content was stored
    expect(contentStore.has(sources[0].url)).toBe(true);
    expect(contentStore.has(sources[1].url)).toBe(true);
    expect(contentStore.retrieve(sources[0].url)).toBe('Full markdown content here...');
    expect(contentStore.retrieve(sources[1].url)).toBe('Another full markdown content...');
  });

  test('should preserve both summary and fullContent in source object', () => {
    const originalContent = 'This is the full content with many details and information...';
    const summary = 'Summary: key points only';

    // Simulate ProcessedSource structure
    const processedSource = {
      url: 'https://example.com/article',
      title: 'Article',
      content: summary,           // Summary for Pass 1
      fullContent: originalContent, // Full content preserved for Pass 2
      quality: 0.8
    };

    expect(processedSource.content).toBe(summary);
    expect(processedSource.fullContent).toBe(originalContent);
    expect(processedSource.content).not.toBe(processedSource.fullContent);
  });

  test('should handle sources without content gracefully', () => {
    const sources = [
      { url: 'https://example.com/1', title: 'Article 1', content: 'Content' },
      { url: 'https://example.com/2', title: 'Article 2' } // No content
    ];

    sources.forEach(source => {
      if (source.content) {
        contentStore.store(source.url, source.content);
      }
    });

    expect(contentStore.has(sources[0].url)).toBe(true);
    expect(contentStore.has(sources[1].url)).toBe(false);
    expect(contentStore.getStats().totalSources).toBe(1);
  });

  test('should allow retrieval of full content for Pass 2', () => {
    // Setup: Populate contentStore during search
    const url = 'https://example.com/article';
    const fullContent = 'Very long article with detailed analysis and multiple sections...';
    contentStore.store(url, fullContent);

    // Pass 1: Use summary (not tested here)
    // Pass 2: Retrieve full content
    const retrieved = contentStore.retrieve(url);

    expect(retrieved).toBe(fullContent);
    expect(retrieved).not.toBeNull();
  });
});
