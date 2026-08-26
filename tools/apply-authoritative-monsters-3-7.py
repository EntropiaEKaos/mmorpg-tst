from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# ---------------------------------------------------------------------
# GameEngine: reconcile server-owned monster overlays into live maps.
# ---------------------------------------------------------------------
p = Path('server/engine/GameState.mjs')
s = p.read_text()

s = replace_once(s,
'''function safePayload(payload) {\n  return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};\n}\n\nclass GameEngine {\n''',
'''function safePayload(payload) {\n  return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};\n}\n\nfunction boundedNumber(value, min, max, fallback) {\n  const number = Number(value);\n  return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;\n}\n\nclass GameEngine {\n''', 'bounded monster number helper')

s = replace_once(s,
'''  getPlayersOnMap(mapId) {\n    const result = [];\n    for (const p of this.players.values()) if (p.mapId === mapId) result.push(p);\n    return result;\n  }\n\n  // ===== INTENT PROCESSING =====\n''',
'''  getPlayersOnMap(mapId) {\n    const result = [];\n    for (const p of this.players.values()) if (p.mapId === mapId) result.push(p);\n    return result;\n  }\n\n  // Reconcile live monster overlays created in the server ContentDB.\n  // Baseline WORLD spawns are preserved; only monsters carrying contentSourceId\n  // are replaced when admin content changes. A mapId is intentionally required\n  // so catalog-only templates cannot accidentally flood Eldoria.\n  syncContentMonsters(monsterContent = []) {\n    const catalog = Array.isArray(monsterContent) ? monsterContent : [];\n    for (const mapId of WORLD.getMapIds()) {\n      const map = WORLD.getMap(mapId);\n      if (!map) continue;\n\n      const baseline = (this.monstersByMap.get(mapId) || []).filter(monster => !monster.contentSourceId);\n      const occupied = new Set(\n        baseline.filter(monster => !monster.dead).map(monster => `${monster.x},${monster.y}`)\n      );\n      const overlays = [];\n      const seenContentIds = new Set();\n\n      for (const template of catalog) {\n        if (!template || typeof template !== 'object' || template.mapId !== mapId) continue;\n        if (typeof template.id !== 'string' || !template.id.trim()) continue;\n        const sourceId = template.id.trim().slice(0, 100);\n        if (seenContentIds.has(sourceId)) continue;\n        seenContentIds.add(sourceId);\n\n        const count = Math.floor(boundedNumber(template.count, 1, 25, 1));\n        const explicitX = Number(template.posX);\n        const explicitY = Number(template.posY);\n        const hasExplicitSpawn = Number.isInteger(explicitX) && Number.isInteger(explicitY)\n          && explicitX >= 0 && explicitX < map.width && explicitY >= 0 && explicitY < map.height\n          && Boolean(map.tiles?.[explicitY]?.[explicitX]?.walkable);\n\n        for (let index = 0; index < count; index++) {\n          let pos = null;\n          if (index === 0 && hasExplicitSpawn && !occupied.has(`${explicitX},${explicitY}`)) {\n            pos = { x: explicitX, y: explicitY };\n          }\n          if (!pos) {\n            for (let attempt = 0; attempt < 300; attempt++) {\n              const candidate = WORLD.findWalkableSpawn(map);\n              if (!occupied.has(`${candidate.x},${candidate.y}`)) { pos = candidate; break; }\n            }\n          }\n          if (!pos) continue;\n          occupied.add(`${pos.x},${pos.y}`);\n\n          const hp = Math.floor(boundedNumber(template.hp, 1, 10_000_000, 20));\n          const rawType = typeof template.type === 'string' ? template.type.toLowerCase() : 'normal';\n          const type = ['normal', 'elite', 'boss'].includes(rawType) ? rawType : 'normal';\n          const rawColor = typeof template.color === 'string' ? template.color : '';\n          overlays.push({\n            id: `content_${mapId}_${sourceId}_${index}`,\n            contentSourceId: sourceId,\n            name: typeof template.name === 'string' && template.name.trim() ? template.name.trim().slice(0, 80) : sourceId,\n            emoji: typeof template.emoji === 'string' && template.emoji ? template.emoji.slice(0, 8) : '👹',\n            x: pos.x, y: pos.y, spawnX: pos.x, spawnY: pos.y,\n            hp, maxHp: hp,\n            attack: Math.floor(boundedNumber(template.attack, 0, 1_000_000, 4)),\n            defense: Math.floor(boundedNumber(template.defense, 0, 1_000_000, 1)),\n            xp: Math.floor(boundedNumber(template.xp, 0, 100_000_000, 10)),\n            level: Math.floor(boundedNumber(template.level, 1, 100_000, 1)),\n            color: /^#[0-9a-fA-F]{3,8}$/.test(rawColor) ? rawColor : '#8b6f47',\n            size: boundedNumber(template.size, 0.4, 4, 1),\n            type,\n            dead: false, respawnAt: 0, lastMove: 0, lastAttack: 0,\n            speed: Math.floor(boundedNumber(template.speed, 200, 10_000, 1200)),\n            goldMin: Math.floor(boundedNumber(template.goldMin, 0, 100_000_000, 0)),\n            goldMax: Math.floor(boundedNumber(template.goldMax, 0, 100_000_000, 0)),\n          });\n        }\n      }\n\n      this.monstersByMap.set(mapId, [...baseline, ...overlays]);\n    }\n  }\n\n  // ===== INTENT PROCESSING =====\n''', 'content monster reconciliation')

p.write_text(s)

# ---------------------------------------------------------------------
# Server boot/admin CRUD: reconcile live monsters whenever content changes.
# ---------------------------------------------------------------------
p = Path('server/server.js')
s = p.read_text()

