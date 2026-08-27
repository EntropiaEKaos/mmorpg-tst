from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ITEMIZATION = ROOT / 'server/engine/Itemization.mjs'
ITEMS = ROOT / 'server/engine/Items.mjs'
GAME = ROOT / 'server/engine/GameState.mjs'
ECONOMY = ROOT / 'server/engine/OfficialInventoryEconomyDomain.mjs'
CATALOGS = ROOT / 'server/engine/OfficialCatalogs.mjs'
TYPES = ROOT / 'src/game/types.ts'
TOOLTIP = ROOT / 'src/components/Tooltip.tsx'
TEST = ROOT / 'server/test/itemization-8-4.test.mjs'
DOC = ROOT / 'docs/MORIA_8_4_PROGRESSION_ITEMIZATION.md'

ITEMIZATION.write_text(r'''// Mor'ia 8.4 — authoritative procedural itemization.
// Affixes remain metadata and are applied by server/client derived-stat readers,
// preserving the immutable base-item stats and IDs used by mastery/content tools.

export const REGIONAL_MATERIALS = Object.freeze({
  eldoria: { name: 'Verdant Fiber', icon: '🌿', value: 28 },
  frostpeak: { name: 'Frost Crystal', icon: '❄', value: 45 },
  shadowfen: { name: 'Bog Essence', icon: '🧪', value: 55 },
  emberhold: { name: 'Cinder Ore', icon: '🔥', value: 70 },
  voidlands: { name: 'Void Shard', icon: '💠', value: 110 },
});

const RARITY_AFFIX_COUNT = Object.freeze({ common: 0, uncommon: 1, rare: 1, epic: 2, legendary: 3 });
const STAT_CAPS = Object.freeze({
  attack: 250, defense: 180, armor: 220, hp: 1200, mana: 900, magic: 180,
  critChance: 12, lifesteal: 8, moveSpeed: 12, xpBonus: 15, goldBonus: 18,
});

const AFFIXES = Object.freeze([
  { id: 'savage', name: 'Savage', position: 'prefix', slots: ['weapon', 'ring', 'amulet'], stats: level => ({ attack: Math.max(1, Math.floor(1 + level * 0.28)) }) },
  { id: 'arcane', name: 'Arcane', position: 'prefix', slots: ['weapon', 'helmet', 'ring', 'amulet'], stats: level => ({ magic: Math.max(1, Math.floor(1 + level * 0.20)), mana: Math.max(4, level * 2) }) },
  { id: 'bastion', name: 'Bastion', position: 'prefix', slots: ['armor', 'helmet', 'legs', 'boots', 'shield'], stats: level => ({ armor: Math.max(1, Math.floor(1 + level * 0.24)) }) },
  { id: 'keen', name: 'Keen', position: 'prefix', slots: ['weapon', 'ring', 'amulet'], stats: level => ({ critChance: Math.min(4, 1 + Math.floor(level / 15)) }) },
  { id: 'vigor', name: 'of Vigor', position: 'suffix', slots: ['armor', 'helmet', 'legs', 'boots', 'shield', 'ring', 'amulet'], stats: level => ({ hp: Math.max(6, level * 3) }) },
  { id: 'insight', name: 'of Insight', position: 'suffix', slots: ['weapon', 'helmet', 'ring', 'amulet'], stats: level => ({ mana: Math.max(8, level * 3) }) },
  { id: 'thirst', name: 'of Thirst', position: 'suffix', slots: ['weapon', 'ring', 'amulet'], stats: level => ({ lifesteal: Math.min(4, 1 + Math.floor(level / 20)) }) },
  { id: 'fortune', name: 'of Fortune', position: 'suffix', slots: ['ring', 'amulet', 'boots'], stats: level => ({ goldBonus: Math.min(8, 2 + Math.floor(level / 8)) }) },
  { id: 'sage', name: 'of the Sage', position: 'suffix', slots: ['helmet', 'ring', 'amulet'], stats: level => ({ xpBonus: Math.min(7, 2 + Math.floor(level / 10)) }) },
]);

function clampStat(stat, value) {
  const cap = STAT_CAPS[stat] || 1_000_000;
  return Math.max(0, Math.min(cap, Math.floor(Number(value) || 0)));
}

export function rollEquipmentAffixes(base, monsterLevel = 1, random = Math.random) {
  if (!base || typeof base !== 'object') return base;
  const rarity = String(base.rarity || 'common').toLowerCase();
  const count = RARITY_AFFIX_COUNT[rarity] || 0;
  const level = Math.max(1, Math.floor(Number(monsterLevel) || Number(base.level) || 1));
  const eligible = AFFIXES.filter(affix => affix.slots.includes(base.slot));
  const chosen = [];
  const pool = [...eligible];
  while (chosen.length < count && pool.length) {
    const index = Math.min(pool.length - 1, Math.floor(Math.max(0, Math.min(0.999999, Number(random()) || 0)) * pool.length));
    chosen.push(pool.splice(index, 1)[0]);
  }
  if (!chosen.length) return { ...base, baseItemId: base.baseItemId || base.id, affixes: [] };

  const affixes = chosen.map(def => {
    const stats = Object.fromEntries(Object.entries(def.stats(level)).map(([key, value]) => [key, clampStat(key, value)]));
    const description = Object.entries(stats).map(([key, value]) => `+${value}${['critChance','lifesteal','moveSpeed','xpBonus','goldBonus'].includes(key) ? '%' : ''} ${key}`).join(' · ');
    return { id: def.id, name: def.name, description, stats };
  });
  const prefix = chosen.find(def => def.position === 'prefix')?.name;
  const suffix = chosen.find(def => def.position === 'suffix')?.name;
  const name = `${prefix ? `${prefix} ` : ''}${base.name}${suffix ? ` ${suffix}` : ''}`;
  return {
    ...base,
    baseItemId: base.baseItemId || base.id,
    name,
    value: Math.floor((Number(base.value) || 0) * (1 + affixes.length * 0.18)),
    affixes,
  };
}

export function sumAffixStats(equipment) {
  const total = {};
  for (const affix of Array.isArray(equipment?.affixes) ? equipment.affixes : []) {
    if (!affix || typeof affix !== 'object' || !affix.stats || typeof affix.stats !== 'object') continue;
    for (const [stat, raw] of Object.entries(affix.stats)) total[stat] = (total[stat] || 0) + clampStat(stat, raw);
  }
  return total;
}

export function rollRegionalMaterial(mapId, monster, random = Math.random) {
  const material = REGIONAL_MATERIALS[mapId];
  if (!material) return null;
  const type = monster?.type || 'normal';
  const chance = type === 'boss' ? 0.72 : type === 'elite' ? 0.38 : 0.12;
  if (random() >= chance) return null;
  const level = Math.max(1, Math.floor(Number(monster?.level) || 1));
  const quantity = type === 'boss' ? 2 + Math.floor(level / 20) : type === 'elite' ? 2 : 1;
  return {
    id: `region_${mapId}_${Date.now()}_${random()}`,
    name: material.name,
    icon: material.icon,
    quantity: Math.max(1, Math.min(6, quantity)),
    value: material.value,
    type: 'material',
    region: mapId,
  };
}
''', encoding='utf-8')

