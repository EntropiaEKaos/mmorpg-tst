import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { OfficialSystems } from '../engine/OfficialSystems.mjs';

function createSystem() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-official-'));
  const db = path.join(dir, 'official.json');
  const systems = new OfficialSystems(db);
  return { systems, dir };
}

function player(name = 'Tester') {
  return {
    id: `p_${name}`, name, level: 20, xp: 0, xpNext: 1000,
    gold: 20000, bankGold: 0, hp: 300, maxHp: 300, mana: 150, maxMana: 150,
    attack: 50, defense: 20, magic: 10, mapId: 'eldoria', x: 40, y: 40,
    inventory: [
      { id: 'hp', name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 3, value: 50 },
      { id: 'cheese', name: 'Cheese', icon: '🧀', type: 'material', quantity: 4, value: 15 },
      { id: 'ore', name: 'Ore', icon: '⛏', type: 'material', quantity: 2, value: 15 },
      { id: 'socket_sword', name: 'Socket Sword', icon: '⚔', type: 'equipment', quantity: 1, value: 100, equipment: { id: 'socket_sword', name: 'Socket Sword', icon: '⚔', slot: 'weapon', attack: 10, sockets: 1, socketedGems: [] } },
      { id: 'gem', name: 'Chipped Ruby', icon: '🔴', type: 'gem', gemId: 'ruby_t1', quantity: 1, value: 100 },
    ],
    equipment: {}, buffs: [], professions: {},
    stats: { monstersKilled: 0, goldEarned: 0, deaths: 0 },
  };
}

