/**
 * HRDD Report Synthesis Tests
 *
 * Focused tests for report synthesis logic.
 */

import { HRDDState } from '../hrdd-state';
import { synthesizeReport } from '../hrdd-synthesis';

// Mock ChatOpenAI
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    stream: jest.fn()
  }))
}));

describe('Report Synthesis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  test('should calculate overall risk as highest of three factors', async () => {
    const { ChatOpenAI } = require('@langchain/openai');

    const mockReport = `# Human Rights Due Diligence Assessment Report

## Executive Summary
- **Overall Risk Classification: High**

## Risk Factor 1: Geographic Context
- **Risk Level:** Low

## Risk Factor 2: Customer Profile
- **Risk Level:** Medium

## Risk Factor 3: End-Use Application
- **Risk Level:** High

## Overall Risk Classification
**Overall Risk Level: High**

The overall risk level is determined by the HIGHEST of the three risk factors.`;

    const mockStream = async function* () {
      yield { content: mockReport };
    };

    ChatOpenAI.mockImplementation(() => ({
      stream: jest.fn().mockImplementation(mockStream)
    }));

    const state: HRDDState = {
      dossier: {
        customer: 'Test Corp',
        useCase: 'Semi-autonomous targeting',
        country: 'USA'
      },
      preliminaryScreening: {
        weapons: null,
        sanctions: null,
        jurisdiction: null,
        outcome: 'PASS'
      },
      geographicRisk: {
        level: 'Low',
        rationale: 'EU member',
        citations: [],
        information_gaps: [],
        confidence: 0.9
      } as any,
      customerRisk: {
        level: 'Medium',
        rationale: 'Some concerns',
        citations: [],
        information_gaps: [],
        confidence: 0.7
      } as any,
      endUseRisk: {
        level: 'High',
        rationale: 'Near-weaponization',
        citations: [],
        information_gaps: [],
        confidence: 0.85
      } as any,
      sources: [
        { url: 'https://example.com/1', title: 'Source 1', content: 'Content 1' }
      ],
      queries: [],
      finalReport: null,
      overallRisk: null,
      auditTrail: [],
      rejected: false,
      currentPhase: 'synthesis',
      error: null,
      errorType: null
    };

    const result = await synthesizeReport(state);

    expect(result.overallRisk).toBe('High');  // Highest of Low, Medium, High
    expect(result.finalReport).toContain('Overall Risk Classification: High');
  });

  test('should include all required sections in report', async () => {
    const { ChatOpenAI } = require('@langchain/openai');

    const mockReport = `# Human Rights Due Diligence Assessment Report

## Executive Summary
- Customer: Test Corp

## Dossier Information
- **Customer Name:** Test Corp

## Preliminary Screening Results

### Controversial Weapons Check
- **Result:** No prohibited activities detected

### Sanctions Check
- **Customer Sanctions Status:** Not sanctioned

### High-Risk Jurisdiction Check
- **Result:** Not automatic high-risk

## Enhanced Due Diligence Findings

### Risk Factor 1: Geographic Context
- **Risk Level:** Low

### Risk Factor 2: Customer Profile
- **Risk Level:** Low

### Risk Factor 3: End-Use Application
- **Risk Level:** Low

## Overall Risk Classification
**Overall Risk Level: Low**

## Recommended Conditions
No additional conditions required.

## Information Gaps and Recommended Additional Research
- No gaps identified

## Citations
[1] Example Source, https://example.com/1`;

    const mockStream = async function* () {
      for (const char of mockReport) {
        yield { content: char };
      }
    };

    ChatOpenAI.mockImplementation(() => ({
      stream: jest.fn().mockImplementation(mockStream)
    }));

    const state: HRDDState = {
      dossier: {
        customer: 'Test Corp',
        useCase: 'Training',
        country: 'Germany'
      },
      preliminaryScreening: {
        weapons: { prohibited: false, rationale: 'OK', confidence: 0.9 },
        sanctions: {
          customer_sanctioned: false,
          customer_sanctions_programs: [],
          country_sanctioned: false,
          country_sanctions_type: 'none',
          country_sanctions_programs: [],
          rationale: 'Not sanctioned',
          information_gaps: [],
          confidence: 0.9
        },
        jurisdiction: {
          automatic_high_risk: false,
          un_bodies_accusations: [],
          international_court_cases: [],
          hr_organization_reports: [],
          rationale: 'OK',
          information_gaps: [],
          confidence: 0.9
        },
        outcome: 'PASS'
      },
      geographicRisk: {
        level: 'Low',
        rationale: 'EU member',
        citations: ['https://example.com/1'],
        information_gaps: [],
        confidence: 0.9
      } as any,
      customerRisk: {
        level: 'Low',
        rationale: 'Good governance',
        citations: ['https://example.com/1'],
        information_gaps: [],
        confidence: 0.9
      } as any,
      endUseRisk: {
        level: 'Low',
        rationale: 'Training only',
        citations: ['https://example.com/1'],
        information_gaps: [],
        confidence: 0.9
      } as any,
      sources: [
        { url: 'https://example.com/1', title: 'Example Source', content: 'Content' }
      ],
      queries: [],
      finalReport: null,
      overallRisk: null,
      auditTrail: [],
      rejected: false,
      currentPhase: 'synthesis',
      error: null,
      errorType: null
    };

    const result = await synthesizeReport(state);

    // Check that report contains required sections
    expect(result.finalReport).toContain('Executive Summary');
    expect(result.finalReport).toContain('Dossier Information');
    expect(result.finalReport).toContain('Preliminary Screening Results');
    expect(result.finalReport).toContain('Enhanced Due Diligence Findings');
    expect(result.finalReport).toContain('Overall Risk Classification');
    expect(result.finalReport).toContain('Citations');
  });

  test('should include REJECTED banner if preliminary screening failed', async () => {
    const { ChatOpenAI } = require('@langchain/openai');

    const mockReport = `# Human Rights Due Diligence Assessment Report

## Executive Summary
**CUSTOMER REJECTED DUE TO PRELIMINARY SCREENING FAILURE**

## Preliminary Screening Results
**Preliminary Screening Outcome:** FAIL

🚫 **CUSTOMER REJECTED: Preliminary screening detected prohibited activities. This assessment is provided for documentation purposes only.**`;

    const mockStream = async function* () {
      yield { content: mockReport };
    };

    ChatOpenAI.mockImplementation(() => ({
      stream: jest.fn().mockImplementation(mockStream)
    }));

    const state: HRDDState = {
      dossier: {
        customer: 'Defense Corp',
        useCase: 'Autonomous weapons',
        country: 'USA'
      },
      preliminaryScreening: {
        weapons: { prohibited: true, rationale: 'Autonomous weapons', confidence: 0.9 },
        sanctions: null,
        jurisdiction: null,
        outcome: 'FAIL'
      },
      geographicRisk: null,
      customerRisk: null,
      endUseRisk: null,
      sources: [],
      queries: [],
      finalReport: null,
      overallRisk: null,
      auditTrail: [],
      rejected: true,  // Marked as rejected
      currentPhase: 'synthesis',
      error: null,
      errorType: null
    };

    const result = await synthesizeReport(state);

    expect(result.finalReport).toContain('CUSTOMER REJECTED');
    expect(result.finalReport).toContain('FAIL');
  });

  test('should format citations with [source_id] inline format', async () => {
    const { ChatOpenAI } = require('@langchain/openai');

    const mockReport = `## Geographic Context
Freedom House rates Germany as Free with score 94 [1]. Press freedom is high [2].

## Citations
[1] Freedom House, https://freedomhouse.org/germany
[2] RSF Press Freedom, https://rsf.org/germany`;

    const mockStream = async function* () {
      yield { content: mockReport };
    };

    ChatOpenAI.mockImplementation(() => ({
      stream: jest.fn().mockImplementation(mockStream)
    }));

    const state: HRDDState = {
      dossier: {
        customer: 'Test',
        useCase: 'Test',
        country: 'Germany'
      },
      preliminaryScreening: {
        weapons: null,
        sanctions: null,
        jurisdiction: null,
        outcome: 'PASS'
      },
      geographicRisk: {
        level: 'Low',
        rationale: 'EU member',
        citations: ['https://freedomhouse.org/germany', 'https://rsf.org/germany'],
        information_gaps: [],
        confidence: 0.9
      } as any,
      customerRisk: null,
      endUseRisk: null,
      sources: [
        { url: 'https://freedomhouse.org/germany', title: 'Freedom House', content: '' },
        { url: 'https://rsf.org/germany', title: 'RSF Press Freedom', content: '' }
      ],
      queries: [],
      finalReport: null,
      overallRisk: null,
      auditTrail: [],
      rejected: false,
      currentPhase: 'synthesis',
      error: null,
      errorType: null
    };

    const result = await synthesizeReport(state);

    // Check for inline citations
    expect(result.finalReport).toMatch(/\[1\]/);
    expect(result.finalReport).toMatch(/\[2\]/);
    expect(result.finalReport).toContain('## Citations');
  });
});
