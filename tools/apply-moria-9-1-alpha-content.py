from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'{label} anchor missing')
    return text.replace(old, new, 1)

# ------------------------------------------------------------------
# ContentDB: seed the alpha pack and persist GM roster as content.
# ------------------------------------------------------------------
p = 'server/engine/ContentDB.mjs'
s = read(p)
s = replace_once(s, "import { fileURLToPath } from 'url';", "import { fileURLToPath } from 'url';\nimport { ALPHA_CONTENT } from './AlphaContent.mjs';", 'ContentDB import')
s = replace_once(s,
    "const COLLECTION_KEYS = Object.freeze(['items', 'monsters', 'npcs', 'quests', 'spells', 'maps', 'worldEvents', 'shops', 'lootTables']);",
    "const COLLECTION_KEYS = Object.freeze(['items', 'monsters', 'npcs', 'quests', 'spells', 'maps', 'worldEvents', 'shops', 'lootTables', 'gmRoster']);", 'ContentDB keys')
s = replace_once(s, "    worldEvents: [], shops: [], lootTables: [],", "    worldEvents: [], shops: [], lootTables: [], gmRoster: [],", 'ContentDB empty')
s = replace_once(s, "function dedupeById(records) {\n  const byId = new Map();\n  for (const record of records) {\n    if (typeof record.id !== 'string' || !record.id) continue;\n    byId.set(record.id, record);\n  }\n  return Array.from(byId.values());\n}",
"function dedupeById(records) {\n  const byId = new Map();\n  for (const record of records) {\n    if (typeof record.id !== 'string' || !record.id) continue;\n    byId.set(record.id, record);\n  }\n  return Array.from(byId.values());\n}\n\nfunction mergeById(base, additions) {\n  const byId = new Map((Array.isArray(base) ? base : []).map(entry => [entry.id, { ...entry }]));\n  for (const entry of Array.isArray(additions) ? additions : []) {\n    if (!entry || typeof entry.id !== 'string' || !entry.id) continue;\n    byId.set(entry.id, { ...(byId.get(entry.id) || {}), ...entry });\n  }\n  return Array.from(byId.values());\n}", 'ContentDB merge helper')
s = replace_once(s, "    this.save();\n  }\n\n  // ===== CRUD for all content types =====",
"    // Alpha pack overlays the compact legacy defaults. This fixes old partial map\n    // records and gives fresh deployments a launch-sized content baseline.\n    this.data.items = mergeById(this.data.items, ALPHA_CONTENT.items);\n    this.data.monsters = mergeById(this.data.monsters, ALPHA_CONTENT.monsters);\n    this.data.npcs = mergeById(this.data.npcs, ALPHA_CONTENT.npcs);\n    this.data.quests = mergeById(this.data.quests, ALPHA_CONTENT.quests);\n    this.data.spells = mergeById(this.data.spells, ALPHA_CONTENT.spells);\n    this.data.maps = mergeById(this.data.maps, ALPHA_CONTENT.maps);\n    this.data.worldEvents = mergeById(this.data.worldEvents, ALPHA_CONTENT.events);\n    this.data.shops = mergeById(this.data.shops, ALPHA_CONTENT.shops);\n    this.data.lootTables = mergeById(this.data.lootTables, ALPHA_CONTENT.lootTables);\n    this.data.gmRoster = mergeById(this.data.gmRoster, ALPHA_CONTENT.gmRoster);\n    this.data.version = 2;\n\n    this.save();\n  }\n\n  // ===== CRUD for all content types =====", 'ContentDB seed merge')
write(p, s)

