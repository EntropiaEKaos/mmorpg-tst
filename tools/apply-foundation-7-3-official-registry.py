from pathlib import Path

ROOT = Path('.')
def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(path, old, new):
    text = read(path)
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}: {old[:140]!r}')
    write(path, text.replace(old, new, 1))

replace_once('server/engine/OfficialSystems.mjs',
"import { buildEquipmentLootPool } from './Items.mjs';",
"import { buildEquipmentLootPool } from './Items.mjs';\nimport { executeOfficialAction, getOfficialActionService, hasOfficialAction } from './OfficialActionRegistry.mjs';")

replace_once('server/engine/OfficialSystems.mjs',
"const SERVICE_RULES = Object.freeze({\n  bank_deposit: { npcId: 'banker', label: 'Banker' },\n  bank_withdraw: { npcId: 'banker', label: 'Banker' },\n  rest: { npcId: 'innkeeper', label: 'Innkeeper' },\n  train: { npcId: 'trainer', label: 'Trainer' },\n  food_buy: { npcId: 'innkeeper', label: 'Innkeeper' },\n  shop_buy: { npcId: 'merchant_gorn', label: 'Merchant' },\n});\n\n",
"")

replace_once('server/engine/OfficialSystems.mjs',
"  serviceProximity(player, action, npcs = []) {\n    const rule = SERVICE_RULES[action];\n    if (!rule) return { ok: true, npc: null };",
"  serviceProximity(player, action, npcs = []) {\n    const rule = getOfficialActionService(action);\n    if (!rule) return { ok: true, npc: null };")

old_handle = """  handle(player, payload, ctx = {}) {
    const action = cleanText(payload?.action, 80);
    const proximity = this.serviceProximity(player, action, ctx.contentNpcs || []);
    if (!proximity.ok) return { ok: false, error: proximity.error || 'Move near the required NPC.' };
    let ok = false;
    let detail = null;
    if (action === 'pet_buy') ok = this.buyPet(player, payload.petId);
    else if (action === 'pet_toggle') ok = this.togglePet(player, payload.petId ?? null);
    else if (action === 'depot_put') ok = this.depotPut(player, payload.itemId);
    else if (action === 'depot_take') ok = this.depotTake(player, payload.depotId);
    else if (action === 'bank_deposit') ok = this.bank(player, 'deposit', payload.amount);
    else if (action === 'bank_withdraw') ok = this.bank(player, 'withdraw', payload.amount);
    else if (action === 'rest') ok = this.rest(player);
    else if (action === 'train') ok = this.train(player);
    else if (action === 'food_buy') ok = this.buyFood(player, payload.foodId);
    else if (action === 'shop_buy') ok = this.buyShop(player, payload.itemId, payload.quantity);
    else if (action === 'craft') ok = this.craft(player, payload.recipeId);
    else if (action === 'socket_gem') ok = this.socketGem(player, payload.itemId, payload.gemItemId);
    else if (action === 'daily_claim') { detail = this.claimDaily(player); ok = Boolean(detail); }
    else if (action === 'gather') { detail = this.gather(player, ctx.world); ok = Boolean(detail); }
    else if (action === 'book_read') ok = this.readBook(player, payload.bookId);
    else if (action === 'mystery_answer') { detail = this.answerMystery(player, payload.mysteryId, payload.answer); ok = detail.ok; }
    else if (action === 'coin_buy') ok = this.buyCoinItem(player, payload.itemId, ctx.contentItems || []);
    else if (action === 'auction_list') ok = this.listAuction(player, payload.itemId, payload.price);
    else if (action === 'auction_buy') ok = this.buyAuction(player, payload.listingId, ctx.findOnlinePlayer);
    else if (action === 'auction_cancel') ok = this.cancelAuction(player, payload.listingId);
    else if (action === 'mail_send') ok = this.sendMail(player, payload, ctx.characterExists);
    else if (action === 'mail_read' || action === 'mail_claim' || action === 'mail_delete') ok = this.markMail(player, payload.mailId, action.replace('mail_', ''));
    else if (action === 'world_event_claim') { detail = this.claimWorldEvent(player); ok = Boolean(detail); }
    else if (action === 'pvp_toggle') { detail = this.pvpToggle(player); ok = true; }
    else if (action === 'pvp_attack') { detail = this.pvpAttack(player, ctx.getPlayer?.(payload.targetId), ctx.getDerivedStats); ok = Boolean(detail); }
    else if (action === 'dungeon_start') { detail = this.startDungeon(player, payload.waves); ok = detail.ok; if (ok) ctx.startDungeon?.(detail); }
    else if (action === 'dungeon_abandon') { ok = this.abandonDungeon(player); if (ok) ctx.clearDungeon?.(); }
    else return { ok: false, error: 'Unknown official action.' };

    if (ok) this.refreshAchievements(player);
    return { ok, detail, action, error: ok ? null : 'Action rejected by authoritative server.' };
  }
"""
new_handle = """  handle(player, payload, ctx = {}) {
    const action = cleanText(payload?.action, 80);
    if (!hasOfficialAction(action)) return { ok: false, error: 'Unknown official action.' };
    const proximity = this.serviceProximity(player, action, ctx.contentNpcs || []);
    if (!proximity.ok) return { ok: false, error: proximity.error || 'Move near the required NPC.' };

    const result = executeOfficialAction(this, player, action, payload, ctx);
    const ok = Boolean(result?.ok);
    const detail = result?.detail ?? null;
    if (ok) this.refreshAchievements(player);
    return { ok, detail, action, error: ok ? null : 'Action rejected by authoritative server.' };
  }
"""
replace_once('server/engine/OfficialSystems.mjs', old_handle, new_handle)

