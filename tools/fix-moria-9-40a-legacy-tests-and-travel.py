from pathlib import Path


def patch(path, old, new, label):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if new in text:
        return
    if old not in text:
        raise SystemExit(f'{label} anchor missing in {path}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')

# 9.35/9.36/9.37 are historical contracts. Their intent is to prove that a still-unpromoted
# built-in remains on the legacy 80x80 default, not to freeze Shadowfen forever.
patch(
    'server/test/grand-capital-foundation-9-35.test.mjs',
    "  assert.equal(world.getMap('shadowfen').width, MAP_WIDTH);\n  assert.equal(world.getMap('shadowfen').height, MAP_HEIGHT);",
    "  assert.equal(world.getMap('emberhold').width, MAP_WIDTH);\n  assert.equal(world.getMap('emberhold').height, MAP_HEIGHT);",
    '9.35 legacy-size sentinel',
)

patch(
    'server/test/grand-eldoria-9-36.test.mjs',
    "  const shadowfen = world.getMap('shadowfen');\n  assert.equal(eldoria.width,160); assert.equal(eldoria.height,160); assert.equal(eldoria.settlementClass,'capital');\n  assert.equal(shadowfen.width,80); assert.equal(shadowfen.height,80);",
    "  const emberhold = world.getMap('emberhold');\n  assert.equal(eldoria.width,160); assert.equal(eldoria.height,160); assert.equal(eldoria.settlementClass,'capital');\n  assert.equal(emberhold.width,80); assert.equal(emberhold.height,80);",
    '9.36 legacy-size sentinel',
)

patch(
    'server/test/grand-sunreach-9-37.test.mjs',
    "  assert.equal(world.getMap('shadowfen').width,80);",
    "  assert.equal(world.getMap('emberhold').width,80);",
    '9.37 legacy-size sentinel',
)

# Frostpeak owns historical schema 5. Later capital releases are allowed to advance the global marker.
patch(
    'server/test/grand-frostpeak-9-39.test.mjs',
    "assert.equal(data.version,3);assert.equal(data.grandCapitalVersion,GRAND_CAPITAL_SCHEMA_VERSION);",
    "assert.equal(data.version,3);assert.ok(data.grandCapitalVersion>=GRAND_CAPITAL_SCHEMA_VERSION);",
    '9.39 historical schema floor',
)

# Keep the security invariant: travel still requires the real authoritative portal and destination level.
# Shadowfen's Voidlands portal moved from the legacy 10,10 coordinate to the west marsh gate.
patch(
    'server/test/hardening.test.mjs',
    "    player.mapId = 'shadowfen'; player.x = 10; player.y = 10; player.level = 24;\n    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'voidlands' } }), false);\n    player.level = 25;\n    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'voidlands' } }), true);\n    assert.deepEqual({ x: player.x, y: player.y }, { x: 70, y: 70 });",
    "    const voidPortal = WORLD.getMap('shadowfen').portals.find(portal => portal.targetMap === 'voidlands');\n    assert.ok(voidPortal);\n    player.mapId = 'shadowfen'; player.x = voidPortal.pos.x; player.y = voidPortal.pos.y; player.level = 24;\n    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'voidlands' } }), false);\n    assert.equal(player.mapId, 'shadowfen');\n    player.level = 25;\n    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'voidlands' } }), true);\n    assert.deepEqual({ x: player.x, y: player.y }, voidPortal.targetSpawn);",
    'hardening Shadowfen portal position',
)
