// =============================================================
//  MW4 Camo Tracker — app-specifieke code
// =============================================================
// Gegevens in de kluis:
//   progress: [{ id, weaponId, camoId, done, doneAt, createdAt, updatedAt }]
//     id = '<wapen>:<camo>' voor gewone en prestige-camo's (pres1–pres4),
//     id = 'mastery:<camo>' voor de 6 mastery-camo's (weaponId 'mastery').
//   pins:     [{ id: '<wapen>', pinned, createdAt, updatedAt }] (sinds schema 3)
//   loadouts: zie js/loadouts.js (sinds schema 2)
// Eén record per camo met een vaste id. Uitvinken zet done op false
// (niets wordt verwijderd), zodat sync per camo de nieuwste wijziging kiest.
// De wapen- en camolijst zelf staat in js/catalog.js.

import { h, today } from './core/dom.js';
import { newRecord, updateById, mergeCollections, purgeTombstones } from './core/records.js';
import {
  CLASSES, WEAPONS, camosOf, classById, CAMOS_PER_WEAPON, imageOf, weaponImageOf,
  PRESTIGE_CAMOS, MASTERY_CAMOS, MASTERY_MODES,
} from './catalog.js';
import { renderLoadouts, closeOnLock } from './loadouts.js';

// 1 = alleen camo-voortgang; 2 = ook loadouts; 3 = ook vastgepinde wapens,
// prestige- en mastery-camo's.
const SCHEMA = 3;
const TOMBSTONE_DAYS = 180;

// Schermkeuzes (alleen tijdens gebruik, niet in de kluis).
const ui = { view: 'camos', filter: 'all', group: 'class', sort: 'default', open: new Set() };

const VIEWS = [
  { id: 'camos', label: "Camo's" },
  { id: 'loadouts', label: 'Loadouts' },
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

/** Wat ontbreekt er op ándere wapens om deze camo aan te vinken? Lege lijst = mag. */
function missingFor(done, weapon, camo) {
  const has = (wId, cId) => done.has(key(wId, cId));
  const missing = [];
  if (camo.id === 'platinum') {
    for (const w of WEAPONS) if (w.id !== weapon.id && w.cls === weapon.cls && !has(w.id, 'gold')) missing.push(`${w.name}: Gold`);
  }
  if (camo.id === 'harmonic') {
    for (const w of WEAPONS) if (w.id !== weapon.id && !has(w.id, 'platinum')) missing.push(`${w.name}: Platinum`);
  }
  return missing;
}

/** Mastery-camo's komen vrij na Harmonic Break op alle wapens. */
function masteryMissing(done) {
  return WEAPONS.filter((w) => !done.has(key(w.id, 'harmonic'))).map((w) => `${w.name}: Harmonic Break`);
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
  if (missing.length) {
    checkbox.checked = false;
    showBlocked(`${camo.name} is nog niet vrij`, `Voor ${camo.name} op de ${weapon.name} heb je eerst nodig:`, missing);
    return;
  }
  const extra = earlierOnWeapon(weapon, camo).filter((id) => !done.has(key(weapon.id, id)));
  setDone(ctx, weapon.id, [...extra, camo.id], true);
}

function onMasteryToggle(ctx, done, camo, checkbox) {
  const isDone = done.has(key(MASTERY_ID, camo.id));
  if (!isDone) {
    const missing = masteryMissing(done);
    if (missing.length) {
      checkbox.checked = false;
      showBlocked(`${camo.name} is nog niet vrij`, 'Mastery-camo\'s komen vrij na Harmonic Break op alle 33 wapens. Nog nodig:', missing);
      return;
    }
  }
  setDone(ctx, MASTERY_ID, [camo.id], !isDone);
}

// ---------- Weergave ----------

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
  const next = camos.find((c) => !done.has(key(weapon.id, c.id)) && !missingFor(done, weapon, c).length)
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
      h('span', { class: 'camo-task' }, camo.mp ? (camo.dmz ? `MP: ${camo.mp}` : camo.mp) : 'Opdracht nog onbekend'),
      camo.dmz ? h('span', { class: 'camo-task muted' }, `DMZ: ${camo.dmz}`) : null));
}

