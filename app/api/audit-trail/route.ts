/**
 * Audit Trail API Endpoint
 *
 * GET /api/audit-trail - List all audit trails
 * GET /api/audit-trail?id={assessmentId} - Get specific audit trail
 * GET /api/audit-trail?id={assessmentId}&format=csv - Export as CSV
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuditTrail, listAuditTrails } from '@/lib/export/audit-trail-export';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const assessmentId = searchParams.get('id');
  const format = searchParams.get('format') || 'json';

  try {
    // List all audit trails
    if (!assessmentId) {
      // Try memory first
      let trails = listAuditTrails();

      // Fallback to reading from files
      if (trails.length === 0) {
        try {
          const auditLogsDir = join(process.cwd(), 'audit-logs');
          const files = await readdir(auditLogsDir);
          const jsonFiles = files.filter(f => f.endsWith('.json'));

          trails = await Promise.all(
            jsonFiles.map(async (file) => {
              const content = await readFile(join(auditLogsDir, file), 'utf-8');
              return JSON.parse(content);
            })
          );
        } catch (error) {
          // Directory doesn't exist or no files
        }
      }

      return NextResponse.json({
        success: true,
        count: trails.length,
        trails: trails.map(t => ({
          assessmentId: t.assessmentId,
          timestamp: t.timestamp,
          customer: t.dossier.customer,
          country: t.dossier.country,
          overallRisk: t.summary.overallRisk,
          rejected: t.summary.rejected
        }))
      });
    }

    // Get specific audit trail - try memory first, then file system
    let auditTrail = getAuditTrail(assessmentId);

    if (!auditTrail) {
      // Try reading from file
      try {
        const filePath = join(process.cwd(), 'audit-logs', `${assessmentId}.json`);
        const content = await readFile(filePath, 'utf-8');
        auditTrail = JSON.parse(content);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Audit trail not found' },
          { status: 404 }
        );
      }
    }

    // Export as CSV
    if (format === 'csv') {
      const csvLines: string[] = [];

      // Header
      csvLines.push('# HRDD Assessment Audit Trail');
      csvLines.push(`# Assessment ID: ${auditTrail.assessmentId}`);
      csvLines.push(`# Customer: ${auditTrail.dossier.customer}`);
      csvLines.push(`# Country: ${auditTrail.dossier.country}`);
      csvLines.push(`# Overall Risk: ${auditTrail.summary.overallRisk || 'N/A'}`);
      csvLines.push(`# Rejected: ${auditTrail.summary.rejected}`);
      csvLines.push(`# Exported: ${auditTrail.metadata.exportedAt}`);
      csvLines.push('');

      // Queries
      csvLines.push('## Queries Executed');
      csvLines.push('Timestamp,Phase,Query,Results Count');
      auditTrail.queries.forEach(q => {
        const timestamp = new Date(q.timestamp).toISOString();
        csvLines.push(`${timestamp},${q.phase},"${q.query}",${q.resultsCount}`);
      });
      csvLines.push('');

      // Sources
      csvLines.push('## Sources Consulted');
      csvLines.push('Timestamp,Phase,URL,Title,Scraped');
      auditTrail.sources.forEach(s => {
        const timestamp = new Date(s.timestamp).toISOString();
        csvLines.push(`${timestamp},${s.phase},"${s.url}","${s.title}",${s.scraped}`);
      });
      csvLines.push('');

      // Risk Classifications
      csvLines.push('## Risk Classifications');
      csvLines.push('Timestamp,Factor,Level,Rationale');
      auditTrail.riskClassifications.forEach(r => {
        const timestamp = new Date(r.timestamp).toISOString();
        csvLines.push(`${timestamp},${r.factor},${r.level},"${r.rationale.replace(/"/g, '""')}"`);
      });
      csvLines.push('');

      // Timeline
      csvLines.push('## Complete Timeline');
      csvLines.push('Timestamp,Event,Data');
      auditTrail.timeline.forEach(entry => {
        const timestamp = new Date(entry.timestamp).toISOString();
        const data = JSON.stringify(entry.data).replace(/"/g, '""');
        csvLines.push(`${timestamp},${entry.event},"${data}"`);
      });

      const csvContent = csvLines.join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${auditTrail.assessmentId}.csv"`
        }
      });
    }

    // Return JSON
    return NextResponse.json({
      success: true,
      auditTrail
    });
  } catch (error) {
    console.error('[Audit Trail API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
