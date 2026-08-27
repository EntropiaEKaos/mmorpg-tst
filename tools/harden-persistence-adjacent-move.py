from pathlib import Path

path = Path('server/test/persistence-durability.test.mjs')
text = path.read_text(encoding='utf-8')

def replace_once(old, new, label):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    text = text.replace(old, new, 1)

replace_once("""  const beforeX = client.initial.payload.player.x;
  const beforeY = client.initial.payload.player.y;
  client.send('intent', { type: 'move', payload: { dx: 1, dy: 0 }, timestamp: Date.now() });
  const moved = await client.waitFor(message => message.kind === 'snapshot' && message.payload?.player?.x === beforeX + 1 && message.payload?.player?.y === beforeY);
  assert.equal(moved.payload.player.x, beforeX + 1);
  const persisted = await waitForPersisted(files.players, data => data[name]?.x === beforeX + 1 && data[name]?.y === beforeY, 4000);
  assert.equal(persisted[name].x, beforeX + 1);
""", """  const moved = await moveToAnyAdjacentTile(client);
  const persisted = await waitForPersisted(files.players, data => data[name]?.x === moved.x && data[name]?.y === moved.y, 4000);
  assert.equal(persisted[name].x, moved.x);
  assert.equal(persisted[name].y, moved.y);
""", 'autosave movement')

replace_once("""  const beforeX = client.initial.payload.player.x;
  const beforeY = client.initial.payload.player.y;
  client.send('intent', { type: 'move', payload: { dx: 1, dy: 0 }, timestamp: Date.now() });
  await client.waitFor(message => message.kind === 'snapshot' && message.payload?.player?.x === beforeX + 1 && message.payload?.player?.y === beforeY);
  client.send('load_request', {});
  const loaded = await client.waitFor(message => message.kind === 'load_response');
  assert.equal(loaded.payload.x, beforeX + 1);
  assert.equal(loaded.payload.y, beforeY);
""", """  const moved = await moveToAnyAdjacentTile(client);
  client.send('load_request', {});
  const loaded = await client.waitFor(message => message.kind === 'load_response');
  assert.equal(loaded.payload.x, moved.x);
  assert.equal(loaded.payload.y, moved.y);
""", 'live load movement')

path.write_text(text, encoding='utf-8')
print('Persistence durability movement tests hardened for arbitrary adjacent walkable tiles')
