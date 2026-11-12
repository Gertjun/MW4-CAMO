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