items = ITEMS.read_text(encoding='utf-8')
items = items.replace("// ===================================================================\n\nexport const RARITY_COLORS", "// ===================================================================\n\nimport { rollEquipmentAffixes, rollRegionalMaterial } from './Itemization.mjs';\n\nexport const RARITY_COLORS", 1)
old_drop = """      const drop = eligible[Math.floor(Math.random() * eligible.length)];
      drops.push({
        id: `eq_${Date.now()}_${Math.random()}`, name: drop.name, icon: drop.icon, quantity: 1, value: drop.value, type: 'equipment',
        rarity: drop.rarity, description: drop.description,
        equipment: { ...drop, sockets: 0, socketedGems: [] }
      });
"""
new_drop = """      const baseDrop = eligible[Math.floor(Math.random() * eligible.length)];
      const drop = rollEquipmentAffixes(baseDrop, monster.level, Math.random);
      drops.push({
        id: `eq_${Date.now()}_${Math.random()}`, name: drop.name, icon: drop.icon, quantity: 1, value: drop.value, type: 'equipment',
        rarity: drop.rarity, description: drop.description,
        equipment: { ...drop, sockets: drop.rarity === 'legendary' ? 1 : 0, socketedGems: [] }
      });
"""
if old_drop not in items: raise SystemExit('Items equipment drop block missing')
items = items.replace(old_drop, new_drop, 1)
old_return = """  }
  return drops;
}
"""
new_return = """  }
  const regional = rollRegionalMaterial(arguments.length > 3 ? arguments[3] : monster.mapId, monster, Math.random);
  if (regional) drops.push(regional);
  return drops;
}
"""
# replace last occurrence to avoid touching helpers
idx = items.rfind(old_return)
if idx < 0: raise SystemExit('Items rollLoot return block missing')
items = items[:idx] + new_return + items[idx+len(old_return):]
ITEMS.write_text(items, encoding='utf-8')

