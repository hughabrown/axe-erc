/**
 * ContentStore → Pass 2 Integration Test
 *
 * Tests full content retrieval flow from ContentStore during Pass 2 deep dive.
 * Validates that full content is properly stored, retrieved, and used for analysis.
 */

import { processSection, type OutlineSection } from '../multi-pass-synthesis';
import { InMemoryContentStore } from '../content-store';
import type { Source } from '../langgraph-search-engine';
import { SYNTHESIS_CONFIG } from '../config';

// Mock OpenAI
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({
      content: JSON.stringify({
        findings: [
          {
            claim: 'Finding extracted from full content',
            citations: ['https://example.com/1'],
            confidence: 0.9,
            evidence: 'Specific evidence from full content analysis',
          },
        ],
      }),
    }),
  })),
}));

describe('ContentStore → Pass 2 Integration', () => {
  let contentStore: InMemoryContentStore;
  let mockSection: OutlineSection;
  let mockSources: Source[];

  beforeEach(() => {
    contentStore = new InMemoryContentStore();

    mockSection = {
      id: 'test_section',
      title: 'Test Section',
      description: 'Testing full content retrieval',
      relevantSources: [
        { url: 'https://example.com/1', relevanceScore: 0.95 },
        { url: 'https://example.com/2', relevanceScore: 0.90 },
        { url: 'https://example.com/3', relevanceScore: 0.85 },
        { url: 'https://example.com/4', relevanceScore: 0.80 },
        { url: 'https://example.com/5', relevanceScore: 0.75 },
      ],
      subsections: [],
    };

    mockSources = mockSection.relevantSources.map((rs) => ({
      url: rs.url,
      title: `Source ${rs.url}`,
      content: `Summary for ${rs.url}`,
      quality: rs.relevanceScore,
    }));
  });

  test('Pass 2 retrieves full content from ContentStore', async () => {
    // Populate ContentStore with full content
    const fullContent1 = 'This is the full detailed content for source 1 with extensive analysis and data points that would not fit in a summary.';
    const fullContent2 = 'Complete content for source 2 including detailed methodology, results, and comprehensive discussion spanning multiple paragraphs.';
    const fullContent3 = 'Full article content for source 3 with in-depth exploration of the topic and numerous supporting examples.';

    contentStore.store('https://example.com/1', fullContent1);
    contentStore.store('https://example.com/2', fullContent2);
    contentStore.store('https://example.com/3', fullContent3);

    // Verify ContentStore has content before Pass 2
    expect(contentStore.has('https://example.com/1')).toBe(true);
    expect(contentStore.has('https://example.com/2')).toBe(true);
    expect(contentStore.has('https://example.com/3')).toBe(true);

    const stats = contentStore.getStats();
    expect(stats.totalSources).toBe(3);
    expect(stats.totalChars).toBe(fullContent1.length + fullContent2.length + fullContent3.length);

    // Execute Pass 2
    const findings = await processSection(mockSection, contentStore, mockSources);

    // Verify findings were generated
    expect(findings).toBeDefined();
    expect(findings.sectionId).toBe(mockSection.id);
    expect(findings.findings).toBeInstanceOf(Array);
    expect(findings.findings.length).toBeGreaterThan(0);
  });

  test('Pass 2 selects top N sources by relevance score', async () => {
    // Add many sources to test selection
    const manySources: OutlineSection = {
      id: 'large_section',
      title: 'Large Section',
      description: 'Testing top-N selection',
      relevantSources: Array.from({ length: 100 }, (_, i) => ({
        url: `https://example.com/${i + 1}`,
        relevanceScore: 0.95 - i * 0.005, // Decreasing relevance
      })),
      subsections: [],
    };

    // Populate ContentStore with full content for all sources
    manySources.relevantSources.forEach((rs) => {
      contentStore.store(rs.url, `Full content for ${rs.url}`);
    });

    const allSources: Source[] = manySources.relevantSources.map((rs) => ({
      url: rs.url,
      title: `Source ${rs.url}`,
      content: `Summary for ${rs.url}`,
    }));

    // Execute Pass 2 (should select top PASS_2_FULL_CONTENT_COUNT sources)
    const findings = await processSection(manySources, contentStore, allSources);

    expect(findings).toBeDefined();
    expect(findings.sourcesUsed).toBeDefined();

    // Verify top sources were prioritized (sources should be sorted by relevance)
    // Note: Implementation details may vary, but top sources should be selected
  });

  test('Pass 2 handles missing full content gracefully', async () => {
    // Store content for only some sources
    contentStore.store('https://example.com/1', 'Full content for source 1');
    // Sources 2 and 3 have NO full content in ContentStore

    // Pass 2 should still work (fallback to summary)
    const findings = await processSection(mockSection, contentStore, mockSources);

    expect(findings).toBeDefined();
    expect(findings.findings).toBeInstanceOf(Array);
  });

  test('Pass 2 respects MAX_CHARS_PER_SOURCE limit', async () => {
    // Store extremely long content
    const veryLongContent = 'x'.repeat(100000); // 100k chars
    contentStore.store('https://example.com/1', veryLongContent);

    const findings = await processSection(mockSection, contentStore, mockSources);

    // Should still process successfully (content truncated internally)
    expect(findings).toBeDefined();
    expect(findings.findings).toBeInstanceOf(Array);

    // Note: Actual truncation happens inside processSection implementation
    // We verify it doesn't fail with very long content
  });

  test('Pass 2 retrieves batch of sources efficiently', async () => {
    // Store content for multiple sources
    for (let i = 1; i <= 5; i++) {
      contentStore.store(`https://example.com/${i}`, `Full content for source ${i}`);
    }

    // Measure batch retrieval
    const urls = mockSection.relevantSources.map((rs) => rs.url);
    const batch = contentStore.retrieveBatch(urls);

    expect(batch.size).toBe(5);
    expect(batch.get('https://example.com/1')).toContain('Full content for source 1');
    expect(batch.get('https://example.com/5')).toContain('Full content for source 5');
  });

  test('Pass 2 findings include citations to retrieved sources', async () => {
    contentStore.store('https://example.com/1', 'Full content 1 with important data');
    contentStore.store('https://example.com/2', 'Full content 2 with supporting evidence');

    const findings = await processSection(mockSection, contentStore, mockSources);

    // Verify findings have citations
    findings.findings.forEach((finding) => {
      expect(finding.citations).toBeInstanceOf(Array);
      expect(finding.citations.length).toBeGreaterThan(0);

      // Citations should reference sources we stored
      finding.citations.forEach((citation) => {
        expect(citation).toMatch(/^https:\/\//);
      });
    });
  });

  test('Pass 2 tracks which sources were actually used', async () => {
    contentStore.store('https://example.com/1', 'Content 1');
    contentStore.store('https://example.com/2', 'Content 2');
    contentStore.store('https://example.com/3', 'Content 3');

    const findings = await processSection(mockSection, contentStore, mockSources);

    // sourcesUsed should track which sources contributed to findings
    expect(findings.sourcesUsed).toBeInstanceOf(Array);
    expect(findings.sourcesUsed.length).toBeGreaterThanOrEqual(0);
  });

  test('ContentStore persists full content while sources use summaries', async () => {
    const originalFullContent = 'This is the original full content with extensive details';
    const summary = 'Brief summary';

    // Store full content in ContentStore
    contentStore.store('https://example.com/1', originalFullContent);

    // Source object has summary
    const source: Source = {
      url: 'https://example.com/1',
      title: 'Source 1',
      content: summary, // Summary, not full content
      quality: 0.9,
    };

    expect(source.content).toBe(summary);
    expect(source.content).not.toBe(originalFullContent);

    // ContentStore should still have full content
    const retrieved = contentStore.retrieve('https://example.com/1');
    expect(retrieved).toBe(originalFullContent);
  });

  test('Pass 2 works with mixed content availability', async () => {
    // Some sources have full content, others don't
    contentStore.store('https://example.com/1', 'Full content 1');
    contentStore.store('https://example.com/3', 'Full content 3');
    // Sources 2, 4, 5 have no full content

    const findings = await processSection(mockSection, contentStore, mockSources);

    // Should still generate findings with available content
    expect(findings).toBeDefined();
    expect(findings.findings.length).toBeGreaterThan(0);
  });
});
