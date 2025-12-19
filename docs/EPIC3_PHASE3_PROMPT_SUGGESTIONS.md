# Epic 3 - Phase 3: AI-Powered Prompt Suggestions

**Status**: ✅ Implemented & Ready for Testing

---

## 📋 Overview

Phase 3 implements an AI-powered system that analyzes evaluation results from training pairs and generates **intelligent suggestions** to improve the J-messages analysis prompt.

### Key Features

1. **Smart Example Selection**: Automatically selects representative training pairs (70% low-accuracy, 30% high-accuracy)
2. **AI-Powered Analysis**: Uses an LLM to analyze patterns in errors and suggest improvements
3. **Detailed Explanations**: Provides 3-5 key notes explaining why each change is suggested
4. **Side-by-Side Comparison**: Shows original vs. suggested prompt for easy review
5. **One-Click Copy**: Copy the suggested prompt directly to clipboard

---

## 🏗️ Architecture

### Backend Components

#### 1. `PromptSuggestionService` (`backend/services/prompt_suggestion_service.py`)

Main service that orchestrates the suggestion generation:

```python
class PromptSuggestionService:
    async def generate_suggestion(
        current_prompt: str,
        training_pairs: List[Dict],
        num_examples: int = 5,
        focus_on_errors: bool = True
    ) -> Dict[str, Any]
```

**Process Flow:**

1. **Select Examples**: Choose N training pairs based on accuracy distribution
2. **Build Meta-Prompt**: Create a comprehensive prompt that asks an LLM to:
   - Analyze INPUT_TEXT (original document)
   - Compare TARGET_JSON (human analysis) vs MODEL_JSON (AI analysis)
   - Identify error patterns
   - Suggest improvements
3. **Call LLM**: Use `ask_ai_unified_sync` with high complexity settings
4. **Parse & Return**: Extract JSON with `suggested_prompt` and `notes`

#### 2. API Endpoint (`backend/routers/j_messages_training.py`)

```python
POST /api/j-messages/training/prompt/suggest
```

**Request Body:**
```json
{
  "current_prompt": "Optional: provide current prompt, or use default",
  "num_examples": 5,
  "focus_on_errors": true
}
```

**Response:**
```json
{
  "success": true,
  "suggestion": {
    "suggested_prompt": "Improved prompt text...",
    "notes": [
      "Added explicit date format examples",
      "Clarified category extraction rules",
      "Improved handling of replaced J-IDs"
    ],
    "based_on_pairs": ["pair_id_1", "pair_id_2", ...],
    "num_examples": 5,
    "generated_at": "2025-12-19T...",
    "original_prompt": "Current prompt text..."
  }
}
```

---

### Frontend Components

#### 1. Button in `JMessagesPairsLibrary.jsx`

```jsx
<button onClick={() => generatePromptSuggestion(5, true)}>
  💡 Suggest Prompt Improvements
</button>
```

- **Disabled** on "Analyzed J-messages" tab (only works with training pairs)
- Shows loading state: "⏳ Generating..."
- Tooltip explains requirements

#### 2. Suggestion Modal

Full-screen modal that displays:

- **Info Banner**: Number of examples used, generation timestamp
- **Key Improvements**: Bulleted list of 3-5 notes
- **Suggested Prompt**: Full text in a pre-formatted code block
- **Original Prompt**: Collapsible comparison view
- **Action Buttons**:
  - "Close"
  - "Copy & Use in Prompt Manager"

---

## 🔧 How It Works

### Meta-Prompt Structure

The service creates a detailed meta-prompt that includes:

```
You are an expert in prompt engineering for legal document extraction.

# Current System Prompt
[...current prompt...]

# Training Examples

### Example 1 (Overall Accuracy: 45.2%)

**INPUT TEXT (truncated):**
```
Okkupasjonsmeldingen så på 0,5% riskert et britisk sone...
```

**TARGET JSON (Human-analyzed):**
{
  "j_id": "J-195-2025",
  "title": "Forskrift om...",
  "categories": ["Sild", "Nordsjøen", "Skagerrak"]
}

**MODEL JSON (AI-analyzed with current prompt):**
{
  "j_id": "J-195-2025",
  "title": "Forskrift om...",
  "categories": ["Fiskeregulering"]  // ❌ Too generic
}

**Field-by-field accuracy:**
{
  "j_id": 1.0,
  "title": 1.0,
  "categories": 0.0  // ❌ Complete mismatch
}

[... more examples ...]

# Your Task

Analyze error patterns and suggest an improved prompt.

Return ONLY JSON:
{
  "suggested_prompt": "...",
  "notes": ["...", "...", "..."]
}
```

---

## 🚀 Usage Guide

### Step 1: Ensure You Have Evaluated Pairs

Before generating suggestions, you need **at least one evaluated training pair**:

1. Go to **J-messages pairs Library**
2. Ensure you have training pairs listed
3. Click **"🤖 Evaluate"** on at least 1-2 pairs
4. Wait for evaluation to complete

### Step 2: Generate Suggestion

