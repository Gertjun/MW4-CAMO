import { installDevicePairingUi } from './device-pairing-ui.js';
import { start } from './core/shell.js';

// Installeer app-specifieke QR-handlers vóór de gedeelde shell zijn handlers koppelt.
installDevicePairingUi();

start().catch((err) => {
  console.error(err);
  document.body.textContent = 'De app kon niet starten: ' + err.message;
});
