import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import {
  createPairingQrPayload,
  openPairingQrPayload,
  markPairingNonceUsed,
} from '../js/device-pairing.js';
import qrcode from '../js/vendor/qrcode.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const github = {
  owner: 'Gertjun',
  repo: 'SyncData',
  branch: 'main',
  path: 'mw4-camo/vault.json',
  token: 'github_pat_synthetic_test_token',
};

class MemoryStorage {
  #values = new Map();
  getItem(key) { return this.#values.has(key) ? this.#values.get(key) : null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
}

test('QR-pairing roundtrip geeft alleen de gevalideerde GitHub-instellingen terug', async () => {
  const created = await createPairingQrPayload({ github, pin: 'AB3D-7KMP', now: 1_000 });
  assert.ok(created.payload.startsWith('PWA-CORE-PAIR-1:'));
  const opened = await openPairingQrPayload(created.payload, 'AB3D-7KMP', 2_000);
  assert.deepEqual(opened.github, github);
  assert.equal(opened.nonce, created.nonce);
  assert.equal(opened.expiresAt, 181_000);
});

test('QR-pairing weigert een verkeerde pincode', async () => {
  const created = await createPairingQrPayload({ github, pin: 'AB3D-7KMP', now: 1_000 });
  await assert.rejects(
    openPairingQrPayload(created.payload, 'ZZZZ-9999', 2_000),
    /koppelgeheimen horen niet bij deze code/,
  );
});

test('QR-pairing weigert een verlopen overdracht', async () => {
  const created = await createPairingQrPayload({ github, pin: 'AB3D-7KMP', now: 1_000 });
  await assert.rejects(
    openPairingQrPayload(created.payload, 'AB3D-7KMP', created.expiresAt),
    /QR-code is verlopen/,
  );
});

test('QR-pairing valideert de GitHub-configuratie en de pincode', async () => {
  await assert.rejects(
    createPairingQrPayload({ github: { ...github, owner: 'bad owner' }, pin: 'AB3D-7KMP' }),
    /GitHub-eigenaar is ongeldig/,
  );
  await assert.rejects(
    createPairingQrPayload({ github, pin: 'kort' }),
    /pincode heeft 8 tekens/,
  );
});

test('een gebruikte pairing-nonce kan lokaal niet opnieuw worden gemarkeerd', async () => {
  const created = await createPairingQrPayload({ github, pin: 'AB3D-7KMP', now: 1_000 });
  const storage = new MemoryStorage();
  markPairingNonceUsed(created.nonce, storage, 2_000);
  assert.throws(
    () => markPairingNonceUsed(created.nonce, storage, 2_500),
    /al gebruikt/,
  );
});

test('de QR-generator kan een realistische app-link met pairing-data encoderen', async () => {
  const created = await createPairingQrPayload({ github: { ...github, token: 'x'.repeat(500) }, pin: 'AB3D-7KMP', now: 1_000 });
  const url = new URL('https://gertjun.github.io/MW4-CAMO/');
  url.searchParams.set('pair', created.payload);
  const qr = qrcode(0, 'L');
  qr.addData(url.toString(), 'Byte');
  qr.make();
  assert.ok(qr.getModuleCount() >= 21);
  assert.ok(qr.createDataURL(3, 4).startsWith('data:image/gif;base64,'));
});

test('een eerder succesvol gebruikte QR-code kan op hetzelfde apparaat niet opnieuw worden geopend', async () => {
  const created = await createPairingQrPayload({ github, pin: 'AB3D-7KMP', now: 1_000 });
  const storage = new MemoryStorage();
  markPairingNonceUsed(created.nonce, storage, 2_000);
  await assert.rejects(
    openPairingQrPayload(created.payload, 'AB3D-7KMP', 2_500, storage),
    /op dit apparaat al gebruikt/,
  );
});
