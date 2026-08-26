from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# ---------------------------------------------------------------------
# Server: merge ContentDB spells over base vocation spell lists.
# ---------------------------------------------------------------------
p = Path('server/engine/GameState.mjs')
s = p.read_text()

s = replace_once(s,
'''function boundedNumber(value, min, max, fallback) {\n  const number = Number(value);\n  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;\n}\n\nclass GameEngine {\n''',
'''function boundedNumber(value, min, max, fallback) {\n  const number = Number(value);\n  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;\n}\n\nconst CONTENT_SPELL_TYPES = new Set(['attack', 'heal', 'aoe']);\n\nfunction spellSlug(value) {\n  return String(value || '').trim().toLowerCase()\n    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');\n}\n\nclass GameEngine {\n''', 'server spell helpers')

s = replace_once(s,
'''    this.contentItems = [];\n    this.tickCount = 0;\n''',
'''    this.contentItems = [];\n    this.contentSpells = [];\n    this.tickCount = 0;\n''', 'server spell catalog state')

s = replace_once(s,
'''  syncContentItems(itemContent = []) {\n    this.contentItems = Array.isArray(itemContent)\n      ? itemContent.filter(item => item && typeof item === 'object').map(item => ({ ...item }))\n      : [];\n  }\n\n  // Reconcile live monster overlays created in the server ContentDB.\n''',
'''  syncContentItems(itemContent = []) {\n    this.contentItems = Array.isArray(itemContent)\n      ? itemContent.filter(item => item && typeof item === 'object').map(item => ({ ...item }))\n      : [];\n  }\n\n  syncContentSpells(spellContent = []) {\n    this.contentSpells = Array.isArray(spellContent)\n      ? spellContent.filter(spell => spell && typeof spell === 'object').map(spell => ({ ...spell }))\n      : [];\n  }\n\n  getSpellList(vocationId) {\n    const vocation = VOCATIONS[vocationId];\n    if (!vocation) return [];\n    const merged = vocation.spells.map(spell => ({ ...spell }));\n\n    for (const raw of this.contentSpells) {\n      const rawVocation = typeof raw.vocation === 'string' ? raw.vocation.trim().toLowerCase() : '';\n      if (rawVocation !== vocationId) continue;\n      if (typeof raw.id !== 'string' || !raw.id.trim()) continue;\n      if (typeof raw.name !== 'string' || !raw.name.trim()) continue;\n      const type = typeof raw.type === 'string' ? raw.type.trim().toLowerCase() : '';\n      if (!CONTENT_SPELL_TYPES.has(type)) continue;\n\n      const id = raw.id.trim().slice(0, 100);\n      const name = raw.name.trim().slice(0, 100);\n      const matchIndex = merged.findIndex(spell => spellSlug(spell.name) === spellSlug(id) || spellSlug(spell.name) === spellSlug(name));\n      const previous = matchIndex >= 0 ? merged[matchIndex] : null;\n      const rawColor = typeof raw.color === 'string' ? raw.color : '';\n      const next = {\n        ...(previous || {}),\n        contentSpellId: id,\n        name,\n        icon: typeof raw.icon === 'string' && raw.icon ? raw.icon.slice(0, 8) : (previous?.icon || '✨'),\n        mana: Math.floor(boundedNumber(raw.mana, 0, 100_000, previous?.mana ?? 10)),\n        cooldown: Math.floor(boundedNumber(raw.cooldown, 250, 600_000, previous?.cooldown ?? 1500)),\n        damage: Math.floor(boundedNumber(raw.damage, 0, 10_000_000, previous?.damage ?? 0)),\n        range: boundedNumber(raw.range, 0, 20, previous?.range ?? 1),\n        color: /^#[0-9a-fA-F]{3,8}$/.test(rawColor) ? rawColor : (previous?.color || '#9bd4ff'),\n        type,\n        levelRequired: Math.floor(boundedNumber(raw.levelRequired, 1, 100_000, previous?.levelRequired ?? 1)),\n      };\n      if (Number.isFinite(Number(raw.scalingCoeff))) next.scalingCoeff = boundedNumber(raw.scalingCoeff, 0, 20, 1);\n\n      if (matchIndex >= 0) merged[matchIndex] = next;\n      else if (merged.length < 8) merged.push(next);\n    }\n    return merged;\n  }\n\n  // Reconcile live monster overlays created in the server ContentDB.\n''', 'server dynamic spell list')

s = replace_once(s,
'''    const voc = VOCATIONS[player.vocation];\n    if (!voc || !Number.isInteger(payload.spellIndex)) return false;\n    const spell = voc.spells[payload.spellIndex];\n''',
'''    const voc = VOCATIONS[player.vocation];\n    if (!voc || !Number.isInteger(payload.spellIndex)) return false;\n    const spell = this.getSpellList(player.vocation)[payload.spellIndex];\n''', 'authoritative cast uses dynamic spell list')

