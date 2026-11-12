// =============================================================
//  MW4 Camo Tracker — app-specifieke code
// =============================================================
// Gegevens in de kluis:
//   progress: [{ id, weaponId, camoId, done, doneAt, createdAt, updatedAt }]
//     id = '<wapen>:<camo>' voor gewone en prestige-camo's (pres1–pres4),
//     id = 'mastery:<camo>' voor de 6 mastery-camo's (weaponId 'mastery').
//   pins:     [{ id: '<wapen>', pinned, createdAt, updatedAt }] (sinds schema 3)
//   loadouts: zie js/loadouts.js (sinds schema 2)
//   overviewOrder: { order: ['summary', …], updatedAt } of null (sinds schema 4)
//     volgorde van de blokken in het Overzicht op de telefoon; bij sync wint de nieuwste.
// Eén record per camo met een vaste id. Uitvinken zet done op false
// (niets wordt verwijderd), zodat sync per camo de nieuwste wijziging kiest.
// De wapen- en camolijst zelf staat in js/catalog.js.

import { h, today } from './core/dom.js';
import { newRecord, updateById, mergeCollections } from './core/records.js';
import {
  CLASSES, WEAPONS, camosOf, classById, CAMOS_PER_WEAPON, imageOf, weaponImageOf,
  PRESTIGE_CAMOS, MASTERY_CAMOS, MASTERY_MODES, LAUNCH_COUNT, LAUNCH_IN_CLASS,
} from './catalog.js';
import { renderLoadouts, closeOnLock } from './loadouts.js';
import { APP } from './config.js';

// 1 = alleen camo-voortgang; 2 = ook loadouts; 3 = ook vastgepinde wapens,
// prestige- en mastery-camo's.
const SCHEMA = 4;

// Schermkeuzes (alleen tijdens gebruik, niet in de kluis).
// layout: 'grid' (kaarten) of 'list' (tabel met alle camo's naast elkaar).
const ui = { ovEdit: false, view: 'overview', layout: 'grid', filter: 'all', group: 'class', sort: 'default', open: new Set(), listScroll: 0 };