# ------------------------------------------------------------------
# Content Studio: every new alpha catalog is editable.
# ------------------------------------------------------------------
p = 'server/engine/ContentStudio.mjs'
s = read(p)
s = replace_once(s,
"const ITEM_SLOTS = Object.freeze(['weapon', 'armor', 'helmet', 'legs', 'boots', 'shield', 'ring', 'amulet']);",
"const ITEM_SLOTS = Object.freeze(['weapon', 'armor', 'helmet', 'legs', 'boots', 'shield', 'ring', 'ring2', 'amulet', 'cloak', 'belt', 'gloves', 'relic']);\nconst MAP_ACCESS = Object.freeze(['public', 'gm']);\nconst EVENT_TYPES = Object.freeze(['invasion', 'boss', 'hunt', 'defense']);", 'Studio slots')
s = replace_once(s,
"    field('mapId', 'Runtime map', 'select', { optionKey: 'maps', allowEmpty: true }), field('count', 'Spawn count', 'number'),\n    field('posX', 'Spawn X', 'number'), field('posY', 'Spawn Y', 'number'), field('speed', 'Move delay', 'number'),",
"    field('mapId', 'Runtime map', 'select', { optionKey: 'maps', allowEmpty: true }), field('count', 'Spawn count', 'number'),\n    field('posX', 'Spawn X', 'number'), field('posY', 'Spawn Y', 'number'), field('speed', 'Move delay', 'number'),\n    field('lootTableId', 'Loot table', 'select', { optionKey: 'lootTables', allowEmpty: true }),", 'Studio monster loot')
s = replace_once(s,
"    field('rewardGold', 'Reward gold', 'number'), field('rewardXp', 'Reward XP', 'number'), field('levelRequired', 'Required level', 'number'),\n    field('requires', 'Prerequisite quest IDs', 'json'),",
"    field('rewardGold', 'Reward gold', 'number'), field('rewardXp', 'Reward XP', 'number'), field('levelRequired', 'Required level', 'number'),\n    field('requires', 'Prerequisite quest IDs', 'json'), field('rewardItem', 'Reward item', 'json'),", 'Studio quest reward')
s = replace_once(s,
"    field('levelRequired', 'Required level', 'number'), field('seed', 'Seed', 'number'), field('spawnX', 'Spawn X', 'number'), field('spawnY', 'Spawn Y', 'number'),\n    field('townX', 'Town X', 'number'), field('townY', 'Town Y', 'number'), field('townRange', 'Town range', 'number'), field('portals', 'Portals', 'json'),",
"    field('levelRequired', 'Required level', 'number'), field('seed', 'Seed', 'number'), field('spawnX', 'Spawn X', 'number'), field('spawnY', 'Spawn Y', 'number'),\n    field('townX', 'Town X', 'number'), field('townY', 'Town Y', 'number'), field('townRange', 'Town range', 'number'),\n    field('access', 'Access', 'select', { optionKey: 'mapAccess' }), field('portals', 'Portals', 'json'),", 'Studio map access')
s = replace_once(s,
"    field('id', 'ID'), field('name', 'Name'), field('icon', 'Icon'), field('description', 'Description', 'textarea'),\n    field('target', 'Monster target'), field('count', 'Required kills', 'number'), field('rewardGold', 'Reward gold', 'number'),",
"    field('id', 'ID'), field('name', 'Name'), field('icon', 'Icon'), field('description', 'Description', 'textarea'),\n    field('type', 'Event type', 'select', { optionKey: 'eventTypes' }), field('target', 'Monster target'), field('count', 'Required kills', 'number'), field('rewardGold', 'Reward gold', 'number'),", 'Studio event type')
s = replace_once(s,
"  events: Object.freeze([\n    field('id', 'ID'), field('name', 'Name'), field('icon', 'Icon'), field('description', 'Description', 'textarea'),\n    field('type', 'Event type', 'select', { optionKey: 'eventTypes' }), field('target', 'Monster target'), field('count', 'Required kills', 'number'), field('rewardGold', 'Reward gold', 'number'),\n    field('rewardXp', 'Reward XP', 'number'), field('rewardCoins', 'Reward coins', 'number'),\n    field('mapId', 'Map', 'select', { optionKey: 'maps', allowEmpty: true }), field('durationMs', 'Duration ms', 'number'),\n  ]),\n});",
"  events: Object.freeze([\n    field('id', 'ID'), field('name', 'Name'), field('icon', 'Icon'), field('description', 'Description', 'textarea'),\n    field('type', 'Event type', 'select', { optionKey: 'eventTypes' }), field('target', 'Monster target'), field('count', 'Required kills', 'number'), field('rewardGold', 'Reward gold', 'number'),\n    field('rewardXp', 'Reward XP', 'number'), field('rewardCoins', 'Reward coins', 'number'),\n    field('mapId', 'Map', 'select', { optionKey: 'maps', allowEmpty: true }), field('durationMs', 'Duration ms', 'number'),\n  ]),\n  shops: Object.freeze([\n    field('id', 'ID'), field('name', 'Name'), field('npcId', 'Merchant NPC', 'select', { optionKey: 'npcs' }),\n    field('description', 'Description', 'textarea'), field('entries', 'Shop entries', 'json'),\n  ]),\n  lootTables: Object.freeze([\n    field('id', 'ID'), field('name', 'Name'), field('rolls', 'Rolls', 'number'),\n    field('description', 'Description', 'textarea'), field('entries', 'Loot entries', 'json'),\n  ]),\n  gmRoster: Object.freeze([\n    field('id', 'ID'), field('name', 'Character name'), field('note', 'GM note', 'textarea'),\n  ]),\n});", 'Studio new schemas')
s = replace_once(s,
"    if (record.portals !== undefined && !Array.isArray(record.portals)) return 'portals must be a JSON array';\n    return null;",
"    if (record.portals !== undefined && !Array.isArray(record.portals)) return 'portals must be a JSON array';\n    if (!MAP_ACCESS.includes(String(record.access || 'public'))) return 'map access is not supported';\n    return null;", 'Studio map validation')
s = replace_once(s,
"  return null;\n}\n\nfunction mapOptions(contentDB)",
"  if (type === 'shops') {\n    if (!String(record.npcId || '').trim()) return 'npcId is required';\n    if (!Array.isArray(record.entries) || record.entries.length < 1 || record.entries.length > 100) return 'entries must contain 1-100 shop entries';\n    for (const entry of record.entries) {\n      if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !String(entry.itemId || '').trim()) return 'shop entries require itemId';\n      const error = numberIn(entry, 'price', 1, 100_000_000, { required: true, integer: true }); if (error) return error;\n    }\n    return null;\n  }\n\n  if (type === 'lootTables') {\n    let error = numberIn(record, 'rolls', 1, 10, { required: true, integer: true }); if (error) return error;\n    if (!Array.isArray(record.entries) || record.entries.length < 1 || record.entries.length > 100) return 'entries must contain 1-100 loot entries';\n    for (const entry of record.entries) {\n      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return 'loot entries must be objects';\n      if (!String(entry.itemId || entry.name || '').trim()) return 'loot entries require itemId or name';\n      const chance = Number(entry.chance); if (!Number.isFinite(chance) || chance <= 0 || chance > 1) return 'loot chance must be > 0 and <= 1';\n      const min = Number(entry.min ?? 1), max = Number(entry.max ?? min);\n      if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max < min || max > 9999) return 'loot min/max are invalid';\n    }\n    return null;\n  }\n\n  if (type === 'gmRoster') {\n    if (String(record.name || '').trim().length > 80) return 'GM character name is too long';\n    return null;\n  }\n\n  return null;\n}\n\nfunction mapOptions(contentDB)", 'Studio extra validation')
s = replace_once(s,
"    spellTypes: [...SPELL_TYPES], buffTypes: [...BUFF_TYPES], vocations: Object.keys(VOCATIONS).sort(),\n    biomes: [...BIOMES].sort(), maps: mapOptions(contentDB),\n    npcs: contentDB.get('npcs').map(entry => entry.id).filter(Boolean).sort(),\n    quests: contentDB.get('quests').map(entry => entry.id).filter(Boolean).sort(),",
"    spellTypes: [...SPELL_TYPES], buffTypes: [...BUFF_TYPES], vocations: Object.keys(VOCATIONS).sort(),\n    biomes: [...BIOMES].sort(), maps: mapOptions(contentDB), mapAccess: [...MAP_ACCESS], eventTypes: [...EVENT_TYPES],\n    npcs: contentDB.get('npcs').map(entry => entry.id).filter(Boolean).sort(),\n    quests: contentDB.get('quests').map(entry => entry.id).filter(Boolean).sort(),\n    items: contentDB.get('items').map(entry => entry.id).filter(Boolean).sort(),\n    lootTables: contentDB.get('lootTables').map(entry => entry.id).filter(Boolean).sort(),", 'Studio options')
s = replace_once(s,
"    events: 'World events rotate and reward participants from authoritative server state.',",
"    events: 'World events rotate and reward participants from authoritative server state.',\n    shops: 'Content shops extend the authoritative alpha merchant catalog and can be edited without a client rebuild.',\n    lootTables: 'Loot tables are rolled server-side by monsters that reference them.',\n    gmRoster: 'Characters listed here may enter maps whose access is set to gm. This is server-enforced.',", 'Studio notes')
write(p, s)