s = replace_once(s,
'''const TRUST_PROXY = /^(1|true|yes)$/i.test(String(process.env.TRUST_PROXY || ''));\n\nconst MIME = {\n''',
'''const TRUST_PROXY = /^(1|true|yes)$/i.test(String(process.env.TRUST_PROXY || ''));\n\n// ContentDB is persistent; reconcile explicitly placed monster records into the\n// already-initialized authoritative world at server boot.\nengine.syncContentMonsters(contentDB.get('monsters'));\n\nconst MIME = {\n''', 'initial server monster content sync')

s = replace_once(s,
'''      monsters: ['id','name','emoji','hp','attack','defense','xp','level','type','color','size','goldMin','goldMax'],\n''',
'''      monsters: ['id','name','emoji','hp','attack','defense','xp','level','type','color','size','goldMin','goldMax','mapId','count','posX','posY','speed'],\n''', 'monster admin live fields')

s = replace_once(s,
'''      if (existing) contentDB.update(type, data.id, data);\n      else contentDB.add(type, data);\n      broadcastContentUpdate();\n''',
'''      if (existing) contentDB.update(type, data.id, data);\n      else contentDB.add(type, data);\n      if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n      broadcastContentUpdate();\n''', 'monster reconcile after admin save')

s = replace_once(s,
'''    contentDB.remove(type, id);\n    broadcastContentUpdate();\n''',
'''    contentDB.remove(type, id);\n    if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n    broadcastContentUpdate();\n''', 'monster reconcile after admin delete')

p.write_text(s)

# ---------------------------------------------------------------------
# Admin UI: make a newly-created monster live by default and assist map choice.
# ---------------------------------------------------------------------
p = Path('server/adminPanel.mjs')
s = p.read_text()

s = replace_once(s,
'''      const item = editing === 'new' ? {} : items.find(i => i.id === editing) || {};\n''',
'''      const item = editing === 'new'\n        ? (currentTab === 'monsters' ? { mapId: 'eldoria', count: 1, speed: 1200 } : {})\n        : items.find(i => i.id === editing) || {};\n''', 'new live monster defaults')

s = replace_once(s,
'''        if (f === 'type' || f === 'rarity' || f === 'slot' || f === 'role' || f === 'biome' || f === 'vocation') {\n''',
'''        if (f === 'type' || f === 'rarity' || f === 'slot' || f === 'role' || f === 'biome' || f === 'vocation' || f === 'mapId') {\n''', 'map selector field')

s = replace_once(s,
'''          html += '<datalist id="' + f + '_list">' + (f==='rarity'?'<option>common<option>uncommon<option>rare<option>epic<option>legendary':'') + (f==='slot'?'<option>weapon<option>armor<option>helmet<option>legs<option>boots<option>shield<option>ring<option>amulet':'') + '</datalist>';\n''',
'''          html += '<datalist id="' + f + '_list">' + (f==='rarity'?'<option>common<option>uncommon<option>rare<option>epic<option>legendary':'') + (f==='slot'?'<option>weapon<option>armor<option>helmet<option>legs<option>boots<option>shield<option>ring<option>amulet':'') + (f==='mapId'?'<option>eldoria<option>frostpeak<option>shadowfen<option>emberhold<option>voidlands':'') + '</datalist>';\n''', 'map selector values')

p.write_text(s)

# ---------------------------------------------------------------------
# Regression test: content overlay is live, combat-capable, and removable.
# ---------------------------------------------------------------------
p = Path('server/test/hardening.test.mjs')
s = p.read_text()
marker = "test('authoritative content monsters spawn, fight and reconcile cleanly'"
if marker not in s:
    s += r'''

test('authoritative content monsters spawn, fight and reconcile cleanly', () => {
  const mapId = 'eldoria';
  const map = WORLD.getMap(mapId);
  const originalCatalog = contentDB.get('monsters').map(monster => ({ ...monster }));
  const baseline = (engine.monstersByMap.get(mapId) || []).filter(monster => !monster.contentSourceId);
  let spawn = null;
  for (let attempt = 0; attempt < 300 && !spawn; attempt++) {
    const candidate = WORLD.findWalkableSpawn(map);
    if (!baseline.some(monster => !monster.dead && monster.x === candidate.x && monster.y === candidate.y)) spawn = candidate;
  }
  assert.ok(spawn);

  const sourceId = `admin_live_${Date.now()}_${Math.random()}`;
  engine.syncContentMonsters([{
    id: sourceId, name: 'Admin Live Beast', emoji: '🧪', mapId,
    posX: spawn.x, posY: spawn.y, count: 1,
    hp: 25, attack: 3, defense: 0, xp: 7, level: 2,
    type: 'elite', color: '#abcdef', size: 1.1, speed: 900,
  }]);

  const live = (engine.monstersByMap.get(mapId) || []).find(monster => monster.contentSourceId === sourceId);
  assert.ok(live);
  assert.equal(live.name, 'Admin Live Beast');
  assert.equal(live.x, spawn.x);
  assert.equal(live.y, spawn.y);
  assert.equal(live.type, 'elite');

  const { id, player } = makePlayer();
  try {
    player.x = Math.max(1, live.x - 1);
    player.y = live.y;
    player.attack = 9999;
    player.lastAttack = 0;
    live.hp = 1;
    assert.equal(engine.processIntent(id, { type: 'attack', payload: { monsterId: live.id } }), true);
    assert.equal(live.dead, true);
    assert.ok(live.respawnAt > Date.now());
  } finally {
    cleanup(id);
    engine.syncContentMonsters(originalCatalog);
  }

  assert.equal((engine.monstersByMap.get(mapId) || []).some(monster => monster.contentSourceId === sourceId), false);
});
'''

p.write_text(s)
print('authoritative monsters 3.7 applied')
