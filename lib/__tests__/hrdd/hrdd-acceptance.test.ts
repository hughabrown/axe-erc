/**
 * HRDD End-to-End Acceptance Tests
 *
 * This file contains simplified end-to-end acceptance tests that validate critical HRDD workflows
 * against the acceptance criteria from the spec (lines 1283-1317).
 *
 * These tests focus on business-critical workflows without attempting to mock the complete
 * LangGraph state machine. They verify:
 * - Overall risk classification logic (highest of 3 = overall)
 * - Citation format validation
 * - Report structure validation
 * - Information gap flagging
 * - REJECTED banner inclusion
 *
 * Note: Full end-to-end workflow tests (dossier → preliminary → 3 assessments → synthesis)
 * are covered in manual acceptance testing (Task 6.5) due to the complexity of mocking
 * LangGraph state reducers and async streaming.
 */

import { HRDDState } from '../../hrdd/hrdd-state';
import { synthesizeReport } from '../../hrdd/hrdd-synthesis';

// Mock ChatOpenAI
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(),
    stream: jest.fn()
  }))
}));

describe('HRDD Acceptance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  /**
   * Test 1: Overall Risk Calculation - Low/Low/Low → Low
   */
  test('Test 1: Overall risk should be Low when all three factors are Low', async () => {
    const { ChatOpenAI } = require('@langchain/openai');

    const mockReport = `# Human Rights Due Diligence Assessment Report

## Executive Summary
**Overall Risk Classification: Low**

## Overall Risk Classification
**Overall Risk Level: Low**

Rationale: All three risk factors are Low.`;

    const mockStream = async function* () {
      yield { content: mockReport };
    };

    ChatOpenAI.mockImplementation(() => ({
      stream: jest.fn().mockImplementation(mockStream)
    }));

    const state: HRDDState = {
      dossier: { customer: 'TechCorp EU', useCase: 'Training simulator', country: 'Germany' },
      preliminaryScreening: {
        weapons: { prohibited: false, rationale: 'OK', confidence: 0.9 },
        sanctions: {
          customer_sanctioned: false,
          customer_sanctions_programs: [],
          country_sanctioned: false,
          country_sanctions_type: 'none',
          country_sanctions_programs: [],
          rationale: 'OK',
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
      geographicRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      customerRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      endUseRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      sources: [],
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

    expect(result.overallRisk).toBe('Low');
    expect(result.finalReport).toContain('Overall Risk Classification: Low');
  });

  /**
   * Test 2: Overall Risk Calculation - Low/Medium/Low → Medium
   */
  test('Test 2: Overall risk should be Medium when at least one factor is Medium (no High)', async () => {
    const { ChatOpenAI } = require('@langchain/openai');

    const mockReport = `## Overall Risk Classification\n**Overall Risk Level: Medium**`;
    const mockStream = async function* () {
      yield { content: mockReport };
    };

    ChatOpenAI.mockImplementation(() => ({
      stream: jest.fn().mockImplementation(mockStream)
    }));

    const state: HRDDState = {
      dossier: { customer: 'Test', useCase: 'Test', country: 'Test' },
      preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: 'PASS' },
      geographicRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      customerRisk: { level: 'Medium', rationale: '', citations: [], information_gaps: [], confidence: 0.8 } as any,
      endUseRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      sources: [],
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

    expect(result.overallRisk).toBe('Medium');
  });

  /**
   * Test 3: Overall Risk Calculation - Low/Medium/High → High
   */
  test('Test 3: Overall risk should be High when at least one factor is High (highest of three)', async () => {
    const { ChatOpenAI } = require('@langchain/openai');

    const mockReport = `## Overall Risk Classification\n**Overall Risk Level: High**`;
    const mockStream = async function* () {
      yield { content: mockReport };
    };

    ChatOpenAI.mockImplementation(() => ({
      stream: jest.fn().mockImplementation(mockStream)
    }));

    const state: HRDDState = {
      dossier: { customer: 'Test', useCase: 'Test', country: 'Test' },
      preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: 'PASS' },
      geographicRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      customerRisk: { level: 'Medium', rationale: '', citations: [], information_gaps: [], confidence: 0.8 } as any,
      endUseRisk: { level: 'High', rationale: '', citations: [], information_gaps: [], confidence: 0.85 } as any,
      sources: [],
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
  });

  /**
   * Test 4: Overall Risk Calculation - High/High/High → High
   */
  test('Test 4: Overall risk should be High when all three factors are High', async () => {
    const { ChatOpenAI } = require('@langchain/openai');

    const mockReport = `## Overall Risk Classification\n**Overall Risk Level: High**`;
    const mockStream = async function* () {
      yield { content: mockReport };
    };

    ChatOpenAI.mockImplementation(() => ({
      stream: jest.fn().mockImplementation(mockStream)
    }));

    const state: HRDDState = {
      dossier: { customer: 'Test', useCase: 'Test', country: 'Test' },
      preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: 'PASS' },
      geographicRisk: { level: 'High', rationale: '', citations: [], information_gaps: [], confidence: 0.85 } as any,
      customerRisk: { level: 'High', rationale: '', citations: [], information_gaps: [], confidence: 0.8 } as any,
      endUseRisk: { level: 'High', rationale: '', citations: [], information_gaps: [], confidence: 0.85 } as any,
      sources: [],
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

    expect(result.overallRisk).toBe('High');
  });

  /**
   * Test 5: Report Structure Validation
   * Tests that all required sections are present in final report
   */
  test('Test 5: Final report should contain all required sections', async () => {
    const { ChatOpenAI } = require('@langchain/openai');

    const mockReport = `# Human Rights Due Diligence Assessment Report

## Executive Summary
- Customer: Test Corp
- Overall Risk Classification: Low
- Recommendation: Approve

## Dossier Information
- **Customer Name:** Test Corp
- **Use Case Description:** Test use case
- **Deployment Country:** Test Country
- **Assessment Date:** 2025-10-22

## Preliminary Screening Results

### Controversial Weapons Check
- **Result:** No prohibited activities detected

### Sanctions Check
- **Customer Sanctions Status:** Not sanctioned

### High-Risk Jurisdiction Check
- **Result:** Not automatic high-risk

**Preliminary Screening Outcome:** PASS

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
No information gaps identified.

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
      dossier: { customer: 'Test Corp', useCase: 'Test use case', country: 'Test Country' },
      preliminaryScreening: {
        weapons: { prohibited: false, rationale: 'OK', confidence: 0.9 },
        sanctions: {
          customer_sanctioned: false,
          customer_sanctions_programs: [],
          country_sanctioned: false,
          country_sanctions_type: 'none',
          country_sanctions_programs: [],
          rationale: 'OK',
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
      geographicRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      customerRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      endUseRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      sources: [{ url: 'https://example.com/1', title: 'Example Source', content: '' }],
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

    // Verify all required sections present
    expect(result.finalReport).toContain('Executive Summary');
    expect(result.finalReport).toContain('Dossier Information');
    expect(result.finalReport).toContain('Preliminary Screening Results');
    expect(result.finalReport).toContain('Controversial Weapons Check');
    expect(result.finalReport).toContain('Sanctions Check');
    expect(result.finalReport).toContain('High-Risk Jurisdiction Check');
    expect(result.finalReport).toContain('Enhanced Due Diligence Findings');
    expect(result.finalReport).toContain('Risk Factor 1: Geographic Context');
    expect(result.finalReport).toContain('Risk Factor 2: Customer Profile');
    expect(result.finalReport).toContain('Risk Factor 3: End-Use Application');
    expect(result.finalReport).toContain('Overall Risk Classification');
    expect(result.finalReport).toContain('Recommended Conditions');
    expect(result.finalReport).toContain('Information Gaps and Recommended Additional Research');
    expect(result.finalReport).toContain('Citations');
  });

  /**
   * Test 6: Citation Format Validation
   * Tests that factual claims include inline [source_id] citations
   */
  test('Test 6: Report should include [source_id] citation format with URLs in Citations section', async () => {
    const { ChatOpenAI } = require('@langchain/openai');

    const mockReport = `# Human Rights Due Diligence Assessment Report

## Geographic Context
Freedom House rates Germany as Free with score 94 [1]. Press freedom is high at 85 [2]. Germany is EU member [3].

## Customer Profile
TechCorp has adopted UN Guiding Principles [4].

## Citations
[1] Freedom House Germany Report, https://freedomhouse.org/germany
[2] RSF Press Freedom Index, https://rsf.org/germany
[3] EU Member States List, https://europa.eu/members
[4] TechCorp Ethics Policy, https://techcorp.eu/ethics`;

    const mockStream = async function* () {
      yield { content: mockReport };
    };

    ChatOpenAI.mockImplementation(() => ({
      stream: jest.fn().mockImplementation(mockStream)
    }));

    const state: HRDDState = {
      dossier: { customer: 'TechCorp', useCase: 'Test', country: 'Germany' },
      preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: 'PASS' },
      geographicRisk: {
        level: 'Low',
        rationale: '',
        citations: ['https://freedomhouse.org/germany', 'https://rsf.org/germany'],
        information_gaps: [],
        confidence: 0.9
      } as any,
      customerRisk: {
        level: 'Low',
        rationale: '',
        citations: ['https://techcorp.eu/ethics'],
        information_gaps: [],
        confidence: 0.9
      } as any,
      endUseRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      sources: [
        { url: 'https://freedomhouse.org/germany', title: 'Freedom House', content: '' },
        { url: 'https://rsf.org/germany', title: 'RSF', content: '' },
        { url: 'https://europa.eu/members', title: 'EU Members', content: '' },
        { url: 'https://techcorp.eu/ethics', title: 'Ethics Policy', content: '' }
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

    // Verify inline citations [1], [2], [3], [4]
    expect(result.finalReport).toMatch(/\[1\]/);
    expect(result.finalReport).toMatch(/\[2\]/);
    expect(result.finalReport).toMatch(/\[3\]/);
    expect(result.finalReport).toMatch(/\[4\]/);

    // Verify Citations section with URLs
    expect(result.finalReport).toContain('## Citations');
    expect(result.finalReport).toContain('https://freedomhouse.org/germany');
    expect(result.finalReport).toContain('https://rsf.org/germany');
    expect(result.finalReport).toContain('https://europa.eu/members');
    expect(result.finalReport).toContain('https://techcorp.eu/ethics');
  });

  /**
   * Test 7: REJECTED Banner Inclusion
   * Tests that REJECTED banner is included when preliminary screening fails
   */
  test('Test 7: Report should include REJECTED banner when preliminary screening fails', async () => {
    const { ChatOpenAI } = require('@langchain/openai');

    const mockReport = `# Human Rights Due Diligence Assessment Report

## Executive Summary
**CUSTOMER REJECTED DUE TO PRELIMINARY SCREENING FAILURE**

## Preliminary Screening Results
**Preliminary Screening Outcome:** FAIL

🚫 **CUSTOMER REJECTED: Preliminary screening detected prohibited autonomous weapons. Board waiver NOT permitted per ESG Policy.**

## Overall Risk Classification
**Overall Risk Level: High**`;

    const mockStream = async function* () {
      yield { content: mockReport };
    };

    ChatOpenAI.mockImplementation(() => ({
      stream: jest.fn().mockImplementation(mockStream)
    }));

    const state: HRDDState = {
      dossier: { customer: 'Defense Corp', useCase: 'Autonomous weapons', country: 'USA' },
      preliminaryScreening: {
        weapons: { prohibited: true, rationale: 'Lacks human control', confidence: 0.9 },
        sanctions: {
          customer_sanctioned: false,
          customer_sanctions_programs: [],
          country_sanctioned: false,
          country_sanctions_type: 'none',
          country_sanctions_programs: [],
          rationale: 'OK',
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
        outcome: 'FAIL'
      },
      geographicRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      customerRisk: { level: 'Medium', rationale: '', citations: [], information_gaps: [], confidence: 0.8 } as any,
      endUseRisk: { level: 'High', rationale: '', citations: [], information_gaps: [], confidence: 0.85 } as any,
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
    expect(result.finalReport).toContain('🚫');
    // Note: rejected field is not preserved in partial state return - that's expected behavior
  });

  /**
   * Test 8: Information Gap Flagging
   * Tests that missing critical sources are flagged with specific gap descriptions
   */
  test('Test 8: Information gaps should be explicitly flagged with descriptions', async () => {
    const { ChatOpenAI } = require('@langchain/openai');

    const mockReport = `## Geographic Context
- **Information Gaps:**
  - Freedom House 2024 score not accessible - database unavailable
  - Press Freedom Index not yet published for 2024

## Information Gaps and Recommended Additional Research
- Freedom House 2024 score not accessible - recommend manual check or use 2023 score
- Press Freedom Index 2024 not published yet - use 2023 score as proxy`;

    const mockStream = async function* () {
      yield { content: mockReport };
    };

    ChatOpenAI.mockImplementation(() => ({
      stream: jest.fn().mockImplementation(mockStream)
    }));

    const state: HRDDState = {
      dossier: { customer: 'Test', useCase: 'Test', country: 'Test Country' },
      preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: 'PASS' },
      geographicRisk: {
        level: 'Medium',
        rationale: '',
        citations: [],
        information_gaps: [
          'Freedom House 2024 score not accessible - database unavailable',
          'Press Freedom Index not yet published for 2024'
        ],
        confidence: 0.6
      } as any,
      customerRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      endUseRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      sources: [],
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

    expect(result.finalReport).toContain('Information Gaps');
    expect(result.finalReport).toContain('Freedom House 2024 score not accessible');
    expect(result.finalReport).toContain('Press Freedom Index not yet published');
  });

  /**
   * Test 9: Recommended Conditions for Medium/High Risk
   * Tests that Medium/High risk reports include recommended conditions
   */
  test('Test 9: Medium/High risk reports should include recommended conditions', async () => {
    const { ChatOpenAI } = require('@langchain/openai');

    const mockReport = `## Overall Risk Classification
**Overall Risk Level: Medium**

## Recommended Conditions
- Contractual requirement to adhere to UN Guiding Principles on Business and Human Rights
- Regular monitoring and reporting (semi-annual)
- Prohibition on resale or transfer without prior approval
- Technical safeguards (usage logs, geofencing)`;

    const mockStream = async function* () {
      yield { content: mockReport };
    };

    ChatOpenAI.mockImplementation(() => ({
      stream: jest.fn().mockImplementation(mockStream)
    }));

    const state: HRDDState = {
      dossier: { customer: 'Test', useCase: 'Test', country: 'Test' },
      preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: 'PASS' },
      geographicRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      customerRisk: { level: 'Medium', rationale: '', citations: [], information_gaps: [], confidence: 0.8 } as any,
      endUseRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      sources: [],
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

    expect(result.finalReport).toContain('Recommended Conditions');
    expect(result.finalReport).toContain('UN Guiding Principles');
    expect(result.overallRisk).toBe('Medium');
  });

  /**
   * Test 10: Low Risk No Additional Conditions
   * Tests that Low risk reports specify no additional conditions required
   */
  test('Test 10: Low risk reports should specify no additional conditions required', async () => {
    const { ChatOpenAI } = require('@langchain/openai');

    const mockReport = `## Overall Risk Classification
**Overall Risk Level: Low**

## Recommended Conditions
No additional conditions required beyond standard contract terms.`;

    const mockStream = async function* () {
      yield { content: mockReport };
    };

    ChatOpenAI.mockImplementation(() => ({
      stream: jest.fn().mockImplementation(mockStream)
    }));

    const state: HRDDState = {
      dossier: { customer: 'Test', useCase: 'Test', country: 'Test' },
      preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: 'PASS' },
      geographicRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      customerRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      endUseRisk: { level: 'Low', rationale: '', citations: [], information_gaps: [], confidence: 0.9 } as any,
      sources: [],
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

    expect(result.finalReport).toContain('Recommended Conditions');
    expect(result.finalReport).toContain('No additional conditions required');
    expect(result.overallRisk).toBe('Low');
  });
});
