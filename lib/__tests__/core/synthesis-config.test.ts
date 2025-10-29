/**
 * Synthesis Configuration Tests
 *
 * Focused tests for SYNTHESIS_CONFIG validation.
 */

describe('SYNTHESIS_CONFIG', () => {
  test('should export valid configuration values', async () => {
    const { SYNTHESIS_CONFIG } = await import('../../core/config');

    // Test multi-pass control
    expect(typeof SYNTHESIS_CONFIG.ENABLE_MULTI_PASS).toBe('boolean');

    // Test context limits are within GPT-4o capacity (~512k chars)
    expect(SYNTHESIS_CONFIG.MAX_TOTAL_CHARS).toBeGreaterThan(0);
    expect(SYNTHESIS_CONFIG.MAX_TOTAL_CHARS).toBeLessThanOrEqual(512000);
    expect(SYNTHESIS_CONFIG.MAX_CHARS_PER_SOURCE).toBeGreaterThan(0);
    expect(SYNTHESIS_CONFIG.MIN_CHARS_PER_SOURCE).toBeGreaterThan(0);

    // Test pass configuration has positive values
    expect(SYNTHESIS_CONFIG.PASS_2_FULL_CONTENT_COUNT).toBeGreaterThan(0);
    expect(SYNTHESIS_CONFIG.PASS_3_CROSS_REF_COUNT).toBeGreaterThan(0);

    // Test quality requirements
    expect(SYNTHESIS_CONFIG.MIN_CITATIONS_PER_SECTION).toBeGreaterThan(0);
    expect(SYNTHESIS_CONFIG.MIN_TOTAL_CITATIONS).toBeGreaterThan(0);
    expect(SYNTHESIS_CONFIG.TARGET_REPORT_LENGTH).toBeGreaterThan(0);
  });

  test('should have valid model settings', async () => {
    const { SYNTHESIS_CONFIG } = await import('../../core/config');

    expect(typeof SYNTHESIS_CONFIG.OVERVIEW_MODEL).toBe('string');
    expect(SYNTHESIS_CONFIG.OVERVIEW_MODEL.length).toBeGreaterThan(0);
    expect(typeof SYNTHESIS_CONFIG.DEEPDIVE_MODEL).toBe('string');
    expect(SYNTHESIS_CONFIG.DEEPDIVE_MODEL.length).toBeGreaterThan(0);
  });

  test('should have feature flags as booleans', async () => {
    const { SYNTHESIS_CONFIG } = await import('../../core/config');

    expect(typeof SYNTHESIS_CONFIG.ENABLE_CROSS_REFERENCE).toBe('boolean');
    expect(typeof SYNTHESIS_CONFIG.ENABLE_FACT_CHECKING).toBe('boolean');
    expect(typeof SYNTHESIS_CONFIG.ENABLE_CONFLICT_DETECTION).toBe('boolean');
  });

  test('should have confidence threshold in valid range', async () => {
    const { SYNTHESIS_CONFIG } = await import('../../core/config');

    expect(SYNTHESIS_CONFIG.CONFIDENCE_THRESHOLD).toBeGreaterThanOrEqual(0);
    expect(SYNTHESIS_CONFIG.CONFIDENCE_THRESHOLD).toBeLessThanOrEqual(1);
  });
});
