from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# ---------------------------------------------------------------------
# Server: ContentDB spell overlays may now be authoritative buff spells.
# ---------------------------------------------------------------------
p = Path('server/engine/GameState.mjs')
s = p.read_text()

s = replace_once(s,
"const CONTENT_SPELL_TYPES = new Set(['attack', 'heal', 'aoe']);\n",
"const CONTENT_SPELL_TYPES = new Set(['attack', 'heal', 'aoe', 'buff']);\nconst CONTENT_BUFF_TYPES = new Set(['shield', 'haste', 'invisible', 'frenzy']);\n",
'allow dynamic buff spell types')

s = replace_once(s,
"      if (Number.isFinite(Number(raw.scalingCoeff))) next.scalingCoeff = boundedNumber(raw.scalingCoeff, 0, 20, 1);\n\n      if (matchIndex >= 0) merged[matchIndex] = next;\n",
"      if (Number.isFinite(Number(raw.scalingCoeff))) next.scalingCoeff = boundedNumber(raw.scalingCoeff, 0, 20, 1);\n      if (type === 'buff') {\n        const requestedBuffType = typeof raw.buffType === 'string' ? raw.buffType.trim().toLowerCase() : '';\n        next.buffType = CONTENT_BUFF_TYPES.has(requestedBuffType)\n          ? requestedBuffType\n          : (CONTENT_BUFF_TYPES.has(previous?.buffType) ? previous.buffType : 'shield');\n        next.buffDuration = Math.floor(boundedNumber(raw.buffDuration, 1000, 60_000, previous?.buffDuration ?? 8000));\n        next.buffValue = boundedNumber(raw.buffValue, 0, 100, previous?.buffValue ?? ({ shield: 25, haste: 35, invisible: 1, frenzy: 25 }[next.buffType]));\n      }\n\n      if (matchIndex >= 0) merged[matchIndex] = next;\n",
'dynamic buff spell semantics')

p.write_text(s)

# ---------------------------------------------------------------------
# Client: mirror the authoritative spell merge exactly for rendering/hotkeys.
# ---------------------------------------------------------------------
p = Path('src/components/GameScreen.tsx')
s = p.read_text()

s = replace_once(s,
"const SERVER_SPELL_TYPES: Spell['type'][] = ['attack', 'heal', 'aoe'];\n",
"const SERVER_SPELL_TYPES: Spell['type'][] = ['attack', 'heal', 'aoe', 'buff'];\nconst SERVER_BUFF_TYPES: NonNullable<Spell['buffType']>[] = ['shield', 'haste', 'invisible', 'frenzy'];\n",
'client accepts authoritative buffs')

s = replace_once(s,
"    if (Number.isFinite(Number(record.scalingCoeff))) next.scalingCoeff = finiteSpellNumber(record.scalingCoeff, 0, 20, 1);\n    if (matchIndex >= 0) merged[matchIndex] = next;\n",
"    if (Number.isFinite(Number(record.scalingCoeff))) next.scalingCoeff = finiteSpellNumber(record.scalingCoeff, 0, 20, 1);\n    if (type === 'buff') {\n      const requestedBuffType = typeof record.buffType === 'string'\n        ? record.buffType.trim().toLowerCase() as NonNullable<Spell['buffType']>\n        : undefined;\n      next.buffType = requestedBuffType && SERVER_BUFF_TYPES.includes(requestedBuffType)\n        ? requestedBuffType\n        : (previous?.buffType && SERVER_BUFF_TYPES.includes(previous.buffType) ? previous.buffType : 'shield');\n      next.buffDuration = Math.floor(finiteSpellNumber(record.buffDuration, 1000, 60_000, previous?.buffDuration ?? 8000));\n      const defaultBuffValue = next.buffType === 'haste' ? 35 : next.buffType === 'invisible' ? 1 : 25;\n      next.buffValue = finiteSpellNumber(record.buffValue, 0, 100, previous?.buffValue ?? defaultBuffValue);\n    }\n    if (matchIndex >= 0) merged[matchIndex] = next;\n",
'client mirrors buff spell semantics')

p.write_text(s)

# ---------------------------------------------------------------------
# Server Admin API: expose the fields needed to author a real buff spell.
# ---------------------------------------------------------------------
p = Path('server/server.js')
s = p.read_text()
s = replace_once(s,
"      spells: ['id','name','icon','mana','cooldown','damage','range','color','type','vocation','levelRequired'],\n",
"      spells: ['id','name','icon','mana','cooldown','damage','range','color','type','vocation','levelRequired','buffType','buffDuration','buffValue','scalingCoeff'],\n",
'admin spell buff fields')
p.write_text(s)