// Schermen in de navigatie van de schil (core/nav.js). icon = SVG-paden (24×24, lijnen).
// Instellingen komt er vanzelf als laatste bij.
const VIEWS = [
  { id: 'overview', label: 'Overzicht', icon: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'] },
  { id: 'camos', label: "Camo's", icon: ['M4 4h7v7H4z', 'M13 4h7v7h-7z', 'M4 13h7v7H4z', 'M13 13h7v7h-7z'] },
  { id: 'loadouts', label: 'Loadouts', icon: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18', 'M12 1v6', 'M12 17v6', 'M1 12h6', 'M17 12h6'] },
];

const LAYOUTS = [
  { id: 'grid', label: 'Grid' },
  { id: 'list', label: 'Lijst' },
];

const GROUPINGS = [
  { id: 'class', label: 'Klasse' },
  { id: 'status', label: 'Voortgang' },
  { id: 'none', label: 'Geen' },
];

const SORTS = [
  { id: 'default', label: 'Standaard' },
  { id: 'name', label: 'Naam (A–Z)' },
  { id: 'least', label: "Minste camo's" },
  { id: 'most', label: "Meeste camo's" },
];

const STATUSES = [
  { id: 'busy', label: 'Bezig' },
  { id: 'new', label: 'Niet begonnen' },
  { id: 'done', label: 'Klaar' },
];

const GROUPS = [
  { id: 'military', label: 'Militair' },
  { id: 'special', label: 'Speciaal' },
  { id: 'mastery', label: 'Mastery' },
  { id: 'prestige', label: 'Prestige' },
];

const MASTERY_ID = 'mastery';
let resizeHooked = false;
// ctx.go van de schil: naar een ander scherm (gezet bij elke render).
let go = () => {};
const CAMOS = new Map(WEAPONS.map((w) => [w.id, camosOf(w)]));
const ALL_CAMOS = new Map(WEAPONS.map((w) => [w.id, [...CAMOS.get(w.id), ...PRESTIGE_CAMOS]]));

// ---------- Voortgang lezen ----------

function progressIndex(data) {
  const done = new Set();
  for (const r of data.progress || []) if (!r.deleted && r.done) done.add(r.id);
  return done;
}

function pinnedSet(data) {
  return new Set((data.pins || []).filter((r) => !r.deleted && r.pinned).map((r) => r.id));
}

const key = (weaponId, camoId) => `${weaponId}:${camoId}`;

// ---------- Vrijspeelregels ----------
// Zoals op codmunity.gg: een camo aanvinken vinkt de eerdere camo's van
// hetzelfde wapen ook aan; uitvinken haalt alleen die ene camo weg.
// Wat van ándere wapens afhangt (Platinum, Harmonic Break, mastery-camo's)
// kan niet automatisch; dan volgt een pop-up met wat er mist.
// Het spel telt met de aantallen van de lancering (zie LAUNCH_* in catalog.js):
// Platinum = Gold op 8 assault rifles enz., Harmonic Break = 33 × Platinum.
// Seizoenswapens tellen mee om dat aantal te halen.

/** Camo's van hetzelfde wapen die vóór deze camo komen (worden mee aangevinkt). */
function earlierOnWeapon(weapon, camo) {
  const camos = CAMOS.get(weapon.id);
  const military = camos.filter((c) => c.group === 'military');
  const basics = camos.filter((c) => c.group === 'military' || c.group === 'special');
  if (camo.group === 'military') return military.filter((c) => c.n < camo.n).map((c) => c.id);
  if (camo.group === 'prestige') return PRESTIGE_CAMOS.filter((c) => c.n < camo.n).map((c) => c.id);
  if (camo.id === 'gold') return basics.map((c) => c.id);
  if (camo.id === 'platinum') return [...basics.map((c) => c.id), 'gold'];
  if (camo.id === 'harmonic') return [...basics.map((c) => c.id), 'gold', 'platinum'];
  return [];
}

/**
 * Wat ontbreekt er nog om deze camo aan te vinken? null = mag.
 * Anders: { short, need, have, tier, candidates } — short = hoeveel wapens nog
 * `tier` nodig hebben; candidates = wapens die dat nog niet hebben.
 * Het eigen wapen telt mee (het krijgt Gold/Platinum automatisch erbij).
 */
function missingFor(done, weapon, camo) {
  let tier; let pool; let need;
  if (camo.id === 'platinum') {
    tier = 'gold'; need = LAUNCH_IN_CLASS[weapon.cls];
    pool = WEAPONS.filter((w) => w.cls === weapon.cls);
  } else if (camo.id === 'harmonic') {
    tier = 'platinum'; need = LAUNCH_COUNT; pool = WEAPONS;
  } else return null;
  const ok = (w) => w.id === weapon.id || done.has(key(w.id, tier));
  const have = pool.filter(ok).length;
  const short = need - have;
  return short > 0 ? { short, need, have, tier, candidates: pool.filter((w) => !ok(w)) } : null;
}

/** Mastery-camo's (en Divergence) komen vrij na Harmonic Break op 33 wapens. null = vrij. */
function masteryMissing(done) {
  const have = WEAPONS.filter((w) => done.has(key(w.id, 'harmonic'))).length;
  const short = LAUNCH_COUNT - have;
  return short > 0
    ? { short, need: LAUNCH_COUNT, have, tier: 'harmonic', candidates: WEAPONS.filter((w) => !done.has(key(w.id, 'harmonic'))) }
    : null;
}

const TIER_NAMES = { gold: 'Gold', platinum: 'Platinum', harmonic: 'Harmonic Break' };

/**
 * Zuivere vrijspeelregels, ook beschikbaar voor regressietests.
 * done bevat record-id's van reeds vrijgespeelde camo's.
 */
export const progressionRules = {
  missingFor,
  masteryMissing,
  earlierOnWeapon,
  key,
};


/** Tekst voor de pop-up: "Je hebt Gold nodig op 8 assault rifles. Je hebt er 6; nog 2 nodig." */
function shortText(m, what) {
  return `Je hebt ${TIER_NAMES[m.tier]} nodig op ${m.need} ${what}. Je hebt er nu ${m.have}, dus nog ${m.short} nodig. Wapens zonder ${TIER_NAMES[m.tier]}:`;
}

// ---------- Pop-up ----------

function showBlocked(title, intro, items) {
  const shown = items.slice(0, 12);
  const rest = items.length - shown.length;
  const dlg = h('dialog', { class: 'sheet camo-dialog', 'aria-labelledby': 'camo-dlg-title' },
    h('div', { class: 'sheet-header' },
      h('h2', { id: 'camo-dlg-title' }, title),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Sluiten', onClick: () => dlg.close() }, '✕')),
    h('div', { class: 'sheet-body' },
      h('p', {}, intro),
      h('ul', { class: 'missing-list' }, shown.map((t) => h('li', {}, t))),
      rest > 0 ? h('p', { class: 'muted' }, `…en nog ${rest}.`) : null,
      h('button', { class: 'btn btn-primary btn-block', type: 'button', onClick: () => dlg.close() }, 'OK')));
  dlg.addEventListener('close', () => dlg.remove());
  closeOnLock(dlg);
  document.body.append(dlg);
  dlg.showModal();
}

// ---------- Wijzigen ----------

/** Zet of maakt een record met vaste id (ook als er een tombstone staat). */
function upsert(list, id, fields) {
  const existing = list.find((r) => r.id === id);
  if (existing && !existing.deleted) updateById(list, id, fields);
  else if (existing) Object.assign(existing, newRecord({ id, ...fields }));
  else list.push(newRecord({ id, ...fields }));
}

async function setDone(ctx, ownerId, camoIds, value) {
  await ctx.update((d) => {
    for (const camoId of camoIds) {
      upsert(d.progress, key(ownerId, camoId), { weaponId: ownerId, camoId, done: value, doneAt: value ? today() : null });
    }
  });
}

async function setPinned(ctx, weapon, value) {
  await ctx.update((d) => {
    d.pins ??= [];
    upsert(d.pins, weapon.id, { pinned: value });
  });
}

function onToggle(ctx, done, weapon, camo, checkbox) {
  const isDone = done.has(key(weapon.id, camo.id));
  if (isDone) {
    setDone(ctx, weapon.id, [camo.id], false);
    return;
  }
  const missing = missingFor(done, weapon, camo);
  if (missing) {
    checkbox.checked = false;
    const what = camo.id === 'platinum' ? `wapens in de klasse ${classById(weapon.cls).full}` : 'wapens';
    showBlocked(`${camo.name} is nog niet vrij`,
      `Voor ${camo.name} op de ${weapon.name}: ${shortText(missing, what)}`,
      missing.candidates.map((w) => w.name));
    return;
  }
  const extra = earlierOnWeapon(weapon, camo).filter((id) => !done.has(key(weapon.id, id)));
  setDone(ctx, weapon.id, [...extra, camo.id], true);
}

function onMasteryToggle(ctx, done, camo, checkbox) {
  const isDone = done.has(key(MASTERY_ID, camo.id));
  if (!isDone) {
    const missing = masteryMissing(done);
    if (missing) {
      checkbox.checked = false;
      showBlocked(`${camo.name} is nog niet vrij`,
        `Mastery-camo's komen vrij na Harmonic Break op ${LAUNCH_COUNT} wapens. ${shortText(missing, 'wapens')}`,
        missing.candidates.map((w) => w.name));
      return;
    }
  }
  setDone(ctx, MASTERY_ID, [camo.id], !isDone);
}

// ---------- Weergave ----------

/** Percentage naar beneden afgerond: 100% verschijnt pas als echt alles klaar is. */
function pct(value, max) {
  return max ? Math.floor((value / max) * 100) : 0;
}

/** "3 / 14 · 21%" — telling met percentage, voor alle voortgangsblokken. */
function frac(value, max, sep = ' / ') {
  return `${value}${sep}${max} · ${pct(value, max)}%`;
}

function bar(value, max, label) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  const fill = h('span', {});
  fill.style.width = `${pct}%`; // via CSSOM: inline style-attributen blokkeert de CSP
  return h('div', { class: 'bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': max, 'aria-valuenow': value, 'aria-label': label }, fill);
}

function weaponStats(done, weapon) {
  const camos = CAMOS.get(weapon.id);
  const count = camos.filter((c) => done.has(key(weapon.id, c.id))).length;
  const prestige = PRESTIGE_CAMOS.filter((c) => done.has(key(weapon.id, c.id))).length;
  const next = camos.find((c) => !done.has(key(weapon.id, c.id)) && !missingFor(done, weapon, c))
    || camos.find((c) => !done.has(key(weapon.id, c.id)));
  return { count, prestige, next };
}

function statusOf(count) {
  if (count === CAMOS_PER_WEAPON) return 'done';
  return count === 0 ? 'new' : 'busy';
}

function swatch(camo) {
  const src = imageOf(camo.name);
  if (!src) return h('span', { class: 'swatch is-empty', 'aria-hidden': 'true' });
  return h('span', { class: 'swatch', 'aria-hidden': 'true' },
    h('img', { src, alt: '', width: 36, height: 36, loading: 'lazy', decoding: 'async' }));
}

/** Klein plaatje van de eerstvolgende camo, vóór "Volgende: …" op de wapenkaart. */
function nextSwatch(camo) {
  const src = imageOf(camo.name);
  if (!src) return null;
  return h('img', { class: 'next-swatch', src, alt: '', width: 18, height: 18, decoding: 'async' });
}

function weaponPic(weapon) {
  const src = weaponImageOf(weapon);
  if (!src) return h('span', { class: 'weapon-pic is-empty', 'aria-hidden': 'true' });
  return h('span', { class: 'weapon-pic', 'aria-hidden': 'true' },
    h('img', { src, alt: '', width: 120, height: 60, loading: 'lazy', decoding: 'async' }));
}

function camoItem({ inputId, camo, isDone, locked, onChange }) {
  const checkbox = h('input', { type: 'checkbox', id: inputId, checked: isDone });
  checkbox.addEventListener('change', () => onChange(checkbox));
  return h('li', { class: `camo${isDone ? ' is-done' : ''}${locked ? ' is-locked' : ''}` },
    checkbox,
    swatch(camo),
    h('label', { for: inputId },
      h('span', { class: 'camo-name' }, camo.name,
        camo.level ? h('span', { class: 'camo-level' }, ` · vanaf level ${camo.level}`) : null,
        locked ? h('span', { class: 'lock', 'aria-label': 'vergrendeld', role: 'img' }, ' 🔒') : null),
      h('span', { class: 'camo-task' }, camo.mp ? (camo.dmz ? `MP: ${camo.mp}` : camo.mp) : (camo.dmz ? 'MP: nog onbekend' : 'Opdracht nog onbekend')),
      camo.dmz ? h('span', { class: 'camo-task muted' }, `DMZ: ${camo.dmz}`) : null));
}

function camoRow(ctx, done, weapon, camo) {
  const isDone = done.has(key(weapon.id, camo.id));
  return camoItem({
    inputId: `c-${weapon.id}-${camo.id}`, camo, isDone,
    locked: !isDone && !!missingFor(done, weapon, camo),
    onChange: (cb) => onToggle(ctx, done, weapon, camo, cb),
  });
}

/** Kaart die open- en dichtklapt (wapens en de mastery-camo's). */
function foldCard(openId, cls, headParts, bodyParts) {
  const open = ui.open.has(openId);
  const bodyId = `w-${openId}`;
  const head = h('button', {
    class: 'weapon-head', type: 'button', 'aria-expanded': String(open), 'aria-controls': bodyId,
    onClick: () => {
      if (ui.open.has(openId)) ui.open.delete(openId); else ui.open.add(openId);
      const card = head.closest('.weapon');
      const nowOpen = ui.open.has(openId);
      head.setAttribute('aria-expanded', String(nowOpen));
      card.classList.toggle('is-open', nowOpen);
      card.querySelector('.weapon-body').hidden = !nowOpen;
    },
  }, ...headParts);
  const body = h('div', { class: 'weapon-body', id: bodyId, hidden: !open }, ...bodyParts);
  return h('article', { class: `card weapon${open ? ' is-open' : ''} ${cls}`, id: `card-${openId}` }, head, body);
}

function weaponCard(ctx, done, pinned, weapon) {
  const { count, prestige, next } = weaponStats(done, weapon);
  const complete = count === CAMOS_PER_WEAPON;
  const isPinned = pinned.has(weapon.id);

  const headParts = [
    weaponPic(weapon),
    h('span', { class: 'weapon-title' },
      h('span', { class: 'weapon-name' }, isPinned ? h('span', { class: 'pin-mark', 'aria-label': 'vastgepind', role: 'img' }, '📌 ') : null, weapon.name),
      h('span', { class: 'weapon-count' }, frac(count, CAMOS_PER_WEAPON))),
    bar(count, CAMOS_PER_WEAPON, `Voortgang ${weapon.name}`),
    h('span', { class: 'weapon-next muted' },
      complete ? null : nextSwatch(next),
      complete ? 'Alles vrijgespeeld ✓'
        // Klasse alleen tonen als de lijst niet al per klasse is gegroepeerd.
        : `${ui.group === 'class' ? '' : `${classById(weapon.cls).name} · `}Volgende: ${next.name}`,
      prestige ? ` · Prestige ${frac(prestige, PRESTIGE_CAMOS.length, '/')}` : ''),
    complete
      ? h('span', { class: 'weapon-task', 'aria-hidden': 'true' })
      : h('span', { class: 'weapon-task' }, next.mp ? `Opdracht: ${next.mp}` : next.dmz ? `Opdracht (DMZ): ${next.dmz}` : 'Opdracht: nog onbekend'),
  ];

  const camos = ALL_CAMOS.get(weapon.id);
  const milLeft = camos.filter((c) => c.group === 'military' && !done.has(key(weapon.id, c.id)));
  const bodyParts = [
    h('div', { class: 'weapon-actions' },
      h('button', {
        class: 'btn btn-ghost btn-small', type: 'button', 'aria-pressed': String(isPinned),
        onClick: () => setPinned(ctx, weapon, !isPinned),
      }, isPinned ? '📌 Losmaken' : '📌 Vastpinnen bovenaan')),
    ...GROUPS.map((g) => {
      const list = camos.filter((c) => c.group === g.id);
      const got = list.filter((c) => done.has(key(weapon.id, c.id))).length;
      return h('section', { class: 'camo-group' },
        h('div', { class: 'camo-group-head' },
          h('h3', {}, g.label, h('span', { class: 'group-count' }, ` ${frac(got, list.length, '/')}`)),
          g.id === 'military' && milLeft.length
            ? h('button', { class: 'btn btn-ghost btn-small', type: 'button', onClick: () => setDone(ctx, weapon.id, milLeft.map((c) => c.id), true) }, 'Alle militaire aan')
            : null),
        h('ul', { class: 'camo-list' }, list.map((c) => camoRow(ctx, done, weapon, c))));
    }),
  ];

  return foldCard(weapon.id, complete ? 'is-complete' : '', headParts, bodyParts);
}

function masteryCard(ctx, done) {
  const got = MASTERY_CAMOS.filter((c) => done.has(key(MASTERY_ID, c.id))).length;
  const missing = masteryMissing(done);
  const locked = !!missing;
  const next = MASTERY_CAMOS.find((c) => !done.has(key(MASTERY_ID, c.id)));
  const headParts = [
    h('span', { class: 'weapon-title' },
      h('span', { class: 'weapon-name' }, "Mastery-camo's"),
      h('span', { class: 'weapon-count' }, frac(got, MASTERY_CAMOS.length))),
    bar(got, MASTERY_CAMOS.length, "Voortgang mastery-camo's"),
    h('span', { class: 'weapon-next muted' },
      locked
        ? `Vrij na Harmonic Break op ${LAUNCH_COUNT} wapens (nog ${missing.short})`
        : (next ? [nextSwatch(next), `Volgende: ${next.name}`] : 'Alles vrijgespeeld ✓')),
  ];
  const bodyParts = MASTERY_MODES.map((m) => h('section', { class: 'camo-group' },
    h('div', { class: 'camo-group-head' }, h('h3', {}, m.label)),
    h('ul', { class: 'camo-list' }, MASTERY_CAMOS.filter((c) => c.mode === m.id).map((c) => {
      const isDone = done.has(key(MASTERY_ID, c.id));
      return camoItem({
        inputId: `c-${MASTERY_ID}-${c.id}`, camo: c, isDone, locked: !isDone && locked,
        onChange: (cb) => onMasteryToggle(ctx, done, c, cb),
      });
    }))));
  return foldCard(MASTERY_ID, `mastery-card${got === MASTERY_CAMOS.length ? ' is-complete' : ''}`, headParts, bodyParts);
}

function summary(done) {
  const total = WEAPONS.length * CAMOS_PER_WEAPON;
  const count = (camoId) => WEAPONS.filter((w) => done.has(key(w.id, camoId))).length;
  const doneTotal = WEAPONS.reduce((n, w) => n + CAMOS.get(w.id).filter((c) => done.has(key(w.id, c.id))).length, 0);
  const prestigeTotal = WEAPONS.reduce((n, w) => n + PRESTIGE_CAMOS.filter((c) => done.has(key(w.id, c.id))).length, 0);
  // Militaire en speciale camo's: alle wapens samen (aantal kan per wapen verschillen).
  const groupTotals = (group) => WEAPONS.reduce((acc, w) => {
    const list = CAMOS.get(w.id).filter((c) => c.group === group);
    acc.max += list.length;
    acc.got += list.filter((c) => done.has(key(w.id, c.id))).length;
    return acc;
  }, { got: 0, max: 0 });
  const mil = groupTotals('military');
  const sp = groupTotals('special');
  const hb = count('harmonic');
  // Divergence komt in één keer vrij op alle wapens zodra 33 wapens Harmonic Break hebben.
  const div = hb >= LAUNCH_COUNT ? WEAPONS.length : 0;
  const tile = (label, value, max, cls = '') => h('div', { class: `mastery-tile ${cls}` },
    h('span', { class: 'mastery-value' }, `${value}/${max}`),
    h('span', { class: 'mastery-pct' }, `${pct(value, max)}%`),
    h('span', { class: 'mastery-label' }, label));
  return h('section', { class: 'card summary', 'aria-label': 'Totale voortgang' },
    h('div', { class: 'summary-top' },
      h('span', { class: 'summary-label' }, "Camo's vrijgespeeld"),
      h('span', { class: 'summary-value' }, frac(doneTotal, total))),
    bar(doneTotal, total, 'Totale voortgang'),
    h('div', { class: 'mastery' },
      tile('Militair', mil.got, mil.max, 'm-mil'),
      tile('Speciaal', sp.got, sp.max, 'm-sp'),
      tile('Gold', count('gold'), WEAPONS.length, 'm-gold'),
      tile('Platinum', count('platinum'), WEAPONS.length, 'm-plat'),
      tile('Harmonic', hb, WEAPONS.length, 'm-hb'),
      tile('Divergence', div, WEAPONS.length, 'm-div'),
      tile('Prestige', prestigeTotal, WEAPONS.length * PRESTIGE_CAMOS.length, 'm-pres')));
}

// ---------- Overzicht: vastgepind, bijna klaar, blokkades, per klasse ----------

/** Naar het Camo's-scherm, eventueel met een klasse-filter of één wapen opengeklapt. */
function goToCamos(rerender, { cls = null, weapon = null } = {}) {
  ui.view = 'camos';
  go('camos');
  if (cls) ui.filter = cls;
  if (weapon) {
    ui.layout = 'grid';
    if (ui.filter !== 'all' && ui.filter !== weapon.cls) ui.filter = 'all';
    ui.open.add(weapon.id);
  }
  rerender();
  const target = weapon && document.getElementById(`card-${weapon.id}`);
  if (target) target.scrollIntoView({ block: 'start' });
  else window.scrollTo(0, 0);
}

// Blokken van het Overzicht. De volgorde is op de telefoon aan te passen;
// op tablet en laptop staat een vaste indeling (zie css/app.css).
const OV_BLOCKS = [
  { id: 'summary', label: "Camo's vrijgespeeld" },
  { id: 'pinned', label: '📌 Vastgepind' },
  { id: 'nearly', label: 'Bijna klaar' },
  { id: 'blockers', label: 'Wat houdt je tegen' },
  { id: 'classes', label: 'Per klasse' },
  { id: 'mastery', label: "Mastery-camo's" },
];
const OV_DEFAULT = OV_BLOCKS.map((b) => b.id);

/** Opgeslagen volgorde, aangevuld met blokken die er (nog) niet in staan. */
function ovOrder(data) {
  const saved = (data.overviewOrder?.order || []).filter((id) => OV_DEFAULT.includes(id));
  return [...new Set([...saved, ...OV_DEFAULT])];
}

async function saveOvOrder(ctx, order) {
  await ctx.update((d) => { d.overviewOrder = { order, updatedAt: Date.now() }; });
}

/** Lijst om de blokken te verschuiven (alleen op de telefoon). */
function orderEditor(ctx, rerender) {
  const order = ovOrder(ctx.data);
  const move = (i, dir) => {
    const next = [...order];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    saveOvOrder(ctx, next);
  };
  const isDefault = order.every((id, i) => id === OV_DEFAULT[i]);
  return h('section', { class: 'card ov-card ov-order', 'aria-labelledby': 'ov-order' },
    h('h3', { class: 'ov-title', id: 'ov-order' }, h('span', {}, 'Volgorde van de blokken')),
    h('p', { class: 'muted ov-empty' }, 'Schuif een blok met de pijltjes omhoog of omlaag. Dit geldt voor het Overzicht op je telefoon.'),
    h('ol', { class: 'ov-list' }, order.map((id, i) => {
      const label = OV_BLOCKS.find((b) => b.id === id).label;
      return h('li', { class: 'ov-order-row' },
        h('span', { class: 'ov-name' }, label),
        h('span', { class: 'ov-order-btns' },
          h('button', {
            type: 'button', class: 'icon-btn', 'aria-label': `${label} omhoog`, disabled: i === 0,
            onClick: () => move(i, -1),
          }, '▲'),
          h('button', {
            type: 'button', class: 'icon-btn', 'aria-label': `${label} omlaag`, disabled: i === order.length - 1,
            onClick: () => move(i, 1),
          }, '▼')));
    })),
    h('div', { class: 'ov-order-actions' },
      h('button', {
        type: 'button', class: 'btn btn-ghost', disabled: isDefault,
        onClick: () => saveOvOrder(ctx, [...OV_DEFAULT]),
      }, 'Standaardvolgorde'),
      h('button', {
        type: 'button', class: 'btn btn-primary',
        onClick: () => { ui.ovEdit = false; rerender(); window.scrollTo(0, 0); },
      }, 'Klaar')));
}

/** Knop onderaan het Overzicht om de volgorde aan te passen (alleen op de telefoon). */
function orderButton(rerender) {
  return h('button', {
    type: 'button', class: 'btn btn-ghost ov-order-open',
    onClick: () => { ui.ovEdit = true; rerender(); window.scrollTo(0, 0); },
  }, '↕ Volgorde aanpassen');
}

const chevron = () => h('span', { class: 'ov-chev', 'aria-hidden': 'true' }, '›');

function ovCard(id, title, extra, items) {
  return h('section', { class: `card ov-card ${id}`, 'aria-labelledby': id },
    h('h3', { class: 'ov-title', id }, h('span', {}, title), extra ? h('span', { class: 'muted' }, extra) : null),
    h('ul', { class: 'ov-list' }, items.map((it) => h('li', {}, it))));
}

/** Namen achter elkaar, ingekort na een paar stuks. */
function nameList(names, max = 5) {
  const shown = names.slice(0, max).join(', ');
  return names.length > max ? `${shown} en nog ${names.length - max}` : shown;
}

function nextTask(camo) {
  return camo.mp ? camo.mp : camo.dmz ? `DMZ: ${camo.dmz}` : 'Opdracht nog onbekend';
}

/** "Gold: 15 kills …", of bij een vergrendelde camo waar hij op wacht. */
function nextLine(done, weapon, next) {
  const m = missingFor(done, weapon, next);
  if (!m) return `${next.name}: ${nextTask(next)}`;
  return `🔒 ${next.name}: nog ${TIER_NAMES[m.tier]} nodig op ${m.short} ${m.short === 1 ? 'ander wapen' : 'andere wapens'}`;
}

/** Rij met wapen: afbeelding, naam, telling, balk en wat er nu te doen is. */
function weaponRow(done, weapon, rerender, note) {
  const { count, next } = weaponStats(done, weapon);
  const complete = count === CAMOS_PER_WEAPON;
  return h('button', {
    class: `ov-row ov-weapon${complete ? ' is-complete' : ''}`, type: 'button',
    onClick: () => goToCamos(rerender, { weapon }),
  },
  weaponPic(weapon),
  h('span', { class: 'ov-main' },
    h('span', { class: 'ov-line' },
      h('span', { class: 'ov-name' }, weapon.name),
      h('span', { class: 'ov-count' }, `${count}/${CAMOS_PER_WEAPON}`)),
    bar(count, CAMOS_PER_WEAPON, `Voortgang ${weapon.name}`),
    note ? h('span', { class: 'ov-note' }, note) : null,
    complete
      ? h('span', { class: 'ov-sub muted' }, 'Alles vrijgespeeld ✓')
      : h('span', { class: 'ov-sub muted' }, nextSwatch(next), nextLine(done, weapon, next))),
  chevron());
}

function pinnedCard(done, pinned, rerender) {
  const weapons = WEAPONS.filter((w) => pinned.has(w.id));
  if (!weapons.length) {
    return h('section', { class: 'card ov-card ov-pinned', 'aria-labelledby': 'ov-pinned' },
      h('h3', { class: 'ov-title', id: 'ov-pinned' }, h('span', {}, '📌 Vastgepind')),
      h('p', { class: 'muted ov-empty' }, 'Pin een wapen op het Camo\'s-scherm (klap het open en tik op Vastpinnen) om het hier te zien.'));
  }
  return ovCard('ov-pinned', '📌 Vastgepind', `${weapons.length} ${weapons.length === 1 ? 'wapen' : 'wapens'}`,
    weapons.map((w) => weaponRow(done, w, rerender)));
}

/**
 * Hoe ver is een wapen van zijn volgende mastery-camo (Gold, Platinum,
 * Harmonic Break)? null = klaar, of wacht op andere wapens (zie blokkades).
 */
function nextMilestone(done, weapon) {
  const has = (id) => done.has(key(weapon.id, id));
  const camos = CAMOS.get(weapon.id);
  if (!has('gold')) {
    const left = camos.filter((c) => (c.group === 'military' || c.group === 'special') && !has(c.id)).length;
    return { left, text: left ? `Nog ${left} ${left === 1 ? 'camo' : "camo's"} tot Gold` : 'Gold kan nu' };
  }
  const tier = !has('platinum') ? 'platinum' : !has('harmonic') ? 'harmonic' : null;
  if (!tier) return null;
  const camo = camos.find((c) => c.id === tier);
  if (missingFor(done, weapon, camo)) return null;
  return { left: 0, text: `${camo.name} kan nu` };
}

function nearlyCard(done, rerender) {
  const items = WEAPONS
    .map((w) => ({ w, m: nextMilestone(done, w), count: weaponStats(done, w).count }))
    .filter((x) => x.m && x.count > 0) // alleen wapens waar je al mee bezig bent
    .sort((a, b) => a.m.left - b.m.left || b.count - a.count || a.w.name.localeCompare(b.w.name, 'nl'))
    .slice(0, 5);
  if (!items.length) return null;
  return ovCard('ov-nearly', 'Bijna klaar', 'volgende mijlpaal',
    items.map(({ w, m }) => weaponRow(done, w, rerender, m.text)));
}

/**
 * Wat wacht er op andere wapens? Platinum per klasse, Harmonic Break, Divergence.
 * short = hoeveel wapens nog nodig zijn (het spel telt met de aantallen van de
 * lancering); missing = de wapens die het nog niet hebben.
 */
function blockers(done) {
  const has = (w, id) => done.has(key(w.id, id));
  const count = (ws, id) => ws.filter((w) => has(w, id)).length;
  const list = [];
  for (const c of CLASSES) {
    const ws = WEAPONS.filter((w) => w.cls === c.id);
    const waiting = ws.some((w) => has(w, 'gold') && !has(w, 'platinum'));
    const short = LAUNCH_IN_CLASS[c.id] - count(ws, 'gold');
    if (waiting && short > 0) {
      list.push({ title: `Platinum ${c.name}`, short, missing: ws.filter((w) => !has(w, 'gold')), need: 'Gold', cls: c.id });
    }
  }
  const platShort = LAUNCH_COUNT - count(WEAPONS, 'platinum');
  if (platShort > 0 && WEAPONS.some((w) => has(w, 'platinum') && !has(w, 'harmonic'))) {
    list.push({ title: 'Harmonic Break', short: platShort, missing: WEAPONS.filter((w) => !has(w, 'platinum')), need: 'Platinum' });
  }
  const hb = count(WEAPONS, 'harmonic');
  if (hb > 0 && hb < LAUNCH_COUNT) {
    list.push({ title: "Divergence en mastery-camo's", short: LAUNCH_COUNT - hb, missing: WEAPONS.filter((w) => !has(w, 'harmonic')), need: 'Harmonic Break' });
  }
  return list.sort((a, b) => a.short - b.short);
}

function blockersCard(done, rerender) {
  const list = blockers(done);
  if (!list.length) return null;
  return ovCard('ov-blockers', 'Wat houdt je tegen', null, list.map((b) => {
    const n = b.short;
    return h('button', {
      class: 'ov-row ov-block', type: 'button',
      onClick: () => (b.missing.length === 1 ? goToCamos(rerender, { weapon: b.missing[0] }) : goToCamos(rerender, { cls: b.cls || 'all' })),
    },
    h('span', { class: 'ov-main' },
      h('span', { class: 'ov-line' },
        h('span', { class: 'ov-name' }, b.title),
        h('span', { class: 'ov-count' }, `nog ${n} ${n === 1 ? 'wapen' : 'wapens'}`)),
      h('span', { class: 'ov-sub muted' }, `Zonder ${b.need}: ${nameList(b.missing.map((w) => w.name))}`)),
    chevron());
  }));
}

function classCard(done, rerender) {
  return ovCard('ov-classes', 'Per klasse', null, CLASSES.map((c) => {
    const ws = WEAPONS.filter((w) => w.cls === c.id);
    const max = ws.length * CAMOS_PER_WEAPON;
    const got = ws.reduce((n, w) => n + weaponStats(done, w).count, 0);
    const tier = (id) => ws.filter((w) => done.has(key(w.id, id))).length;
    // Militaire en speciale camo's: aantal camo's (kan per wapen verschillen).
    const group = (g) => ws.reduce((acc, w) => {
      const list = CAMOS.get(w.id).filter((cm) => cm.group === g);
      acc.max += list.length;
      acc.got += list.filter((cm) => done.has(key(w.id, cm.id))).length;
      return acc;
    }, { got: 0, max: 0 });
    const mil = group('military');
    const sp = group('special');
    return h('button', {
      class: `ov-row ov-class${got === max ? ' is-complete' : ''}`, type: 'button',
      onClick: () => goToCamos(rerender, { cls: c.id }),
    },
    h('span', { class: 'ov-main' },
      h('span', { class: 'ov-line' },
        h('span', { class: 'ov-name' }, c.full),
        h('span', { class: 'ov-count' }, frac(got, max, '/'))),
      bar(got, max, `Voortgang ${c.full}`),
      h('span', { class: 'ov-tiers' },
        h('span', { class: 't-mil' }, `Militair ${mil.got}/${mil.max}`),
        h('span', { class: 't-sp' }, `Speciaal ${sp.got}/${sp.max}`),
        h('span', { class: 't-gold' }, `Gold ${tier('gold')}/${ws.length}`),
        h('span', { class: 't-plat' }, `Platinum ${tier('platinum')}/${ws.length}`),
        h('span', { class: 't-hb' }, `Harmonic ${tier('harmonic')}/${ws.length}`))),
    chevron());
  }));
}

function controls(ctx, rerender) {
  const chip = (id, label) => h('button', {
    class: `chip${ui.filter === id ? ' is-active' : ''}`, type: 'button', 'aria-pressed': String(ui.filter === id),
    onClick: () => { ui.filter = id; rerender(); },
  }, label);
  const select = (id, options, prop, before) => h('select', {
    id, onChange: (e) => { before?.(); ui[prop] = e.target.value; rerender(); },
  }, options.map((o) => h('option', { value: o.id, selected: ui[prop] === o.id }, o.label)));
  return h('div', { class: 'controls' },
    h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter op klasse' },
      chip('all', 'Alle'), CLASSES.map((c) => chip(c.id, c.name))),
    h('div', { class: 'sort-lines' },
      h('div', { class: 'sort-line' }, h('label', { for: 'layout' }, 'Weergave'), select('layout', LAYOUTS, 'layout', () => { ui.listScroll = 0; })),
      h('div', { class: 'sort-line' }, h('label', { for: 'group' }, 'Groeperen'), select('group', GROUPINGS, 'group')),
      h('div', { class: 'sort-line' }, h('label', { for: 'sort' }, 'Sorteren'), select('sort', SORTS, 'sort'))));
}

const SVG_NS = 'http://www.w3.org/2000/svg';

function icon(paths) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of paths) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}

