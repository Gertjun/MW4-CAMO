// =============================================================
//  MW4 Camo Tracker — app-specifieke code
// =============================================================
// Gegevens in de kluis: alleen voortgang.
//   progress: [{ id: '<wapen>:<camo>', weaponId, camoId, done, doneAt, createdAt, updatedAt }]
// Eén record per wapen+camo met een vaste id. Uitvinken zet done op false
// (niets wordt verwijderd), zodat sync per camo de nieuwste wijziging kiest.
// De wapen- en camolijst zelf staat in js/catalog.js.

import { h, today } from './core/dom.js';
import { newRecord, updateById, mergeCollections, purgeTombstones } from './core/records.js';
import { CLASSES, WEAPONS, camosOf, classById, CAMOS_PER_WEAPON, swatchOf } from './catalog.js';

const SCHEMA = 1;
const TOMBSTONE_DAYS = 180;

// Schermkeuzes (alleen tijdens gebruik, niet in de kluis).
const ui = { filter: 'all', sort: 'class', open: new Set() };

const SORTS = [
  { id: 'class', label: 'Klasse' },
  { id: 'name', label: 'Naam (A–Z)' },
  { id: 'least', label: "Minste camo's" },
  { id: 'most', label: "Meeste camo's" },
];

const GROUPS = [
  { id: 'military', label: 'Militair' },
  { id: 'special', label: 'Speciaal' },
  { id: 'mastery', label: 'Mastery' },
];

const CAMOS = new Map(WEAPONS.map((w) => [w.id, camosOf(w)]));
const camoName = (camoId) => CAMOS.get(WEAPONS[0].id).find((c) => c.id === camoId)?.name ?? camoId;

// ---------- Voortgang lezen ----------

function progressIndex(data) {
  const done = new Set();
  for (const r of data.progress || []) if (!r.deleted && r.done) done.add(r.id);
  return done;
}

const key = (weaponId, camoId) => `${weaponId}:${camoId}`;

// ---------- Vrijspeelregels ----------

/** Wat ontbreekt er om deze camo aan te vinken? Lege lijst = mag. */
function missingFor(done, weapon, camo) {
  const has = (wId, cId) => done.has(key(wId, cId));
  const missing = [];
  if (camo.group === 'military' && camo.n > 1 && !has(weapon.id, `mil${camo.n - 1}`)) {
    missing.push(`${weapon.name}: eerst ${camoName(`mil${camo.n - 1}`)} (militaire camo ${camo.n - 1})`);
  }
  if (camo.id === 'gold') {
    for (const c of CAMOS.get(weapon.id)) {
      if ((c.group === 'military' || c.group === 'special') && !has(weapon.id, c.id)) missing.push(`${weapon.name}: ${c.name}`);
    }
  }
  if (camo.id === 'platinum') {
    for (const w of WEAPONS) if (w.cls === weapon.cls && !has(w.id, 'gold')) missing.push(`${w.name}: Gold`);
  }
  if (camo.id === 'harmonic') {
    for (const w of WEAPONS) if (!has(w.id, 'platinum')) missing.push(`${w.name}: Platinum`);
  }
  return missing;
}

/** Welke aangevinkte camo's hangen af van deze camo? (blokkeert uitvinken) */
function dependentsOf(done, weapon, camo) {
  const has = (wId, cId) => done.has(key(wId, cId));
  const deps = [];
  if (camo.group === 'military' && camo.n < 8 && has(weapon.id, `mil${camo.n + 1}`)) deps.push(`${weapon.name}: ${camoName(`mil${camo.n + 1}`)}`);
  if ((camo.group === 'military' || camo.group === 'special') && has(weapon.id, 'gold')) deps.push(`${weapon.name}: Gold`);
  if (camo.id === 'gold') {
    for (const w of WEAPONS) if (w.cls === weapon.cls && has(w.id, 'platinum')) deps.push(`${w.name}: Platinum`);
  }
  if (camo.id === 'platinum') {
    for (const w of WEAPONS) if (has(w.id, 'harmonic')) deps.push(`${w.name}: Harmonic Break`);
  }
  return deps;
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
  document.body.append(dlg);
  dlg.showModal();
}

