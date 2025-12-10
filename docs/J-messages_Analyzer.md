# 📄 J-messages Analyzer (Fiskeridirektoratet)

A focused module to ingest Norwegian J‑meldinger (Word-notat), extract structured metadata, build an "Innhold" table of contents from headings, and render the full regulation body for reading and navigation. Includes a Library to persist analyses and export results.

## 🎯 Overview

The **J-messages Analyzer** is a specialized document processing system designed for analyzing Norwegian J‑meldinger (regulations) from Fiskeridirektoratet. It provides intelligent metadata extraction, structured content organization, and comprehensive document management capabilities. **This module is fully functional and production-ready.**

### What it does

- Extracts metadata (J‑ID, title, valid dates, replaces, status, categories) via the unified LLM pipeline
- Splits administrative header from the regulation body using the common marker "Forskriften lyder etter dette" (fallbacks apply)
- Builds a Table of Contents (TOC) from headings (Kapittel … → H1, "§ …" → H2) and injects anchor ids
- Renders the regulation body with clickable TOC and smooth scrolling, plus an optional executive summary
- Saves analyzed J‑meldinger to MongoDB and lists them in a Library with search, filters and export
- Supports both standard J-meldinger documents and specialized note analysis (addendums, corrections, extensions)

## 📊 Data Model

### Response from analyze endpoint

```json
{
  "id": "J-195-2025",
  "title": "Forskrift om endring av ...",
  "status": "Gjeldende",
  "valid_from": "2025-10-08",
  "valid_to": "2025-12-31",
  "replaces": "J-169-2025",
  "categories": ["Sør for 62° N", "Pelagisk fisk"],
  "toc": [
    { 
      "level": 1, 
      "title": "Kapittel 1. Fiskeforbud og kvoter", 
      "anchor": "kapittel-1-fiskeforbud-og-kvoter",
      "children": [
        { 
          "level": 2, 
          "title": "§ 1 Generelt forbud", 
          "anchor": "paragraf-1-generelt-forbud" 
        }
      ]
    }
  ],
  "body_html": "<h1 id='kapittel-1-fiskeforbud-og-kvoter'>...</h1> ...",
  "raw_text": "Plain text of the body",
  "summary": "Optional executive summary text",
  "summary_length": "short|medium|long"
}
```

### Note analysis response

```json
{
  "target_j_id": "J-195-2025",
  "note_type": "addendum",
  "valid_from": "2025-11-01",
  "valid_to": null,
  "affected_sections": ["Kapittel 1", "§ 7 (sjette ledd)"],
  "actions": ["amend", "replace"],
  "summary": "Short human-readable summary of what the note changes"
}
```

## 🔧 Backend API

### Document Analysis

**Analyze J-melding document**
- **Endpoint**: `POST /api/j-messages/analyze?summary_length=short|medium|long`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: DOCX or PDF file (required)
  - `summary_length`: Optional query parameter (`short`, `medium`, `long`, or omit for no summary)
- **Returns**: Complete analysis with metadata, TOC, body_html, raw_text, and optional summary

**Analyze J-melding note**
- **Endpoint**: `POST /api/j-messages/analyze-note`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: DOCX or PDF file containing the note (required)
- **Returns**: Note-specific data (target_j_id, note_type, affected_sections, actions, summary)

### Storage & Management

**Save analyzed result**
- **Endpoint**: `POST /api/j-messages/save`
- **Content-Type**: `application/json`
- **Body**: JSON same shape as analyze result (plus optional `filename`)
- **Returns**: Saved document ID and confirmation

**List saved analyses**
- **Endpoint**: `GET /api/j-messages/list`
- **Returns**: Array of all saved J-messages with metadata

**Delete a saved analysis**
- **Endpoint**: `DELETE /api/j-messages/delete/{id}`
- **Returns**: Confirmation of deletion

### Export

**Export to DOCX**
- **Endpoint**: `POST /api/j-messages/export-docx`
- **Content-Type**: `application/json`
- **Body**: JSON with document data
- **Returns**: DOCX file download

**Storage**: MongoDB collection `j_messages` (created automatically). Each document records metadata, toc, `body_html`, `raw_text`, optional `summary`, and timestamps.

## 🎨 Frontend UX

### J-messages Analyzer Module

**File Upload**
- Drag & drop or click to browse interface
- Supports `.docx` and `.pdf` formats
- Single file upload per analysis