// ---------- Lijstweergave ----------
// Alle wapens onder elkaar, per wapen alle camo's naast elkaar als vinkje.
// De tabel scrollt zijwaarts; de wapennaam blijft links staan.

// Kolommen: dezelfde volgorde als in het opengeklapte wapen.
const LIST_COLUMNS = GROUPS.flatMap((g) => ALL_CAMOS.get(WEAPONS[0].id)
  .filter((c) => c.group === g.id)
  .map((c, i) => ({ id: c.id, group: g.id, start: i === 0, label: g.id === 'special' ? `${i + 1}` : c.name })));

function camoTitle(camo, weapon) {
  const task = camo.mp ? (camo.dmz ? `MP: ${camo.mp} · DMZ: ${camo.dmz}` : camo.mp) : (camo.dmz ? `DMZ: ${camo.dmz}` : 'Opdracht nog onbekend');
  return `${camo.name} (${weapon.name})${camo.level ? ` · vanaf level ${camo.level}` : ''} — ${task}`;
}

function listCell(ctx, done, weapon, camo, groupStart) {
  const isDone = done.has(key(weapon.id, camo.id));
  const locked = !isDone && !!missingFor(done, weapon, camo);
  const id = `l-${weapon.id}-${camo.id}`;
  const checkbox = h('input', { type: 'checkbox', id, checked: isDone, class: 'visually-hidden' });
  checkbox.addEventListener('change', () => onToggle(ctx, done, weapon, camo, checkbox));
  const src = imageOf(camo.name);
  return h('td', { class: `lc${groupStart ? ' g-start' : ''}${isDone ? ' is-done' : ''}${locked ? ' is-locked' : ''}` },
    checkbox,
    h('label', { for: id, title: camoTitle(camo, weapon) },
      h('span', { class: 'visually-hidden' }, `${camo.name}${locked ? ' (vergrendeld)' : ''}`),
      src ? h('img', { src, alt: '', width: 36, height: 36, loading: 'lazy', decoding: 'async' }) : h('span', { class: 'lc-empty', 'aria-hidden': 'true' }),
      h('span', { class: 'lc-mark', 'aria-hidden': 'true' }, isDone ? '✓' : locked ? '🔒' : '')));
}

