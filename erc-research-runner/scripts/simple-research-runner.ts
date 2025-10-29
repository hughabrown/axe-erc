#!/usr/bin/env tsx
/**
 * Simple Research Runner
 *
 * Usage:
 *   npm run research -- research-configs/example-hrdd-report.yml
 *
 * This script:
 * 1. Reads your manually defined search queries from a YAML config
 * 2. Runs each query through Firecrawl search API
 * 3. Stores all results locally in JSON
 * 4. Generates a basic markdown report
 */

import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';
import { FirecrawlClient } from '../lib/firecrawl';

// Load environment variables from .env.local (in erc-research-runner root)
const envPath = path.join(__dirname, '..', '.env.local');
config({ path: envPath });

interface Query {
  id: string;
  query: string;
  limit: number;
  purpose: string;
}

interface Section {
  name: string;
  title: string;
  queries: Query[];
}

interface ResearchConfig {
  report: {
    title: string;
    customer: string;
    date: string;
  };
  sections: Section[];
  placeholders?: Record<string, string>;
}

interface SearchResult {
  url: string;
  title: string;
  description: string;
  markdown: string;
  metadata: any;
}

interface QueryResult {
  id: string;
  query: string;
  purpose: string;
  sources: SearchResult[];
  timestamp: string;
}

interface ResearchSession {
  config: ResearchConfig;
  sessionId: string;
  timestamp: string;
  results: Record<string, QueryResult[]>; // Organized by section name
}

async function loadConfig(configPath: string): Promise<ResearchConfig> {
  const content = await fs.readFile(configPath, 'utf-8');
  return yaml.load(content) as ResearchConfig;
}

