/**
 * Conflict Detection Integration Test
 *
 * Tests Pass 3's ability to detect and report conflicting information
 * from disagreeing sources, ensuring transparent presentation.
 */

import {
  validateFindings,
  type SectionFindings,
  type Finding,
  type ValidationReport,
} from '../../synthesis/multi-pass-synthesis';
import { InMemoryContentStore } from '../../synthesis/content-store';
import type { Source } from '../../core/langgraph-search-engine';

// Mock OpenAI to simulate conflict detection
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockImplementation((messages) => {
      const content = JSON.stringify(messages);

      // Simulate Pass 3 detecting conflicts - ALWAYS return conflicts for testing
      if (content.includes('validating research findings')) {
        return Promise.resolve({
          content: JSON.stringify({
            validatedFindings: [
              {
                findingId: 'finding_1',
                updatedConfidence: 0.95,
                supportingSources: ['https://supporting1.com', 'https://supporting2.com'],
                conflictDetected: false,
              },
              {
                findingId: 'finding_2',
                updatedConfidence: 0.65,
                supportingSources: [],
                conflictDetected: true,
                conflictDetails: {
                  viewpoint1: {
                    claim: 'Performance is 100ms average latency',
                    citations: ['https://sourceA.com'],
                  },
                  viewpoint2: {
                    claim: 'Performance is 200ms average latency',
                    citations: ['https://sourceB.com', 'https://sourceC.com'],
                  },
                  resolution: 'present_both',
                },
              },
              {
                findingId: 'finding_3',
                updatedConfidence: 0.55,
                supportingSources: ['https://supporting3.com'],
                conflictDetected: true,
                conflictDetails: {
                  viewpoint1: {
                    claim: 'System supports up to 10,000 concurrent users',
                    citations: ['https://vendor.com'],
                  },
                  viewpoint2: {
                    claim: 'System struggles above 5,000 concurrent users',
                    citations: ['https://independent-review.com'],
                  },
                  resolution: 'present_both',
                },
              },
            ],
            informationGaps: ['Missing detailed scalability testing data'],
          }),
        });
      }

      return Promise.resolve({ content: '{}' });
    }),
  })),
}));

