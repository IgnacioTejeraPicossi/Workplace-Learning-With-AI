# WLWAI Backend Scripts

Utility scripts for data import and maintenance.

---

## J-messages Training Pairs Import

### Quick Start

**1. Install Dependencies**
```bash
npm install node-fetch
```

**2. Test with Sample Data**
```bash
# Validate only (dry run)
node backend/scripts/import_enonic_pairs.js backend/scripts/test-import-sample.jsonl --dry-run

# Import sample
node backend/scripts/import_enonic_pairs.js backend/scripts/test-import-sample.jsonl --source test-import
```

**3. Import Production Data**
```bash
node backend/scripts/import_enonic_pairs.js /path/to/enonic-export.jsonl --source enonic-prod-2025
```

### Files

- **`import_enonic_pairs.js`** - Main import script with validation
- **`example-import.jsonl`** - Example format with realistic data
- **`test-import-sample.jsonl`** - Small test dataset (3 items)

### Options

```bash
node import_enonic_pairs.js <file.jsonl> [options]

Options:
  --source <name>      Source identifier (default: "enonic-import")
  --batch-size <n>     Items per batch (default: 50)
  --dry-run           Validate only, don't import
```

### Examples

```bash
# Validate large file
node import_enonic_pairs.js data/large-export.jsonl --dry-run

# Import with custom source
node import_enonic_pairs.js data/export-q1.jsonl --source enonic-2025-q1

# Small batches for slow networks
node import_enonic_pairs.js data/export.jsonl --batch-size 10
```

---

## Format Reference

See [J_MESSAGES_IMPORT_GUIDE.md](../../docs/J_MESSAGES_IMPORT_GUIDE.md) for complete format specification.

**Minimal example:**
```json
{
  "j_id": "J-195-2025",
  "title": "Forskrift om...",
  "original": {
    "doc_url": "http://example.com/doc.docx"
  },
  "human_structured": {
    "metadata": { "j_id": "J-195-2025", ... },
    "body_html": "<h1>...</h1>"
  }
}
```

---

## Troubleshooting

**Backend not running:**
```bash
cd backend
python app.py
```

**Port conflict:**
```bash
# Change API URL
export API_URL=http://localhost:8080
node import_enonic_pairs.js file.jsonl
```

**View import logs:**
```bash
tail -f backend/logs/app.log
```

---

## Next Steps

After importing:
1. Open "J-messages pairs Library" in WLWAI
2. Verify total count
3. Run evaluation pipeline (Epic 3)

---

For detailed documentation, see:
- [J-messages Import Guide](../../docs/J_MESSAGES_IMPORT_GUIDE.md)
- [MCP Testing Guide](../../docs/MCP_TESTING_GUIDE.md)

