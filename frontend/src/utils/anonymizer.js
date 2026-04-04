/**
 * Anonymizer — regex-based PII masking engine
 *
 * Provides configurable rules to detect and replace sensitive data patterns.
 * Configuration is persisted in localStorage so other modules (e.g. PromptPanel)
 * can call anonymizeText() before sending prompts to LLMs.
 */

import { logSecurityEvent, EventType, EventSeverity } from './securityEventLog';

const CONFIG_KEY = 'wlwai_anonymization_config';

/**
 * Available anonymization rules with their regex patterns
 */
export const ANONYMIZATION_RULES = {
  email: {
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    replacement: '[EMAIL]',
    icon: '📧'
  },
  phone: {
    pattern: /(\+?\d{1,4}[\s\-.]?)?\(?\d{1,4}\)?[\s\-.]?\d{2,4}[\s\-.]?\d{2,4}[\s\-.]?\d{0,4}/g,
    // Only match sequences that look like phone numbers (7+ digits)
    validate: (match) => match.replace(/\D/g, '').length >= 7,
    replacement: '[PHONE]',
    icon: '📱'
  },
  creditCard: {
    pattern: /\b\d{4}[\s\-.]?\d{4}[\s\-.]?\d{4}[\s\-.]?\d{4}\b/g,
    replacement: '[CARD]',
    icon: '💳'
  },
  ipAddress: {
    pattern: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    replacement: '[IP]',
    icon: '🌐'
  },
  apiKey: {
    pattern: /\b(?:sk|pk|api|key|token|secret|bearer)[_\-]?[a-zA-Z0-9]{16,}\b/gi,
    replacement: '[API_KEY]',
    icon: '🔑'
  },
  ssn: {
    pattern: /\b\d{3}[\s\-]?\d{2}[\s\-]?\d{4}\b/g,
    replacement: '[SSN]',
    icon: '🆔'
  },
  norwegianId: {
    // Norwegian fødselsnummer: 11 digits (DDMMYY + 5 digits)
    pattern: /\b\d{2}[01]\d[0-3]\d\s?\d{5}\b/g,
    replacement: '[PERSON_ID]',
    icon: '🇳🇴'
  },
  url: {
    pattern: /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g,
    replacement: '[URL]',
    icon: '🔗'
  }
};

/**
 * Get saved anonymization config from localStorage
 */
export function getAnonymizationConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // Default: all rules enabled, global toggle on
  const defaults = { enabled: true, rules: {} };
  for (const key of Object.keys(ANONYMIZATION_RULES)) {
    defaults.rules[key] = true;
  }
  return defaults;
}

/**
 * Save anonymization config
 */
export function saveAnonymizationConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  logSecurityEvent(EventType.ANONYMIZATION_TOGGLED, EventSeverity.INFO, {
    enabled: config.enabled,
    activeRules: Object.entries(config.rules).filter(([, v]) => v).map(([k]) => k)
  });
}

/**
 * Anonymize text using active rules
 * @param {string} text - Input text to anonymize
 * @param {object} [configOverride] - Optional config override (uses saved config if omitted)
 * @returns {{ result: string, stats: object }} — anonymized text + per-rule match counts
 */
export function anonymizeText(text, configOverride = null) {
  const config = configOverride || getAnonymizationConfig();

  if (!config.enabled || !text) {
    return { result: text, stats: {}, totalMatches: 0 };
  }

  let result = text;
  const stats = {};
  let totalMatches = 0;

  for (const [ruleKey, ruleConfig] of Object.entries(ANONYMIZATION_RULES)) {
    if (!config.rules[ruleKey]) continue;

    const regex = new RegExp(ruleConfig.pattern.source, ruleConfig.pattern.flags);
    let count = 0;

    result = result.replace(regex, (match) => {
      // Apply optional validator (e.g. phone number digit count check)
      if (ruleConfig.validate && !ruleConfig.validate(match)) {
        return match;
      }
      count++;
      return ruleConfig.replacement;
    });

    if (count > 0) {
      stats[ruleKey] = count;
      totalMatches += count;
    }
  }

  return { result, stats, totalMatches };
}

/**
 * Detect PII in text without replacing (preview mode)
 * Returns array of { rule, match, index }
 */
export function detectPII(text) {
  const config = getAnonymizationConfig();
  const findings = [];

  if (!text) return findings;

  for (const [ruleKey, ruleConfig] of Object.entries(ANONYMIZATION_RULES)) {
    if (!config.rules[ruleKey]) continue;

    const regex = new RegExp(ruleConfig.pattern.source, ruleConfig.pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (ruleConfig.validate && !ruleConfig.validate(match[0])) continue;
      findings.push({
        rule: ruleKey,
        match: match[0],
        index: match.index,
        replacement: ruleConfig.replacement
      });
    }
  }

  return findings.sort((a, b) => a.index - b.index);
}

/**
 * Check if anonymization is currently enabled
 */
export function isAnonymizationEnabled() {
  return getAnonymizationConfig().enabled;
}
