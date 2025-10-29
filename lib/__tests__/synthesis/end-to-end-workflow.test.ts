/**
 * End-to-End Workflow Test
 *
 * Tests complete query execution through all 4 passes of multi-pass synthesis.
 * This is a critical integration test ensuring the entire Hybrid RAG pipeline works.
 */

import {
  generateOutline,
  processSection,
  validateFindings,
  generateFinalReport,
  type OutlineStructure,
  type SectionFindings,
} from '../../synthesis/multi-pass-synthesis';
import { InMemoryContentStore } from '../../synthesis/content-store';
import { CitationValidator } from '../../synthesis/citation-validator';
import type { Source } from '../../core/langgraph-search-engine';

// Mock OpenAI for deterministic testing
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockImplementation((messages) => {
      const content = JSON.stringify(messages);

      // Pass 1: Outline generation
      if (content.includes('structured outline') || content.includes('major themes')) {
        return Promise.resolve({
          content: JSON.stringify({
            sections: [
              {
                id: 'section_1',
                title: 'Technical Overview',
                description: 'Comprehensive technical analysis',
                relevantSources: [
                  { url: 'https://example.com/1', relevanceScore: 0.95 },
                  { url: 'https://example.com/2', relevanceScore: 0.90 },
                  { url: 'https://example.com/3', relevanceScore: 0.85 },
                ],
                subsections: [],
              },
              {
                id: 'section_2',
                title: 'Performance Benchmarks',
                description: 'Performance analysis and metrics',
                relevantSources: [
                  { url: 'https://example.com/4', relevanceScore: 0.92 },
                  { url: 'https://example.com/5', relevanceScore: 0.88 },
                ],
                subsections: [],
              },
              {
                id: 'section_3',
                title: 'Use Cases',
                description: 'Real-world applications',
                relevantSources: [
                  { url: 'https://example.com/6', relevanceScore: 0.80 },
                ],
                subsections: [],
              },
            ],
            overallTheme: 'Comprehensive technical analysis with performance metrics and use cases',
          }),
        });
      }

      // Pass 2: Deep dive findings
      else if (content.includes('extracting detailed findings') || content.includes('FULL CONTENT')) {
        return Promise.resolve({
          content: JSON.stringify({
            findings: [
              {
                claim: 'System achieves 95% accuracy on benchmark tests',
                citations: ['https://example.com/1', 'https://example.com/2'],
                confidence: 0.92,
                evidence: 'Benchmark results show consistent 95% accuracy across 10,000 test cases',
              },
              {
                claim: 'Processing latency averages 50ms per request',
                citations: ['https://example.com/3'],
                confidence: 0.85,
                evidence: 'Performance monitoring data from production environment',
              },
              {
                claim: 'Memory footprint scales linearly with dataset size',
                citations: ['https://example.com/1'],
                confidence: 0.78,
                evidence: 'Profiling data shows O(n) memory usage pattern',
              },
            ],
          }),
        });
      }

      // Pass 3: Validation and cross-reference
      else if (content.includes('validating research findings') || content.includes('cross-referenc')) {
        return Promise.resolve({
          content: JSON.stringify({
            validatedFindings: [
              {
                findingId: 'finding_1',
                updatedConfidence: 0.98,
                supportingSources: ['https://example.com/4', 'https://example.com/5'],
                conflictDetected: false,
              },
              {
                findingId: 'finding_2',
                updatedConfidence: 0.70,
                supportingSources: [],
                conflictDetected: true,
                conflictDetails: {
                  viewpoint1: {
                    claim: 'Latency averages 50ms',
                    citations: ['https://example.com/3'],
                  },
                  viewpoint2: {
                    claim: 'Latency can exceed 100ms under load',
                    citations: ['https://example.com/6'],
                  },
                  resolution: 'present_both',
                },
              },
            ],
            informationGaps: [
              'No information found about long-term scalability beyond 1M users',
              'Cost analysis for enterprise deployment not available',
            ],
          }),
        });
      }

      // Default fallback
      return Promise.resolve({ content: '{}' });
    }),
    stream: jest.fn().mockImplementation(async function* () {
      yield { content: '# Comprehensive Technical Analysis\n\n' };
      yield { content: '## Executive Summary\n\n' };
      yield { content: 'This report provides a comprehensive analysis [https://example.com/1].\n\n' };
      yield { content: '## Technical Overview\n\n' };
      yield { content: 'The system demonstrates high performance [https://example.com/2] and reliability [https://example.com/3].\n\n' };
      yield { content: '## Performance Benchmarks\n\n' };
      yield { content: 'Benchmark results indicate 95% accuracy [https://example.com/1][https://example.com/2].\n' };
      yield { content: 'Latency metrics show 50ms average [https://example.com/3], though under load this can increase [https://example.com/6].\n\n' };
      yield { content: '## Use Cases\n\n' };
      yield { content: 'Real-world applications include [https://example.com/6].\n\n' };
      yield { content: '## Information Gaps\n\n' };
      yield { content: '- No information found about long-term scalability beyond 1M users\n' };
      yield { content: '- Cost analysis for enterprise deployment not available\n\n' };
      yield { content: '## Confidence Assessment\n\n' };
      yield { content: '- Accuracy claims: High confidence (0.98)\n' };
      yield { content: '- Latency performance: Medium confidence (0.70) due to conflicting reports\n' };
    }),
  })),
}));

