import test from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage {
  #data = new Map();
  getItem(key) { return this.#data.has(key) ? this.#data.get(key) : null; }
  setItem(key, value) { this.#data.set(key, String(value)); }
  removeItem(key) { this.#data.delete(key); }
  key(index) { return [...this.#data.keys()][index] ?? null; }
  get length() { return this.#data.size; }
}
Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });

const vault = await import('../js/core/vault.js');
const { syncNow } = await import('../js/core/sync.js');
const { encryptJSON } = await import('../js/core/crypto.js');

test('synchronisatie uploadt, herkent gelijke versies, downloadt en voegt samen', async () => {
  let remote = null;
  let revision = 0;
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'PUT') {
      const body = JSON.parse(options.body);
      if (body.sha && body.sha !== remote?.sha) return new Response('{}', { status: 409 });
      remote = {
        sha: `sha-${++revision}`,
        envelope: JSON.parse(Buffer.from(body.content, 'base64').toString('utf8')),
      };
      return Response.json({ content: { sha: remote.sha } });
    }
    if (!remote) return new Response('{}', { status: 404 });
    return Response.json({
      sha: remote.sha,
      encoding: 'base64',
      content: Buffer.from(JSON.stringify(remote.envelope)).toString('base64'),
    });
  };

  const initial = { schema: 4, progress: [], loadouts: [], pins: [], overviewOrder: null };
  await vault.create('een sterke wachtzin van twaalf tekens', initial);
  const settings = { owner: 'owner', repo: 'private-data', branch: 'main', path: 'vault.json', token: 'test-token' };
  const opts = { settings, merge: (local, cloud) => ({ ...cloud, ...local }), schemaVersion: 4 };

  assert.equal(await syncNow(opts), 'uploaded');
  assert.equal(remote.sha, vault.getSyncMeta().sha);
  assert.equal(await syncNow(opts), 'up-to-date');

  const localData = { ...vault.getData(), progress: [{ id: 'local', done: true, updatedAt: 20 }] };
  await vault.setData(localData);
  assert.equal(await syncNow(opts), 'uploaded');

  // Simuleer een wijziging op een tweede apparaat met dezelfde datasleutel.
  const cloudData = { ...localData, progress: [...localData.progress, { id: 'remote', done: true, updatedAt: 30 }] };
  remote = {
    sha: `sha-${++revision}`,
    envelope: {
      ...remote.envelope,
      payload: await encryptJSON(cloudData, vault.getDataKey()),
      updatedAt: Date.now(),
    },
  };
  assert.equal(await syncNow(opts), 'downloaded');
  assert.deepEqual(vault.getData().progress.map((r) => r.id).sort(), ['local', 'remote']);

  // Lokaal en remote veranderen onafhankelijk; de merge moet beide bewaren.
  await vault.setData({ ...vault.getData(), loadouts: [{ id: 'local-lo', name: 'Lokaal', updatedAt: 40 }] });
  const cloudMerge = {
    ...vault.getData(),
    loadouts: [{ id: 'remote-lo', name: 'Remote', updatedAt: 50 }],
  };
  remote = {
    sha: `sha-${++revision}`,
    envelope: {
      ...remote.envelope,
      payload: await encryptJSON(cloudMerge, vault.getDataKey()),
      updatedAt: Date.now(),
    },
  };
  assert.equal(await syncNow({ ...opts, merge: (local, cloud) => ({
    ...cloud,
    ...local,
    loadouts: [...local.loadouts, ...cloud.loadouts],
  }) }), 'merged');
  assert.deepEqual(vault.getData().loadouts.map((r) => r.id).sort(), ['local-lo', 'remote-lo']);
});


test('synchronisatie stopt veilig bij gegevens uit een nieuwer schema', async () => {
  await vault.reset();
  let remote = null;
  let revision = 0;
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'PUT') {
      const body = JSON.parse(options.body);
      remote = {
        sha: `future-sha-${++revision}`,
        envelope: JSON.parse(Buffer.from(body.content, 'base64').toString('utf8')),
      };
      return Response.json({ content: { sha: remote.sha } });
    }
    if (!remote) return new Response('{}', { status: 404 });
    return Response.json({
      sha: remote.sha,
      encoding: 'base64',
      content: Buffer.from(JSON.stringify(remote.envelope)).toString('base64'),
    });
  };

  const initial = { schema: 4, progress: [], loadouts: [], pins: [], overviewOrder: null };
  await vault.create('een sterke wachtzin van twaalf tekens', initial);
  const settings = { owner: 'owner', repo: 'private-data', branch: 'main', path: 'vault.json', token: 'test-token' };
  const opts = { settings, merge: (local, cloud) => ({ ...cloud, ...local }), schemaVersion: 4 };
  await syncNow(opts);

  const future = { ...initial, schema: 5, progress: [{ id: 'future', done: true, updatedAt: 50 }] };
  remote = {
    sha: `future-sha-${++revision}`,
    envelope: {
      ...remote.envelope,
      payload: await encryptJSON(future, vault.getDataKey()),
      updatedAt: Date.now(),
    },
  };
  await assert.rejects(syncNow(opts), { name: 'UpdateRequiredError' });
  assert.equal(vault.getData().schema, 4);
  assert.deepEqual(vault.getData().progress, []);
});

test('synchronisatie probeert opnieuw na een GitHub-conflict', async () => {
  await vault.reset();
  let remote = null;
  let revision = 0;
  let conflictReturned = false;
  let putAttempts = 0;
  globalThis.fetch = async (url, options = {}) => {
    if (options.method === 'PUT') {
      putAttempts++;
      const body = JSON.parse(options.body);
      if (body.sha && !conflictReturned) {
        conflictReturned = true;
        return new Response('{}', { status: 409 });
      }
      remote = {
        sha: `retry-sha-${++revision}`,
        envelope: JSON.parse(Buffer.from(body.content, 'base64').toString('utf8')),
      };
      return Response.json({ content: { sha: remote.sha } });
    }
    if (!remote) return new Response('{}', { status: 404 });
    return Response.json({
      sha: remote.sha,
      encoding: 'base64',
      content: Buffer.from(JSON.stringify(remote.envelope)).toString('base64'),
    });
  };

  const initial = { schema: 4, progress: [], loadouts: [], pins: [], overviewOrder: null };
  await vault.create('een sterke wachtzin van twaalf tekens', initial);
  const settings = { owner: 'owner', repo: 'private-data', branch: 'main', path: 'vault.json', token: 'test-token' };
  const opts = { settings, merge: (local, cloud) => ({ ...cloud, ...local }), schemaVersion: 4 };
  assert.equal(await syncNow(opts), 'uploaded');
  await vault.setData({ ...initial, progress: [{ id: 'retry', done: true, updatedAt: 60 }] });
  assert.equal(await syncNow(opts), 'uploaded');
  assert.equal(conflictReturned, true);
  assert.equal(putAttempts, 3);
  assert.deepEqual(vault.getData().progress.map((r) => r.id), ['retry']);
});
