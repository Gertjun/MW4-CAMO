// =============================================================
//  Laptop: instellingen als eigen scherm en sync/slot in de zijbalk
// =============================================================
// Op de telefoon blijft alles zoals de schil het regelt: knoppen bovenin en
// instellingen als volledig scherm (pop-up). Op de laptop (zijbalk zichtbaar)
// zet de app het bestaande instellingenvenster van de schil gewoon in de
// pagina, zonder pop-up. De schil zelf (js/core/) blijft ongewijzigd: we
// openen het venster zonder showModal en gebruiken de bestaande knoppen.

import { h } from './core/dom.js';

export const DESKTOP = window.matchMedia('(min-width: 900px)');

// Extra uitleg onder elk onderdeel in de lijst (alleen zichtbaar op de laptop).
const DESCRIPTIONS = {
  sync: 'Koppeling met GitHub en nu synchroniseren',
  security: 'Face ID / passkey en wachtwoord',
  backup: 'Back-up downloaden of terugzetten',
  about: 'Versie en updates',
  danger: 'Kluis en token van dit apparaat verwijderen',
};

const SYNC_SHORT = {
  ok: 'Gesynchroniseerd',
  pending: 'Nog niet gesynchroniseerd',
  syncing: 'Synchroniseren…',
  error: 'Sync mislukt',
  off: 'Sync niet ingesteld',
};

const $ = (sel) => document.querySelector(sel);
let wired = false;
let dlgEl = null; // het instellingenvenster (ook als het even los van de pagina staat)

/** Eenmalig: uitleg in de lijst, het venster terugzetten na vergrendelen, sync-status volgen. */
function wireOnce() {
  if (wired) return;
  wired = true;
  dlgEl = $('#dlg-settings');

  for (const row of document.querySelectorAll('#settings-menu [data-page]')) {
    const text = DESCRIPTIONS[row.dataset.page];
    const label = row.querySelector('.menu-label');
    if (text && label && !label.querySelector('.menu-desc')) label.append(h('span', { class: 'menu-desc' }, text));
  }

  // Wordt de inhoud vervangen (vergrendelen, ander scherm), dan het venster
  // terugzetten waar de schil het verwacht en sluiten.
  const root = $('#app-root');
  new MutationObserver(() => restoreDialog()).observe(root, { childList: true });

  // De sync-knop van de schil (verborgen op de laptop) bijhouden.
  new MutationObserver(updateSideSync).observe($('#btn-sync'), { attributes: true, attributeFilter: ['data-state', 'title'] });
}

/** Venster terug naar zijn oude plek in <body> en sluiten. */
function restoreDialog() {
  const dlg = dlgEl;
  if (!dlg) return;
  if (dlg.parentElement === document.body) return;
  if (dlg.isConnected && dlg.closest('#app-root') && dlg.dataset.inline === 'on') return; // staat bewust in de pagina
  document.body.insertBefore(dlg, $('#toast'));
  delete dlg.dataset.inline;
  if (dlg.open) dlg.close();
}

/** Aanroepen aan het begin van elke render: verlaat het instellingenscherm netjes. */
export function leaveSettings() {
  wireOnce();
  const dlg = dlgEl;
  if (dlg?.dataset.inline === 'on') {
    delete dlg.dataset.inline;
    restoreDialog();
  }
}

/**
 * Toont het instellingenscherm in `root` (alleen op de laptop).
 * page: welk onderdeel open moet ('sync', 'security', …); standaard sync.
 */
export function renderSettings(root, top, bottom, page = 'sync') {
  wireOnce();
  const dlg = dlgEl;
  if (dlg.dataset.inline === 'on' && dlg.parentElement === root) {
    // Al zichtbaar: alleen de rest vervangen, het venster zelf laten staan
    // (anders raakt het gekozen onderdeel kwijt).
    for (const el of [...root.children]) if (el !== dlg) el.remove();
    root.prepend(...top);
    root.append(...bottom);
    return;
  }
  const open = () => {
    dlg.dataset.inline = 'on';
    root.replaceChildren(...top, dlg, ...bottom);
    dlg.show(); // niet-modaal: de zijbalk blijft bruikbaar
    $('#btn-settings').click(); // de schil vult de formulieren en de samenvattingen
    document.querySelector(`#settings-menu [data-page="${page}"]`)?.click();
  };
  if (dlg.open) { // stond nog als pop-up open (bijv. venster net breder gemaakt)
    dlg.addEventListener('close', open, { once: true });
    dlg.close();
  } else open();
}

// ---------- Zijbalk: sync-status en vergrendelen ----------

function updateSideSync() {
  const src = $('#btn-sync');
  const el = document.querySelector('.side-sync');
  if (!src || !el) return;
  const state = src.dataset.state || 'off';
  const full = src.title || SYNC_SHORT[state];
  el.dataset.state = state;
  el.title = full;
  el.setAttribute('aria-label', `Synchronisatie: ${full}. Tik om te synchroniseren.`);
  el.querySelector('.side-sync-label').textContent = SYNC_SHORT[state] || full; // volledige tekst (met tijd) als tooltip
}

/** Sync-status onder de appnaam. Tikken = nu synchroniseren (of instellen als dat nog niet is gebeurd). */
export function sideSync(openSyncSettings) {
  const btn = h('button', {
    type: 'button', class: 'side-sync',
    onClick: () => {
      if ($('#btn-sync').dataset.state === 'off') openSyncSettings();
      else $('#btn-sync').click();
    },
  }, h('span', { class: 'side-sync-dot', 'aria-hidden': 'true' }), h('span', { class: 'side-sync-label' }));
  queueMicrotask(updateSideSync);
  return btn;
}

/** Knop onderin de zijbalk om de app te vergrendelen. */
export function sideLock(icon) {
  return h('button', {
    type: 'button', class: 'tabbar-btn side-lock', title: 'Vergrendelen',
    onClick: () => $('#btn-lock').click(),
  }, icon(['M7 11V8a5 5 0 0 1 10 0v3', 'M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z']),
  h('span', { class: 'tabbar-label' }, 'Vergrendelen'));
}
