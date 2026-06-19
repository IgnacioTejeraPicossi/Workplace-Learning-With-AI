// Topic categorization shared with the Knowledge Map.
// This mirrors the backend `categorize_topic` logic in
// `backend/knowledge_map_utils.py` so the Dashboard and the Map of Knowledge
// group topics into the exact same categories.

// English category id -> i18n key under `knowledgeMapModule.clusterNames`.
export const CATEGORY_KEYS = {
  'Programming & Development': 'programmingDevelopment',
  'AI & Machine Learning': 'aiMl',
  'Development Tools': 'devTools',
  'Web Technologies': 'webTech',
  'Data & Analytics': 'dataAnalytics',
  'General Skills': 'generalSkills',
};

// Same palette as KnowledgeMap.jsx `clusterColors`.
export const CATEGORY_COLORS = {
  'Programming & Development': '#4CAF50',
  'AI & Machine Learning': '#2196F3',
  'Development Tools': '#FF9800',
  'Web Technologies': '#9C27B0',
  'Data & Analytics': '#00BCD4',
  'General Skills': '#607D8B',
};

// Keyword rules — order matters and matches the backend exactly.
const CATEGORY_RULES = [
  ['Programming & Development', ['python', 'javascript', 'java', 'pascal', 'programming', 'code', 'development']],
  ['AI & Machine Learning', ['ai', 'machine learning', 'llm', 'openai', 'rag', 'agentic', 'chatgpt', 'artificial intelligence']],
  ['Development Tools', ['studio', 'localhost', 'port', 'tool', 'ide', 'environment']],
  ['Web Technologies', ['web', 'api', 'http', 'url', 'frontend', 'backend']],
  ['Data & Analytics', ['data', 'analytics', 'science', 'database', 'sql', 'nosql']],
];

const FALLBACK_CATEGORY = 'General Skills';

export function categorizeTopic(label) {
  const topic = (label || '').toLowerCase();
  for (const [category, words] of CATEGORY_RULES) {
    if (words.some((word) => topic.includes(word))) {
      return category;
    }
  }
  return FALLBACK_CATEGORY;
}

export function translateCategory(category, t) {
  const key = CATEGORY_KEYS[category];
  return key ? t(`knowledgeMapModule.clusterNames.${key}`) : category;
}

// Build treemap data: one node per non-empty category, sized by total lessons,
// keeping the contributing topics (sorted desc) for tooltips/drill-down.
// `breakdown` is the existing Dashboard shape: [{ name, value }].
export function buildCategoryTreemap(breakdown, t) {
  const totals = {};
  const topicsByCategory = {};

  (breakdown || []).forEach(({ name, value }) => {
    const category = categorizeTopic(name);
    totals[category] = (totals[category] || 0) + (value || 0);
    if (!topicsByCategory[category]) topicsByCategory[category] = [];
    topicsByCategory[category].push({ name, value: value || 0 });
  });

  return Object.keys(totals)
    .map((category) => ({
      name: t ? translateCategory(category, t) : category,
      rawName: category,
      value: totals[category],
      fill: CATEGORY_COLORS[category] || '#607D8B',
      topics: (topicsByCategory[category] || []).sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => b.value - a.value);
}