# ------------------------------------------------------------------
# Content integrity: references for shops, loot tables and GM-aware maps.
# ------------------------------------------------------------------
p = 'server/engine/ContentIntegrity.mjs'
s = read(p)
s = replace_once(s,
"  if (type === 'monsters' && record.mapId !== undefined && record.mapId !== null && String(record.mapId).trim()) {\n    const mapId = String(record.mapId).trim();\n    if (!hasMap(contentDB, mapId)) return `Monster references unknown map: ${mapId}`;\n  }",
"  if (type === 'monsters' && record.mapId !== undefined && record.mapId !== null && String(record.mapId).trim()) {\n    const mapId = String(record.mapId).trim();\n    if (!hasMap(contentDB, mapId)) return `Monster references unknown map: ${mapId}`;\n    const lootTableId = typeof record.lootTableId === 'string' ? record.lootTableId.trim() : '';\n    if (lootTableId && !contentDB.get('lootTables').some(table => table.id === lootTableId)) return `Monster references unknown loot table: ${lootTableId}`;\n  }", 'Integrity monster loot')
s = replace_once(s,
"  if (type === 'events' && record.mapId !== undefined && record.mapId !== null && String(record.mapId).trim()) {\n    const mapId = String(record.mapId).trim();\n    if (!hasMap(contentDB, mapId)) return `World event references unknown map: ${mapId}`;\n  }\n\n  return null;",
"  if (type === 'events' && record.mapId !== undefined && record.mapId !== null && String(record.mapId).trim()) {\n    const mapId = String(record.mapId).trim();\n    if (!hasMap(contentDB, mapId)) return `World event references unknown map: ${mapId}`;\n  }\n\n  if (type === 'shops') {\n    if (!contentDB.get('npcs').some(npc => npc.id === record.npcId)) return `Shop references unknown NPC: ${record.npcId}`;\n    for (const entry of Array.isArray(record.entries) ? record.entries : []) {\n      if (!contentDB.get('items').some(item => item.id === entry.itemId)) return `Shop references unknown item: ${entry.itemId}`;\n    }\n  }\n\n  if (type === 'lootTables') {\n    for (const entry of Array.isArray(record.entries) ? record.entries : []) {\n      if (entry.itemId && !contentDB.get('items').some(item => item.id === entry.itemId)) return `Loot table references unknown item: ${entry.itemId}`;\n    }\n  }\n\n  return null;", 'Integrity new refs')
s = replace_once(s,
"  if (type === 'npcs') {\n    for (const quest of contentDB.get('quests')) if (quest.npcId === canonicalId) blockers.push({ type: 'quest', id: quest.id, field: 'npcId' });\n  }",
"  if (type === 'npcs') {\n    for (const quest of contentDB.get('quests')) if (quest.npcId === canonicalId) blockers.push({ type: 'quest', id: quest.id, field: 'npcId' });\n    for (const shop of contentDB.get('shops')) if (shop.npcId === canonicalId) blockers.push({ type: 'shop', id: shop.id, field: 'npcId' });\n  }\n\n  if (type === 'items') {\n    for (const shop of contentDB.get('shops')) for (const entry of shop.entries || []) if (entry.itemId === canonicalId) blockers.push({ type: 'shop', id: shop.id, field: 'entries.itemId' });\n    for (const table of contentDB.get('lootTables')) for (const entry of table.entries || []) if (entry.itemId === canonicalId) blockers.push({ type: 'lootTable', id: table.id, field: 'entries.itemId' });\n  }\n\n  if (type === 'lootTables') {\n    for (const monster of contentDB.get('monsters')) if (monster.lootTableId === canonicalId) blockers.push({ type: 'monster', id: monster.id, field: 'lootTableId' });\n  }", 'Integrity blockers')
s = replace_once(s,
"const AUDIT_TYPES = Object.freeze(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events']);",
"const AUDIT_TYPES = Object.freeze(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events', 'shops', 'lootTables', 'gmRoster']);", 'Integrity audit types')
write(p, s)

