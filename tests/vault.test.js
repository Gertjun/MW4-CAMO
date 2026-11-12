import test from 'node:test';
import assert from 'node:assert/strict';

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
  assert.deepEqual(vault.getData(), initial);
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
  assert.deepEqual(vault.getData(), backupData);
  vault.lock();
  await vault.unlockWithPassword(phase2Password);
  assert.deepEqual(vault.getData(), backupData);
});
