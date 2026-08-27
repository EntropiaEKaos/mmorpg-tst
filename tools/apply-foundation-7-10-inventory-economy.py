from pathlib import Path

ROOT = Path('.')
def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

DOMAIN = r'''// ===================================================================
// MOR'IA — OFFICIAL INVENTORY & ECONOMY DOMAIN
// Owns player-side storage, vendors, crafting, sockets, pets and coin sinks.
// ===================================================================

import { buildEquipmentLootPool } from './Items.mjs';
import {
  OFFICIAL_PETS, OFFICIAL_GEMS, OFFICIAL_SHOP, OFFICIAL_FOOD,
  OFFICIAL_RECIPES, OFFICIAL_COIN_STORE,
} from './OfficialCatalogs.mjs';

const clamp = (value, min, max, fallback = min) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const int = (value, min, max, fallback = min) => Math.floor(clamp(value, min, max, fallback));

export const INVENTORY_ECONOMY_RULES = Object.freeze({
  depotCapacity: 40,
  maxShopQuantity: 20,
  maxBankTransfer: 100_000_000,
  maxSockets: 4,
  foodDurationMs: 10 * 60_000,
  blessingDurationMs: 60 * 60_000,
});

function state(host, player) {
  if (!host || typeof host.ensurePlayer !== 'function') throw new TypeError('OfficialInventoryEconomyDomain requires an OfficialSystems-compatible host.');
  return host.ensurePlayer(player);
}

function addItem(player, item) {
  const copy = { ...item };
  copy.quantity = int(copy.quantity, 1, 9999, 1);
  if (copy.type !== 'equipment' && copy.type !== 'gem') {
    const existing = player.inventory.find(entry => entry.name === copy.name && entry.type === copy.type && !entry.equipment);
    if (existing) {
      existing.quantity = int(existing.quantity, 0, 999999, 0) + copy.quantity;
      return existing;
    }
  }
  copy.id = copy.id || `official_${Date.now()}_${Math.random()}`;
  player.inventory.push(copy);
  return copy;
}

function consumeNamed(player, name, quantity) {
  let remaining = quantity;
  for (const item of player.inventory) {
    if (item.name !== name || remaining <= 0) continue;
    const take = Math.min(int(item.quantity, 0, 999999, 0), remaining);
    item.quantity -= take;
    remaining -= take;
  }
  player.inventory = player.inventory.filter(item => Number(item.quantity) > 0 || item.type === 'equipment');
  return remaining === 0;
}

export class OfficialInventoryEconomyDomain {
  buyPet(host, player, petId) {
    const s = state(host, player);
    const pet = OFFICIAL_PETS.find(entry => entry.id === petId);
    if (!pet || player.level < pet.levelRequired || s.pets.owned.includes(pet.id) || player.gold < pet.price) return false;
    player.gold -= pet.price;
    s.pets.owned.push(pet.id);
    return true;
  }

  togglePet(host, player, petId) {
    const s = state(host, player);
    if (petId === null || petId === '') { s.pets.active = null; return true; }
    if (!s.pets.owned.includes(petId)) return false;
    s.pets.active = s.pets.active === petId ? null : petId;
    return true;
  }

  depotPut(host, player, itemId, now = Date.now()) {
    const s = state(host, player);
    if (s.depot.length >= INVENTORY_ECONOMY_RULES.depotCapacity) return false;
    const index = player.inventory.findIndex(item => item.id === itemId);
    if (index < 0) return false;
    const [item] = player.inventory.splice(index, 1);
    s.depot.push({ ...item, depotId: `depot_${now}_${Math.random()}` });
    return true;
  }

  depotTake(host, player, depotId, now = Date.now()) {
    const s = state(host, player);
    const index = s.depot.findIndex(item => item.depotId === depotId);
    if (index < 0) return false;
    const [item] = s.depot.splice(index, 1);
    const restored = { ...item };
    delete restored.depotId;
    addItem(player, { ...restored, id: `depot_take_${now}_${Math.random()}` });
    return true;
  }

  bank(player, direction, rawAmount) {
    const amount = int(rawAmount, 1, INVENTORY_ECONOMY_RULES.maxBankTransfer, 0);
    if (!amount) return false;
    if (direction === 'deposit' && player.gold >= amount) {
      player.gold -= amount;
      player.bankGold += amount;
      return true;
    }
    if (direction === 'withdraw' && player.bankGold >= amount) {
      player.bankGold -= amount;
      player.gold += amount;
      return true;
    }
    return false;
  }

  buyFood(player, foodId, now = Date.now()) {
    const food = OFFICIAL_FOOD.find(entry => entry.id === foodId);
    if (!food || player.level < food.levelRequired || player.gold < food.price) return false;
    player.gold -= food.price;
    player.buffs = (Array.isArray(player.buffs) ? player.buffs : []).filter(buff => buff.type !== food.buffType && Number(buff.expiresAt) > now);
    player.buffs.push({
      id: `${food.buffType}_${now}`,
      type: food.buffType,
      name: food.name,
      value: food.value,
      startTime: now,
      expiresAt: now + INVENTORY_ECONOMY_RULES.foodDurationMs,
    });
    return true;
  }

  buyShop(host, player, itemId, rawQty) {
    const item = OFFICIAL_SHOP.find(entry => entry.id === itemId);
    const qty = int(rawQty, 1, INVENTORY_ECONOMY_RULES.maxShopQuantity, 1);
    if (!item) return false;
    const discount = typeof host.getReputationDiscount === 'function' ? host.getReputationDiscount(player) : 0;
    const unitPrice = Math.max(1, Math.floor(item.price * (1 - discount)));
    if (player.level < (item.levelRequired || 1) || player.gold < unitPrice * qty) return false;
    player.gold -= unitPrice * qty;
    addItem(player, { name: item.name, icon: item.icon, type: item.type, quantity: qty, value: unitPrice, description: item.description });
    return true;
  }

  craft(player, recipeId, now = Date.now()) {
    const recipe = OFFICIAL_RECIPES.find(entry => entry.id === recipeId);
    if (!recipe || player.level < recipe.levelRequired) return false;
    for (const ingredient of recipe.ingredients) {
      if (ingredient.name === 'Gold') {
        if (player.gold < ingredient.quantity) return false;
      } else {
        const total = player.inventory.filter(item => item.name === ingredient.name).reduce((sum, item) => sum + int(item.quantity, 0, 999999, 0), 0);
        if (total < ingredient.quantity) return false;
      }
    }
    for (const ingredient of recipe.ingredients) {
      if (ingredient.name === 'Gold') player.gold -= ingredient.quantity;
      else consumeNamed(player, ingredient.name, ingredient.quantity);
    }
    addItem(player, { ...recipe.result, id: `craft_${now}_${Math.random()}` });
    return true;
  }

  socketGem(player, itemId, gemItemId) {
    const equipmentItem = player.inventory.find(item => item.id === itemId && item.equipment);
    const gemItem = player.inventory.find(item => item.id === gemItemId && item.type === 'gem' && item.gemId);
    const gem = gemItem ? OFFICIAL_GEMS.find(entry => entry.id === gemItem.gemId) : null;
    if (!equipmentItem || !gemItem || !gem) return false;
    const sockets = int(equipmentItem.equipment.sockets, 0, INVENTORY_ECONOMY_RULES.maxSockets, 0);
    const filled = Array.isArray(equipmentItem.equipment.socketedGems) ? equipmentItem.equipment.socketedGems : [];
    if (sockets <= filled.length) return false;
    equipmentItem.equipment.socketedGems = [...filled, gem.id];
    gemItem.quantity--;
    if (gemItem.quantity <= 0) player.inventory = player.inventory.filter(item => item.id !== gemItem.id);
    return true;
  }

  buyCoinItem(host, player, itemId, contentItems = [], now = Date.now()) {
    const s = state(host, player);
    const entry = OFFICIAL_COIN_STORE.find(item => item.id === itemId);
    if (!entry || s.coins < entry.price) return false;
    if (entry.id === 'title_shadow' && s.titles.owned.includes('Shadow Walker')) return false;
    s.coins -= entry.price;

    if (entry.id === 'supplies') {
      addItem(player, { name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 5, value: 50 });
      addItem(player, { name: 'Mana Potion', icon: '🧴', type: 'potion', quantity: 5, value: 50 });
    } else if (entry.id === 'equipment_cache') {
      const pool = buildEquipmentLootPool(contentItems).filter(item => (item.level || 1) <= player.level + 3);
      if (!pool.length) { s.coins += entry.price; return false; }
      const sorted = pool.sort((a, b) => Math.abs((a.level || 1) - player.level) - Math.abs((b.level || 1) - player.level)).slice(0, 8);
      const reward = sorted[Math.floor(Math.random() * sorted.length)];
      addItem(player, {
        name: reward.name, icon: reward.icon, type: 'equipment', quantity: 1,
        value: reward.value || 0, rarity: reward.rarity, description: reward.description,
        equipment: { ...reward, sockets: Math.random() < 0.35 ? 1 : 0, socketedGems: [] },
      });
    } else if (entry.id === 'blessing') {
      s.blessingsUntil = Math.max(now, s.blessingsUntil) + INVENTORY_ECONOMY_RULES.blessingDurationMs;
    } else if (entry.id === 'title_shadow') {
      s.titles.owned.push('Shadow Walker');
      s.titles.active = 'Shadow Walker';
    }
    return true;
  }
}

export const officialInventoryEconomyDomain = new OfficialInventoryEconomyDomain();
'''
write('server/engine/OfficialInventoryEconomyDomain.mjs', DOMAIN)