# ---------------------------------------------------------------------
# Admin UI: sensible spell defaults + datalist hints for spell/buff types.
# ---------------------------------------------------------------------
p = Path('server/adminPanel.mjs')
s = p.read_text()
s = replace_once(s,
"        ? (currentTab === 'monsters' ? { mapId: 'eldoria', count: 1, speed: 1200 } : {})\n",
"        ? (currentTab === 'monsters'\n          ? { mapId: 'eldoria', count: 1, speed: 1200 }\n          : currentTab === 'spells'\n            ? { type: 'attack', vocation: 'knight', levelRequired: 1, mana: 10, cooldown: 1500, damage: 10, range: 1 }\n            : {})\n",
'new spell defaults')
s = replace_once(s,
"        if (f === 'type' || f === 'rarity' || f === 'slot' || f === 'role' || f === 'biome' || f === 'vocation' || f === 'mapId') {\n",
"        if (f === 'type' || f === 'buffType' || f === 'rarity' || f === 'slot' || f === 'role' || f === 'biome' || f === 'vocation' || f === 'mapId') {\n",
'admin buff type selector')
s = replace_once(s,
"          html += '<datalist id=\"' + f + '_list\">' + (f==='rarity'?'<option>common<option>uncommon<option>rare<option>epic<option>legendary':'') + (f==='slot'?'<option>weapon<option>armor<option>helmet<option>legs<option>boots<option>shield<option>ring<option>amulet':'') + (f==='mapId'?'<option>eldoria<option>frostpeak<option>shadowfen<option>emberhold<option>voidlands':'') + '</datalist>';\n",
"          html += '<datalist id=\"' + f + '_list\">' + (f==='type' && currentTab==='spells'?'<option>attack<option>heal<option>aoe<option>buff':'') + (f==='buffType'?'<option>shield<option>haste<option>invisible<option>frenzy':'') + (f==='rarity'?'<option>common<option>uncommon<option>rare<option>epic<option>legendary':'') + (f==='slot'?'<option>weapon<option>armor<option>helmet<option>legs<option>boots<option>shield<option>ring<option>amulet':'') + (f==='mapId'?'<option>eldoria<option>frostpeak<option>shadowfen<option>emberhold<option>voidlands':'') + '</datalist>';\n",
'admin spell type hints')
p.write_text(s)

# ---------------------------------------------------------------------
# Regression: dynamic ContentDB buff is present, casts, and changes derived stats.
# ---------------------------------------------------------------------
p = Path('server/test/hardening.test.mjs')
s = p.read_text()
s = replace_once(s,
"      { id: 'bad_buff', name: 'Unsupported Buff', vocation: 'sorcerer', type: 'buff', mana: 0, cooldown: 500, damage: 0, range: 0 },\n",
"      { id: 'admin_shield', name: 'Admin Aegis', icon: '🛡', vocation: 'sorcerer', type: 'buff', buffType: 'shield', buffDuration: 4000, buffValue: 33, mana: 9, cooldown: 500, damage: 0, range: 0, color: '#66ccff', levelRequired: 1 },\n      { id: 'bad_summon', name: 'Unsupported Summon', vocation: 'sorcerer', type: 'summon', mana: 0, cooldown: 500, damage: 0, range: 0 },\n",
'dynamic buff test catalog')
s = replace_once(s,
"    assert.equal(spells.some(spell => spell.name === 'Unsupported Buff'), false);\n    const customIndex = spells.findIndex(spell => spell.contentSpellId === 'admin_heal');\n    assert.ok(customIndex >= 4);\n",
"    assert.equal(spells.some(spell => spell.name === 'Unsupported Summon'), false);\n    const customIndex = spells.findIndex(spell => spell.contentSpellId === 'admin_heal');\n    const buffIndex = spells.findIndex(spell => spell.contentSpellId === 'admin_shield');\n    assert.ok(customIndex >= 4);\n    assert.ok(buffIndex > customIndex);\n    assert.equal(spells[buffIndex].buffType, 'shield');\n    assert.equal(spells[buffIndex].buffDuration, 4000);\n    assert.equal(spells[buffIndex].buffValue, 33);\n",
'dynamic buff test catalog assertions')
s = replace_once(s,
"      assert.equal(player.stats.spellsCast, 1);\n",
"      assert.equal(player.stats.spellsCast, 1);\n      const reductionBeforeBuff = engine.computeDerivedStats(player).damageReduction;\n      const manaBeforeBuff = player.mana;\n      assert.equal(engine.processIntent(id, { type: 'cast', payload: { spellIndex: buffIndex } }), true);\n      assert.equal(player.mana, manaBeforeBuff - 9);\n      assert.ok(player.buffs.some(buff => buff.type === 'shield' && buff.value === 33 && buff.expiresAt > Date.now()));\n      assert.ok(engine.computeDerivedStats(player).damageReduction >= reductionBeforeBuff + 33);\n      assert.equal(player.stats.spellsCast, 2);\n",
'dynamic buff casts authoritatively')
p.write_text(s)

print('authoritative content buffs 4.2 applied')
