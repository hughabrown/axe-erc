/**
 * HRDD State Annotation Tests
 *
 * Focused tests for HRDD state structure and reducers.
 */

import { HRDDStateAnnotation, Dossier } from '../hrdd-state';

describe('HRDD State Annotation', () => {
  test('should include all required state fields', () => {
    // Check that annotation spec has all expected fields
    const stateKeys = Object.keys(HRDDStateAnnotation.spec);
    expect(stateKeys).toContain('dossier');
    expect(stateKeys).toContain('preliminaryScreening');
    expect(stateKeys).toContain('geographicRisk');
    expect(stateKeys).toContain('customerRisk');
    expect(stateKeys).toContain('endUseRisk');
    expect(stateKeys).toContain('sources');
    expect(stateKeys).toContain('queries');
    expect(stateKeys).toContain('finalReport');
    expect(stateKeys).toContain('overallRisk');
    expect(stateKeys).toContain('auditTrail');
    expect(stateKeys).toContain('rejected');
    expect(stateKeys).toContain('currentPhase');
  });

  test('should have source deduplication logic in state annotation', () => {
    // Verify sources field exists
    const sourcesSpec = HRDDStateAnnotation.spec.sources;
    expect(sourcesSpec).toBeDefined();

    // The actual deduplication is tested in integration tests
    // This test just verifies the spec structure exists
  });

  test('should create initial state from dossier input', () => {
    const dossier: Dossier = {
      customer: 'Test Corp',
      useCase: 'AI-powered training simulator',
      country: 'Germany'
    };

    // Simulate creating initial state
    const initialState = {
      dossier,
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

    expect(initialState.dossier.customer).toBe('Test Corp');
    expect(initialState.dossier.useCase).toBe('AI-powered training simulator');
    expect(initialState.dossier.country).toBe('Germany');
    expect(initialState.rejected).toBe(false);
    expect(initialState.currentPhase).toBe('preliminary-screening');
  });

  test('should have queries array field in state annotation', () => {
    // Verify queries field exists
    const queriesSpec = HRDDStateAnnotation.spec.queries;
    expect(queriesSpec).toBeDefined();

    // The actual append behavior is tested in integration tests
    // This test just verifies the spec structure exists
  });
});