path = 'server/engine/OfficialSystems.mjs'
text = read(path)
anchor = "import { officialWorldEventDomain } from './OfficialWorldEventDomain.mjs';\n"
text = replace_once(text, anchor, anchor + "import { officialInventoryEconomyDomain } from './OfficialInventoryEconomyDomain.mjs';\n", 'inventory economy import')
text = text.replace("import { buildEquipmentLootPool } from './Items.mjs';\n", '')

pairs = [
(r'''  buyPet(player, petId) {
    const s = this.ensurePlayer(player);
    const pet = OFFICIAL_PETS.find(p => p.id === petId);
    if (!pet || player.level < pet.levelRequired || s.pets.owned.includes(pet.id) || player.gold < pet.price) return false;
    player.gold -= pet.price; s.pets.owned.push(pet.id); return true;
  }

  togglePet(player, petId) {
    const s = this.ensurePlayer(player);
    if (petId === null || petId === '') { s.pets.active = null; return true; }
    if (!s.pets.owned.includes(petId)) return false;
    s.pets.active = s.pets.active === petId ? null : petId; return true;
  }
''', r'''  buyPet(player, petId) {
    return officialInventoryEconomyDomain.buyPet(this, player, petId);
  }

  togglePet(player, petId) {
    return officialInventoryEconomyDomain.togglePet(this, player, petId);
  }
''', 'pet methods'),
(r'''  depotPut(player, itemId) {
    const s = this.ensurePlayer(player);
    if (s.depot.length >= 40) return false;
    const index = player.inventory.findIndex(item => item.id === itemId);
    if (index < 0) return false;
    const [item] = player.inventory.splice(index, 1);
    s.depot.push({ ...item, depotId: `depot_${Date.now()}_${Math.random()}` });
    return true;
  }

  depotTake(player, depotId) {
    const s = this.ensurePlayer(player);
    const index = s.depot.findIndex(item => item.depotId === depotId);
    if (index < 0) return false;
    const [item] = s.depot.splice(index, 1);
    delete item.depotId;
    addItem(player, { ...item, id: `depot_take_${Date.now()}_${Math.random()}` });
    return true;
  }

  bank(player, direction, rawAmount) {
    const amount = int(rawAmount, 1, 100_000_000, 0);
    if (!amount) return false;
    if (direction === 'deposit' && player.gold >= amount) { player.gold -= amount; player.bankGold += amount; return true; }
    if (direction === 'withdraw' && player.bankGold >= amount) { player.bankGold -= amount; player.gold += amount; return true; }
    return false;
  }
''', r'''  depotPut(player, itemId) {
    return officialInventoryEconomyDomain.depotPut(this, player, itemId);
  }

  depotTake(player, depotId) {
    return officialInventoryEconomyDomain.depotTake(this, player, depotId);
  }

  bank(player, direction, rawAmount) {
    return officialInventoryEconomyDomain.bank(player, direction, rawAmount);
  }
''', 'depot/bank methods'),
(r'''  buyFood(player, foodId) {
    const food = OFFICIAL_FOOD.find(f => f.id === foodId);
    if (!food || player.level < food.levelRequired || player.gold < food.price) return false;
    player.gold -= food.price;
    const now = Date.now();
    player.buffs = (Array.isArray(player.buffs) ? player.buffs : []).filter(b => b.type !== food.buffType && Number(b.expiresAt) > now);
    player.buffs.push({ id: `${food.buffType}_${now}`, type: food.buffType, name: food.name, value: food.value, startTime: now, expiresAt: now + 10 * 60_000 });
    return true;
  }

  buyShop(player, itemId, rawQty) {
    const item = OFFICIAL_SHOP.find(entry => entry.id === itemId);
    const qty = int(rawQty, 1, 20, 1);
    if (!item) return false;
    const discount = this.getReputationDiscount(player);
    const unitPrice = Math.max(1, Math.floor(item.price * (1 - discount)));
    if (player.level < (item.levelRequired || 1) || player.gold < unitPrice * qty) return false;
    player.gold -= unitPrice * qty;
    addItem(player, { name: item.name, icon: item.icon, type: item.type, quantity: qty, value: unitPrice, description: item.description });
    return true;
  }
''', r'''  buyFood(player, foodId) {
    return officialInventoryEconomyDomain.buyFood(player, foodId);
  }

  buyShop(player, itemId, rawQty) {
    return officialInventoryEconomyDomain.buyShop(this, player, itemId, rawQty);
  }
''', 'food/shop methods'),
(r'''  craft(player, recipeId) {
    const recipe = OFFICIAL_RECIPES.find(r => r.id === recipeId);
    if (!recipe || player.level < recipe.levelRequired) return false;
    for (const ing of recipe.ingredients) {
      if (ing.name === 'Gold') { if (player.gold < ing.quantity) return false; }
      else {
        const total = player.inventory.filter(i => i.name === ing.name).reduce((sum, i) => sum + int(i.quantity, 0, 999999, 0), 0);
        if (total < ing.quantity) return false;
      }
    }
    for (const ing of recipe.ingredients) {
      if (ing.name === 'Gold') player.gold -= ing.quantity;
      else consumeNamed(player, ing.name, ing.quantity);
    }
    addItem(player, { ...recipe.result, id: `craft_${Date.now()}_${Math.random()}` });
    return true;
  }

  socketGem(player, itemId, gemItemId) {
    const equipmentItem = player.inventory.find(i => i.id === itemId && i.equipment);
    const gemItem = player.inventory.find(i => i.id === gemItemId && i.type === 'gem' && i.gemId);
    const gem = gemItem ? OFFICIAL_GEMS.find(g => g.id === gemItem.gemId) : null;
    if (!equipmentItem || !gemItem || !gem) return false;
    const sockets = int(equipmentItem.equipment.sockets, 0, 4, 0);
    const filled = Array.isArray(equipmentItem.equipment.socketedGems) ? equipmentItem.equipment.socketedGems : [];
    if (sockets <= filled.length) return false;
    equipmentItem.equipment.socketedGems = [...filled, gem.id];
    gemItem.quantity--;
    if (gemItem.quantity <= 0) player.inventory = player.inventory.filter(i => i.id !== gemItem.id);
    return true;
  }
''', r'''  craft(player, recipeId) {
    return officialInventoryEconomyDomain.craft(player, recipeId);
  }

  socketGem(player, itemId, gemItemId) {
    return officialInventoryEconomyDomain.socketGem(player, itemId, gemItemId);
  }
''', 'craft/socket methods'),
(r'''  buyCoinItem(player, itemId, contentItems = []) {
    const s = this.ensurePlayer(player);
    const entry = OFFICIAL_COIN_STORE.find(item => item.id === itemId);
    if (!entry || s.coins < entry.price) return false;
    if (entry.id === 'title_shadow' && s.titles.owned.includes('Shadow Walker')) return false;
    s.coins -= entry.price;
    if (entry.id === 'supplies') {
      addItem(player, { name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 5, value: 50 });
      addItem(player, { name: 'Mana Potion', icon: '🧴', type: 'potion', quantity: 5, value: 50 });
    } else if (entry.id === 'equipment_cache') {
      const pool = buildEquipmentLootPool(contentItems).filter(item => (item.level || 1) <= player.level + 3);
      if (!pool.length) { s.coins += entry.price; return false; }
      const sorted = pool.sort((a, b) => Math.abs((a.level || 1) - player.level) - Math.abs((b.level || 1) - player.level)).slice(0, 8);
      const reward = sorted[Math.floor(Math.random() * sorted.length)];
      addItem(player, { name: reward.name, icon: reward.icon, type: 'equipment', quantity: 1, value: reward.value || 0, rarity: reward.rarity, description: reward.description, equipment: { ...reward, sockets: Math.random() < 0.35 ? 1 : 0, socketedGems: [] } });
    } else if (entry.id === 'blessing') {
      s.blessingsUntil = Math.max(Date.now(), s.blessingsUntil) + 60 * 60_000;
    } else if (entry.id === 'title_shadow') {
      s.titles.owned.push('Shadow Walker'); s.titles.active = 'Shadow Walker';
    }
    return true;
  }
''', r'''  buyCoinItem(player, itemId, contentItems = []) {
    return officialInventoryEconomyDomain.buyCoinItem(this, player, itemId, contentItems);
  }
''', 'coin store method'),
]
for old, new, label in pairs:
    text = replace_once(text, old, new, label)
