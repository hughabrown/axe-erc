/**
 * HRDD Risk Factor Assessment Tests
 *
 * Focused tests for risk factor assessment logic with mocked dependencies.
 */

import { HRDDState } from '../hrdd-state';
import {
  geographicContextAssessment,
  customerProfileAssessment,
  endUseAssessment
} from '../hrdd-risk-factors';

// Mock ChatOpenAI
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn()
  }))
}));

// Mock hrdd-sources.json
jest.mock('../../config/hrdd-sources.json', () => ({
  geographic_context: [
    { name: 'Freedom House', domain: 'freedomhouse.org', priority: 'critical' }
  ],
  customer_profile: [
    { name: 'OFAC', domain: 'treasury.gov', priority: 'critical' }
  ],
  end_use_application: [
    { name: 'EU Framework', domain: 'europa.eu', priority: 'high' }
  ]
}));

const mockFirecrawl = {
  search: jest.fn()
};

describe('Risk Factor Assessment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
  });

  describe('geographicContextAssessment', () => {
    test('should classify geographic risk as Low for EU member with high freedom scores', async () => {
      const { ChatOpenAI } = require('@langchain/openai');
      mockFirecrawl.search.mockResolvedValue({
        data: [
          {
            url: 'https://freedomhouse.org/germany',
            title: 'Germany Freedom Score',
            markdown: 'Germany scores 94/100 on Freedom House index, rated Free.'
          }
        ]
      });

      const mockInvoke = jest.fn()
        // First call: Query generation
        .mockResolvedValueOnce({
          content: JSON.stringify({
            site_specific_queries: [
              { query: 'site:freedomhouse.org Germany freedom score 2024' }
            ],
            broader_queries: [
              { query: 'Germany EU NATO member' }
            ]
          })
        })
        // Second call: Risk classification
        .mockResolvedValueOnce({
          content: JSON.stringify({
            risk_level: 'Low',
            eu_nato_member: true,
            freedom_house_score: 94,
            freedom_house_rating: 'Free',
            press_freedom_index_score: 85,
            un_investigations: [],
            governance_assessment: 'Stable democracy with strong institutions',
            ai_governance: 'Subject to EU AI Act',
            sanctions_status: 'none',
            rationale: 'Germany is EU/NATO member with Freedom House score >70 [1]',
            information_gaps: [],
            confidence: 0.95
          })
        });

      ChatOpenAI.mockImplementation(() => ({
        invoke: mockInvoke
      }));

      const state: HRDDState = {
        dossier: {
          customer: 'TechCorp EU',
          useCase: 'AI training simulator',
          country: 'Germany'
        },
        preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: 'PASS' },
        geographicRisk: null,
        customerRisk: null,
        endUseRisk: null,
        sources: [],
        queries: [],
        finalReport: null,
        overallRisk: null,
        auditTrail: [],
        rejected: false,
        currentPhase: 'geographic-context',
        error: null,
        errorType: null
      };

      const result = await geographicContextAssessment(state, {
        configurable: { firecrawl: mockFirecrawl as any }
      });

      expect(result.geographicRisk?.level).toBe('Low');
      expect(result.geographicRisk?.eu_nato_member).toBe(true);
      expect(result.geographicRisk?.freedom_house_score).toBe(94);
      expect(result.currentPhase).toBe('customer-profile');
    });

    test('should classify geographic risk as High for country with low freedom scores', async () => {
      const { ChatOpenAI } = require('@langchain/openai');
      mockFirecrawl.search.mockResolvedValue({
        data: [
          {
            url: 'https://freedomhouse.org/myanmar',
            title: 'Myanmar Freedom Score',
            markdown: 'Myanmar scores 9/100 on Freedom House index, rated Not Free.'
          }
        ]
      });

      const mockInvoke = jest.fn()
        .mockResolvedValueOnce({
          content: JSON.stringify({
            site_specific_queries: [{ query: 'site:freedomhouse.org Myanmar' }],
            broader_queries: []
          })
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            risk_level: 'High',
            eu_nato_member: false,
            freedom_house_score: 9,
            freedom_house_rating: 'Not Free',
            press_freedom_index_score: 25,
            un_investigations: ['UN HRC investigation 2023'],
            governance_assessment: 'Military junta with systematic rights violations',
            ai_governance: 'Limited AI governance',
            sanctions_status: 'targeted',
            rationale: 'Freedom House score <40 indicates high risk [1]',
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
          useCase: 'Surveillance',
          country: 'Myanmar'
        },
        preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: 'PASS' },
        geographicRisk: null,
        customerRisk: null,
        endUseRisk: null,
        sources: [],
        queries: [],
        finalReport: null,
        overallRisk: null,
        auditTrail: [],
        rejected: false,
        currentPhase: 'geographic-context',
        error: null,
        errorType: null
      };

      const result = await geographicContextAssessment(state, {
        configurable: { firecrawl: mockFirecrawl as any }
      });

      expect(result.geographicRisk?.level).toBe('High');
      expect(result.geographicRisk?.freedom_house_score).toBe(9);
    });
  });

  describe('customerProfileAssessment', () => {
    test('should classify customer risk based on ethics policies and compliance', async () => {
      const { ChatOpenAI } = require('@langchain/openai');
      mockFirecrawl.search.mockResolvedValue({ data: [] });

      const mockInvoke = jest.fn()
        .mockResolvedValueOnce({
          content: JSON.stringify({
            customer_website_queries: [{ query: 'site:techcorp.com ethics policy' }],
            site_specific_queries: [],
            adverse_media_queries: [],
            broader_queries: []
          })
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            risk_level: 'Low',
            ungp_adoption: true,
            ethics_policies_found: true,
            corporate_governance: 'Strong',
            compliance_violations: [],
            adverse_media_findings: [],
            ownership_transparency: 'Transparent',
            esg_reporting: true,
            rationale: 'Company has adopted UNGP and published ethics policies',
            information_gaps: [],
            confidence: 0.85
          })
        });

      ChatOpenAI.mockImplementation(() => ({
        invoke: mockInvoke
      }));

      const state: HRDDState = {
        dossier: {
          customer: 'TechCorp EU',
          useCase: 'Training',
          country: 'Germany'
        },
        preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: 'PASS' },
        geographicRisk: { level: 'Low' } as any,
        customerRisk: null,
        endUseRisk: null,
        sources: [],
        queries: [],
        finalReport: null,
        overallRisk: null,
        auditTrail: [],
        rejected: false,
        currentPhase: 'customer-profile',
        error: null,
        errorType: null
      };

      const result = await customerProfileAssessment(state, {
        configurable: { firecrawl: mockFirecrawl as any }
      });

      expect(result.customerRisk?.level).toBe('Low');
      expect(result.customerRisk?.ungp_adoption).toBe(true);
    });
  });

  describe('endUseAssessment', () => {
    test('should classify end-use risk based on human control and proximity to harm', async () => {
      const { ChatOpenAI } = require('@langchain/openai');
      mockFirecrawl.search.mockResolvedValue({ data: [] });

      const mockInvoke = jest.fn()
        .mockResolvedValueOnce({
          content: JSON.stringify({
            extracted_technical_terms: ['training simulator', 'medical education'],
            site_specific_queries: [],
            use_case_specific_queries: [{ query: 'training simulator military medical' }],
            broader_queries: []
          })
        })
        .mockResolvedValueOnce({
          content: JSON.stringify({
            risk_level: 'Low',
            human_control_level: 'High',
            human_control_rationale: 'Full human control over training scenarios',
            proximity_to_harm: 'Low',
            proximity_rationale: 'Administrative/training application, no weapons delivery',
            repurposing_ease: 'Low',
            repurposing_rationale: 'Specialized training hardware, difficult to adapt',
            autonomous_weapons_comparison: 'Does not approach autonomous weapons definition',
            dual_use_classification: 'Not subject to export controls',
            rationale: 'Training application with high human control and low harm proximity',
            information_gaps: [],
            confidence: 0.9
          })
        });

      ChatOpenAI.mockImplementation(() => ({
        invoke: mockInvoke
      }));

      const state: HRDDState = {
        dossier: {
          customer: 'TechCorp',
          useCase: 'AI-powered training simulator for medics',
          country: 'Germany'
        },
        preliminaryScreening: { weapons: null, sanctions: null, jurisdiction: null, outcome: 'PASS' },
        geographicRisk: { level: 'Low' } as any,
        customerRisk: { level: 'Low' } as any,
        endUseRisk: null,
        sources: [],
        queries: [],
        finalReport: null,
        overallRisk: null,
        auditTrail: [],
        rejected: false,
        currentPhase: 'end-use-application',
        error: null,
        errorType: null
      };

      const result = await endUseAssessment(state, {
        configurable: { firecrawl: mockFirecrawl as any }
      });

      expect(result.endUseRisk?.level).toBe('Low');
      expect(result.endUseRisk?.human_control_level).toBe('High');
      expect(result.endUseRisk?.proximity_to_harm).toBe('Low');
    });
  });
});
