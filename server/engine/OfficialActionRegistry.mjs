// ===================================================================
// MOR'IA — OFFICIAL ACTION REGISTRY
// Keeps transport-facing action dispatch declarative so new official systems
// can be added without growing OfficialSystems.handle() into another monolith.
// ===================================================================

const SERVICE = Object.freeze({
  banker: Object.freeze({ npcId: 'banker', label: 'Banker' }),
  innkeeper: Object.freeze({ npcId: 'innkeeper', label: 'Innkeeper' }),
  trainer: Object.freeze({ npcId: 'trainer', label: 'Trainer' }),
  merchant: Object.freeze({ npcId: 'merchant_gorn', label: 'Merchant' }),
});

function bool(value) { return { ok: Boolean(value), detail: null }; }
function detail(value) { return { ok: Boolean(value), detail: value ?? null }; }
function detailWithOk(value) { return { ok: Boolean(value?.ok), detail: value ?? null }; }

const ACTIONS = Object.freeze({
  pet_buy: {
    run: (systems, player, payload) => bool(systems.buyPet(player, payload.petId)),
  },
  pet_toggle: {
    run: (systems, player, payload) => bool(systems.togglePet(player, payload.petId ?? null)),
  },
  depot_put: {
    run: (systems, player, payload) => bool(systems.depotPut(player, payload.itemId)),
  },
  depot_take: {
    run: (systems, player, payload) => bool(systems.depotTake(player, payload.depotId)),
  },
  bank_deposit: {
    service: SERVICE.banker,
    run: (systems, player, payload) => bool(systems.bank(player, 'deposit', payload.amount)),
  },
  bank_withdraw: {
    service: SERVICE.banker,
    run: (systems, player, payload) => bool(systems.bank(player, 'withdraw', payload.amount)),
  },
  rest: {
    service: SERVICE.innkeeper,
    run: (systems, player) => bool(systems.rest(player)),
  },
  train: {
    service: SERVICE.trainer,
    run: (systems, player) => bool(systems.train(player)),
  },
  food_buy: {
    service: SERVICE.innkeeper,
    run: (systems, player, payload) => bool(systems.buyFood(player, payload.foodId)),
  },
  shop_buy: {
    service: SERVICE.merchant,
    run: (systems, player, payload, ctx) => bool(systems.buyShop(player, payload.itemId, payload.quantity, ctx.contentShops || [], ctx.contentItems || [])),
  },
  craft: {
    run: (systems, player, payload) => bool(systems.craft(player, payload.recipeId)),
  },
  socket_gem: {
    run: (systems, player, payload) => bool(systems.socketGem(player, payload.itemId, payload.gemItemId)),
  },
  daily_claim: {
    run: (systems, player) => detail(systems.claimDaily(player)),
  },
  gather: {
    run: (systems, player, _payload, ctx) => detail(systems.gather(player, ctx.world)),
  },
  book_read: {
    run: (systems, player, payload) => bool(systems.readBook(player, payload.bookId)),
  },
  mystery_answer: {
    run: (systems, player, payload) => detailWithOk(systems.answerMystery(player, payload.mysteryId, payload.answer)),
  },
  coin_buy: {
    run: (systems, player, payload, ctx) => bool(systems.buyCoinItem(player, payload.itemId, ctx.contentItems || [])),
  },
  auction_list: {
    run: (systems, player, payload) => bool(systems.listAuction(player, payload.itemId, payload.price)),
  },
  auction_buy: {
    run: (systems, player, payload, ctx) => bool(systems.buyAuction(player, payload.listingId, ctx.findOnlinePlayer)),
  },
  auction_cancel: {
    run: (systems, player, payload) => bool(systems.cancelAuction(player, payload.listingId)),
  },
  mail_send: {
    run: (systems, player, payload, ctx) => bool(systems.sendMail(player, payload, ctx.characterExists)),
  },
  mail_read: {
    run: (systems, player, payload) => bool(systems.markMail(player, payload.mailId, 'read')),
  },
  mail_claim: {
    run: (systems, player, payload) => bool(systems.markMail(player, payload.mailId, 'claim')),
  },
  mail_delete: {
    run: (systems, player, payload) => bool(systems.markMail(player, payload.mailId, 'delete')),
  },
  world_event_claim: {
    run: (systems, player) => detail(systems.claimWorldEvent(player)),
  },
  pvp_toggle: {
    run: (systems, player) => ({ ok: true, detail: systems.pvpToggle(player) }),
  },
  pvp_attack: {
    run: (systems, player, payload, ctx) => detail(systems.pvpAttack(player, ctx.getPlayer?.(payload.targetId), ctx.getDerivedStats)),
  },
  dungeon_start: {
    run: (systems, player, payload, ctx) => {
      const result = systems.startDungeon(player, payload.waves);
      if (result?.ok) ctx.startDungeon?.(result);
      return detailWithOk(result);
    },
  },
  dungeon_abandon: {
    run: (systems, player, _payload, ctx) => {
      const ok = Boolean(systems.abandonDungeon(player));
      if (ok) ctx.clearDungeon?.();
      return { ok, detail: null };
    },
  },
});

export const OFFICIAL_ACTION_NAMES = Object.freeze(Object.keys(ACTIONS));

export function hasOfficialAction(action) {
  return typeof action === 'string' && Object.hasOwn(ACTIONS, action);
}

export function getOfficialActionService(action) {
  const service = hasOfficialAction(action) ? ACTIONS[action].service : null;
  return service ? { ...service } : null;
}

export function executeOfficialAction(systems, player, action, payload = {}, ctx = {}) {
  if (!hasOfficialAction(action)) return null;
  const result = ACTIONS[action].run(systems, player, payload || {}, ctx || {});
  if (!result || typeof result !== 'object') return { ok: false, detail: null };
  return { ok: Boolean(result.ok), detail: result.detail ?? null };
}
