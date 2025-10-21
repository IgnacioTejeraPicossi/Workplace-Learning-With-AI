// Minimal localStorage at-rest encryption using Web Crypto (AES-GCM)
// - Key is derived from a passphrase with PBKDF2 (salt stored in localStorage)
// - When enabled, getItem/setItem are monkey-patched to decrypt/encrypt on the fly

let originalGetItem = null;
let originalSetItem = null;
let originalRemoveItem = null;
let encryptionActive = false;
let cryptoKey = null;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSalt() {
  let saltB64 = window.localStorage.getItem('ai_enc_salt');
  if (!saltB64) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    saltB64 = btoa(String.fromCharCode(...salt));
    window.localStorage.setItem('ai_enc_salt', saltB64);
  }
  const bytes = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  return bytes;
}

async function deriveKey(passphrase) {
  const salt = getSalt();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 150000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptString(plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoder.encode(plaintext));
  const data = new Uint8Array(iv.byteLength + ct.byteLength);
  data.set(iv, 0);
  data.set(new Uint8Array(ct), iv.byteLength);
  return 'enc:' + btoa(String.fromCharCode(...data));
}

async function decryptString(ciphertext) {
  if (!ciphertext || !ciphertext.startsWith('enc:')) return ciphertext;
  const raw = Uint8Array.from(atob(ciphertext.slice(4)), c => c.charCodeAt(0));
  const iv = raw.slice(0, 12);
  const ct = raw.slice(12);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, ct);
  return decoder.decode(pt);
}

function patchStorage() {
  if (encryptionActive) return;
  originalGetItem = window.localStorage.getItem.bind(window.localStorage);
  originalSetItem = window.localStorage.setItem.bind(window.localStorage);
  originalRemoveItem = window.localStorage.removeItem.bind(window.localStorage);

  window.localStorage.getItem = function (key) {
    const value = originalGetItem(key);
    if (!value || !value.startsWith('enc:')) return value;
    try { return window.__dec(value); } catch { return null; }
  };

  window.localStorage.setItem = function (key, value) {
    if (typeof value === 'string') {
      if (!value.startsWith('enc:')) {
        window.__enc(value).then(enc => originalSetItem(key, enc));
        return;
      }
    }
    originalSetItem(key, value);
  };

  window.localStorage.removeItem = function (key) {
    originalRemoveItem(key);
  };

  encryptionActive = true;
}

function unpatchStorage() {
  if (!encryptionActive) return;
  if (originalGetItem) window.localStorage.getItem = originalGetItem;
  if (originalSetItem) window.localStorage.setItem = originalSetItem;
  if (originalRemoveItem) window.localStorage.removeItem = originalRemoveItem;
  encryptionActive = false;
  cryptoKey = null;
}

export async function enableLocalEncryption(passphrase) {
  cryptoKey = await deriveKey(passphrase);
  window.__enc = encryptString; // expose for patched calls
  window.__dec = decryptString;
  patchStorage();
  window.localStorage.setItem('ai_enc_active', '1');
}

export function disableLocalEncryption() {
  unpatchStorage();
  window.localStorage.removeItem('ai_enc_active');
}

export function isEncryptionActive() {
  return encryptionActive || window.localStorage.getItem('ai_enc_active') === '1';
}

// Attempt auto-activation on load only if previously active, but without a key we cannot decrypt.
// We intentionally do NOT store the key; user must activate per session.


