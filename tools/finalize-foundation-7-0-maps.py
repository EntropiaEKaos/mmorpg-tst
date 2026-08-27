from pathlib import Path

path = Path('server/test/hardening.test.mjs')
text = path.read_text(encoding='utf-8')
old = "    player.x = 10; player.y = 40;\n    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'frostpeak', spawnX: 1, spawnY: 1 } }), true);"
new = "    player.x = 10; player.y = 40; player.level = 8;\n    assert.equal(engine.processIntent(id, { type: 'travel', payload: { targetMap: 'frostpeak', spawnX: 1, spawnY: 1 } }), true);"
if text.count(old) != 1:
    raise SystemExit(f'expected one frostpeak travel fixture, found {text.count(old)}')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
print('Foundation 7.0 map fixtures finalized')
