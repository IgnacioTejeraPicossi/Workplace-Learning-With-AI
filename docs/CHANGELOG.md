# Changelog

All notable changes to the J-messages Analyzer and Retrospective Learning system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2025-12-19

### 🎉 Major Release: Epic 3 - Retrospective Learning & Prompt Refinement

Complete implementation of AI-powered continuous learning system for J-messages analysis.

### Added

#### Phase 1: Data Model & Import Pipeline
- **New MongoDB Collection**: `j_message_pairs` for storing original + human-analyzed document pairs
- **REST API Endpoints**:
  - `GET /api/j-messages/training` - List training pairs with filters
  - `GET /api/j-messages/training/{id}` - Get single pair
  - `POST /api/j-messages/training` - Create pair
  - `PATCH /api/j-messages/training/{id}` - Update pair
  - `POST /api/j-messages/training/import` - Batch import
  - `DELETE /api/j-messages/training/{pair_id}` - Delete pair
  - `GET /api/j-messages/training/stats/summary` - Statistics
- **CLI Import Script**: `backend/scripts/import_enonic_pairs.js` for JSONL batch import
- **Frontend Component**: `JMessagesPairsLibrary.jsx` with side-by-side document comparison
- **Documentation**: `J_MESSAGES_IMPORT_GUIDE.md` with 16 detailed sections

#### Phase 2: Real AI Integration
- **Evaluator Service**: `backend/services/j_messages_evaluator.py` for comparing AI vs. human analysis
- **New Function**: `analyze_text_content()` in `j_messages_analyzer.py` for reusable AI analysis
- **Evaluation Endpoints**:
  - `POST /api/j-messages/training/{pair_id}/evaluate` - Evaluate single pair
  - `POST /api/j-messages/training/evaluate-batch` - Evaluate multiple pairs
  - `GET /api/j-messages/training/{pair_id}/evaluation` - Get evaluation results
- **Metrics Dashboard**: Field-by-field accuracy display with color-coded badges
- **Evaluation Features**:
  - Overall accuracy calculation
  - Per-field accuracy (j_id, title, dates, categories, etc.)
  - String similarity for text fields
  - Date comparison with format normalization
  - Array comparison (Jaccard similarity)
  - Human-readable evaluation summaries
- **Documentation**: `EPIC3_PHASE2_REAL_AI_INTEGRATION.md` with testing guide

#### Phase 3: AI-Powered Prompt Suggestions
- **Suggestion Service**: `backend/services/prompt_suggestion_service.py` for intelligent prompt improvement
- **Meta-Prompt Builder**: Generates comprehensive prompts for LLM analysis of evaluation results
- **Smart Example Selection**: 70% low-accuracy + 30% high-accuracy pairs for balanced learning
- **API Endpoint**: `POST /api/j-messages/training/prompt/suggest`
- **Frontend Features**:
  - "💡 Suggest Prompt Improvements" button
  - Full-screen modal with suggestion display
  - Key improvements section (3-5 bullet points)
  - Side-by-side prompt comparison
  - One-click copy to clipboard
  - "Copy & Use in Prompt Manager" integration
- **Documentation**: `EPIC3_PHASE3_PROMPT_SUGGESTIONS.md` with architecture and usage guide

### Fixed

#### Critical Bugs Resolved
1. **Field Name Mismatch** (Dec 19)
   - **Issue**: MongoDB query used `evaluation.overall_accuracy` but data stored as `evaluation.overall_score`
   - **Impact**: "No evaluated training pairs found" error
   - **Files**: `j_messages_training.py`, `prompt_suggestion_service.py`

2. **Import Path Error** (Dec 19)
   - **Issue**: Incorrect import from `backend.routers.ask_ai` instead of `backend.llm`
   - **Impact**: "No module named 'routers'" error during suggestion generation
   - **Files**: `prompt_suggestion_service.py`

3. **Field Accuracy Path** (Dec 19)
   - **Issue**: Accessed `evaluation.field_accuracy` directly instead of `evaluation.metrics.field_accuracy`
   - **Impact**: Empty field accuracy in suggestions
   - **Files**: `prompt_suggestion_service.py`

4. **Import Pattern** (Dec 19)
   - **Issue**: Imports only worked when running from `backend/` directory
   - **Impact**: Failed when running from project root (standard deployment)
   - **Solution**: Implemented fallback import pattern for all services
   - **Files**: All services and routers

### Changed

- **Import Strategy**: All backend services now use fallback import pattern supporting both root and backend directory execution
- **Data Structure**: Standardized on `evaluation.overall_score` for top-level accuracy
- **Documentation**: Updated all guides with data structure references and troubleshooting sections

### Documentation

- **New Guides**:
  - `CHANGELOG.md` - This file
  - `J_MESSAGES_IMPORT_GUIDE.md` - Import pipeline documentation
  - `EPIC3_PHASE2_REAL_AI_INTEGRATION.md` - Evaluation system guide
  - `EPIC3_PHASE3_PROMPT_SUGGESTIONS.md` - Prompt suggestion guide

- **Updated**:
  - `README_INDEX.md` - Added Epic 3 documentation links
  - All Phase 2 and Phase 3 docs with data structure references

### Technical Debt

- **Future Optimization**: Batch evaluation could be parallelized for better performance
- **UI Enhancement**: Progress bar for long-running operations
- **Caching**: Consider caching evaluation results to avoid re-computation
- **Prompt Versioning**: Save suggested prompts as versioned entities in database

---

## [0.9.0] - 2025-12-17 (Pre-Epic 3)

### Added
- MCP Server integration for J-messages Analyzer
- Claude Desktop and Postman testing capabilities
- Risk and Vulnerability Analysis (ROS) documentation
- API configuration management
- Test automation framework

### Previous Work
See individual documentation files:
- `MCP_TESTING_GUIDE.md`
- `CLAUDE_DESKTOP_SETUP.md`
- `POSTMAN_MCP_TESTING.md`
- `J_MESSAGES_ROS_ANALYSIS.md`

---

## Version History

- **1.0.0** (Dec 19, 2025): Epic 3 complete - Retrospective Learning & Prompt Refinement
- **0.9.0** (Dec 17, 2025): MCP Server integration
- **0.8.0** (Earlier): J-messages Analyzer core functionality

---

## Contributors

- **Ignacio Tejera** - Product Owner & Requirements
- **AI Assistant (Claude Sonnet 4.5)** - Implementation & Documentation
- **Fiskedirektoratet Team** - Domain expertise & testing

---

## License

Internal project for Fiskedirektoratet - Not for public distribution

---

*For detailed technical information, see individual documentation files in `/docs`*

