/**
 * Audit Trail Export Module
 *
 * Provides structured export of HRDD assessment audit trails for regulatory review.
 * Captures all research queries, sources consulted, evidence extracted, and decisions.
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { AuditEntry } from '../hrdd/hrdd-state';

export interface AuditTrailExport {
  assessmentId: string;
  timestamp: string;
  dossier: {
    customer: string;
    useCase: string;
    country: string;
  };
  summary: {
    totalQueries: number;
    totalSources: number;
    totalDuration: number; // milliseconds
    overallRisk: 'Low' | 'Medium' | 'High' | null;
    rejected: boolean;
  };
  timeline: AuditEntry[];
  queries: {
    query: string;
    timestamp: number;
    phase: string;
    resultsCount: number;
  }[];
  sources: {
    url: string;
    title: string;
    timestamp: number;
    phase: string;
    scraped: boolean;
  }[];
  riskClassifications: {
    factor: string;
    level: 'Low' | 'Medium' | 'High';
    rationale: string;
    timestamp: number;
  }[];
  preliminaryScreening: {
    weapons: any;
    sanctions: any;
    jurisdiction: any;
    outcome: 'PASS' | 'FAIL' | null;
    timestamp: number;
  };
  metadata: {
    exportedAt: string;
    version: string;
    format: 'json' | 'csv';
  };
}

/**
 * Generate assessment ID from dossier and timestamp
 */
export function generateAssessmentId(dossier: { customer: string; country: string }): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const customer = dossier.customer.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const country = dossier.country.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  return `hrdd-${timestamp}-${customer}-${country}`;
}

/**
 * Export audit trail to JSON file
 */
export async function exportAuditTrailToFile(
  auditData: AuditTrailExport,
  outputDir: string = './audit-logs'
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });

    // Generate filename
    const filename = `${auditData.assessmentId}.json`;
    const filePath = join(outputDir, filename);

    // Write JSON file
    await writeFile(filePath, JSON.stringify(auditData, null, 2), 'utf-8');

    console.log(`[Audit Trail] Exported to: ${filePath}`);

    return { success: true, filePath };
  } catch (error) {
    console.error('[Audit Trail] Export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Export audit trail to CSV format
 */
export async function exportAuditTrailToCSV(
  auditData: AuditTrailExport,
  outputDir: string = './audit-logs'
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true });

    // Generate filename
    const filename = `${auditData.assessmentId}.csv`;
    const filePath = join(outputDir, filename);

    // Build CSV content
    const lines: string[] = [];

    // Header
    lines.push('# HRDD Assessment Audit Trail');
    lines.push(`# Assessment ID: ${auditData.assessmentId}`);
    lines.push(`# Customer: ${auditData.dossier.customer}`);
    lines.push(`# Country: ${auditData.dossier.country}`);
    lines.push(`# Overall Risk: ${auditData.summary.overallRisk || 'N/A'}`);
    lines.push(`# Rejected: ${auditData.summary.rejected}`);
    lines.push(`# Exported: ${auditData.metadata.exportedAt}`);
    lines.push('');

    // Queries section
    lines.push('## Queries Executed');
    lines.push('Timestamp,Phase,Query,Results Count');
    auditData.queries.forEach(q => {
      const timestamp = new Date(q.timestamp).toISOString();
      lines.push(`${timestamp},${q.phase},"${q.query}",${q.resultsCount}`);
    });
    lines.push('');

    // Sources section
    lines.push('## Sources Consulted');
    lines.push('Timestamp,Phase,URL,Title,Scraped');
    auditData.sources.forEach(s => {
      const timestamp = new Date(s.timestamp).toISOString();
      lines.push(`${timestamp},${s.phase},"${s.url}","${s.title}",${s.scraped}`);
    });
    lines.push('');

    // Risk classifications section
    lines.push('## Risk Classifications');
    lines.push('Timestamp,Factor,Level,Rationale');
    auditData.riskClassifications.forEach(r => {
      const timestamp = new Date(r.timestamp).toISOString();
      lines.push(`${timestamp},${r.factor},${r.level},"${r.rationale.replace(/"/g, '""')}"`);
    });
    lines.push('');

    // Timeline section
    lines.push('## Complete Timeline');
    lines.push('Timestamp,Event,Data');
    auditData.timeline.forEach(entry => {
      const timestamp = new Date(entry.timestamp).toISOString();
      const data = JSON.stringify(entry.data).replace(/"/g, '""');
      lines.push(`${timestamp},${entry.event},"${data}"`);
    });

    // Write CSV file
    await writeFile(filePath, lines.join('\n'), 'utf-8');

    console.log(`[Audit Trail] Exported CSV to: ${filePath}`);

    return { success: true, filePath };
  } catch (error) {
    console.error('[Audit Trail] CSV export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Build audit trail export from HRDD state
 */
export function buildAuditTrailExport(state: any): AuditTrailExport {
  const assessmentId = generateAssessmentId(state.dossier);
  const startTime = state.auditTrail.length > 0 ? state.auditTrail[0].timestamp : Date.now();
  const endTime = Date.now();

  // Extract queries from audit trail
  const queries = state.auditTrail
    .filter((e: AuditEntry) => e.event === 'query_executed')
    .map((e: AuditEntry) => ({
      query: e.data.query,
      timestamp: e.timestamp,
      phase: e.data.phase || 'unknown',
      resultsCount: e.data.resultsCount || 0
    }));

  // Extract sources from state
  const sources = state.sources.map((s: any, index: number) => ({
    url: s.url,
    title: s.title,
    timestamp: startTime + (index * 1000), // Approximate timestamps
    phase: 'search',
    scraped: !!s.content
  }));

  // Extract risk classifications from audit trail
  const riskClassifications = state.auditTrail
    .filter((e: AuditEntry) => e.event === 'risk_classification')
    .map((e: AuditEntry) => ({
      factor: e.data.factor,
      level: e.data.level,
      rationale: e.data.rationale,
      timestamp: e.timestamp
    }));

  return {
    assessmentId,
    timestamp: new Date().toISOString(),
    dossier: state.dossier,
    summary: {
      totalQueries: queries.length,
      totalSources: sources.length,
      totalDuration: endTime - startTime,
      overallRisk: state.overallRisk,
      rejected: state.rejected || false
    },
    timeline: state.auditTrail,
    queries,
    sources,
    riskClassifications,
    preliminaryScreening: {
      weapons: state.preliminaryScreening?.weapons || null,
      sanctions: state.preliminaryScreening?.sanctions || null,
      jurisdiction: state.preliminaryScreening?.jurisdiction || null,
      outcome: state.preliminaryScreening?.outcome || null,
      timestamp: startTime
    },
    metadata: {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      format: 'json'
    }
  };
}

/**
 * In-memory audit trail storage (for development)
 */
const auditTrailCache = new Map<string, AuditTrailExport>();

/**
 * Store audit trail in memory
 */
export function storeAuditTrail(auditData: AuditTrailExport): void {
  auditTrailCache.set(auditData.assessmentId, auditData);
  console.log(`[Audit Trail] Stored in memory: ${auditData.assessmentId}`);
}

/**
 * Retrieve audit trail from memory
 */
export function getAuditTrail(assessmentId: string): AuditTrailExport | null {
  return auditTrailCache.get(assessmentId) || null;
}

/**
 * List all audit trails in memory
 */
export function listAuditTrails(): AuditTrailExport[] {
  return Array.from(auditTrailCache.values());
}