game = GAME.read_text(encoding='utf-8')
game = game.replace("import { rollLoot, getStarterInventory, buildEquipmentLootPool } from './Items.mjs';", "import { rollLoot, getStarterInventory, buildEquipmentLootPool } from './Items.mjs';\nimport { sumAffixStats } from './Itemization.mjs';", 1)
loop_anchor = """      stats.damageReduction += Number(eq.damageReduction) || 0;
      stats.moveSpeed += Number(eq.moveSpeed) || 0;
    }
"""
loop_replacement = """      stats.damageReduction += Number(eq.damageReduction) || 0;
      stats.moveSpeed += Number(eq.moveSpeed) || 0;
      const affix = sumAffixStats(eq);
      stats.totalAttack += Number(affix.attack) || 0;
      stats.totalDefense += Number(affix.defense) || 0;
      stats.totalDefense += Number(affix.armor) || 0;
      stats.totalArmor += Number(affix.armor) || 0;
      stats.totalMagic += Number(affix.magic) || 0;
      stats.totalMaxHp += Number(affix.hp) || 0;
      stats.totalMaxMana += Number(affix.mana) || 0;
      stats.critChance += Number(affix.critChance) || 0;
      stats.lifesteal += Number(affix.lifesteal) || 0;
      stats.moveSpeed += Number(affix.moveSpeed) || 0;
      stats.xpBonus += Number(affix.xpBonus) || 0;
      stats.goldBonus += Number(affix.goldBonus) || 0;
    }
"""
if loop_anchor not in game: raise SystemExit('GameState equipment derived block missing')
game = game.replace(loop_anchor, loop_replacement, 1)
game = game.replace("rollLoot(monster, derived.goldBonus, this.contentItems)", "rollLoot(monster, derived.goldBonus, this.contentItems, player.mapId)", 1)
GAME.write_text(game, encoding='utf-8')

economy = ECONOMY.read_text(encoding='utf-8')
economy = economy.replace("import { buildEquipmentLootPool } from './Items.mjs';", "import { buildEquipmentLootPool } from './Items.mjs';\nimport { rollEquipmentAffixes } from './Itemization.mjs';", 1)
cache_anchor = """      const reward = sorted[Math.floor(Math.random() * sorted.length)];
      addItem(player, {
        name: reward.name, icon: reward.icon, type: 'equipment', quantity: 1,
        value: reward.value || 0, rarity: reward.rarity, description: reward.description,
        equipment: { ...reward, sockets: Math.random() < 0.35 ? 1 : 0, socketedGems: [] },
      });
"""
cache_replacement = """      const baseReward = sorted[Math.floor(Math.random() * sorted.length)];
      const reward = rollEquipmentAffixes(baseReward, player.level, Math.random);
      addItem(player, {
        name: reward.name, icon: reward.icon, type: 'equipment', quantity: 1,
        value: reward.value || 0, rarity: reward.rarity, description: reward.description,
        equipment: { ...reward, sockets: reward.rarity === 'legendary' || Math.random() < 0.35 ? 1 : 0, socketedGems: [] },
      });
"""
if cache_anchor not in economy: raise SystemExit('Official equipment cache block missing')
economy = economy.replace(cache_anchor, cache_replacement, 1)
ECONOMY.write_text(economy, encoding='utf-8')

