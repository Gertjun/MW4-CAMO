// =============================================================
//  Loadouts — opgeslagen wapencombinaties
// =============================================================
// Gegevens in de kluis (sinds schema 2):
//   loadouts: [{ id, createdAt, updatedAt, name,
//                primary:   { weaponId, attachments: [5 × tekst] },
//                secondary: { weaponId | null, attachments: [5 × tekst] },
//                notes }]
// Verwijderen maakt een tombstone (removeById), nooit echt weghalen.

import { h } from './core/dom.js';
import { newRecord, updateById, removeById, alive } from './core/records.js';
import { CLASSES, WEAPONS, weaponById, classById, weaponImageOf } from './catalog.js';

export const ATTACHMENT_SLOTS = 5;

const emptySlots = () => Array(ATTACHMENT_SLOTS).fill('');
const clean = (s) => String(s ?? '').trim();

/** Sluit een pop-up als de app vergrendelt (de schil maakt #app-root dan leeg). */
export function closeOnLock(dlg) {
  const root = document.getElementById('app-root');
  if (!root) return;
  const obs = new MutationObserver(() => { if (!root.childElementCount && dlg.open) dlg.close(); });
  obs.observe(root, { childList: true });
  dlg.addEventListener('close', () => obs.disconnect());
}

// ---------- Formulier ----------

function weaponSelect(id, selected, allowNone) {
  return h('select', { id, name: id, required: !allowNone },
    allowNone ? h('option', { value: '', selected: !selected }, 'Geen') : h('option', { value: '', disabled: true, selected: !selected }, 'Kies een wapen'),
    CLASSES.map((c) => {
      const ws = WEAPONS.filter((w) => w.cls === c.id);
      return ws.length ? h('optgroup', { label: c.full }, ws.map((w) => h('option', { value: w.id, selected: w.id === selected }, w.name))) : null;
    }));
}

function weaponFieldset(prefix, legend, slot, allowNone) {
  const select = weaponSelect(`${prefix}-weapon`, slot?.weaponId, allowNone);
  const atts = slot?.attachments || [];
  const inputs = h('div', { class: 'att-inputs' },
    Array.from({ length: ATTACHMENT_SLOTS }, (_, i) => h('label', { class: 'field' },
      h('span', {}, `Attachment ${i + 1}`),
      h('input', { type: 'text', name: `${prefix}-att-${i}`, value: atts[i] || '', maxlength: 60, autocomplete: 'off', autocapitalize: 'words' }))));
  const sync = () => { inputs.hidden = allowNone && !select.value; };
  select.addEventListener('change', sync);
  sync();
  return h('fieldset', { class: 'lo-fieldset' },
    h('legend', {}, legend),
    h('label', { class: 'field' }, h('span', {}, 'Wapen'), select),
    inputs);
}

function readSlot(form, prefix, previous) {
  const weaponId = form.elements[`${prefix}-weapon`].value || null;
  const attachments = weaponId
    ? Array.from({ length: ATTACHMENT_SLOTS }, (_, i) => clean(form.elements[`${prefix}-att-${i}`].value))
    : emptySlots();
  return { ...(previous || {}), weaponId, attachments };
}