describe('Conflict Detection Integration', () => {
  let contentStore: InMemoryContentStore;

  beforeEach(() => {
    contentStore = new InMemoryContentStore();

    // Store conflicting sources with different perspectives
    contentStore.store(
      'https://sourceA.com',
      'Performance testing shows average latency of 100ms under normal load conditions.'
    );
    contentStore.store(
      'https://sourceB.com',
      'Our measurements indicate latency averaging 200ms, significantly higher than vendor claims.'
    );
    contentStore.store(
      'https://sourceC.com',
      'Independent benchmarks confirm 200ms average latency in production environments.'
    );
    contentStore.store(
      'https://vendor.com',
      'System specifications indicate support for up to 10,000 concurrent users with linear scaling.'
    );
    contentStore.store(
      'https://independent-review.com',
      'Real-world testing reveals performance degradation above 5,000 concurrent users.'
    );
    contentStore.store(
      'https://supporting1.com',
      'Confirms system architecture is well-designed and robust.'
    );
    contentStore.store(
      'https://supporting2.com',
      'Additional evidence supporting the architectural claims.'
    );
  });

  test('Pass 3 detects conflicts between disagreeing sources', async () => {
    const mockFindings: SectionFindings[] = [
      {
        sectionId: 'performance_section',
        findings: [
          {
            claim: 'System has good performance',
            citations: ['https://sourceA.com'],
            confidence: 0.8,
            evidence: 'Performance testing shows good results',
          },
          {
            claim: 'Average latency is 100ms',
            citations: ['https://sourceA.com'],
            confidence: 0.75,
            evidence: 'Latency measurements from vendor',
          },
          {
            claim: 'Supports 10,000 concurrent users',
            citations: ['https://vendor.com'],
            confidence: 0.7,
            evidence: 'Vendor specifications',
          },
        ],
        sourcesUsed: ['https://sourceA.com', 'https://vendor.com'],
      },
    ];

    const mockSources: Source[] = [
      { url: 'https://sourceA.com', title: 'Source A', content: 'Summary A' },
      { url: 'https://sourceB.com', title: 'Source B', content: 'Summary B' },
      { url: 'https://sourceC.com', title: 'Source C', content: 'Summary C' },
      { url: 'https://vendor.com', title: 'Vendor', content: 'Vendor summary' },
      { url: 'https://independent-review.com', title: 'Independent Review', content: 'Review summary' },
    ];

    const validation = await validateFindings(mockFindings, contentStore, mockSources);

    expect(validation).toBeDefined();
    expect(validation.validatedFindings).toBeInstanceOf(Array);

    // Check that conflicts were detected (mock maps 3 findings and returns 2 conflicts)
    const conflictFindings = validation.validatedFindings.filter((f) => f.conflictDetected);
    expect(conflictFindings.length).toBeGreaterThan(0);
  });

  test('conflicting findings have lower confidence scores', async () => {
    const mockFindings: SectionFindings[] = [
      {
        sectionId: 'test_section',
        findings: [
          {
            claim: 'Claim with agreement',
            citations: ['https://supporting1.com'],
            confidence: 0.9,
            evidence: 'Strong evidence',
          },
          {
            claim: 'Claim with disagreement',
            citations: ['https://sourceA.com'],
            confidence: 0.8,
            evidence: 'Conflicting evidence',
          },
        ],
        sourcesUsed: ['https://supporting1.com', 'https://sourceA.com'],
      },
    ];

    const mockSources: Source[] = [
      { url: 'https://supporting1.com', title: 'Supporting 1', content: 'Summary' },
      { url: 'https://sourceA.com', title: 'Source A', content: 'Summary A' },
      { url: 'https://sourceB.com', title: 'Source B', content: 'Summary B' },
    ];

    const validation = await validateFindings(mockFindings, contentStore, mockSources);

    const conflictFindings = validation.validatedFindings.filter((f) => f.conflictDetected);

    // Conflicting findings should have lower confidence (mock returns 0.65 for finding at index 1)
    conflictFindings.forEach((cf) => {
      expect(cf.updatedConfidence).toBeLessThan(0.8);
    });
  });

  test('conflict details include viewpoints from both sides', async () => {
    // Provide 3 findings to match mock response indices
    const mockFindings: SectionFindings[] = [
      {
        sectionId: 'test_section',
        findings: [
          {
            claim: 'Non-conflict claim',
            citations: ['https://supporting1.com'],
            confidence: 0.9,
            evidence: 'Strong evidence',
          },
          {
            claim: 'Performance metric claim',
            citations: ['https://sourceA.com'],
            confidence: 0.75,
            evidence: 'Evidence from source A',
          },
          {
            claim: 'Scalability claim',
            citations: ['https://vendor.com'],
            confidence: 0.7,
            evidence: 'Vendor specifications',
          },
        ],
        sourcesUsed: ['https://sourceA.com', 'https://vendor.com', 'https://supporting1.com'],
      },
    ];

    const mockSources: Source[] = [
      { url: 'https://sourceA.com', title: 'Source A', content: 'Summary A' },
      { url: 'https://sourceB.com', title: 'Source B', content: 'Summary B' },
      { url: 'https://sourceC.com', title: 'Source C', content: 'Summary C' },
      { url: 'https://vendor.com', title: 'Vendor', content: 'Vendor summary' },
    ];

    const validation = await validateFindings(mockFindings, contentStore, mockSources);

    // Mock maps findings by index, so with 3 input findings, we get 3 validated findings
    // Indices 1 and 2 have conflicts in the mock response
    const conflictFindings = validation.validatedFindings.filter((f) => f.conflictDetected);

    expect(conflictFindings.length).toBe(2); // Mock returns conflicts at indices 1 and 2

    // Check conflict details structure
    conflictFindings.forEach((cf) => {
      expect(cf.conflictDetails).toBeDefined();
      expect(cf.conflictDetails!.viewpoint1).toBeDefined();
      expect(cf.conflictDetails!.viewpoint2).toBeDefined();
      expect(cf.conflictDetails!.viewpoint1.claim).toBeDefined();
      expect(cf.conflictDetails!.viewpoint1.citations).toBeInstanceOf(Array);
      expect(cf.conflictDetails!.viewpoint2.claim).toBeDefined();
      expect(cf.conflictDetails!.viewpoint2.citations).toBeInstanceOf(Array);
      expect(cf.conflictDetails!.resolution).toBe('present_both');
    });
  });

  test('conflict resolution strategy is present_both', async () => {
    const mockFindings: SectionFindings[] = [
      {
        sectionId: 'test_section',
        findings: [
          {
            claim: 'Claim 1',
            citations: ['https://sourceA.com'],
            confidence: 0.8,
            evidence: 'Evidence 1',
          },
          {
            claim: 'Claim 2',
            citations: ['https://sourceB.com'],
            confidence: 0.7,
            evidence: 'Evidence 2',
          },
        ],
        sourcesUsed: ['https://sourceA.com', 'https://sourceB.com'],
      },
    ];

    const mockSources: Source[] = [
      { url: 'https://sourceA.com', title: 'Source A', content: 'Summary A' },
      { url: 'https://sourceB.com', title: 'Source B', content: 'Summary B' },
    ];

    const validation = await validateFindings(mockFindings, contentStore, mockSources);

    const conflictFindings = validation.validatedFindings.filter((f) => f.conflictDetected);

    // All conflicts should use 'present_both' resolution
    conflictFindings.forEach((cf) => {
      expect(cf.conflictDetails!.resolution).toBe('present_both');
    });
  });

  test('non-conflicting findings maintain or increase confidence', async () => {
    const mockFindings: SectionFindings[] = [
      {
        sectionId: 'test_section',
        findings: [
          {
            claim: 'Well-supported claim',
            citations: ['https://supporting1.com'],
            confidence: 0.85,
            evidence: 'Strong evidence',
          },
        ],
        sourcesUsed: ['https://supporting1.com'],
      },
    ];

    const mockSources: Source[] = [
      { url: 'https://supporting1.com', title: 'Supporting 1', content: 'Summary' },
      { url: 'https://supporting2.com', title: 'Supporting 2', content: 'Summary' },
    ];

    const validation = await validateFindings(mockFindings, contentStore, mockSources);

    const nonConflictFindings = validation.validatedFindings.filter((f) => !f.conflictDetected);

    // Mock returns finding_1 with updatedConfidence: 0.95 (non-conflict at index 0)
    expect(nonConflictFindings.length).toBeGreaterThan(0);
    nonConflictFindings.forEach((ncf) => {
      expect(ncf.updatedConfidence).toBeGreaterThanOrEqual(0.85);
    });
  });

  test('Pass 3 uses cross-reference sources for validation', async () => {
    const mockFindings: SectionFindings[] = [
      {
        sectionId: 'test_section',
        findings: [
          {
            claim: 'Initial claim from Pass 2',
            citations: ['https://sourceA.com'],
            confidence: 0.7,
            evidence: 'Initial evidence',
          },
        ],
        sourcesUsed: ['https://sourceA.com'],
      },
    ];

    // Provide additional sources for cross-reference
    const mockSources: Source[] = [
      { url: 'https://sourceA.com', title: 'Source A', content: 'Summary A' },
      { url: 'https://sourceB.com', title: 'Source B', content: 'Summary B' },
      { url: 'https://sourceC.com', title: 'Source C', content: 'Summary C' },
      { url: 'https://supporting1.com', title: 'Supporting 1', content: 'Summary S1' },
    ];

    const validation = await validateFindings(mockFindings, contentStore, mockSources);

    // Check that supporting sources were identified
    validation.validatedFindings.forEach((vf) => {
      expect(vf.supportingSources).toBeDefined();
      expect(Array.isArray(vf.supportingSources)).toBe(true);
    });
  });

  test('validation report includes all conflict information', async () => {
    const mockFindings: SectionFindings[] = [
      {
        sectionId: 'test_section',
        findings: [
          {
            claim: 'Test claim',
            citations: ['https://sourceA.com'],
            confidence: 0.75,
            evidence: 'Evidence',
          },
        ],
        sourcesUsed: ['https://sourceA.com'],
      },
    ];

    const mockSources: Source[] = [
      { url: 'https://sourceA.com', title: 'Source A', content: 'Summary' },
      { url: 'https://sourceB.com', title: 'Source B', content: 'Summary' },
    ];

    const validation: ValidationReport = await validateFindings(
      mockFindings,
      contentStore,
      mockSources
    );

    // Validation report structure
    expect(validation.validatedFindings).toBeDefined();
    expect(validation.informationGaps).toBeDefined();
    expect(Array.isArray(validation.validatedFindings)).toBe(true);
    expect(Array.isArray(validation.informationGaps)).toBe(true);

    // Check for conflicts array (if defined in implementation)
    if ('conflicts' in validation) {
      expect(Array.isArray((validation as any).conflicts)).toBe(true);
    }
  });
});