write(path, text)

TEST = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { OfficialInventoryEconomyDomain, INVENTORY_ECONOMY_RULES } from '../engine/OfficialInventoryEconomyDomain.mjs';

function player(level = 20) {
  return {
    level, gold: 5000, bankGold: 1000, buffs: [], reputation: { town: 0 }, inventory: [],
    official: { depot: [], pets: { owned: [], active: null }, coins: 500, blessingsUntil: 0, titles: { owned: [], active: null } },
  };
}
const host = {
  ensurePlayer(p) { return p.official; },
  getReputationDiscount(p) { return p.reputation.town >= 3000 ? 0.05 : 0; },
};

test('inventory economy depot is capped and round-trips ownership', () => {
  const domain = new OfficialInventoryEconomyDomain();
  const p = player();
  p.inventory.push({ id: 'sword1', name: 'Sword', type: 'equipment', quantity: 1, equipment: { slot: 'weapon' } });
  assert.equal(domain.depotPut(host, p, 'sword1', 1000), true);
  assert.equal(p.inventory.length, 0);
  assert.equal(p.official.depot.length, 1);
  const depotId = p.official.depot[0].depotId;
  assert.equal(domain.depotTake(host, p, depotId, 2000), true);
  assert.equal(p.official.depot.length, 0);
  assert.equal(p.inventory[0].name, 'Sword');
  p.official.depot = Array.from({ length: INVENTORY_ECONOMY_RULES.depotCapacity }, (_, i) => ({ depotId: `d${i}` }));
  p.inventory.push({ id: 'x', name: 'X', type: 'misc', quantity: 1 });
  assert.equal(domain.depotPut(host, p, 'x'), false);
});

