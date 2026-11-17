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
  if (typeof branch !== 'string' || !branch.trim() || branch.length > 255) throw new Error('De GitHub-branch is ongeldig.');
  if (typeof path !== 'string' || !path.trim() || path.startsWith('/') || path.length > 500) throw new Error('Het pad naar de kluis is ongeldig.');
  if (typeof token !== 'string' || !token.trim() || token.length > 500) throw new Error('Het GitHub-token ontbreekt of is ongeldig.');
  return { owner, repo, branch, path, token };
}

function validatePin(pin) {
  const normalized = normalizePin(pin);
  if (normalized.length !== 8) throw new Error('De pincode heeft 8 tekens, bijvoorbeeld AB3D-7KMP.');
  return normalized;
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

export async function openPairingQrPayload(payload, pin, now = Date.now()) {
  const opened = await openPairingPayload({
    payload,
    secrets: [validatePin(pin)],
    context: CONTEXT,
    now,
  });
  const github = validateGithubSettings(opened.data?.github);
  return { github, nonce: opened.pairingId, expiresAt: opened.expiresAt };
}

export function markPairingNonceUsed(nonce, storage = globalThis.localStorage, now = Date.now()) {
  markPairingUsed(storage, nonce, { storageKey: USED_KEY, now });
}

export const PAIRING_QR_TTL_MS = DEVICE_PAIRING_TTL_MS;