function listRow(ctx, done, pinned, weapon) {
  const { count } = weaponStats(done, weapon);
  const camos = new Map(ALL_CAMOS.get(weapon.id).map((c) => [c.id, c]));
  return h('tr', { class: count === CAMOS_PER_WEAPON ? 'is-complete' : '' },
    h('th', { scope: 'row', class: 'lw' },
      h('span', { class: 'lw-name' }, pinned.has(weapon.id) ? h('span', { class: 'pin-mark', 'aria-label': 'vastgepind', role: 'img' }, '📌 ') : null, weapon.name),
      h('span', { class: 'lw-count muted' }, `${count}/${CAMOS_PER_WEAPON}`)),
    LIST_COLUMNS.map((col) => listCell(ctx, done, weapon, camos.get(col.id), col.start)));
}

function listTable(ctx, done, pinned, sections) {
  const groupHead = h('tr', { class: 'lt-groups' },
    h('th', { class: 'lw', scope: 'col' }, 'Wapen'),
    GROUPS.map((g) => h('th', { scope: 'colgroup', colspan: LIST_COLUMNS.filter((c) => c.group === g.id).length, class: `lg-${g.id}` }, g.label)));
  const colHead = h('tr', { class: 'lt-cols' },
    h('td', { class: 'lw' }),
    LIST_COLUMNS.map((c) => h('th', { scope: 'col', class: `lg-${c.group}${c.start ? ' g-start' : ''}` }, h('span', {}, c.label))));
  const span = LIST_COLUMNS.length + 1;
  const bodies = sections.filter((s) => s.weapons.length).map((s) => h('tbody', {},
    s.title ? h('tr', { class: 'lt-section' },
      h('th', { colspan: span, scope: 'colgroup' },
        h('span', { class: 'lt-section-inner' }, h('span', {}, s.title), h('span', { class: 'muted' }, s.total)))) : null,
    s.weapons.map((w) => listRow(ctx, done, pinned, w))));

  // De kolomkop staat in een eigen tabel die bovenaan blijft staan tijdens het
  // scrollen (sticky). Hij schuift zijwaarts mee met de tabel eronder.
  const head = h('div', { class: 'list-head', 'aria-hidden': 'true' },
    h('table', { class: 'list-table' }, h('thead', {}, groupHead, colHead)));
  const wrap = h('div', { class: 'list-wrap', tabindex: '0', role: 'region', 'aria-label': "Camo's per wapen" },
    h('table', { class: 'list-table' }, ...bodies));
  const card = h('div', { class: 'list-card card' }, head, wrap);

  // Zijwaarts scrollen koppelen (in beide richtingen) en een schaduw tonen
  // zolang er rechts nog kolommen verborgen zijn.
  let syncing = false;
  const follow = (from, to) => {
    if (syncing) { syncing = false; return; }
    if (to.scrollLeft !== from.scrollLeft) { syncing = true; to.scrollLeft = from.scrollLeft; }
  };
  const edges = () => {
    card.classList.toggle('is-scrolled', wrap.scrollLeft > 1);
    card.classList.toggle('has-more', wrap.scrollLeft + wrap.clientWidth < wrap.scrollWidth - 1);
  };
  wrap.addEventListener('scroll', () => {
    ui.listScroll = wrap.scrollLeft; // bewaren: na elk vinkje wordt het scherm opnieuw opgebouwd
    follow(wrap, head);
    edges();
  }, { passive: true });
  head.addEventListener('scroll', () => follow(head, wrap), { passive: true });
  card.restoreScroll = () => { wrap.scrollLeft = ui.listScroll; head.scrollLeft = ui.listScroll; edges(); };
  return card;
}