function replacePlaceholders(text: string, placeholders?: Record<string, string>): string {
  if (!placeholders) return text;

  let result = text;
  for (const [key, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
  }
  return result;
}

async function runQuery(
  firecrawl: FirecrawlClient,
  query: Query,
  placeholders?: Record<string, string>
): Promise<QueryResult> {
  const actualQuery = replacePlaceholders(query.query, placeholders);

  console.log(`\n🔍 Running query: ${actualQuery}`);
  console.log(`   Purpose: ${query.purpose}`);
  console.log(`   Limit: ${query.limit} sources`);

  try {
    const result = await firecrawl.search(actualQuery, {
      limit: query.limit,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true
      }
    });

    console.log(`   ✅ Found ${result.data.length} sources`);

    return {
      id: query.id,
      query: actualQuery,
      purpose: query.purpose,
      sources: result.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    return {
      id: query.id,
      query: actualQuery,
      purpose: query.purpose,
      sources: [],
      timestamp: new Date().toISOString()
    };
  }
}

async function runResearch(configPath: string): Promise<ResearchSession> {
  console.log('🚀 Starting Simple Research Runner\n');

  // Load config
  console.log(`📄 Loading config: ${configPath}`);
  const config = await loadConfig(configPath);
  console.log(`   Report: ${config.report.title}`);
  console.log(`   Customer: ${config.report.customer}`);

  // Initialize Firecrawl
  const firecrawl = new FirecrawlClient();

  // Create session
  const sessionId = `research-${Date.now()}-${slugify(config.report.customer)}`;
  const results: Record<string, QueryResult[]> = {};

  // Run queries for each section
  for (const section of config.sections) {
    console.log(`\n📋 Section: ${section.title}`);
    console.log(`   Queries: ${section.queries.length}`);

    results[section.name] = [];

    for (const query of section.queries) {
      const result = await runQuery(firecrawl, query, config.placeholders);
      results[section.name].push(result);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const session: ResearchSession = {
    config,
    sessionId,
    timestamp: new Date().toISOString(),
    results
  };

  return session;
}

async function saveSession(session: ResearchSession): Promise<string> {
  const dir = path.join(__dirname, '..', 'data');
  await fs.mkdir(dir, { recursive: true });

  const filepath = path.join(dir, `${session.sessionId}.json`);
  await fs.writeFile(filepath, JSON.stringify(session, null, 2));

  console.log(`\n💾 Saved research data: ${filepath}`);
  return filepath;
}

async function generateReport(session: ResearchSession): Promise<string> {
  let report = `# ${session.config.report.title}\n\n`;
  report += `**Customer:** ${session.config.report.customer}\n\n`;
  report += `**Assessment Date:** ${session.config.report.date}\n\n`;
  report += `**Research Session ID:** ${session.sessionId}\n\n`;
  report += `---\n\n`;

  // Generate sections
  for (const section of session.config.sections) {
    const sectionResults = session.results[section.name] || [];

    report += `## ${section.title}\n\n`;

    for (const queryResult of sectionResults) {
      report += `### ${queryResult.purpose}\n\n`;
      report += `**Query:** \`${queryResult.query}\`\n\n`;

      if (queryResult.sources.length === 0) {
        report += `*No sources found*\n\n`;
        continue;
      }

      report += `**Sources found:** ${queryResult.sources.length}\n\n`;

      // List sources with key excerpts
      queryResult.sources.forEach((source, i) => {
        report += `${i + 1}. **[${source.title}](${source.url})**\n`;
        if (source.description) {
          report += `   - ${source.description}\n`;
        }

        // Add a brief excerpt (first 500 chars of markdown)
        const excerpt = source.markdown
          .substring(0, 500)
          .replace(/\n+/g, ' ')
          .trim();
        if (excerpt) {
          report += `   - *Excerpt:* ${excerpt}${source.markdown.length > 500 ? '...' : ''}\n`;
        }
        report += '\n';
      });

      report += '\n';
    }
  }

  // Appendix: All source content
  report += `---\n\n## Appendix: Full Source Content\n\n`;
  report += `*This section contains the complete extracted content from all sources for detailed review.*\n\n`;

  for (const section of session.config.sections) {
    const sectionResults = session.results[section.name] || [];

    report += `### ${section.title}\n\n`;

    for (const queryResult of sectionResults) {
      report += `#### ${queryResult.purpose}\n\n`;

      queryResult.sources.forEach((source, i) => {
        report += `##### Source ${i + 1}: ${source.title}\n\n`;
        report += `**URL:** ${source.url}\n\n`;
        report += `**Content:**\n\n`;
        report += source.markdown;
        report += '\n\n---\n\n';
      });
    }
  }

  return report;
}

async function saveReport(session: ResearchSession, report: string): Promise<string> {
  const dir = path.join(__dirname, '..', 'reports');
  await fs.mkdir(dir, { recursive: true });

  const filepath = path.join(dir, `${session.sessionId}.md`);
  await fs.writeFile(filepath, report);

  console.log(`📝 Saved report: ${filepath}`);
  return filepath;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

async function main() {
  const configPath = process.argv[2];

  if (!configPath) {
    console.error('❌ Error: Please provide a config file path');
    console.error('\nUsage:');
    console.error('  npm run research -- configs/example-hrdd-report.yml');
    console.error('\nOr from parent directory:');
    console.error('  npm run research -- erc-research-runner/configs/example-hrdd-report.yml');
    process.exit(1);
  }

  try {
    // Run research
    const session = await runResearch(configPath);

    // Save session data
    await saveSession(session);

    // Generate and save report
    console.log('\n📊 Generating report...');
    const report = await generateReport(session);
    const reportPath = await saveReport(session, report);

    // Summary
    const totalQueries = Object.values(session.results)
      .flat()
      .length;
    const totalSources = Object.values(session.results)
      .flat()
      .reduce((sum, r) => sum + r.sources.length, 0);

    console.log('\n✅ Research completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Total queries: ${totalQueries}`);
    console.log(`   - Total sources: ${totalSources}`);
    console.log(`   - Report: ${reportPath}`);
    console.log(`   - Raw data: ${path.join(__dirname, '..', 'data', `${session.sessionId}.json`)}`);

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
