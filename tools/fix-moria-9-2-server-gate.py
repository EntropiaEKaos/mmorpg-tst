from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

alpha = ROOT / 'server/test/alpha-content-9-1.test.mjs'
s = alpha.read_text(encoding='utf-8')
s = s.replace("assert.equal(db.data.version, 2);", "assert.equal(db.data.version, 3);")
s = s.replace("test('9.0 content migrates to alpha v2 once while preserving admin edits across restart'", "test('9.0 content crosses alpha migrations while preserving admin edits across restart'")
s = s.replace("assert.equal(migrated.data.version, 2);", "assert.equal(migrated.data.version, 3);")
s = s.replace("test('intentionally empty legacy content remains empty after v2 migration marker'", "test('intentionally empty legacy content remains empty after v3 migration marker'")
alpha.write_text(s, encoding='utf-8')

hardening = ROOT / 'server/test/hardening.test.mjs'
s = hardening.read_text(encoding='utf-8')
old = """test('mounting is server-gated by progression', () => {
  const { id, player } = makePlayer();
  try {
    player.level = 4;
    assert.equal(engine.processIntent(id, { type: 'mount', payload: {} }), false);
    assert.equal(player.mounted, false);
    player.level = 5;
    assert.equal(engine.processIntent(id, { type: 'mount', payload: {} }), true);
    assert.equal(player.mounted, true);
  } finally { cleanup(id); }
});"""
new = """test('mounting is server-gated by progression, ownership and stable purchase', () => {
  const { id, player } = makePlayer();
  try {
    player.level = 4;
    assert.equal(engine.processIntent(id, { type: 'mount', payload: { action: 'toggle' } }), false);
    assert.equal(player.mounted, false);

    player.level = 5;
    // Level alone is no longer sufficient: 9.2 requires an owned selected mount.
    assert.equal(engine.processIntent(id, { type: 'mount', payload: { action: 'toggle' } }), false);
    assert.equal(player.mounted, false);

    const stable = contentDB.get('npcs').find(npc => npc.role === 'stablemaster' && npc.mapId === 'eldoria');
    assert.ok(stable);
    player.x = Number(stable.posX);
    player.y = Number(stable.posY);
    player.gold = 1000;
    assert.equal(engine.processIntent(id, { type: 'mount', payload: { action: 'buy', mountId: 'horse' } }), true);
    assert.equal(player.mountId, 'horse');
    assert.ok(player.gold < 1000);

    assert.equal(engine.processIntent(id, { type: 'mount', payload: { action: 'toggle' } }), true);
    assert.equal(player.mounted, true);
  } finally { cleanup(id); }
});"""
if old not in s:
    raise SystemExit('legacy mount test anchor missing')
hardening.write_text(s.replace(old, new, 1), encoding='utf-8')

print('9.2 legacy gates upgraded')
