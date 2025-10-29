#!/usr/bin/env tsx
/**
 * Template Report Generator
 *
 * Usage:
 *   npm run generate-report -- research-data/research-123.json report-templates/hrdd-assessment-template.md
 *
 * This script:
 * 1. Loads saved research data
 * 2. Loads a report template with placeholders
 * 3. Fills in the template with research findings
 * 4. Generates a formatted report
 */

import fs from 'fs/promises';
import path from 'path';

interface SearchResult {
  url: string;
  title: string;
  description: string;
  markdown: string;
}

interface QueryResult {
  id: string;
  query: string;
  purpose: string;
  sources: SearchResult[];
}

interface ResearchSession {
  config: any;
  sessionId: string;
  timestamp: string;
  results: Record<string, QueryResult[]>;
}

async function loadSession(sessionPath: string): Promise<ResearchSession> {
  const content = await fs.readFile(sessionPath, 'utf-8');
  return JSON.parse(content);
}

async function loadTemplate(templatePath: string): Promise<string> {
  return await fs.readFile(templatePath, 'utf-8');
}

function formatSection(queryResult: QueryResult, includeFullContent: boolean = false): string {
  if (queryResult.sources.length === 0) {
    return `*No sources found for: ${queryResult.purpose}*\n\n`;
  }

  let output = `**${queryResult.purpose}**\n\n`;
  output += `*Query: "${queryResult.query}"*\n\n`;

  queryResult.sources.forEach((source, i) => {
    output += `${i + 1}. **[${source.title}](${source.url})**\n`;

    if (source.description) {
      output += `   ${source.description}\n\n`;
    }

    if (includeFullContent) {
      // Include first 1000 chars of content
      const excerpt = source.markdown.substring(0, 1000);
      output += `   \`\`\`\n   ${excerpt}${source.markdown.length > 1000 ? '...' : ''}\n   \`\`\`\n\n`;
    }
  });

  output += '\n';
  return output;
}

function processTemplate(template: string, session: ResearchSession, variables: Record<string, string>): string {
  let output = template;

  // Replace simple variables {{VAR_NAME}}
  for (const [key, value] of Object.entries(variables)) {
    output = output.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  // Replace section placeholders {{SECTION:section_name:query_id}}
  const sectionPattern = /{{SECTION:([^:]+):([^}]+)}}/g;
  output = output.replace(sectionPattern, (match, sectionName, queryId) => {
    const sectionResults = session.results[sectionName];
    if (!sectionResults) {
      return `*Section "${sectionName}" not found*`;
    }

    const queryResult = sectionResults.find(r => r.id === queryId);
    if (!queryResult) {
      return `*Query "${queryId}" not found in section "${sectionName}"*`;
    }

    return formatSection(queryResult, false);
  });

  // Replace {{ALL_SOURCES}} with complete bibliography
  const allSources = Object.values(session.results)
    .flat()
    .flatMap(qr => qr.sources);

  const uniqueSources = Array.from(
    new Map(allSources.map(s => [s.url, s])).values()
  );

  let bibliography = '';
  uniqueSources.forEach((source, i) => {
    bibliography += `${i + 1}. [${source.title}](${source.url})\n`;
  });

  output = output.replace(/{{ALL_SOURCES}}/g, bibliography);

  return output;
}

async function saveReport(reportContent: string, outputPath: string): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, reportContent);
}

async function main() {
  const sessionPath = process.argv[2];
  const templatePath = process.argv[3];

  if (!sessionPath || !templatePath) {
    console.error('❌ Error: Please provide session and template paths');
    console.error('\nUsage:');
    console.error('  npm run generate-report -- erc-research-runner/data/research-123.json erc-research-runner/templates/hrdd-template.md');
    console.error('\nExample:');
    console.error('  npm run generate-report -- erc-research-runner/data/research-1730049600000-example-corporation.json erc-research-runner/templates/hrdd-assessment-template.md');
    process.exit(1);
  }

  try {
    console.log('📄 Loading research data...');
    const session = await loadSession(sessionPath);
    console.log(`   Session ID: ${session.sessionId}`);
    console.log(`   Customer: ${session.config.report.customer}`);

    console.log('\n📝 Loading template...');
    const template = await loadTemplate(templatePath);
    console.log(`   Template: ${path.basename(templatePath)}`);

    console.log('\n🔧 Processing template...');

    // You can manually edit these variables or load from a separate file
    const variables: Record<string, string> = {
      REPORT_TITLE: session.config.report.title,
      CUSTOMER_NAME: session.config.report.customer,
      ASSESSMENT_DATE: session.config.report.date,
      ASSESSOR: 'Research Team',
      SESSION_ID: session.sessionId,
      GENERATION_DATE: new Date().toISOString(),

      // These need to be filled manually or by additional analysis
      DEPLOYMENT_COUNTRY: session.config.placeholders?.COUNTRY || 'TBD',
      CUSTOMER_DOMICILE: 'TBD',
      CUSTOMER_TRACK_RECORD: 'TBD - Review governance sources',
      APPLICATION_RISK: 'TBD - Review application sources',
      RISK_CLASSIFICATION: '⚠️ TBD',
      RECOMMENDATION: 'TBD - Complete analysis',

      GEO_RISK_CLASSIFICATION: '⚠️ TBD',
      GEO_RISK_RATIONALE: 'TBD - Review geographic context sources',

      CUSTOMER_RISK_CLASSIFICATION: '⚠️ TBD',
      CUSTOMER_RISK_RATIONALE: 'TBD - Review customer profile sources',

      APPLICATION_RISK_CLASSIFICATION: '⚠️ TBD',
      APPLICATION_RISK_RATIONALE: 'TBD - Review application sources',

      FINAL_RISK_CLASSIFICATION: '⚠️ TBD',
      FINAL_RECOMMENDATION: 'TBD - Complete all sections',
      CONDITIONS: 'TBD - Define safeguards based on risk level'
    };

    const report = processTemplate(template, session, variables);

    console.log('\n💾 Saving report...');
    const outputPath = path.join(
      process.cwd(),
      'erc-research-runner/reports',
      `${session.sessionId}-templated.md`
    );
    await saveReport(report, outputPath);

    console.log(`\n✅ Report generated successfully!`);
    console.log(`   Output: ${outputPath}`);
    console.log(`\n⚠️  Note: Some placeholders (marked as "TBD") need manual completion.`);
    console.log(`   Review the report and fill in the assessment conclusions.`);

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