function openEditor(ctx, existing) {
  const isNew = !existing;
  const nameInput = h('input', { type: 'text', id: 'lo-name', name: 'name', required: true, maxlength: 60, value: existing?.name || '', autocomplete: 'off', placeholder: 'Bijv. Ranked SMG' });
  const notes = h('textarea', { id: 'lo-notes', name: 'notes', rows: 3, maxlength: 1000 });
  notes.value = existing?.notes || '';

  const form = h('form', { class: 'stack lo-form', novalidate: false },
    h('label', { class: 'field', for: 'lo-name' }, h('span', {}, 'Naam'), nameInput),
    weaponFieldset('pri', 'Primair wapen', existing?.primary, false),
    weaponFieldset('sec', 'Secundair wapen', existing?.secondary, true),
    h('label', { class: 'field', for: 'lo-notes' }, h('span', {}, 'Notitie'), notes),
    h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, isNew ? 'Opslaan' : 'Wijzigingen opslaan'),
    isNew ? null : h('button', { class: 'btn btn-danger btn-block', type: 'button', onClick: onDelete }, 'Loadout verwijderen'));

  const dlg = h('dialog', { class: 'sheet lo-dialog', 'aria-labelledby': 'lo-dlg-title' },
    h('div', { class: 'sheet-header' },
      h('h2', { id: 'lo-dlg-title' }, isNew ? 'Nieuwe loadout' : 'Loadout bewerken'),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Sluiten', onClick: () => dlg.close() }, '✕')),
    h('div', { class: 'sheet-body' }, form));

  async function onDelete() {
    if (!ctx.confirm(`Loadout "${existing.name}" verwijderen?`)) return;
    dlg.close();
    await ctx.update((d) => { removeById(d.loadouts, existing.id); });
    ctx.toast('Loadout verwijderd.');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = clean(nameInput.value);
    if (!name) { nameInput.focus(); return; }
    const fields = {
      name,
      primary: readSlot(form, 'pri', existing?.primary),
      secondary: readSlot(form, 'sec', existing?.secondary),
      notes: clean(notes.value),
    };
    dlg.close();
    await ctx.update((d) => {
      d.loadouts ??= [];
      if (isNew) d.loadouts.push(newRecord(fields));
      else updateById(d.loadouts, existing.id, fields);
    });
  });

  dlg.addEventListener('close', () => dlg.remove());
  closeOnLock(dlg);
  document.body.append(dlg);
  dlg.showModal();
  if (isNew) nameInput.focus();
}

// ---------- Weergave ----------

function weaponBlock(label, slot) {
  const weapon = slot?.weaponId ? weaponById(slot.weaponId) : null;
  if (!slot?.weaponId) return null;
  const atts = (slot.attachments || []).filter(Boolean);
  const src = weapon ? weaponImageOf(weapon) : null;
  return h('div', { class: 'lo-weapon' },
    h('span', { class: `weapon-pic${src ? '' : ' is-empty'}`, 'aria-hidden': 'true' },
      src ? h('img', { src, alt: '', width: 120, height: 60, loading: 'lazy', decoding: 'async' }) : null),
    h('div', { class: 'lo-weapon-text' },
      h('span', { class: 'lo-slot muted' }, label),
      h('span', { class: 'lo-weapon-name' }, weapon ? weapon.name : 'Onbekend wapen',
        weapon ? h('span', { class: 'muted' }, ` · ${classById(weapon.cls).name}`) : null),
      atts.length
        ? h('ul', { class: 'lo-atts' }, atts.map((a) => h('li', {}, a)))
        : h('span', { class: 'muted lo-none' }, 'Geen attachments')));
}

function loadoutCard(ctx, lo) {
  return h('article', { class: 'card loadout' },
    h('div', { class: 'loadout-head' },
      h('h2', { class: 'loadout-name' }, lo.name || 'Naamloos'),
      h('button', { class: 'btn btn-ghost btn-small', type: 'button', 'aria-label': `${lo.name} bewerken`, onClick: () => openEditor(ctx, lo) }, 'Bewerken')),
    weaponBlock('Primair', lo.primary),
    weaponBlock('Secundair', lo.secondary),
    lo.notes ? h('p', { class: 'lo-notes' }, lo.notes) : null);
}

/** Tekent het Loadouts-scherm. Geeft een lijst elementen terug. */
export function renderLoadouts(ctx) {
  const list = alive(ctx.data.loadouts).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'nl'));
  const addBtn = h('button', { class: 'btn btn-primary btn-block lo-add', type: 'button', onClick: () => openEditor(ctx, null) }, '+ Nieuwe loadout');
  if (!list.length) {
    return [addBtn, h('div', { class: 'card empty' },
      h('p', { class: 'empty-title' }, 'Nog geen loadouts'),
      h('p', { class: 'muted' }, 'Sla je favoriete wapens met attachments op, zodat je ze snel terugvindt.'))];
  }
  return [
    addBtn,
    h('p', { class: 'muted shown-count' }, list.length === 1 ? '1 loadout' : `${list.length} loadouts`),
    h('section', { class: 'loadout-list' }, list.map((lo) => loadoutCard(ctx, lo))),
  ];
}
