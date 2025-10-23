/**
 * Citation Validator
 *
 * Tracks citation usage and ensures quality requirements are met
 * for comprehensive research reports.
 */

import { SYNTHESIS_CONFIG } from './config';

/**
 * Citation usage tracking for a single source
 */
export interface CitationUsage {
  url: string;
  title: string;
  usageCount: number;
  sections: string[]; // Which sections cited this source
}

/**
 * Validation result with recommendations
 */
export interface ValidationResult {
  totalUniqueCitations: number;
  totalUsages: number;
  meetsMinimum: boolean;
  citationCoverage: number; // Percentage of total sources cited
  sectionsWithLowCitations: string[];
  recommendations: string[];
}

/**
 * CitationValidator class
 *
 * Tracks and validates citation usage across research reports
 */
export class CitationValidator {
  private citationMap: Map<string, CitationUsage> = new Map();

  /**
   * Register a citation from the report
   *
   * @param url - Source URL
   * @param sectionId - Section identifier where citation appears
   * @param title - Optional source title
   */
  addCitation(url: string, sectionId: string, title?: string): void {
    if (!this.citationMap.has(url)) {
      this.citationMap.set(url, {
        url,
        title: title || url,
        usageCount: 0,
        sections: [],
      });
    }

    const citation = this.citationMap.get(url)!;
    citation.usageCount++;

    // Track unique sections (don't duplicate section IDs)
    if (!citation.sections.includes(sectionId)) {
      citation.sections.push(sectionId);
    }
  }

  /**
   * Parse report markdown and extract all [url] citations
   *
   * Tracks which sections cite which sources by parsing markdown headers
   *
   * @param reportMarkdown - Complete markdown report
   */
  parseReportCitations(reportMarkdown: string): void {
    const citationRegex = /\[(https?:\/\/[^\]]+)\]/g;
    let currentSection = 'intro';

    // Track sections via ## headers
    const lines = reportMarkdown.split('\n');

    for (const line of lines) {
      // Update current section on header
      if (line.startsWith('## ')) {
        currentSection = line
          .replace('## ', '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_');
      }

      // Find all citations in this line
      let match;
      const regex = new RegExp(citationRegex);
      while ((match = regex.exec(line)) !== null) {
        this.addCitation(match[1], currentSection);
      }
    }
  }

  /**
   * Validate citation requirements
   *
   * Checks:
   * - Minimum total citations (50+)
   * - Minimum citations per section (3+)
   * - Citation coverage (% of sources cited)
   *
   * @param totalSourceCount - Total number of sources available
   * @returns Validation result with recommendations
   */
  validate(totalSourceCount: number): ValidationResult {
    const totalCitations = this.citationMap.size;
    const totalUsages = Array.from(this.citationMap.values()).reduce(
      (sum, c) => sum + c.usageCount,
      0
    );

    // Count citations per section
    const sectionCounts = new Map<string, number>();
    this.citationMap.forEach((citation) => {
      citation.sections.forEach((section) => {
        sectionCounts.set(section, (sectionCounts.get(section) || 0) + 1);
      });
    });

    // Find sections with low citation counts
    const sectionsWithLowCitations = Array.from(sectionCounts.entries())
      .filter(([_, count]) => count < SYNTHESIS_CONFIG.MIN_CITATIONS_PER_SECTION)
      .map(([section, _]) => section);

    return {
      totalUniqueCitations: totalCitations,
      totalUsages,
      meetsMinimum: totalCitations >= SYNTHESIS_CONFIG.MIN_TOTAL_CITATIONS,
      citationCoverage: totalSourceCount > 0 ? totalCitations / totalSourceCount : 0,
      sectionsWithLowCitations,
      recommendations: this.generateRecommendations(totalCitations, sectionCounts),
    };
  }

  /**
   * Generate recommendations for improving citation quality
   *
   * @param totalCitations - Total unique citations
   * @param sectionCounts - Map of section IDs to citation counts
   * @returns Array of recommendation strings
   */
  private generateRecommendations(
    totalCitations: number,
    sectionCounts: Map<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // Check overall citation count
    if (totalCitations < SYNTHESIS_CONFIG.MIN_TOTAL_CITATIONS) {
      const needed = SYNTHESIS_CONFIG.MIN_TOTAL_CITATIONS - totalCitations;
      recommendations.push(
        `Add ${needed} more unique citations to meet minimum of ${SYNTHESIS_CONFIG.MIN_TOTAL_CITATIONS}`
      );
    }

    // Check per-section citation counts
    sectionCounts.forEach((count, section) => {
      if (count < SYNTHESIS_CONFIG.MIN_CITATIONS_PER_SECTION) {
        const needed = SYNTHESIS_CONFIG.MIN_CITATIONS_PER_SECTION - count;
        recommendations.push(
          `Section "${section}" has only ${count} citation(s), needs ${needed} more to meet minimum of ${SYNTHESIS_CONFIG.MIN_CITATIONS_PER_SECTION}`
        );
      }
    });

    return recommendations;
  }

  /**
   * Get citation statistics
   *
   * @returns Statistics about citation usage
   */
  getStats() {
    return {
      totalUniqueCitations: this.citationMap.size,
      mostCitedSources: Array.from(this.citationMap.values())
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10),
      citationDistribution: this.getCitationDistribution(),
    };
  }

  /**
   * Get citation distribution across sections
   *
   * @returns Map of section IDs to citation counts
   */
  private getCitationDistribution(): Map<string, number> {
    const distribution = new Map<string, number>();

    this.citationMap.forEach((citation) => {
      citation.sections.forEach((section) => {
        distribution.set(section, (distribution.get(section) || 0) + 1);
      });
    });

    return distribution;
  }

  /**
   * Clear all citations (reset validator)
   */
  clear(): void {
    this.citationMap.clear();
  }
}
