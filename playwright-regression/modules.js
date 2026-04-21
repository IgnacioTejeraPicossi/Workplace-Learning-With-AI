/**
 * modules.js — Complete list of sidebar modules for visual regression.
 *
 * Each entry uses `section` which matches the React App.jsx `section` state value.
 * Playwright navigates via: http://localhost:3000?pwSection=<section>
 *
 * waitExtra: extra ms to wait after DOMContentLoaded (heavier modules need more time).
 */

const MODULES = [
  // ── Main ──────────────────────────────────────────────────────────────
  { name: 'Dashboard',             section: 'dashboard',             waitExtra: 2000 },

  // ── Learning Modules ──────────────────────────────────────────────────
  { name: 'Video Lessons',         section: 'video-lessons',         waitExtra: 2000 },
  { name: 'Micro Lessons',         section: 'micro-lessons',         waitExtra: 2000 },
  { name: 'Simulations',           section: 'simulations',           waitExtra: 2000 },
  { name: 'Web Search',            section: 'web-search',            waitExtra: 1500 },
  { name: 'Team Dynamics',         section: 'team-dynamics',         waitExtra: 1500 },
  { name: 'Certifications',        section: 'certifications',        waitExtra: 1500 },
  { name: 'AI Career Coach',       section: 'ai-career-coach',       waitExtra: 2000 },
  { name: 'Skills Forecast',       section: 'skills-forecast',       waitExtra: 2000 },
  { name: 'AI Learning',           section: 'ai-learning',           waitExtra: 2500 },
  { name: 'Babel Library',         section: 'babel-library',         waitExtra: 3000 },
  { name: 'Knowledge Map',         section: 'knowledge-map',         waitExtra: 2000 },

  // ── Repository & Document Analyzer ───────────────────────────────────
  { name: 'Repo Analyzer',         section: 'repo-analyzer',         waitExtra: 1500 },
  { name: 'Documents Analyzer',    section: 'documents-analyzer',    waitExtra: 2000 },
  { name: 'Agentic RAG',          section: 'agentic-rag',           waitExtra: 2000 },

  // ── J-Messages ────────────────────────────────────────────────────────
  { name: 'J-Messages Analyzer',   section: 'j-messages-analyzer',   waitExtra: 2500 },

  // ── Enterprise Architecture ───────────────────────────────────────────
  { name: 'EA Home',               section: 'ea-home',               waitExtra: 1500 },

  // ── Agent Modules ─────────────────────────────────────────────────────
  { name: 'AgentOps Studio',       section: 'agentops-studio',       waitExtra: 2500 },
  { name: 'AI Compliance Agent',   section: 'ai-compliance-agent',   waitExtra: 1500 },
  { name: 'AI Productivity Agent', section: 'ai-productivity-agent', waitExtra: 1500 },
  { name: 'EA Second Brain',       section: 'ea-second-brain',       waitExtra: 2500 },
  { name: 'ATM V&V Test Copilot',  section: 'atm-vv-test-copilot',   waitExtra: 2500 },
  { name: 'Robomind Clinic',       section: 'robomind-clinic',       waitExtra: 2000 },

  // ── Security & Cybersecurity ──────────────────────────────────────────
  { name: 'Cybersecurity',         section: 'cybersecurity',         waitExtra: 3000 },
  { name: 'Security Center',       section: 'security',              waitExtra: 1500 },

  // ── Help ──────────────────────────────────────────────────────────────
  { name: 'Agent Theory Docs',     section: 'agent-theory-docs',     waitExtra: 2000 },
  { name: 'AGI Progress Hub',      section: 'agi-progress',          waitExtra: 2000 },

  // ── Cloud & Developer ─────────────────────────────────────────────────
  { name: 'Cloud Install',         section: 'cloud-install',         waitExtra: 2500 },
  { name: 'API Config',            section: 'api-config',            waitExtra: 1500 },
  { name: 'Run Tests',             section: 'run-test',              waitExtra: 1500 },
];

module.exports = MODULES;
