const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat
} = require("docx");

// ── Colors ──
const TEAL = "0E7C7B";
const NAVY = "0F2B46";
const LIGHT_BG = "F0F7FA";
const BORDER_CLR = "CCCCCC";
const TABLE_HDR = "0E7C7B";
const TABLE_HDR_TEXT = "FFFFFF";

// ── Helpers ──
const border = { style: BorderStyle.SINGLE, size: 1, color: BORDER_CLR };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 60, bottom: 60, left: 100, right: 100 };
const W = 9360; // content width DXA (US Letter 1" margins)

function hdrCell(text, width) {
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    shading: { fill: TABLE_HDR, type: ShadingType.CLEAR },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: TABLE_HDR_TEXT, font: "Arial", size: 20 })] })]
  });
}

function cell(text, width, opts = {}) {
  const runs = [];
  // Support bold prefix like "**text** rest"
  if (opts.bold) {
    runs.push(new TextRun({ text, bold: true, font: "Arial", size: 20, color: opts.color || "333333" }));
  } else {
    runs.push(new TextRun({ text, font: "Arial", size: 20, color: opts.color || "333333" }));
  }
  return new TableCell({
    borders, width: { size: width, type: WidthType.DXA },
    margins: cellMargins,
    shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
    children: [new Paragraph({ children: runs })]
  });
}

function makeTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({ children: headers.map((h, i) => hdrCell(h, colWidths[i])) }),
      ...rows.map(row =>
        new TableRow({ children: row.map((c, i) => cell(c, colWidths[i])) })
      )
    ]
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 36, color: NAVY })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 160 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 28, color: TEAL })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 24, color: NAVY })]
  });
}
function para(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 120 },
    children: [new TextRun({ text, font: "Arial", size: 22, color: "333333", italic: opts.italic, bold: opts.bold })]
  });
}
function richPara(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after || 120 },
    children: runs.map(r => new TextRun({ font: "Arial", size: 22, color: "333333", ...r }))
  });
}
function spacer() {
  return new Paragraph({ spacing: { after: 80 }, children: [] });
}

