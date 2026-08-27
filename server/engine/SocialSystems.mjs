// ===================================================================
// MOR'IA FOUNDATION 7.1 — AUTHORITATIVE SOCIAL SYSTEMS
// Parties are session-scoped, guilds persist, direct trades are atomic.
// ===================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DB_FILE = process.env.MORIA_SOCIAL_DB || path.join(__dirname, '..', 'moria-social.json');

const cleanText = (value, max = 120) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const playerKey = (value) => String(value || '').trim().toLocaleLowerCase('en-US');
const slug = (value) => cleanText(value, 40).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const int = (value, min, max, fallback = min) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback;
};
const clone = (value) => JSON.parse(JSON.stringify(value));

function onlineByKey(players, key) {
  for (const player of players.values()) if (playerKey(player.name) === key) return player;
  return null;
}

function nearby(a, b, range = 3) {
  return Boolean(a && b && a.mapId === b.mapId && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) <= range);
}

function publicPlayer(player) {
  return player ? {
    id: player.id, name: player.name, level: player.level, vocation: player.vocation,
    mapId: player.mapId, x: player.x, y: player.y, hp: player.hp, maxHp: player.maxHp,
  } : null;
}

function freshPersistentState() {
  return { version: 1, guilds: {} };
}

export class SocialSystems {
  constructor(dbFile = DEFAULT_DB_FILE) {
    this.dbFile = dbFile;
    this.state = freshPersistentState();
    this.parties = new Map();
    this.partyByPlayer = new Map();
    this.partyInvites = new Map();
    this.guildInvites = new Map();
    this.tradeInvites = new Map();
    this.trades = new Map();
    this.tradeByPlayer = new Map();
    this.load();
  }

  load() {
    try {
      if (!fs.existsSync(this.dbFile)) return false;
      const raw = JSON.parse(fs.readFileSync(this.dbFile, 'utf8'));
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
      const guilds = {};
      for (const [id, source] of Object.entries(raw.guilds || {}).slice(0, 500)) {
        if (!source || typeof source !== 'object' || Array.isArray(source)) continue;
        const guildId = slug(source.id || id);
        const name = cleanText(source.name, 32);
        if (!guildId || !name) continue;
        const members = {};
        for (const [memberKey, member] of Object.entries(source.members || {}).slice(0, 200)) {
          const key = playerKey(memberKey);
          if (!key) continue;
          members[key] = {
            name: cleanText(member?.name || memberKey, 24) || memberKey,
            role: ['leader', 'officer', 'member'].includes(member?.role) ? member.role : 'member',
            joinedAt: Number(member?.joinedAt) || Date.now(),
          };
        }
        if (!Object.keys(members).length) continue;
        guilds[guildId] = {
          id: guildId, name, createdAt: Number(source.createdAt) || Date.now(),
          motd: cleanText(source.motd, 160), members,
        };
      }
      this.state = { version: 1, guilds };
      return true;
    } catch (error) {
      console.warn('⚠ Social DB load failed:', error?.message || error);
      return false;
    }
  }

  save() {
    const temp = `${this.dbFile}.tmp`;
    try {
      fs.mkdirSync(path.dirname(this.dbFile), { recursive: true });
      fs.writeFileSync(temp, JSON.stringify(this.state, null, 2), { mode: 0o600 });
      fs.renameSync(temp, this.dbFile);
      return true;
    } catch (error) {
      try { fs.rmSync(temp, { force: true }); } catch {}
      console.warn('⚠ Social DB save failed:', error?.message || error);
      return false;
    }
  }

  prune(now = Date.now()) {
    const pruneMap = (map) => {
      for (const [key, invite] of map) if (!invite || Number(invite.expiresAt) <= now) map.delete(key);
    };
    pruneMap(this.partyInvites); pruneMap(this.guildInvites); pruneMap(this.tradeInvites);
  }

