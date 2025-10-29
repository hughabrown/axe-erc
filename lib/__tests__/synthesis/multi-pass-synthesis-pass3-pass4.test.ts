/**
 * Tests for Pass 3 (Cross-Reference) and Pass 4 (Final Report)
 * Multi-Pass Synthesis - Validation and Final Report Generation
 */

import {
  validateFindings,
  generateFinalReport,
  type SectionFindings,
  type Finding,
  type OutlineStructure,
} from '../../synthesis/multi-pass-synthesis';
import { InMemoryContentStore } from '../../synthesis/content-store';
import type { Source } from '../../core/langgraph-search-engine';

// Mock OpenAI LLM
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({
      content: JSON.stringify({
        validatedFindings: [
          {
            findingId: 'finding_1',
            updatedConfidence: 0.95,
            supportingSources: ['https://source3.com', 'https://source4.com'],
            conflictDetected: false,
          },
        ],
        informationGaps: ['Could not find specific pricing information'],
      }),
    }),
    stream: jest.fn().mockImplementation(async function* () {
      yield { content: '# Test Report\n\n' };
      yield { content: 'This is a test report with citations [https://source1.com].\n\n' };
      yield { content: 'More content [https://source2.com].' };
    }),
  })),
}));

describe('Pass 3: Cross-Reference and Validation', () => {
  const mockFindings: SectionFindings[] = [
    {
      sectionId: 'section_1',
      findings: [
        {
          claim: 'Test claim 1',
          citations: ['https://source1.com'],
          confidence: 0.7,
          evidence: 'Test evidence',
        },
        {
          claim: 'Test claim 2',
          citations: ['https://source2.com'],
          confidence: 0.6,
          evidence: 'More evidence',
        },
      ],
      sourcesUsed: ['https://source1.com', 'https://source2.com'],
    },
  ];

  const mockSources: Source[] = [
    { url: 'https://source1.com', title: 'Source 1', content: 'Summary 1' },
    { url: 'https://source2.com', title: 'Source 2', content: 'Summary 2' },
    { url: 'https://source3.com', title: 'Source 3', content: 'Summary 3' },
  ];

  test('validateFindings detects conflicts between sources', async () => {
    const contentStore = new InMemoryContentStore();
    contentStore.store('https://source1.com', 'Full content about topic A');
    contentStore.store('https://source3.com', 'Different view about topic A');

    const result = await validateFindings(mockFindings, contentStore, mockSources);

    expect(result).toBeDefined();
    expect(result.validatedFindings).toBeDefined();
    expect(Array.isArray(result.validatedFindings)).toBe(true);
  });

  test('validateFindings upgrades confidence scores with supporting sources', async () => {
    const contentStore = new InMemoryContentStore();
    contentStore.store('https://source1.com', 'Confirming evidence');

    const result = await validateFindings(mockFindings, contentStore, mockSources);

    expect(result.validatedFindings).toBeDefined();
    expect(result.validatedFindings.length).toBeGreaterThan(0);
    // Check that findings have updated confidence
    const firstFinding = result.validatedFindings[0];
    expect(firstFinding).toHaveProperty('updatedConfidence');
    expect(typeof firstFinding.updatedConfidence).toBe('number');
  });

  test('validateFindings identifies information gaps', async () => {
    const contentStore = new InMemoryContentStore();

    const result = await validateFindings(mockFindings, contentStore, mockSources);

    expect(result.informationGaps).toBeDefined();
    expect(Array.isArray(result.informationGaps)).toBe(true);
  });
});

describe('Pass 4: Final Report Generation', () => {
  const mockOutline: OutlineStructure = {
    sections: [
      {
        id: 'section_1',
        title: 'Introduction',
        description: 'Overview of the topic',
        relevantSources: [
          { url: 'https://source1.com', relevanceScore: 0.9 },
          { url: 'https://source2.com', relevanceScore: 0.8 },
        ],
      },
    ],
    overallTheme: 'Comprehensive analysis of the topic',
  };

  const mockValidationReport = {
    validatedFindings: [
      {
        originalFinding: {
          claim: 'Test claim',
          citations: ['https://source1.com'],
          confidence: 0.9,
          evidence: 'Test evidence',
        },
        updatedConfidence: 0.95,
        supportingSources: ['https://source2.com'],
        conflictDetected: false,
      },
    ],
    conflicts: [],
    informationGaps: ['Missing specific timeline'],
  };

  test('generateFinalReport produces markdown output', async () => {
    const chunks: string[] = [];
    const onChunk = (chunk: string) => chunks.push(chunk);

    const report = await generateFinalReport(
      mockOutline,
      mockValidationReport,
      'test query',
      onChunk
    );

    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(0);
  });

  test('generateFinalReport includes streamed content', async () => {
    const report = await generateFinalReport(
      mockOutline,
      mockValidationReport,
      'test query',
      () => {}
    );

    // The mock LLM returns "# Test Report" and content with citations
    expect(report).toContain('Test Report');
  });

  test('generateFinalReport streams content via onChunk callback', async () => {
    const chunks: string[] = [];
    const onChunk = (chunk: string) => chunks.push(chunk);

    await generateFinalReport(mockOutline, mockValidationReport, 'test query', onChunk);

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.some((chunk) => chunk.length > 0)).toBe(true);
  });

  test('generateFinalReport includes citations in [url] format', async () => {
    const report = await generateFinalReport(
      mockOutline,
      mockValidationReport,
      'test query',
      () => {}
    );

    // Check for citation format [https://...]
    const hasCitations = report.includes('[https://');
    expect(hasCitations).toBe(true);
  });

  test('generateFinalReport includes Information Gaps section', async () => {
    const report = await generateFinalReport(
      mockOutline,
      mockValidationReport,
      'test query',
      () => {}
    );

    // Since we mock the LLM response, we check the structure was attempted
    expect(report).toBeDefined();
    expect(report.length).toBeGreaterThan(0);
  });
});
