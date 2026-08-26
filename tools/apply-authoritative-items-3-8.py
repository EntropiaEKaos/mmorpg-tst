from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# ---------------------------------------------------------------------
# Items: ContentDB equipment participates in the authoritative loot pool.
# ---------------------------------------------------------------------
p = Path('server/engine/Items.mjs')
s = p.read_text()

s = replace_once(s,
'''export function rollLoot(monster, goldBonus = 0) {\n''',
'''const VALID_EQUIPMENT_SLOTS = new Set(['weapon', 'armor', 'helmet', 'legs', 'boots', 'shield', 'ring', 'amulet']);\nconst VALID_RARITIES = new Set(['common', 'uncommon', 'rare', 'epic', 'legendary']);\n\nfunction finiteStat(value, fallback = 0, max = 1_000_000) {\n  const number = Number(value);\n  return Number.isFinite(number) ? Math.max(0, Math.min(max, number)) : fallback;\n}\n\nexport function buildEquipmentLootPool(contentItems = []) {\n  const byId = new Map(EQUIPMENT_LOOT.map(item => [item.id, { ...item }]));\n  if (!Array.isArray(contentItems)) return Array.from(byId.values());\n\n  for (const raw of contentItems) {\n    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id.trim()) continue;\n    if (typeof raw.slot !== 'string' || !VALID_EQUIPMENT_SLOTS.has(raw.slot)) continue;\n    const id = raw.id.trim().slice(0, 100);\n    const rarity = typeof raw.rarity === 'string' && VALID_RARITIES.has(raw.rarity) ? raw.rarity : 'common';\n    const item = {\n      id,\n      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 100) : id,\n      icon: typeof raw.icon === 'string' && raw.icon ? raw.icon.slice(0, 8) : '⚔',\n      slot: raw.slot,\n      rarity,\n      level: Math.max(1, Math.floor(finiteStat(raw.level, 1, 100_000))),\n      value: Math.floor(finiteStat(raw.value, 0, 100_000_000)),\n    };\n    for (const stat of ['attack', 'defense', 'armor', 'hp', 'mana', 'magic', 'critChance', 'lifesteal', 'thorns', 'moveSpeed', 'xpBonus', 'goldBonus', 'damageReduction']) {\n      const value = finiteStat(raw[stat], 0, 1_000_000);\n      if (value > 0) item[stat] = value;\n    }\n    if (typeof raw.description === 'string' && raw.description.trim()) item.description = raw.description.trim().slice(0, 500);\n    byId.set(id, item);\n  }\n  return Array.from(byId.values());\n}\n\nexport function rollLoot(monster, goldBonus = 0, contentItems = []) {\n''', 'dynamic authoritative item pool')

s = replace_once(s,
'''    const eligible = EQUIPMENT_LOOT.filter(e => e.level <= monster.level + 3);\n''',
'''    const eligible = buildEquipmentLootPool(contentItems).filter(e => e.level <= monster.level + 3);\n''', 'loot uses server content items')

p.write_text(s)

# ---------------------------------------------------------------------
# GameEngine: retain the current authoritative item catalog for loot rolls.
# ---------------------------------------------------------------------
p = Path('server/engine/GameState.mjs')
s = p.read_text()

s = replace_once(s,
'''    this.pendingEvents = new Map();\n    this.tickCount = 0;\n''',
'''    this.pendingEvents = new Map();\n    this.contentItems = [];\n    this.tickCount = 0;\n''', 'engine content item state')

s = replace_once(s,
'''  // Reconcile live monster overlays created in the server ContentDB.\n''',
'''  syncContentItems(itemContent = []) {\n    this.contentItems = Array.isArray(itemContent)\n      ? itemContent.filter(item => item && typeof item === 'object').map(item => ({ ...item }))\n      : [];\n  }\n\n  // Reconcile live monster overlays created in the server ContentDB.\n''', 'engine item sync method')

s = replace_once(s,
'''    const loot = rollLoot(monster, derived.goldBonus);\n''',
'''    const loot = rollLoot(monster, derived.goldBonus, this.contentItems);\n''', 'kill path uses authoritative items')

p.write_text(s)

# ---------------------------------------------------------------------
# Server boot/admin CRUD: item edits are immediately visible to loot runtime.
# ---------------------------------------------------------------------
p = Path('server/server.js')
s = p.read_text()

s = replace_once(s,
'''// ContentDB is persistent; reconcile explicitly placed monster records into the\n// already-initialized authoritative world at server boot.\nengine.syncContentMonsters(contentDB.get('monsters'));\n''',
'''// ContentDB is persistent; reconcile server-owned catalogs into the already-\n// initialized authoritative runtime at server boot.\nengine.syncContentItems(contentDB.get('items'));\nengine.syncContentMonsters(contentDB.get('monsters'));\n''', 'initial server item content sync')

s = replace_once(s,
'''      if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n      broadcastContentUpdate();\n''',
'''      if (type === 'items') engine.syncContentItems(contentDB.get('items'));\n      if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n      broadcastContentUpdate();\n''', 'item reconcile after admin save')

s = replace_once(s,
'''    if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n    broadcastContentUpdate();\n''',
'''    if (type === 'items') engine.syncContentItems(contentDB.get('items'));\n    if (type === 'monsters') engine.syncContentMonsters(contentDB.get('monsters'));\n    broadcastContentUpdate();\n''', 'item reconcile after admin delete')

p.write_text(s)

# ---------------------------------------------------------------------
# Regression test: custom item can be selected from authoritative loot.
# ---------------------------------------------------------------------
p = Path('server/test/hardening.test.mjs')
s = p.read_text()
s = replace_once(s,
'''import { contentDB } from '../engine/ContentDB.mjs';\n''',
'''import { contentDB } from '../engine/ContentDB.mjs';\nimport { buildEquipmentLootPool, rollLoot } from '../engine/Items.mjs';\n''', 'item test imports')

marker = "test('authoritative content items override and extend the live loot pool'"
if marker not in s:
    s += r'''

test('authoritative content items override and extend the live loot pool', () => {
  const originalCatalog = contentDB.get('items').map(item => ({ ...item }));
  const custom = {
    id: `admin_relic_${Date.now()}_${Math.random()}`,
    name: 'Admin Relic', icon: '🗡', slot: 'weapon', rarity: 'legendary',
    attack: 777, level: 1, value: 12345, description: 'Server-owned test relic',
  };
  const override = {
    id: 'steel_sword', name: 'Steel Sword+', icon: '⚔', slot: 'weapon',
    rarity: 'epic', attack: 321, level: 1, value: 999,
  };

  engine.syncContentItems([custom, override]);
  const pool = buildEquipmentLootPool(engine.contentItems);
  assert.equal(pool.filter(item => item.id === 'steel_sword').length, 1);
  assert.equal(pool.find(item => item.id === 'steel_sword').attack, 321);
  assert.equal(pool.find(item => item.id === custom.id).attack, 777);

  const originalRandom = Math.random;
  const rolls = [1, 1, 0, 0.999999];
  Math.random = () => rolls.length ? rolls.shift() : 0.999999;
  try {
    const drops = rollLoot({ type: 'boss', level: 100 }, 0, engine.contentItems);
    const equipmentDrop = drops.find(item => item.type === 'equipment');
    assert.ok(equipmentDrop);
    assert.equal(equipmentDrop.equipment.id, custom.id);
    assert.equal(equipmentDrop.equipment.attack, 777);
  } finally {
    Math.random = originalRandom;
    engine.syncContentItems(originalCatalog);
  }
});
'''

p.write_text(s)
print('authoritative items 3.8 applied')