describe('End-to-End Workflow: Full Multi-Pass Synthesis', () => {
  let contentStore: InMemoryContentStore;
  let mockSources: Source[];

  beforeEach(() => {
    contentStore = new InMemoryContentStore();

    // Create realistic mock sources with summaries
    mockSources = [
      {
        url: 'https://example.com/1',
        title: 'Technical Documentation',
        content: 'Summary: Comprehensive technical overview covering architecture and benchmarks',
        quality: 0.95,
      },
      {
        url: 'https://example.com/2',
        title: 'Performance Study',
        content: 'Summary: Detailed performance analysis with benchmark results',
        quality: 0.90,
      },
      {
        url: 'https://example.com/3',
        title: 'Production Metrics',
        content: 'Summary: Real-world performance data from production environment',
        quality: 0.85,
      },
      {
        url: 'https://example.com/4',
        title: 'Independent Review',
        content: 'Summary: Third-party evaluation of system capabilities',
        quality: 0.88,
      },
      {
        url: 'https://example.com/5',
        title: 'Case Study',
        content: 'Summary: Enterprise deployment case study',
        quality: 0.82,
      },
      {
        url: 'https://example.com/6',
        title: 'User Report',
        content: 'Summary: User experience and performance under load',
        quality: 0.75,
      },
    ];

    // Populate ContentStore with full content for Pass 2
    contentStore.store(
      'https://example.com/1',
      'Full technical documentation with detailed architecture diagrams, API specifications, and comprehensive benchmark results showing 95% accuracy across multiple test suites.'
    );
    contentStore.store(
      'https://example.com/2',
      'Performance study with extensive benchmark data including response times, throughput measurements, and scalability analysis.'
    );
    contentStore.store(
      'https://example.com/3',
      'Production metrics collected over 6 months showing average latency of 50ms, with detailed breakdown by endpoint and load patterns.'
    );
    contentStore.store(
      'https://example.com/4',
      'Independent review confirming accuracy claims with additional validation tests across different scenarios.'
    );
    contentStore.store(
      'https://example.com/5',
      'Enterprise case study documenting deployment at scale with performance characteristics under production workloads.'
    );
    contentStore.store(
      'https://example.com/6',
      'User-reported performance data showing latency can exceed 100ms during peak traffic periods with high concurrency.'
    );
  });

  test('complete workflow: query through all 4 passes to final report', async () => {
    const query = 'system performance and capabilities analysis';

    // PASS 1: Generate outline from summaries
    const outline = await generateOutline(query, mockSources);

    expect(outline).toBeDefined();
    expect(outline.sections).toBeInstanceOf(Array);
    expect(outline.sections.length).toBeGreaterThanOrEqual(3);
    expect(outline.overallTheme).toBeDefined();

    // PASS 2: Deep dive into each section with full content
    const allFindings: SectionFindings[] = [];

    for (const section of outline.sections) {
      const findings = await processSection(section, contentStore, mockSources);
      expect(findings).toBeDefined();
      expect(findings.sectionId).toBe(section.id);
      expect(findings.findings.length).toBeGreaterThan(0);
      allFindings.push(findings);
    }

    expect(allFindings.length).toBe(outline.sections.length);

    // PASS 3: Validate findings and detect conflicts
    const validationReport = await validateFindings(allFindings, contentStore, mockSources);

    expect(validationReport).toBeDefined();
    expect(validationReport.validatedFindings).toBeInstanceOf(Array);
    expect(validationReport.informationGaps).toBeInstanceOf(Array);
    expect(validationReport.informationGaps.length).toBeGreaterThan(0);

    // Check for conflict detection
    const hasConflicts = validationReport.validatedFindings.some(
      (f) => f.conflictDetected === true
    );
    expect(hasConflicts).toBe(true);

    // PASS 4: Generate final report
    const chunks: string[] = [];
    const report = await generateFinalReport(
      outline,
      validationReport,
      query,
      (chunk) => chunks.push(chunk)
    );

    expect(report).toBeDefined();
    expect(report.length).toBeGreaterThan(100);
    expect(chunks.length).toBeGreaterThan(0);

    // Verify report structure
    expect(report).toContain('# Comprehensive Technical Analysis');
    expect(report).toContain('## Information Gaps');
    expect(report).toContain('## Confidence Assessment');

    // Verify citations present
    expect(report).toContain('[https://');

    // Citation validation
    const citationValidator = new CitationValidator();
    citationValidator.parseReportCitations(report);

    const stats = citationValidator.getStats();
    expect(stats.totalUniqueCitations).toBeGreaterThan(0);

    const validationResult = citationValidator.validate(mockSources.length);
    expect(validationResult.totalUniqueCitations).toBeGreaterThan(0);
  });

  test('workflow maintains state across all passes', async () => {
    const query = 'test query';

    // Simulate workflow state transitions
    const outline = await generateOutline(query, mockSources);
    const section1Findings = await processSection(outline.sections[0], contentStore, mockSources);

    // State should carry forward
    expect(section1Findings.sectionId).toBe(outline.sections[0].id);

    const validation = await validateFindings([section1Findings], contentStore, mockSources);

    // Validation should reference original findings
    expect(validation.validatedFindings).toBeDefined();
    expect(validation.validatedFindings.length).toBeGreaterThan(0);
  });

  test('workflow handles ContentStore retrieval correctly', async () => {
    const outline = await generateOutline('test query', mockSources);

    // Verify ContentStore has content before Pass 2
    const stats = contentStore.getStats();
    expect(stats.totalSources).toBe(6);

    // Pass 2 should retrieve full content
    const findings = await processSection(outline.sections[0], contentStore, mockSources);

    expect(findings).toBeDefined();
    expect(findings.sourcesUsed).toBeDefined();
  });

  test('workflow generates comprehensive final output', async () => {
    const query = 'comprehensive analysis';

    const outline = await generateOutline(query, mockSources);
    const findings = await processSection(outline.sections[0], contentStore, mockSources);
    const validation = await validateFindings([findings], contentStore, mockSources);
    const report = await generateFinalReport(outline, validation, query, () => {});

    // Report should be comprehensive
    expect(report.length).toBeGreaterThan(200);

    // Should include multiple sections
    const sectionCount = (report.match(/##/g) || []).length;
    expect(sectionCount).toBeGreaterThan(2);

    // Should include citations
    const citationMatches = report.match(/\[https:\/\/[^\]]+\]/g) || [];
    expect(citationMatches.length).toBeGreaterThan(0);
  });
});
