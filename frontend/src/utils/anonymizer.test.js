/**
 * Unit tests for the PII anonymizer (regex masking engine).
 * Pure logic — runs under jsdom (localStorage available). No network.
 */
import { anonymizeText, detectPII, ANONYMIZATION_RULES } from './anonymizer';

const allOn = {
  enabled: true,
  rules: Object.fromEntries(Object.keys(ANONYMIZATION_RULES).map((k) => [k, true])),
};

beforeEach(() => localStorage.clear());

describe('anonymizeText', () => {
  test('masks an email and counts it', () => {
    const { result, stats, totalMatches } = anonymizeText('Reach me at john.doe@example.com please', allOn);
    expect(result).toContain('[EMAIL]');
    expect(result).not.toContain('john.doe@example.com');
    expect(stats.email).toBe(1);
    expect(totalMatches).toBe(1);
  });

  test('masks credit card, SSN and IP address', () => {
    const { result } = anonymizeText('card 4111 1111 1111 1111 ssn 123-45-6789 ip 192.168.0.1', allOn);
    expect(result).toContain('[CARD]');
    expect(result).toContain('[SSN]');
    expect(result).toContain('[IP]');
  });

  test('masks a real phone number', () => {
    const { result } = anonymizeText('call +47 123 45 678 now', allOn);
    expect(result).toContain('[PHONE]');
  });

  test('phone validator ignores short digit runs', () => {
    const { stats } = anonymizeText('the year is 2026', allOn);
    expect(stats.phone).toBeUndefined();
  });

  test('a disabled config returns the text unchanged', () => {
    const { result, totalMatches } = anonymizeText('a@b.com', { enabled: false, rules: {} });
    expect(result).toBe('a@b.com');
    expect(totalMatches).toBe(0);
  });

  test('only active rules are applied', () => {
    const emailOnly = { enabled: true, rules: { email: true } };
    const { result } = anonymizeText('mail a@b.com ip 10.0.0.1', emailOnly);
    expect(result).toContain('[EMAIL]');
    expect(result).toContain('10.0.0.1'); // IP rule off -> untouched
  });

  test('empty or null text is handled safely', () => {
    expect(anonymizeText('', allOn).result).toBe('');
    expect(anonymizeText(null, allOn).totalMatches).toBe(0);
  });
});

describe('detectPII', () => {
  test('finds PII sorted by index, each with a replacement label', () => {
    const findings = detectPII('ip 10.0.0.1 then mail x@y.com');
    const rules = findings.map((f) => f.rule);
    expect(rules).toContain('ipAddress');
    expect(rules).toContain('email');
    const idxs = findings.map((f) => f.index);
    expect(idxs).toEqual([...idxs].sort((a, b) => a - b));
    expect(findings.every((f) => typeof f.replacement === 'string')).toBe(true);
  });

  test('returns an empty array when there is no PII', () => {
    expect(detectPII('just plain words here')).toEqual([]);
  });
});
