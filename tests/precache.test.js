import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('app- en serviceworkerversie zijn gelijk', async () => {
  const config = await readFile(new URL('../js/config.js', import.meta.url), 'utf8');
  const sw = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const appVersion = config.match(/version:\s*'([^']+)'/i)?.[1];
  const swVersion = sw.match(/const VERSION = '([^']+)'/)?.[1];
  assert.ok(appVersion, 'versie ontbreekt in js/config.js');
  assert.ok(swVersion, 'VERSION ontbreekt in sw.js');
  assert.equal(swVersion, appVersion);
});

test('alle bestanden in PRECACHE bestaan', async () => {
  const sw = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const block = sw.match(/const PRECACHE = \[([\s\S]*?)\];/);
  assert.ok(block, 'PRECACHE-lijst ontbreekt');
  const paths = [...block[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
  assert.ok(paths.length > 0, 'PRECACHE is leeg');
  for (const path of paths) {
    const localPath = path.replace(/^\.\//, '');
    if (!localPath) continue; // './' is de app-root en daarmee een directory.
    await assert.doesNotReject(readFile(new URL(`../${localPath}`, import.meta.url)), `ontbrekend bestand: ${path}`);
  }
});