  getParty(playerOrName) {
    const key = playerKey(typeof playerOrName === 'string' ? playerOrName : playerOrName?.name);
    const id = this.partyByPlayer.get(key);
    return id ? this.parties.get(id) || null : null;
  }

  createParty(player) {
    const key = playerKey(player.name);
    if (this.partyByPlayer.has(key)) return { ok: false, error: 'You are already in a party.' };
    const id = `party_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const party = { id, leaderKey: key, members: [key], createdAt: Date.now() };
    this.parties.set(id, party); this.partyByPlayer.set(key, id);
    return { ok: true, message: 'Party created.' };
  }

  inviteParty(player, target, players) {
    if (!target || target.id === player.id) return { ok: false, error: 'Choose another online player.' };
    if (!nearby(player, target, 12)) return { ok: false, error: 'Party invite target must be nearby.' };
    let party = this.getParty(player);
    if (!party) {
      const created = this.createParty(player);
      if (!created.ok) return created;
      party = this.getParty(player);
    }
    if (party.leaderKey !== playerKey(player.name)) return { ok: false, error: 'Only the party leader can invite.' };
    if (party.members.length >= 5) return { ok: false, error: 'Party is full (5 members).' };
    const targetKey = playerKey(target.name);
    if (this.partyByPlayer.has(targetKey)) return { ok: false, error: 'That player is already in a party.' };
    this.partyInvites.set(targetKey, { partyId: party.id, fromKey: playerKey(player.name), fromName: player.name, expiresAt: Date.now() + 120_000 });
    return { ok: true, message: `Party invite sent to ${target.name}.`, notices: [{ playerId: target.id, text: `👥 ${player.name} invited you to a party.` }] };
  }

  acceptParty(player) {
    this.prune();
    const key = playerKey(player.name);
    const invite = this.partyInvites.get(key);
    if (!invite || this.partyByPlayer.has(key)) return { ok: false, error: 'No valid party invite.' };
    const party = this.parties.get(invite.partyId);
    if (!party || party.members.length >= 5) { this.partyInvites.delete(key); return { ok: false, error: 'Party invite expired.' }; }
    party.members.push(key); this.partyByPlayer.set(key, party.id); this.partyInvites.delete(key);
    return { ok: true, message: `Joined ${invite.fromName}'s party.` };
  }

  leaveParty(player) {
    const key = playerKey(player.name);
    const party = this.getParty(player);
    if (!party) return { ok: false, error: 'You are not in a party.' };
    party.members = party.members.filter(member => member !== key);
    this.partyByPlayer.delete(key);
    if (!party.members.length) this.parties.delete(party.id);
    else if (party.leaderKey === key) party.leaderKey = party.members[0];
    return { ok: true, message: 'Left the party.' };
  }

  kickParty(player, targetKey) {
    const party = this.getParty(player);
    const actorKey = playerKey(player.name);
    const victimKey = playerKey(targetKey);
    if (!party || party.leaderKey !== actorKey) return { ok: false, error: 'Only the party leader can remove members.' };
    if (!victimKey || victimKey === actorKey || !party.members.includes(victimKey)) return { ok: false, error: 'Invalid party member.' };
    party.members = party.members.filter(member => member !== victimKey); this.partyByPlayer.delete(victimKey);
    return { ok: true, message: 'Party member removed.' };
  }

  getGuildByMember(name) {
    const key = playerKey(name);
    for (const guild of Object.values(this.state.guilds)) if (guild.members?.[key]) return guild;
    return null;
  }