1. Click **"💡 Suggest Prompt Improvements"** button (top right)
2. Wait 10-30 seconds while the AI analyzes examples
3. A modal will appear with the suggestion

### Step 3: Review the Suggestion

**Key Improvements Section:**
- Read the 3-5 bullet points explaining what changed
- Understand **why** each change is recommended

**Suggested Prompt:**
- Full text of the improved prompt
- Pre-formatted for easy reading

**Compare with Original:**
- Click the collapsible section to see the old prompt
- Spot the differences

### Step 4: Apply the Suggestion

**Option 1: Copy to Clipboard**
```
Click "📋 Copy to Clipboard" → Paste anywhere
```

**Option 2: Use in Prompt Manager**
```
Click "💾 Copy & Use in Prompt Manager"
→ Navigate to Prompt Manager
→ Paste into editor
→ Save as new version
```

---

## 🧪 Testing Phase 3

### Test Case 1: Generate Suggestion with Default Settings

**Prerequisites:**
- At least 2 evaluated training pairs in the database
- Backend running on port 8000
- Frontend running on port 3000

**Steps:**
1. Navigate to **J-messages pairs Library** in the sidebar
2. Ensure you're on the **"Training Pairs"** tab (not "Analyzed J-messages")
3. Click **"💡 Suggest Prompt Improvements"**
4. Wait for the modal to appear

**Expected Result:**
- Modal shows with "💡 AI-Generated Prompt Suggestion" title
- Info banner shows number of examples (e.g., "Based on: 2 training examples")
- 3-5 key improvement notes are listed
- Suggested prompt is displayed in a code block
- Original prompt is available in collapsible section

**Success Criteria:**
- ✅ No errors in console
- ✅ Suggested prompt is different from original
- ✅ Notes make logical sense
- ✅ Copy button works

---

### Test Case 2: Copy Suggestion to Clipboard

**Steps:**
1. Generate a suggestion (as above)
2. Click **"📋 Copy to Clipboard"** button
3. Open Notepad/TextEdit
4. Paste (Ctrl+V / Cmd+V)

**Expected Result:**
- Alert shows "Prompt copied to clipboard!"
- Pasted text matches the suggested prompt exactly

---

### Test Case 3: Disable on "Analyzed" Tab

**Steps:**
1. Switch to **"Analyzed J-messages"** tab
2. Observe the **"💡 Suggest Prompt Improvements"** button

**Expected Result:**
- Button is **disabled** (grayed out)
- Hover tooltip says: "Switch to Training Pairs tab to generate suggestions"
- Click does nothing

---

### Test Case 4: Error Handling - No Evaluated Pairs

**Setup:**
1. Clear all evaluations from training pairs (or use a fresh database)

**Steps:**
1. Click **"💡 Suggest Prompt Improvements"**

**Expected Result:**
- Error message appears: "No evaluated training pairs found. Please run evaluation first."
- Modal does NOT open

---

## 🐛 Troubleshooting

### Issue: Button is Disabled

**Cause**: You're on the "Analyzed J-messages" tab

**Solution**: Switch to **"Training Pairs"** tab

---

### Issue: "No evaluated training pairs found"

**Cause**: No pairs have been evaluated yet

**Solution**:
1. Go to training pairs list
2. Click **"🤖 Evaluate"** on at least 1 pair
3. Wait for evaluation to complete
4. Try generating suggestion again

---

### Issue: "Failed to generate suggestion: LLM failed"

**Possible Causes:**
- API key not configured
- LLM service is down
- Network timeout

**Solution**:
1. Check **API Config** page for valid OpenAI key
2. Check backend logs for detailed error:
   ```
   grep "Error calling LLM" backend/logs/*.log
   ```
3. Verify network connectivity

---

### Issue: Suggested Prompt is Identical to Original

**Cause**: AI determined no changes are needed (rare, but possible if accuracy is already 100%)

**Solution**: This is technically correct behavior, but unlikely with real data

---

## 📊 Example Output

### Example 1: Low-Accuracy Pair (45%)

**Key Improvements:**
1. **Add explicit category examples**: Include common categories like "Torsk", "Sild", "Nordsjøen" to guide extraction
2. **Improve date parsing instructions**: Clarify format expectations (YYYY-MM-DD) and handle relative dates ("from 28. desember")
3. **Handle J-ID references**: Add instructions for extracting "replaces_id" from phrases like "erstatter J-169-2025"

