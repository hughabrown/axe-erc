/**
 * Tests for Multi-Pass Synthesis LangGraph Integration
 * Tests the multiPassSynthesize node and workflow integration
 */

import {
  generateOutline,
  processSection,
  validateFindings,
  generateFinalReport,
} from '../multi-pass-synthesis';
import { InMemoryContentStore } from '../content-store';
import { CitationValidator } from '../citation-validator';
import type { Source } from '../langgraph-search-engine';

// Mock OpenAI LLM for integration tests
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockImplementation((messages) => {
      // Check if this is a Pass 1 outline request
      const content = JSON.stringify(messages);
      if (content.includes('structured outline')) {
        return Promise.resolve({
          content: JSON.stringify({
            sections: [
              {
                id: 'section_1',
                title: 'Overview',
                description: 'Main overview',
                relevantSources: [
                  { url: 'https://source1.com', relevanceScore: 0.9 },
                  { url: 'https://source2.com', relevanceScore: 0.8 },
                ],
                subsections: [],
              },
            ],
            overallTheme: 'Test theme',
          }),
        });
      }
      // Pass 2 findings request
      else if (content.includes('extracting detailed findings')) {
        return Promise.resolve({
          content: JSON.stringify({
            findings: [
              {
                claim: 'Test finding',
                citations: ['https://source1.com'],
                confidence: 0.9,
                evidence: 'Test evidence',
              },
            ],
          }),
        });
      }
      // Pass 3 validation request
      else {
        return Promise.resolve({
          content: JSON.stringify({
            validatedFindings: [
              {
                findingId: 'finding_1',
                updatedConfidence: 0.95,
                supportingSources: ['https://source2.com'],
                conflictDetected: false,
              },
            ],
            informationGaps: [],
          }),
        });
      }
    }),
    stream: jest.fn().mockImplementation(async function* () {
      yield { content: '# Final Report\n\n' };
      yield { content: 'Content with citations [https://source1.com].\n\n' };
      yield { content: 'More content [https://source2.com].' };
    }),
  })),
}));

describe('Multi-Pass Integration', () => {
  const mockSources: Source[] = [
    { url: 'https://source1.com', title: 'Source 1', content: 'Summary 1' },
    { url: 'https://source2.com', title: 'Source 2', content: 'Summary 2' },
    { url: 'https://source3.com', title: 'Source 3', content: 'Summary 3' },
  ];

  test('all 4 passes execute in sequence', async () => {
    const contentStore = new InMemoryContentStore();
    contentStore.store('https://source1.com', 'Full content 1');
    contentStore.store('https://source2.com', 'Full content 2');

    // Pass 1: Generate outline
    const outline = await generateOutline('test query', mockSources);
    expect(outline.sections.length).toBeGreaterThan(0);

    // Pass 2: Process sections
    const findings = await processSection(outline.sections[0], contentStore, mockSources);
    expect(findings.findings).toBeDefined();

    // Pass 3: Validate findings
    const validation = await validateFindings([findings], contentStore, mockSources);
    expect(validation.validatedFindings).toBeDefined();

    // Pass 4: Generate final report
    const report = await generateFinalReport(outline, validation, 'test query', () => {});
    expect(report).toBeDefined();
    expect(report.length).toBeGreaterThan(0);
  });

  test('outline generated in Pass 1', async () => {
    const outline = await generateOutline('test query', mockSources);

    expect(outline).toBeDefined();
    expect(outline.sections).toBeDefined();
    expect(Array.isArray(outline.sections)).toBe(true);
    expect(outline.overallTheme).toBeDefined();
  });

  test('findings generated in Pass 2', async () => {
    const contentStore = new InMemoryContentStore();
    contentStore.store('https://source1.com', 'Full content 1');

    const outline = await generateOutline('test query', mockSources);
    const findings = await processSection(outline.sections[0], contentStore, mockSources);

    expect(findings).toBeDefined();
    expect(findings.sectionId).toBeDefined();
    expect(Array.isArray(findings.findings)).toBe(true);
  });

  test('validation in Pass 3', async () => {
    const contentStore = new InMemoryContentStore();
    const outline = await generateOutline('test query', mockSources);
    const findings = await processSection(outline.sections[0], contentStore, mockSources);

    const validation = await validateFindings([findings], contentStore, mockSources);

    expect(validation).toBeDefined();
    expect(validation.validatedFindings).toBeDefined();
    expect(Array.isArray(validation.informationGaps)).toBe(true);
  });

  test('final report in Pass 4', async () => {
    const contentStore = new InMemoryContentStore();
    const outline = await generateOutline('test query', mockSources);
    const findings = await processSection(outline.sections[0], contentStore, mockSources);
    const validation = await validateFindings([findings], contentStore, mockSources);

    const report = await generateFinalReport(outline, validation, 'test query', () => {});

    expect(report).toBeDefined();
    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(0);
  });

  test('citation validation at end', async () => {
    const report = `# Test Report

## Introduction
This is a test claim [https://source1.com] with citation.

## Analysis
Another claim [https://source2.com] here.
And more [https://source3.com] content.`;

    const validator = new CitationValidator();
    validator.parseReportCitations(report);

    const result = validator.validate(100);

    expect(result.totalUniqueCitations).toBe(3);
    expect(result.totalUsages).toBe(3);
  });
});