# ------------------------------------------------------------------
# World: persist map access metadata for server enforcement.
# ------------------------------------------------------------------
p = 'server/engine/World.mjs'
s = read(p)
s = replace_once(s,
"    levelRequired: integer(record?.levelRequired, 1, 100_000, base?.levelRequired ?? 1),\n    portals,",
"    levelRequired: integer(record?.levelRequired, 1, 100_000, base?.levelRequired ?? 1),\n    access: record?.access === 'gm' ? 'gm' : (base?.access === 'gm' ? 'gm' : 'public'),\n    portals,", 'World access')
s = replace_once(s,
"      id: config.id, name: config.name, description: config.description, biome: config.biome,\n      levelRequired: config.levelRequired, seed: config.seed,",
"      id: config.id, name: config.name, description: config.description, biome: config.biome, access: config.access || 'public',\n      levelRequired: config.levelRequired, seed: config.seed,", 'World definitions access')
write(p, s)

# ------------------------------------------------------------------
# Items: all 13 slots + authoritative admin loot tables.
# ------------------------------------------------------------------
p = 'server/engine/Items.mjs'
s = read(p)
s = replace_once(s,
"const VALID_EQUIPMENT_SLOTS = new Set(['weapon', 'armor', 'helmet', 'legs', 'boots', 'shield', 'ring', 'amulet']);",
"const VALID_EQUIPMENT_SLOTS = new Set(['weapon', 'armor', 'helmet', 'legs', 'boots', 'shield', 'ring', 'ring2', 'amulet', 'cloak', 'belt', 'gloves', 'relic']);", 'Items slots')
s = replace_once(s, "export function rollLoot(monster, goldBonus = 0, contentItems = []) {",
"export function rollContentLootTable(monster, contentItems = [], lootTables = [], random = Math.random) {\n  const tableId = typeof monster?.lootTableId === 'string' ? monster.lootTableId : '';\n  const table = Array.isArray(lootTables) ? lootTables.find(entry => entry?.id === tableId) : null;\n  if (!table || !Array.isArray(table.entries)) return [];\n  const pool = buildEquipmentLootPool(contentItems);\n  const drops = [];\n  const rolls = Math.max(1, Math.min(10, Math.floor(Number(table.rolls) || 1)));\n  for (let roll = 0; roll < rolls; roll++) {\n    for (const entry of table.entries) {\n      const chance = Math.max(0, Math.min(1, Number(entry?.chance) || 0));\n      if (chance <= 0 || random() >= chance) continue;\n      const min = Math.max(1, Math.floor(Number(entry.min) || 1));\n      const max = Math.max(min, Math.min(9999, Math.floor(Number(entry.max) || min)));\n      const quantity = min + Math.floor(random() * (max - min + 1));\n      const base = entry.itemId ? pool.find(item => item.id === entry.itemId) : null;\n      if (base) {\n        const item = rollEquipmentAffixes(base, monster.level, random);\n        drops.push({ id:`loot_${Date.now()}_${random()}`, name:item.name, icon:item.icon, quantity:1, value:item.value, type:'equipment', rarity:item.rarity, description:item.description, equipment:{...item,sockets:item.rarity==='legendary'?1:0,socketedGems:[]} });\n      } else {\n        const name = typeof entry.name === 'string' && entry.name.trim() ? entry.name.trim().slice(0,100) : 'Regional Material';\n        drops.push({ id:`loot_${Date.now()}_${random()}`, name, icon:typeof entry.icon==='string'&&entry.icon?entry.icon.slice(0,8):'📦', quantity, value:Math.max(0,Math.floor(Number(entry.value)||0)), type:typeof entry.type==='string'&&entry.type?entry.type:'misc' });\n      }\n    }\n  }\n  return drops.slice(0, 12);\n}\n\nexport function rollLoot(monster, goldBonus = 0, contentItems = [], mapId = monster?.mapId, lootTables = []) {", 'Items custom loot')
s = replace_once(s,
"  const regional = rollRegionalMaterial(arguments.length > 3 ? arguments[3] : monster.mapId, monster, Math.random);\n  if (regional) drops.push(regional);\n  return drops;",
"  const regional = rollRegionalMaterial(mapId, monster, Math.random);\n  if (regional) drops.push(regional);\n  drops.push(...rollContentLootTable(monster, contentItems, lootTables, Math.random));\n  return drops;", 'Items loot tail')
write(p, s)

