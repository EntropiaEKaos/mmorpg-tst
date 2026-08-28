from pathlib import Path


def replace_or_confirm(text: str, old: str, new: str, marker: str) -> str:
    if marker in text:
        return text
    if old not in text:
        raise SystemExit(f'legacy test anchor not found: {marker}')
    return text.replace(old, new, 1)


foundation_path = Path('server/test/grand-capital-foundation-9-35.test.mjs')
foundation = foundation_path.read_text(encoding='utf-8')
old_foundation = """test('9.35A legacy maps stay 80x80 while a declared grand capital generates 160x160', () => {
  const world = new WorldManager();
  assert.equal(world.getMap('eldoria').width, MAP_WIDTH);
  assert.equal(world.getMap('eldoria').height, MAP_HEIGHT);
  world.syncContentMaps([capital()]);
"""
new_foundation = """test('9.35A legacy regions stay 80x80 while declared capitals can generate 160x160', () => {
  const world = new WorldManager();
  assert.equal(world.getMap('eldoria').width, 160);
  assert.equal(world.getMap('eldoria').height, 160);
  assert.equal(world.getMap('eldoria').settlementClass, 'capital');
  assert.equal(world.getMap('frostpeak').width, MAP_WIDTH);
  assert.equal(world.getMap('frostpeak').height, MAP_HEIGHT);
  assert.equal(world.getMap('shadowfen').width, MAP_WIDTH);
  assert.equal(world.getMap('shadowfen').height, MAP_HEIGHT);
  world.syncContentMaps([capital()]);
"""
foundation = replace_or_confirm(foundation, old_foundation, new_foundation, "legacy regions stay 80x80")
foundation_path.write_text(foundation, encoding='utf-8')

hardening_path = Path('server/test/hardening.test.mjs')
hardening = hardening_path.read_text(encoding='utf-8')
old_travel = """    player.x = 10; player.y = 40; player.level = 8;
    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'frostpeak', spawnX: 1, spawnY: 1 } }), true);
    assert.equal(player.mapId, 'frostpeak');
    assert.deepEqual({ x: player.x, y: player.y }, { x: 70, y: 40 });
"""
new_travel = """    const frostPortal = WORLD.getMap('eldoria').portals.find(portal => portal.targetMap === 'frostpeak');
    assert.ok(frostPortal);
    player.x = frostPortal.pos.x; player.y = frostPortal.pos.y; player.level = 8;
    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'frostpeak', spawnX: 1, spawnY: 1 } }), true);
    assert.equal(player.mapId, 'frostpeak');
    assert.deepEqual({ x: player.x, y: player.y }, frostPortal.targetSpawn);
"""
hardening = replace_or_confirm(hardening, old_travel, new_travel, "const frostPortal = WORLD.getMap('eldoria').portals.find")
old_portal_test = """test('server portal tiles are deterministic and walkable', () => {
  const map = WORLD.getMap('eldoria');
  assert.equal(map.tiles[40][10].type, 'path');
  assert.equal(map.tiles[40][10].walkable, true);
  assert.equal(map.portals.find(p => p.targetMap === 'frostpeak').targetSpawn.x, 70);
});
"""
new_portal_test = """test('server portal tiles are deterministic and walkable', () => {
  const map = WORLD.getMap('eldoria');
  const portal = map.portals.find(p => p.targetMap === 'frostpeak');
  assert.ok(portal);
  assert.equal(map.tiles[portal.pos.y][portal.pos.x].type, 'path');
  assert.equal(map.tiles[portal.pos.y][portal.pos.x].walkable, true);
  const destination = WORLD.getMap(portal.targetMap);
  assert.ok(destination);
  assert.equal(destination.tiles[portal.targetSpawn.y][portal.targetSpawn.x].walkable, true);
});
"""
hardening = replace_or_confirm(hardening, old_portal_test, new_portal_test, "destination.tiles[portal.targetSpawn.y][portal.targetSpawn.x].walkable")
hardening_path.write_text(hardening, encoding='utf-8')

print("Mor'ia 9.36A legacy capital contracts aligned")
