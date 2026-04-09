const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const path = require("path");
const {
  FaPlane, FaClipboardList, FaFlask, FaMapMarkedAlt, FaSearchPlus,
  FaDatabase, FaBrain, FaFileExport, FaShieldAlt, FaServer,
  FaExclamationTriangle, FaCheckCircle, FaCogs, FaArrowRight,
  FaChartBar, FaCode, FaRocket, FaLayerGroup
} = require("react-icons/fa");

// ── Color Palette: Aviation / ATM theme ──
const C = {
  navy:      "0F2B46",
  darkTeal:  "0D4F4F",
  teal:      "0E7C7B",
  lightTeal: "17BEBB",
  sky:       "D4F1F9",
  white:     "FFFFFF",
  offWhite:  "F0F7FA",
  lightGray: "E8EFF3",
  darkText:  "1A2332",
  bodyText:  "2D3E50",
  mutedText: "6B8299",
  red:       "E63946",
  amber:     "F4A261",
  green:     "2A9D8F",
  purple:    "6C63FF",
};

// ── Screenshots paths ──
const MEDIA = path.resolve(__dirname);
const SCREENSHOTS = {
  overview:   path.join(MEDIA, "ATM Overview.png"),
  agentOps:   path.join(MEDIA, "Agent Ops Studio.png"),
  reqLab:     path.join(MEDIA, "ATM Requirement Lab.png"),
  scenario:   path.join(MEDIA, "ATM Scenario Builder.png"),
  runAnalyzer:path.join(MEDIA, "ATM Run Analizer.png"),
};

