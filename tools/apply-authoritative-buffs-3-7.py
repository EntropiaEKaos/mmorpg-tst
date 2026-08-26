from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

p = Path('server/engine/GameState.mjs')
s = p.read_text()

s = replace_once(s,
"    const now = Date.now();\n    if (now - player.lastMove < 100) return false;\n",
"    const now = Date.now();\n    const activeBuffs = this.getActiveBuffs(player, now);\n    const haste = activeBuffs.find(buff => buff.type === 'haste');\n    const hasteValue = haste ? boundedNumber(haste.value, 0, 50, 35) : 0;\n    const moveCooldown = Math.max(50, Math.floor(100 * (1 - hasteValue / 100)));\n    if (now - player.lastMove < moveCooldown) return false;\n",
'haste movement cooldown')

s = replace_once(s,
"  // ===== DERIVED STATS (equipment + passive talents) =====\n  computeDerivedStats(player) {\n",
"  getActiveBuffs(player, now = Date.now()) {\n    const buffs = Array.isArray(player.buffs) ? player.buffs : [];\n    const active = buffs.filter(buff => buff && typeof buff === 'object' && Number(buff.expiresAt) > now);\n    if (active.length !== buffs.length) player.buffs = active;\n    return active;\n  }\n\n  // ===== DERIVED STATS (equipment + passive talents + active buffs) =====\n  computeDerivedStats(player) {\n",
'active buff helper')

s = replace_once(s,
"    if (player.vocation === 'rogue' || player.vocation === 'berserker') stats.critChance += 10;\n    if (player.vocation === 'knight' || player.vocation === 'templar') stats.damageReduction += 5;\n\n    stats.critChance = Math.max(0, Math.min(100, stats.critChance));\n",
"    if (player.vocation === 'rogue' || player.vocation === 'berserker') stats.critChance += 10;\n    if (player.vocation === 'knight' || player.vocation === 'templar') stats.damageReduction += 5;\n\n    for (const buff of this.getActiveBuffs(player)) {\n      if (buff.type === 'shield') stats.damageReduction += boundedNumber(buff.value, 0, 80, 25);\n      else if (buff.type === 'frenzy') stats.totalAttack *= 1 + boundedNumber(buff.value, 0, 100, 25) / 100;\n      else if (buff.type === 'haste') stats.moveSpeed += boundedNumber(buff.value, 0, 100, 35);\n    }\n    stats.totalAttack = Math.max(0, Math.floor(stats.totalAttack));\n    stats.critChance = Math.max(0, Math.min(100, stats.critChance));\n",
'apply active buffs to derived stats')

s = replace_once(s,
"    if (spell.type === 'heal' && spell.damage > 0) {\n",
"    if (spell.type === 'buff') {\n      const validBuffs = new Set(['shield', 'haste', 'invisible', 'frenzy']);\n      const buffType = validBuffs.has(spell.buffType) ? spell.buffType : 'shield';\n      const defaults = { shield: 25, haste: 35, invisible: 1, frenzy: 25 };\n      const duration = Math.floor(boundedNumber(spell.buffDuration, 1000, 60000, 8000));\n      const value = boundedNumber(spell.buffValue, 0, 100, defaults[buffType]);\n      player.buffs = this.getActiveBuffs(player, now).filter(buff => buff.type !== buffType);\n      player.buffs.push({\n        id: `${buffType}_${now}`, type: buffType, name: spell.name, value,\n        startTime: now, expiresAt: now + duration,\n      });\n      this.emitEvent(player.mapId, { kind: 'buff', targetId: player.id, text: spell.name, color: spell.color, pos: { x: player.x, y: player.y } });\n    } else if (spell.type === 'heal' && spell.damage > 0) {\n",
'authoritative buff casting')

s = replace_once(s,
"      let nearest = null, minDist = 8;\n      for (const p of players) { const d = Math.abs(p.x - m.x) + Math.abs(p.y - m.y); if (d < minDist) { minDist = d; nearest = p; } }\n",
"      let nearest = null, minDist = 8;\n      for (const p of players) {\n        if (this.getActiveBuffs(p, now).some(buff => buff.type === 'invisible')) continue;\n        const d = Math.abs(p.x - m.x) + Math.abs(p.y - m.y);\n        if (d < minDist) { minDist = d; nearest = p; }\n      }\n",
'invisibility monster targeting')

p.write_text(s)

# Add regression coverage to the authoritative server suite.
p = Path('server/test/hardening.test.mjs')
s = p.read_text()
marker = "\ntest('successful authoritative attacks persist the selected target'"
block = r'''

test('authoritative buff spells apply effects without damaging monsters', () => {
  const { id, player } = makePlayer('knight');
  const monsters = engine.monstersByMap.get(player.mapId);
  const dummy = {
    id: `buff_dummy_${Date.now()}_${Math.random()}`, name: 'Buff Dummy', emoji: '🎯',
    x: player.x + 1, y: player.y, spawnX: player.x + 1, spawnY: player.y,
    hp: 100, maxHp: 100, attack: 0, defense: 0, xp: 0, level: 1, type: 'normal',
    dead: false, lastAttack: 0, lastMove: 0, speed: 9999, respawnAt: 0,
  };
  monsters.push(dummy);
  try {
    player.level = 20;
    player.mana = 999;
    const beforeHp = dummy.hp;
    const beforeReduction = engine.computeDerivedStats(player).damageReduction;
    assert.equal(engine.processIntent(id, { type: 'cast', payload: { spellIndex: 3 } }), true);
    assert.equal(dummy.hp, beforeHp);
    assert.ok(player.buffs.some(buff => buff.type === 'shield' && buff.expiresAt > Date.now()));
    assert.ok(engine.computeDerivedStats(player).damageReduction > beforeReduction);
  } finally {
    const idx = monsters.indexOf(dummy);
    if (idx >= 0) monsters.splice(idx, 1);
    cleanup(id);
  }
});
'''
if block.strip() not in s:
    if marker not in s:
        raise SystemExit('pattern not found: buff test insertion marker')
    s = s.replace(marker, block + marker, 1)
p.write_text(s)

print('authoritative buffs 3.7 applied')
