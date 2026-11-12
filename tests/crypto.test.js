import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptJSON, decryptJSON, generateDataKey, passwordKey, wrapDataKey, unwrapDataKey, sameKey } from '../js/core/crypto.js';

test('AES-GCM versleutelt en ontsleutelt JSON', async () => {
  const key = await generateDataKey();
  const value = { progress: [{ id: 'm4:gold', done: true }], note: 'Nederlandse tekst: één twee drie' };
  const encrypted = await encryptJSON(value, key);
  assert.notEqual(encrypted.data, JSON.stringify(value));
  assert.deepEqual(await decryptJSON(encrypted, key), value);
});

test('AES-GCM detecteert gewijzigde of verkeerde versleutelde gegevens', async () => {
  const key = await generateDataKey();
  const encrypted = await encryptJSON({ secret: 'waarde' }, key);
  const bytes = Buffer.from(encrypted.data, 'base64');
  bytes[bytes.length - 1] ^= 1;
  await assert.rejects(decryptJSON({ ...encrypted, data: bytes.toString('base64') }, key));
});

test('wachtwoordsleutel kan datasleutel inpakken en alleen met juist wachtwoord openen', async () => {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const dataKey = await generateDataKey();
  const goodKey = await passwordKey('correct horse battery staple', salt, 10_000);
  const wrapped = await wrapDataKey(dataKey, goodKey);
  const unwrapped = await unwrapDataKey(wrapped, goodKey);
  assert.equal(await sameKey(dataKey, unwrapped), true);

  const wrongKey = await passwordKey('wrong password', salt, 10_000);
  await assert.rejects(unwrapDataKey(wrapped, wrongKey));
});
