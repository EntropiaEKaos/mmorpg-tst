from pathlib import Path

ROOT = Path('.')
def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:120]!r}')
    write(path, text.replace(old, new, 1))

replace_once('server/server.js',
"    if (msg.kind === 'load_request') {\n      const saved = playerDB.get(authenticatedPlayer);\n      ws.send(JSON.stringify({ kind: 'load_response', payload: saved, time: Date.now() }));\n      return;\n    }",
"    if (msg.kind === 'load_request') {\n      // While a character is online the in-memory engine is canonical; returning\n      // PlayerDB here could expose an autosave-old snapshot to the same client.\n      const livePlayer = engine.getPlayer(clientId);\n      const saved = livePlayer ? buildAuthoritativeSave(livePlayer) : playerDB.get(authenticatedPlayer);\n      ws.send(JSON.stringify({ kind: 'load_response', payload: saved, time: Date.now() }));\n      return;\n    }")

path = Path('server/test/persistence-durability.test.mjs')
text = path.read_text(encoding='utf-8')
extra = r'''

test('load_request returns current authoritative memory instead of autosave-old disk state', async t => {
  const { port, ready } = startServer(t, 300000);
  await ready;
  const stamp = Date.now().toString(36);
  const name = `LiveLoad${stamp}`;
  const token = await createCharacter(port, 'live', name);
  const client = await connectClient(port, token, name);
  t.after(() => { try { client.ws.close(); } catch {} });
  const beforeX = client.initial.payload.player.x;
  const beforeY = client.initial.payload.player.y;
  client.send('intent', { type: 'move', payload: { dx: 1, dy: 0 }, timestamp: Date.now() });
  await client.waitFor(message => message.kind === 'snapshot' && message.payload?.player?.x === beforeX + 1 && message.payload?.player?.y === beforeY);
  client.send('load_request', {});
  const loaded = await client.waitFor(message => message.kind === 'load_response');
  assert.equal(loaded.payload.x, beforeX + 1);
  assert.equal(loaded.payload.y, beforeY);
});

test('SIGTERM flushes current online player state before process exit', async t => {
  const { port, ready, files, child } = startServer(t, 300000);
  await ready;
  const stamp = Date.now().toString(36);
  const name = `Shutdown${stamp}`;
  const token = await createCharacter(port, 'shutdown', name);
  const client = await connectClient(port, token, name);
  const beforeX = client.initial.payload.player.x;
  const beforeY = client.initial.payload.player.y;
  client.send('intent', { type: 'move', payload: { dx: 1, dy: 0 }, timestamp: Date.now() });
  await client.waitFor(message => message.kind === 'snapshot' && message.payload?.player?.x === beforeX + 1 && message.payload?.player?.y === beforeY);
  const exited = new Promise(resolve => child.once('exit', resolve));
  child.kill('SIGTERM');
  await exited;
  const persisted = readPlayers(files.players);
  assert.equal(persisted[name]?.x, beforeX + 1);
  assert.equal(persisted[name]?.y, beforeY);
});
'''
if 'load_request returns current authoritative memory' not in text:
    text += extra
path.write_text(text, encoding='utf-8')

print('Foundation 7.2 persistence post-gate hardening applied')