// ── Icon helper ──
function renderIconSvg(Icon, color, size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(Icon, { color, size: String(size) })
  );
}
async function icon64(Icon, color, size = 256) {
  const svg = renderIconSvg(Icon, color, size);
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ── Shadow factory (never reuse objects) ──
const mkShadow = () => ({ type: "outer", blur: 6, offset: 2, angle: 135, color: "000000", opacity: 0.12 });

async function build() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "Claude Code";
  pres.title = "ATM V&V Test Copilot";

  // Pre-render icons
  const icons = {
    plane:     await icon64(FaPlane,              "#" + C.white),
    clipboard: await icon64(FaClipboardList,      "#" + C.white),
    flask:     await icon64(FaFlask,              "#" + C.white),
    map:       await icon64(FaMapMarkedAlt,       "#" + C.white),
    search:    await icon64(FaSearchPlus,         "#" + C.white),
    db:        await icon64(FaDatabase,           "#" + C.teal),
    brain:     await icon64(FaBrain,              "#" + C.teal),
    exportIc:  await icon64(FaFileExport,         "#" + C.teal),
    warn:      await icon64(FaExclamationTriangle,"#" + C.amber),
    check:     await icon64(FaCheckCircle,        "#" + C.green),
    cogs:      await icon64(FaCogs,               "#" + C.teal),
    arrow:     await icon64(FaArrowRight,         "#" + C.lightTeal),
    layers:    await icon64(FaLayerGroup,         "#" + C.teal),
    rocketTeal:await icon64(FaRocket,             "#" + C.teal),
    clipTeal:  await icon64(FaClipboardList,      "#" + C.teal),
    flaskTeal: await icon64(FaFlask,              "#" + C.teal),
    mapTeal:   await icon64(FaMapMarkedAlt,       "#" + C.teal),
    searchTeal:await icon64(FaSearchPlus,         "#" + C.teal),
    shieldTeal:await icon64(FaShieldAlt,          "#" + C.teal),
  };

  // ════════════════════════════════════════════════════════════════
  // SLIDE 1 — Title
  // ════════════════════════════════════════════════════════════════
  let s = pres.addSlide();
  s.background = { color: C.navy };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.lightTeal } });
  s.addImage({ data: icons.plane, x: 4.25, y: 0.8, w: 1.5, h: 1.5 });
  s.addText("ATM V&V Test Copilot", {
    x: 0.5, y: 2.5, w: 9, h: 0.8, fontSize: 40, fontFace: "Trebuchet MS",
    color: C.white, bold: true, align: "center", margin: 0
  });
  s.addText("AI-Powered Testing Copilot for Safety-Critical\nATM/ATC Verification & Validation", {
    x: 1, y: 3.4, w: 8, h: 0.8, fontSize: 18, fontFace: "Calibri",
    color: C.lightTeal, align: "center", lineSpacing: 26
  });
  s.addShape(pres.shapes.LINE, { x: 3.5, y: 4.5, w: 3, h: 0, line: { color: C.teal, width: 1.5 } });
  s.addText("Workplace Learning With AI  |  April 2026", {
    x: 1, y: 4.7, w: 8, h: 0.4, fontSize: 12, fontFace: "Calibri",
    color: C.mutedText, align: "center"
  });

  // ════════════════════════════════════════════════════════════════
  // SLIDE 2 — Product Overview (with screenshot)
  // ════════════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.offWhite };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.lightTeal } });
  s.addText("The Copilot at a Glance", {
    x: 0.7, y: 0.25, w: 8, h: 0.55, fontSize: 30, fontFace: "Trebuchet MS",
    color: C.navy, bold: true, margin: 0
  });
  s.addText("Overview dashboard with stats, quick actions, and 7 ATM scenario categories", {
    x: 0.7, y: 0.8, w: 8, h: 0.35, fontSize: 13, fontFace: "Calibri", color: C.mutedText, margin: 0
  });
  // Overview screenshot — 605x367 ratio=1.65 → display at ~8.4" wide, ~5.1" high → scale to fit
  // Available area: y=1.3 to y=5.5 (4.2" tall), x centered in 10"
  // At 4.0" tall → width = 4.0 * 1.65 = 6.6"
  const ovW = 8.0, ovH = ovW / 1.65;
  s.addShape(pres.shapes.RECTANGLE, {
    x: (10 - ovW) / 2 - 0.08, y: 1.25 - 0.08, w: ovW + 0.16, h: ovH + 0.16,
    fill: { color: C.white }, shadow: mkShadow()
  });
  s.addImage({
    path: SCREENSHOTS.overview,
    x: (10 - ovW) / 2, y: 1.25, w: ovW, h: ovH
  });

  // ════════════════════════════════════════════════════════════════
  // SLIDE 3 — The Problem
  // ════════════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.offWhite };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.lightTeal } });
  s.addText("The Challenge", {
    x: 0.7, y: 0.35, w: 8, h: 0.6, fontSize: 32, fontFace: "Trebuchet MS",
    color: C.navy, bold: true, margin: 0
  });
  s.addText("ATM/ATC system validation is complex, safety-critical, and manually intensive", {
    x: 0.7, y: 0.95, w: 8, h: 0.4, fontSize: 14, fontFace: "Calibri", color: C.mutedText, margin: 0
  });

  const problems = [
    { icon: icons.clipTeal, title: "Complex Requirements", desc: "Safety standards (EUROCAE ED-153, DO-278A)\nmust be decomposed into testable conditions" },
    { icon: icons.mapTeal, title: "Scenario Complexity", desc: "Nominal, degraded, and edge-case variations\nacross multiple ATM operational domains" },
    { icon: icons.searchTeal, title: "Failure Triage", desc: "Test run failures must be root-caused and\nprioritized for safety-critical systems" },
    { icon: icons.flaskTeal, title: "Manual Documentation", desc: "Test designs and scenario matrices require\nextensive manual effort to produce and maintain" },
  ];
  problems.forEach((p, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = 0.7 + col * 4.5;
    const cy = 1.7 + row * 1.7;
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: cy, w: 4.2, h: 1.4, fill: { color: C.white }, shadow: mkShadow()
    });
    s.addImage({ data: p.icon, x: cx + 0.25, y: cy + 0.3, w: 0.45, h: 0.45 });
    s.addText(p.title, {
      x: cx + 0.85, y: cy + 0.2, w: 3.1, h: 0.35,
      fontSize: 15, fontFace: "Calibri", bold: true, color: C.navy, margin: 0
    });
    s.addText(p.desc, {
      x: cx + 0.85, y: cy + 0.55, w: 3.1, h: 0.7,
      fontSize: 12, fontFace: "Calibri", color: C.bodyText, margin: 0, lineSpacing: 17
    });
  });

  // ════════════════════════════════════════════════════════════════
  // SLIDE 4 — The Solution (4 Tools + AgentOps screenshot)
  // ════════════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.offWhite };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.lightTeal } });
  s.addText("The Solution: 4 AI-Powered Tools", {
    x: 0.7, y: 0.25, w: 6, h: 0.55, fontSize: 28, fontFace: "Trebuchet MS",
    color: C.navy, bold: true, margin: 0
  });

  const tools = [
    { icon: icons.clipboard, bg: C.teal,     title: "Requirement\nLab",    desc: "Ingest & normalize\nrequirements with AI" },
    { icon: icons.flask,     bg: "2A6F97",   title: "Test Design\nGenerator", desc: "Positive, negative,\n& edge-case tests" },
    { icon: icons.map,       bg: C.purple,   title: "Scenario\nBuilder",  desc: "ATM scenario matrices\n7 scenario families" },
    { icon: icons.search,    bg: C.red,      title: "Run\nAnalyzer",      desc: "AI failure diagnosis\n& root cause analysis" },
  ];

  // 4 tool cards on the left side
  tools.forEach((t, i) => {
    const cx = 0.35 + i * 1.45;
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: 1.05, w: 1.28, h: 2.4, fill: { color: t.bg }, shadow: mkShadow()
    });
    s.addImage({ data: t.icon, x: cx + 0.3, y: 1.25, w: 0.65, h: 0.65 });
    s.addText(t.title, {
      x: cx + 0.04, y: 2.05, w: 1.2, h: 0.55,
      fontSize: 12, fontFace: "Calibri", bold: true, color: C.white,
      align: "center", valign: "middle", lineSpacing: 16, margin: 0
    });
    s.addText(t.desc, {
      x: cx + 0.04, y: 2.65, w: 1.2, h: 0.55,
      fontSize: 9.5, fontFace: "Calibri", color: C.white,
      align: "center", lineSpacing: 14, margin: 0
    });
    if (i < 3) {
      s.addImage({ data: icons.arrow, x: cx + 1.28, y: 2.0, w: 0.2, h: 0.2 });
    }
  });

  // AgentOps Studio screenshot on the right — shows sidebar context
  // 605x342 ratio=1.77 → display at 3.8" wide
  const aoW = 3.8, aoH = aoW / 1.77;
  s.addShape(pres.shapes.RECTANGLE, {
    x: 6.1 - 0.06, y: 1.05 - 0.06, w: aoW + 0.12, h: aoH + 0.12,
    fill: { color: C.white }, shadow: mkShadow()
  });
  s.addImage({ path: SCREENSHOTS.agentOps, x: 6.1, y: 1.05, w: aoW, h: aoH });
  s.addText("AgentOps Studio — Sidebar Integration", {
    x: 6.1, y: 1.05 + aoH + 0.1, w: aoW, h: 0.3,
    fontSize: 10, fontFace: "Calibri", color: C.mutedText, align: "center", italic: true, margin: 0
  });

  s.addText("Each tool uses LLM-powered analysis with graceful degradation when AI is unavailable", {
    x: 0.5, y: 5.05, w: 9, h: 0.3, fontSize: 11, fontFace: "Calibri",
    color: C.mutedText, italic: true, align: "center"
  });

  // ════════════════════════════════════════════════════════════════
  // SLIDE 5 — Requirement Lab (with screenshot)
  // ════════════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.offWhite };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.lightTeal } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.06, w: 10, h: 1.0, fill: { color: C.navy } });
  s.addImage({ data: icons.clipboard, x: 0.7, y: 0.22, w: 0.55, h: 0.55 });
  s.addText("Requirement Lab", {
    x: 1.4, y: 0.18, w: 5, h: 0.45, fontSize: 26, fontFace: "Trebuchet MS",
    color: C.white, bold: true, margin: 0
  });
  s.addText("Ingest, normalize, and generate test designs from requirements", {
    x: 1.4, y: 0.63, w: 7, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.lightTeal, margin: 0
  });

  // Left: Content
  // Source types
  s.addText("6 Source Types", {
    x: 0.5, y: 1.25, w: 3, h: 0.35, fontSize: 15, fontFace: "Calibri",
    bold: true, color: C.navy, margin: 0
  });
  const sourceTypes = ["Requirement", "User Story", "Defect", "Change Request", "Spec Excerpt", "Validation Note"];
  sourceTypes.forEach((st, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5 + col * 1.85, y: 1.65 + row * 0.34, w: 1.72, h: 0.28, fill: { color: C.sky }
    });
    s.addText(st, {
      x: 0.5 + col * 1.85, y: 1.65 + row * 0.34, w: 1.72, h: 0.28,
      fontSize: 10, fontFace: "Calibri", color: C.navy, align: "center", valign: "middle", margin: 0
    });
  });

  // AI normalization
  s.addText("AI Normalization", {
    x: 0.5, y: 2.8, w: 3, h: 0.3, fontSize: 14, fontFace: "Calibri",
    bold: true, color: C.teal, margin: 0
  });
  const normFields = ["Intent", "Conditions", "Constraints", "Expected Behavior"];
  normFields.forEach((f, i) => {
    s.addImage({ data: icons.check, x: 0.6, y: 3.15 + i * 0.28, w: 0.18, h: 0.18 });
    s.addText(f, {
      x: 0.85, y: 3.15 + i * 0.28, w: 2.5, h: 0.22,
      fontSize: 11, fontFace: "Calibri", color: C.bodyText, margin: 0
    });
  });

  // Test Design output
  s.addText("Test Design Output", {
    x: 0.5, y: 4.35, w: 3, h: 0.3, fontSize: 14, fontFace: "Calibri",
    bold: true, color: C.teal, margin: 0
  });
  const outputs = [
    { label: "Positive Tests", color: C.green },
    { label: "Negative Tests", color: C.red },
    { label: "Edge Cases", color: C.amber },
    { label: "Automation Candidates", color: C.purple },
    { label: "Open Questions", color: C.mutedText },
  ];
  outputs.forEach((o, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5 + (i % 3) * 1.35, y: 4.7 + Math.floor(i / 3) * 0.32, w: 0.08, h: 0.22, fill: { color: o.color }
    });
    s.addText(o.label, {
      x: 0.65 + (i % 3) * 1.35, y: 4.7 + Math.floor(i / 3) * 0.32, w: 1.3, h: 0.22,
      fontSize: 10, fontFace: "Calibri", color: C.darkText, margin: 0
    });
  });

  // Screenshot right side — 605x656 ratio=0.92 → tall image
  // Available: x=4.5 to x=9.8 (5.3"), y=1.15 to y=5.4 (4.25")
  // At 4.1" tall → width = 4.1 * 0.92 = 3.77"
  const rlH = 4.1, rlW = rlH * 0.92;
  s.addShape(pres.shapes.RECTANGLE, {
    x: 10 - rlW - 0.5 - 0.06, y: 1.15 - 0.06, w: rlW + 0.12, h: rlH + 0.12,
    fill: { color: C.white }, shadow: mkShadow()
  });
  s.addImage({
    path: SCREENSHOTS.reqLab,
    x: 10 - rlW - 0.5, y: 1.15, w: rlW, h: rlH
  });

  // ════════════════════════════════════════════════════════════════
  // SLIDE 6 — Scenario Builder (with screenshot)
  // ════════════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.offWhite };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.lightTeal } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.06, w: 10, h: 1.0, fill: { color: C.navy } });
  s.addImage({ data: icons.map, x: 0.7, y: 0.22, w: 0.55, h: 0.55 });
  s.addText("Scenario Builder", {
    x: 1.4, y: 0.18, w: 5, h: 0.45, fontSize: 26, fontFace: "Trebuchet MS",
    color: C.white, bold: true, margin: 0
  });
  s.addText("Generate ATM scenario matrices with configurable parameters and risk levels", {
    x: 1.4, y: 0.63, w: 7, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.lightTeal, margin: 0
  });

  // Screenshot on the right — 605x576 ratio=1.05 → nearly square
  // At 4.1" tall → width = 4.1 * 1.05 = 4.3"
  const scH = 4.1, scW = scH * 1.05;
  s.addShape(pres.shapes.RECTANGLE, {
    x: 10 - scW - 0.4 - 0.06, y: 1.2 - 0.06, w: scW + 0.12, h: scH + 0.12,
    fill: { color: C.white }, shadow: mkShadow()
  });
  s.addImage({
    path: SCREENSHOTS.scenario,
    x: 10 - scW - 0.4, y: 1.2, w: scW, h: scH
  });

  // Left content: 7 Scenario Families
  s.addText("7 ATM Scenario Families", {
    x: 0.5, y: 1.25, w: 4, h: 0.35, fontSize: 15, fontFace: "Calibri",
    bold: true, color: C.navy, margin: 0
  });
  const scenarios = [
    { name: "Conflict Detection",       color: C.red },
    { name: "Sector Handover",          color: "2A6F97" },
    { name: "Trajectory Update",        color: C.purple },
    { name: "Degraded Surveillance",    color: C.amber },
    { name: "Conformance Monitoring",   color: C.green },
    { name: "Alert Timing",            color: "D62839" },
    { name: "Contingency Fallback",    color: C.teal },
  ];
  scenarios.forEach((sc, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.7 + i * 0.37, w: 3.6, h: 0.3,
      fill: { color: sc.color, transparency: 12 }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.7 + i * 0.37, w: 0.07, h: 0.3, fill: { color: sc.color }
    });
    s.addText(sc.name, {
      x: 0.7, y: 1.7 + i * 0.37, w: 3.3, h: 0.3,
      fontSize: 11, fontFace: "Calibri", color: C.darkText, valign: "middle", margin: 0
    });
  });

  // Configuration & Output
  s.addText("Configuration", {
    x: 0.5, y: 4.4, w: 3, h: 0.3, fontSize: 13, fontFace: "Calibri",
    bold: true, color: C.teal, margin: 0
  });
  const configs = ["Risk Level: Low / Medium / High", "Custom JSON parameters", "Edge case & fallback toggles"];
  configs.forEach((c, i) => {
    s.addImage({ data: icons.cogs, x: 0.6, y: 4.75 + i * 0.26, w: 0.16, h: 0.16 });
    s.addText(c, {
      x: 0.85, y: 4.75 + i * 0.26, w: 3, h: 0.2,
      fontSize: 10, fontFace: "Calibri", color: C.bodyText, margin: 0
    });
  });

  // ════════════════════════════════════════════════════════════════
  // SLIDE 7 — Run Analyzer (with screenshot)
  // ════════════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.offWhite };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.lightTeal } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.06, w: 10, h: 1.0, fill: { color: C.navy } });
  s.addImage({ data: icons.search, x: 0.7, y: 0.22, w: 0.55, h: 0.55 });
  s.addText("Run Analyzer", {
    x: 1.4, y: 0.18, w: 5, h: 0.45, fontSize: 26, fontFace: "Trebuchet MS",
    color: C.white, bold: true, margin: 0
  });
  s.addText("Upload test artifacts, get AI-powered failure diagnosis and next steps", {
    x: 1.4, y: 0.63, w: 7, h: 0.3, fontSize: 12, fontFace: "Calibri", color: C.lightTeal, margin: 0
  });

  // Screenshot on the right — 605x597 ratio=1.01 → nearly square
  const raH = 4.1, raW = raH * 1.01;
  s.addShape(pres.shapes.RECTANGLE, {
    x: 10 - raW - 0.4 - 0.06, y: 1.2 - 0.06, w: raW + 0.12, h: raH + 0.12,
    fill: { color: C.white }, shadow: mkShadow()
  });
  s.addImage({
    path: SCREENSHOTS.runAnalyzer,
    x: 10 - raW - 0.4, y: 1.2, w: raW, h: raH
  });

  // Left: Artifact types
  s.addText("Supported Artifacts", {
    x: 0.5, y: 1.25, w: 4, h: 0.35, fontSize: 15, fontFace: "Calibri",
    bold: true, color: C.navy, margin: 0
  });
  const artTypes = [
    { name: "Log Files", desc: "Server & application logs" },
    { name: "JSON Results", desc: "Structured test output" },
    { name: "XML Reports", desc: "JUnit / xUnit reports" },
    { name: "Console Output", desc: "Terminal / CI output" },
    { name: "Screenshots", desc: "Visual evidence" },
  ];
  artTypes.forEach((a, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.7 + i * 0.34, w: 0.07, h: 0.26, fill: { color: C.lightTeal }
    });
    s.addText(a.name, {
      x: 0.7, y: 1.7 + i * 0.34, w: 1.4, h: 0.26,
      fontSize: 11, fontFace: "Calibri", bold: true, color: C.darkText, valign: "middle", margin: 0
    });
    s.addText(a.desc, {
      x: 2.15, y: 1.7 + i * 0.34, w: 2, h: 0.26,
      fontSize: 10, fontFace: "Calibri", color: C.mutedText, valign: "middle", margin: 0
    });
  });

  // Analysis output
  s.addText("AI Analysis Output", {
    x: 0.5, y: 3.55, w: 4, h: 0.3, fontSize: 14, fontFace: "Calibri",
    bold: true, color: C.teal, margin: 0
  });
  const analysisItems = [
    { label: "Failure Signals", color: C.red },
    { label: "Root Causes", color: C.purple },
    { label: "Severity Proposal", color: C.amber },
    { label: "Repeated Patterns", color: "8B5E3C" },
    { label: "Affected Areas", color: C.navy },
    { label: "Next Steps", color: C.green },
    { label: "Regression Scope", color: C.lightTeal },
  ];
  analysisItems.forEach((a, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 3.9 + i * 0.24, w: 0.08, h: 0.18, fill: { color: a.color }
    });
    s.addText(a.label, {
      x: 0.7, y: 3.9 + i * 0.24, w: 3.3, h: 0.2,
      fontSize: 10, fontFace: "Calibri", color: C.darkText, margin: 0
    });
  });

  // ════════════════════════════════════════════════════════════════
  // SLIDE 8 — Architecture
  // ════════════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.offWhite };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.lightTeal } });
  s.addText("Architecture", {
    x: 0.7, y: 0.35, w: 8, h: 0.6, fontSize: 32, fontFace: "Trebuchet MS",
    color: C.navy, bold: true, margin: 0
  });

  // Frontend box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.2, w: 3.8, h: 2.0, fill: { color: C.white }, shadow: mkShadow()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.2, w: 3.8, h: 0.45, fill: { color: C.lightTeal }
  });
  s.addText("React Frontend", {
    x: 0.7, y: 1.2, w: 3.6, h: 0.45, fontSize: 14, fontFace: "Calibri",
    bold: true, color: C.white, valign: "middle", margin: 0
  });
  const feComps = ["AtmVvTestCopilot.jsx (main)", "Overview.jsx", "RequirementLab.jsx", "ScenarioBuilder.jsx", "RunAnalyzer.jsx"];
  feComps.forEach((c, i) => {
    s.addText(c, {
      x: 0.8, y: 1.75 + i * 0.27, w: 3.4, h: 0.22,
      fontSize: 10, fontFace: "Consolas", color: C.bodyText, margin: 0
    });
  });

  // Arrow
  s.addText("REST API (17 endpoints)", {
    x: 0.6, y: 3.3, w: 3.8, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: C.teal, align: "center", bold: true, margin: 0
  });

  // Backend box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 3.7, w: 3.8, h: 1.6, fill: { color: C.white }, shadow: mkShadow()
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 3.7, w: 3.8, h: 0.45, fill: { color: C.navy }
  });
  s.addText("FastAPI Backend", {
    x: 0.7, y: 3.7, w: 3.6, h: 0.45, fontSize: 14, fontFace: "Calibri",
    bold: true, color: C.white, valign: "middle", margin: 0
  });
  const beComps = ["routers/atm_copilot.py", "services/atm_copilot.py", "db.py (4 collections)"];
  beComps.forEach((c, i) => {
    s.addText(c, {
      x: 0.8, y: 4.25 + i * 0.3, w: 3.4, h: 0.22,
      fontSize: 10, fontFace: "Consolas", color: C.bodyText, margin: 0
    });
  });

  // MongoDB box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.5, y: 1.2, w: 4.0, h: 2.2, fill: { color: C.white }, shadow: mkShadow()
  });
  s.addImage({ data: icons.db, x: 5.7, y: 1.4, w: 0.4, h: 0.4 });
  s.addText("MongoDB", {
    x: 6.2, y: 1.4, w: 3, h: 0.4, fontSize: 16, fontFace: "Calibri",
    bold: true, color: C.teal, valign: "middle", margin: 0
  });
  const collections = ["atm_requirement_bundles", "atm_test_designs", "atm_scenario_matrices", "atm_test_runs"];
  collections.forEach((c, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.7, y: 2.0 + i * 0.32, w: 3.6, h: 0.26, fill: { color: C.sky }
    });
    s.addText(c, {
      x: 5.7, y: 2.0 + i * 0.32, w: 3.6, h: 0.26,
      fontSize: 10, fontFace: "Consolas", color: C.navy, align: "center", valign: "middle", margin: 0
    });
  });

  // LLM box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.5, y: 3.7, w: 4.0, h: 1.6, fill: { color: C.white }, shadow: mkShadow()
  });
  s.addImage({ data: icons.brain, x: 5.7, y: 3.9, w: 0.4, h: 0.4 });
  s.addText("LLM Engine", {
    x: 6.2, y: 3.9, w: 3, h: 0.4, fontSize: 16, fontFace: "Calibri",
    bold: true, color: C.teal, valign: "middle", margin: 0
  });
  s.addText([
    { text: "ask_ai_unified() fallback chain:", options: { bold: true, breakLine: true, fontSize: 11, color: C.darkText } },
    { text: "ItemAI (local) > OpenRouter > OpenAI", options: { fontSize: 11, color: C.bodyText, breakLine: true } },
    { text: "3-tier JSON parser: direct > regex > markdown", options: { fontSize: 10, color: C.mutedText } },
  ], { x: 5.7, y: 4.4, w: 3.6, h: 0.7, fontFace: "Calibri", margin: 0 });

  // ════════════════════════════════════════════════════════════════
  // SLIDE 9 — API Endpoints
  // ════════════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.offWhite };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.lightTeal } });
  s.addText("API Endpoints — 17 Routes", {
    x: 0.7, y: 0.25, w: 8, h: 0.5, fontSize: 28, fontFace: "Trebuchet MS",
    color: C.navy, bold: true, margin: 0
  });
  s.addText("Base path: /api/atm-copilot/", {
    x: 0.7, y: 0.75, w: 8, h: 0.3, fontSize: 13, fontFace: "Consolas", color: C.teal, margin: 0
  });

  const endpointGroups = [
    { title: "General", color: C.teal, endpoints: ["GET  /health", "GET  /stats"] },
    { title: "Requirements", color: "2A6F97", endpoints: ["POST /requirements/ingest", "GET  /requirements", "GET  /requirements/{id}", "DEL  /requirements/{id}"] },
    { title: "Test Designs", color: C.green, endpoints: ["POST /designs/generate", "GET  /designs", "GET  /designs/{id}/export/md", "DEL  /designs/{id}"] },
    { title: "Scenarios", color: C.purple, endpoints: ["POST /scenarios/build", "GET  /scenarios", "GET  /scenarios/{id}/export/md", "DEL  /scenarios/{id}"] },
    { title: "Run Analysis", color: C.red, endpoints: ["POST /runs/analyze", "GET  /runs", "DEL  /runs/{id}"] },
  ];

  endpointGroups.forEach((g, gi) => {
    const cx = gi < 3 ? 0.5 + gi * 3.1 : 0.5 + (gi - 3) * 3.1 + 1.55;
    const cy = gi < 3 ? 1.2 : 3.4;
    const h = g.endpoints.length * 0.26 + 0.55;
    const w = 2.9;

    s.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: cy, w: w, h: h, fill: { color: C.white }, shadow: mkShadow()
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: cy, w: w, h: 0.38, fill: { color: g.color }
    });
    s.addText(g.title, {
      x: cx, y: cy, w: w, h: 0.38, fontSize: 13, fontFace: "Calibri",
      bold: true, color: C.white, align: "center", valign: "middle", margin: 0
    });
    g.endpoints.forEach((ep, i) => {
      s.addText(ep, {
        x: cx + 0.15, y: cy + 0.45 + i * 0.26, w: w - 0.3, h: 0.22,
        fontSize: 9, fontFace: "Consolas", color: C.bodyText, margin: 0
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // SLIDE 10 — Resilience & Export
  // ════════════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.offWhite };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.lightTeal } });
  s.addText("Resilience & Export", {
    x: 0.7, y: 0.35, w: 8, h: 0.6, fontSize: 32, fontFace: "Trebuchet MS",
    color: C.navy, bold: true, margin: 0
  });

  s.addImage({ data: icons.shieldTeal, x: 0.7, y: 1.2, w: 0.4, h: 0.4 });
  s.addText("Graceful Degradation", {
    x: 1.25, y: 1.2, w: 4, h: 0.4, fontSize: 18, fontFace: "Calibri",
    bold: true, color: C.navy, valign: "middle", margin: 0
  });

  const degradation = [
    { scenario: "LLM Unavailable", behavior: "Requirement normalization falls back to basic fields;\ntest design/scenario/analysis returns fallback status" },
    { scenario: "Backend Offline", behavior: "Frontend shows offline indicator;\nforms remain usable for when backend reconnects" },
    { scenario: "MongoDB Down", behavior: "API returns HTTP errors;\nno silent data loss" },
  ];
  degradation.forEach((d, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.7, y: 1.8 + i * 0.82, w: 8.6, h: 0.68,
      fill: { color: C.white }, shadow: mkShadow()
    });
    s.addImage({ data: icons.warn, x: 0.9, y: 1.92 + i * 0.82, w: 0.28, h: 0.28 });
    s.addText(d.scenario, {
      x: 1.3, y: 1.85 + i * 0.82, w: 2.0, h: 0.62,
      fontSize: 13, fontFace: "Calibri", bold: true, color: C.darkText, valign: "middle", margin: 0
    });
    s.addText(d.behavior, {
      x: 3.4, y: 1.85 + i * 0.82, w: 5.6, h: 0.62,
      fontSize: 11, fontFace: "Calibri", color: C.bodyText, valign: "middle", lineSpacing: 16, margin: 0
    });
  });

  s.addImage({ data: icons.exportIc, x: 0.7, y: 4.45, w: 0.35, h: 0.35 });
  s.addText("Export Formats", {
    x: 1.2, y: 4.45, w: 3, h: 0.35, fontSize: 16, fontFace: "Calibri",
    bold: true, color: C.navy, valign: "middle", margin: 0
  });
  const exports = [
    { fmt: "Markdown", desc: "Formatted .md for test designs & scenarios", color: C.teal },
    { fmt: "JSON", desc: "Full structured data via API (GET any document)", color: C.purple },
  ];
  exports.forEach((e, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.7 + i * 4.5, y: 4.95, w: 4.2, h: 0.42, fill: { color: e.color }
    });
    s.addText(`${e.fmt}  —  ${e.desc}`, {
      x: 0.7 + i * 4.5, y: 4.95, w: 4.2, h: 0.42,
      fontSize: 11, fontFace: "Calibri", color: C.white, valign: "middle",
      align: "center", margin: 0
    });
  });

  // ════════════════════════════════════════════════════════════════
  // SLIDE 11 — Integration & i18n
  // ════════════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.offWhite };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.lightTeal } });
  s.addText("Integration & Internationalization", {
    x: 0.7, y: 0.35, w: 9, h: 0.6, fontSize: 28, fontFace: "Trebuchet MS",
    color: C.navy, bold: true, margin: 0
  });

  const bigStats = [
    { num: "17", label: "API Endpoints" },
    { num: "4", label: "MongoDB Collections" },
    { num: "120+", label: "i18n Keys (EN/NO)" },
    { num: "4", label: "LLM Prompt Templates" },
  ];
  bigStats.forEach((st, i) => {
    const cx = 0.5 + i * 2.35;
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx, y: 1.2, w: 2.1, h: 1.3, fill: { color: C.white }, shadow: mkShadow()
    });
    s.addText(st.num, {
      x: cx, y: 1.3, w: 2.1, h: 0.7, fontSize: 36, fontFace: "Trebuchet MS",
      bold: true, color: C.teal, align: "center", margin: 0
    });
    s.addText(st.label, {
      x: cx, y: 2.05, w: 2.1, h: 0.35, fontSize: 12, fontFace: "Calibri",
      color: C.mutedText, align: "center", margin: 0
    });
  });

  // Sidebar integration
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 2.85, w: 4.3, h: 2.4, fill: { color: C.white }, shadow: mkShadow()
  });
  s.addImage({ data: icons.layers, x: 0.7, y: 3.0, w: 0.35, h: 0.35 });
  s.addText("Sidebar Integration", {
    x: 1.15, y: 3.0, w: 3, h: 0.35, fontSize: 16, fontFace: "Calibri",
    bold: true, color: C.navy, valign: "middle", margin: 0
  });
  s.addText([
    { text: "Located under ", options: { fontSize: 12, color: C.bodyText } },
    { text: "Future Item Agents", options: { fontSize: 12, color: C.teal, bold: true } },
    { text: " group in the sidebar.", options: { fontSize: 12, color: C.bodyText, breakLine: true } },
    { text: "", options: { breakLine: true } },
    { text: "Files modified:", options: { fontSize: 11, color: C.darkText, bold: true, breakLine: true } },
    { text: "Sidebar.jsx — navigation entry", options: { fontSize: 10, color: C.bodyText, breakLine: true } },
    { text: "App.jsx — component import & route", options: { fontSize: 10, color: C.bodyText, breakLine: true } },
    { text: "app.py — router registration", options: { fontSize: 10, color: C.bodyText, breakLine: true } },
    { text: "i18n/index.js — module registration", options: { fontSize: 10, color: C.bodyText } },
  ], { x: 0.7, y: 3.5, w: 3.9, h: 1.6, fontFace: "Calibri", margin: 0 });

  // i18n
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.2, y: 2.85, w: 4.3, h: 2.4, fill: { color: C.white }, shadow: mkShadow()
  });
  s.addImage({ data: icons.rocketTeal, x: 5.4, y: 3.0, w: 0.35, h: 0.35 });
  s.addText("Full i18n Coverage", {
    x: 5.85, y: 3.0, w: 3, h: 0.35, fontSize: 16, fontFace: "Calibri",
    bold: true, color: C.navy, valign: "middle", margin: 0
  });
  s.addText([
    { text: "Every label translated to ", options: { fontSize: 12, color: C.bodyText } },
    { text: "English (EN)", options: { fontSize: 12, color: C.teal, bold: true } },
    { text: " and ", options: { fontSize: 12, color: C.bodyText } },
    { text: "Norwegian (NO)", options: { fontSize: 12, color: C.teal, bold: true } },
    { text: " with full parity.", options: { fontSize: 12, color: C.bodyText, breakLine: true } },
    { text: "", options: { breakLine: true } },
    { text: "Coverage includes:", options: { fontSize: 11, color: C.darkText, bold: true, breakLine: true } },
    { text: "Tab labels, form fields, buttons", options: { fontSize: 10, color: C.bodyText, breakLine: true } },
    { text: "Scenario families & source types", options: { fontSize: 10, color: C.bodyText, breakLine: true } },
    { text: "Risk levels & artifact types", options: { fontSize: 10, color: C.bodyText, breakLine: true } },
    { text: "All analysis output labels", options: { fontSize: 10, color: C.bodyText } },
  ], { x: 5.4, y: 3.5, w: 3.9, h: 1.6, fontFace: "Calibri", margin: 0 });

  // ════════════════════════════════════════════════════════════════
  // SLIDE 12 — Closing
  // ════════════════════════════════════════════════════════════════
  s = pres.addSlide();
  s.background = { color: C.navy };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.lightTeal } });
  s.addImage({ data: icons.plane, x: 4.25, y: 0.9, w: 1.5, h: 1.5 });
  s.addText("ATM V&V Test Copilot", {
    x: 0.5, y: 2.6, w: 9, h: 0.7, fontSize: 36, fontFace: "Trebuchet MS",
    bold: true, color: C.white, align: "center", margin: 0
  });
  s.addText("Safer skies through smarter testing", {
    x: 1, y: 3.3, w: 8, h: 0.5, fontSize: 18, fontFace: "Calibri",
    color: C.lightTeal, align: "center", italic: true, margin: 0
  });
  s.addShape(pres.shapes.LINE, { x: 3.5, y: 4.1, w: 3, h: 0, line: { color: C.teal, width: 1.5 } });
  s.addText("Workplace Learning With AI  |  Ignacio Tejera  |  April 2026", {
    x: 1, y: 4.4, w: 8, h: 0.4, fontSize: 13, fontFace: "Calibri",
    color: C.mutedText, align: "center", margin: 0
  });

  // ── Write file ──
  const outPath = process.argv[2] || "ATM_VV_Test_Copilot_Presentation.pptx";
  await pres.writeFile({ fileName: outPath });
  console.log("Presentation saved to:", outPath);
}

build().catch(e => { console.error(e); process.exit(1); });
