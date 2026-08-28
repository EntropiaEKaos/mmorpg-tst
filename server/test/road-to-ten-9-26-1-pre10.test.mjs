import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RoadToTenDomain, ROAD_TO_TEN_VERSION } from '../engine/RoadToTenDomain.mjs';
import { ROAD_TO_TEN_CONTENT } from '../engine/RoadToTenContent.mjs';
import { LIVING_REALM_CONTENT } from '../engine/LivingRealmContent.mjs';
import { freshPlayerState, freshGlobalState } from '../engine/OfficialStateSchema.mjs';
import { OfficialSystems } from '../engine/OfficialSystems.mjs';
import { OFFICIAL_ACTION_NAMES } from '../engine/OfficialActionRegistry.mjs';

function hostAndPlayer({ mapId='eldoria', factionId='crown_eldoria', level=40, gold=100000 } = {}) {
  const domain = new RoadToTenDomain();
  const nodeDef = LIVING_REALM_CONTENT.nodes.find(node => node.mapId === mapId) || LIVING_REALM_CONTENT.nodes[0];
  const global = freshGlobalState();
  global.livingRealm.nodes[nodeDef.id] = {
    id: nodeDef.id, xp: 2400, stage: 3, stageName: 'village', controllerFactionId: factionId,
    hp: 7000, maxHp: 7000, treasury: 1000, supply: 60, morale: 60, status: 'peace',
    attackerFactionId: null, declaredAt: 0, siegeStartsAt: 0, siegeEndsAt: 0, recoveryUntil: 0, lastChangedAt: 0,
  };
  const player = {
    id: 'engineer', name: 'Engineer', level, gold, mapId, x: nodeDef.x, y: nodeDef.y,
    attack: 80, defense: 30, hp: 500, maxHp: 500, mana: 200, maxMana: 200,
    inventory: [
      { id:'r1', name:'Ironbark Resin', type:'material', quantity:20 },
      { id:'m1', name:'Mana Crystal', type:'material', quantity:20 },
      { id:'s1', name:'Storm Core', type:'material', quantity:20 },
      { id:'t1', name:'Tide Pearl', type:'material', quantity:20 },
    ],
    quests: [], stats: { damageDealt:0, damageTaken:0, deaths:0, goldEarned:0 },
    official: freshPlayerState(),
  };
  player.official.livingRealm.faction.id = factionId;
  player.official.livingRealm.crafting.skills = {
    weaponsmithing:{level:25,xp:0}, armorsmithing:{level:25,xp:0}, enchanting:{level:25,xp:0}, siege_engineering:{level:25,xp:0},
  };
  const host = {
    global,
    livingRealmContent: {
      nodes: structuredClone(LIVING_REALM_CONTENT.nodes), factions: structuredClone(LIVING_REALM_CONTENT.factions),
      materials: structuredClone(LIVING_REALM_CONTENT.materials), craftingRecipes: structuredClone(LIVING_REALM_CONTENT.craftingRecipes),
      tamingSpecies: structuredClone(LIVING_REALM_CONTENT.tamingSpecies),
    },
    roadToTenContent: {},
    ensurePlayer(p) { return p.official; },
    save() { return true; },
    startDungeon(p, waves) {
      p.official.dungeon = { ...p.official.dungeon, active:true, runId:`test_run_${p.id}`, wave:1, maxWaves:waves, killsRemaining:1 };
      return { ok:true, runId:p.official.dungeon.runId, wave:1, maxWaves:waves };
    },
  };
  domain.syncContent(host, ROAD_TO_TEN_CONTENT);
  return { domain, host, player, nodeDef };
}

function combatant(name, { hp=500, attack=100, gold=1000 } = {}) {
  return {
    id: name.toLowerCase(), name, level:50, gold, bankGold:0, mapId:'eldoria', x:40, y:40,
    attack, defense:0, hp, maxHp:500, mana:100, maxMana:100, inventory:[], equipment:{}, buffs:[], professions:{},
    stats:{ damageDealt:0, damageTaken:0, deaths:0, goldEarned:0, monstersKilled:0 },
  };
}

test('9.26.1 identity is consistent at the Road-to-10 persistence boundary', () => {
  assert.equal(ROAD_TO_TEN_VERSION, '9.26.1');
  const { domain, host, player } = hostAndPlayer();
  assert.equal(domain.publicSnapshot(host, player).version, '9.26.1');
});

test('9.26.1 faction programs consume real activity and award influence on completion', () => {
  const { domain, host, player } = hostAndPlayer({ factionId:'crown_eldoria' });
  const program = ROAD_TO_TEN_CONTENT.factionPrograms.find(entry => entry.factionId === 'crown_eldoria');
  const trade = domain.recordTrade(host, player, program.target, 'buy', 'equipment', 100000);
  assert.equal(trade.ok, true);
  const state = host.global.roadToTen.politics.factions.crown_eldoria;
  assert.equal(state.objectiveCycle, 1);
  assert.equal(state.influence, program.rewardInfluence);
  assert.equal(state.weeklyProgress, 0);
  assert.ok(host.global.livingRealm.chronicle.some(entry => entry.type === 'faction_program'));
});

