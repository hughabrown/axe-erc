#!/usr/bin/env node

/**
 * HRDD Config Preview Tool
 *
 * Shows how variables will be substituted in your config file.
 *
 * Usage:
 *   node configs/preview-config.js configs/your-file.yml
 */

const fs = require('fs');
const yaml = require('yaml');

function previewConfig(filePath) {
  // Read the YAML file
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const config = yaml.parse(fileContent);

  // Check if variables section exists
  if (!config.variables) {
    console.error('❌ Error: No "variables" section found in config');
    console.log('\nYour config should have a "variables:" section at the top.');
    process.exit(1);
  }

  const variables = config.variables;

  // Check for unfilled variables
  const unfilledVars = [];
  for (const [key, value] of Object.entries(variables)) {
    if (typeof value === 'string' && value.startsWith('[e.g.,')) {
      unfilledVars.push(key);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 HRDD CONFIG PREVIEW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Show variables status
  console.log('📊 VARIABLES STATUS:\n');

  if (unfilledVars.length > 0) {
    console.log('⚠️  UNFILLED VARIABLES (still have placeholder text):');
    unfilledVars.forEach(key => {
      console.log(`   - ${key}: ${variables[key]}`);
    });
    console.log('\n✅ FILLED VARIABLES:');
    Object.entries(variables)
      .filter(([key]) => !unfilledVars.includes(key))
      .forEach(([key, value]) => {
        console.log(`   - ${key}: "${value}"`);
      });
  } else {
    console.log('✅ All variables filled!');
    Object.entries(variables).forEach(([key, value]) => {
      console.log(`   - ${key}: "${value}"`);
    });
  }

  // Substitute variables in text
  function substituteVariables(text) {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
    }
    return result;
  }

  // Show sample queries
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 QUERY PREVIEW (First 5 queries):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  let queryCount = 0;
  let totalQueries = 0;

  if (config.sections) {
    for (const section of config.sections) {
      if (section.queries) {
        totalQueries += section.queries.length;

        for (const query of section.queries) {
          if (queryCount < 5) {
            console.log(`Query ID: ${query.id}`);
            console.log(`Section: ${section.name}`);
            console.log(`Original: "${query.query}"`);
            console.log(`Becomes:  "${substituteVariables(query.query)}"`);
            console.log(`Purpose:  ${substituteVariables(query.purpose)}`);
            console.log(`Limit:    ${query.limit} results`);
            console.log('');
            queryCount++;
          }
        }
      }
    }
  }

  console.log(`... and ${totalQueries - 5} more queries\n`);

  // Show report metadata
  if (config.report) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 REPORT METADATA:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Title:    ${substituteVariables(config.report.title)}`);
    console.log(`Customer: ${substituteVariables(config.report.customer)}`);
    console.log(`Project:  ${substituteVariables(config.report.project)}`);
    console.log(`Date:     ${substituteVariables(config.report.date)}`);
    console.log('');
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 SUMMARY:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`Total sections: ${config.sections?.length || 0}`);
  console.log(`Total queries:  ${totalQueries}`);
  console.log(`Variables used: ${Object.keys(variables).length}`);

  if (unfilledVars.length > 0) {
    console.log(`\n⚠️  WARNING: ${unfilledVars.length} unfilled variable(s)`);
    console.log('   Please fill all variables before running HRDD workflow.\n');
  } else {
    console.log('\n✅ Config looks good! Ready to run.\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Main
if (process.argv.length < 3) {
  console.error('Usage: node preview-config.js <config-file.yml>');
  console.error('Example: node preview-config.js configs/my-company-hrdd.yml');
  process.exit(1);
}

const configFile = process.argv[2];

if (!fs.existsSync(configFile)) {
  console.error(`❌ Error: File not found: ${configFile}`);
  process.exit(1);
}

try {
  previewConfig(configFile);
} catch (error) {
  console.error('❌ Error parsing config file:', error.message);
  console.error('\nMake sure your YAML syntax is valid.');
  console.error('Common issues:');
  console.error('  - Incorrect indentation (use 2 spaces)');
  console.error('  - Missing quotes around string values');
  console.error('  - Invalid YAML structure');
  process.exit(1);
}