catalogs = CATALOGS.read_text(encoding='utf-8')
recipe_anchor = """  { id: 'amulet_loss', name: 'Amulet of Loss', icon: '📿', levelRequired: 15, ingredients: [{ name: 'Magic Rune', quantity: 2 }, { name: 'Dragon Scale', quantity: 1 }, { name: 'Gold', quantity: 1000 }], result: { name: 'Amulet of Loss', icon: '📿', type: 'equipment', quantity: 1, value: 2500, equipment: { id: 'amulet_loss', name: 'Amulet of Loss', icon: '📿', slot: 'amulet', rarity: 'legendary', level: 15, value: 2500, sockets: 1, socketedGems: [] } } },
]);
"""
recipe_replacement = """  { id: 'amulet_loss', name: 'Amulet of Loss', icon: '📿', levelRequired: 15, ingredients: [{ name: 'Magic Rune', quantity: 2 }, { name: 'Dragon Scale', quantity: 1 }, { name: 'Gold', quantity: 1000 }], result: { name: 'Amulet of Loss', icon: '📿', type: 'equipment', quantity: 1, value: 2500, equipment: { id: 'amulet_loss', name: 'Amulet of Loss', icon: '📿', slot: 'amulet', rarity: 'legendary', level: 15, value: 2500, sockets: 1, socketedGems: [] } } },
  { id: 'verdant_sapphire', name: 'Verdant Sapphire', icon: '🔵', levelRequired: 6, ingredients: [{ name: 'Verdant Fiber', quantity: 4 }, { name: 'Gold', quantity: 120 }], result: { name: 'Chipped Sapphire', icon: '🔵', type: 'gem', gemId: 'sapphire_t1', quantity: 1, value: 120 } },
  { id: 'frost_ruby', name: 'Frost-tempered Ruby', icon: '🔴', levelRequired: 10, ingredients: [{ name: 'Frost Crystal', quantity: 4 }, { name: 'Gold', quantity: 240 }], result: { name: 'Flawed Ruby', icon: '🔴', type: 'gem', gemId: 'ruby_t2', quantity: 1, value: 280 } },
  { id: 'bog_garnet', name: 'Bogheart Garnet', icon: '🔴', levelRequired: 12, ingredients: [{ name: 'Bog Essence', quantity: 4 }, { name: 'Gold', quantity: 300 }], result: { name: 'Flawed Garnet', icon: '🔴', type: 'gem', gemId: 'garnet_t2', quantity: 1, value: 340 } },
  { id: 'cinder_topaz', name: 'Cinder Topaz', icon: '🟡', levelRequired: 15, ingredients: [{ name: 'Cinder Ore', quantity: 5 }, { name: 'Gold', quantity: 450 }], result: { name: 'Flawed Topaz', icon: '🟡', type: 'gem', gemId: 'topaz_t2', quantity: 1, value: 500 } },
  { id: 'void_soul_gem', name: 'Void-forged Soul Gem', icon: '💠', levelRequired: 25, ingredients: [{ name: 'Void Shard', quantity: 6 }, { name: 'Frost Crystal', quantity: 2 }, { name: 'Cinder Ore', quantity: 2 }, { name: 'Gold', quantity: 1200 }], result: { name: 'Soul Gem', icon: '💠', type: 'gem', gemId: 'soul_gem', quantity: 1, value: 1500 } },
]);
"""
if recipe_anchor not in catalogs: raise SystemExit('Official recipe catalog anchor missing')
catalogs = catalogs.replace(recipe_anchor, recipe_replacement, 1)
CATALOGS.write_text(catalogs, encoding='utf-8')

