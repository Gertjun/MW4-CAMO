import test from 'node:test';
import assert from 'node:assert/strict';
import { alive, findById, mergeCollections, newRecord, purgeTombstones, removeById, updateById } from '../js/core/records.js';

test('newRecord maakt een record met unieke id en tijdstempels', () => {
  const a = newRecord({ name: 'Eerste' });
  const b = newRecord({ name: 'Tweede' });
  assert.ok(a.id);
  assert.notEqual(a.id, b.id);
  assert.equal(a.createdAt, a.updatedAt);
  assert.equal(a.name, 'Eerste');
});

test('updateById wijzigt een bestaand record en actualiseert updatedAt', () => {
  const list = [{ id: 'a', name: 'Oud', updatedAt: 1 }];
  const result = updateById(list, 'a', { name: 'Nieuw' });
  assert.equal(result.name, 'Nieuw');
  assert.ok(result.updatedAt > 1);
  assert.equal(updateById(list, 'ontbreekt', {}), undefined);
});

test('removeById maakt een tombstone die niet als actief record verschijnt', () => {
  const list = [{ id: 'a', name: 'Loadout', createdAt: 1, updatedAt: 1 }];
  removeById(list, 'a');
  assert.deepEqual(list[0], { id: 'a', deleted: true, updatedAt: list[0].updatedAt });
  assert.deepEqual(alive(list), []);
  assert.equal(findById(list, 'a'), undefined);
});

test('mergeCollections behoudt verschillende records en kiest de nieuwste wijziging', () => {
  const merged = mergeCollections(
    [{ id: 'a', value: 'lokaal', updatedAt: 20 }, { id: 'b', value: 'alleen lokaal', updatedAt: 5 }],
    [{ id: 'a', value: 'remote', updatedAt: 10 }, { id: 'c', value: 'alleen remote', updatedAt: 7 }],
  );
  assert.deepEqual(Object.fromEntries(merged.map((r) => [r.id, r.value])), {
    a: 'lokaal', b: 'alleen lokaal', c: 'alleen remote',
  });
});

test('een nieuwere verwijdermarkering wint van een oudere wijziging', () => {
  const merged = mergeCollections(
    [{ id: 'loadout-1', deleted: true, updatedAt: 30 }],
    [{ id: 'loadout-1', name: 'Oude loadout', updatedAt: 20 }],
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].deleted, true);
});

test('bij gelijke updatedAt wint de lokale versie', () => {
  const merged = mergeCollections(
    [{ id: 'a', value: 'lokaal', updatedAt: 10 }],
    [{ id: 'a', value: 'remote', updatedAt: 10 }],
  );
  assert.equal(merged[0].value, 'lokaal');
});

test('purgeTombstones verwijdert alleen oude verwijdermarkeringen', () => {
  const now = Date.now();
  const list = [
    { id: 'oud', deleted: true, updatedAt: now - 91 * 86_400_000 },
    { id: 'nieuw', deleted: true, updatedAt: now - 2 * 86_400_000 },
    { id: 'actief', updatedAt: now - 400 * 86_400_000 },
  ];
  const kept = purgeTombstones(list, 90);
  assert.deepEqual(kept.map((r) => r.id), ['nieuw', 'actief']);
});