**Suggested Prompt:**
```
Du er en assistent som analyserer norske forskrifter fra Fiskeridirektoratet.
Du får teksten fra en J-melding (header + starten på forskriften).
Trekk ut metadata og returner KUN STRICT JSON uten kommentarer.

Felt:
- j_id: J-meldingens ID (e.g., "J-195-2025")
- title: Tittel på forskriften (fullstendig tittel)
- replaces_id: ID til erstattet J-melding (søk etter "erstatter J-XXX-YYYY")
- status: "Fastsatt" eller "Utgått"
- valid_from: Gyldig fra dato i format YYYY-MM-DD (konverter fra "28. desember 2024")
- valid_to: Gyldig til dato (YYYY-MM-DD eller null hvis ikke spesifisert)
- categories: Array av SPESIFIKKE kategorier basert på innhold:
  * Arter: ["Torsk", "Sild", "Makrell", etc.]
  * Områder: ["Nordsjøen", "Skagerrak", "Norges Økonomiske sone"]
  * Type regulering: ["Kvoter", "Påtrålforbudspåbud", etc.]

Eksempel kategorier:
- For sildfiske: ["Sild", "Nordsjøen", "Kvoter"]
- For torskeregulering: ["Torsk", "Barentshavet", "Stenging"]

Returner KUN JSON uten kommentarer.
```

---

## 🎯 Success Metrics

**Phase 3 is successful if:**

1. ✅ Users can generate suggestions in < 30 seconds
2. ✅ Suggestions include 3-5 actionable notes
3. ✅ Suggested prompts are measurably different from originals
4. ✅ Copy-to-clipboard works reliably
5. ✅ Error handling is clear and helpful

---

## 🔗 Related Documentation

- [Phase 1: Data Model & UI](./J_MESSAGES_IMPORT_GUIDE.md)
- [Phase 2: Real AI Integration](./EPIC3_PHASE2_REAL_AI_INTEGRATION.md)
- [MCP Testing Guide](./MCP_TESTING_GUIDE.md)

---

## 🏁 Next Steps (Future Enhancements)

### Potential Phase 4 Features:

1. **Automatic Prompt Versioning**
   - Save suggested prompts as versioned entities in database
   - Track which prompt version generated each analysis

2. **A/B Testing Framework**
   - Run old vs. new prompt on same dataset
   - Compare accuracy metrics side-by-side

3. **Batch Re-Analysis**
   - After updating prompt, re-analyze all training pairs
   - Show improvement delta

4. **Fine-Tuning Integration**
   - Export training pairs in JSONL format for OpenAI fine-tuning
   - Track fine-tuned model performance

---

## 📝 Developer Notes

### Key Files Modified

**Backend:**
- `backend/services/prompt_suggestion_service.py` (NEW)
- `backend/routers/j_messages_training.py` (added endpoint)

**Frontend:**
- `frontend/src/JMessagesPairsLibrary.jsx` (added button & modal)

### Import Pattern (Supports Root Execution)

All imports use fallback pattern:

```python
try:
    from backend.services.prompt_suggestion_service import get_prompt_suggestion_service
except ImportError:
    from services.prompt_suggestion_service import get_prompt_suggestion_service
```

This ensures the code works whether running from:
- Root directory: `uvicorn backend.app:app`
- Backend directory: `python app.py` (legacy)

### Critical Bugs Fixed During Implementation

**Bug 1: Field Name Mismatch**
- **Issue**: MongoDB query searched for `evaluation.overall_accuracy` but data was stored as `evaluation.overall_score`
- **Symptom**: "No evaluated training pairs found" error even when pairs existed
- **Fix**: Updated all references to use `evaluation.overall_score`
- **Files affected**: 
  - `backend/routers/j_messages_training.py` (line 685)
  - `backend/services/prompt_suggestion_service.py` (lines 110, 119, 139, 158)

**Bug 2: Incorrect Import Path**
- **Issue**: Tried to import `ask_ai_unified_sync` from `backend.routers.ask_ai` (doesn't exist)
- **Symptom**: "No module named 'routers'" error when generating suggestions
- **Fix**: Changed import to `backend.llm` (correct location)
- **Files affected**:
  - `backend/services/prompt_suggestion_service.py` (line 243)

**Bug 3: Field Accuracy Path**
- **Issue**: Accessed `evaluation.field_accuracy` directly instead of nested path
- **Symptom**: Empty field accuracy in suggestions
- **Fix**: Use `evaluation.metrics.field_accuracy`
- **Files affected**:
  - `backend/services/prompt_suggestion_service.py` (line 160)

### Data Structure Reference

For future developers, the correct MongoDB structure for evaluated pairs:

```json
{
  "_id": "ObjectId(...)",
  "j_id": "J-195-2025",
  "evaluation": {
    "overall_score": 0.714,          // ⚠️ Note: "score" not "accuracy"
    "last_evaluated_at": "2025-12-19T...",
    "metrics": {
      "overall_accuracy": 0.714,     // Inside metrics object
      "field_accuracy": {            // ⚠️ Nested under metrics
        "j_id": 1.0,
        "title": 1.0,
        "categories": 0.0
      }
    }
  }
}
```

### Lessons Learned

1. **Always verify field names**: When implementing features that span multiple services, ensure consistent field naming across the codebase
2. **Test with real data early**: Mock data may not reveal data structure mismatches
3. **Document data schemas**: Include MongoDB schema examples in documentation
4. **Use type checking**: Consider TypeScript/Pydantic for compile-time validation

---

**Phase 3: ✅ COMPLETE**

*Last Updated: December 19, 2025*
*Bugs Fixed: December 19, 2025*

