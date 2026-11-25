import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import * as ui from '../js/core/pairing-ui.js';
globalThis.crypto ??= webcrypto;
const context = 'mw4-camo';
const github = { owner:'Gertjun', repo:'SyncData', branch:'main', path:'mw4-camo/vault.json', token:'synthetic-token' };
const appUrl = 'https://gertjun.github.io/MW4-CAMO/';
class MemoryStorage {
  values = new Map();
  getItem(k) { return this.values.get(k) ?? null; }
  setItem(k,v) { this.values.set(k,String(v)); }
}
test('MW4 uses shared v3 QR with its own context and no PIN', async () => {
  const dataKey = await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
  const created = await ui.createPairing({syncConfig:github,dataKey,context,appUrl});
  assert.equal(created.pin,null);
  assert.ok(created.qr);
  assert.ok(new URL(created.link).hash.startsWith('#pair='));
  const storage = new MemoryStorage();
  const opened = await ui.openPairing({input:created.link,context,storage});
  assert.deepEqual(opened.syncConfig,github);
  assert.deepEqual(await crypto.subtle.exportKey('raw',opened.dataKey),await crypto.subtle.exportKey('raw',dataKey));
  opened.markUsed();
  await assert.rejects(ui.openPairing({input:created.code,context,storage}),/al gebruikt/);
  await assert.rejects(ui.openPairing({input:created.code,context,storage:new MemoryStorage(),now:created.expiresAt}),/verlopen/);
});
test('MW4 still accepts legacy v2 with PIN', async () => {
  const created = await ui.createPairing({syncConfig:github,context,appUrl});
  assert.ok(created.pin);
  const opened = await ui.openPairing({input:created.link,pin:created.pin,context,storage:new MemoryStorage()});
  assert.deepEqual(opened.syncConfig,github);
  assert.equal(opened.dataKey,undefined);
  await assert.rejects(ui.openPairing({input:created.code,pin:'ZZZZ-9999-AAAA-BBBB',context,storage:new MemoryStorage()}));
});
test('MW4 uses only Core shell pairing handlers', async () => {
  const main = await readFile(new URL('../js/main.js',import.meta.url),'utf8');
  assert.match(main,/core\/shell\.js/);
  assert.doesNotMatch(main,/installDevicePairingUi/);
});
