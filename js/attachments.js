// =============================================================
//  Keuzelijst van attachments per wapen
// =============================================================
// Per wapen tonen we eerst de eigen onderdelen (die je met dat wapen
// vrijspeelt, zie attachments-data.js). Sommige slots delen wapens met elkaar
// (optics, muzzles, lasers, underbarrels, magazijnen): daarvoor tonen we ook
// de onderdelen van verwante wapens, als "andere wapens". Welke daarvan echt
// passen is niet zeker bekend; met "Anders…" kun je altijd zelf typen.

import { OWN_ATTACHMENTS, SLOT_ORDER } from './attachments-data.js';
import { WEAPONS } from './catalog.js';

const GROUP = { ar: 'rifle', smg: 'rifle', lmg: 'rifle', marksman: 'rifle', sniper: 'rifle', shotgun: 'shotgun', pistol: 'pistol' };

// Gedeelde slots: welke wapengroepen kunnen elkaars onderdelen gebruiken.
const SHARED = {
  Optic: { rifle: ['rifle', 'shotgun'], shotgun: ['rifle', 'shotgun'], pistol: ['pistol'] },
  Muzzle: { rifle: ['rifle'], shotgun: ['shotgun'], pistol: ['pistol'] },
  Underbarrel: { rifle: ['rifle'], shotgun: ['rifle'] },
  Laser: { rifle: ['rifle'], shotgun: ['rifle'], pistol: ['pistol'] },
  Magazine: { rifle: ['rifle'], pistol: ['pistol'] },
};

// Per groep en slot: alle onderdelen, in volgorde van de wapenlijst.
const POOLS = {};
for (const w of WEAPONS) {
  const g = GROUP[w.cls];
  const own = OWN_ATTACHMENTS[w.id];
  if (!g || !own) continue;
  for (const [slot, names] of Object.entries(own)) {
    const pool = ((POOLS[g] ??= {})[slot] ??= []);
    for (const n of names) if (!pool.includes(n)) pool.push(n);
  }
}

const cache = new Map();

/** [{ slot, own: [namen], other: [namen] }] in de volgorde van het spel. */
export function attachmentGroups(weapon) {
  if (!weapon) return [];
  if (cache.has(weapon.id)) return cache.get(weapon.id);
  const own = OWN_ATTACHMENTS[weapon.id] || {};
  const group = GROUP[weapon.cls];
  const result = [];
  for (const slot of SLOT_ORDER) {
    const mine = own[slot] || [];
    const from = (group && SHARED[slot]?.[group]) || [];
    const other = [];
    for (const g of from) {
      for (const n of POOLS[g]?.[slot] || []) if (!mine.includes(n) && !other.includes(n)) other.push(n);
    }
    if (mine.length || other.length) result.push({ slot, own: mine, other });
  }
  cache.set(weapon.id, result);
  return result;
}

/** In welk slot zit dit onderdeel voor dit wapen? null = niet in de lijst (eigen invoer). */
export function slotOf(weapon, name) {
  for (const g of attachmentGroups(weapon)) if (g.own.includes(name) || g.other.includes(name)) return g.slot;
  return null;
}