p.write_text(s)

# ---------------------------------------------------------------------
# Server boot/admin CRUD keeps the live spell catalog synchronized.
# ---------------------------------------------------------------------
p = Path('server/server.js')
s = p.read_text()

s = replace_once(s,
'''engine.syncContentItems(contentDB.get('items'));\nengine.syncContentMonsters(contentDB.get('monsters'));\n''',
'''engine.syncContentItems(contentDB.get('items'));\nengine.syncContentSpells(contentDB.get('spells'));\nengine.syncContentMonsters(contentDB.get('monsters'));\n''', 'server spell sync at boot')

s = replace_once(s,
'''      if (type === 'items') engine.syncContentItems(contentDB.get('items'));\n      if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n''',
'''      if (type === 'items') engine.syncContentItems(contentDB.get('items'));\n      if (type === 'spells') engine.syncContentSpells(contentDB.get('spells'));\n      if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n''', 'server spell sync after admin save')

s = replace_once(s,
'''    if (type === 'items') engine.syncContentItems(contentDB.get('items'));\n    if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n''',
'''    if (type === 'items') engine.syncContentItems(contentDB.get('items'));\n    if (type === 'spells') engine.syncContentSpells(contentDB.get('spells'));\n    if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n''', 'server spell sync after admin delete')

p.write_text(s)

# ---------------------------------------------------------------------
# Client: apply the same deterministic overlay ordering received via content_sync.
# ---------------------------------------------------------------------
p = Path('src/components/GameScreen.tsx')
s = p.read_text()

s = replace_once(s,
'''function serverQuestToClient(raw: any): Quest | null {\n''',
'''const SERVER_SPELL_TYPES: Spell['type'][] = ['attack', 'heal', 'aoe'];\n\nfunction spellContentSlug(value: unknown): string {\n  return String(value || '').trim().toLowerCase()\n    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');\n}\n\nfunction finiteSpellNumber(value: unknown, min: number, max: number, fallback: number): number {\n  const number = Number(value);\n  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;\n}\n\nfunction mergeServerSpells(vocationId: string, baseSpells: Spell[], content: unknown): Spell[] {\n  const merged = baseSpells.map((spell) => ({ ...spell }));\n  if (!Array.isArray(content)) return merged;\n\n  for (const raw of content) {\n    if (!raw || typeof raw !== 'object') continue;\n    const record = raw as Record<string, unknown>;\n    const rawVocation = typeof record.vocation === 'string' ? record.vocation.trim().toLowerCase() : '';\n    if (rawVocation !== vocationId) continue;\n    if (typeof record.id !== 'string' || !record.id.trim()) continue;\n    if (typeof record.name !== 'string' || !record.name.trim()) continue;\n    const type = typeof record.type === 'string' && SERVER_SPELL_TYPES.includes(record.type as Spell['type'])\n      ? record.type as Spell['type']\n      : null;\n    if (!type) continue;\n\n    const contentId = record.id.trim().slice(0, 100);\n    const name = record.name.trim().slice(0, 100);\n    const matchIndex = merged.findIndex((spell) =>\n      spellContentSlug(spell.name) === spellContentSlug(contentId) || spellContentSlug(spell.name) === spellContentSlug(name)\n    );\n    const previous = matchIndex >= 0 ? merged[matchIndex] : undefined;\n    const rawColor = typeof record.color === 'string' ? record.color : '';\n    const next: Spell = {\n      ...(previous || {} as Spell),\n      id: previous?.id || `server_${contentId}`,\n      name,\n      icon: typeof record.icon === 'string' && record.icon ? record.icon.slice(0, 8) : (previous?.icon || '✨'),\n      mana: Math.floor(finiteSpellNumber(record.mana, 0, 100_000, previous?.mana ?? 10)),\n      cooldown: Math.floor(finiteSpellNumber(record.cooldown, 250, 600_000, previous?.cooldown ?? 1500)),\n      damage: Math.floor(finiteSpellNumber(record.damage, 0, 10_000_000, previous?.damage ?? 0)),\n      range: finiteSpellNumber(record.range, 0, 20, previous?.range ?? 1),\n      lastCast: previous?.lastCast ?? 0,\n      color: /^#[0-9a-fA-F]{3,8}$/.test(rawColor) ? rawColor : (previous?.color || '#9bd4ff'),\n      type,\n      levelRequired: Math.floor(finiteSpellNumber(record.levelRequired, 1, 100_000, previous?.levelRequired ?? 1)),\n    };\n    if (Number.isFinite(Number(record.scalingCoeff))) next.scalingCoeff = finiteSpellNumber(record.scalingCoeff, 0, 20, 1);\n    if (matchIndex >= 0) merged[matchIndex] = next;\n    else if (merged.length < 8) merged.push(next);\n  }\n  return merged;\n}\n\nfunction serverQuestToClient(raw: any): Quest | null {\n''', 'client spell merge helpers')