test('depot is authoritative, capped and round-trips items', () => {
  const { systems, dir } = createSystem();
  const p = player(); systems.restorePlayer(p, null);
  assert.equal(systems.depotPut(p, 'hp'), true);
  assert.equal(p.inventory.some(i => i.id === 'hp'), false);
  assert.equal(p.official.depot.length, 1);
  const depotId = p.official.depot[0].depotId;
  assert.equal(systems.depotTake(p, depotId), true);
  assert.equal(p.official.depot.length, 0);
  assert.equal(p.inventory.some(i => i.name === 'Health Potion'), true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('pets cost server gold, require ownership and add combat damage', () => {
  const { systems, dir } = createSystem();
  const p = player(); systems.restorePlayer(p, null);
  const before = p.gold;
  assert.equal(systems.buyPet(p, 'wolf_pup'), true);
  assert.equal(p.gold, before - 500);
  assert.equal(systems.togglePet(p, 'wolf_pup'), true);
  const assist = systems.getPetDamage(p, { defense: 3 });
  assert.equal(assist.pet.id, 'wolf_pup');
  assert.ok(assist.damage > 0);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('auction removes seller item, transfers buyer gold and persists seller credit', () => {
  const { systems, dir } = createSystem();
  const seller = player('Seller'); const buyer = player('Buyer');
  systems.restorePlayer(seller, null); systems.restorePlayer(buyer, null);
  assert.equal(systems.listAuction(seller, 'hp', 321), true);
  assert.equal(seller.inventory.some(i => i.id === 'hp'), false);
  const listing = systems.global.auctions[0];
  const buyerGold = buyer.gold;
  assert.equal(systems.buyAuction(buyer, listing.id), true);
  assert.equal(buyer.gold, buyerGold - 321);
  assert.equal(buyer.inventory.some(i => i.name === 'Health Potion'), true);
  assert.equal(systems.global.credits.seller, 321);
  systems.onLogin(seller);
  assert.ok(seller.gold >= 321);
  assert.equal(systems.global.credits.seller, undefined);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('mail attachment is deducted from sender and claimed exactly once', () => {
  const { systems, dir } = createSystem();
  const a = player('Alice'); const b = player('Bob');
  systems.restorePlayer(a, null); systems.restorePlayer(b, null);
  const before = a.gold;
  assert.equal(systems.sendMail(a, { target: 'Bob', subject: 'Hi', body: 'Take this', gold: 50 }), true);
  assert.equal(a.gold, before - 55);
  const mail = systems.global.mail.find(m => m.to === 'bob');
  const bobGold = b.gold;
  assert.equal(systems.markMail(b, mail.id, 'claim'), true);
  assert.equal(b.gold, bobGold + 50);
  assert.equal(systems.markMail(b, mail.id, 'claim'), false);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('crafting and gem socketing consume real inventory resources', () => {
  const { systems, dir } = createSystem();
  const p = player(); systems.restorePlayer(p, null);
  assert.equal(systems.craft(p, 'health_potion'), true);
  assert.equal(p.inventory.find(i => i.name === 'Cheese')?.quantity, 2);
  assert.equal(systems.socketGem(p, 'socket_sword', 'gem'), true);
  const sword = p.inventory.find(i => i.id === 'socket_sword');
  assert.deepEqual(sword.equipment.socketedGems, ['ruby_t1']);
  assert.equal(p.inventory.some(i => i.id === 'gem'), false);
  const stats = { totalAttack: 10, totalDefense: 0, totalMagic: 0, totalMaxHp: 100, totalMaxMana: 50, critChance: 0, lifesteal: 0, thorns: 0, moveSpeed: 0, xpBonus: 0, goldBonus: 0, damageReduction: 0 };
  p.equipment.weapon = sword.equipment;
  systems.applyDerivedBonuses(p, stats);
  assert.equal(stats.totalAttack, 13);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('mystery answers are server-validated and reward only on final chapter', () => {
  const { systems, dir } = createSystem();
  const p = player(); systems.restorePlayer(p, null);
  assert.equal(systems.answerMystery(p, 'lost_tome', 'wrong').ok, false);
  assert.equal(systems.answerMystery(p, 'lost_tome', 'lightning').completed, false);
  assert.equal(systems.answerMystery(p, 'lost_tome', 'artichoke').completed, false);
  const gold = p.gold; const result = systems.answerMystery(p, 'lost_tome', 'moria');
  assert.equal(result.completed, true);
  assert.equal(p.gold, gold + 500);
  assert.equal(systems.answerMystery(p, 'lost_tome', 'moria').ok, false);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('daily reward cannot be claimed twice and stamina affects XP multiplier', () => {
  const { systems, dir } = createSystem();
  const p = player(); systems.restorePlayer(p, null);
  const now = Date.parse('2026-08-26T12:00:00Z');
  assert.ok(systems.claimDaily(p, now));
  assert.equal(systems.claimDaily(p, now), false);
  p.official.stamina = 2500;
  assert.ok(systems.getXpMultiplier(p) > 1);
  p.official.stamina = 100;
  assert.ok(systems.getXpMultiplier(p) < 1);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('world event records authoritative kills and queues participant reward', () => {
  const { systems, dir } = createSystem();
  const p = player(); systems.restorePlayer(p, null);
  systems.global.event = { id: 'test', name: 'Test Tide', icon: '🐀', mapId: 'eldoria', target: 'rat', needed: 1, progress: 0, rewardGold: 10, rewardXp: 20, rewardCoins: 3, participants: {}, completed: false, startedAt: Date.now(), expiresAt: Date.now() + 60000, completedAt: 0 };
  systems.onMonsterKill(p, { name: 'Rat', type: 'normal' });
  assert.equal(systems.global.event.completed, true);
  assert.equal(systems.global.eventRewards.tester.length, 1);
  const before = p.gold;
  assert.ok(systems.claimWorldEvent(p));
  assert.equal(p.gold, before + 10);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('dungeon progression advances waves and grants final authoritative rewards', () => {
  const { systems, dir } = createSystem();
  const p = player(); systems.restorePlayer(p, null);
  const start = systems.startDungeon(p, 3);
  assert.equal(start.ok, true);
  for (let wave = 1; wave <= 3; wave++) {
    const count = systems.getDungeonWave(wave, p.level).count;
    for (let i = 0; i < count; i++) {
      const result = systems.onMonsterKill(p, { name: 'Dungeon Rat', type: 'normal', dungeonOwnerId: p.id, dungeonRunId: p.official.dungeon.runId });
      if (wave < 3 && i === count - 1) assert.equal(result.nextDungeonWave, wave + 1);
      if (wave === 3 && i === count - 1) assert.ok(result.dungeonComplete);
    }
  }
  assert.equal(p.official.dungeon.active, false);
  assert.equal(p.official.dungeon.highestWave, 3);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('PvP requires both players opted in and escalates server skull', () => {
  const { systems, dir } = createSystem();
  const a = player('Alice'); const b = player('Bob');
  systems.restorePlayer(a, null); systems.restorePlayer(b, null);
  assert.equal(systems.pvpAttack(a, b), null);
  systems.pvpToggle(a); systems.pvpToggle(b);
  const hit = systems.pvpAttack(a, b);
  assert.ok(hit?.damage > 0);
  assert.notEqual(a.official.pvp.skull, 'none');
  fs.rmSync(dir, { recursive: true, force: true });
});
