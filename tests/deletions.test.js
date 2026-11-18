import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SYSTEM_KEY, emptySyncState, registerDevice, reconcileData, reconcileBackup, applyDeletionLedger,
} from '../js/core/deletions.js';
import { mergeCollections } from '../js/core/records.js';

test('graveyard voorkomt dat een oude actieve loadout terugkomt na app-merge', () => {
  const local = { schema: 4, loadouts: [{ id: 'synthetic-loadout-1', deleted: true, updatedAt: 20 }] };
  const remote = { schema: 4, loadouts: [{ id: 'synthetic-loadout-1', name: 'oude kopie', updatedAt: 10 }] };
  const merged = reconcileData(local, remote, (a, b) => ({
    ...b, ...a, loadouts: mergeCollections(a.loadouts, b.loadouts),
  }));
  assert.deepEqual(merged.loadouts, []);
  assert.equal(merged[SYSTEM_KEY].deletions['loadouts:synthetic-loadout-1'], 20);
});

test('deletion keys zijn collectiegebonden, ook bij dezelfde record-ID', () => {
  const local = {
    loadouts: [{ id: 'synthetic-shared-id', deleted: true, updatedAt: 50 }],
    pins: [],
  };
  const remote = {
    loadouts: [],
    pins: [{ id: 'synthetic-shared-id', pinned: true, updatedAt: 40 }],
  };
  const merged = reconcileData(local, remote, (a, b) => ({
    ...b, ...a,
    loadouts: mergeCollections(a.loadouts, b.loadouts),
    pins: mergeCollections(a.pins, b.pins),
  }));
  assert.deepEqual(merged.loadouts, []);
  assert.deepEqual(merged.pins, [{ id: 'synthetic-shared-id', pinned: true, updatedAt: 40 }]);
});

test('back-upherstel behoudt de actuele graveyard en blokkeert oude records', () => {
  const backup = {
    schema: 4,
    loadouts: [{ id: 'synthetic-restored-item', name: 'oud back-uprecord', updatedAt: 1 }],
  };
  const current = {
    schema: 4,
    loadouts: [],
    [SYSTEM_KEY]: {
      version: 1,
      devices: {},
      deletions: { 'loadouts:synthetic-restored-item': 30 },
    },
  };
  const restored = reconcileBackup(backup, current);
  assert.deepEqual(restored.loadouts, []);
  assert.equal(restored[SYSTEM_KEY].deletions['loadouts:synthetic-restored-item'], 30);
});

test('tombstone blijft bestaan tot ieder actief apparaat de verwijdering heeft bevestigd', () => {
  let state = emptySyncState();
  state = registerDevice(state, 'synthetic-device-a', 10);
  state = registerDevice(state, 'synthetic-device-b', 20);
  state.deletions['loadouts:synthetic-item'] = 30;
  state.devices['synthetic-device-a'].acknowledged['loadouts:synthetic-item'] = 30;

  const data = {
    [SYSTEM_KEY]: state,
    loadouts: [{ id: 'synthetic-item', deleted: true, updatedAt: 30 }],
  };
  assert.equal(applyDeletionLedger(structuredClone(data)).loadouts.length, 1);

  state.devices['synthetic-device-b'].acknowledged['loadouts:synthetic-item'] = 30;
  const fullyAcknowledged = applyDeletionLedger({
    [SYSTEM_KEY]: state,
    loadouts: [{ id: 'synthetic-item', deleted: true, updatedAt: 30 }],
  });
  assert.deepEqual(fullyAcknowledged.loadouts, []);
});


test('nieuwere hercreatie wint van een oudere verwijdering', () => {
  const state = { version: 1, devices: {}, deletions: { 'loadouts:revived-item': 20 } };
  const result = applyDeletionLedger({
    [SYSTEM_KEY]: state,
    loadouts: [
      { id: 'revived-item', deleted: true, updatedAt: 20 },
      { id: 'revived-item', name: 'opnieuw aangemaakt', updatedAt: 21 },
    ],
  });
  assert.deepEqual(result.loadouts, [
    { id: 'revived-item', name: 'opnieuw aangemaakt', updatedAt: 21 },
  ]);
  assert.equal(Object.hasOwn(result[SYSTEM_KEY].deletions, 'loadouts:revived-item'), false);
});

test('gelijke of oudere hercreatie heft een verwijdering niet op', () => {
  for (const updatedAt of [20, 19, undefined]) {
    const state = { version: 1, devices: {}, deletions: { 'loadouts:still-deleted': 20 } };
    const record = { id: 'still-deleted', name: 'ambigu of ouder' };
    if (updatedAt !== undefined) record.updatedAt = updatedAt;
    const result = applyDeletionLedger({
      [SYSTEM_KEY]: state,
      loadouts: [
        { id: 'still-deleted', deleted: true, updatedAt: 20 },
        record,
      ],
    });
    assert.deepEqual(result.loadouts, []);
    assert.equal(result[SYSTEM_KEY].deletions['loadouts:still-deleted'], 20);
  }
});