s = replace_once(s,
'''            serverNpcCatalogRef.current = serverNpcs;\n            npcsRef.current = serverNpcs.filter((entry) => entry.mapId === currentMapIdRef.current).map((entry) => entry.npc);\n            addMessage('System', `📡 Server content synced: ${content.items?.length||0} items, ${content.monsters?.length||0} monsters, ${quests.length} quests, ${serverNpcs.length} NPCs`, '#9bd4ff', 'system');\n''',
'''            serverNpcCatalogRef.current = serverNpcs;\n            npcsRef.current = serverNpcs.filter((entry) => entry.mapId === currentMapIdRef.current).map((entry) => entry.npc);\n            const vocationId = account.vocation.toLowerCase();\n            const baseSpells = (VOCATIONS[vocationId] || VOCATIONS.knight).spells;\n            const syncedSpells = mergeServerSpells(vocationId, baseSpells, content.spells);\n            const previousSpells = spellsRef.current;\n            for (const spell of syncedSpells) {\n              const previous = previousSpells.find((candidate) => candidate.id === spell.id || spellContentSlug(candidate.name) === spellContentSlug(spell.name));\n              if (previous) spell.lastCast = previous.lastCast;\n            }\n            spellsRef.current = syncedSpells;\n            setSpells(syncedSpells);\n            addMessage('System', `📡 Server content synced: ${content.items?.length||0} items, ${content.monsters?.length||0} monsters, ${quests.length} quests, ${serverNpcs.length} NPCs, ${syncedSpells.length} spells`, '#9bd4ff', 'system');\n''', 'client content sync applies server spells')

s = replace_once(s,
'''      if (['1', '2', '3', '4'].includes(e.key)) {\n        e.preventDefault();\n        castSpell(parseInt(e.key) - 1);\n      }\n''',
'''      if (/^[1-8]$/.test(e.key)) {\n        e.preventDefault();\n        castSpell(parseInt(e.key, 10) - 1);\n      }\n''', 'spell hotkeys support appended spells')

p.write_text(s)

# ---------------------------------------------------------------------
# Regression tests: stable override and a custom spell executing in combat state.
# ---------------------------------------------------------------------
p = Path('server/test/hardening.test.mjs')
s = p.read_text()
marker = "test('authoritative content spells override base slots and execute custom spells'"
if marker not in s:
    s += r'''

test('authoritative content spells override base slots and execute custom spells', () => {
  const originalCatalog = contentDB.get('spells').map(spell => ({ ...spell }));
  try {
    engine.syncContentSpells([
      { id: 'fireball', name: 'Inferno Admin', icon: '🔥', vocation: 'sorcerer', type: 'attack', mana: 33, cooldown: 777, damage: 444, range: 6, color: '#ff2200', levelRequired: 5 },
      { id: 'admin_heal', name: 'Admin Mend', icon: '💚', vocation: 'sorcerer', type: 'heal', mana: 7, cooldown: 500, damage: 40, range: 0, color: '#22ff88', levelRequired: 1 },
      { id: 'bad_buff', name: 'Unsupported Buff', vocation: 'sorcerer', type: 'buff', mana: 0, cooldown: 500, damage: 0, range: 0 },
    ]);

    const spells = engine.getSpellList('sorcerer');
    assert.equal(spells[1].name, 'Inferno Admin');
    assert.equal(spells[1].damage, 444);
    assert.equal(spells.filter(spell => spell.contentSpellId === 'fireball').length, 1);
    assert.equal(spells.some(spell => spell.name === 'Unsupported Buff'), false);
    const customIndex = spells.findIndex(spell => spell.contentSpellId === 'admin_heal');
    assert.ok(customIndex >= 4);

    const { id, player } = makePlayer('sorcerer');
    try {
      player.level = 20;
      player.maxHp = 200;
      player.hp = 100;
      player.maxMana = 500;
      player.mana = 500;
      const manaBefore = player.mana;
      assert.equal(engine.processIntent(id, { type: 'cast', payload: { spellIndex: customIndex } }), true);
      assert.ok(player.hp > 100);
      assert.equal(player.mana, manaBefore - 7);
      assert.equal(player.stats.spellsCast, 1);
    } finally {
      cleanup(id);
    }
  } finally {
    engine.syncContentSpells(originalCatalog);
  }
});
'''

p.write_text(s)
print('authoritative spells 4.1 applied')