test('inventory economy bank transfers are bounded and conserve gold', () => {
  const domain = new OfficialInventoryEconomyDomain();
  const p = player();
  const total = p.gold + p.bankGold;
  assert.equal(domain.bank(p, 'deposit', 500), true);
  assert.equal(domain.bank(p, 'withdraw', 250), true);
  assert.equal(p.gold + p.bankGold, total);
  assert.equal(domain.bank(p, 'deposit', -1), false);
  assert.equal(domain.bank(p, 'withdraw', INVENTORY_ECONOMY_RULES.maxBankTransfer + 1), false);
});

test('inventory economy pet purchase enforces level gold ownership and activation', () => {
  const domain = new OfficialInventoryEconomyDomain();
  const p = player(20);
  assert.equal(domain.buyPet(host, p, 'wolf_pup'), true);
  assert.equal(p.official.pets.owned.includes('wolf_pup'), true);
  assert.equal(domain.buyPet(host, p, 'wolf_pup'), false);
  assert.equal(domain.togglePet(host, p, 'wolf_pup'), true);
  assert.equal(p.official.pets.active, 'wolf_pup');
  assert.equal(domain.togglePet(host, p, 'not-owned'), false);
});

test('inventory economy shop honors authoritative reputation discount and quantity cap', () => {
  const domain = new OfficialInventoryEconomyDomain();
  const p = player();
  p.reputation.town = 3000;
  const before = p.gold;
  assert.equal(domain.buyShop(host, p, 'health_potion', 2), true);
  assert.equal(p.gold, before - 47 * 2);
  assert.equal(p.inventory.find(i => i.name === 'Health Potion').quantity, 2);
  const p2 = player(); p2.gold = 1_000_000;
  domain.buyShop(host, p2, 'health_potion', 999);
  assert.equal(p2.inventory.find(i => i.name === 'Health Potion').quantity, INVENTORY_ECONOMY_RULES.maxShopQuantity);
});