// ---------- Wijzigen ----------

async function setDone(ctx, weapon, camoIds, value) {
  await ctx.update((d) => {
    for (const camoId of camoIds) {
      const id = key(weapon.id, camoId);
      const changes = { done: value, doneAt: value ? today() : null };
      const existing = d.progress.find((r) => r.id === id);
      if (existing && !existing.deleted) updateById(d.progress, id, changes);
      else if (existing) Object.assign(existing, newRecord({ id, weaponId: weapon.id, camoId, ...changes }));
      else d.progress.push(newRecord({ id, weaponId: weapon.id, camoId, ...changes }));
    }
  });
}

function onToggle(ctx, done, weapon, camo, checkbox) {
  const isDone = done.has(key(weapon.id, camo.id));
  if (!isDone) {
    const missing = missingFor(done, weapon, camo);
    if (missing.length) {
      checkbox.checked = false;
      showBlocked(`${camo.name} is nog niet vrij`, `Voor ${camo.name} op de ${weapon.name} heb je eerst nodig:`, missing);
      return;
    }
  } else {
    const deps = dependentsOf(done, weapon, camo);
    if (deps.length) {
      checkbox.checked = true;
      showBlocked(`${camo.name} kan niet uit`, `Deze camo's hangen van ${camo.name} af. Vink die eerst uit:`, deps);
      return;
    }
  }
  setDone(ctx, weapon, [camo.id], !isDone);
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
  const next = camos.find((c) => !done.has(key(weapon.id, c.id)) && !missingFor(done, weapon, c).length)
    || camos.find((c) => !done.has(key(weapon.id, c.id)));
  return { count, next };
}

function swatch(camo) {
  const [c1, c2, pattern] = swatchOf(camo.name);
  const el = h('span', { class: `swatch sw-${pattern}`, 'aria-hidden': 'true' });
  // Via CSSOM: inline style-attributen blokkeert de CSP.
  el.style.setProperty('--c1', c1);
  el.style.setProperty('--c2', c2);
  return el;
}

function camoRow(ctx, done, weapon, camo) {
  const isDone = done.has(key(weapon.id, camo.id));
  const locked = !isDone && missingFor(done, weapon, camo).length > 0;
  const inputId = `c-${weapon.id}-${camo.id}`;
  const checkbox = h('input', { type: 'checkbox', id: inputId, checked: isDone });
  checkbox.addEventListener('change', () => onToggle(ctx, done, weapon, camo, checkbox));
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

function weaponCard(ctx, done, weapon) {
  const { count, next } = weaponStats(done, weapon);
  const open = ui.open.has(weapon.id);
  const complete = count === CAMOS_PER_WEAPON;
  const bodyId = `w-${weapon.id}`;

  const head = h('button', {
    class: 'weapon-head', type: 'button', 'aria-expanded': String(open), 'aria-controls': bodyId,
    onClick: () => {
      if (ui.open.has(weapon.id)) ui.open.delete(weapon.id); else ui.open.add(weapon.id);
      const card = head.closest('.weapon');
      const nowOpen = ui.open.has(weapon.id);
      head.setAttribute('aria-expanded', String(nowOpen));
      card.classList.toggle('is-open', nowOpen);
      card.querySelector('.weapon-body').hidden = !nowOpen;
    },
  },
  h('span', { class: 'weapon-title' },
    h('span', { class: 'weapon-name' }, weapon.name),
    h('span', { class: 'weapon-count' }, `${count} / ${CAMOS_PER_WEAPON}`)),
  bar(count, CAMOS_PER_WEAPON, `Voortgang ${weapon.name}`),
  h('span', { class: 'weapon-next muted' },
    complete ? 'Alles vrijgespeeld ✓' : `${classById(weapon.cls).name} · Volgende: ${next.name}`));

  const camos = CAMOS.get(weapon.id);
  const milLeft = camos.filter((c) => c.group === 'military' && !done.has(key(weapon.id, c.id)));
  const body = h('div', { class: 'weapon-body', id: bodyId, hidden: !open },
    GROUPS.map((g) => h('section', { class: 'camo-group' },
      h('div', { class: 'camo-group-head' },
        h('h3', {}, g.label),
        g.id === 'military' && milLeft.length
          ? h('button', { class: 'btn btn-ghost btn-small', type: 'button', onClick: () => setDone(ctx, weapon, milLeft.map((c) => c.id), true) }, 'Alle militaire aan')
          : null),
      h('ul', { class: 'camo-list' }, camos.filter((c) => c.group === g.id).map((c) => camoRow(ctx, done, weapon, c))))));

  return h('article', { class: `card weapon${open ? ' is-open' : ''}${complete ? ' is-complete' : ''}` }, head, body);
}

function summary(done) {
  const total = WEAPONS.length * CAMOS_PER_WEAPON;
  const count = (camoId) => WEAPONS.filter((w) => done.has(key(w.id, camoId))).length;
  const doneTotal = WEAPONS.reduce((n, w) => n + CAMOS.get(w.id).filter((c) => done.has(key(w.id, c.id))).length, 0);
  const hb = count('harmonic');
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
      tile('Divergence', hb === WEAPONS.length ? '✓' : '—', 'm-div')));
}