# ------------------------------------------------------------------
# Game engine: GM map enforcement + loot table link.
# ------------------------------------------------------------------
p = 'server/engine/GameState.mjs'
s = read(p)
s = replace_once(s, "import { accountStore } from './AuthService.mjs';", "import { accountStore } from './AuthService.mjs';\nimport { canAccessMap, explainMapAccess } from './ContentAccess.mjs';", 'GameState access import')
s = replace_once(s,
"  getPlayersOnMap(mapId) {\n    const result = [];\n    for (const p of this.players.values()) if (p.mapId === mapId) result.push(p);\n    return result;\n  }",
"  getPlayersOnMap(mapId) {\n    const result = [];\n    for (const p of this.players.values()) if (p.mapId === mapId) result.push(p);\n    return result;\n  }\n\n  enforcePlayerMapAccess(player) {\n    const map = WORLD.getMap(player?.mapId);\n    if (player && map && canAccessMap(contentDB, player, map)) return true;\n    const fallback = WORLD.getMap('eldoria');\n    if (!player || !fallback) return false;\n    player.mapId = 'eldoria';\n    const pos = WORLD.findWalkableSpawn(fallback, fallback.spawnPoint);\n    player.x = pos.x; player.y = pos.y; player.targetId = null;\n    return false;\n  }\n\n  enforceAllMapAccess() {\n    for (const player of this.players.values()) this.enforcePlayerMapAccess(player);\n  }", 'GameState enforce methods')
s = replace_once(s,
"      let map = WORLD.getMap(player.mapId);\n      if (!map) { player.mapId = 'eldoria'; map = WORLD.getMap('eldoria'); player.targetId = null; }",
"      let map = WORLD.getMap(player.mapId);\n      if (!map || !canAccessMap(contentDB, player, map)) { player.mapId = 'eldoria'; map = WORLD.getMap('eldoria'); player.targetId = null; }", 'GameState sync access')
s = replace_once(s,
"            goldMax: Math.floor(boundedNumber(template.goldMax, 0, 100_000_000, 0)),\n          });",
"            goldMax: Math.floor(boundedNumber(template.goldMax, 0, 100_000_000, 0)),\n            lootTableId: typeof template.lootTableId === 'string' ? template.lootTableId.trim().slice(0,100) : '',\n          });", 'GameState monster lootTable')
s = replace_once(s,
"    if (!targetMap || !spawn || !targetMap.tiles?.[spawn.y]?.[spawn.x]?.walkable) return false;\n    if (targetMap.levelRequired && player.level < targetMap.levelRequired) {",
"    if (!targetMap || !spawn || !targetMap.tiles?.[spawn.y]?.[spawn.x]?.walkable) return false;\n    if (!canAccessMap(contentDB, player, targetMap)) {\n      this.emitEvent(player.mapId, { kind:'system', targetId:player.id, text:`🔒 ${explainMapAccess(contentDB, player, targetMap)}`, color:'#ff6060', pos:{x:player.x,y:player.y} });\n      return false;\n    }\n    if (targetMap.levelRequired && player.level < targetMap.levelRequired) {", 'GameState travel access')
s = replace_once(s,
"    const loot = [...rollLoot(monster, derived.goldBonus, this.contentItems, player.mapId), ...(officialKill.bonusLoot || [])];",
"    const loot = [...rollLoot(monster, derived.goldBonus, this.contentItems, player.mapId, contentDB.get('lootTables')), ...(officialKill.bonusLoot || [])];", 'GameState loot call')
s = replace_once(s,
"      contentItems: this.contentItems,\n      contentNpcs: contentDB.get('npcs'),",
"      contentItems: this.contentItems,\n      contentNpcs: contentDB.get('npcs'),\n      contentShops: contentDB.get('shops'),", 'GameState shop context')
write(p, s)

