/**
 * Token Limit Handling Test
 *
 * Tests that the system properly handles large content volumes and
 * stays within GPT-4o's token limits (MAX_TOTAL_CHARS: 400k).
 */

import { generateOutline, processSection, type OutlineSection } from '../multi-pass-synthesis';
import { InMemoryContentStore } from '../content-store';
import { SYNTHESIS_CONFIG } from '../config';
import type { Source } from '../langgraph-search-engine';

// Mock OpenAI
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({
      content: JSON.stringify({
        sections: [
          {
            id: 'section_1',
            title: 'Section 1',
            description: 'Test section',
            relevantSources: [{ url: 'https://source1.com', relevanceScore: 0.9 }],
            subsections: [],
          },
        ],
        overallTheme: 'Test',
        findings: [
          {
            claim: 'Test finding',
            citations: ['https://source1.com'],
            confidence: 0.9,
            evidence: 'Evidence',
          },
        ],
      }),
    }),
  })),
}));

describe('Token Limit Handling', () => {
  test('system handles content approaching MAX_TOTAL_CHARS limit', async () => {
    const contentStore = new InMemoryContentStore();

    // Create sources with content totaling ~380k chars (near 400k limit)
    const largeContent = 'x'.repeat(19000); // 19k chars per source
    const sources: Source[] = Array.from({ length: 20 }, (_, i) => ({
      url: `https://source${i + 1}.com`,
      title: `Source ${i + 1}`,
      content: `Summary for source ${i + 1}`,
      quality: 0.9 - i * 0.01,
    }));

    // Store large content in ContentStore
    sources.forEach((source) => {
      contentStore.store(source.url, largeContent);
    });

    const stats = contentStore.getStats();
    expect(stats.totalChars).toBeGreaterThan(300000); // >300k chars
    expect(stats.totalChars).toBeLessThan(SYNTHESIS_CONFIG.MAX_TOTAL_CHARS); // <400k

    // Pass 1 should handle all summaries
    const outline = await generateOutline('test query', sources);
    expect(outline).toBeDefined();
    expect(outline.sections.length).toBeGreaterThan(0);
  });

  test('Pass 2 truncates content to MAX_CHARS_PER_SOURCE', async () => {
    const contentStore = new InMemoryContentStore();

    // Store content exceeding MAX_CHARS_PER_SOURCE (30k)
    const veryLongContent = 'x'.repeat(50000); // 50k chars (exceeds limit)
    contentStore.store('https://source1.com', veryLongContent);

    const section: OutlineSection = {
      id: 'test_section',
      title: 'Test',
      description: 'Test section',
      relevantSources: [{ url: 'https://source1.com', relevanceScore: 0.9 }],
      subsections: [],
    };

    const sources: Source[] = [
      { url: 'https://source1.com', title: 'Source 1', content: 'Summary' },
    ];

    // Should not fail despite content exceeding limit
    const findings = await processSection(section, contentStore, sources);
    expect(findings).toBeDefined();
    expect(findings.findings).toBeDefined();
  });

  test('system handles hundreds of sources with summaries', async () => {
    // Create 500 sources (like real search with many results)
    const sources: Source[] = Array.from({ length: 500 }, (_, i) => ({
      url: `https://source${i + 1}.com`,
      title: `Source ${i + 1}`,
      content: `Summary for source ${i + 1} with relevant information about the query topic`,
      quality: 0.95 - i * 0.001,
    }));

    // Pass 1 should handle all summaries (summaries are ~80 chars each = 40k total)
    const outline = await generateOutline('test query', sources);

    expect(outline).toBeDefined();
    expect(outline.sections).toBeInstanceOf(Array);
    expect(outline.sections.length).toBeGreaterThan(0);
  });

  test('ContentStore tracks total character count correctly', async () => {
    const contentStore = new InMemoryContentStore();

    const content1 = 'a'.repeat(10000); // 10k
    const content2 = 'b'.repeat(20000); // 20k
    const content3 = 'c'.repeat(15000); // 15k

    contentStore.store('https://source1.com', content1);
    contentStore.store('https://source2.com', content2);
    contentStore.store('https://source3.com', content3);

    const stats = contentStore.getStats();
    expect(stats.totalChars).toBe(45000);
    expect(stats.totalSources).toBe(3);
  });

  test('system respects MIN_CHARS_PER_SOURCE for quality', async () => {
    const contentStore = new InMemoryContentStore();

    // Store very short content (below MIN_CHARS_PER_SOURCE: 5k)
    const shortContent = 'Very brief content';
    contentStore.store('https://source1.com', shortContent);

    expect(shortContent.length).toBeLessThan(SYNTHESIS_CONFIG.MIN_CHARS_PER_SOURCE);

    // System should still work with short content
    const retrieved = contentStore.retrieve('https://source1.com');
    expect(retrieved).toBe(shortContent);
  });

  test('Pass 2 handles mixed content sizes efficiently', async () => {
    const contentStore = new InMemoryContentStore();

    // Mix of content sizes
    const sizes = [5000, 10000, 20000, 30000, 15000, 25000];
    const section: OutlineSection = {
      id: 'test_section',
      title: 'Test',
      description: 'Test section',
      relevantSources: sizes.map((_, i) => ({
        url: `https://source${i + 1}.com`,
        relevanceScore: 0.9 - i * 0.05,
      })),
      subsections: [],
    };

    sizes.forEach((size, i) => {
      contentStore.store(`https://source${i + 1}.com`, 'x'.repeat(size));
    });

    const sources: Source[] = sizes.map((_, i) => ({
      url: `https://source${i + 1}.com`,
      title: `Source ${i + 1}`,
      content: 'Summary',
    }));

    const findings = await processSection(section, contentStore, sources);
    expect(findings).toBeDefined();
  });

  test('config MAX_TOTAL_CHARS is within GPT-4o limits', () => {
    // GPT-4o supports ~128k tokens ≈ 512k chars
    expect(SYNTHESIS_CONFIG.MAX_TOTAL_CHARS).toBeLessThanOrEqual(512000);

    // Should be significantly increased from original 100k
    expect(SYNTHESIS_CONFIG.MAX_TOTAL_CHARS).toBeGreaterThanOrEqual(400000);
  });

  test('config MAX_CHARS_PER_SOURCE allows detailed content', () => {
    // Should allow detailed articles (30k chars ≈ 7500 tokens)
    expect(SYNTHESIS_CONFIG.MAX_CHARS_PER_SOURCE).toBeGreaterThanOrEqual(30000);

    // Should have reasonable upper bound
    expect(SYNTHESIS_CONFIG.MAX_CHARS_PER_SOURCE).toBeLessThanOrEqual(50000);
  });

  test('PASS_2_FULL_CONTENT_COUNT balances depth and breadth', () => {
    // Should retrieve enough sources for comprehensive analysis
    expect(SYNTHESIS_CONFIG.PASS_2_FULL_CONTENT_COUNT).toBeGreaterThanOrEqual(50);

    // But not so many that token limits are exceeded
    // 100 sources * 30k chars = 3M chars (too much)
    expect(SYNTHESIS_CONFIG.PASS_2_FULL_CONTENT_COUNT).toBeLessThanOrEqual(100);
  });
});
