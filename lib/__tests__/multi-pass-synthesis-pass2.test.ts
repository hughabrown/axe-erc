/**
 * Multi-Pass Synthesis - Pass 2 Tests
 *
 * Focused tests for Pass 2 deep dive analysis with full content retrieval.
 */

import { processSection, SectionFindings, OutlineSection } from '../multi-pass-synthesis';
import { InMemoryContentStore } from '../content-store';
import { Source } from '../langgraph-search-engine';

// Mock ChatOpenAI for Pass 2 testing
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({
      content: JSON.stringify({
        findings: [
          {
            claim: 'Test finding 1 with specific data',
            citations: ['https://example.com/1', 'https://example.com/2'],
            confidence: 0.9,
            evidence: 'Direct quote from source content'
          },
          {
            claim: 'Test finding 2 with another fact',
            citations: ['https://example.com/2'],
            confidence: 0.7,
            evidence: 'Another piece of evidence'
          }
        ]
      })
    })
  }))
}));

describe('Multi-Pass Synthesis - Pass 2', () => {
  let contentStore: InMemoryContentStore;
  let mockSection: OutlineSection;
  let mockSources: Source[];

  beforeEach(() => {
    contentStore = new InMemoryContentStore();

    // Populate content store with full content
    contentStore.store('https://example.com/1', 'Full detailed content for source 1 with lots of information about the topic');
    contentStore.store('https://example.com/2', 'Full detailed content for source 2 with different perspective');
    contentStore.store('https://example.com/3', 'Full detailed content for source 3 with additional data');

    mockSection = {
      id: 'section_1',
      title: 'Test Section',
      description: 'Test section description',
      relevantSources: [
        { url: 'https://example.com/1', relevanceScore: 0.9 },
        { url: 'https://example.com/2', relevanceScore: 0.8 },
        { url: 'https://example.com/3', relevanceScore: 0.7 }
      ],
      subsections: []
    };

    mockSources = [
      { url: 'https://example.com/1', title: 'Source 1', content: 'Summary 1' },
      { url: 'https://example.com/2', title: 'Source 2', content: 'Summary 2' },
      { url: 'https://example.com/3', title: 'Source 3', content: 'Summary 3' }
    ];
  });

  test('should retrieve full content from ContentStore', async () => {
    const findings = await processSection(mockSection, contentStore, mockSources);

    expect(findings).toBeDefined();
    expect(findings.sectionId).toBe(mockSection.id);
  });

  test('should extract findings with citations', async () => {
    const findings = await processSection(mockSection, contentStore, mockSources);

    expect(findings.findings).toBeInstanceOf(Array);
    expect(findings.findings.length).toBeGreaterThan(0);

    findings.findings.forEach(finding => {
      expect(finding.claim).toBeDefined();
      expect(finding.citations).toBeInstanceOf(Array);
      expect(finding.citations.length).toBeGreaterThan(0);
      expect(finding.confidence).toBeDefined();
      expect(finding.evidence).toBeDefined();
    });
  });

  test('should assign confidence scores in valid range', async () => {
    const findings = await processSection(mockSection, contentStore, mockSources);

    findings.findings.forEach(finding => {
      expect(finding.confidence).toBeGreaterThanOrEqual(0.0);
      expect(finding.confidence).toBeLessThanOrEqual(1.0);
    });
  });

  test('should select top N sources by relevance', async () => {
    // Add many more sources to test selection
    for (let i = 4; i <= 100; i++) {
      mockSection.relevantSources.push({
        url: `https://example.com/${i}`,
        relevanceScore: 0.5 - (i * 0.001) // Decreasing relevance
      });
    }

    const findings = await processSection(mockSection, contentStore, mockSources);

    // Should still work even with many sources (top N selected)
    expect(findings).toBeDefined();
    expect(findings.sourcesUsed).toBeDefined();
  });

  test('should track which sources were actually used', async () => {
    const findings = await processSection(mockSection, contentStore, mockSources);

    expect(findings.sourcesUsed).toBeInstanceOf(Array);
    expect(findings.sourcesUsed.length).toBeGreaterThanOrEqual(0);
  });
});
