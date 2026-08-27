// ===================================================================
// MOR'IA — OFFICIAL INVENTORY & ECONOMY DOMAIN
// Owns player-side storage, vendors, crafting, sockets, pets and coin sinks.
// ===================================================================

import { buildEquipmentLootPool } from './Items.mjs';
import { rollEquipmentAffixes } from './Itemization.mjs';
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
    const amount = Number(rawAmount);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > INVENTORY_ECONOMY_RULES.maxBankTransfer) return false;
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
      const baseReward = sorted[Math.floor(Math.random() * sorted.length)];
      const reward = rollEquipmentAffixes(baseReward, player.level, Math.random);
      addItem(player, {
        name: reward.name, icon: reward.icon, type: 'equipment', quantity: 1,
        value: reward.value || 0, rarity: reward.rarity, description: reward.description,
        equipment: { ...reward, sockets: reward.rarity === 'legendary' || Math.random() < 0.35 ? 1 : 0, socketedGems: [] },
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
