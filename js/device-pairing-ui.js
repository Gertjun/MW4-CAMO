// MW4-specifieke QR-interface. De cryptografie blijft in de gepinde PWA-Core-module.
import * as vault from './core/vault.js';
import * as pair from './core/pair.js';
import * as devicePairing from './device-pairing.js';
import qrcode from './vendor/qrcode.js';
import { h } from './core/dom.js';

const $ = (selector) => document.querySelector(selector);
const QR_PREFIX = 'PWA-CORE-PAIR-2:';

let pendingNonce = null;
let pendingImport = false;

function showToast(message, kind = 'info') {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.dataset.kind = kind;
  el.hidden = false;
}

function showSetupError(message) {
  const el = $('#setup-error');
  if (!el) return;
  el.textContent = message || '';
  el.hidden = !message;
}

async function openPairingDialog() {
  const settings = await vault.getDeviceSettings();
  if (!settings?.github?.token) throw new Error('Stel eerst de synchronisatie met GitHub in.');
  const pin = pair.newPin();
  const created = await devicePairing.createPairingQrPayload({ github: settings.github, pin });
  const code = created.payload;
  const appUrl = new URL('./', location.href);
  appUrl.searchParams.set('pair', code);

  const qr = qrcode(0, 'L');
  qr.addData(appUrl.toString(), 'Byte');
  qr.make();

  const qrImage = h('img', {
    class: 'pair-qr',
    src: qr.createDataURL(5, 4),
    alt: 'QR-code om MW4 Camo Tracker op een nieuw apparaat te koppelen',
  });
  const field = h('textarea', {
    class: 'pair-code',
    readonly: true,
    rows: 4,
    'aria-label': 'Versleutelde koppelcode',
  }, code);
  const copy = h('button', { class: 'btn btn-primary', type: 'button' }, 'Koppelcode kopiëren');
  const close = h('button', { class: 'btn', type: 'button' }, 'Klaar');
  const dialog = h('dialog', {
    id: 'dlg-pair-qr',
    class: 'sheet pair-sheet',
    'aria-labelledby': 'pair-qr-title',
  },
  h('div', { class: 'sheet-header' }, h('h2', { id: 'pair-qr-title' }, 'Ander apparaat koppelen')),
  h('div', { class: 'sheet-body stack' },
    h('ol', { class: 'pair-steps' },
      h('li', {}, 'Open de camera op je iPhone en scan de QR-code. Tik op de melding om MW4 Camo Tracker te openen.'),
      h('li', {}, 'Vul op het nieuwe apparaat de pincode hieronder in en kies ', h('strong', {}, 'Koppelcode gebruiken'), '.'),
      h('li', {}, 'Vul daarna het wachtwoord van je kluis in om de gegevens van GitHub op te halen.')),
    qrImage,
    h('p', { class: 'pair-pin' }, h('span', { class: 'muted' }, 'Pincode'), h('strong', {}, pin)),
    h('p', { class: 'hint' }, 'De QR-code bevat een versleutelde koppeling en is 3 minuten geldig. Deel de pincode apart; wie beide heeft, kan de GitHub-koppeling uitlezen.'),
    field,
    h('div', { class: 'button-row' }, copy, close)));

  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('Koppelcode gekopieerd.', 'ok');
    } catch {
      field.select();
      showToast('Kopiëren lukte niet. Selecteer de code en kopieer hem zelf.');
    }
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => dialog.remove());
  document.body.append(dialog);
  dialog.showModal();
}

export function installDevicePairingUi() {
  const pairOut = $('#btn-pair-out');
  pairOut?.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await openPairingDialog();
    } catch (error) {
      showToast(error?.message || 'QR-koppeling maken is mislukt.', 'error');
    } finally {
      button.disabled = false;
    }
  }, true);

  const pairIn = $('#btn-pair-in');
  pairIn?.addEventListener('click', async (event) => {
    const form = $('#form-setup-link');
    const code = form?.elements.pairCode.value.trim() || '';
    // Lange handmatige PAIR-2-codes vallen terug op de Core-shell; deze adapter verwerkt QR-formaatcodes.
    if (!code.startsWith(QR_PREFIX) || code.length > devicePairing.PAIRING_QR_MAX_CHARS) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const opened = await devicePairing.openPairingQrPayload(code, form.elements.pairPin.value);
      const github = opened.github;
      for (const key of ['owner', 'repo', 'branch', 'path', 'token']) {
        form.elements[key].value = github[key] ?? '';
      }
      form.elements.pairCode.value = '';
      form.elements.pairPin.value = '';
      pendingNonce = opened.nonce;
      form.elements.password.focus();
      showSetupError('');
      showToast('QR-koppeling gecontroleerd. Vul nu het wachtwoord van je kluis in.', 'ok');
    } catch (error) {
      showSetupError(error?.message || 'De QR-koppeling kon niet worden geopend.');
    } finally {
      button.disabled = false;
    }
  }, true);

  const linkForm = $('#form-setup-link');
  linkForm?.addEventListener('submit', () => {
    if (pendingNonce) pendingImport = true;
  });
  $('#form-setup-new')?.addEventListener('submit', () => { pendingImport = false; });

  const setupScreen = $('#screen-setup');
  if (setupScreen && typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      if (!pendingNonce || !pendingImport || !setupScreen.hidden) return;
      const nonce = pendingNonce;
      pendingNonce = null;
      pendingImport = false;
      try {
        devicePairing.markPairingNonceUsed(nonce);
      } catch (error) {
        showToast('Koppelen is gelukt, maar de lokale replaybescherming kon niet worden bijgewerkt: ' + error.message, 'error');
      }
    });
    observer.observe(setupScreen, { attributes: true, attributeFilter: ['hidden'] });
  }

  // De camera opent deze app-link. Vul de code vooraf in op een leeg apparaat.
  const incomingUrl = new URL(location.href);
  const incomingCode = incomingUrl.searchParams.get('pair');
  if (incomingCode) {
    incomingUrl.searchParams.delete('pair');
    history.replaceState(history.state, '', incomingUrl.pathname + incomingUrl.search + incomingUrl.hash);
    if (vault.hasVault()) {
      showToast('Deze app heeft al een kluis. QR-koppeling is alleen bedoeld voor een nieuw of gewist apparaat; je bestaande kluis is niet gewijzigd.', 'error');
    } else if (incomingCode.startsWith(QR_PREFIX)) {
      const newForm = $('#form-setup-new');
      const linkForm = $('#form-setup-link');
      linkForm.elements.pairCode.value = incomingCode;
      newForm.hidden = true;
      linkForm.hidden = false;
      $('[data-setup-tab="new"]')?.setAttribute('aria-selected', 'false');
      $('[data-setup-tab="link"]')?.setAttribute('aria-selected', 'true');
    } else {
      showSetupError('De QR-link bevat geen geldige MW4-koppeling. Scan een nieuwe QR-code.');
    }
  }
}
