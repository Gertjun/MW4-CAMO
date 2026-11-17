// App-adapter voor MW4 Camo Tracker. De cryptografie en replaybescherming komen uit PWA-Core.
import {
  createPairingPayload,
  openPairingPayload,
  markPairingUsed,
  DEVICE_PAIRING_TTL_MS,
} from './core/device-pairing.js';

const CONTEXT = 'mw4-camo/device-pairing/v1';
const USED_KEY = 'mw4-camo:device-pairing:used';

function normalizePin(pin) {
  return String(pin ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
}

function validateGithubSettings(github) {
  if (!github || typeof github !== 'object' || Array.isArray(github)) {
    throw new Error('De GitHub-koppeling ontbreekt.');
  }
  const { owner, repo, branch, path, token } = github;
  if (typeof owner !== 'string' || !/^[A-Za-z0-9-]{1,39}$/.test(owner)) throw new Error('De GitHub-eigenaar is ongeldig.');
  if (typeof repo !== 'string' || !/^[A-Za-z0-9._-]{1,100}$/.test(repo)) throw new Error('De GitHub-repository is ongeldig.');
  if (typeof branch !== 'string' || !/^[A-Za-z0-9._/-]{1,255}$/.test(branch) || branch.includes('..')) throw new Error('De GitHub-branch is ongeldig.');
  if (typeof path !== 'string' || !/^[A-Za-z0-9._/-]{1,500}$/.test(path) || path.split('/').some((part) => part === '..')) throw new Error('Het pad naar de kluis is ongeldig.');
  if (typeof token !== 'string' || !token.trim() || token.length > 500) throw new Error('Het GitHub-token ontbreekt of is ongeldig.');
  return { owner, repo, branch, path, token };
}

function validatePin(pin) {
  const normalized = normalizePin(pin);
  if (normalized.length !== 8) throw new Error('De pincode heeft 8 tekens, bijvoorbeeld AB3D-7KMP.');
  return normalized;
}

function assertPairingNotUsed(storage, pairingId, now) {
  if (!storage || typeof storage.getItem !== 'function') {
    throw new Error('Lokale replaybescherming is niet beschikbaar; de QR-code wordt geweigerd.');
  }
  let entries = [];
  const stored = storage.getItem(USED_KEY);
  if (stored !== null) {
    try { entries = JSON.parse(stored); }
    catch { throw new Error('De lokale replayhistorie is beschadigd; de QR-code wordt uit veiligheid geweigerd.'); }
    if (!Array.isArray(entries) || entries.some((entry) =>
      !entry || typeof entry.pairingId !== 'string' ||
      !/^[A-Za-z0-9_-]{32}$/.test(entry.pairingId) ||
      !Number.isSafeInteger(entry.usedAt) || entry.usedAt < 0)) {
      throw new Error('De lokale replayhistorie is ongeldig; de QR-code wordt uit veiligheid geweigerd.');
    }
  }
  if (entries.some((entry) =>
    entry.pairingId === pairingId &&
    now - entry.usedAt <= 10 * 60 * 1000 &&
    entry.usedAt <= now + 30000)) {
    throw new Error('Deze QR-code is op dit apparaat al gebruikt. Maak een nieuwe code.');
  }
}

export async function createPairingQrPayload({ github, pin, now = Date.now() } = {}) {
  const created = await createPairingPayload({
    data: { github: validateGithubSettings(github) },
    secrets: [validatePin(pin)],
    context: CONTEXT,
    now,
  });
  return { payload: created.payload, expiresAt: created.expiresAt, nonce: created.pairingId };
}

export async function openPairingQrPayload(payload, pin, now = Date.now(), storage = globalThis.localStorage) {
  const opened = await openPairingPayload({
    payload,
    secrets: [validatePin(pin)],
    context: CONTEXT,
    now,
  });
  // Controleer de nonce vóórdat ontsleutelde GitHub-gegevens aan de UI worden teruggegeven.
  assertPairingNotUsed(storage, opened.pairingId, now);
  const github = validateGithubSettings(opened.data?.github);
  return { github, nonce: opened.pairingId, expiresAt: opened.expiresAt };
}

export function markPairingNonceUsed(nonce, storage = globalThis.localStorage, now = Date.now()) {
  markPairingUsed(storage, nonce, { storageKey: USED_KEY, now });
}

export const PAIRING_QR_TTL_MS = DEVICE_PAIRING_TTL_MS;