# ------------------------------------------------------------------
# Shop domain: content-defined equipment can be purchased authoritatively.
# ------------------------------------------------------------------
p = 'server/engine/OfficialInventoryEconomyDomain.mjs'
s = read(p)
old = """  buyShop(host, player, itemId, rawQty) {\n    const item = OFFICIAL_SHOP.find(entry => entry.id === itemId);\n    const qty = int(rawQty, 1, INVENTORY_ECONOMY_RULES.maxShopQuantity, 1);\n    if (!item) return false;\n    const discount = typeof host.getReputationDiscount === 'function' ? host.getReputationDiscount(player) : 0;\n    const unitPrice = Math.max(1, Math.floor(item.price * (1 - discount)));\n    if (player.level < (item.levelRequired || 1) || player.gold < unitPrice * qty) return false;\n    player.gold -= unitPrice * qty;\n    addItem(player, { name: item.name, icon: item.icon, type: item.type, quantity: qty, value: unitPrice, description: item.description });\n    return true;\n  }\n"""
new = """  buyShop(host, player, itemId, rawQty, contentShops = [], contentItems = []) {\n    const qty = int(rawQty, 1, INVENTORY_ECONOMY_RULES.maxShopQuantity, 1);\n    const official = OFFICIAL_SHOP.find(entry => entry.id === itemId);\n    const contentEntry = Array.isArray(contentShops)\n      ? contentShops.flatMap(shop => Array.isArray(shop?.entries) ? shop.entries : []).find(entry => entry?.itemId === itemId)\n      : null;\n    const contentItem = contentEntry ? buildEquipmentLootPool(contentItems).find(entry => entry.id === itemId) : null;\n    const item = official || (contentItem ? { ...contentItem, price: Number(contentEntry.price) || contentItem.value || 1, type: 'equipment' } : null);\n    if (!item) return false;\n    const effectiveQty = item.type === 'equipment' ? 1 : qty;\n    const discount = typeof host.getReputationDiscount === 'function' ? host.getReputationDiscount(player) : 0;\n    const unitPrice = Math.max(1, Math.floor(item.price * (1 - discount)));\n    if (player.level < (item.levelRequired || item.level || 1) || player.gold < unitPrice * effectiveQty) return false;\n    player.gold -= unitPrice * effectiveQty;\n    if (item.type === 'equipment') {\n      addItem(player, { name:item.name, icon:item.icon, type:'equipment', quantity:1, value:unitPrice, rarity:item.rarity, description:item.description, equipment:{...item,sockets:item.rarity==='legendary'?1:0,socketedGems:[]} });\n    } else {\n      addItem(player, { name:item.name, icon:item.icon, type:item.type, quantity:effectiveQty, value:unitPrice, description:item.description });\n    }\n    return true;\n  }\n"""
s = replace_once(s, old, new, 'Economy dynamic shop')
write(p, s)

p = 'server/engine/OfficialSystems.mjs'
s = read(p)
s = replace_once(s,
"  buyShop(player, itemId, rawQty) {\n    return officialInventoryEconomyDomain.buyShop(this, player, itemId, rawQty);\n  }",
"  buyShop(player, itemId, rawQty, contentShops = [], contentItems = []) {\n    return officialInventoryEconomyDomain.buyShop(this, player, itemId, rawQty, contentShops, contentItems);\n  }", 'OfficialSystems dynamic shop')
write(p, s)

p = 'server/engine/OfficialActionRegistry.mjs'
s = read(p)
s = replace_once(s,
"  shop_buy: {\n    service: SERVICE.merchant,\n    run: (systems, player, payload) => bool(systems.buyShop(player, payload.itemId, payload.quantity)),\n  },",
"  shop_buy: {\n    service: SERVICE.merchant,\n    run: (systems, player, payload, ctx) => bool(systems.buyShop(player, payload.itemId, payload.quantity, ctx.contentShops || [], ctx.contentItems || [])),\n  },", 'Registry dynamic shop')
write(p, s)

