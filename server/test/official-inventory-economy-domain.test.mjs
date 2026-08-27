import test from 'node:test';
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
  assert.equal(domain.bank(p, 'deposit', 1.5), false);
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

test('inventory economy coin sinks are atomic on rejection and consume exactly once on success', () => {
  const domain = new OfficialInventoryEconomyDomain();
  const p = player();
  p.official.coins = 0;
  assert.equal(domain.buyCoinItem(host, p, 'supplies', [], 1000), false);
  assert.equal(p.official.coins, 0);
  assert.equal(p.inventory.length, 0);

  p.official.coins = 500;
  assert.equal(domain.buyCoinItem(host, p, 'equipment_cache', [], 1000), true);
  assert.equal(p.official.coins, 400);
  assert.equal(p.inventory.some(i => i.type === 'equipment'), true);

  assert.equal(domain.buyCoinItem(host, p, 'supplies', [], 1000), true);
  assert.equal(p.inventory.find(i => i.name === 'Health Potion').quantity, 5);
  const afterSupplies = p.official.coins;
  assert.equal(domain.buyCoinItem(host, p, 'blessing', [], 2000), true);
  assert.equal(p.official.blessingsUntil, 2000 + INVENTORY_ECONOMY_RULES.blessingDurationMs);
  assert.equal(p.official.coins, afterSupplies - 60);

  p.official.titles.owned.push('Shadow Walker');
  const beforeDuplicateTitle = p.official.coins;
  assert.equal(domain.buyCoinItem(host, p, 'title_shadow', [], 3000), false);
  assert.equal(p.official.coins, beforeDuplicateTitle);
});
