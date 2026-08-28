from pathlib import Path

ROOT=Path('.')

def replace_once(path, old, new, label):
    p=ROOT/path
    text=p.read_text(encoding='utf-8')
    if new in text:
        return
    if old not in text:
        raise SystemExit(f'{label} anchor missing in {path}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

# 9.35's invariant is about unpromoted maps retaining legacy dimensions, not
# freezing Frostpeak forever. Frostpeak is now explicitly promoted in 9.39.
replace_once('server/test/grand-capital-foundation-9-35.test.mjs',
"test('9.35A legacy regions stay 80x80 while declared capitals can generate 160x160', () => {\n  const world = new WorldManager();\n  assert.equal(world.getMap('eldoria').width, 160);\n  assert.equal(world.getMap('eldoria').height, 160);\n  assert.equal(world.getMap('eldoria').settlementClass, 'capital');\n  assert.equal(world.getMap('frostpeak').width, MAP_WIDTH);\n  assert.equal(world.getMap('frostpeak').height, MAP_HEIGHT);\n  assert.equal(world.getMap('shadowfen').width, MAP_WIDTH);\n  assert.equal(world.getMap('shadowfen').height, MAP_HEIGHT);",
"test('9.35A unpromoted regions stay 80x80 while declared capitals can generate 160x160', () => {\n  const world = new WorldManager();\n  assert.equal(world.getMap('eldoria').width, 160);\n  assert.equal(world.getMap('eldoria').height, 160);\n  assert.equal(world.getMap('eldoria').settlementClass, 'capital');\n  assert.equal(world.getMap('frostpeak').width, 160);\n  assert.equal(world.getMap('frostpeak').height, 160);\n  assert.equal(world.getMap('frostpeak').settlementClass, 'capital');\n  assert.equal(world.getMap('shadowfen').width, MAP_WIDTH);\n  assert.equal(world.getMap('shadowfen').height, MAP_HEIGHT);",
'9.35 promoted capital expectation')

# 9.36 keeps proving Eldoria's authored identity while an actually unpromoted
# launch region remains at the old size.
replace_once('server/test/grand-eldoria-9-36.test.mjs',
"test('9.36A Grand Eldoria is a 160x160 authored capital while other built-ins remain legacy-sized', () => {\n  const world = new WorldManager();\n  const eldoria = world.getMap('eldoria');\n  const frostpeak = world.getMap('frostpeak');\n  assert.equal(eldoria.width,160); assert.equal(eldoria.height,160); assert.equal(eldoria.settlementClass,'capital');\n  assert.equal(frostpeak.width,80); assert.equal(frostpeak.height,80);",
"test('9.36A Grand Eldoria stays a 160x160 authored capital while unpromoted built-ins remain legacy-sized', () => {\n  const world = new WorldManager();\n  const eldoria = world.getMap('eldoria');\n  const shadowfen = world.getMap('shadowfen');\n  assert.equal(eldoria.width,160); assert.equal(eldoria.height,160); assert.equal(eldoria.settlementClass,'capital');\n  assert.equal(shadowfen.width,80); assert.equal(shadowfen.height,80);",
'9.36 legacy-size expectation')

# 9.37 verifies Sunreach remains distinct and leaves the legacy-size sentinel on
# Shadowfen, which has not yet been promoted.
replace_once('server/test/grand-sunreach-9-37.test.mjs',
"  assert.equal(world.getMap('eldoria').urbanPlan,'royal-grid');\n  assert.equal(world.getMap('frostpeak').width,80);",
"  assert.equal(world.getMap('eldoria').urbanPlan,'royal-grid');\n  assert.equal(world.getMap('shadowfen').width,80);",
'9.37 legacy-size sentinel')

# Historical schema constants remain historically meaningful. A fresh current DB
# is allowed to be newer than Ironwood's schema 4, but never older.
replace_once('server/test/grand-ironwood-9-38.test.mjs',
"test('9.38A fresh ContentDB converges Road-to-10 and all three grand-capital migrations', () => {",
"test('9.38A fresh ContentDB converges Road-to-10 and at least the Ironwood grand-capital schema', () => {",
'9.38 marker title')
replace_once('server/test/grand-ironwood-9-38.test.mjs',
"    assert.equal(data.grandCapitalVersion, GRAND_CAPITAL_SCHEMA_VERSION);",
"    assert.ok(data.grandCapitalVersion >= GRAND_CAPITAL_SCHEMA_VERSION);",
'9.38 marker lower bound')

# Frostpeak is a level-15 region in authoritative AlphaContent. Exercise both
# sides of the gate rather than preserving the obsolete level-8 expectation.
replace_once('server/test/hardening.test.mjs',
"    player.x = frostPortal.pos.x; player.y = frostPortal.pos.y; player.level = 8;\n    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'frostpeak', spawnX: 1, spawnY: 1 } }), true);\n    assert.equal(player.mapId, 'frostpeak');",
"    player.x = frostPortal.pos.x; player.y = frostPortal.pos.y; player.level = 14;\n    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'frostpeak', spawnX: 1, spawnY: 1 } }), false);\n    assert.equal(player.mapId, 'eldoria');\n    player.level = 15;\n    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'frostpeak', spawnX: 1, spawnY: 1 } }), true);\n    assert.equal(player.mapId, 'frostpeak');",
'hardening Frostpeak level gate')

print("Mor'ia 9.39A legacy tests and Frostpeak travel gate aligned")