# Snapshot: expose content shop equipment alongside static supplies.
p = 'server/engine/OfficialSnapshotReadModel.mjs'
s = read(p)
s = replace_once(s, "import { officialWorldEventDomain } from './OfficialWorldEventDomain.mjs';", "import { officialWorldEventDomain } from './OfficialWorldEventDomain.mjs';\nimport { contentDB } from './ContentDB.mjs';\nimport { buildEquipmentLootPool } from './Items.mjs';", 'Snapshot imports')
s = replace_once(s,
"function projectCatalogs() {\n  return {\n    pets: clone(OFFICIAL_PETS),\n    gems: clone(OFFICIAL_GEMS),\n    shop: clone(OFFICIAL_SHOP),",
"function projectCatalogs() {\n  const equipment = buildEquipmentLootPool(contentDB.get('items'));\n  const extraShop = [];\n  const seen = new Set(OFFICIAL_SHOP.map(entry => entry.id));\n  for (const shop of contentDB.get('shops')) {\n    for (const entry of Array.isArray(shop?.entries) ? shop.entries : []) {\n      if (!entry?.itemId || seen.has(entry.itemId)) continue;\n      const item = equipment.find(candidate => candidate.id === entry.itemId);\n      if (!item) continue;\n      seen.add(item.id);\n      extraShop.push({ id:item.id, name:item.name, icon:item.icon, type:'equipment', price:Math.max(1,Math.floor(Number(entry.price)||item.value||1)), levelRequired:item.level||1, description:item.description||`Equipment from ${shop.name || 'content shop'}.` });\n      if (extraShop.length >= 100) break;\n    }\n    if (extraShop.length >= 100) break;\n  }\n  return {\n    pets: clone(OFFICIAL_PETS),\n    gems: clone(OFFICIAL_GEMS),\n    shop: clone([...OFFICIAL_SHOP, ...extraShop]),", 'Snapshot shop merge')
write(p, s)

# ------------------------------------------------------------------
# Server Admin: expose new catalogs and enforce GM roster changes live.
# ------------------------------------------------------------------
p = 'server/server.js'
s = read(p)
s = replace_once(s,
"const ALLOWED_ADMIN_TYPES = new Set(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events']);",
"const ALLOWED_ADMIN_TYPES = new Set(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events', 'shops', 'lootTables', 'gmRoster']);", 'Server admin types')
s = replace_once(s,
"return json(res, 200, { content: { items: c.items.length, monsters: c.monsters.length, npcs: c.npcs.length, quests: c.quests.length, spells: c.spells.length, maps: c.maps.length, events: c.worldEvents.length }, uptime: process.uptime(), tick: engine.getTickCount(), version: c.version });",
"return json(res, 200, { content: { items: c.items.length, monsters: c.monsters.length, npcs: c.npcs.length, quests: c.quests.length, spells: c.spells.length, maps: c.maps.length, events: c.worldEvents.length, shops: c.shops.length, lootTables: c.lootTables.length, gmRoster: c.gmRoster.length }, uptime: process.uptime(), tick: engine.getTickCount(), version: c.version });", 'Server dashboard')
s = s.replace("      if (type === 'events') officialSystems.syncWorldEvents(contentDB.get('events'));\n      broadcastContentUpdate();",
              "      if (type === 'events') officialSystems.syncWorldEvents(contentDB.get('events'));\n      if (type === 'gmRoster') engine.enforceAllMapAccess();\n      broadcastContentUpdate();")
s = replace_once(s, "      restorePlayer(player, savedPlayer, vocation);", "      restorePlayer(player, savedPlayer, vocation);\n      engine.enforcePlayerMapAccess(player);", 'Server login access')
write(p, s)

# ------------------------------------------------------------------
# Admin UI: tabs for all new content catalogs.
# ------------------------------------------------------------------
p = 'server/adminPanel.mjs'
s = read(p)
s = replace_once(s,
"    <button onclick=\"showTab('events', this)\">🌍 Events</button>\n    <hr",
"    <button onclick=\"showTab('events', this)\">🌍 Events</button>\n    <button onclick=\"showTab('shops', this)\">🏪 Shops</button>\n    <button onclick=\"showTab('lootTables', this)\">🎁 Loot Tables</button>\n    <button onclick=\"showTab('gmRoster', this)\">🔐 GM Roster</button>\n    <hr", 'Admin tabs')
write(p, s)

# ------------------------------------------------------------------
# Tests + docs.
# ------------------------------------------------------------------
write('server/test/alpha-content-9-1.test.mjs', r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ContentDB } from '../engine/ContentDB.mjs';
import { ALPHA_CONTENT_COUNTS } from '../engine/AlphaContent.mjs';
import { CONTENT_STUDIO_SCHEMAS, validateStudioRecord } from '../engine/ContentStudio.mjs';
import { canAccessMap, isGmCharacter } from '../engine/ContentAccess.mjs';
import { rollContentLootTable, buildEquipmentLootPool } from '../engine/Items.mjs';

