import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../js/app.js';

test('initialData bevat alle onderdelen van het huidige schema', () => {
  assert.deepEqual(app.initialData(), {
    schema: app.schemaVersion,
    progress: [],
    loadouts: [],
    pins: [],
    overviewOrder: null,
  });
});

test('migratie van oudere schema’s voegt ontbrekende onderdelen toe zonder voortgang te verliezen', () => {
  const old = { schema: 1, progress: [{ id: 'm4:gold', done: true, updatedAt: 10 }] };
  const migrated = app.migrate(old);
  assert.equal(migrated.schema, app.schemaVersion);
  assert.deepEqual(migrated.progress, [{ id: 'm4:gold', done: true, updatedAt: 10 }]);
  assert.deepEqual(migrated.loadouts, []);
  assert.deepEqual(migrated.pins, []);
  assert.equal(migrated.overviewOrder, null);
});

test('migratie bewaart ook oude tombstones zolang niet alle apparaten bevestigd hebben', () => {
  const oldTombstone = { id: 'oude-loadout', deleted: true, updatedAt: Date.now() - 365 * 86_400_000 };
  const data = {
    schema: app.schemaVersion,
    progress: [],
    loadouts: [oldTombstone],
    pins: [],
    overviewOrder: null,
  };
  const migrated = app.migrate(data);
  assert.deepEqual(migrated.loadouts, [oldTombstone]);
});

test('merge combineert voortgang, loadouts en pins zonder wijzigingen te verliezen', () => {
  const local = {
    schema: 4,
    progress: [{ id: 'm4:gold', done: true, updatedAt: 30 }],
    loadouts: [{ id: 'local-lo', name: 'Lokaal', updatedAt: 10 }],
    pins: [{ id: 'm4', pinned: true, updatedAt: 10 }],
    overviewOrder: { order: ['loadouts', 'summary'], updatedAt: 20 },
  };
  const remote = {
    schema: 3,
    progress: [{ id: 'm4:gold', done: false, updatedAt: 20 }, { id: 'm13:gold', done: true, updatedAt: 15 }],
    loadouts: [{ id: 'remote-lo', name: 'Remote', updatedAt: 12 }],
    pins: [{ id: 'm4', pinned: false, updatedAt: 20 }, { id: 'm13', pinned: true, updatedAt: 10 }],
    overviewOrder: { order: ['summary', 'loadouts'], updatedAt: 10 },
  };
  const merged = app.merge(local, remote);
  assert.equal(merged.schema, 4);
  assert.equal(merged.progress.find((r) => r.id === 'm4:gold').done, true);
  assert.equal(merged.progress.find((r) => r.id === 'm13:gold').done, true);
  assert.deepEqual(merged.loadouts.map((r) => r.id).sort(), ['local-lo', 'remote-lo']);
  assert.equal(merged.pins.find((r) => r.id === 'm4').pinned, false);
  assert.equal(merged.pins.find((r) => r.id === 'm13').pinned, true);
  assert.deepEqual(merged.overviewOrder.order, ['loadouts', 'summary']);
});

test('merge bewaart een verwijdermarkering van een loadout', () => {
  const local = { schema: 4, progress: [], loadouts: [{ id: 'lo', deleted: true, updatedAt: 50 }], pins: [], overviewOrder: null };
  const remote = { schema: 4, progress: [], loadouts: [{ id: 'lo', name: 'Loadout', updatedAt: 40 }], pins: [], overviewOrder: null };
  assert.equal(app.merge(local, remote).loadouts[0].deleted, true);
});
