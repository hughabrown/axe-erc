/**
 * HRDD Configuration Tests
 *
 * Focused tests for HRDD configuration loading and validation.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('HRDD Configuration', () => {
  describe('hrdd-sources.json', () => {
    test('should load and parse correctly', () => {
      const sourcesPath = path.join(process.cwd(), 'lib', 'hrdd', 'hrdd-sources.json');
      const sourcesContent = fs.readFileSync(sourcesPath, 'utf-8');
      const sources = JSON.parse(sourcesContent);

      expect(typeof sources).toBe('object');
      expect(sources).not.toBeNull();
    });

    test('should have all required domains', () => {
      const sourcesPath = path.join(process.cwd(), 'lib', 'hrdd', 'hrdd-sources.json');
      const sourcesContent = fs.readFileSync(sourcesPath, 'utf-8');
      const sources = JSON.parse(sourcesContent);

      const requiredDomains = ['geographic_context', 'customer_profile', 'end_use_application'];

      requiredDomains.forEach(domain => {
        expect(sources[domain]).toBeDefined();
        expect(Array.isArray(sources[domain])).toBe(true);
        expect(sources[domain].length).toBeGreaterThan(0);
      });
    });
  });

  describe('HRDD_MODEL_CONFIG', () => {
    test('should export correct values', async () => {
      const { HRDD_MODEL_CONFIG } = await import('../../hrdd/hrdd-config');

      expect(HRDD_MODEL_CONFIG.MODEL).toBe('gpt-4o');
      expect(HRDD_MODEL_CONFIG.TEMPERATURE).toBe(0);
      expect(HRDD_MODEL_CONFIG.MAX_TOKENS).toBe(4096);
    });
  });

  describe('Prompt Templates', () => {
    test('should all be defined and non-empty', async () => {
      const prompts = await import('../../hrdd/hrdd-prompts');

      const requiredPrompts = [
        'CONTROVERSIAL_WEAPONS_PROMPT',
        'SANCTIONS_CHECK_PROMPT',
        'HIGH_RISK_JURISDICTION_PROMPT',
        'GEOGRAPHIC_RISK_PROMPT',
        'CUSTOMER_RISK_PROMPT',
        'END_USE_RISK_PROMPT',
        'GEOGRAPHIC_QUERY_GENERATION_PROMPT',
        'CUSTOMER_QUERY_GENERATION_PROMPT',
        'END_USE_QUERY_GENERATION_PROMPT',
        'FINAL_REPORT_GENERATION_PROMPT'
      ];

      requiredPrompts.forEach(promptName => {
        const prompt = (prompts as any)[promptName];
        expect(typeof prompt).toBe('string');
        expect(prompt.length).toBeGreaterThan(0);
      });
    });
  });
});