test('inventory economy food replaces same buff type and removes expired buffs', () => {
  const domain = new OfficialInventoryEconomyDomain();
  const p = player();
  const now = 100000;
  p.buffs = [{ id: 'expired', type: 'other', expiresAt: now - 1 }, { id: 'old', type: 'official_attack', expiresAt: now + 1000 }];
  assert.equal(domain.buyFood(p, 'war_stew', now), true);
  assert.equal(p.buffs.length, 1);
  assert.equal(p.buffs[0].type, 'official_attack');
  assert.equal(p.buffs[0].expiresAt, now + INVENTORY_ECONOMY_RULES.foodDurationMs);
});

test('inventory economy crafting validates all ingredients before consuming anything', () => {
  const domain = new OfficialInventoryEconomyDomain();
  const p = player();
  p.inventory = [{ id: 'c1', name: 'Cheese', type: 'material', quantity: 1 }];
  assert.equal(domain.craft(p, 'health_potion', 1000), false);
  assert.equal(p.inventory[0].quantity, 1);
  p.inventory[0].quantity = 2;
  assert.equal(domain.craft(p, 'health_potion', 1000), true);
  assert.equal(p.inventory.some(i => i.name === 'Cheese'), false);
  assert.equal(p.inventory.some(i => i.name === 'Health Potion'), true);
});

