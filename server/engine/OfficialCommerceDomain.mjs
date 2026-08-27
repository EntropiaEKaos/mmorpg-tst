// ===================================================================
// MOR'IA — OFFICIAL COMMERCE & MESSAGING DOMAIN
// Auction and player mail mutate both player-owned inventory/gold and the
// persistent global official store. Keeping this logic here lets future market,
// COD, guild-bank and mail features evolve without expanding OfficialSystems.
// ===================================================================

const clamp = (value, min, max, fallback = min) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};
const int = (value, min, max, fallback = min) => Math.floor(clamp(value, min, max, fallback));
const cleanText = (value, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const playerKey = (name) => String(name || '').trim().toLocaleLowerCase('en-US');

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

function requireHost(systems) {
  return Boolean(
    systems
    && systems.global
    && Array.isArray(systems.global.auctions)
    && Array.isArray(systems.global.mail)
    && systems.global.credits
    && typeof systems.ensurePlayer === 'function'
    && typeof systems.save === 'function'
  );
}

export class OfficialCommerceDomain {
  listAuction(systems, player, itemId, rawPrice) {
    if (!requireHost(systems) || !player || !Array.isArray(player.inventory)) return false;
    const price = int(rawPrice, 1, 10_000_000, 0);
    const index = player.inventory.findIndex(item => item.id === itemId);
    const seller = playerKey(player.name);
    if (!price || index < 0 || systems.global.auctions.filter(a => a.sellerKey === seller).length >= 10) return false;
    const [item] = player.inventory.splice(index, 1);
    systems.global.auctions.push({
      id: `auction_${Date.now()}_${Math.random()}`,
      seller: player.name,
      sellerKey: seller,
      price,
      item: { ...item },
      createdAt: Date.now(),
    });
    systems.save();
    return true;
  }

  buyAuction(systems, player, listingId, findOnlinePlayer = null) {
    if (!requireHost(systems) || !player || !Array.isArray(player.inventory)) return false;
    const index = systems.global.auctions.findIndex(a => a.id === listingId);
    const listing = index >= 0 ? systems.global.auctions[index] : null;
    if (!listing || listing.sellerKey === playerKey(player.name) || player.gold < listing.price) return false;

    player.gold -= listing.price;
    const onlineSeller = typeof findOnlinePlayer === 'function' ? findOnlinePlayer(listing.sellerKey) : null;
    if (onlineSeller) {
      onlineSeller.gold += listing.price;
      onlineSeller.stats.goldEarned = (onlineSeller.stats.goldEarned || 0) + listing.price;
    } else {
      systems.global.credits[listing.sellerKey] = int(systems.global.credits[listing.sellerKey], 0, 1_000_000_000, 0) + listing.price;
    }
    addItem(player, { ...listing.item, id: `auction_buy_${Date.now()}_${Math.random()}` });
    systems.global.auctions.splice(index, 1);
    systems.save();
    return true;
  }

  cancelAuction(systems, player, listingId) {
    if (!requireHost(systems) || !player || !Array.isArray(player.inventory)) return false;
    const index = systems.global.auctions.findIndex(a => a.id === listingId && a.sellerKey === playerKey(player.name));
    if (index < 0) return false;
    const [listing] = systems.global.auctions.splice(index, 1);
    addItem(player, { ...listing.item, id: `auction_cancel_${Date.now()}_${Math.random()}` });
    systems.save();
    return true;
  }

  sendMail(systems, player, payload, characterExists = null) {
    if (!requireHost(systems) || !player || !Array.isArray(player.inventory)) return false;
    const s = systems.ensurePlayer(player);
    const now = Date.now();
    if (now - s.lastMailAt < 30_000) return false;

    const target = cleanText(payload?.target, 24);
    const targetKey = playerKey(target);
    const subject = cleanText(payload?.subject, 80);
    const body = cleanText(payload?.body, 500);
    const gold = int(payload?.gold, 0, 1_000_000, 0);
    const itemId = cleanText(payload?.itemId, 120);
    if (!targetKey || targetKey === playerKey(player.name) || !subject || !body || player.gold < gold + 5) return false;
    if (typeof characterExists === 'function' && !characterExists(target)) return false;

    let item = null;
    let itemIndex = -1;
    if (itemId) {
      itemIndex = player.inventory.findIndex(entry => entry.id === itemId);
      if (itemIndex < 0) return false;
      const source = player.inventory[itemIndex];
      item = { ...source, quantity: 1, id: `mail_item_${now}_${Math.random()}` };
      if (source.equipment) item.equipment = { ...source.equipment };
    }

    player.gold -= gold + 5;
    if (itemIndex >= 0) {
      const source = player.inventory[itemIndex];
      if (int(source.quantity, 1, 999999, 1) > 1 && source.type !== 'equipment') source.quantity -= 1;
      else player.inventory.splice(itemIndex, 1);
    }
    s.lastMailAt = now;
    systems.global.mail.push({
      id: `mail_${now}_${Math.random()}`,
      from: player.name,
      to: targetKey,
      subject,
      body,
      gold,
      item,
      claimed: gold === 0 && !item,
      read: false,
      sentAt: now,
      system: false,
    });
    systems.global.mail = systems.global.mail.slice(-5000);
    systems.save();
    return true;
  }

  markMail(systems, player, mailId, action) {
    if (!requireHost(systems) || !player || !Array.isArray(player.inventory)) return false;
    const key = playerKey(player.name);
    const index = systems.global.mail.findIndex(m => m.id === mailId && m.to === key);
    const mail = index >= 0 ? systems.global.mail[index] : null;
    if (!mail) return false;

    if (action === 'read') mail.read = true;
    else if (action === 'claim') {
      if (mail.claimed) return false;
      const gold = int(mail.gold, 0, 1_000_000, 0);
      player.gold += gold;
      player.stats.goldEarned = (player.stats.goldEarned || 0) + gold;
      if (mail.item) addItem(player, { ...mail.item, id: `mail_claim_${Date.now()}_${Math.random()}` });
      mail.claimed = true;
      mail.read = true;
    } else if (action === 'delete') {
      if (!mail.claimed && (Number(mail.gold) > 0 || mail.item)) return false;
      systems.global.mail.splice(index, 1);
    } else return false;

    systems.save();
    return true;
  }
}

export const officialCommerceDomain = new OfficialCommerceDomain();