test('9.26.1 authoritative PvP death automatically pays matching bounties', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-pre10-pvp-'));
  const systems = new OfficialSystems(path.join(dir, 'official.json'));
  const issuer = combatant('Issuer', { gold:5000 });
  const killer = combatant('Hunter', { attack:2000, gold:100 });
  const target = combatant('Target', { hp:1, attack:1, gold:100 });
  systems.restorePlayer(issuer, null); systems.restorePlayer(killer, null); systems.restorePlayer(target, null);
  assert.equal(systems.placeFactionBounty(issuer, target.name, 500).ok, true);
  systems.pvpToggle(killer); systems.pvpToggle(target);
  const before = killer.gold;
  const hit = systems.pvpAttack(killer, target);
  assert.equal(hit?.killed, true);
  assert.equal(hit?.bounty?.reward, 500);
  assert.equal(killer.gold, before + 500);
  assert.equal(systems.global.roadToTen.politics.bounties[0].claimedBy, killer.name);
  fs.rmSync(dir, { recursive:true, force:true });
});

test('9.26.1 Auction House purchases feed the regional economy ledger', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-pre10-auction-'));
  const systems = new OfficialSystems(path.join(dir, 'official.json'));
  const seller = combatant('Seller', { gold:100 });
  const buyer = combatant('Buyer', { gold:5000 });
  seller.inventory = [{ id:'auction_ore', name:'Ore', type:'material', quantity:1, value:10 }];
  systems.restorePlayer(seller, null); systems.restorePlayer(buyer, null);
  assert.equal(systems.listAuction(seller, 'auction_ore', 1000), true);
  const listing = systems.global.auctions[0];
  const before = systems.global.roadToTen.economy.ledger.length;
  assert.equal(systems.buyAuction(buyer, listing.id, () => seller), true);
  assert.equal(systems.global.roadToTen.economy.ledger.length, before + 1);
  const entry = systems.global.roadToTen.economy.ledger.at(-1);
  assert.equal(entry.category, 'auction');
  assert.equal(entry.value, 1000);
  assert.equal(entry.mapId, 'eldoria');
  fs.rmSync(dir, { recursive:true, force:true });
});

test('9.26.1 dungeon puzzle is server-owned and unlocks only after the deterministic rune sequence', () => {
  const { domain, host, player } = hostAndPlayer({ mapId:'ironwood', level:30 });
  host.global.livingRealm.nodes.node_ironwood.stage = 3;
  const started = domain.startDungeonBlueprint(host, player, 'ironroot_depths', 200000);
  assert.equal(started.ok, true);
  assert.equal(domain.isDungeonPuzzlePending(host, player), true);
  const runId = player.official.dungeon.runId;
  const seed = `${started.blueprint.id}:${runId}`.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const sequence = [0,1,2].map((_, index) => (seed + index * 3 + index * index) % 4);
  const wrong = domain.solveDungeonPuzzleStep(host, player, (sequence[0] + 1) % 4);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.progress, 0);
  for (let index = 0; index < sequence.length; index++) {
    const step = domain.solveDungeonPuzzleStep(host, player, sequence[index]);
    assert.equal(step.correct, true);
    assert.equal(step.progress, index + 1);
  }
  assert.equal(player.official.roadToTen.dungeon.puzzleSolved, true);
  assert.equal(domain.isDungeonPuzzlePending(host, player), false);
  assert.equal(OFFICIAL_ACTION_NAMES.filter(name => name === 'dungeon_puzzle').length, 1);
});

test('9.26.1 housing services alter real market and siege calculations', () => {
  const market = hostAndPlayer({ mapId:'eldoria' });
  const beforePrice = market.domain.integrationModifiers(market.host, market.player, 300000).priceMultiplier;
  assert.equal(market.domain.buyHousingUpgrade(market.host, market.player, 'home_shopfront', 'house_alpha', 300001).ok, true);
  const afterPrice = market.domain.integrationModifiers(market.host, market.player, 300002).priceMultiplier;
  assert.ok(afterPrice < beforePrice, `${afterPrice} should be below ${beforePrice}`);

  const siege = hostAndPlayer({ mapId:'frostpeak', factionId:'red_pact', gold:100000 });
  const node = siege.host.global.livingRealm.nodes[siege.nodeDef.id];
  node.controllerFactionId = 'crown_eldoria'; node.attackerFactionId = 'red_pact'; node.status = 'siege';
  const plain = siege.domain.buildSiegeAsset(siege.host, siege.player, siege.nodeDef.id, 'battering_ram', 310000);
  assert.equal(plain.ok, true);
  assert.equal(siege.domain.buyHousingUpgrade(siege.host, siege.player, 'siege_foundry', 'house_alpha', 310001).ok, true);
  const forged = siege.domain.buildSiegeAsset(siege.host, siege.player, siege.nodeDef.id, 'battering_ram', 310002);
  assert.equal(forged.ok, true);
  assert.ok(forged.asset.durability > plain.asset.durability);
});

test('9.26.1 blueprint boss identity is wired into authoritative dungeon spawning', () => {
  const source = fs.readFileSync(new URL('../engine/GameState.mjs', import.meta.url), 'utf8');
  assert.match(source, /finalBlueprintBoss \? roadDungeon\.boss : wave\.name/);
  assert.match(source, /roadDungeon\.icon \|\| wave\.emoji/);
});
