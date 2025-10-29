/**
 * Multi-Pass Synthesis - Pass 1 Tests
 *
 * Focused tests for Pass 1 outline generation from source summaries.
 */

import { generateOutline, OutlineStructure } from '../../synthesis/multi-pass-synthesis';
import { Source } from '../../core/langgraph-search-engine';

// Mock ChatOpenAI to avoid actual API calls in tests
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({
      content: JSON.stringify({
        sections: [
          {
            id: 'section_1',
            title: 'Test Section 1',
            description: 'Description of section 1',
            relevantSources: [
              { url: 'https://example.com/1', relevanceScore: 0.9 },
              { url: 'https://example.com/2', relevanceScore: 0.7 }
            ],
            subsections: []
          },
          {
            id: 'section_2',
            title: 'Test Section 2',
            description: 'Description of section 2',
            relevantSources: [
              { url: 'https://example.com/3', relevanceScore: 0.85 }
            ],
            subsections: []
          }
        ],
        overallTheme: 'Test theme covering multiple aspects'
      })
    })
  }))
}));

describe('Multi-Pass Synthesis - Pass 1', () => {
  const mockSources: Source[] = [
    {
      url: 'https://example.com/1',
      title: 'Source 1',
      content: 'Summary of source 1 content about topic A and topic B',
      quality: 1.0
    },
    {
      url: 'https://example.com/2',
      title: 'Source 2',
      content: 'Summary of source 2 content about topic A',
      quality: 0.9
    },
    {
      url: 'https://example.com/3',
      title: 'Source 3',
      content: 'Summary of source 3 content about topic B',
      quality: 0.8
    }
  ];

  test('should generate outline with multiple sections', async () => {
    const outline = await generateOutline('test query', mockSources);

    expect(outline).toBeDefined();
    expect(outline.sections).toBeInstanceOf(Array);
    expect(outline.sections.length).toBeGreaterThanOrEqual(2);
    expect(outline.overallTheme).toBeDefined();
    expect(typeof outline.overallTheme).toBe('string');
  });

  test('outline sections should have required structure', async () => {
    const outline = await generateOutline('test query', mockSources);

    outline.sections.forEach(section => {
      expect(section.id).toBeDefined();
      expect(section.title).toBeDefined();
      expect(section.description).toBeDefined();
      expect(section.relevantSources).toBeInstanceOf(Array);
      expect(section.subsections).toBeDefined();
    });
  });

  test('should map sources to sections with relevance scores', async () => {
    const outline = await generateOutline('test query', mockSources);

    const hasRelevantSources = outline.sections.some(
      section => section.relevantSources.length > 0
    );

    expect(hasRelevantSources).toBe(true);

    // Check relevance scores are in valid range
    outline.sections.forEach(section => {
      section.relevantSources.forEach(source => {
        expect(source.relevanceScore).toBeGreaterThanOrEqual(0.0);
        expect(source.relevanceScore).toBeLessThanOrEqual(1.0);
      });
    });
  });

  test('should handle empty sources gracefully', async () => {
    const outline = await generateOutline('test query', []);

    expect(outline).toBeDefined();
    expect(outline.sections).toBeDefined();
    expect(outline.overallTheme).toBeDefined();
  });
});
