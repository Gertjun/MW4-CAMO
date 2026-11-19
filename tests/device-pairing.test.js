import test from 'node:test';import assert from 'node:assert/strict';import{webcrypto}from'node:crypto';import{createPairingQrPayload,openPairingQrPayload,markPairingNonceUsed}from'../js/device-pairing.js';import qrcode from'../js/vendor/qrcode.js';if(!globalThis.crypto)globalThis.crypto=webcrypto;const github={owner:'Gertjun',repo:'SyncData',branch:'main',path:'mw4-camo/vault.json',token:'github_pat_synthetic_test_token'};class MemoryStorage{#values=new Map();getItem(k){return this.#values.has(k)?this.#values.get(k):null}setItem(k,v){this.#values.set(k,String(v))}}
test('QR-pairing gebruikt Core v1.3 en draagt alleen GitHub Sync-configuratie over',async()=>{const c=await createPairingQrPayload({github,pin:'AB3D-7KMP-9Q2R-5TUV',now:1000});assert.ok(c.payload.startsWith('PWA-CORE-PAIR-2:'));const o=await openPairingQrPayload(c.payload,'AB3D-7KMP-9Q2R-5TUV',2000,new MemoryStorage());assert.deepEqual(o.github,github);assert.equal(o.nonce,c.nonce);assert.equal(o.expiresAt,181000)});
test('QR-pairing weigert een verkeerde 16-tekens-pincode',async()=>{const c=await createPairingQrPayload({github,pin:'AB3D-7KMP-9Q2R-5TUV',now:1000});await assert.rejects(openPairingQrPayload(c.payload,'ZZZZ-9999-AAAA-BBBB',2000),/pincode klopt niet/)});
test('QR-pairing weigert een verlopen overdracht',async()=>{const c=await createPairingQrPayload({github,pin:'AB3D-7KMP-9Q2R-5TUV',now:1000});await assert.rejects(openPairingQrPayload(c.payload,'AB3D-7KMP-9Q2R-5TUV',c.expiresAt),/verlopen/)});
test('QR-pairing valideert de GitHub-configuratie en PIN',async()=>{await assert.rejects(createPairingQrPayload({github:{...github,owner:'bad owner'},pin:'AB3D-7KMP-9Q2R-5TUV'}),/GitHub-eigenaar is ongeldig/);await assert.rejects(createPairingQrPayload({github,pin:'AB3D-7KMP'}),/16 tekens/)});
test('een gebruikte pairing-nonce kan lokaal niet opnieuw worden gemarkeerd',async()=>{const c=await createPairingQrPayload({github,pin:'AB3D-7KMP-9Q2R-5TUV',now:1000});const s=new MemoryStorage();markPairingNonceUsed(c.nonce,s,2000);assert.throws(()=>markPairingNonceUsed(c.nonce,s,2500),/al gebruikt/)});
test('de QR-generator kan een realistische app-link encoderen',async()=>{const c=await createPairingQrPayload({github:{...github,token:'x'.repeat(500)},pin:'AB3D-7KMP-9Q2R-5TUV',now:1000});const url=new URL('https://gertjun.github.io/MW4-CAMO/');url.searchParams.set('pair',c.payload);const qr=qrcode(0,'L');qr.addData(url.toString(),'Byte');qr.make();assert.ok(qr.getModuleCount()>=21);assert.ok(qr.createDataURL(3,4).startsWith('data:image/gif;base64,'))});
test('een gebruikte QR-code kan lokaal niet opnieuw worden geopend',async()=>{const c=await createPairingQrPayload({github,pin:'AB3D-7KMP-9Q2R-5TUV',now:1000});const s=new MemoryStorage();markPairingNonceUsed(c.nonce,s,2000);await assert.rejects(openPairingQrPayload(c.payload,'AB3D-7KMP-9Q2R-5TUV',2500,s),/op dit apparaat al gebruikt/) });

import { readFile } from 'node:fs/promises';
const pairingUiSource = await readFile(new URL('../js/device-pairing-ui.js', import.meta.url), 'utf8');
test('QR en PIN worden nooit gelijktijdig getoond; er is een aparte PIN-weergave',()=>{
  const dialog=pairingUiSource.slice(pairingUiSource.indexOf('async function openPairingDialog()'),pairingUiSource.indexOf('export function installDevicePairingUi'));
  assert.match(dialog,/id: 'pair-qr-panel'/);
  assert.match(dialog,/id: 'pair-pin-panel', hidden: true/);
  assert.match(dialog,/showPin\.addEventListener\('click', \(\) => \{ qrPanel\.hidden = true; pinPanel\.hidden = false; \}\)/);
  assert.match(dialog,/backToQr\.addEventListener\('click', \(\) => \{ pinPanel\.hidden = true; qrPanel\.hidden = false; \}\)/);
  assert.match(dialog,/Pincode tonen \(QR en koppelcode verbergen\)/);
  assert.match(dialog,/De QR-code en koppelcode zijn verborgen/);
});
test('QR-koppelcode en PIN hebben aparte kopieeracties',()=>{
  const dialog=pairingUiSource.slice(pairingUiSource.indexOf('async function openPairingDialog()'),pairingUiSource.indexOf('export function installDevicePairingUi'));
  assert.match(dialog,/Koppelcode kopiëren/);
  assert.match(dialog,/Pincode kopiëren/);
  assert.match(dialog,/navigator\.clipboard\.writeText\(code\)/);
  assert.match(dialog,/navigator\.clipboard\.writeText\(pin\)/);
});