  createGuild(player, rawName) {
    const name = cleanText(rawName, 32);
    const id = slug(name);
    if (player.level < 10) return { ok: false, error: 'Guild creation requires level 10.' };
    if (player.gold < 1000) return { ok: false, error: 'Guild creation costs 1000 gold.' };
    if (!/^[A-Za-z0-9][A-Za-z0-9 '\-]{2,31}$/.test(name)) return { ok: false, error: 'Guild name must be 3-32 simple characters.' };
    if (!id || this.state.guilds[id]) return { ok: false, error: 'Guild name is already taken.' };
    if (this.getGuildByMember(player.name)) return { ok: false, error: 'Leave your current guild first.' };
    const key = playerKey(player.name);
    player.gold -= 1000;
    this.state.guilds[id] = { id, name, createdAt: Date.now(), motd: '', members: { [key]: { name: player.name, role: 'leader', joinedAt: Date.now() } } };
    this.save();
    return { ok: true, message: `Guild ${name} created.` };
  }

  inviteGuild(player, target) {
    const guild = this.getGuildByMember(player.name);
    const actor = guild?.members?.[playerKey(player.name)];
    if (!guild || !actor || !['leader', 'officer'].includes(actor.role)) return { ok: false, error: 'Guild officer permission required.' };
    if (!target || target.id === player.id) return { ok: false, error: 'Choose another online player.' };
    if (this.getGuildByMember(target.name)) return { ok: false, error: 'That player is already in a guild.' };
    if (Object.keys(guild.members).length >= 100) return { ok: false, error: 'Guild member cap reached.' };
    const targetKey = playerKey(target.name);
    this.guildInvites.set(targetKey, { guildId: guild.id, fromName: player.name, expiresAt: Date.now() + 300_000 });
    return { ok: true, message: `Guild invite sent to ${target.name}.`, notices: [{ playerId: target.id, text: `🛡 ${player.name} invited you to guild ${guild.name}.` }] };
  }

  acceptGuild(player) {
    this.prune();
    const key = playerKey(player.name);
    const invite = this.guildInvites.get(key);
    if (!invite || this.getGuildByMember(player.name)) return { ok: false, error: 'No valid guild invite.' };
    const guild = this.state.guilds[invite.guildId];
    if (!guild || Object.keys(guild.members).length >= 100) { this.guildInvites.delete(key); return { ok: false, error: 'Guild invite expired.' }; }
    guild.members[key] = { name: player.name, role: 'member', joinedAt: Date.now() };
    this.guildInvites.delete(key); this.save();
    return { ok: true, message: `Joined guild ${guild.name}.` };
  }

  leaveGuild(player) {
    const guild = this.getGuildByMember(player.name);
    const key = playerKey(player.name);
    if (!guild) return { ok: false, error: 'You are not in a guild.' };
    const member = guild.members[key];
    const keys = Object.keys(guild.members);
    if (member.role === 'leader' && keys.length > 1) return { ok: false, error: 'Transfer leadership or remove members before leaving.' };
    delete guild.members[key];
    if (!Object.keys(guild.members).length) delete this.state.guilds[guild.id];
    this.save();
    return { ok: true, message: 'Left the guild.' };
  }

  guildSetMotd(player, motd) {
    const guild = this.getGuildByMember(player.name);
    const member = guild?.members?.[playerKey(player.name)];
    if (!guild || !member || !['leader', 'officer'].includes(member.role)) return { ok: false, error: 'Guild officer permission required.' };
    guild.motd = cleanText(motd, 160); this.save();
    return { ok: true, message: 'Guild message updated.' };
  }

  guildRole(player, targetKey, role) {
    const guild = this.getGuildByMember(player.name);
    const actorKey = playerKey(player.name);
    const actor = guild?.members?.[actorKey];
    const victimKey = playerKey(targetKey);
    const victim = guild?.members?.[victimKey];
    if (!guild || actor?.role !== 'leader' || !victim || victimKey === actorKey) return { ok: false, error: 'Guild leader permission required.' };
    if (!['officer', 'member', 'leader'].includes(role)) return { ok: false, error: 'Invalid guild role.' };
    if (role === 'leader') { actor.role = 'officer'; victim.role = 'leader'; }
    else victim.role = role;
    this.save(); return { ok: true, message: 'Guild role updated.' };
  }

  kickGuild(player, targetKey) {
    const guild = this.getGuildByMember(player.name);
    const actor = guild?.members?.[playerKey(player.name)];
    const victimKey = playerKey(targetKey);
    const victim = guild?.members?.[victimKey];
    if (!guild || !actor || !victim || victimKey === playerKey(player.name)) return { ok: false, error: 'Invalid guild member.' };
    if (actor.role === 'member' || victim.role === 'leader' || (actor.role === 'officer' && victim.role === 'officer')) return { ok: false, error: 'Insufficient guild permission.' };
    delete guild.members[victimKey]; this.save();
    return { ok: true, message: 'Guild member removed.' };
  }

  requestTrade(player, target) {
    const key = playerKey(player.name); const targetKey = playerKey(target?.name);
    if (!target || target.id === player.id || !nearby(player, target, 3)) return { ok: false, error: 'Trade target must be within 3 tiles.' };
    if (this.tradeByPlayer.has(key) || this.tradeByPlayer.has(targetKey)) return { ok: false, error: 'One player is already trading.' };
    this.tradeInvites.set(targetKey, { fromKey: key, fromName: player.name, expiresAt: Date.now() + 60_000 });
    return { ok: true, message: `Trade request sent to ${target.name}.`, notices: [{ playerId: target.id, text: `🤝 ${player.name} wants to trade with you.` }] };
  }

  acceptTrade(player, players) {
    this.prune();
    const targetKey = playerKey(player.name);
    const invite = this.tradeInvites.get(targetKey);
    if (!invite) return { ok: false, error: 'No valid trade request.' };
    const other = onlineByKey(players, invite.fromKey);
    if (!other || !nearby(player, other, 3) || this.tradeByPlayer.has(targetKey) || this.tradeByPlayer.has(invite.fromKey)) {
      this.tradeInvites.delete(targetKey); return { ok: false, error: 'Trade request expired.' };
    }
    const id = `trade_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const trade = {
      id, players: [invite.fromKey, targetKey], createdAt: Date.now(),
      offers: { [invite.fromKey]: { gold: 0, itemIds: [], confirmed: false }, [targetKey]: { gold: 0, itemIds: [], confirmed: false } },
    };
    this.trades.set(id, trade); this.tradeByPlayer.set(invite.fromKey, id); this.tradeByPlayer.set(targetKey, id); this.tradeInvites.delete(targetKey);
    return { ok: true, message: `Trade opened with ${other.name}.`, notices: [{ playerId: other.id, text: `🤝 ${player.name} accepted your trade request.` }] };
  }

  setTradeOffer(player, payload) {
    const key = playerKey(player.name); const id = this.tradeByPlayer.get(key); const trade = id ? this.trades.get(id) : null;
    const offer = trade?.offers?.[key];
    if (!trade || !offer) return { ok: false, error: 'No active trade.' };
    const gold = int(payload.gold, 0, 100_000_000, 0);
    const requested = Array.isArray(payload.itemIds) ? [...new Set(payload.itemIds.filter(idValue => typeof idValue === 'string').slice(0, 8))] : [];
    if (gold > player.gold) return { ok: false, error: 'Not enough gold for this offer.' };
    if (requested.some(itemId => !player.inventory.some(item => item.id === itemId))) return { ok: false, error: 'Trade offer contains an unavailable item.' };
    offer.gold = gold; offer.itemIds = requested; offer.confirmed = false;
    for (const otherOffer of Object.values(trade.offers)) otherOffer.confirmed = false;
    return { ok: true, message: 'Trade offer updated.' };
  }

  cancelTrade(player) {
    const key = playerKey(player.name); const id = this.tradeByPlayer.get(key);
    if (!id) return { ok: false, error: 'No active trade.' };
    this.closeTrade(id);
    return { ok: true, message: 'Trade cancelled.' };
  }

  closeTrade(id) {
    const trade = this.trades.get(id);
    if (!trade) return;
    for (const key of trade.players) this.tradeByPlayer.delete(key);
    this.trades.delete(id);
  }

  confirmTrade(player, players) {
    const key = playerKey(player.name); const id = this.tradeByPlayer.get(key); const trade = id ? this.trades.get(id) : null;
    const offer = trade?.offers?.[key];
    if (!trade || !offer) return { ok: false, error: 'No active trade.' };
    const participants = trade.players.map(memberKey => onlineByKey(players, memberKey));
    if (participants.some(p => !p) || !nearby(participants[0], participants[1], 3)) { this.closeTrade(trade.id); return { ok: false, error: 'Trade cancelled because a player moved away or disconnected.' }; }
    offer.confirmed = true;
    if (!trade.players.every(memberKey => trade.offers[memberKey].confirmed)) return { ok: true, message: 'Trade confirmed. Waiting for the other player.' };

    const [a, b] = participants;
    const aKey = playerKey(a.name); const bKey = playerKey(b.name);
    const aOffer = trade.offers[aKey]; const bOffer = trade.offers[bKey];
    const validate = (participant, participantOffer) => participant.gold >= participantOffer.gold && participantOffer.itemIds.every(itemId => participant.inventory.some(item => item.id === itemId));
    if (!validate(a, aOffer) || !validate(b, bOffer)) { this.closeTrade(trade.id); return { ok: false, error: 'Trade inventory changed before settlement.' }; }

    const takeItems = (participant, itemIds) => {
      const set = new Set(itemIds); const items = participant.inventory.filter(item => set.has(item.id)).map(clone);
      participant.inventory = participant.inventory.filter(item => !set.has(item.id));
      return items;
    };
    const aItems = takeItems(a, aOffer.itemIds); const bItems = takeItems(b, bOffer.itemIds);
    a.gold -= aOffer.gold; b.gold -= bOffer.gold; a.gold += bOffer.gold; b.gold += aOffer.gold;
    for (const item of bItems) { item.id = `trade_${Date.now()}_${Math.random()}`; a.inventory.push(item); }
    for (const item of aItems) { item.id = `trade_${Date.now()}_${Math.random()}`; b.inventory.push(item); }
    this.closeTrade(trade.id);
    return {
      ok: true, message: `Trade completed with ${a.id === player.id ? b.name : a.name}.`, completed: true,
      notices: [{ playerId: a.id, text: `🤝 Trade completed with ${b.name}.` }, { playerId: b.id, text: `🤝 Trade completed with ${a.name}.` }],
    };
  }

  onDisconnect(player) {
    if (!player) return;
    const key = playerKey(player.name);
    const tradeId = this.tradeByPlayer.get(key); if (tradeId) this.closeTrade(tradeId);
    const party = this.getParty(player);
    if (party) this.leaveParty(player);
    this.partyInvites.delete(key); this.guildInvites.delete(key); this.tradeInvites.delete(key);
    for (const [targetKey, invite] of this.partyInvites) if (invite.fromKey === key) this.partyInvites.delete(targetKey);
    for (const [targetKey, invite] of this.tradeInvites) if (invite.fromKey === key) this.tradeInvites.delete(targetKey);
  }

  chatRecipients(player, channel, players) {
    const all = Array.from(players.values());
    if (channel === 'world' || channel === 'trade') return all.map(p => p.id);
    if (channel === 'say') return all.filter(p => p.mapId === player.mapId && Math.abs(p.x - player.x) + Math.abs(p.y - player.y) <= 10).map(p => p.id);
    if (channel === 'party') {
      const party = this.getParty(player); return party ? party.members.map(key => onlineByKey(players, key)?.id).filter(Boolean) : [player.id];
    }
    if (channel === 'guild') {
      const guild = this.getGuildByMember(player.name); return guild ? Object.keys(guild.members).map(key => onlineByKey(players, key)?.id).filter(Boolean) : [player.id];
    }
    return [player.id];
  }

  snapshot(player, players) {
    this.prune();
    const key = playerKey(player.name); const party = this.getParty(player); const guild = this.getGuildByMember(player.name);
    const tradeId = this.tradeByPlayer.get(key); const trade = tradeId ? this.trades.get(tradeId) : null;
    let tradeView = null;
    if (trade) {
      tradeView = {
        id: trade.id,
        players: trade.players.map(memberKey => {
          const participant = onlineByKey(players, memberKey); const offer = trade.offers[memberKey];
          return {
            key: memberKey, name: participant?.name || memberKey, self: memberKey === key,
            gold: offer.gold, confirmed: offer.confirmed,
            items: offer.itemIds.map(itemId => participant?.inventory.find(item => item.id === itemId)).filter(Boolean).map(item => ({ id: item.id, name: item.name, icon: item.icon, quantity: item.quantity || 1, rarity: item.rarity })),
          };
        }),
      };
    }
    return {
      party: party ? {
        id: party.id, leaderKey: party.leaderKey,
        members: party.members.map(memberKey => ({ key: memberKey, ...publicPlayer(onlineByKey(players, memberKey)), online: Boolean(onlineByKey(players, memberKey)) })),
      } : null,
      partyInvite: this.partyInvites.get(key) ? { fromName: this.partyInvites.get(key).fromName, expiresAt: this.partyInvites.get(key).expiresAt } : null,
      guild: guild ? {
        id: guild.id, name: guild.name, motd: guild.motd,
        selfRole: guild.members[key]?.role || 'member',
        members: Object.entries(guild.members).map(([memberKey, member]) => ({ key: memberKey, name: member.name, role: member.role, online: Boolean(onlineByKey(players, memberKey)) })),
      } : null,
      guildInvite: this.guildInvites.get(key) ? { guildName: this.state.guilds[this.guildInvites.get(key).guildId]?.name || 'Guild', fromName: this.guildInvites.get(key).fromName, expiresAt: this.guildInvites.get(key).expiresAt } : null,
      tradeInvite: this.tradeInvites.get(key) ? { fromName: this.tradeInvites.get(key).fromName, expiresAt: this.tradeInvites.get(key).expiresAt } : null,
      trade: tradeView,
      nearby: Array.from(players.values()).filter(other => other.id !== player.id && nearby(player, other, 12)).map(publicPlayer),
    };
  }

  handle(player, payload, context) {
    const action = cleanText(payload.action, 40);
    const players = context.players;
    const target = typeof payload.targetId === 'string' ? players.get(payload.targetId) : null;
    let result;
    switch (action) {
      case 'party_create': result = this.createParty(player); break;
      case 'party_invite': result = this.inviteParty(player, target, players); break;
      case 'party_accept': result = this.acceptParty(player); break;
      case 'party_leave': result = this.leaveParty(player); break;
      case 'party_kick': result = this.kickParty(player, payload.targetKey); break;
      case 'guild_create': result = this.createGuild(player, payload.name); break;
      case 'guild_invite': result = this.inviteGuild(player, target); break;
      case 'guild_accept': result = this.acceptGuild(player); break;
      case 'guild_leave': result = this.leaveGuild(player); break;
      case 'guild_motd': result = this.guildSetMotd(player, payload.motd); break;
      case 'guild_role': result = this.guildRole(player, payload.targetKey, payload.role); break;
      case 'guild_kick': result = this.kickGuild(player, payload.targetKey); break;
      case 'trade_request': result = this.requestTrade(player, target); break;
      case 'trade_accept': result = this.acceptTrade(player, players); break;
      case 'trade_offer': result = this.setTradeOffer(player, payload); break;
      case 'trade_confirm': result = this.confirmTrade(player, players); break;
      case 'trade_cancel': result = this.cancelTrade(player); break;
      default: result = { ok: false, error: 'Unknown social action.' };
    }
    return result;
  }
}

export const socialSystems = new SocialSystems();