**Analysis Options**
- **Analyze file** (blue button): For standard J-meldinger documents
  - Optional Summary selector: None, Short, Medium, Long
  - Extracts full metadata and builds complete TOC
- **Analyze note** (green button): For J-melding notes/addendums
  - Specialized extraction for note-specific fields
  - Identifies relationship to base J-melding

**Results Display**
- **Metadata Header**: J-ID, title, dates, status, replaces, categories
- **Executive Summary**: Optional AI-generated summary (if selected)
- **Table of Contents ("Innhold")**: 
  - Hierarchical structure with clickable entries
  - Smooth scrolling to matching headings
  - Collapsible/expandable TOC panel
- **Rendered Body**: HTML with proper heading structure and anchor IDs
- **Save to Library**: One-click persistence to MongoDB

### Prompt Manager 🆕

**Location**: Integrated panel below the file upload and analysis buttons

**Features**:
- **Native Prompt View**: Display the default prompts used for metadata extraction and note analysis
- **Prompt Editor**: Create, edit, and test custom prompts
- **Save/Update**: Store named prompts for reuse
- **Test Functionality**: Preview LLM output with your custom prompts
- **Prompt Injection Detection**: Automatic detection of potential prompt injection patterns with sanitization option
- **Agent-Specific**: Prompts are stored per agent (`j-messages`) and independent from other modules

**Use Cases**:
- Fine-tune metadata extraction accuracy
- Adjust note analysis prompts for better results
- Test different prompt strategies without code changes
- Compare results between different AI providers (LM Studio vs OpenAI)
- Iterate on prompts based on real document analysis results

### J-messages Library

**Search & Filter**
- Full-text search by ID, title, or category
- Filter by Status (e.g., "Gjeldende", "Utgått")
- Filter by Category (e.g., "Sør for 62° N", "Pelagisk fisk")
- Real-time filtering with instant results

**Document View**
- Expandable items showing full document details
- Summary display (if available)
- TOC navigation with smooth scrolling
- Rendered body HTML with proper formatting

**Export Options**
- **Markdown**: Generates a `.md` file including:
  - Title and metadata
  - Summary (if available)
  - TOC list
  - Raw text content
- **PDF**: Opens a print-ready HTML view of the rendered body
  - Use browser "Save as PDF" functionality
  - Preserves formatting and structure
- **DOCX**: Generates a Word document from the analyzed data
  - Includes all metadata and structured content
  - Ready for further editing or distribution

**Delete**: Removes the item from MongoDB with confirmation

## 🔍 Heuristics and Robustness

### Document Processing

**Header/Body Split**
- Primary marker: "Forskriften lyder etter dette"
- If marker is absent, entire file is treated as body
- LLM still extracts metadata even without clear header separation
- Fallback mechanisms ensure robust processing

**Heading Detection**
- `Kapittel …` → H1 (Chapter headings)
- `§ …` → H2 (Paragraph headings)
- Future iterations can use DOCX paragraph styles
- Additional patterns planned: H3, lettered subclauses

**PDF Support**
- Multiple fallback libraries for robust text extraction:
  - `pypdf` (primary)
  - `PyPDF2` (fallback)
  - `pdfminer.six` (secondary fallback)
- Handles various PDF structures and encodings

### LLM Integration

**Unified AI System**
- Runs through existing unified pipeline (ItemAI/OpenRouter/OpenAI)
- Honors `x-api-provider` and keys from app's API Config
- Automatic fallback between providers
- Consistent JSON output format

**Error Handling**
- Returns STRICT JSON; parsing failures handled gracefully
- UI renders with partial data if extraction incomplete
- Clear error messages for user feedback
- Robust validation of extracted metadata

**Note Analysis**
- Specialized prompt for analyzing J-melding notes
- Extracts relationship to base J-melding (`target_j_id`)
- Identifies affected sections and actions taken
- Handles addendums, corrections, extensions, cancellations

**Prompt Manager Integration**
- Allows customization of extraction prompts without backend changes
- Test prompts before applying to production
- Version control for prompt iterations
- Independent from other agent prompts

## 🧪 Quick Test (cURL)

### Analyze Document

```bash
curl -F "file=@/path/to/J-xxx-2025.docx" \
  "http://localhost:8000/api/j-messages/analyze?summary_length=medium"
```

### Analyze Note