function camoRow(ctx, done, weapon, camo) {
  const isDone = done.has(key(weapon.id, camo.id));
  return camoItem({
    inputId: `c-${weapon.id}-${camo.id}`, camo, isDone,
    locked: !isDone && missingFor(done, weapon, camo).length > 0,
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
  return h('article', { class: `card weapon${open ? ' is-open' : ''} ${cls}` }, head, body);
}

function weaponCard(ctx, done, pinned, weapon) {
  const { count, prestige, next } = weaponStats(done, weapon);
  const complete = count === CAMOS_PER_WEAPON;
  const isPinned = pinned.has(weapon.id);

  const headParts = [
    weaponPic(weapon),
    h('span', { class: 'weapon-title' },
      h('span', { class: 'weapon-name' }, isPinned ? h('span', { class: 'pin-mark', 'aria-label': 'vastgepind', role: 'img' }, '📌 ') : null, weapon.name),
      h('span', { class: 'weapon-count' }, `${count} / ${CAMOS_PER_WEAPON}`)),
    bar(count, CAMOS_PER_WEAPON, `Voortgang ${weapon.name}`),
    h('span', { class: 'weapon-next muted' },
      complete ? 'Alles vrijgespeeld ✓' : `${classById(weapon.cls).name} · Volgende: ${next.name}`,
      prestige ? ` · Prestige ${prestige}/${PRESTIGE_CAMOS.length}` : ''),
    complete
      ? h('span', { class: 'weapon-task', 'aria-hidden': 'true' })
      : h('span', { class: 'weapon-task' }, `Opdracht: ${next.mp || 'nog onbekend'}`),
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
          h('h3', {}, g.label, h('span', { class: 'group-count' }, ` ${got}/${list.length}`)),
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
  const locked = missing.length > 0;
  const next = MASTERY_CAMOS.find((c) => !done.has(key(MASTERY_ID, c.id)));
  const headParts = [
    h('span', { class: 'weapon-title' },
      h('span', { class: 'weapon-name' }, "Mastery-camo's"),
      h('span', { class: 'weapon-count' }, `${got} / ${MASTERY_CAMOS.length}`)),
    bar(got, MASTERY_CAMOS.length, "Voortgang mastery-camo's"),
    h('span', { class: 'weapon-next muted' },
      locked
        ? `Vrij na Harmonic Break op alle wapens (nog ${missing.length})`
        : (next ? `Volgende: ${next.name}` : 'Alles vrijgespeeld ✓')),
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
  const masteryTotal = MASTERY_CAMOS.filter((c) => done.has(key(MASTERY_ID, c.id))).length;
  const hb = count('harmonic');
  // Divergence komt in één keer vrij op alle wapens zodra ze allemaal Harmonic Break hebben.
  const div = hb === WEAPONS.length ? WEAPONS.length : 0;
  const tile = (label, value, cls = '') => h('div', { class: `mastery-tile ${cls}` },
    h('span', { class: 'mastery-value' }, value), h('span', { class: 'mastery-label' }, label));
  return h('section', { class: 'card summary', 'aria-label': 'Totale voortgang' },
    h('div', { class: 'summary-top' },
      h('span', { class: 'summary-label' }, "Camo's vrijgespeeld"),
      h('span', { class: 'summary-value' }, `${doneTotal} / ${total}`)),
    bar(doneTotal, total, 'Totale voortgang'),
    h('div', { class: 'mastery' },
      tile('Gold', `${count('gold')}/${WEAPONS.length}`, 'm-gold'),
      tile('Platinum', `${count('platinum')}/${WEAPONS.length}`, 'm-plat'),
      tile('Harmonic', `${hb}/${WEAPONS.length}`, 'm-hb'),
      tile('Divergence', `${div}/${WEAPONS.length}`, 'm-div'),
      tile('Prestige', `${prestigeTotal}/${WEAPONS.length * PRESTIGE_CAMOS.length}`, 'm-pres'),
      tile('Mastery', `${masteryTotal}/${MASTERY_CAMOS.length}`, 'm-mast')));
}

function controls(ctx, rerender) {
  const chip = (id, label) => h('button', {
    class: `chip${ui.filter === id ? ' is-active' : ''}`, type: 'button', 'aria-pressed': String(ui.filter === id),
    onClick: () => { ui.filter = id; rerender(); },
  }, label);
  const select = (id, options, prop) => h('select', {
    id, onChange: (e) => { ui[prop] = e.target.value; rerender(); },
  }, options.map((o) => h('option', { value: o.id, selected: ui[prop] === o.id }, o.label)));
  return h('div', { class: 'controls' },
    h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter op klasse' },
      chip('all', 'Alle'), CLASSES.map((c) => chip(c.id, c.name))),
    h('div', { class: 'sort-lines' },
      h('div', { class: 'sort-line' }, h('label', { for: 'group' }, 'Groeperen'), select('group', GROUPINGS, 'group')),
      h('div', { class: 'sort-line' }, h('label', { for: 'sort' }, 'Sorteren'), select('sort', SORTS, 'sort'))));
}

function viewTabs(rerender) {
  return h('div', { class: 'segmented view-tabs', role: 'tablist', 'aria-label': 'Scherm' },
    VIEWS.map((v) => h('button', {
      type: 'button', role: 'tab', id: `tab-${v.id}`, 'aria-selected': String(ui.view === v.id),
      onClick: () => {
        if (ui.view === v.id) return;
        ui.view = v.id;
        rerender();
        window.scrollTo(0, 0);
      },
    }, v.label)));
}

export const app = {
  schemaVersion: SCHEMA,

  initialData() {
    return { schema: SCHEMA, progress: [], loadouts: [], pins: [] };
  },

  migrate(data) {
    // Schema 1 → 2: lege lijst loadouts erbij.
    // Schema 2 → 3: lege lijst pins erbij. Voortgang blijft ongewijzigd.
    data.progress ??= [];
    data.loadouts ??= [];
    data.pins ??= [];
    data.schema = Math.max(data.schema || 0, SCHEMA);
    data.progress = purgeTombstones(data.progress, TOMBSTONE_DAYS);
    data.loadouts = purgeTombstones(data.loadouts, TOMBSTONE_DAYS);
    data.pins = purgeTombstones(data.pins, TOMBSTONE_DAYS);
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
    };
  },

  render(root, ctx) {
    const rerender = () => app.render(root, ctx);
    if (ui.view === 'loadouts') {
      root.replaceChildren(viewTabs(rerender), ...renderLoadouts(ctx));
      return;
    }
    const done = progressIndex(ctx.data);
    const pinned = pinnedSet(ctx.data);
    const card = (w) => weaponCard(ctx, done, pinned, w);

    let weapons = WEAPONS.filter((w) => ui.filter === 'all' || w.cls === ui.filter);
    const cnt = (w) => weaponStats(done, w).count;
    if (ui.sort === 'name') weapons = [...weapons].sort((a, b) => a.name.localeCompare(b.name, 'nl'));
    if (ui.sort === 'least') weapons = [...weapons].sort((a, b) => cnt(a) - cnt(b) || a.name.localeCompare(b.name, 'nl'));
    if (ui.sort === 'most') weapons = [...weapons].sort((a, b) => cnt(b) - cnt(a) || a.name.localeCompare(b.name, 'nl'));

    const pinnedWeapons = weapons.filter((w) => pinned.has(w.id));
    const rest = weapons.filter((w) => !pinned.has(w.id));
    const section = (title, ws, total) => (ws.length
      ? h('section', { class: 'class-group' },
        h('h2', { class: 'class-head' }, h('span', {}, title), h('span', { class: 'muted' }, total)),
        ws.map(card))
      : null);
    const sum = (ws) => `${ws.reduce((n, w) => n + cnt(w), 0)} / ${ws.length * CAMOS_PER_WEAPON}`;

    let list;
    if (ui.group === 'class') {
      list = CLASSES.map((c) => {
        const ws = rest.filter((w) => w.cls === c.id);
        return section(c.full, ws, sum(ws));
      });
    } else if (ui.group === 'status') {
      list = STATUSES.map((s) => {
        const ws = rest.filter((w) => statusOf(cnt(w)) === s.id);
        return section(s.label, ws, `${ws.length} ${ws.length === 1 ? 'wapen' : 'wapens'}`);
      });
    } else {
      list = [rest.length ? h('section', { class: 'class-group' }, rest.map(card)) : null];
    }

    root.replaceChildren(...[
      viewTabs(rerender),
      summary(done),
      masteryCard(ctx, done),
      controls(ctx, rerender),
      h('p', { class: 'muted shown-count' }, `${weapons.length} van ${WEAPONS.length} wapens`),
      section('📌 Vastgepind', pinnedWeapons, sum(pinnedWeapons)),
      ...list,
    ].filter(Boolean));
  },
};