test('inventory economy socketing consumes owned gem and respects socket capacity', () => {
  const domain = new OfficialInventoryEconomyDomain();
  const p = player();
  p.inventory = [
    { id: 'armor', name: 'Armor', type: 'equipment', quantity: 1, equipment: { sockets: 1, socketedGems: [] } },
    { id: 'gem', name: 'Ruby', type: 'gem', gemId: 'ruby_t1', quantity: 1 },
  ];
  assert.equal(domain.socketGem(p, 'armor', 'gem'), true);
  assert.deepEqual(p.inventory.find(i => i.id === 'armor').equipment.socketedGems, ['ruby_t1']);
  assert.equal(p.inventory.some(i => i.id === 'gem'), false);
  p.inventory.push({ id: 'gem2', name: 'Ruby', type: 'gem', gemId: 'ruby_t1', quantity: 1 });
  assert.equal(domain.socketGem(p, 'armor', 'gem2'), false);
});

test('inventory economy coin sinks are atomic and refund failed equipment cache', () => {
  const domain = new OfficialInventoryEconomyDomain();
  const p = player();
  const before = p.official.coins;
  assert.equal(domain.buyCoinItem(host, p, 'equipment_cache', [], 1000), false);
  assert.equal(p.official.coins, before);
  assert.equal(domain.buyCoinItem(host, p, 'supplies', [], 1000), true);
  assert.equal(p.inventory.find(i => i.name === 'Health Potion').quantity, 5);
  const afterSupplies = p.official.coins;
  assert.equal(domain.buyCoinItem(host, p, 'blessing', [], 2000), true);
  assert.equal(p.official.blessingsUntil, 2000 + INVENTORY_ECONOMY_RULES.blessingDurationMs);
  assert.ok(p.official.coins < afterSupplies);
});
'''
write('server/test/official-inventory-economy-domain.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.10 — Inventory & Economy Domain

Foundation 7.10 extracts player-side economic services into `OfficialInventoryEconomyDomain`.

The domain owns pets, depot capacity/transfers, bank transfers, vendor food buffs, reputation-priced shop purchases, crafting, gem sockets and coin-store sinks. It keeps authoritative validation and atomic failure semantics while `OfficialSystems` remains a compatibility façade.

This boundary provides a scalable base for additional vendors, currencies, crafting professions, recipes, account storage, guild banks, repair systems, salvage, bind rules and richer item sinks without coupling those features to PvP, dungeons or world events.
'''
write('docs/FOUNDATION_7_10_INVENTORY_ECONOMY.md', DOC)
print('Foundation 7.10 inventory/economy domain extraction applied')
