import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../ThemeContext";

/**
 * Andrés — Knowledge Sources tab.
 *
 * A curated directory of reputable places to find information across many
 * fields (academic search, journals, archives & primary sources, courses,
 * medicine, policy/economics, business/industry analysis). Intended as a
 * reference Andrés — and Ignacio — can draw on in future work.
 *
 * Design notes:
 * - The site list is language-neutral DATA (name + terse descriptor + URL +
 *   access tag). Only the chrome (title, intro, category names, access legend,
 *   caveat, button) is translated, so the directory stays maintainable without
 *   60×3 i18n churn.
 * - `access`: 'open' = mostly free; 'mixed' = some free / some paywalled or
 *   account-gated; 'paywall' = mostly subscription. Kept honest on purpose.
 * - Two well-known "shadow libraries" from the source list (Library Genesis,
 *   Z-Library) are deliberately EXCLUDED: they distribute copyrighted books
 *   without permission. Legal alternatives for free books are included instead
 *   (Project Gutenberg, Internet Archive, DPLA, OpenStax, Open Culture).
 */

// category keys map to i18n andresRobotModule.library.categories.<key>
const SOURCES = [
  {
    cat: "academic",
    items: [
      { name: "Google Scholar", url: "https://scholar.google.com", desc: "Scholarly search across disciplines", access: "open" },
      { name: "arXiv", url: "https://arxiv.org", desc: "Physics, math, CS & more preprints", access: "open" },
      { name: "SSRN", url: "https://www.ssrn.com", desc: "Social sciences working papers", access: "open" },
      { name: "CORE", url: "https://core.ac.uk", desc: "Aggregator of open-access papers", access: "open" },
      { name: "JSTOR", url: "https://www.jstor.org", desc: "Academic journals & books archive", access: "mixed" },
      { name: "ResearchGate", url: "https://www.researchgate.net", desc: "Author-shared papers & network", access: "mixed" },
      { name: "Academia.edu", url: "https://www.academia.edu", desc: "Researcher-shared articles", access: "mixed" },
      { name: "Internet Archive Scholar", url: "https://scholar.archive.org", desc: "Search of archived research articles", access: "open" },
      { name: "OpenStax", url: "https://openstax.org", desc: "Free, peer-reviewed textbooks", access: "open" },
    ],
  },
  {
    cat: "journals",
    items: [
      { name: "Nature", url: "https://www.nature.com", desc: "Leading science research journal", access: "mixed" },
      { name: "Science (AAAS)", url: "https://www.science.org", desc: "Science news & research", access: "mixed" },
      { name: "ScienceDirect", url: "https://www.sciencedirect.com", desc: "Elsevier journals & books", access: "paywall" },
      { name: "SpringerOpen", url: "https://www.springeropen.com", desc: "Open-access Springer journals", access: "open" },
      { name: "SAGE Journals", url: "https://journals.sagepub.com", desc: "Social & health sciences journals", access: "mixed" },
      { name: "Wiley Online Library", url: "https://onlinelibrary.wiley.com", desc: "Journals & reference works", access: "mixed" },
      { name: "Taylor & Francis Online", url: "https://www.tandfonline.com", desc: "Cross-discipline research journals", access: "mixed" },
      { name: "Project MUSE", url: "https://muse.jhu.edu", desc: "Humanities & social science journals", access: "mixed" },
    ],
  },
  {
    cat: "archives",
    items: [
      { name: "Project Gutenberg", url: "https://www.gutenberg.org", desc: "70k+ free public-domain eBooks", access: "open" },
      { name: "Internet Archive", url: "https://archive.org", desc: "Books, audio, video, software", access: "open" },
      { name: "Wayback Machine", url: "https://web.archive.org", desc: "Archived snapshots of the web", access: "open" },
      { name: "Library of Congress", url: "https://www.loc.gov", desc: "US national library collections", access: "open" },
      { name: "US National Archives", url: "https://www.archives.gov", desc: "Government records & documents", access: "open" },
      { name: "British Library", url: "https://www.bl.uk", desc: "UK national library & digital collections", access: "open" },
      { name: "DPLA", url: "https://dp.la", desc: "Digital Public Library of America", access: "open" },
      { name: "World Digital Library", url: "https://www.loc.gov/collections/world-digital-library", desc: "Primary materials from around the world", access: "open" },
      { name: "Europeana", url: "https://www.europeana.eu", desc: "European cultural heritage artifacts", access: "open" },
      { name: "Open Culture", url: "https://www.openculture.com", desc: "Free courses, books, films & audio", access: "open" },
      { name: "Public Domain Review", url: "https://publicdomainreview.org", desc: "Curated public-domain works", access: "open" },
    ],
  },
  {
    cat: "courses",
    items: [
      { name: "MIT OpenCourseWare", url: "https://ocw.mit.edu", desc: "Free MIT course materials", access: "open" },
      { name: "TED Talks", url: "https://www.ted.com", desc: "Ideas-worth-spreading talks", access: "open" },
      { name: "Stanford Libraries", url: "https://library.stanford.edu", desc: "Research collections & guides", access: "open" },
    ],
  },
  {
    cat: "medicine",
    items: [
      { name: "PubMed", url: "https://pubmed.ncbi.nlm.nih.gov", desc: "Biomedical literature (30M+ citations)", access: "open" },
      { name: "Psychology Today", url: "https://www.psychologytoday.com", desc: "Psychology articles & insights", access: "open" },
    ],
  },
  {
    cat: "policy",
    items: [
      { name: "OECD iLibrary", url: "https://www.oecd-ilibrary.org", desc: "Global policy data & analysis", access: "mixed" },
      { name: "RAND Corporation", url: "https://www.rand.org", desc: "Policy research organization", access: "open" },
      { name: "Brookings Institution", url: "https://www.brookings.edu", desc: "Public-policy analysis", access: "open" },
      { name: "Pew Research Center", url: "https://www.pewresearch.org", desc: "Facts & trends research", access: "open" },
      { name: "Council on Foreign Relations", url: "https://www.cfr.org", desc: "International-affairs analysis", access: "mixed" },
      { name: "The Conversation", url: "https://theconversation.com", desc: "Academic expert commentary", access: "open" },
      { name: "EconPapers", url: "https://econpapers.repec.org", desc: "Economics research (RePEc)", access: "open" },
      { name: "NBER", url: "https://www.nber.org", desc: "Economics working papers", access: "open" },
      { name: "Gallup", url: "https://www.gallup.com", desc: "Global analytics & polling", access: "mixed" },
    ],
  },
  {
    cat: "business",
    items: [
      { name: "Harvard Business Review", url: "https://hbr.org", desc: "Management ideas & case studies", access: "mixed" },
      { name: "HBS Working Knowledge", url: "https://www.library.hbs.edu/working-knowledge", desc: "Harvard Business School insights", access: "open" },
      { name: "Knowledge at Wharton", url: "https://knowledge.wharton.upenn.edu", desc: "Wharton business research", access: "open" },
      { name: "McKinsey Insights", url: "https://www.mckinsey.com/featured-insights", desc: "Management & industry research", access: "open" },
      { name: "Forrester", url: "https://www.forrester.com", desc: "Technology-impact research", access: "paywall" },
      { name: "Gartner", url: "https://www.gartner.com", desc: "IT research & advisory", access: "paywall" },
      { name: "Nielsen", url: "https://www.nielsen.com", desc: "Consumer-behavior analytics", access: "mixed" },
    ],
  },
];

