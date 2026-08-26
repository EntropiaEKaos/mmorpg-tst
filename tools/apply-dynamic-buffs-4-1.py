from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# Server dynamic spell catalog: include safe buff metadata.
p = Path('server/engine/GameState.mjs')
s = p.read_text()
s = replace_once(s,
"const CONTENT_SPELL_TYPES = new Set(['attack', 'heal', 'aoe']);",
"const CONTENT_SPELL_TYPES = new Set(['attack', 'heal', 'aoe', 'buff']);",
'server dynamic buff type')
s = replace_once(s,
"      if (Number.isFinite(Number(raw.scalingCoeff))) next.scalingCoeff = boundedNumber(raw.scalingCoeff, 0, 20, 1);\n\n      if (matchIndex >= 0) merged[matchIndex] = next;",
"      if (Number.isFinite(Number(raw.scalingCoeff))) next.scalingCoeff = boundedNumber(raw.scalingCoeff, 0, 20, 1);\n      if (type === 'buff') {\n        const validBuffTypes = new Set(['shield', 'haste', 'invisible', 'frenzy']);\n        const previousBuffType = validBuffTypes.has(previous?.buffType) ? previous.buffType : 'shield';\n        next.buffType = validBuffTypes.has(raw.buffType) ? raw.buffType : previousBuffType;\n        next.buffDuration = Math.floor(boundedNumber(raw.buffDuration, 1000, 60000, previous?.buffDuration ?? 8000));\n        next.buffValue = boundedNumber(raw.buffValue, 0, 100, previous?.buffValue ?? 25);\n      }\n\n      if (matchIndex >= 0) merged[matchIndex] = next;",
'server dynamic buff metadata')
p.write_text(s)

# Client mirrors the exact authoritative spell metadata for UI/hotkeys.
p = Path('src/components/GameScreen.tsx')
s = p.read_text()
s = replace_once(s,
"const SERVER_SPELL_TYPES: Spell['type'][] = ['attack', 'heal', 'aoe'];",
"const SERVER_SPELL_TYPES: Spell['type'][] = ['attack', 'heal', 'aoe', 'buff'];",
'client dynamic buff type')
s = replace_once(s,
"    if (Number.isFinite(Number(record.scalingCoeff))) next.scalingCoeff = finiteSpellNumber(record.scalingCoeff, 0, 20, 1);\n    if (matchIndex >= 0) merged[matchIndex] = next;",
"    if (Number.isFinite(Number(record.scalingCoeff))) next.scalingCoeff = finiteSpellNumber(record.scalingCoeff, 0, 20, 1);\n    if (type === 'buff') {\n      const validBuffTypes: NonNullable<Spell['buffType']>[] = ['shield', 'haste', 'invisible', 'frenzy'];\n      const rawBuffType = typeof record.buffType === 'string' && validBuffTypes.includes(record.buffType as NonNullable<Spell['buffType']>)\n        ? record.buffType as NonNullable<Spell['buffType']>\n        : (previous?.buffType || 'shield');\n      next.buffType = rawBuffType;\n      next.buffDuration = Math.floor(finiteSpellNumber(record.buffDuration, 1000, 60000, previous?.buffDuration ?? 8000));\n      next.buffValue = finiteSpellNumber(record.buffValue, 0, 100, previous?.buffValue ?? 25);\n    }\n    if (matchIndex >= 0) merged[matchIndex] = next;",
'client dynamic buff metadata')
p.write_text(s)

# Regression: content-created buff must survive catalog merge and execute as a buff.
p = Path('server/test/hardening.test.mjs')
s = p.read_text()
marker = "\ntest('successful authoritative attacks persist the selected target'"
block = r'''

test('authoritative content buff spells preserve metadata and execute without damage', () => {
  const originalCatalog = engine.contentSpells.map(spell => ({ ...spell }));
  const { id, player } = makePlayer('knight');
  const monsters = engine.monstersByMap.get(player.mapId);
  const dummy = {
    id: `content_buff_dummy_${Date.now()}_${Math.random()}`, name: 'Content Buff Dummy', emoji: '🎯',
    x: player.x + 1, y: player.y, spawnX: player.x + 1, spawnY: player.y,
    hp: 100, maxHp: 100, attack: 0, defense: 0, xp: 0, level: 1, type: 'normal',
    dead: false, lastAttack: 0, lastMove: 0, speed: 9999, respawnAt: 0,
  };
  monsters.push(dummy);
  try {
    engine.syncContentSpells([
      ...originalCatalog,
      { id: 'admin_guard', name: 'Admin Guard', icon: '🛡', vocation: 'knight', type: 'buff',
        mana: 5, cooldown: 500, damage: 0, range: 0, color: '#55aaff', levelRequired: 1,
        buffType: 'shield', buffDuration: 12000, buffValue: 37 },
    ]);
    const spells = engine.getSpellList('knight');
    const index = spells.findIndex(spell => spell.contentSpellId === 'admin_guard');
    assert.ok(index >= 4);
    assert.equal(spells[index].buffType, 'shield');
    assert.equal(spells[index].buffDuration, 12000);
    assert.equal(spells[index].buffValue, 37);

    player.level = 20;
    player.mana = 999;
    const beforeHp = dummy.hp;
    const beforeReduction = engine.computeDerivedStats(player).damageReduction;
    assert.equal(engine.processIntent(id, { type: 'cast', payload: { spellIndex: index } }), true);
    assert.equal(dummy.hp, beforeHp);
    assert.ok(player.buffs.some(buff => buff.name === 'Admin Guard' && buff.type === 'shield' && buff.value === 37));
    assert.ok(engine.computeDerivedStats(player).damageReduction >= beforeReduction + 37);
  } finally {
    const idx = monsters.indexOf(dummy);
    if (idx >= 0) monsters.splice(idx, 1);
    engine.syncContentSpells(originalCatalog);
    cleanup(id);
  }
});
'''
if block.strip() not in s:
    if marker not in s:
        raise SystemExit('pattern not found: dynamic buff test insertion')
    s = s.replace(marker, block + marker, 1)
p.write_text(s)

print('dynamic buff content 4.1 applied')
