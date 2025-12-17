#!/usr/bin/env node
/**
 * Import J-message pairs from Enonic export
 * 
 * Usage:
 *   node backend/scripts/import_enonic_pairs.js <file.jsonl> [options]
 * 
 * Options:
 *   --source <name>    Source system identifier (default: "enonic-import")
 *   --batch-size <n>   Batch size for import (default: 50)
 *   --dry-run         Validate only, don't import
 * 
 * Example:
 *   node backend/scripts/import_enonic_pairs.js data/enonic-export-2025.jsonl --source enonic-prod
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:8000';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE) || 50;

// Parse command line arguments
const args = process.argv.slice(2);
const filePath = args[0];
let source = 'enonic-import';
let batchSize = BATCH_SIZE;
let dryRun = false;

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--source' && args[i + 1]) {
    source = args[i + 1];
    i++;
  } else if (args[i] === '--batch-size' && args[i + 1]) {
    batchSize = parseInt(args[i + 1]);
    i++;
  } else if (args[i] === '--dry-run') {
    dryRun = true;
  }
}

if (!filePath) {
  console.error('❌ Error: File path is required');
  console.error('Usage: node import_enonic_pairs.js <file.jsonl> [options]');
  process.exit(1);
}

const absolutePath = path.isAbsolute(filePath) 
  ? filePath 
  : path.join(process.cwd(), filePath);

if (!fs.existsSync(absolutePath)) {
  console.error(`❌ Error: File not found: ${absolutePath}`);
  process.exit(1);
}

// Validation functions
function validateRequired(item, field) {
  if (!item[field]) {
    return `Missing required field: ${field}`;
  }
  return null;
}

function validatePair(item, lineNum) {
  const errors = [];
  
  // Required fields
  const required = ['j_id', 'title'];
  for (const field of required) {
    const error = validateRequired(item, field);
    if (error) errors.push(error);
  }
  
  // At least one of original or human_structured should exist
  if (!item.original && !item.human_structured) {
    errors.push('Must have at least "original" or "human_structured"');
  }
  
  // Validate original structure if present
  if (item.original) {
    if (!item.original.doc_url && !item.original.text_excerpt) {
      errors.push('original must have "doc_url" or "text_excerpt"');
    }
  }
  
  // Validate human_structured if present
  if (item.human_structured) {
    if (!item.human_structured.metadata && !item.human_structured.body_html) {
      errors.push('human_structured should have "metadata" or "body_html"');
    }
  }
  
  if (errors.length > 0) {
    return {
      line: lineNum,
      j_id: item.j_id || 'unknown',
      errors
    };
  }
  
  return null;
}

// Import function
async function importBatch(items, batchSource) {
  if (dryRun) {
    console.log(`   [DRY RUN] Would import ${items.length} items`);
    return {
      success: true,
      created: items.length,
      updated: 0,
      skipped: 0,
      errors: []
    };
  }
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`${API_BASE_URL}/api/j-messages/training/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items,
        source: batchSource
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`   ❌ Batch import failed: ${error.message}`);
    return {
      success: false,
      error: error.message,
      created: 0,
      updated: 0,
      skipped: items.length,
      errors: []
    };
  }
}

// Main import process
async function processFile() {
  console.log('\n📦 J-messages Pairs Import Tool\n');
  console.log(`📁 File: ${absolutePath}`);
  console.log(`🏷️  Source: ${source}`);
  console.log(`📊 Batch size: ${batchSize}`);
  if (dryRun) {
    console.log('🔍 Mode: DRY RUN (validation only)\n');
  } else {
    console.log('💾 Mode: IMPORT\n');
  }
  
  const fileStream = fs.createReadStream(absolutePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  let lineNum = 0;
  let validItems = [];
  let invalidCount = 0;
  const validationErrors = [];
  
  // Phase 1: Validation
  console.log('Phase 1: Validating...');
  
  for await (const line of rl) {
    lineNum++;
    
    if (!line.trim()) continue;
    
    try {
      const item = JSON.parse(line);
      const error = validatePair(item, lineNum);
      
      if (error) {
        validationErrors.push(error);
        invalidCount++;
      } else {
        validItems.push(item);
      }
    } catch (error) {
      validationErrors.push({
        line: lineNum,
        j_id: 'parse-error',
        errors: [`JSON parse error: ${error.message}`]
      });
      invalidCount++;
    }
  }
  
  console.log(`✅ Valid items: ${validItems.length}`);
  console.log(`❌ Invalid items: ${invalidCount}`);
  
  if (validationErrors.length > 0) {
    console.log('\n⚠️  Validation errors:');
    validationErrors.slice(0, 10).forEach(err => {
      console.log(`   Line ${err.line} (${err.j_id}):`);
      err.errors.forEach(e => console.log(`      - ${e}`));
    });
    if (validationErrors.length > 10) {
      console.log(`   ... and ${validationErrors.length - 10} more errors`);
    }
  }
  
  if (validItems.length === 0) {
    console.log('\n❌ No valid items to import');
    return;
  }
  
  if (dryRun) {
    console.log('\n✅ Validation complete (dry run mode)');
    return;
  }
  
  // Phase 2: Import in batches
  console.log('\nPhase 2: Importing...');
  
  const totalStats = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };
  
  for (let i = 0; i < validItems.length; i += batchSize) {
    const batch = validItems.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(validItems.length / batchSize);
    
    process.stdout.write(`   Batch ${batchNum}/${totalBatches} (${batch.length} items)... `);
    
    const result = await importBatch(batch, source);
    
    if (result.success) {
      console.log(`✅ Created: ${result.created}, Updated: ${result.updated}, Skipped: ${result.skipped}`);
      totalStats.created += result.created;
      totalStats.updated += result.updated;
      totalStats.skipped += result.skipped;
      if (result.errors && result.errors.length > 0) {
        totalStats.errors.push(...result.errors);
      }
    } else {
      console.log(`❌ Failed`);
      totalStats.errors.push({
        batch: batchNum,
        error: result.error
      });
    }
  }
  
  // Summary
  console.log('\n📊 Import Summary:');
  console.log(`   ✅ Created: ${totalStats.created}`);
  console.log(`   🔄 Updated: ${totalStats.updated}`);
  console.log(`   ⏭️  Skipped: ${totalStats.skipped}`);
  console.log(`   ❌ Errors: ${totalStats.errors.length}`);
  
  if (totalStats.errors.length > 0) {
    console.log('\n⚠️  Import errors:');
    totalStats.errors.slice(0, 10).forEach(err => {
      if (err.batch) {
        console.log(`   Batch ${err.batch}: ${err.error}`);
      } else {
        console.log(`   ${err.item}: ${err.error}`);
      }
    });
    if (totalStats.errors.length > 10) {
      console.log(`   ... and ${totalStats.errors.length - 10} more errors`);
    }
  }
  
  console.log('\n✅ Import complete!\n');
}

// Run
processFile().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

