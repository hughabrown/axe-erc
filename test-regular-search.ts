/**
 * Test script for regular search functionality
 * Tests the multi-pass synthesis pipeline and file export
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { FirecrawlClient } from './lib/core/firecrawl';
import { LangGraphSearchEngine } from './lib/core/langgraph-search-engine';

async function testRegularSearch() {
  console.log('🧪 Testing Regular Search with Multi-Pass Synthesis\n');

  // Load API keys from .env.local file
  const envPath = join(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  const firecrawlKey = envContent.match(/FIRECRAWL_API_KEY=(.*)/)?.[1];
  const openaiKey = envContent.match(/OPENAI_API_KEY=(.*)/)?.[1];

  if (!firecrawlKey || !openaiKey) {
    console.error('❌ Missing API keys. Please check .env.local');
    process.exit(1);
  }

  // Set environment variables for OpenAI
  process.env.OPENAI_API_KEY = openaiKey;

  console.log('✅ API keys loaded');
  console.log('✅ Creating search engine...\n');

  // Create search engine
  const firecrawl = new FirecrawlClient(firecrawlKey);
  const searchEngine = new LangGraphSearchEngine(firecrawl);

  // Test query
  const query = 'What are the key features of Next.js 15?';

  console.log(`📝 Query: "${query}"`);
  console.log('⏳ Running search (this may take 30-60 seconds)...\n');

  let eventCount = 0;
  let phaseCount = 0;
  let sourcesFound = 0;

  try {
    // Run search with event callback
    await searchEngine.search(query, (event) => {
      eventCount++;

      if (event.type === 'phase-update') {
        phaseCount++;
        console.log(`\n📍 Phase ${phaseCount}: ${event.phase} - ${event.message}`);
      } else if (event.type === 'thinking') {
        console.log(`\n💭 Thinking: ${event.message}\n`);
      } else if (event.type === 'found') {
        sourcesFound += event.sources.length;
        console.log(`   └─ Found ${event.sources.length} sources (total: ${sourcesFound})`);
      } else if (event.type === 'multi-pass-phase') {
        console.log(`   ├─ Multi-Pass Synthesis: Pass ${event.pass} - ${event.message}`);
      } else if (event.type === 'outline-generated') {
        console.log(`   ├─ Outline generated: ${event.outline.sections.length} sections`);
      } else if (event.type === 'deep-dive-section') {
        console.log(`   ├─ Deep dive: ${event.sectionName} (${event.sourcesUsed} sources)`);
      } else if (event.type === 'citation-stats') {
        console.log(`   └─ Citations: ${event.total} total, ${(event.coverage * 100).toFixed(1)}% coverage`);
      }
    });

    console.log('\n✅ Search completed successfully!');
    console.log(`\n📊 Statistics:`);
    console.log(`   - Total events: ${eventCount}`);
    console.log(`   - Phases: ${phaseCount}`);
    console.log(`   - Sources found: ${sourcesFound}`);

    console.log('\n📁 Checking for exported files...');
    const fs = await import('fs');
    const path = await import('path');

    const searchResultsDir = path.join(process.cwd(), 'search-results');
    if (fs.existsSync(searchResultsDir)) {
      const files = fs.readdirSync(searchResultsDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse();

      if (files.length > 0) {
        console.log(`✅ Found ${files.length} search result file(s):`);
        files.forEach(f => console.log(`   - ${f}`));

        // Show details of most recent file
        const latestFile = path.join(searchResultsDir, files[0]);
        const stats = fs.statSync(latestFile);
        const content = JSON.parse(fs.readFileSync(latestFile, 'utf-8'));

        console.log(`\n📄 Latest file details (${files[0]}):`);
        console.log(`   - Size: ${(stats.size / 1024).toFixed(1)} KB`);
        console.log(`   - Query: "${content.query}"`);
        console.log(`   - Sources: ${content.stats.totalSources}`);
        console.log(`   - Citations: ${content.stats.uniqueCitations}`);
        console.log(`   - Coverage: ${(content.stats.citationCoverage * 100).toFixed(1)}%`);
        console.log(`   - Report length: ${content.stats.reportLength} words`);
      } else {
        console.log('⚠️  No search result files found in search-results/');
      }
    } else {
      console.log('⚠️  search-results/ directory does not exist');
    }

  } catch (error) {
    console.error('\n❌ Search failed:', error);
    process.exit(1);
  }
}

// Run the test
testRegularSearch().catch(console.error);
