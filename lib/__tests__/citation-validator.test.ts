/**
 * Tests for Citation Validator
 * Tracks and validates citation usage across reports
 */

import { CitationValidator } from '../citation-validator';

describe('CitationValidator', () => {
  test('addCitation tracks citations correctly', () => {
    const validator = new CitationValidator();

    validator.addCitation('https://source1.com', 'section_1', 'Source 1');
    validator.addCitation('https://source1.com', 'section_2', 'Source 1');
    validator.addCitation('https://source2.com', 'section_1', 'Source 2');

    const stats = validator.getStats();

    expect(stats.totalUniqueCitations).toBe(2);
    expect(stats.mostCitedSources.length).toBeGreaterThan(0);
    expect(stats.mostCitedSources[0].usageCount).toBeGreaterThan(0);
  });

  test('parseReportCitations extracts [url] citations', () => {
    const validator = new CitationValidator();

    const report = `# Test Report

## Introduction

This is a claim [https://source1.com] with a citation.

## Analysis

Another claim [https://source2.com] and more [https://source1.com].`;

    validator.parseReportCitations(report);

    const stats = validator.getStats();

    expect(stats.totalUniqueCitations).toBe(2);
    // source1.com should be cited twice
    const source1 = stats.mostCitedSources.find((s) => s.url === 'https://source1.com');
    expect(source1?.usageCount).toBe(2);
  });

  test('validate checks minimum requirements', () => {
    const validator = new CitationValidator();

    // Add fewer than minimum citations (MIN_TOTAL_CITATIONS = 50)
    for (let i = 0; i < 10; i++) {
      validator.addCitation(`https://source${i}.com`, 'section_1', `Source ${i}`);
    }

    const result = validator.validate(100); // 100 total sources

    expect(result.totalUniqueCitations).toBe(10);
    expect(result.meetsMinimum).toBe(false);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  test('getStats returns accurate counts', () => {
    const validator = new CitationValidator();

    validator.addCitation('https://source1.com', 'section_1', 'Source 1');
    validator.addCitation('https://source1.com', 'section_1', 'Source 1');
    validator.addCitation('https://source2.com', 'section_2', 'Source 2');

    const stats = validator.getStats();

    expect(stats.totalUniqueCitations).toBe(2);
    expect(stats.citationDistribution.get('section_1')).toBe(1);
    expect(stats.citationDistribution.get('section_2')).toBe(1);
  });

  test('citation coverage calculation', () => {
    const validator = new CitationValidator();

    // Add 20 citations from a total of 200 sources
    for (let i = 0; i < 20; i++) {
      validator.addCitation(`https://source${i}.com`, 'section_1', `Source ${i}`);
    }

    const result = validator.validate(200);

    expect(result.citationCoverage).toBe(0.1); // 20/200 = 0.1 (10%)
  });

  test('parseReportCitations tracks sections correctly', () => {
    const validator = new CitationValidator();

    const report = `# Report

## Introduction
Citation [https://source1.com] in intro.

## Analysis
Citation [https://source2.com] in analysis.

## Conclusion
Citation [https://source1.com] in conclusion.`;

    validator.parseReportCitations(report);

    const stats = validator.getStats();
    const source1 = stats.mostCitedSources.find((s) => s.url === 'https://source1.com');

    // source1.com should be in multiple sections
    expect(source1?.sections.length).toBeGreaterThan(1);
  });
});