/** Van twee instellingen-objecten met updatedAt de nieuwste (of de enige). */
function newest(a, b) {
  if (!a) return b ?? null;
  if (!b) return a;
  return (b.updatedAt || 0) > (a.updatedAt || 0) ? b : a;
}

export const app = {
  screens: VIEWS,

  schemaVersion: SCHEMA,

  initialData() {
    return { schema: SCHEMA, progress: [], loadouts: [], pins: [], overviewOrder: null };
  },

  migrate(data) {
    // Schema 1 → 2: lege lijst loadouts erbij.
    // Schema 2 → 3: lege lijst pins erbij. Voortgang blijft ongewijzigd.
    data.progress ??= [];
    data.loadouts ??= [];
    data.pins ??= [];
    // Schema 3 → 4: volgorde van het Overzicht erbij (null = standaardvolgorde).
    data.overviewOrder ??= null;
    data.schema = Math.max(data.schema || 0, SCHEMA);
    // Verwijdermarkeringen blijven bewaard: een apparaat kan langer dan
    // 180 dagen offline zijn. Zonder bevestiging van alle apparaten is
    // automatisch opruimen niet veilig (een oude kopie kan terugkomen).
    return data;
  },

  merge(local, remote) {
    return {
      ...remote,
      ...local,
      schema: Math.max(local.schema || 0, remote.schema || 0),
      progress: mergeCollections(local.progress, remote.progress),
      loadouts: mergeCollections(local.loadouts, remote.loadouts),
      pins: mergeCollections(local.pins, remote.pins),
      overviewOrder: newest(local.overviewOrder, remote.overviewOrder),
    };
  },

  render(root, ctx) {
    const rerender = () => app.render(root, ctx);
    // De schil regelt de navigatie; ctx.screen is het gekozen scherm.
    go = ctx.go;
    if (ui.view !== ctx.screen) { ui.view = ctx.screen; ui.ovEdit = false; }
    if (ui.view === 'loadouts') {
      root.replaceChildren(...renderLoadouts(ctx));
      return;
    }
    const done = progressIndex(ctx.data);
    if (ui.view === 'overview') {
      const pinned = pinnedSet(ctx.data);
      if (ui.ovEdit) {
        root.replaceChildren(orderEditor(ctx, rerender));
        return;
      }
      // Volgorde voor de telefoon: elk blok krijgt zijn plek via --ov-order.
      const order = ovOrder(ctx.data);
      const place = (id, el) => {
        if (!el) return null;
        el.classList.add('ov-movable');
        el.style.setProperty('--ov-order', String(order.indexOf(id) + 1));
        return el;
      };
      root.replaceChildren(...[
        place('summary', summary(done)),
        // Op de laptop: mastery direct onder de totalen, daaronder drie kolommen
        // (Per klasse | Bijna klaar | Wat houdt je tegen + Vastgepind).
        // Op de telefoon zet de CSS alles in de oude volgorde onder elkaar.
        place('mastery', masteryCard(ctx, done)),
        h('div', { class: 'ov-grid' },
          place('classes', classCard(done, rerender)),
          place('nearly', nearlyCard(done, rerender)),
          h('div', { class: 'ov-stack' }, ...[
            place('blockers', blockersCard(done, rerender)),
            place('pinned', pinnedCard(done, pinned, rerender)),
          ].filter(Boolean))),
        orderButton(rerender),
      ]);
      return;
    }
    const pinned = pinnedSet(ctx.data);
    const card = (w) => weaponCard(ctx, done, pinned, w);

    let weapons = WEAPONS.filter((w) => ui.filter === 'all' || w.cls === ui.filter);
    const cnt = (w) => weaponStats(done, w).count;
    if (ui.sort === 'name') weapons = [...weapons].sort((a, b) => a.name.localeCompare(b.name, 'nl'));
    if (ui.sort === 'least') weapons = [...weapons].sort((a, b) => cnt(a) - cnt(b) || a.name.localeCompare(b.name, 'nl'));
    if (ui.sort === 'most') weapons = [...weapons].sort((a, b) => cnt(b) - cnt(a) || a.name.localeCompare(b.name, 'nl'));

    const pinnedWeapons = weapons.filter((w) => pinned.has(w.id));
    const rest = weapons.filter((w) => !pinned.has(w.id));
    const sum = (ws) => frac(ws.reduce((n, w) => n + cnt(w), 0), ws.length * CAMOS_PER_WEAPON);

    // Secties: vastgepind bovenaan, daarna volgens de gekozen groepering.
    const sections = [{ title: '📌 Vastgepind', weapons: pinnedWeapons, total: sum(pinnedWeapons) }];
    if (ui.group === 'class') {
      for (const c of CLASSES) {
        const ws = rest.filter((w) => w.cls === c.id);
        sections.push({ title: c.full, weapons: ws, total: sum(ws) });
      }
    } else if (ui.group === 'status') {
      for (const st of STATUSES) {
        const ws = rest.filter((w) => statusOf(cnt(w)) === st.id);
        sections.push({ title: st.label, weapons: ws, total: `${ws.length} ${ws.length === 1 ? 'wapen' : 'wapens'}` });
      }
    } else {
      sections.push({ title: null, weapons: rest, total: '' });
    }

    let list;
    if (ui.layout === 'list') {
      list = [listTable(ctx, done, pinned, sections)];
    } else {
      list = sections.map((sec) => (sec.weapons.length
        ? h('section', { class: 'class-group' },
          sec.title ? h('h2', { class: 'class-head' }, h('span', {}, sec.title), h('span', { class: 'muted' }, sec.total)) : null,
          sec.weapons.map(card))
        : null));
    }

    root.replaceChildren(...[
      controls(ctx, rerender),
      h('p', { class: 'muted shown-count' }, `${weapons.length} van ${WEAPONS.length} wapens`),
      ...list,
    ].filter(Boolean));
    root.querySelector('.list-card')?.restoreScroll();
    if (!resizeHooked) { // schaduw rechts opnieuw bepalen na draaien of venster aanpassen
      resizeHooked = true;
      window.addEventListener('resize', () => document.querySelector('.list-card')?.restoreScroll());
    }
  },
};