const ACCESS_COLORS = {
  open: { bg: "#dcfce7", fg: "#166534", bd: "#86efac" },
  mixed: { bg: "#fef9c3", fg: "#854d0e", bd: "#fde68a" },
  paywall: { bg: "#fee2e2", fg: "#991b1b", bd: "#fecaca" },
};

export default function KnowledgeSources() {
  const { t } = useTranslation("common");
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const total = useMemo(() => SOURCES.reduce((n, c) => n + c.items.length, 0), []);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return SOURCES;
    return SOURCES
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (it) => it.name.toLowerCase().includes(q) || it.desc.toLowerCase().includes(q)
        ),
      }))
      .filter((c) => c.items.length > 0);
  }, [q]);

  const card = {
    background: colors.cardBackground, border: `1px solid ${colors.border}`,
    borderRadius: 12, padding: 20,
  };

  const AccessTag = ({ level }) => {
    const c = ACCESS_COLORS[level] || ACCESS_COLORS.mixed;
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, color: c.fg, background: c.bg,
        border: `1px solid ${c.bd}`, borderRadius: 999, padding: "1px 7px", whiteSpace: "nowrap",
      }}>
        {t(`andresRobotModule.library.access.${level}`)}
      </span>
    );
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Intro */}
      <div style={card}>
        <h2 style={{ margin: "0 0 4px", fontSize: 20, color: colors.text }}>
          📚 {t("andresRobotModule.library.title")}
        </h2>
        <p style={{ margin: 0, fontSize: 13.5, color: colors.textSecondary, lineHeight: 1.55 }}>
          {t("andresRobotModule.library.intro", { count: total })}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
          <span style={{ fontSize: 11, color: colors.textSecondary }}>{t("andresRobotModule.library.legend")}:</span>
          <AccessTag level="open" />
          <AccessTag level="mixed" />
          <AccessTag level="paywall" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("andresRobotModule.library.searchPlaceholder")}
          style={{
            marginTop: 12, width: "100%", boxSizing: "border-box",
            padding: "10px 12px", fontSize: 13, borderRadius: 8,
            border: `1px solid ${colors.border}`, background: colors.background, color: colors.text,
          }}
        />
      </div>

      {/* Categories */}
      {filtered.map((c) => (
        <div key={c.cat} style={card}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, color: colors.primary }}>
            {t(`andresRobotModule.library.categories.${c.cat}`)}
            <span style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 400 }}> · {c.items.length}</span>
          </h3>
          <div style={{ display: "grid", gap: 8 }}>
            {c.items.map((it) => (
              <div key={it.name} style={{
                display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
                padding: "10px 12px", borderRadius: 10,
                background: colors.background, border: `1px solid ${colors.border}`,
              }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <strong style={{ fontSize: 14, color: colors.text }}>{it.name}</strong>
                    <AccessTag level={it.access} />
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{it.desc}</div>
                </div>
                <a
                  href={it.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12.5, fontWeight: 700, color: "#fff", textDecoration: "none",
                    background: colors.primary, borderRadius: 999, padding: "7px 14px", whiteSpace: "nowrap",
                  }}
                >
                  {t("andresRobotModule.library.visit")} ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Honest caveat */}
      <div style={{ ...card, background: colors.background }}>
        <p style={{ margin: 0, fontSize: 12, color: colors.textSecondary, lineHeight: 1.6 }}>
          ⚖️ {t("andresRobotModule.library.caveat")}
        </p>
      </div>
    </div>
  );
}
