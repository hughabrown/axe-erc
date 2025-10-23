/**
 * Multi-Pass Synthesis Display Tests
 *
 * Focused tests for multi-pass synthesis phase display in search-display.tsx
 * Tests verify that multi-pass specific event types are handled correctly and progress is displayed.
 */

import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { SearchDisplay } from '../search-display';
import type { SearchEvent, OutlineStructure } from '@/lib/langgraph-search-engine';

describe('Multi-Pass Synthesis Display', () => {
  it('should display multi-pass phase indicators (Pass 1-4)', () => {
    // Test Pass 1
    const pass1Events: SearchEvent[] = [
      { type: 'multi-pass-phase', pass: 1, message: 'Analyzing themes across 466 sources...' }
    ];

    const { rerender } = render(<SearchDisplay events={pass1Events} />);

    // Verify Pass 1 displays
    expect(screen.getByText(/Pass 1: Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyzing themes across 466 sources/i)).toBeInTheDocument();

    // Test Pass 2
    const pass2Events: SearchEvent[] = [
      ...pass1Events,
      { type: 'multi-pass-phase', pass: 2, message: 'Deep diving into top 50 sources...' }
    ];

    rerender(<SearchDisplay events={pass2Events} />);
    expect(screen.getByText(/Pass 2: Deep Dive/i)).toBeInTheDocument();
    expect(screen.getByText(/Deep diving into top 50 sources/i)).toBeInTheDocument();

    // Test Pass 3
    const pass3Events: SearchEvent[] = [
      ...pass2Events,
      { type: 'multi-pass-phase', pass: 3, message: 'Validating findings and checking conflicts...' }
    ];

    rerender(<SearchDisplay events={pass3Events} />);
    expect(screen.getByText(/Pass 3: Cross-Reference/i)).toBeInTheDocument();
    expect(screen.getByText(/Validating findings and checking conflicts/i)).toBeInTheDocument();

    // Test Pass 4
    const pass4Events: SearchEvent[] = [
      ...pass3Events,
      { type: 'multi-pass-phase', pass: 4, message: 'Generating comprehensive report...' }
    ];

    rerender(<SearchDisplay events={pass4Events} />);
    expect(screen.getByText(/Pass 4: Final Synthesis/i)).toBeInTheDocument();
    expect(screen.getByText(/Generating comprehensive report/i)).toBeInTheDocument();
  });

  it('should display outline generation event', () => {
    const mockOutline: OutlineStructure = {
      sections: [
        {
          id: 'section_1',
          title: 'Performance Benchmarks',
          description: 'DeepSeek R1 performance metrics',
          relevantSources: [
            { url: 'https://example.com/1', relevanceScore: 0.9 }
          ]
        },
        {
          id: 'section_2',
          title: 'Architecture Details',
          description: 'Model architecture and design',
          relevantSources: [
            { url: 'https://example.com/2', relevanceScore: 0.85 }
          ]
        },
        {
          id: 'section_3',
          title: 'Capabilities Overview',
          description: 'Key capabilities and features',
          relevantSources: [
            { url: 'https://example.com/3', relevanceScore: 0.8 }
          ]
        }
      ],
      overallTheme: 'Comprehensive analysis of DeepSeek R1'
    };

    const events: SearchEvent[] = [
      { type: 'multi-pass-phase', pass: 1, message: 'Analyzing themes...' },
      { type: 'outline-generated', outline: mockOutline }
    ];

    render(<SearchDisplay events={events} />);

    // Verify outline display
    expect(screen.getByText(/Outline generated with 3 sections/i)).toBeInTheDocument();
    expect(screen.getByText(/Performance Benchmarks/i)).toBeInTheDocument();
    expect(screen.getByText(/Architecture Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Capabilities Overview/i)).toBeInTheDocument();
  });

  it('should display deep-dive section progress', () => {
    const events: SearchEvent[] = [
      { type: 'multi-pass-phase', pass: 2, message: 'Deep diving...' },
      { type: 'deep-dive-section', sectionName: 'Performance Benchmarks', sourcesUsed: 25 },
      { type: 'deep-dive-section', sectionName: 'Architecture Details', sourcesUsed: 18 }
    ];

    render(<SearchDisplay events={events} />);

    // Verify section progress displays
    expect(screen.getByText(/Analyzing section:/i)).toBeInTheDocument();
    expect(screen.getByText(/Performance Benchmarks/i)).toBeInTheDocument();
    expect(screen.getByText(/25 sources/i)).toBeInTheDocument();

    expect(screen.getByText(/Architecture Details/i)).toBeInTheDocument();
    expect(screen.getByText(/18 sources/i)).toBeInTheDocument();
  });

  it('should display conflict detection alerts', () => {
    const events: SearchEvent[] = [
      { type: 'multi-pass-phase', pass: 3, message: 'Validating findings...' },
      {
        type: 'conflict-detected',
        claim: 'Model performance varies by benchmark',
        sources: ['https://example.com/1', 'https://example.com/2', 'https://example.com/3']
      }
    ];

    render(<SearchDisplay events={events} />);

    // Verify conflict alert displays
    expect(screen.getByText(/Conflict detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Model performance varies by benchmark/i)).toBeInTheDocument();
    expect(screen.getByText(/3 sources/i)).toBeInTheDocument();
  });

  it('should display final citation statistics', () => {
    const events: SearchEvent[] = [
      { type: 'multi-pass-phase', pass: 4, message: 'Generating report...' },
      { type: 'citation-stats', total: 52, coverage: 0.107 }
    ];

    render(<SearchDisplay events={events} />);

    // Verify citation stats display
    expect(screen.getByText(/Citations: 52 unique sources/i)).toBeInTheDocument();
    expect(screen.getByText(/Coverage: 10.7%/i)).toBeInTheDocument();
  });

  it('should handle all multi-pass events in correct sequence', () => {
    const mockOutline: OutlineStructure = {
      sections: [
        {
          id: 'section_1',
          title: 'Overview',
          description: 'General overview',
          relevantSources: [{ url: 'https://example.com/1', relevanceScore: 0.9 }]
        }
      ],
      overallTheme: 'Test theme'
    };

    const events: SearchEvent[] = [
      // Pass 1
      { type: 'multi-pass-phase', pass: 1, message: 'Analyzing themes across 100 sources...' },
      { type: 'outline-generated', outline: mockOutline },

      // Pass 2
      { type: 'multi-pass-phase', pass: 2, message: 'Deep diving into top sources...' },
      { type: 'deep-dive-section', sectionName: 'Overview', sourcesUsed: 30 },

      // Pass 3
      { type: 'multi-pass-phase', pass: 3, message: 'Validating findings...' },
      { type: 'conflict-detected', claim: 'Test conflict', sources: ['url1', 'url2'] },

      // Pass 4
      { type: 'multi-pass-phase', pass: 4, message: 'Generating report...' },
      { type: 'citation-stats', total: 45, coverage: 0.09 }
    ];

    render(<SearchDisplay events={events} />);

    // Verify all phases are displayed
    expect(screen.getByText(/Pass 1: Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Outline generated with 1 sections/i)).toBeInTheDocument();
    expect(screen.getByText(/Pass 2: Deep Dive/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyzing section:/i)).toBeInTheDocument();
    expect(screen.getByText(/Pass 3: Cross-Reference/i)).toBeInTheDocument();
    expect(screen.getByText(/Conflict detected/i)).toBeInTheDocument();
    expect(screen.getByText(/Pass 4: Final Synthesis/i)).toBeInTheDocument();
    expect(screen.getByText(/Citations: 45 unique sources/i)).toBeInTheDocument();
  });
});