```bash
curl -F "file=@/path/to/note.docx" \
  "http://localhost:8000/api/j-messages/analyze-note"
```

### Save Result

```bash
curl -X POST http://localhost:8000/api/j-messages/save \
  -H "Content-Type: application/json" \
  -d @result.json
```

### List Saved

```bash
curl http://localhost:8000/api/j-messages/list
```

### Export DOCX

```bash
curl -X POST http://localhost:8000/api/j-messages/export-docx \
  -H "Content-Type: application/json" \
  -d @document.json \
  -o output.docx
```

## ✅ Completed Features

- ✅ DOCX and PDF format support
- ✅ Note analysis with specialized prompts
- ✅ Prompt Manager for customization
- ✅ DOCX export functionality
- ✅ TOC with smooth scrolling navigation
- ✅ Library with search, filter, and export options
- ✅ MongoDB persistence
- ✅ Unique anchor generation for TOC items
- ✅ Robust error handling and validation
- ✅ Multi-provider AI support (LM Studio, OpenAI, OpenRouter)

## 🔮 Future Enhancements

**Document Processing**
- DOCX style-aware heading detection
- Additional markers for header/body separation
- Support for more heading levels (H3, lettered subclauses)
- Improved PDF text extraction accuracy

**Metadata & Validation**
- Validate and normalize dates/IDs
- Flag inconsistencies in extracted data
- Cross-reference validation (e.g., verify replaces IDs exist)
- Category normalization and standardization

**Batch Operations**
- Batch import from a directory
- Bulk-save functionality
- Bulk export operations
- Batch analysis with progress tracking

**Export & Styling**
- Optional export template to match Fiskeridirektoratet site styling more closely
- Customizable export formats
- Template-based document generation
- Styled PDF output with proper formatting

**User Experience**
- Provider badge showing which AI model generated each analysis
- Comparison view between different AI provider results
- Analysis history and version tracking
- Collaborative annotations and comments

**Integration**
- API webhooks for external system integration
- Automated processing workflows
- Scheduled batch analysis
- Integration with Fiskeridirektoratet systems

## 🏗️ Module Architecture & Structure

> **Note**: This section will be expanded as the module evolves. Document component structure, data flows, and implementation details here.

### Component Structure

*To be documented: Frontend components, backend routers, database schemas, and their relationships.*

### Data Flow

*To be documented: Request/response flows, processing pipelines, and state management.*

### File Organization

*To be documented: Directory structure, file naming conventions, and code organization patterns.*

---

## 🤖 Prompt Documentation

> **Note**: This section documents all prompts used in the J-messages Analyzer, including versions, changes, test results, and client feedback. This will grow significantly during development.

### Prompt Version History

*Document prompt iterations, changes made, reasons for changes, and results achieved.*

### Metadata Extraction Prompt

**Current Version**: v1.0 (Initial)  
**Last Updated**: January 2025  
**Status**: ✅ Active  
**Location**: `backend/routers/j_messages_analyzer.py` → `build_metadata_prompt()`

**Purpose**: Extract structured metadata from J-melding documents (J-ID, title, dates, status, replaces, categories).

**Prompt Text**:
```
Du er en assistent som analyserer norske forskrifter fra Fiskeridirektoratet.
Du får teksten fra en J-melding (header + starten på forskriften).
Trekk ut metadata og returner KUN STRICT JSON uten kommentarer.
Felt:
- j_id
- title
- replaces_id
- status
- valid_from
- valid_to
- categories

Tekst:
\"\"\"{header_text}\n\n{body_text[:4000]}\"\"\"
```

**Input Parameters**:
- `header_text`: Administrative header section of the J-melding
- `body_text`: First 4000 characters of the regulation body

**Expected Output Format**:
```json
{
  "j_id": "J-195-2025",
  "title": "Forskrift om endring av ...",
  "replaces_id": "J-169-2025",
  "status": "Gjeldende",
  "valid_from": "2025-10-08",
  "valid_to": "2025-12-31",
  "categories": ["Sør for 62° N", "Pelagisk fisk"]
}
```

**Test Results**:
- *Document test cases and results here as development progresses*

**Client Feedback**:
- *Record client feedback and adjustments made*

**Known Limitations**:
- Uses first 4000 characters of body text (may miss metadata in longer documents)
- Relies on LLM interpretation of Norwegian text
- Date format validation handled post-extraction