function controls(ctx, rerender) {
  const chip = (id, label) => h('button', {
    class: `chip${ui.filter === id ? ' is-active' : ''}`, type: 'button', 'aria-pressed': String(ui.filter === id),
    onClick: () => { ui.filter = id; rerender(); },
  }, label);
  const select = h('select', {
    id: 'sort', onChange: (e) => { ui.sort = e.target.value; rerender(); },
  }, SORTS.map((s) => h('option', { value: s.id, selected: ui.sort === s.id }, s.label)));
  return h('div', { class: 'controls' },
    h('div', { class: 'chips', role: 'group', 'aria-label': 'Filter op klasse' },
      chip('all', 'Alle'), CLASSES.map((c) => chip(c.id, c.name))),
    h('div', { class: 'sort-line' }, h('label', { for: 'sort' }, 'Sorteren'), select));
}

export const app = {
  schemaVersion: SCHEMA,

  initialData() {
    return { schema: SCHEMA, progress: [] };
  },

  migrate(data) {
    data.progress ??= [];
    data.schema ??= SCHEMA;
    data.progress = purgeTombstones(data.progress, TOMBSTONE_DAYS);
    return data;
  },

  merge(local, remote) {
    return {
      ...remote,
      ...local,
      schema: Math.max(local.schema || 0, remote.schema || 0),
      progress: mergeCollections(local.progress, remote.progress),
    };
  },

  render(root, ctx) {
    const rerender = () => app.render(root, ctx);
    const done = progressIndex(ctx.data);

    let weapons = WEAPONS.filter((w) => ui.filter === 'all' || w.cls === ui.filter);
    const cnt = (w) => weaponStats(done, w).count;
    if (ui.sort === 'name') weapons = [...weapons].sort((a, b) => a.name.localeCompare(b.name, 'nl'));
    if (ui.sort === 'least') weapons = [...weapons].sort((a, b) => cnt(a) - cnt(b) || a.name.localeCompare(b.name, 'nl'));
    if (ui.sort === 'most') weapons = [...weapons].sort((a, b) => cnt(b) - cnt(a) || a.name.localeCompare(b.name, 'nl'));

    let list;
    if (ui.sort === 'class') {
      list = CLASSES.map((c) => {
        const ws = weapons.filter((w) => w.cls === c.id);
        if (!ws.length) return null;
        const got = ws.reduce((n, w) => n + cnt(w), 0);
        return h('section', { class: 'class-group' },
          h('h2', { class: 'class-head' }, h('span', {}, c.full), h('span', { class: 'muted' }, `${got} / ${ws.length * CAMOS_PER_WEAPON}`)),
          ws.map((w) => weaponCard(ctx, done, w)));
      });
    } else {
      list = h('section', { class: 'class-group' }, weapons.map((w) => weaponCard(ctx, done, w)));
    }

    root.replaceChildren(
      summary(done),
      controls(ctx, rerender),
      h('p', { class: 'muted shown-count' }, `${weapons.length} van ${WEAPONS.length} wapens`),
      ...[list].flat().filter(Boolean),
    );
  },
};
