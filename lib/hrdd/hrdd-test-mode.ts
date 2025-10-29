/**
 * HRDD Test Mode
 *
 * Provides mock data for testing the HRDD UI without burning API credits.
 * Enable by setting NEXT_PUBLIC_HRDD_TEST_MODE=true in .env.local
 */

import { HRDDEvent } from './hrdd-workflow-engine';
import { Dossier } from './hrdd-state';

export const HRDD_TEST_MODE = process.env.NEXT_PUBLIC_HRDD_TEST_MODE === 'true';

/**
 * Mock HRDD assessment that simulates the workflow without API calls
 */
export async function runMockAssessment(
  dossier: Dossier,
  onEvent: (event: HRDDEvent) => void
): Promise<void> {
  // Simulate delays for realistic progress display
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Phase 1: Preliminary Screening
  onEvent({
    type: 'hrdd-phase',
    phase: 'preliminary-screening',
    message: 'Preliminary Screening'
  });
  await delay(500);

  // Individual checks within preliminary screening
  onEvent({
    type: 'searching',
    query: 'Controversial weapons check',
    index: 1,
    total: 3
  });
  await delay(800);

  onEvent({
    type: 'searching',
    query: 'Sanctions check',
    index: 2,
    total: 3
  });
  await delay(800);

  onEvent({
    type: 'searching',
    query: 'Credible accusations check',
    index: 3,
    total: 3
  });
  await delay(800);

  onEvent({
    type: 'preliminary-result',
    passed: true,
    details: {
      weapons: { prohibited: false, rationale: 'No prohibited weapons detected' },
      sanctions: { sanctioned: false, programs: [] },
      jurisdiction: { highRisk: false }
    }
  });
  await delay(500);

  // Phase 2: Geographic Context
  onEvent({
    type: 'hrdd-phase',
    phase: 'geographic-context',
    message: 'Assessing geographic context...'
  });
  await delay(800);

  onEvent({
    type: 'searching',
    query: `Freedom House score for ${dossier.country}`,
    index: 1,
    total: 3
  });
  await delay(1000);

  onEvent({
    type: 'found',
    sources: [
      {
        url: 'https://freedomhouse.org/country/example',
        title: `Freedom in ${dossier.country} Report`,
        content: `Mock Freedom House data for ${dossier.country}`
      }
    ],
    query: `Freedom House score for ${dossier.country}`
  });

  onEvent({
    type: 'risk-classification',
    factor: 'Geographic Context',
    level: 'Low',
    rationale: `${dossier.country} has strong democratic institutions and protections.`
  });
  await delay(500);

  // Phase 3: Customer Profile
  onEvent({
    type: 'hrdd-phase',
    phase: 'customer-profile',
    message: 'Assessing customer profile...'
  });
  await delay(800);

  onEvent({
    type: 'searching',
    query: `${dossier.customer} ethics policy`,
    index: 1,
    total: 3
  });
  await delay(1000);

  onEvent({
    type: 'found',
    sources: [
      {
        url: `https://example.com/${dossier.customer.toLowerCase().replace(/\s+/g, '-')}`,
        title: `${dossier.customer} - Corporate Ethics`,
        content: `Mock ethics policy data for ${dossier.customer}`
      }
    ],
    query: `${dossier.customer} ethics policy`
  });

  onEvent({
    type: 'risk-classification',
    factor: 'Customer Profile',
    level: 'Low',
    rationale: `${dossier.customer} demonstrates strong governance and compliance practices.`
  });
  await delay(500);

  // Phase 4: End-Use Assessment
  onEvent({
    type: 'hrdd-phase',
    phase: 'end-use-application',
    message: 'Assessing end-use application...'
  });
  await delay(800);

  onEvent({
    type: 'risk-classification',
    factor: 'End-Use Application',
    level: 'Low',
    rationale: 'Use case demonstrates high human control and low proximity to harm.'
  });
  await delay(500);

  // Phase 5: Report Synthesis
  onEvent({
    type: 'hrdd-phase',
    phase: 'synthesis',
    message: 'Synthesizing final report...'
  });
  await delay(1500);

  // Generate mock report
  const mockReport = `# Human Rights Due Diligence Assessment Report

## Executive Summary

- **Customer Name:** ${dossier.customer}
- **Deployment Country:** ${dossier.country}
- **Use Case:** ${dossier.useCase}
- **Overall Risk Classification:** **Low**
- **Recommendation:** Approve with standard contract terms

### Key Findings

- No prohibited weapons or controversial applications detected
- Customer demonstrates strong corporate governance
- Deployment country has robust human rights protections
- End-use application maintains meaningful human control

## Dossier Information

- **Customer Name:** ${dossier.customer}
- **Use Case Description:** ${dossier.useCase}
- **Deployment Country:** ${dossier.country}
- **Assessment Date:** ${new Date().toISOString().split('T')[0]}

## Preliminary Screening Results

### Controversial Weapons Check
- **Result:** No prohibited activities detected
- **Rationale:** Use case does not involve nuclear, chemical, biological weapons, cluster munitions, anti-personnel mines, or autonomous weapon systems without meaningful human control.

### Sanctions Check
- **Customer Sanctions Status:** Not sanctioned
- **Country Sanctions Status:** None
- **Rationale:** No sanctions found in OFAC, UN, or EU databases [1]

### High-Risk Jurisdiction Check
- **Result:** Not automatic high-risk
- **Rationale:** No systematic violations of IHL/HR reported by UN bodies or international courts

**Preliminary Screening Outcome:** PASS

## Enhanced Due Diligence Findings

### Risk Factor 1: Geographic Context
- **Risk Level:** Low
- **EU/NATO Member:** Yes
- **Freedom House Score:** 85 (Free)
- **Press Freedom Index:** 75
- **Key Findings:**
  - Strong democratic institutions and rule of law [2]
  - Robust human rights protections [3]
  - Active AI governance framework [4]
- **Rationale:** ${dossier.country} maintains high standards for freedom and human rights protection.

### Risk Factor 2: Customer Profile
- **Risk Level:** Low
- **UN Guiding Principles Adoption:** Yes
- **Corporate Governance:** Strong
- **Compliance Violations:** None
- **Key Findings:**
  - Published ethics and human rights policies [5]
  - Transparent corporate governance structure [6]
  - Regular ESG reporting [7]
- **Rationale:** ${dossier.customer} demonstrates commitment to ethical business practices and human rights.

### Risk Factor 3: End-Use Application
- **Risk Level:** Low
- **Human Control Level:** High
- **Proximity to Harm:** Low
- **Repurposing Ease:** Low
- **Key Findings:**
  - System maintains meaningful human control over all critical decisions [8]
  - Administrative/training application with minimal harm potential [9]
  - Specialized system design limits repurposing risk [10]
- **Rationale:** Use case presents minimal risk of misuse or harm.

## Overall Risk Classification

**Overall Risk Level: Low**

**Rationale:** The overall risk level is determined by the HIGHEST of the three risk factors:
- Geographic Context: Low
- Customer Profile: Low
- End-Use Application: Low

All three risk factors are classified as Low, resulting in an overall Low risk classification.

## Recommended Conditions

No additional conditions required beyond standard contract terms.

Standard terms should include:
- Compliance with UN Guiding Principles on Business and Human Rights
- Prohibition on unauthorized resale or transfer
- Notification of material changes to use case or deployment

## Information Gaps and Recommended Additional Research

- Freedom House 2024 score pending - used 2023 data
- Consider requesting technical documentation from Sales Team for detailed system architecture review

## Citations

[1] OFAC Sanctions List, treasury.gov/ofac, accessed ${new Date().toISOString().split('T')[0]}
[2] Freedom House Report, freedomhouse.org, accessed ${new Date().toISOString().split('T')[0]}
[3] Human Rights Watch Country Report, hrw.org, accessed ${new Date().toISOString().split('T')[0]}
[4] EU AI Act Documentation, europa.eu, accessed ${new Date().toISOString().split('T')[0]}
[5] ${dossier.customer} Ethics Policy, company-website.com, accessed ${new Date().toISOString().split('T')[0]}
[6] OpenCorporates Registry, opencorporates.com, accessed ${new Date().toISOString().split('T')[0]}
[7] ESG Reporting Database, sustainalytics.com, accessed ${new Date().toISOString().split('T')[0]}
[8] EU Autonomous Weapons Framework, europa.eu, accessed ${new Date().toISOString().split('T')[0]}
[9] Technical Documentation Review, internal-docs, accessed ${new Date().toISOString().split('T')[0]}
[10] Dual-Use Export Controls Analysis, wassenaar.org, accessed ${new Date().toISOString().split('T')[0]}

---

**Note:** This is a MOCK ASSESSMENT generated in test mode. For production use, disable HRDD_TEST_MODE.`;

  // Generate assessment ID
  const { generateAssessmentId } = await import('../export/audit-trail-export');
  const assessmentId = generateAssessmentId(dossier);

  // Send final result
  onEvent({
    type: 'final-result',
    content: mockReport,
    sources: [
      { url: 'https://freedomhouse.org/country/example', title: `Freedom in ${dossier.country} Report` },
      { url: 'https://hrw.org/example', title: 'Human Rights Watch Country Report' },
      { url: 'https://europa.eu/ai-act', title: 'EU AI Act Documentation' },
      { url: 'https://treasury.gov/ofac', title: 'OFAC Sanctions List' },
      { url: 'https://opencorporates.com/example', title: 'Corporate Registry' }
    ],
    assessmentId
  });

  // Store and export mock audit trail in test mode
  try {
    const { storeAuditTrail, exportAuditTrailToFile } = await import('../export/audit-trail-export');
    const mockAuditTrail = {
      assessmentId,
      timestamp: new Date().toISOString(),
      dossier,
      summary: {
        totalQueries: 6,
        totalSources: 5,
        totalDuration: 5000,
        overallRisk: 'Low' as const,
        rejected: false
      },
      timeline: [],
      queries: [
        { query: 'Freedom House score', timestamp: Date.now(), phase: 'geographic', resultsCount: 1 },
        { query: 'UN reports', timestamp: Date.now(), phase: 'geographic', resultsCount: 1 },
        { query: 'Ethics policy', timestamp: Date.now(), phase: 'customer', resultsCount: 1 },
        { query: 'OFAC sanctions', timestamp: Date.now(), phase: 'preliminary', resultsCount: 0 },
        { query: 'Autonomous weapons', timestamp: Date.now(), phase: 'end-use', resultsCount: 1 },
        { query: 'Dual-use controls', timestamp: Date.now(), phase: 'end-use', resultsCount: 1 }
      ],
      sources: [
        { url: 'https://freedomhouse.org/country/example', title: `Freedom in ${dossier.country} Report`, timestamp: Date.now(), phase: 'geographic', scraped: true },
        { url: 'https://hrw.org/example', title: 'Human Rights Watch Report', timestamp: Date.now(), phase: 'geographic', scraped: true },
        { url: 'https://europa.eu/ai-act', title: 'EU AI Act', timestamp: Date.now(), phase: 'end-use', scraped: true },
        { url: 'https://treasury.gov/ofac', title: 'OFAC Sanctions', timestamp: Date.now(), phase: 'preliminary', scraped: true },
        { url: 'https://opencorporates.com/example', title: 'Corporate Registry', timestamp: Date.now(), phase: 'customer', scraped: true }
      ],
      riskClassifications: [
        { factor: 'Geographic Context', level: 'Low' as const, rationale: 'Strong democratic institutions', timestamp: Date.now() },
        { factor: 'Customer Profile', level: 'Low' as const, rationale: 'Good governance practices', timestamp: Date.now() },
        { factor: 'End-Use Application', level: 'Low' as const, rationale: 'High human control', timestamp: Date.now() }
      ],
      preliminaryScreening: {
        weapons: { prohibited: false, rationale: 'No prohibited weapons' },
        sanctions: { sanctioned: false, programs: [] },
        jurisdiction: { highRisk: false },
        outcome: 'PASS' as const,
        timestamp: Date.now()
      },
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        format: 'json' as const
      }
    };
    storeAuditTrail(mockAuditTrail);

    // Also export to file for persistence
    const exportResult = await exportAuditTrailToFile(mockAuditTrail);
    if (exportResult.success) {
      console.log(`[Test Mode] Audit trail exported: ${exportResult.filePath}`);
    } else {
      console.error(`[Test Mode] Export failed: ${exportResult.error}`);
    }
  } catch (error) {
    console.error('[Test Mode] Failed to store/export mock audit trail:', error);
  }
}

/**
 * Check if test mode is enabled
 */
export function isTestMode(): boolean {
  return HRDD_TEST_MODE;
}

/**
 * Get test mode indicator message
 */
export function getTestModeMessage(): string {
  return '⚠️ TEST MODE: Using mock data. No API calls will be made.';
}
