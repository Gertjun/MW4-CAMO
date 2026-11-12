import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.has(key) ? this.#data.get(key) : null; }
  setItem(key, value) { this.#data.set(key, String(value)); }
  removeItem(key) { this.#data.delete(key); }
  key(index) { return [...this.#data.keys()][index] ?? null; }
  get length() { return this.#data.size; }
  [Symbol.iterator]() { return this.#data.keys(); }
}
Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });

const vault = await import('../js/core/vault.js');
const { sameKey } = await import('../js/core/crypto.js');

function withoutSyncState(data) {
  const { __pwaSync, ...appData } = data;
  return appData;
}

test('kluis aanmaken, vergrendelen, ontgrendelen en opslaan', async () => {
  const initial = { schema: 4, progress: [{ id: 'm4:gold', done: true }], loadouts: [], pins: [], overviewOrder: null };
  await vault.create('een sterke wachtzin van twaalf tekens', initial);
  assert.equal(vault.isUnlocked(), true);
  assert.equal(vault.hasVault(), true);
  await vault.flush();

  vault.lock();
  assert.equal(vault.isUnlocked(), false);
  await assert.rejects(vault.unlockWithPassword('verkeerd wachtwoord'), { name: 'WrongPasswordError' });
  await vault.unlockWithPassword('een sterke wachtzin van twaalf tekens');
  assert.deepEqual(vault.getData(), initial);

  const updated = { ...initial, progress: [{ id: 'm4:gold', done: false }] };
  await vault.setData(updated);
  await vault.flush();
  vault.lock();
  await vault.unlockWithPassword('een sterke wachtzin van twaalf tekens');
  assert.deepEqual(vault.getData(), updated);
  assert.equal(vault.getPersistedRevision(), vault.getRevision());
});


const phase2Password = 'een sterke wachtzin van twaalf tekens';
const phase2InitialData = () => ({ schema: 4, progress: [{ id: 'm4:gold', done: true }], loadouts: [], pins: [], overviewOrder: null });

test('wachtwoord wijzigen behoudt datasleutel en gegevens; alleen het nieuwe wachtwoord werkt', async () => {
  await vault.reset();
  const initial = phase2InitialData();
  await vault.create(phase2Password, initial);
  const originalData = structuredClone(vault.getData());
  const originalKey = vault.getDataKey();
  const originalPayload = structuredClone(vault.getEnvelope().payload);
  const oldWrappedKey = vault.getEnvelope().wrappedKey.data;
  const nextPassword = 'een andere sterke wachtzin van twaalf tekens';

  await vault.changePassword(phase2Password, nextPassword);
  assert.equal(await sameKey(originalKey, vault.getDataKey()), true);
  assert.deepEqual(vault.getEnvelope().payload, originalPayload);
  assert.notEqual(vault.getEnvelope().wrappedKey.data, oldWrappedKey);
  assert.equal(vault.getSyncMeta().dirty, true);
  assert.equal(vault.getSyncMeta().keyDirty, true);

  vault.lock();
  await assert.rejects(vault.unlockWithPassword(phase2Password), { name: 'WrongPasswordError' });
  await vault.unlockWithPassword(nextPassword);
  assert.deepEqual(vault.getData(), originalData);
});

test('wachtwoord wijzigen met onjuist huidig wachtwoord verandert niets', async () => {
  await vault.reset();
  await vault.create(phase2Password, phase2InitialData());
  const before = structuredClone(vault.getEnvelope());
  const syncBefore = vault.getSyncMeta();
  await assert.rejects(vault.changePassword('dit is het verkeerde wachtwoord', 'een nieuwe sterke wachtzin van twaalf tekens'), { name: 'WrongPasswordError' });
  assert.deepEqual(vault.getEnvelope(), before);
  assert.deepEqual(vault.getSyncMeta(), syncBefore);
});

test('back-up terugzetten herstelt de oudere gegevens en markeert synchronisatie als geforceerd', async () => {
  await vault.reset();
  const initial = phase2InitialData();
  await vault.create(phase2Password, initial);
  const backup = structuredClone(vault.getEnvelope());
  const newer = { ...initial, progress: [{ id: 'm4:gold', done: false }, { id: 'm4:platinum', done: true }] };
  await vault.setData(newer);
  assert.notDeepEqual(vault.getData(), initial);

  const result = await vault.restoreBackup(backup, phase2Password);
  assert.equal(result.sameKey, true);
  assert.deepEqual(withoutSyncState(vault.getData()), initial);
  assert.deepEqual(vault.getData().__pwaSync, { version: 1, devices: {}, deletions: {} });
  assert.equal(vault.getSyncMeta().dirty, true);
  assert.equal(vault.getSyncMeta().keyDirty, true);
  assert.equal(vault.getSyncMeta().force, true);
});

test('back-up met verkeerd wachtwoord wordt geweigerd zonder lokale gegevens te wijzigen', async () => {
  await vault.reset();
  const initial = phase2InitialData();
  await vault.create(phase2Password, initial);
  const backup = structuredClone(vault.getEnvelope());
  const current = { ...initial, progress: [{ id: 'm4:gold', done: false }] };
  await vault.setData(current);
  const before = structuredClone(vault.getEnvelope());
  const syncBefore = vault.getSyncMeta();
  await assert.rejects(vault.restoreBackup(backup, 'verkeerd wachtwoord'), { name: 'WrongPasswordError' });
  assert.deepEqual(vault.getData(), current);
  assert.deepEqual(vault.getEnvelope(), before);
  assert.deepEqual(vault.getSyncMeta(), syncBefore);
});

test('back-up van een andere kluis vervangt ook de lokale datasleutel', async () => {
  await vault.reset();
  const backupData = phase2InitialData();
  await vault.create(phase2Password, backupData);
  const backup = structuredClone(vault.getEnvelope());

  await vault.reset();
  const currentData = { ...phase2InitialData(), progress: [{ id: 'ander-wapen', done: true }] };
  await vault.create(phase2Password, currentData);
  const result = await vault.restoreBackup(backup, phase2Password);

  assert.equal(result.sameKey, false);
  assert.deepEqual(withoutSyncState(vault.getData()), backupData);
  vault.lock();
  await vault.unlockWithPassword(phase2Password);
  assert.deepEqual(withoutSyncState(vault.getData()), backupData);
  assert.deepEqual(vault.getData().__pwaSync, { version: 1, devices: {}, deletions: {} });
});

test('bestaande Core 1.0.0-kluis opent legacy-envelope zonder sleutel- of dataconversie', async () => {
  await vault.reset();
  const password = 'synthetische legacy wachtzin 2026';
  const salt = Uint8Array.from({ length: 16 }, (_, i) => i + 1);
  const wrapIv = Uint8Array.from({ length: 12 }, (_, i) => i + 21);
  const payloadIv = Uint8Array.from({ length: 12 }, (_, i) => i + 41);
  const dataKeyBytes = Uint8Array.from({ length: 32 }, (_, i) => i + 1);
  const legacyData = {
    schema: 4,
    progress: [{ id: 'synthetic-weapon:gold', weaponId: 'synthetic-weapon', camoId: 'gold', done: true, updatedAt: 100 }],
    loadouts: [{ id: 'synthetic-loadout', name: 'Synthetische loadout', updatedAt: 110 }],
    pins: [],
    overviewOrder: null,
  };
  const passwordMaterial = await webcrypto.subtle.importKey(
    'raw', new TextEncoder().encode(password.normalize('NFC')), 'PBKDF2', false, ['deriveKey'],
  );
  const wrappingKey = await webcrypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600_000 },
    passwordMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
  const dataKey = await webcrypto.subtle.importKey(
    'raw', dataKeyBytes, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'],
  );
  const wrappedKey = await webcrypto.subtle.wrapKey(
    'raw', dataKey, wrappingKey, { name: 'AES-GCM', iv: wrapIv },
  );
  const payload = await webcrypto.subtle.encrypt(
    { name: 'AES-GCM', iv: payloadIv }, dataKey,
    new TextEncoder().encode(JSON.stringify(legacyData)),
  );
  const b64 = (bytes) => Buffer.from(bytes).toString('base64');
  const envelope = {
    format: 'pwa-vault',
    version: 1,
    kdf: { name: 'PBKDF2-SHA256', iterations: 600_000, salt: b64(salt) },
    wrappedKey: { iv: b64(wrapIv), data: b64(wrappedKey) },
    payload: { iv: b64(payloadIv), data: b64(payload) },
    updatedAt: 123456789,
  };

  localStorage.setItem(vault.KEYS.vault, JSON.stringify(envelope));
  assert.equal(vault.hasVault(), true);
  await vault.unlockWithPassword(password);
  assert.deepEqual(vault.getData(), legacyData);
  const openedKey = new Uint8Array(await webcrypto.subtle.exportKey('raw', vault.getDataKey()));
  assert.deepEqual(openedKey, dataKeyBytes);
  assert.equal(vault.getEnvelope().format, 'pwa-vault');
  assert.equal(vault.getEnvelope().version, 1);

  await vault.prepareSyncData();
  await vault.flush();
  assert.deepEqual(vault.getData().progress, legacyData.progress);
  assert.deepEqual(vault.getData().loadouts, legacyData.loadouts);
  assert.equal(vault.getData().schema, 4);
  assert.equal(vault.getData().__pwaSync.version, 1);
  const persistedKey = new Uint8Array(await webcrypto.subtle.exportKey('raw', vault.getDataKey()));
  assert.deepEqual(persistedKey, dataKeyBytes);
  assert.equal(vault.getEnvelope().version, 1);
});
