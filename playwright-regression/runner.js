/**
 * runner.js — Playwright visual regression runner for WLWAI.
 *
 * Usage:
 *   node runner.js --mode capture
 *   node runner.js --mode compare --baselines /path/to/baselines.json
 *
 * Environment:
 *   APP_URL — base URL of the React app (default: http://localhost:3000)
 *
 * Output: JSON written to stdout.
 *   capture: { mode: "capture", modules: [{name, section, screenshot_b64, status}] }
 *   compare: { mode: "compare", modules: [{name, section, status, diffPixels, diffPct,
 *              baselineB64, currentB64, diffB64}] }
 *
 * Navigation strategy: React app reads ?pwSection=<section> on mount and sets section state.
 * Baselines are only returned on FAIL to keep response size reasonable.
 */

'use strict';

const { chromium } = require('playwright');
const { PNG }      = require('pngjs');
const pixelmatch   = require('pixelmatch');
const fs           = require('fs');

const MODULES  = require('./modules.js');
const APP_URL  = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const VIEWPORT = { width: 1280, height: 800 };

// ── CLI helpers ────────────────────────────────────────────────────────────────

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 ? process.argv[idx + 1] : null;
}

const MODE           = getArg('--mode') || 'capture';
const BASELINES_FILE = getArg('--baselines');

// ── Screenshot helper ──────────────────────────────────────────────────────────

async function captureModule(page, mod) {
  const url = `${APP_URL}?pwSection=${encodeURIComponent(mod.section)}`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    // Wait for React to render the selected section
    await page.waitForTimeout(mod.waitExtra || 2000);
    const buffer = await page.screenshot({ fullPage: false, type: 'png' });
    return buffer.toString('base64');
  } catch (err) {
    log(`ERROR capturing ${mod.name}: ${err.message}`);
    return null;
  }
}

// ── Diff helper ────────────────────────────────────────────────────────────────

function diffImages(baselineB64, currentB64) {
  try {
    const img1 = PNG.sync.read(Buffer.from(baselineB64, 'base64'));
    const img2 = PNG.sync.read(Buffer.from(currentB64,  'base64'));

    // Size mismatch = treat as 100% changed
    if (img1.width !== img2.width || img1.height !== img2.height) {
      return { diffPixels: -1, diffPct: 100, diffB64: null, reason: 'size_mismatch' };
    }

    const { width, height } = img1;
    const diff = new PNG({ width, height });
    const numDiff = pixelmatch(img1.data, img2.data, diff.data, width, height, {
      threshold: 0.1,   // pixel similarity tolerance (0 = strict, 1 = loose)
      alpha: 0.3,       // reduce sensitivity to anti-aliasing
    });
    const diffPct  = Math.round((numDiff / (width * height)) * 10000) / 100;
    const diffB64  = numDiff > 0 ? PNG.sync.write(diff).toString('base64') : null;
    return { diffPixels: numDiff, diffPct, diffB64 };
  } catch (err) {
    return { diffPixels: -1, diffPct: 100, diffB64: null, reason: err.message };
  }
}

// ── Logger (stderr so it doesn't pollute JSON stdout) ─────────────────────────

function log(msg) {
  process.stderr.write(`[runner] ${msg}\n`);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function run() {
  log(`Starting in ${MODE} mode — APP_URL: ${APP_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page    = await context.newPage();

  // Suppress browser console noise
  page.on('console', () => {});
  page.on('pageerror', () => {});

  try {
    if (MODE === 'capture') {
      // ── CAPTURE ─────────────────────────────────────────────────────────
      const results = [];

      for (const mod of MODULES) {
        log(`Capturing: ${mod.name}`);
        const b64 = await captureModule(page, mod);
        results.push({
          name:            mod.name,
          section:         mod.section,
          screenshot_b64:  b64,
          status:          b64 ? 'captured' : 'error',
        });
      }

      await browser.close();
      process.stdout.write(JSON.stringify({ mode: 'capture', modules: results }));

    } else if (MODE === 'compare') {
      // ── COMPARE ─────────────────────────────────────────────────────────
      if (!BASELINES_FILE) {
        await browser.close();
        process.stdout.write(JSON.stringify({ error: 'No --baselines file provided' }));
        return;
      }

      let baselines;
      try {
        baselines = JSON.parse(fs.readFileSync(BASELINES_FILE, 'utf8'));
      } catch (err) {
        await browser.close();
        process.stdout.write(JSON.stringify({ error: `Cannot read baselines file: ${err.message}` }));
        return;
      }

      // Build lookup map by module name
      const baselineMap = {};
      for (const b of baselines) baselineMap[b.name] = b.screenshot_b64;

      const results = [];

      for (const mod of MODULES) {
        log(`Comparing: ${mod.name}`);
        const baselineB64 = baselineMap[mod.name];

        if (!baselineB64) {
          results.push({ name: mod.name, section: mod.section, status: 'no_baseline' });
          continue;
        }

        const currentB64 = await captureModule(page, mod);

        if (!currentB64) {
          results.push({ name: mod.name, section: mod.section, status: 'error' });
          continue;
        }

        const { diffPixels, diffPct, diffB64, reason } = diffImages(baselineB64, currentB64);
        const passed = diffPixels === 0;

        log(`  ${mod.name}: ${passed ? 'PASS' : `FAIL (${diffPct}% changed, ${diffPixels} px)`}`);

        results.push({
          name:        mod.name,
          section:     mod.section,
          status:      passed ? 'pass' : 'fail',
          diffPixels:  diffPixels,
          diffPct:     diffPct,
          reason:      reason || null,
          // Only return images on failure to keep payload small
          baselineB64: passed ? null : baselineB64,
          currentB64:  passed ? null : currentB64,
          diffB64:     passed ? null : diffB64,
        });
      }

      await browser.close();
      process.stdout.write(JSON.stringify({ mode: 'compare', modules: results }));

    } else {
      await browser.close();
      process.stdout.write(JSON.stringify({ error: `Unknown mode: ${MODE}` }));
    }

  } catch (err) {
    try { await browser.close(); } catch {}
    log(`FATAL: ${err.message}`);
    process.stdout.write(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

run();
