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
