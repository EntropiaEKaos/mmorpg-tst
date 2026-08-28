import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OFFICIAL_ACTION_NAMES, executeOfficialAction, getOfficialActionService, hasOfficialAction,
} from '../engine/OfficialActionRegistry.mjs';

const EXPECTED = [
  'pet_buy','pet_toggle','depot_put','depot_take','bank_deposit','bank_withdraw','rest','train','food_buy','shop_buy',
  'craft','socket_gem','daily_claim','gather','book_read','mystery_answer','coin_buy','auction_list','auction_buy','auction_cancel',
  'mail_send','mail_read','mail_claim','mail_delete','world_event_claim','pvp_toggle','pvp_attack','dungeon_start','dungeon_abandon',
  'faction_join','faction_defect','node_donate','node_declare_war','node_attack','node_claim','craft_advanced','tame_animal','breed_animals','tame_activate',
  'profession_specialize','beast_care','beast_role','faction_treasury_donate','faction_vote','faction_diplomacy','bounty_place','siege_build','siege_use','dungeon_blueprint_start','dungeon_path','dungeon_puzzle','quest_consequence','housing_upgrade',
];

test('official registry contains every public authoritative action exactly once', () => {
  assert.deepEqual([...OFFICIAL_ACTION_NAMES].sort(), [...EXPECTED].sort());
  assert.equal(new Set(OFFICIAL_ACTION_NAMES).size, EXPECTED.length);
  for (const action of EXPECTED) assert.equal(hasOfficialAction(action), true, action);
  assert.equal(hasOfficialAction('admin_give_gold'), false);
});

test('official service proximity metadata is declarative and limited to NPC services', () => {
  assert.deepEqual(getOfficialActionService('bank_deposit'), { npcId: 'banker', label: 'Banker' });
  assert.deepEqual(getOfficialActionService('bank_withdraw'), { npcId: 'banker', label: 'Banker' });
  assert.deepEqual(getOfficialActionService('rest'), { npcId: 'innkeeper', label: 'Innkeeper' });
  assert.deepEqual(getOfficialActionService('train'), { npcId: 'trainer', label: 'Trainer' });
  assert.deepEqual(getOfficialActionService('food_buy'), { npcId: 'innkeeper', label: 'Innkeeper' });
  assert.deepEqual(getOfficialActionService('shop_buy'), { npcRole: 'merchant', label: 'Merchant' });
  assert.equal(getOfficialActionService('auction_buy'), null);
});

test('registry dispatch covers every action and preserves contextual side effects', () => {
  const calls = [];
  const systems = new Proxy({}, {
    get(_target, property) {
      return (...args) => {
        calls.push({ property: String(property), args });
        if (property === 'claimDaily') return { gold: 1 };
        if (property === 'gather') return { name: 'Ore' };
        if (property === 'answerMystery') return { ok: true, completed: false };
        if (property === 'claimWorldEvent') return { gold: 1 };
        if (property === 'pvpToggle') return false;
        if (property === 'pvpAttack') return { damage: 5 };
        if (property === 'startDungeon') return { ok: true, wave: 1 };
        if (['joinFaction','defectFaction','donateNode','declareNodeWar','attackNode','claimNode','advancedCraft','tameAnimal','breedAnimals','activateTamedAnimal','chooseProfessionSpecialization','careTamedAnimal','assignTamedAnimalRole','donateFactionTreasury','voteFactionLeader','setFactionDiplomacy','placeFactionBounty','buildSiegeAsset','useSiegeAsset','startDungeonBlueprint','chooseDungeonPath','solveDungeonPuzzleStep','applyQuestConsequence','buyHousingUpgrade'].includes(String(property))) return { ok:true };
        return true;
      };
    },
  });
  const player = { id: 'p1', name: 'Registry Tester' };
  const sideEffects = { start: 0, clear: 0 };
  const ctx = {
    world: {}, contentItems: [], findOnlinePlayer: () => null, characterExists: () => true,
    getPlayer: () => ({ id: 'target' }), getDerivedStats: () => ({}),
    startDungeon: () => { sideEffects.start++; }, clearDungeon: () => { sideEffects.clear++; }, nearbyMonsters: [],
  };
  const payload = {
    petId: 'pet', itemId: 'item', depotId: 'depot', amount: 1, foodId: 'food', quantity: 1, recipeId: 'recipe',
    gemItemId: 'gem', bookId: 'book', mysteryId: 'mystery', answer: 'answer', price: 1, listingId: 'listing',
    mailId: 'mail', targetId: 'target', waves: 3, factionId:'crown_eldoria', targetFactionId:'free_league', status:'allied', nodeId:'node_eldoria', parentAId:'a', parentBId:'b', animalId:'a', specId:'weaponsmith', kind:'feed', role:'scout', candidate:'Registry Tester', targetName:'Target', reward:500, assetId:'battering_ram', builtAssetId:'asset', blueprintId:'ironroot_depths', path:'roots', runeIndex:0, consequenceId:'ironwood_preserve', upgradeId:'home_workshop',
  };
  for (const action of EXPECTED) {
    const result = executeOfficialAction(systems, player, action, payload, ctx);
    assert.equal(result?.ok, true, action);
  }
  assert.ok(sideEffects.start >= 2);
  assert.equal(sideEffects.clear, 1);
  assert.equal(executeOfficialAction(systems, player, 'missing', payload, ctx), null);
  assert.ok(calls.length >= EXPECTED.length - 1);
});