// ── Build ──
async function build() {
  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 36, bold: true, font: "Arial", color: NAVY },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: "Arial", color: TEAL },
          paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 1 } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 24, bold: true, font: "Arial", color: NAVY },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 2 } },
      ]
    },
    numbering: {
      config: [
        { reference: "bullets", levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ]},
        { reference: "numbers", levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        ]},
        { reference: "steps", levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        ]},
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: TEAL, space: 4 } },
            children: [new TextRun({ text: "ATM V&V Test Copilot", font: "Arial", size: 18, color: TEAL, italic: true })]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 2, color: BORDER_CLR, space: 4 } },
            children: [
              new TextRun({ text: "Workplace Learning With AI  |  Page ", font: "Arial", size: 16, color: "999999" }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: "999999" })
            ]
          })]
        })
      },
      children: [
        // ── TITLE PAGE ──
        spacer(), spacer(), spacer(), spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 80 },
          children: [new TextRun({ text: "ATM V&V Test Copilot", font: "Arial", size: 56, bold: true, color: NAVY })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 8 } },
          children: [new TextRun({ text: "AI-Powered Testing Copilot for Safety-Critical\nATM/ATC Verification & Validation", font: "Arial", size: 26, color: TEAL })]
        }),
        spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { after: 120 },
          children: [new TextRun({ text: "Workplace Learning With AI  |  Ignacio Tejera  |  April 2026", font: "Arial", size: 22, color: "666666" })]
        }),
        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════
        // 1. WHAT IS IT
        // ══════════════════════════════════════
        h1("1. What Is It?"),
        richPara([
          { text: "The " },
          { text: "ATM V&V Test Copilot", bold: true },
          { text: " is an AI-powered agent that assists test engineers in designing, building, and analyzing verification & validation (V&V) workflows for " },
          { text: "Air Traffic Management (ATM)", bold: true },
          { text: " and " },
          { text: "Air Traffic Control (ATC)", bold: true },
          { text: " systems." },
        ]),
        richPara([
          { text: "It is part of the " },
          { text: "Workplace Learning With AI (WLWAI)", bold: true },
          { text: " platform and is accessible from the sidebar under " },
          { text: "Future Item Agents", bold: true, color: TEAL },
          { text: " in AgentOps Studio." },
        ]),

        h2("Key Capabilities"),
        makeTable(
          ["Capability", "Description"],
          [
            ["Requirement Ingestion", "Parse and normalize requirements into structured, testable sections using AI"],
            ["Test Design Generation", "Convert normalized requirements into comprehensive test designs with positive, negative, and edge-case tests"],
            ["Scenario Matrix Building", "Generate ATM-specific scenario matrices with configurable parameters and risk levels"],
            ["Test Run Analysis", "Diagnose test failures from artifacts (logs, JSON, XML) with root cause analysis and severity proposals"],
            ["Export", "Download test designs and scenario matrices as Markdown documents"],
          ],
          [3000, 6360]
        ),

        // ══════════════════════════════════════
        // 2. WHY
        // ══════════════════════════════════════
        h1("2. Why Was It Built?"),
        para("ATM/ATC system validation involves significant challenges:"),
        ...["Complex requirements from safety standards (EUROCAE ED-153, DO-278A) that must be decomposed into verifiable, testable conditions",
            "Scenario complexity with nominal, degraded, and edge-case variations across multiple ATM operational domains",
            "Failure triage where test run failures must be analyzed, root-caused, and prioritized for safety-critical systems",
            "Manual documentation effort for producing test designs, scenario matrices, and traceability artifacts"
        ].map(t => new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 80 },
          children: [new TextRun({ text: t, font: "Arial", size: 22, color: "333333" })]
        })),
        para("The ATM V&V Test Copilot automates these tasks using LLM-powered analysis, reducing manual effort while maintaining safety-aware rigor."),

        // ══════════════════════════════════════
        // 3. THE 4 TABS
        // ══════════════════════════════════════
        h1("3. The 4 Tabs (Tools)"),
        para("The agent presents a tabbed interface with 4 main tools:"),

        // 3.1 Overview
        h2("3.1 Overview (Tab 1)"),
        para("The Overview tab provides a dashboard view of the copilot:"),
        ...["Collection Stats: Live counts of stored requirements, test designs, scenario matrices, and test run analyses",
            "Backend Health Check: Real-time indicator showing whether the backend API is connected",
            "Quick Actions: One-click buttons to navigate to common workflows (ingest, design, build, analyze)",
            "Scenario Categories: Visual grid showing all 7 ATM scenario families with color-coded icons"
        ].map(t => new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 80 },
          children: [
            new TextRun({ text: t.split(":")[0] + ":", font: "Arial", size: 22, bold: true, color: "333333" }),
            new TextRun({ text: t.split(":").slice(1).join(":"), font: "Arial", size: 22, color: "333333" }),
          ]
        })),

        // 3.2 Requirement Lab
        h2("3.2 Requirement Lab (Tab 2)"),
        para("The Requirement Lab is where you ingest requirements and generate test designs."),

        h3("Input: Requirement Ingestion"),
        para("You can ingest requirements from 6 source types:"),
        makeTable(
          ["Source Type", "Use Case"],
          [
            ["Requirement", "Formal system/safety requirement"],
            ["User Story", "Agile user story format"],
            ["Defect", "Bug report or known issue"],
            ["Change Request", "Modification request to existing system"],
            ["Spec Excerpt", "Extract from a specification document"],
            ["Validation Note", "Notes from validation sessions"],
          ],
          [2800, 6560]
        ),
        spacer(),
        para("How it works:", { bold: true }),
        ...["Enter the requirement title, select the source type, paste the content, and optionally add tags",
            "Click \"Ingest & Normalize\"",
            "The AI analyzes the text and extracts: Intent (core purpose), Conditions (preconditions), Constraints (limitations), Expected Behavior (what the system should do)",
            "The normalized requirement is stored in MongoDB"
        ].map(t => new Paragraph({
          numbering: { reference: "numbers", level: 0 },
          spacing: { after: 80 },
          children: [new TextRun({ text: t, font: "Arial", size: 22, color: "333333" })]
        })),

        h3("Output: Test Design Generation"),
        para("From any stored requirement, you can generate a full test design. The AI produces:"),
        makeTable(
          ["Section", "Description"],
          [
            ["Positive Tests", "Verify the system behaves correctly under normal conditions"],
            ["Negative Tests", "Verify the system handles errors and invalid inputs"],
            ["Edge Cases", "Test boundary conditions and unusual scenarios"],
            ["Automation Candidates", "Tests suitable for automated CI/CD pipelines"],
            ["Traceability IDs", "Links back to requirement identifiers"],
            ["Open Questions", "Ambiguities the AI identified that need human clarification"],
          ],
          [3000, 6360]
        ),
        spacer(),
        para("Each test includes: title, description, step-by-step procedure, and expected outcome. Export as Markdown for documentation."),

        // 3.3 Scenario Builder
        h2("3.3 Scenario Builder (Tab 3)"),
        para("The Scenario Builder generates ATM-specific scenario matrices for validation testing."),

        h3("7 ATM Scenario Families"),
        makeTable(
          ["Family", "What It Tests"],
          [
            ["Conflict Detection", "STCA/MTCD alerts, separation violations, conflict resolution"],
            ["Sector Handover", "Transfer of control between ATC sectors"],
            ["Trajectory Update", "Flight plan amendments, route changes, altitude modifications"],
            ["Degraded Surveillance", "Radar/ADS-B failures, reduced surveillance coverage"],
            ["Conformance Monitoring", "Deviation from cleared route, altitude, or speed"],
            ["Alert Timing", "Warning lead times, alert escalation sequences"],
            ["Contingency Fallback", "System failure modes, backup procedures, emergency operations"],
          ],
          [3000, 6360]
        ),
        spacer(),

        h3("Configuration"),
        ...["Risk Level: Low, Medium, or High (affects scenario complexity and safety focus)",
            "Custom Parameters: JSON object for domain-specific variables (e.g., flightCount, altitudeBand, predictionWindowSec)",
            "Edge Case Toggle: Include or exclude edge-case scenarios",
            "Fallback Toggle: Include or exclude contingency/fallback scenarios"
        ].map(t => new Paragraph({
          numbering: { reference: "bullets", level: 0 },
          spacing: { after: 80 },
          children: [
            new TextRun({ text: t.split(":")[0] + ":", font: "Arial", size: 22, bold: true, color: "333333" }),
            new TextRun({ text: t.split(":").slice(1).join(":"), font: "Arial", size: 22, color: "333333" }),
          ]
        })),

        h3("Matrix Output"),
        para("The generated matrix includes: Preconditions, Nominal Scenarios, Degraded Scenarios, Edge Cases, Risk Notes, and Automation Notes. Export as Markdown for documentation and review."),

        // 3.4 Run Analyzer
        h2("3.4 Run Analyzer (Tab 4)"),
        para("The Run Analyzer diagnoses test run failures from uploaded artifacts."),

        h3("Supported Artifact Types"),
        makeTable(
          ["Type", "Description"],
          [
            ["Log", "Server and application log files"],
            ["JSON", "Structured test output or API responses"],
            ["XML", "JUnit/xUnit test reports"],
            ["Console Output", "Terminal or CI pipeline output"],
            ["Screenshot", "Visual evidence of failures"],
          ],
          [2400, 6960]
        ),
        spacer(),

        h3("AI Analysis Output"),
        makeTable(
          ["Section", "What It Contains"],
          [
            ["Run Summary", "High-level overview of the test run results"],
            ["Primary Failure Signals", "Key failure indicators with counts and affected components"],
            ["Root Causes", "Probable causes with confidence levels (High/Medium/Low)"],
            ["Severity Proposal", "Recommended severity: Critical, High, Medium, or Low"],
            ["Repeated Patterns", "Recurring issues found across multiple artifacts"],
            ["Affected Areas", "System components impacted by the failures"],
            ["Next Steps", "Prioritized action items for the test team"],
            ["Regression Scope", "Areas recommended for retesting"],
          ],
          [3000, 6360]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════
        // 4. ARCHITECTURE
        // ══════════════════════════════════════
        h1("4. Architecture"),

        h2("Technology Stack"),
        makeTable(
          ["Layer", "Technology"],
          [
            ["Frontend", "React + react-i18next (EN/NO)"],
            ["Backend", "FastAPI (Python, async)"],
            ["Database", "MongoDB via Motor (async driver)"],
            ["LLM", "ask_ai_unified() \u2014 fallback: ItemAI > OpenRouter > OpenAI"],
            ["JSON Parsing", "3-tier: direct parse > regex extraction > markdown code block"],
          ],
          [2400, 6960]
        ),
        spacer(),

        h2("MongoDB Collections"),
        makeTable(
          ["Collection", "Purpose"],
          [
            ["atm_requirement_bundles", "Stored requirements with normalized sections"],
            ["atm_test_designs", "Generated test designs linked to requirements"],
            ["atm_scenario_matrices", "Generated scenario matrices with parameters"],
            ["atm_test_runs", "Test run analysis results"],
          ],
          [4000, 5360]
        ),

        // ══════════════════════════════════════
        // 5. API ENDPOINTS
        // ══════════════════════════════════════
        h1("5. API Endpoints"),
        richPara([
          { text: "All 17 endpoints are under the base path " },
          { text: "/api/atm-copilot/", bold: true, color: TEAL },
        ]),

        h3("Requirements"),
        makeTable(
          ["Method", "Endpoint", "Description"],
          [
            ["POST", "/requirements/ingest", "Ingest & normalize a requirement"],
            ["GET", "/requirements", "List requirement bundles"],
            ["GET", "/requirements/{id}", "Get single requirement by ID"],
            ["DELETE", "/requirements/{id}", "Delete requirement"],
          ],
          [1200, 3800, 4360]
        ),
        spacer(),

        h3("Test Designs"),
        makeTable(
          ["Method", "Endpoint", "Description"],
          [
            ["POST", "/designs/generate", "Generate test design from requirement"],
            ["GET", "/designs", "List test designs"],
            ["GET", "/designs/{id}/export/markdown", "Export design as Markdown"],
            ["DELETE", "/designs/{id}", "Delete design"],
          ],
          [1200, 3800, 4360]
        ),
        spacer(),

        h3("Scenario Matrices"),
        makeTable(
          ["Method", "Endpoint", "Description"],
          [
            ["POST", "/scenarios/build", "Build scenario matrix"],
            ["GET", "/scenarios", "List scenario matrices"],
            ["GET", "/scenarios/{id}/export/markdown", "Export matrix as Markdown"],
            ["DELETE", "/scenarios/{id}", "Delete scenario"],
          ],
          [1200, 3800, 4360]
        ),
        spacer(),

        h3("Test Run Analysis"),
        makeTable(
          ["Method", "Endpoint", "Description"],
          [
            ["POST", "/runs/analyze", "Analyze test run artifacts"],
            ["GET", "/runs", "List run analyses"],
            ["DELETE", "/runs/{id}", "Delete run analysis"],
          ],
          [1200, 3800, 4360]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════
        // 6. HOW TO USE
        // ══════════════════════════════════════
        h1("6. How to Use It (Step by Step)"),

        h2("Step 1: Ingest a Requirement"),
        ...["Open the ATM V&V Test Copilot from the sidebar (Future Item Agents)",
            "Go to the Requirement Lab tab",
            "Fill in: Title, Source Type, Content, and Tags",
            "Click \"Ingest & Normalize\"",
            "Review the normalized sections (intent, conditions, constraints, expected behavior)"
        ].map(t => new Paragraph({
          numbering: { reference: "steps", level: 0 },
          spacing: { after: 80 },
          children: [new TextRun({ text: t, font: "Arial", size: 22, color: "333333" })]
        })),

        h2("Step 2: Generate a Test Design"),
        ...["In the Requirement Lab tab, find your stored requirement",
            "Click \"Generate Design\"",
            "Wait for the AI to generate the test design (typically 5\u201315 seconds)",
            "Review the generated tests (positive, negative, edge cases, open questions)",
            "Click \"Export Markdown\" to download for documentation"
        ].map(t => new Paragraph({
          numbering: { reference: "steps", level: 0 },
          spacing: { after: 80 },
          children: [new TextRun({ text: t, font: "Arial", size: 22, color: "333333" })]
        })),

        h2("Step 3: Build a Scenario Matrix"),
        ...["Go to the Scenario Builder tab",
            "Select a Scenario Type (e.g., Conflict Detection)",
            "Set the Risk Level (Low/Medium/High)",
            "Optionally add Custom Parameters as JSON, e.g.: {\"flightCount\": 5, \"altitudeBand\": \"FL350-FL390\"}",
            "Toggle edge cases and fallbacks as needed",
            "Click \"Build Scenario Matrix\"",
            "Click \"Export Markdown\" to download"
        ].map(t => new Paragraph({
          numbering: { reference: "steps", level: 0 },
          spacing: { after: 80 },
          children: [new TextRun({ text: t, font: "Arial", size: 22, color: "333333" })]
        })),

        h2("Step 4: Analyze a Test Run"),
        ...["Go to the Run Analyzer tab",
            "Enter a Run ID (e.g., RUN-2026-0409-001)",
            "Add artifacts: click \"+ Add Artifact\", select type, paste content",
            "Click \"Analyze Test Run\"",
            "Review: Failure Signals, Root Causes, Severity, Next Steps, Regression Scope"
        ].map(t => new Paragraph({
          numbering: { reference: "steps", level: 0 },
          spacing: { after: 80 },
          children: [new TextRun({ text: t, font: "Arial", size: 22, color: "333333" })]
        })),

        // ══════════════════════════════════════
        // 7. GRACEFUL DEGRADATION
        // ══════════════════════════════════════
        h1("7. Graceful Degradation"),
        para("The copilot is designed to work even when components are unavailable:"),
        makeTable(
          ["Scenario", "Behavior"],
          [
            ["LLM unavailable", "Normalization falls back to basic fields. Design/scenario/analysis return fallback status"],
            ["Backend offline", "Frontend shows offline indicator. Forms remain usable for reconnection"],
            ["MongoDB unavailable", "API returns HTTP errors. No silent data loss"],
          ],
          [2400, 6960]
        ),

        // ══════════════════════════════════════
        // 8. LLM INTEGRATION
        // ══════════════════════════════════════
        h1("8. LLM Integration"),
        para("The copilot uses 4 specialized prompts, one for each tool:"),
        makeTable(
          ["Prompt", "Purpose", "Tokens", "Temp"],
          [
            ["REQUIREMENT_NORMALIZE", "Extract intent, conditions, constraints, expected behavior", "512", "0.1"],
            ["TEST_DESIGN", "Generate positive/negative/edge tests with steps", "1024", "0.3"],
            ["SCENARIO_BUILDER", "Build nominal/degraded/edge scenarios", "1024", "0.3"],
            ["RUN_ANALYZER", "Diagnose failures from artifacts", "1024", "0.2"],
          ],
          [2200, 4760, 1200, 1200]
        ),
        spacer(),
        para("All prompts instruct the LLM to return JSON only, parsed by a 3-tier strategy: direct parse, regex extraction, and markdown code block fallback."),

        // ══════════════════════════════════════
        // 9. i18n
        // ══════════════════════════════════════
        h1("9. Internationalization (i18n)"),
        richPara([
          { text: "The entire UI is translated into " },
          { text: "English (EN)", bold: true, color: TEAL },
          { text: " and " },
          { text: "Norwegian (NO)", bold: true, color: TEAL },
          { text: " with 120+ translation keys covering: tab labels, form fields, buttons, all 7 scenario families, all 6 source types, risk levels, artifact types, and analysis output labels." },
        ]),

        // ══════════════════════════════════════
        // 10. PROJECT FILES
        // ══════════════════════════════════════
        h1("10. Project Files"),

        h2("Backend"),
        makeTable(
          ["File", "Description"],
          [
            ["backend/services/atm_copilot.py", "Service layer: 4 LLM tools, CRUD helpers, Markdown export (~400 lines)"],
            ["backend/routers/atm_copilot.py", "REST router: 17 endpoints with Pydantic request models"],
            ["backend/db.py", "4 MongoDB collection definitions"],
            ["backend/app.py", "Router registration"],
          ],
          [4000, 5360]
        ),
        spacer(),

        h2("Frontend"),
        makeTable(
          ["File", "Description"],
          [
            ["frontend/src/AtmVvTestCopilot.jsx", "Main component with 4-tab navigation"],
            ["frontend/src/atm-copilot/Overview.jsx", "Overview tab (stats, health, quick actions)"],
            ["frontend/src/atm-copilot/RequirementLab.jsx", "Requirement Lab tab (ingest + test design)"],
            ["frontend/src/atm-copilot/ScenarioBuilder.jsx", "Scenario Builder tab (configurator + matrix)"],
            ["frontend/src/atm-copilot/RunAnalyzer.jsx", "Run Analyzer tab (artifact upload + analysis)"],
          ],
          [4600, 4760]
        ),

        // ══════════════════════════════════════
        // 11. RUNNING
        // ══════════════════════════════════════
        h1("11. Running the Application"),

        h2("Start the Backend"),
        para("From the repository root:", { bold: true }),
        new Paragraph({
          spacing: { after: 120 },
          shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
          children: [new TextRun({ text: "python -m uvicorn backend.app:app --reload --host 0.0.0.0 --port 8000", font: "Consolas", size: 20, color: NAVY })]
        }),

        h2("Start the Frontend"),
        new Paragraph({
          spacing: { after: 120 },
          shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
          children: [new TextRun({ text: "cd frontend && npm start", font: "Consolas", size: 20, color: NAVY })]
        }),

        h2("Verify the Agent"),
        ...["Open http://localhost:3000 in your browser",
            "In the sidebar, expand Future Item Agents",
            "Click ATM V&V Test Copilot",
            "The Overview tab should show stats and a green \"Backend connected\" indicator"
        ].map(t => new Paragraph({
          numbering: { reference: "steps", level: 0 },
          spacing: { after: 80 },
          children: [new TextRun({ text: t, font: "Arial", size: 22, color: "333333" })]
        })),

        spacer(),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: TEAL, space: 8 } },
          spacing: { before: 400 },
          children: [new TextRun({ text: "MVP Implemented  |  ATM/ATC V&V Testing  |  Ignacio Tejera  |  April 2026", font: "Arial", size: 20, color: "999999", italic: true })]
        }),
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = process.argv[2] || "ATM VV Test Copilot.docx";
  fs.writeFileSync(outPath, buffer);
  console.log("Document saved to:", outPath);
}

build().catch(e => { console.error(e); process.exit(1); });
