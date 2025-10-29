/**
 * HRDD Preliminary Screening Tests
 *
 * Focused tests for preliminary screening logic with mocked dependencies.
 */

import { HRDDState } from '../../hrdd/hrdd-state';
import {
  controversialWeaponsCheck,
  sanctionsCheck,
  highRiskJurisdictionCheck
} from '../../hrdd/hrdd-preliminary-screening';

// Mock ChatOpenAI
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn()
  }))
}));

// Mock FirecrawlClient
const mockFirecrawl = {
  search: jest.fn()
};

describe('Preliminary Screening', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  describe('controversialWeaponsCheck', () => {
    test('should detect prohibited weapons and mark as rejected', async () => {
      const { ChatOpenAI } = require('@langchain/openai');
      const mockInvoke = jest.fn().mockResolvedValue({
        content: JSON.stringify({
          nuclear_chemical_biological: { prohibited: false, rationale: 'No evidence', confidence: 0.9 },
          cluster_munitions_mines: { prohibited: false, rationale: 'No evidence', confidence: 0.9 },
          autonomous_weapons: { prohibited: true, rationale: 'Lacks meaningful human control', confidence: 0.8 },
          overall_prohibited: true,
          summary: 'System lacks meaningful human control over target selection'
        })
      });

      ChatOpenAI.mockImplementation(() => ({
        invoke: mockInvoke
      }));

      const state: HRDDState = {
        dossier: {
          customer: 'Defense Corp',
          useCase: 'Autonomous targeting system without human control',
          country: 'USA'
        },
        preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: null },
        geographicRisk: null,
        customerRisk: null,
        endUseRisk: null,
        sources: [],
        queries: [],
        finalReport: null,
        overallRisk: null,
        auditTrail: [],
        rejected: false,
        currentPhase: 'preliminary-screening',
        error: null,
        errorType: null
      };

      const result = await controversialWeaponsCheck(state);

      expect(result.preliminaryScreening?.weapons?.prohibited).toBe(true);
      expect(result.rejected).toBe(true);
      expect(result.preliminaryScreening?.weapons?.autonomous_weapons?.prohibited).toBe(true);
    });

    test('should pass when no prohibited weapons detected', async () => {
      const { ChatOpenAI } = require('@langchain/openai');
      const mockInvoke = jest.fn().mockResolvedValue({
        content: JSON.stringify({
          nuclear_chemical_biological: { prohibited: false, rationale: 'Training application', confidence: 0.9 },
          cluster_munitions_mines: { prohibited: false, rationale: 'Training application', confidence: 0.9 },
          autonomous_weapons: { prohibited: false, rationale: 'High human control', confidence: 0.9 },
          overall_prohibited: false,
          summary: 'No prohibited weapons involvement detected'
        })
      });

      ChatOpenAI.mockImplementation(() => ({
        invoke: mockInvoke
      }));

      const state: HRDDState = {
        dossier: {
          customer: 'Tech Corp',
          useCase: 'AI-powered training simulator for medics',
          country: 'Germany'
        },
        preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: null },
        geographicRisk: null,
        customerRisk: null,
        endUseRisk: null,
        sources: [],
        queries: [],
        finalReport: null,
        overallRisk: null,
        auditTrail: [],
        rejected: false,
        currentPhase: 'preliminary-screening',
        error: null,
        errorType: null
      };

      const result = await controversialWeaponsCheck(state);

      expect(result.preliminaryScreening?.weapons?.prohibited).toBe(false);
      expect(result.rejected).toBe(false);
    });
  });

  describe('sanctionsCheck', () => {
    test('should detect sanctioned customer and mark as rejected', async () => {
      const { ChatOpenAI } = require('@langchain/openai');
      mockFirecrawl.search.mockResolvedValue({
        data: [
          {
            url: 'https://treasury.gov/ofac/sanctions/list',
            title: 'OFAC Sanctions List',
            markdown: 'Sanctioned Entity XYZ appears on OFAC sanctions list for violations of international law.'
          }
        ]
      });

      const mockInvoke = jest.fn().mockResolvedValue({
        content: JSON.stringify({
          customer_sanctioned: true,
          customer_sanctions_programs: ['OFAC Sanctions Program A'],
          country_sanctioned: false,
          country_sanctions_type: 'none',
          country_sanctions_programs: [],
          rationale: 'Customer found on OFAC sanctions list [1]',
          information_gaps: [],
          confidence: 0.9
        })
      });

      ChatOpenAI.mockImplementation(() => ({
        invoke: mockInvoke
      }));

      const state: HRDDState = {
        dossier: {
          customer: 'Sanctioned Entity XYZ',
          useCase: 'AI chip',
          country: 'Iran'
        },
        preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: null },
        geographicRisk: null,
        customerRisk: null,
        endUseRisk: null,
        sources: [],
        queries: [],
        finalReport: null,
        overallRisk: null,
        auditTrail: [],
        rejected: false,
        currentPhase: 'preliminary-screening',
        error: null,
        errorType: null
      };

      const result = await sanctionsCheck(state, {
        configurable: { firecrawl: mockFirecrawl as any }
      });

      expect(result.preliminaryScreening?.sanctions?.customer_sanctioned).toBe(true);
      expect(result.rejected).toBe(true);
    });
  });

  describe('highRiskJurisdictionCheck', () => {
    test('should detect high-risk jurisdiction and mark as rejected', async () => {
      const { ChatOpenAI } = require('@langchain/openai');
      mockFirecrawl.search.mockResolvedValue({
        data: [
          {
            url: 'https://ohchr.org/myanmar-investigation',
            title: 'UN Human Rights Council Myanmar Investigation',
            markdown: 'UN investigation found systematic violations of international humanitarian law in Myanmar.'
          }
        ]
      });

      const mockInvoke = jest.fn().mockResolvedValue({
        content: JSON.stringify({
          automatic_high_risk: true,
          un_bodies_accusations: [
            {
              body: 'UN Human Rights Council',
              accusation: 'Systematic violations of IHL',
              date: '2023',
              citation: '[1]'
            }
          ],
          international_court_cases: [],
          hr_organization_reports: [],
          rationale: 'UN Human Rights Council found systematic violations [1]',
          information_gaps: [],
          confidence: 0.9
        })
      });

      ChatOpenAI.mockImplementation(() => ({
        invoke: mockInvoke
      }));

      const state: HRDDState = {
        dossier: {
          customer: 'Local Company',
          useCase: 'Surveillance cameras',
          country: 'Myanmar'
        },
        preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: null },
        geographicRisk: null,
        customerRisk: null,
        endUseRisk: null,
        sources: [],
        queries: [],
        finalReport: null,
        overallRisk: null,
        auditTrail: [],
        rejected: false,
        currentPhase: 'preliminary-screening',
        error: null,
        errorType: null
      };

      const result = await highRiskJurisdictionCheck(state, {
        configurable: { firecrawl: mockFirecrawl as any }
      });

      expect(result.preliminaryScreening?.jurisdiction?.automatic_high_risk).toBe(true);
      expect(result.rejected).toBe(true);
      expect(result.preliminaryScreening?.outcome).toBe('FAIL');
    });

    test('should continue to Enhanced DD even if preliminary screening fails', async () => {
      // This test verifies workflow continues even when rejected=true
      const { ChatOpenAI } = require('@langchain/openai');
      mockFirecrawl.search.mockResolvedValue({ data: [] });

      const mockInvoke = jest.fn().mockResolvedValue({
        content: JSON.stringify({
          automatic_high_risk: false,
          un_bodies_accusations: [],
          international_court_cases: [],
          hr_organization_reports: [],
          rationale: 'No systematic violations found',
          information_gaps: [],
          confidence: 0.8
        })
      });

      ChatOpenAI.mockImplementation(() => ({
        invoke: mockInvoke
      }));

      const state: HRDDState = {
        dossier: {
          customer: 'Test Corp',
          useCase: 'Test use case',
          country: 'Test Country'
        },
        preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: null },
        geographicRisk: null,
        customerRisk: null,
        endUseRisk: null,
        sources: [],
        queries: [],
        finalReport: null,
        overallRisk: null,
        auditTrail: [],
        rejected: true,  // Already rejected from previous check
        currentPhase: 'preliminary-screening',
        error: null,
        errorType: null
      };

      const result = await highRiskJurisdictionCheck(state, {
        configurable: { firecrawl: mockFirecrawl as any }
      });

      // Should set outcome to FAIL but move to next phase (geographic-context)
      expect(result.preliminaryScreening?.outcome).toBe('FAIL');
      expect(result.currentPhase).toBe('geographic-context');  // Continues to Enhanced DD
    });
  });
});