TEST = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import {
  OFFICIAL_ACTION_NAMES, executeOfficialAction, getOfficialActionService, hasOfficialAction,
} from '../engine/OfficialActionRegistry.mjs';

const EXPECTED = [
  'pet_buy','pet_toggle','depot_put','depot_take','bank_deposit','bank_withdraw','rest','train','food_buy','shop_buy',
  'craft','socket_gem','daily_claim','gather','book_read','mystery_answer','coin_buy','auction_list','auction_buy','auction_cancel',
  'mail_send','mail_read','mail_claim','mail_delete','world_event_claim','pvp_toggle','pvp_attack','dungeon_start','dungeon_abandon',
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
  assert.deepEqual(getOfficialActionService('shop_buy'), { npcId: 'merchant_gorn', label: 'Merchant' });
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
        return true;
      };
    },
  });
  const player = { id: 'p1', name: 'Registry Tester' };
  const sideEffects = { start: 0, clear: 0 };
  const ctx = {
    world: {}, contentItems: [], findOnlinePlayer: () => null, characterExists: () => true,
    getPlayer: () => ({ id: 'target' }), getDerivedStats: () => ({}),
    startDungeon: () => { sideEffects.start++; }, clearDungeon: () => { sideEffects.clear++; },
  };
  const payload = {
    petId: 'pet', itemId: 'item', depotId: 'depot', amount: 1, foodId: 'food', quantity: 1, recipeId: 'recipe',
    gemItemId: 'gem', bookId: 'book', mysteryId: 'mystery', answer: 'answer', price: 1, listingId: 'listing',
    mailId: 'mail', targetId: 'target', waves: 3,
  };
  for (const action of EXPECTED) {
    const result = executeOfficialAction(systems, player, action, payload, ctx);
    assert.equal(result?.ok, true, action);
  }
  assert.equal(sideEffects.start, 1);
  assert.equal(sideEffects.clear, 1);
  assert.equal(executeOfficialAction(systems, player, 'missing', payload, ctx), null);
  assert.ok(calls.length >= EXPECTED.length - 1);
});
'''
write('server/test/official-action-registry.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.3 — Official Action Extensibility

Foundation 7.3 removes the transport-action dispatch bottleneck from `OfficialSystems`.

## Declarative registry

`server/engine/OfficialActionRegistry.mjs` is now the single dispatch catalog for official server actions. Each action declares:

- its execution adapter;
- optional NPC service/proximity metadata;
- contextual dependencies such as world, player lookup, content items or dungeon callbacks.

`OfficialSystems.handle()` now performs only four responsibilities: normalize the action, reject unknown actions, enforce declared service proximity, execute the registry entry and refresh achievements after success.

This means a future official feature no longer requires extending a long `if/else` chain. The registry test also owns the explicit public action inventory, making accidental protocol drift visible in CI.

## Behavior preservation

The refactor intentionally preserves all existing action names and method calls for pets, depot, bank, inn, training, shop, crafting, gems, daily rewards, gathering, books, mysteries, coin store, auction, mail, world events, PvP and dungeons.

NPC-gated actions remain banker/innkeeper/trainer/merchant scoped exactly as before.
'''
write('docs/FOUNDATION_7_3_EXTENSIBILITY.md', DOC)

print('Foundation 7.3 official action registry migration applied')