function tempDb() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-alpha-'));
  return { db: new ContentDB(path.join(dir, 'content.json')), dir };
}

test('9.1 alpha seed ships launch-sized editable content', () => {
  const { db, dir } = tempDb();
  try {
    assert.ok(db.get('maps').length >= 11);
    assert.ok(db.get('items').length >= 70);
    assert.ok(db.get('monsters').length >= 70);
    assert.ok(db.get('npcs').length >= 35);
    assert.ok(db.get('quests').length >= 45);
    assert.ok(db.get('spells').length >= 30);
    assert.ok(db.get('events').length >= 10);
    assert.ok(db.get('shops').length >= 10);
    assert.ok(db.get('lootTables').length >= 10);
    assert.equal(db.data.version, 2);
    assert.equal(ALPHA_CONTENT_COUNTS.maps, 11);
  } finally { fs.rmSync(dir, { recursive:true, force:true }); }
});

test('Studio exposes all alpha content catalogs and all equipment slots', () => {
  for (const type of ['items','monsters','npcs','spells','quests','maps','events','shops','lootTables','gmRoster']) assert.ok(CONTENT_STUDIO_SCHEMAS[type]);
  const slots = CONTENT_STUDIO_SCHEMAS.items.find(field => field.id === 'slot');
  assert.equal(slots.optionKey, 'slots');
  const source = fs.readFileSync(new URL('../engine/ContentStudio.mjs', import.meta.url), 'utf8');
  for (const slot of ['ring2','cloak','belt','gloves','relic']) assert.match(source, new RegExp(`['\"]${slot}['\"]`));
});

test('GM island access is server-owned by admin-editable roster', () => {
  const fake = { get: type => type === 'gmRoster' ? [{ id:'gm_will', name:'WillGM' }] : [] };
  const map = { id:'gm_sanctum', access:'gm', name:'Astra Sanctum' };
  assert.equal(isGmCharacter(fake, { name:'willgm' }), true);
  assert.equal(canAccessMap(fake, { name:'WillGM' }, map), true);
  assert.equal(canAccessMap(fake, { name:'RegularPlayer' }, map), false);
  assert.equal(canAccessMap(fake, { name:'RegularPlayer' }, { id:'eldoria', access:'public' }), true);
});

test('alpha map records are semantically complete', () => {
  const { db, dir } = tempDb();
  try {
    for (const map of db.get('maps')) assert.equal(validateStudioRecord('maps', map), null, map.id);
  } finally { fs.rmSync(dir, { recursive:true, force:true }); }
});

test('content loot tables resolve server-side equipment and materials', () => {
  const { db, dir } = tempDb();
  try {
    const monster = db.get('monsters').find(entry => entry.lootTableId);
    assert.ok(monster);
    const table = db.get('lootTables').find(entry => entry.id === monster.lootTableId);
    const forced = { ...table, rolls:1, entries:table.entries.map(entry => ({ ...entry, chance:1 })) };
    const drops = rollContentLootTable(monster, db.get('items'), [forced], () => 0);
    assert.ok(drops.length >= 2);
    assert.ok(drops.some(drop => drop.type === 'equipment'));
    assert.ok(buildEquipmentLootPool(db.get('items')).some(item => item.slot === 'relic' || item.slot === 'cloak'));
  } finally { fs.rmSync(dir, { recursive:true, force:true }); }
});
''')

write('docs/MORIA_9_1_ALPHA_CONTENT.md', '''# Mor'ia 9.1 — Alpha Content Expansion\n\n## Launch content baseline\nFresh servers now seed a progression network spanning ten public regions plus the restricted Astra Sanctum GM Island. The pack contains regional monster families, elites and bosses, four-step quest chains, equipment tiers, extra vocation spells, world events, shops and server-side loot tables.\n\n## Admin ownership\nThe authoritative `/admin` Content Studio can create/edit/delete items, monsters, NPCs, spells, quests, maps, events, shops, loot tables and the GM roster. Quest rewards, monster loot-table links, map access and all 13 equipment slots are exposed by the shared Studio schema.\n\n## GM Island\n`gm_sanctum` uses `access: gm`. Entry is checked server-side against the `gmRoster` content catalog. Add a character name to **GM Roster** in `/admin` to grant access; removing it immediately revokes restricted-map access. The island includes a test plaza, training dummies, a boss simulator and GM operations NPCs.\n\n## Runtime integration\n- Dynamic maps rebuild deterministic terrain and portals.\n- Content monsters spawn authoritatively by `mapId`.\n- `lootTableId` rolls supplementary drops server-side.\n- Content shops extend the authoritative merchant catalog.\n- Content spells execute through the server spell list.\n- Quest chains and events resolve content targets by stable IDs.\n\nAll 9.1 work remains subject to the normal audits, TypeScript/build gate, server syntax check and full server test suite.\n''')

print('9.1 alpha content integration applied')
