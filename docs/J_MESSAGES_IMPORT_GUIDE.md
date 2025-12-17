# J-messages Training Pairs Import Guide

## Overview

This guide explains how to import existing J-meldinger document pairs (original + human-analyzed) from Enonic into the WLWAI training system. These pairs will be used for retrospective learning and AI prompt improvement.

---

## Table of Contents

1. [Import Format (JSONL)](#import-format-jsonl)
2. [Field Reference](#field-reference)
3. [Import Methods](#import-methods)
4. [Validation Rules](#validation-rules)
5. [Exporting from Enonic](#exporting-from-enonic)
6. [Troubleshooting](#troubleshooting)

---

## Import Format (JSONL)

WLWAI accepts **JSON Lines** format (`.jsonl`): one JSON object per line, each representing a document pair.

### Example File Structure

```jsonl
{"j_id":"J-195-2025","title":"Forskrift om...","original":{...},"human_structured":{...}}
{"j_id":"J-48-2024","title":"Forskrift om...","original":{...},"human_structured":{...}}
{"j_id":"J-127-2024","title":"Forskrift om...","original":{...},"human_structured":{...}}
```

See `backend/scripts/example-import.jsonl` for complete examples.

---

## Field Reference

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `j_id` | string | Unique J-melding identifier (e.g., "J-195-2025") |
| `title` | string | Full title of the document |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `source_system_id` | string | Content ID from Enonic (for reference) |
| `original` | object | Original document information |
| `human_structured` | object | Human-analyzed content from Enonic |
| `ai_structured` | object | AI-analyzed content (optional, usually empty on import) |
| `tags` | string[] | Tags for categorization (e.g., ["training", "production"]) |
| `evaluation` | object | Evaluation metrics (optional, usually empty on import) |

### `original` Object

| Field | Type | Description |
|-------|------|-------------|
| `doc_url` | string | URL to download original DOCX/PDF file |
| `doc_type` | string | File type: "docx", "pdf", "txt" |
| `stored_file_path` | string | Optional: local file path if stored |
| `text_excerpt` | string | First ~2000-5000 chars of document text |

**Note:** Either `doc_url` OR `text_excerpt` is required (or both).

### `human_structured` Object

This should mirror the structure of J-messages Analyzer output:

```json
{
  "metadata": {
    "j_id": "J-195-2025",
    "title": "Forskrift om regulering...",
    "valid_from": "2025-01-15",
    "valid_to": "2025-12-31",
    "status": "Fastsatt",
    "categories": ["Fiskeriregulering", "Nordsjøen"],
    "replaces_id": "J-180-2024",
    "summary": "Optional summary text"
  },
  "toc": [
    {
      "level": 1,
      "title": "Kapittel 1 - Virkeområde",
      "anchor": "kap1"
    },
    {
      "level": 2,
      "title": "§ 1 Virkeområde",
      "anchor": "s1"
    }
  ],
  "body_html": "<h1 id=\"kap1\">Kapittel 1...</h1><p>...</p>"
}
```

**For J-melding notes (amendments):**

```json
{
  "metadata": {
    "j_id": "J-127-2024",
    "title": "Forskrift om endring...",
    "target_j_id": "J-89-2024",
    "note_type": "addendum",
    "valid_from": "2024-08-15",
    "affected_sections": ["§ 5 (tredje ledd)", "§ 7"],
    "actions": ["amend", "replace"],
    "summary": "Endrer kvoter for kystfartøy"
  },
  "body_html": "<h1>Endringer</h1><p>I forskrift J-89-2024...</p>"
}
```

---

## Import Methods

### Method 1: CLI Script (Recommended for Large Batches)

**Prerequisites:**
```bash
npm install node-fetch
```

**Usage:**
```bash
node backend/scripts/import_enonic_pairs.js <file.jsonl> [options]
```

**Options:**
- `--source <name>`: Source identifier (default: "enonic-import")
- `--batch-size <n>`: Items per batch (default: 50)
- `--dry-run`: Validate only, don't import

**Examples:**

```bash
# Dry run (validation only)
node backend/scripts/import_enonic_pairs.js data/enonic-export-2025.jsonl --dry-run

# Import from production Enonic
node backend/scripts/import_enonic_pairs.js data/enonic-prod-2025.jsonl --source enonic-prod

# Small batches for testing
node backend/scripts/import_enonic_pairs.js data/test-sample.jsonl --batch-size 10
```

**Output:**
```
📦 J-messages Pairs Import Tool

📁 File: data/enonic-export-2025.jsonl
🏷️  Source: enonic-prod
📊 Batch size: 50
💾 Mode: IMPORT

Phase 1: Validating...
✅ Valid items: 247
❌ Invalid items: 3

Phase 2: Importing...
   Batch 1/5 (50 items)... ✅ Created: 48, Updated: 2, Skipped: 0
   Batch 2/5 (50 items)... ✅ Created: 50, Updated: 0, Skipped: 0
   ...

📊 Import Summary:
   ✅ Created: 245
   🔄 Updated: 2
   ⏭️  Skipped: 0
   ❌ Errors: 0

✅ Import complete!
```

### Method 2: REST API (Recommended for Small Batches)

**Endpoint:**
```
POST /api/j-messages/training/import
```

**Request Body:**
```json
{
  "items": [
    {
      "j_id": "J-195-2025",
      "title": "Forskrift om...",
      "original": { ... },
      "human_structured": { ... }
    },
    {
      "j_id": "J-48-2024",
      ...
    }
  ],
  "source": "enonic-import"
}
```

**Response:**
```json
{
  "success": true,
  "created": 2,
  "updated": 0,
  "skipped": 0,
  "errors": []
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/j-messages/training/import \
  -H "Content-Type: application/json" \
  -d @import-payload.json
```

**Python Example:**
```python
import requests
import json

with open('enonic-export.jsonl', 'r', encoding='utf-8') as f:
    items = [json.loads(line) for line in f if line.strip()]

response = requests.post(
    'http://localhost:8000/api/j-messages/training/import',
    json={'items': items, 'source': 'enonic-import'}
)

print(response.json())
```

---

## Validation Rules

The import process validates each item before storing:

### ✅ Required Validations

1. **Must have:** `j_id` and `title`
2. **Must have at least one of:**
   - `original` (with `doc_url` or `text_excerpt`)
   - `human_structured` (with `metadata` or `body_html`)
3. **Unique constraint:** `j_id` + `source_system_id` combination

### ⚠️ Warnings (not blocking)

- Missing `original.doc_url` (can't re-download file)
- Missing `human_structured.toc` (no TOC for comparison)
- Missing `human_structured.metadata.categories` (no categorization)

### 🔄 Deduplication

- If a pair with the same `j_id` + `source_system_id` exists:
  - **Default behavior:** Skip (count as "skipped")
  - **Future:** Option to update existing records

---

## Exporting from Enonic

### Step 1: Identify Target Content

In Enonic Content Studio:
1. Navigate to J-meldinger content type
2. Filter by date range, status, or category
3. Note content IDs for export

### Step 2: Extract Data via Enonic API

**Example Enonic XP Query (JavaScript):**

```javascript
const contentLib = require('/lib/xp/content');

function exportJMeldinger() {
    const result = contentLib.query({
        contentTypes: ['no.fdir:j-melding'],
        count: 1000,
        sort: 'createdTime DESC'
    });
    
    const pairs = result.hits.map(content => {
        const data = content.data;
        
        return {
            j_id: data.j_id,
            source_system_id: content._id,
            title: data.title || content.displayName,
            original: {
                doc_url: getAttachmentUrl(content._id, data.original_file),
                doc_type: data.original_file ? 'docx' : 'unknown'
            },
            human_structured: {
                metadata: {
                    j_id: data.j_id,
                    title: data.title,
                    valid_from: data.valid_from,
                    valid_to: data.valid_to,
                    status: data.status,
                    categories: data.categories || []
                },
                toc: data.toc || [],
                body_html: data.body_html || contentLib.getHtml(content._id)
            },
            tags: ['training', 'enonic-export-2025']
        };
    });
    
    return pairs;
}
```

### Step 3: Convert to JSONL

```javascript
const fs = require('fs');

const pairs = exportJMeldinger();
const jsonlContent = pairs.map(p => JSON.stringify(p)).join('\n');

fs.writeFileSync('enonic-export-2025.jsonl', jsonlContent, 'utf-8');
```

---

## Troubleshooting

### Problem: "Missing required field: j_id"

**Solution:** Ensure every line in the JSONL file has a `j_id` field.

```bash
# Check for missing j_id
grep -v '"j_id"' your-file.jsonl
```

### Problem: "JSON parse error"

**Solution:** Validate JSONL format (one JSON object per line, no trailing commas).

```bash
# Validate each line
while read line; do
  echo "$line" | python -m json.tool > /dev/null || echo "Invalid line: $line"
done < your-file.jsonl
```

### Problem: High "skipped" count

**Cause:** Duplicate `j_id` + `source_system_id` combinations.

**Solution:**
- Use different `source` identifier for re-imports
- Or clear existing data first (if testing):
  ```bash
  # WARNING: Deletes all training pairs
  curl -X DELETE http://localhost:8000/api/j-messages/training/clear-all
  ```

### Problem: Import is slow

**Solution:** Increase batch size:
```bash
node backend/scripts/import_enonic_pairs.js file.jsonl --batch-size 100
```

### Problem: "Connection refused" error

**Solution:** Ensure backend is running:
```bash
cd backend
python app.py
```

---

## Best Practices

### 1. Start with a Sample

Test with a small subset first:
```bash
# Create sample (first 10 lines)
head -n 10 enonic-full-export.jsonl > test-sample.jsonl

# Dry run
node backend/scripts/import_enonic_pairs.js test-sample.jsonl --dry-run

# Import
node backend/scripts/import_enonic_pairs.js test-sample.jsonl
```

### 2. Use Descriptive Source Names

```bash
# Good
--source enonic-prod-2025-q1
--source enonic-test-migration
--source manual-curation-batch-3

# Not recommended
--source import
--source data
```

### 3. Keep Original Files

If possible, include `original.doc_url` pointing to permanent storage:
- Enonic media library URLs
- Cloud storage (S3, Azure Blob)
- Network share paths

This allows:
- Re-processing with improved extractors
- Verification of human analysis
- Training data for OCR/parsing

### 4. Tag Appropriately

Use tags for filtering and organization:
```json
{
  "tags": [
    "training",           // For retrospective learning
    "production",         // Production content
    "2025-q1",           // Time period
    "high-quality",      // Curated examples
    "complex-structure"  // Special cases
  ]
}
```

---

## Next Steps

After importing:

1. **Verify Import**
   - Open "J-messages pairs Library" in WLWAI
   - Check "Total Pairs" count
   - Browse imported documents

2. **Epic 3: Evaluation**
   - Run evaluation pipeline to compare AI vs Human analysis
   - View accuracy metrics
   - Identify areas for prompt improvement

3. **Prompt Refinement**
   - Use low-accuracy pairs to improve prompts
   - A/B test new prompts
   - Track improvements over time

---

## Support

For questions or issues:
- Check logs: `backend/logs/`
- Open issue on GitHub
- Contact dev team

---

## Appendix: Field Mapping from Enonic

| Enonic Field | JSONL Field | Notes |
|--------------|-------------|-------|
| `content._id` | `source_system_id` | Enonic content ID |
| `data.j_id` | `j_id` | J-melding identifier |
| `displayName` or `data.title` | `title` | Document title |
| `data.original_file` (attachment) | `original.doc_url` | URL to DOCX/PDF |
| `data.body_html` | `human_structured.body_html` | Analyzed HTML |
| `data.metadata.*` | `human_structured.metadata.*` | All metadata fields |
| `data.toc` | `human_structured.toc` | Table of contents |

---

**Version:** 1.0  
**Last Updated:** December 2025  
**Related Docs:**
- [MCP Testing Guide](./MCP_TESTING_GUIDE.md)
- [J-messages ROS Analysis](./J_MESSAGES_ROS_ANALYSIS.md)
- [Retrospective Learning (Epic 3)](./J_MESSAGES_RETROSPECTIVE_LEARNING.md)

