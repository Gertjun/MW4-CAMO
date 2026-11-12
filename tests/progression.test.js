import test from 'node:test';
import assert from 'node:assert/strict';
import { WEAPONS, CLASSES, LAUNCH_COUNT, LAUNCH_IN_CLASS, camosOf, weaponById, PRESTIGE_CAMOS, MASTERY_CAMOS } from '../js/catalog.js';
import { progressionRules } from '../js/app.js';

const { missingFor, masteryMissing, earlierOnWeapon, key } = progressionRules;
const doneWith = (...ids) => new Set(ids);

test('catalogus heeft 33 lanceerwapens en 2 seizoenswapens', () => {
  assert.equal(LAUNCH_COUNT, 33);
  assert.equal(WEAPONS.length, 35);
  assert.equal(WEAPONS.filter((w) => w.season).length, 2);
});

test('Platinum-drempels volgen de aantallen bij lancering per klasse', () => {
  assert.deepEqual(LAUNCH_IN_CLASS, {
    ar: 8, smg: 5, shotgun: 2, lmg: 3, marksman: 3,
    sniper: 3, pistol: 4, launcher: 4, melee: 1,
  });
  assert.equal(Object.keys(LAUNCH_IN_CLASS).length, CLASSES.length);
});

test('Platinum telt het eigen wapen mee en blokkeert één onder de drempel', () => {
  const han = weaponById('han-86');
  const sevenOtherGold = doneWith(
    ...WEAPONS.filter((w) => w.cls === 'ar' && w.id !== han.id).slice(0, 7).map((w) => key(w.id, 'gold')),
  );
  const missing = missingFor(sevenOtherGold, han, { id: 'platinum' });
  assert.equal(missing, null);

  const sixOtherGold = doneWith(
    ...WEAPONS.filter((w) => w.cls === 'ar' && w.id !== han.id).slice(0, 6).map((w) => key(w.id, 'gold')),
  );
  const blocked = missingFor(sixOtherGold, han, { id: 'platinum' });
  assert.equal(blocked.need, 8);
  assert.equal(blocked.have, 7);
  assert.equal(blocked.short, 1);
  assert.equal(blocked.candidates.length, WEAPONS.filter((w) => w.cls === 'ar').length - 7);
});

test('seizoenswapens tellen mee voor Platinum, maar verhogen de drempel niet', () => {
  const han = weaponById('han-86');
  const goldIds = WEAPONS.filter((w) => w.cls === 'ar' && w.id !== han.id).slice(0, 7).map((w) => key(w.id, 'gold'));
  assert.ok(goldIds.includes(key('cronen-osprey', 'gold')) || WEAPONS.filter((w) => w.cls === 'ar' && w.id !== han.id).slice(0, 7).some(w => w.season));
  assert.equal(missingFor(doneWith(...goldIds), han, { id: 'platinum' }), null);
});

test('Harmonic Break vereist 33 Platinum en telt het eigen wapen mee', () => {
  const own = weaponById('han-86');
  const others = WEAPONS.filter((w) => w.id !== own.id);
  const enough = doneWith(...others.slice(0, 32).map((w) => key(w.id, 'platinum')));
  assert.equal(missingFor(enough, own, { id: 'harmonic' }), null);

  const short = doneWith(...others.slice(0, 31).map((w) => key(w.id, 'platinum')));
  const blocked = missingFor(short, own, { id: 'harmonic' });
  assert.equal(blocked.need, 33);
  assert.equal(blocked.have, 32);
  assert.equal(blocked.short, 1);
});

test('Harmonic-drempel blijft 33, ook met seizoenswapens in de catalogus', () => {
  const allButOne = WEAPONS.filter((w) => w.id !== 'han-86').slice(0, 32);
  assert.equal(allButOne.length, 32);
  assert.equal(missingFor(doneWith(...allButOne.map((w) => key(w.id, 'platinum'))), weaponById('han-86'), { id: 'harmonic' }), null);
});

test('Divergence en mastery-camo’s vereisen Harmonic Break op 33 wapens', () => {
  const thirtyTwo = doneWith(...WEAPONS.slice(0, 32).map((w) => key(w.id, 'harmonic')));
  const blocked = masteryMissing(thirtyTwo);
  assert.equal(blocked.need, 33);
  assert.equal(blocked.have, 32);
  assert.equal(blocked.short, 1);
  assert.equal(masteryMissing(doneWith(...WEAPONS.slice(0, 33).map((w) => key(w.id, 'harmonic')))), null);
});

test('seizoenswapens kunnen het 33e Harmonic Break-wapen zijn', () => {
  const ids = WEAPONS.filter((w) => w.id !== 'cronen-osprey').slice(0, 32).map((w) => key(w.id, 'harmonic'));
  assert.equal(masteryMissing(doneWith(...ids)), null);
});

test('Platinum en Harmonic Break volgen de volgorde van eerdere camo’s op hetzelfde wapen', () => {
  const weapon = weaponById('han-86');
  const camos = camosOf(weapon);
  const platinumPrerequisites = earlierOnWeapon(weapon, { id: 'platinum' });
  assert.equal(platinumPrerequisites.length, 11);
  assert.deepEqual(platinumPrerequisites.slice(-1), ['gold']);
  assert.equal(platinumPrerequisites.includes('mil1'), true);
  assert.equal(platinumPrerequisites.includes('sp1'), true);

  const harmonicPrerequisites = earlierOnWeapon(weapon, { id: 'harmonic' });
  assert.equal(harmonicPrerequisites.length, 12);
  assert.deepEqual(harmonicPrerequisites.slice(-2), ['gold', 'platinum']);
  assert.equal(camos.length, 14);
});

test('prestige-camo’s worden in vaste volgorde vrijgespeeld', () => {
  const weapon = weaponById('han-86');
  assert.deepEqual(earlierOnWeapon(weapon, PRESTIGE_CAMOS[0]), []);
  assert.deepEqual(earlierOnWeapon(weapon, PRESTIGE_CAMOS[1]), ['pres1']);
  assert.deepEqual(earlierOnWeapon(weapon, PRESTIGE_CAMOS[2]), ['pres1', 'pres2']);
  assert.deepEqual(earlierOnWeapon(weapon, PRESTIGE_CAMOS[3]), ['pres1', 'pres2', 'pres3']);
});

test('mastery-camo’s komen allemaal tegelijk vrij en zijn accountbreed', () => {
  assert.equal(MASTERY_CAMOS.length, 6);
  const ids = doneWith(...WEAPONS.slice(0, 33).map((w) => key(w.id, 'harmonic')));
  assert.equal(masteryMissing(ids), null);
});