types = TYPES.read_text(encoding='utf-8')
interface_anchor = """export interface Equipment {
  id: string;
"""
interface_replacement = """export interface EquipmentAffix {
  id: string;
  name: string;
  description: string;
  stats: Partial<Record<'attack' | 'defense' | 'armor' | 'hp' | 'mana' | 'magic' | 'critChance' | 'lifesteal' | 'moveSpeed' | 'xpBonus' | 'goldBonus', number>>;
}

export interface Equipment {
  id: string;
"""
if interface_anchor not in types: raise SystemExit('Client Equipment interface anchor missing')
types = types.replace(interface_anchor, interface_replacement, 1)
types = types.replace("  socketedGems?: string[];\n}", "  socketedGems?: string[];\n  baseItemId?: string;\n  affixes?: EquipmentAffix[];\n}", 1)
affix_client_anchor = """    stats.damageReduction += eq.damageReduction ?? 0;
    // Apply socketed gems
"""
affix_client_replacement = """    stats.damageReduction += eq.damageReduction ?? 0;
    for (const affix of eq.affixes || []) {
      const bonus = affix.stats || {};
      stats.totalAttack += bonus.attack ?? 0;
      stats.totalDefense += (bonus.defense ?? 0) + (bonus.armor ?? 0);
      stats.totalArmor += bonus.armor ?? 0;
      stats.totalMagic += bonus.magic ?? 0;
      stats.totalMaxHp += bonus.hp ?? 0;
      stats.totalMaxMana += bonus.mana ?? 0;
      stats.critChance += bonus.critChance ?? 0;
      stats.lifesteal += bonus.lifesteal ?? 0;
      stats.moveSpeed += bonus.moveSpeed ?? 0;
      stats.xpBonus += bonus.xpBonus ?? 0;
      stats.goldBonus += bonus.goldBonus ?? 0;
    }
    // Apply socketed gems
"""
if affix_client_anchor not in types: raise SystemExit('Client derived stats affix anchor missing')
types = types.replace(affix_client_anchor, affix_client_replacement, 1)
TYPES.write_text(types, encoding='utf-8')

tooltip = TOOLTIP.read_text(encoding='utf-8')
tooltip = tooltip.replace("    slot: string;\n  };", "    slot: string;\n    affixes?: Array<{ id: string; name: string; description: string; stats: Record<string, number> }>;\n  };", 1)
stat_end = """          {item.equipment.damageReduction ? <div style={{ color: '#4a90e2' }}>🛡 -{item.equipment.damageReduction}% Dmg Taken</div> : null}
        </div>
"""
stat_repl = """          {item.equipment.damageReduction ? <div style={{ color: '#4a90e2' }}>🛡 -{item.equipment.damageReduction}% Dmg Taken</div> : null}
          {(item.equipment.affixes || []).length > 0 && (
            <div className=\"mt-1 border-t border-fuchsia-500/30 pt-1 space-y-1\">
              {(item.equipment.affixes || []).map((affix) => (
                <div key={affix.id}>
                  <div className=\"font-black text-fuchsia-300\">✦ {affix.name}</div>
                  <div className=\"text-[9px] text-fuchsia-100/65\">{affix.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>
"""
if stat_end not in tooltip: raise SystemExit('Tooltip stat block anchor missing')
tooltip = tooltip.replace(stat_end, stat_repl, 1)
TOOLTIP.write_text(tooltip, encoding='utf-8')

