# WLWAI Backend Scripts

Production scripts for J-messages training pairs management.

---

## 📦 Files in this Directory for J-messages training pairs

### Production Scripts

- **`import_enonic_pairs.js`** - CLI tool for importing training pairs from Enonic exports
- **`example-import.jsonl`** - Example JSONL format with realistic J-meldinger data (3 items)
- **`test-import-sample.jsonl`** - Small test dataset for validation (3 items)
- **`README.md`** - This file

---

## J-messages Training Pairs Import

### Prerequisites

**1. Install Dependencies**
```bash
cd backend
npm install node-fetch
```

**2. Ensure Backend is Running**
```bash
cd backend
python app.py
# Backend should be running on http://localhost:8000
```

### Quick Start

**Test with Sample Data**
```bash
# Validate only (dry run)
node scripts/import_enonic_pairs.js scripts/test-import-sample.jsonl --dry-run

# Import sample
node scripts/import_enonic_pairs.js scripts/test-import-sample.jsonl --source test-import
```

**Import Production Data from Enonic**
```bash
node scripts/import_enonic_pairs.js /path/to/enonic-export.jsonl --source enonic-prod-2025
```

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