**Next Iteration**:
- *Planned improvements or changes based on client feedback*

---

### Note Analysis Prompt

**Current Version**: v1.0 (Initial)  
**Last Updated**: January 2025  
**Status**: ✅ Active  
**Location**: `backend/routers/j_messages_analyzer.py` → `build_note_prompt()`

**Purpose**: Analyze J-melding notes (addendums, corrections, extensions, cancellations) and extract note-specific fields.

**Prompt Text**:
```
You analyze Norwegian J-melding notes (short addendums to a base J‑melding).
Extract STRICT JSON with:
- target_j_id: the J‑melding ID this note modifies (e.g., "J-195-2025"), or null if unknown
- note_type: "addendum" | "correction" | "extension" | "cancellation" | "other"
- valid_from: YYYY-MM-DD or null
- valid_to: YYYY-MM-DD or null
- affected_sections: array of strings listing affected chapters/paragraphs (e.g., "Kapittel 1", "§ 7 (sjette ledd)")
- actions: array of verbs like ["amend","replace","add","repeal"]
- summary: short human-readable summary of what the note changes
Text:
\"\"\"{body_text[:12000]}\"\"\"
```

**Input Parameters**:
- `body_text`: First 12000 characters of the note document

**Expected Output Format**:
```json
{
  "target_j_id": "J-195-2025",
  "note_type": "addendum",
  "valid_from": "2025-11-01",
  "valid_to": null,
  "affected_sections": ["Kapittel 1", "§ 7 (sjette ledd)"],
  "actions": ["amend", "replace"],
  "summary": "Short human-readable summary of what the note changes"
}
```

**Note Types**:
- `addendum`: Additional information added to base J-melding
- `correction`: Corrections to existing content
- `extension`: Extensions of validity periods
- `cancellation`: Cancellation of parts or all of base J-melding
- `other`: Other types of notes

**Test Results**:
- *Document test cases and results here as development progresses*

**Client Feedback**:
- *Record client feedback and adjustments made*

**Known Limitations**:
- Uses first 12000 characters (may miss information in longer notes)
- Note type classification depends on LLM interpretation
- Relationship to base J-melding (`target_j_id`) may not always be explicit in note text

**Next Iteration**:
- *Planned improvements or changes based on client feedback*

---

### Custom Prompts

*Document any custom prompts created through the Prompt Manager, including:*
- *Prompt name and description*
- *Use case and context*
- *Test results and performance*
- *When and why it was created*

---

## 📝 Use Cases & Examples

> **Note**: Document real-world use cases, example documents, and expected outcomes here.

### Example Document Types

*Document different types of J-meldinger processed, with examples and expected results.*

### Common Scenarios

*Document typical workflows and how the module handles them.*

### Edge Cases

*Document unusual cases, how they're handled, and any special considerations.*

---

## 🔄 Development Changelog

> **Note**: Track all changes, improvements, and iterations made during development.

### 2025-12-10 - MCP Integration
- ✅ MCP Server integrated within WLWAI (Option 1)
- ✅ Endpoint `POST /api/mcp/j-messages/analyze` accepts `file_url` and downloads files automatically
- ✅ API key validation: rejects placeholders, falls back to `.env` automatically
- ✅ Tool `list_j_meldinger` added to MCP manifest with filtering support
- ✅ Enhanced JSON parsing to handle markdown-wrapped responses
- ✅ Comprehensive logging for debugging API key usage and metadata extraction
- 📝 See `docs/MCP_TESTING_GUIDE.md` for testing instructions

### 2025-01-XX - Initial Release
- ✅ Basic document analysis (DOCX/PDF)
- ✅ Metadata extraction
- ✅ TOC generation
- ✅ Note analysis
- ✅ Prompt Manager integration
- ✅ Library with search/filter/export
- ✅ MongoDB persistence

*Add new entries as development progresses...*

---

## 📚 Related Documentation

- [Main README](../README.md) - Overall platform documentation
- [API Configuration](../README.md#api-config) - AI provider setup
- [Document Analyzer](../README.md#document-analyzer) - General document analysis module
- [Agentic RAG System](../README.md#agentic-rag-system) - Advanced document intelligence

---

**Last Updated**: January 2025  
**Status**: Production Ready ✅  
**Maintained For**: Fiskeridirektoratet Project  
**Document Version**: 1.0