TEST.write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { rollEquipmentAffixes, rollRegionalMaterial, sumAffixStats, REGIONAL_MATERIALS } from '../engine/Itemization.mjs';
import { rollLoot } from '../engine/Items.mjs';
import { OFFICIAL_RECIPES } from '../engine/OfficialCatalogs.mjs';

test('common equipment preserves base identity and receives no affix', () => {
  const base = { id: 'iron', name: 'Iron Sword', slot: 'weapon', rarity: 'common', attack: 5, value: 25 };
  const rolled = rollEquipmentAffixes(base, 10, () => 0);
  assert.equal(rolled.id, 'iron');
  assert.equal(rolled.baseItemId, 'iron');
  assert.deepEqual(rolled.affixes, []);
  assert.equal(rolled.attack, 5);
});

test('legendary affixes are unique bounded metadata and never mutate base stats', () => {
  const sequence = [0, 0.2, 0.8];
  const base = { id: 'legend', name: 'Legend Blade', slot: 'weapon', rarity: 'legendary', attack: 50, value: 1000 };
  const rolled = rollEquipmentAffixes(base, 40, () => sequence.shift() ?? 0.5);
  assert.equal(rolled.affixes.length, 3);
  assert.equal(new Set(rolled.affixes.map(a => a.id)).size, 3);
  assert.equal(rolled.attack, 50);
  assert.ok(rolled.name.includes('Legend Blade'));
  const bonus = sumAffixStats(rolled);
  assert.ok(Object.values(bonus).every(value => Number.isFinite(value) && value >= 0));
});

test('regional materials are map-owned and boss quantities remain bounded', () => {
  for (const mapId of Object.keys(REGIONAL_MATERIALS)) {
    const drop = rollRegionalMaterial(mapId, { type: 'boss', level: 100 }, () => 0);
    assert.ok(drop);
    assert.equal(drop.region, mapId);
    assert.ok(drop.quantity >= 1 && drop.quantity <= 6);
  }
});

test('regional materials feed official gem crafting recipes', () => {
  for (const material of Object.values(REGIONAL_MATERIALS)) {
    assert.ok(OFFICIAL_RECIPES.some(recipe => recipe.ingredients.some(ingredient => ingredient.name === material.name)));
  }
});

test('rollLoot can receive an explicit authoritative map without changing base item identity', () => {
  const original = Math.random;
  const rolls = [1, 1, 0, 0, 0.99, 0.99, 0.99, 0];
  Math.random = () => rolls.length ? rolls.shift() : 0.99;
  try {
    const drops = rollLoot({ type: 'boss', level: 30 }, 0, [], 'voidlands');
    const equipment = drops.find(item => item.type === 'equipment');
    assert.ok(equipment?.equipment?.id);
    assert.ok(equipment.equipment.baseItemId);
  } finally { Math.random = original; }
});
''', encoding='utf-8')

DOC.write_text(r'''# Mor'ia 8.4 — Progression & Itemization

## Goal

Make loot create real build decisions without compromising server authority or existing base-item/mastery identities.

## Authoritative itemization

- Equipment rarity controls procedural affix count: common 0, uncommon/rare 1, epic 2, legendary 3.
- Affixes are server-generated, unique per item roll, bounded by explicit stat caps and stored separately from base-item stats.
- Base item ID and base stats remain intact for mastery, admin content overrides and regression compatibility.
- Both server and client derived-stat readers apply affix metadata, so displayed stats match authoritative combat math.
- Official Coin Shop equipment caches use the same affix generator as monster drops.

## Regional progression

- Eldoria: Verdant Fiber.
- Frostpeak: Frost Crystal.
- Shadowfen: Bog Essence.
- Emberhold: Cinder Ore.
- Voidlands: Void Shard.
- Elite/boss kills have better regional-material odds and bounded quantities.
- Each regional material now feeds an official gem-crafting recipe, culminating in the Void-forged Soul Gem.

The server chooses every drop, affix and crafted result; the browser only renders the resulting state.
''', encoding='utf-8')

print('Mor\'ia 8.4 authoritative itemization prepared')
