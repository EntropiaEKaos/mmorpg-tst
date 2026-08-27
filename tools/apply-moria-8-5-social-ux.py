from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOCIAL = ROOT / 'server/engine/SocialSystems.mjs'
HUB = ROOT / 'src/components/SocialHub.tsx'
TEST = ROOT / 'server/test/social-ux-8-5.test.mjs'
DOC = ROOT / 'docs/MORIA_8_5_SOCIAL_UX.md'

social = SOCIAL.read_text(encoding='utf-8')

# -------------------------------------------------------------------
# Party leadership and explicit invite decline flows.
# -------------------------------------------------------------------
party_anchor = """  kickParty(player, targetKey) {
    const party = this.getParty(player);
    const actorKey = playerKey(player.name);
    const victimKey = playerKey(targetKey);
    if (!party || party.leaderKey !== actorKey) return { ok: false, error: 'Only the party leader can remove members.' };
    if (!victimKey || victimKey === actorKey || !party.members.includes(victimKey)) return { ok: false, error: 'Invalid party member.' };
    party.members = party.members.filter(member => member !== victimKey); this.partyByPlayer.delete(victimKey);
    return { ok: true, message: 'Party member removed.' };
  }

  getGuildByMember(name) {
"""
party_replacement = """  kickParty(player, targetKey) {
    const party = this.getParty(player);
    const actorKey = playerKey(player.name);
    const victimKey = playerKey(targetKey);
    if (!party || party.leaderKey !== actorKey) return { ok: false, error: 'Only the party leader can remove members.' };
    if (!victimKey || victimKey === actorKey || !party.members.includes(victimKey)) return { ok: false, error: 'Invalid party member.' };
    party.members = party.members.filter(member => member !== victimKey); this.partyByPlayer.delete(victimKey);
    return { ok: true, message: 'Party member removed.' };
  }

  transferPartyLeadership(player, targetKey) {
    const party = this.getParty(player);
    const actorKey = playerKey(player.name);
    const nextLeaderKey = playerKey(targetKey);
    if (!party || party.leaderKey !== actorKey) return { ok: false, error: 'Only the party leader can transfer leadership.' };
    if (!nextLeaderKey || nextLeaderKey === actorKey || !party.members.includes(nextLeaderKey)) return { ok: false, error: 'Choose another party member.' };
    party.leaderKey = nextLeaderKey;
    return { ok: true, message: 'Party leadership transferred.' };
  }

  declinePartyInvite(player) {
    const key = playerKey(player.name);
    if (!this.partyInvites.has(key)) return { ok: false, error: 'No party invite to decline.' };
    this.partyInvites.delete(key);
    return { ok: true, message: 'Party invite declined.' };
  }

  getGuildByMember(name) {
"""
if party_anchor not in social:
    raise SystemExit('party anchor missing')
social = social.replace(party_anchor, party_replacement, 1)

# -------------------------------------------------------------------
# Guild mutations: make persistence failure roll back in-memory state/gold.
# -------------------------------------------------------------------
old_create = """  createGuild(player, rawName) {
    const name = cleanText(rawName, 32);
    const id = slug(name);
    if (player.level < 10) return { ok: false, error: 'Guild creation requires level 10.' };
    if (player.gold < 1000) return { ok: false, error: 'Guild creation costs 1000 gold.' };
    if (!/^[A-Za-z0-9][A-Za-z0-9 '\\-]{2,31}$/.test(name)) return { ok: false, error: 'Guild name must be 3-32 simple characters.' };
    if (!id || this.state.guilds[id]) return { ok: false, error: 'Guild name is already taken.' };
    if (this.getGuildByMember(player.name)) return { ok: false, error: 'Leave your current guild first.' };
    const key = playerKey(player.name);
    player.gold -= 1000;
    this.state.guilds[id] = { id, name, createdAt: Date.now(), motd: '', members: { [key]: { name: player.name, role: 'leader', joinedAt: Date.now() } } };
    this.save();
    return { ok: true, message: `Guild ${name} created.` };
  }
"""
new_create = """  createGuild(player, rawName) {
    const name = cleanText(rawName, 32);
    const id = slug(name);
    if (player.level < 10) return { ok: false, error: 'Guild creation requires level 10.' };
    if (player.gold < 1000) return { ok: false, error: 'Guild creation costs 1000 gold.' };
    if (!/^[A-Za-z0-9][A-Za-z0-9 '\\-]{2,31}$/.test(name)) return { ok: false, error: 'Guild name must be 3-32 simple characters.' };
    if (!id || this.state.guilds[id]) return { ok: false, error: 'Guild name is already taken.' };
    if (this.getGuildByMember(player.name)) return { ok: false, error: 'Leave your current guild first.' };
    const key = playerKey(player.name);
    const beforeState = clone(this.state);
    const beforeGold = player.gold;
    player.gold -= 1000;
    this.state.guilds[id] = { id, name, createdAt: Date.now(), motd: '', members: { [key]: { name: player.name, role: 'leader', joinedAt: Date.now() } } };
    if (!this.save()) {
      this.state = beforeState;
      player.gold = beforeGold;
      return { ok: false, error: 'Guild creation could not be saved. No gold was charged.' };
    }
    return { ok: true, message: `Guild ${name} created.` };
  }
"""
if old_create not in social:
    raise SystemExit('createGuild block missing')
social = social.replace(old_create, new_create, 1)

old_accept = """  acceptGuild(player) {
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
"""
new_accept = """  acceptGuild(player) {
    this.prune();
    const key = playerKey(player.name);
    const invite = this.guildInvites.get(key);
    if (!invite || this.getGuildByMember(player.name)) return { ok: false, error: 'No valid guild invite.' };
    const guild = this.state.guilds[invite.guildId];
    if (!guild || Object.keys(guild.members).length >= 100) { this.guildInvites.delete(key); return { ok: false, error: 'Guild invite expired.' }; }
    const beforeState = clone(this.state);
    guild.members[key] = { name: player.name, role: 'member', joinedAt: Date.now() };
    if (!this.save()) {
      this.state = beforeState;
      return { ok: false, error: 'Guild membership could not be saved. The invite is still valid.' };
    }
    this.guildInvites.delete(key);
    return { ok: true, message: `Joined guild ${guild.name}.` };
  }

  declineGuildInvite(player) {
    const key = playerKey(player.name);
    if (!this.guildInvites.has(key)) return { ok: false, error: 'No guild invite to decline.' };
    this.guildInvites.delete(key);
    return { ok: true, message: 'Guild invite declined.' };
  }
"""
if old_accept not in social:
    raise SystemExit('acceptGuild block missing')
social = social.replace(old_accept, new_accept, 1)

old_leave = """  leaveGuild(player) {
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
"""
new_leave = """  leaveGuild(player) {
    const guild = this.getGuildByMember(player.name);
    const key = playerKey(player.name);
    if (!guild) return { ok: false, error: 'You are not in a guild.' };
    const member = guild.members[key];
    const keys = Object.keys(guild.members);
    if (member.role === 'leader' && keys.length > 1) return { ok: false, error: 'Transfer leadership or remove members before leaving.' };
    const beforeState = clone(this.state);
    delete guild.members[key];
    if (!Object.keys(guild.members).length) delete this.state.guilds[guild.id];
    if (!this.save()) { this.state = beforeState; return { ok: false, error: 'Guild leave could not be saved.' }; }
    return { ok: true, message: 'Left the guild.' };
  }
"""
if old_leave not in social:
    raise SystemExit('leaveGuild block missing')
social = social.replace(old_leave, new_leave, 1)

old_motd = """  guildSetMotd(player, motd) {
    const guild = this.getGuildByMember(player.name);
    const member = guild?.members?.[playerKey(player.name)];
    if (!guild || !member || !['leader', 'officer'].includes(member.role)) return { ok: false, error: 'Guild officer permission required.' };
    guild.motd = cleanText(motd, 160); this.save();
    return { ok: true, message: 'Guild message updated.' };
  }
"""
new_motd = """  guildSetMotd(player, motd) {
    const guild = this.getGuildByMember(player.name);
    const member = guild?.members?.[playerKey(player.name)];
    if (!guild || !member || !['leader', 'officer'].includes(member.role)) return { ok: false, error: 'Guild officer permission required.' };
    const beforeState = clone(this.state);
    guild.motd = cleanText(motd, 160);
    if (!this.save()) { this.state = beforeState; return { ok: false, error: 'Guild message could not be saved.' }; }
    return { ok: true, message: 'Guild message updated.' };
  }
"""
if old_motd not in social:
    raise SystemExit('guildSetMotd block missing')
social = social.replace(old_motd, new_motd, 1)

old_role_tail = """    if (!['officer', 'member', 'leader'].includes(role)) return { ok: false, error: 'Invalid guild role.' };
    if (role === 'leader') { actor.role = 'officer'; victim.role = 'leader'; }
    else victim.role = role;
    this.save(); return { ok: true, message: 'Guild role updated.' };
  }
"""
new_role_tail = """    if (!['officer', 'member', 'leader'].includes(role)) return { ok: false, error: 'Invalid guild role.' };
    const beforeState = clone(this.state);
    if (role === 'leader') { actor.role = 'officer'; victim.role = 'leader'; }
    else victim.role = role;
    if (!this.save()) { this.state = beforeState; return { ok: false, error: 'Guild role change could not be saved.' }; }
    return { ok: true, message: 'Guild role updated.' };
  }
"""
if old_role_tail not in social:
    raise SystemExit('guildRole tail missing')
social = social.replace(old_role_tail, new_role_tail, 1)

old_kick_tail = """    if (!guild || !actor || !victim || victimKey === playerKey(player.name)) return { ok: false, error: 'Invalid guild member.' };
    if (actor.role === 'member' || victim.role === 'leader' || (actor.role === 'officer' && victim.role === 'officer')) return { ok: false, error: 'Insufficient guild permission.' };
    delete guild.members[victimKey]; this.save();
    return { ok: true, message: 'Guild member removed.' };
  }
"""
new_kick_tail = """    if (!guild || !actor || !victim || victimKey === playerKey(player.name)) return { ok: false, error: 'Invalid guild member.' };
    if (actor.role === 'member' || victim.role === 'leader' || (actor.role === 'officer' && victim.role === 'officer')) return { ok: false, error: 'Insufficient guild permission.' };
    const beforeState = clone(this.state);
    delete guild.members[victimKey];
    if (!this.save()) { this.state = beforeState; return { ok: false, error: 'Guild member removal could not be saved.' }; }
    return { ok: true, message: 'Guild member removed.' };
  }
"""
if old_kick_tail not in social:
    raise SystemExit('kickGuild tail missing')
social = social.replace(old_kick_tail, new_kick_tail, 1)

# -------------------------------------------------------------------
# Trade decline and clearer server-owned UI limits/snapshot TTLs.
# -------------------------------------------------------------------
trade_anchor = """  acceptTrade(player, players) {
"""
trade_insert = """  declineTradeInvite(player) {
    const key = playerKey(player.name);
    if (!this.tradeInvites.has(key)) return { ok: false, error: 'No trade request to decline.' };
    this.tradeInvites.delete(key);
    return { ok: true, message: 'Trade request declined.' };
  }

  acceptTrade(player, players) {
"""
if trade_anchor not in social:
    raise SystemExit('trade accept anchor missing')
social = social.replace(trade_anchor, trade_insert, 1)

snapshot_return = """    return {
      party: party ? {
"""
snapshot_replacement = """    const partyInvite = this.partyInvites.get(key);
    const guildInvite = this.guildInvites.get(key);
    const tradeInvite = this.tradeInvites.get(key);
    const inviteView = (invite, extra = {}) => invite ? { ...extra, expiresAt: invite.expiresAt, expiresInMs: Math.max(0, Number(invite.expiresAt) - Date.now()) } : null;
    return {
      selfKey: key,
      limits: { partyMax: 5, partyInviteRange: 12, tradeRange: 3, tradeMaxItems: 8, guildMax: 100 },
      party: party ? {
"""
if snapshot_return not in social:
    raise SystemExit('snapshot return anchor missing')
social = social.replace(snapshot_return, snapshot_replacement, 1)

social = social.replace("partyInvite: this.partyInvites.get(key) ? { fromName: this.partyInvites.get(key).fromName, expiresAt: this.partyInvites.get(key).expiresAt } : null,", "partyInvite: inviteView(partyInvite, { fromName: partyInvite?.fromName }),", 1)
social = social.replace("guildInvite: this.guildInvites.get(key) ? { guildName: this.state.guilds[this.guildInvites.get(key).guildId]?.name || 'Guild', fromName: this.guildInvites.get(key).fromName, expiresAt: this.guildInvites.get(key).expiresAt } : null,", "guildInvite: inviteView(guildInvite, { guildName: this.state.guilds[guildInvite?.guildId]?.name || 'Guild', fromName: guildInvite?.fromName }),", 1)
social = social.replace("tradeInvite: this.tradeInvites.get(key) ? { fromName: this.tradeInvites.get(key).fromName, expiresAt: this.tradeInvites.get(key).expiresAt } : null,", "tradeInvite: inviteView(tradeInvite, { fromName: tradeInvite?.fromName }),", 1)

handle_anchor = """      case 'party_accept': result = this.acceptParty(player); break;
      case 'party_leave': result = this.leaveParty(player); break;
      case 'party_kick': result = this.kickParty(player, payload.targetKey); break;
"""
handle_replacement = """      case 'party_accept': result = this.acceptParty(player); break;
      case 'party_decline': result = this.declinePartyInvite(player); break;
      case 'party_leave': result = this.leaveParty(player); break;
      case 'party_kick': result = this.kickParty(player, payload.targetKey); break;
      case 'party_leader': result = this.transferPartyLeadership(player, payload.targetKey); break;
"""
if handle_anchor not in social:
    raise SystemExit('party handle actions missing')
social = social.replace(handle_anchor, handle_replacement, 1)
social = social.replace("case 'guild_accept': result = this.acceptGuild(player); break;", "case 'guild_accept': result = this.acceptGuild(player); break;\n      case 'guild_decline': result = this.declineGuildInvite(player); break;", 1)
social = social.replace("case 'trade_accept': result = this.acceptTrade(player, players); break;", "case 'trade_accept': result = this.acceptTrade(player, players); break;\n      case 'trade_decline': result = this.declineTradeInvite(player); break;", 1)

SOCIAL.write_text(social, encoding='utf-8')

# -------------------------------------------------------------------
# Social Hub: invite countdown/decline, richer party vitals, safe trade UX.
# -------------------------------------------------------------------
hub = HUB.read_text(encoding='utf-8')
hub = hub.replace("import { useMemo, useState } from 'react';", "import { useEffect, useMemo, useState } from 'react';", 1)
hub = hub.replace("  const [tradeItems, setTradeItems] = useState<string[]>([]);", "  const [tradeItems, setTradeItems] = useState<string[]>([]);\n  const [now, setNow] = useState(() => Date.now());", 1)

own_anchor = """  const ownTrade = useMemo(() => trade?.players?.find((entry: any) => entry.self), [trade]);

  const toggleTradeItem = (itemId: string) => {
"""
own_replacement = """  const ownTrade = useMemo(() => trade?.players?.find((entry: any) => entry.self), [trade]);
  const guildMembers = useMemo(() => [...(guild?.members || [])].sort((a: any, b: any) => Number(Boolean(b.online)) - Number(Boolean(a.online)) || String(a.name).localeCompare(String(b.name))), [guild]);
  const ownServerItemIds = useMemo(() => (ownTrade?.items || []).map((item: any) => item.id).sort(), [ownTrade]);
  const selectedItemIds = useMemo(() => [...tradeItems].sort(), [tradeItems]);
  const parsedTradeGold = Math.max(0, Math.min(player.gold, Math.floor(Number(tradeGold) || 0)));
  const offerDirty = Boolean(trade) && (parsedTradeGold !== Number(ownTrade?.gold || 0) || ownServerItemIds.join('|') !== selectedItemIds.join('|'));
  const inviteSeconds = (invite: any) => Math.max(0, Math.ceil((Number(invite?.expiresAt) - now) / 1000));

  useEffect(() => {
    if (!social?.partyInvite && !social?.guildInvite && !social?.tradeInvite) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [social?.partyInvite, social?.guildInvite, social?.tradeInvite]);

  useEffect(() => {
    if (!trade?.id) { setTradeGold('0'); setTradeItems([]); return; }
    setTradeGold(String(ownTrade?.gold || 0));
    setTradeItems((ownTrade?.items || []).map((item: any) => item.id));
  }, [trade?.id]);

  useEffect(() => { setMotd(guild?.motd || ''); }, [guild?.id, guild?.motd]);

  const toggleTradeItem = (itemId: string) => {
"""
if own_anchor not in hub:
    raise SystemExit('SocialHub ownTrade anchor missing')
hub = hub.replace(own_anchor, own_replacement, 1)

# Replace party invite card and member rendering block.
old_party_invite = """              {social?.partyInvite && !party && <div className=\"mt-3 rounded-xl border border-sky-500/30 bg-sky-950/20 p-3\"><b>{social.partyInvite.fromName}</b> invited you.<button onClick={() => act('party_accept')} className={`${button} ml-2`}>Accept</button></div>}
"""
new_party_invite = """              {social?.partyInvite && !party && <div className=\"mt-3 rounded-xl border border-sky-500/30 bg-sky-950/20 p-3\"><div className=\"flex items-center justify-between gap-2\"><span><b>{social.partyInvite.fromName}</b> invited you.</span><small className=\"text-sky-300\">{inviteSeconds(social.partyInvite)}s</small></div><div className=\"mt-2 flex gap-2\"><button onClick={() => act('party_accept')} className={button}>Accept</button><button onClick={() => act('party_decline')} className={`${button} border-slate-600 text-slate-300`}>Decline</button></div></div>}
"""
if old_party_invite not in hub:
    raise SystemExit('party invite UI missing')
hub = hub.replace(old_party_invite, new_party_invite, 1)

old_party_members = """                <div className=\"mt-3 space-y-2\">{party.members?.map((member: any) => <div key={member.key} className=\"flex items-center justify-between rounded-lg bg-slate-900/60 p-2\"><span>{party.leaderKey === member.key ? '👑 ' : ''}{member.name || member.key} {member.online ? <small className=\"text-emerald-400\">online</small> : <small className=\"text-slate-600\">offline</small>}</span>{party.leaderKey === player.name.toLowerCase() && member.key !== party.leaderKey && <button onClick={() => act('party_kick', { targetKey: member.key })} className={button}>Remove</button>}</div>)}</div>
"""
new_party_members = """                <div className=\"mt-3 space-y-2\">{party.members?.map((member: any) => { const hpPct = member.online && member.maxHp > 0 ? Math.max(0, Math.min(100, (member.hp / member.maxHp) * 100)) : 0; const selfLeader = party.leaderKey === (social?.selfKey || player.name.toLowerCase()); return <div key={member.key} className=\"rounded-lg bg-slate-900/60 p-2\"><div className=\"flex items-center justify-between gap-2\"><div className=\"min-w-0\"><div className=\"truncate font-bold\">{party.leaderKey === member.key ? '👑 ' : ''}{member.name || member.key}</div><div className=\"text-[10px] text-slate-400\">{member.online ? `Lv ${member.level} · ${member.vocation}` : 'offline'}</div></div>{selfLeader && member.key !== party.leaderKey && <div className=\"flex gap-1\"><button onClick={() => act('party_leader', { targetKey: member.key })} className={button}>Lead</button><button onClick={() => act('party_kick', { targetKey: member.key })} className={button}>Remove</button></div>}</div>{member.online && <div className=\"mt-2 h-1.5 overflow-hidden rounded-full bg-black/60\"><div className=\"h-full bg-emerald-400/80 transition-[width]\" style={{ width: `${hpPct}%` }} /></div>}</div>})}</div>
"""
if old_party_members not in hub:
    raise SystemExit('party members UI missing')
hub = hub.replace(old_party_members, new_party_members, 1)

# Guild invite with decline/countdown; member list uses sorted source and leadership transfer.
old_guild_invite = """              {social?.guildInvite && !guild && <div className=\"mt-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3\"><b>{social.guildInvite.fromName}</b> invited you to <b>{social.guildInvite.guildName}</b>.<button onClick={() => act('guild_accept')} className={`${button} ml-2`}>Accept</button></div>}
"""
new_guild_invite = """              {social?.guildInvite && !guild && <div className=\"mt-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3\"><div className=\"flex items-center justify-between gap-2\"><span><b>{social.guildInvite.fromName}</b> invited you to <b>{social.guildInvite.guildName}</b>.</span><small className=\"text-amber-300\">{inviteSeconds(social.guildInvite)}s</small></div><div className=\"mt-2 flex gap-2\"><button onClick={() => act('guild_accept')} className={button}>Accept</button><button onClick={() => act('guild_decline')} className={`${button} border-slate-600 text-slate-300`}>Decline</button></div></div>}
"""
if old_guild_invite not in hub:
    raise SystemExit('guild invite UI missing')
hub = hub.replace(old_guild_invite, new_guild_invite, 1)
hub = hub.replace("{guild.members?.map((member: any) =>", "{guildMembers.map((member: any) =>", 1)
hub = hub.replace("<button onClick={() => act('guild_kick', { targetKey: member.key })} className={button}>Kick</button>", "<button onClick={() => act('guild_role', { targetKey: member.key, role: 'leader' })} className={button}>Transfer lead</button><button onClick={() => act('guild_kick', { targetKey: member.key })} className={button}>Kick</button>", 1)

# Trade invite and confirm safety.
old_trade_invite = """              {social?.tradeInvite && !trade && <div className=\"mt-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3\"><b>{social.tradeInvite.fromName}</b> wants to trade.<button onClick={() => act('trade_accept')} className={`${button} ml-2`}>Accept</button></div>}
"""
new_trade_invite = """              {social?.tradeInvite && !trade && <div className=\"mt-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3\"><div className=\"flex items-center justify-between gap-2\"><span><b>{social.tradeInvite.fromName}</b> wants to trade.</span><small className=\"text-emerald-300\">{inviteSeconds(social.tradeInvite)}s</small></div><div className=\"mt-2 flex gap-2\"><button onClick={() => act('trade_accept')} className={button}>Accept</button><button onClick={() => act('trade_decline')} className={`${button} border-slate-600 text-slate-300`}>Decline</button></div></div>}
"""
if old_trade_invite not in hub:
    raise SystemExit('trade invite UI missing')
hub = hub.replace(old_trade_invite, new_trade_invite, 1)
hub = hub.replace("<button onClick={() => act('trade_confirm')} className={`${button} mt-3 border-emerald-500/40 text-emerald-200`}>Confirm trade</button>", "<button disabled={offerDirty} onClick={() => act('trade_confirm')} className={`${button} mt-3 border-emerald-500/40 text-emerald-200`}>{offerDirty ? 'Update your offer first' : 'Confirm trade'}</button>", 1)
hub = hub.replace("onClick={() => act('trade_offer', { gold: Number(tradeGold) || 0, itemIds: tradeItems })}", "onClick={() => act('trade_offer', { gold: parsedTradeGold, itemIds: tradeItems })}", 1)
hub = hub.replace("{ownTrade?.confirmed && <div className=\"mt-2 text-center text-xs text-emerald-300\">Your current offer is confirmed.</div>}", "{offerDirty && <div className=\"mt-2 text-center text-xs text-amber-300\">Local offer changed — update it before confirming.</div>}{ownTrade?.confirmed && !offerDirty && <div className=\"mt-2 text-center text-xs text-emerald-300\">Your current server offer is confirmed.</div>}", 1)

HUB.write_text(hub, encoding='utf-8')

TEST.write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SocialSystems } from '../engine/SocialSystems.mjs';

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-social-85-'));
  const systems = new SocialSystems(path.join(dir, 'social.json'));
  const make = (id, name, x = 10) => ({ id, name, level: 20, vocation: 'knight', mapId: 'eldoria', x, y: 10, hp: 240, maxHp: 300, gold: 5000, inventory: [] });
  const a = make('a', 'Alice'); const b = make('b', 'Bob', 11);
  const players = new Map([[a.id, a], [b.id, b]]);
  return { dir, systems, a, b, players };
}

test('8.5 invite decline flows are explicit and party leadership transfer is server-validated', () => {
  const { dir, systems, a, b, players } = setup();
  try {
    assert.equal(systems.inviteParty(a, b, players).ok, true);
    assert.equal(systems.declinePartyInvite(b).ok, true);
    assert.equal(systems.acceptParty(b).ok, false);
    assert.equal(systems.inviteParty(a, b, players).ok, true);
    assert.equal(systems.acceptParty(b).ok, true);
    assert.equal(systems.transferPartyLeadership(b, 'alice').ok, false);
    assert.equal(systems.transferPartyLeadership(a, 'bob').ok, true);
    assert.equal(systems.getParty(a).leaderKey, 'bob');

    assert.equal(systems.createGuild(a, 'Durable Friends').ok, true);
    assert.equal(systems.inviteGuild(a, b).ok, true);
    assert.equal(systems.declineGuildInvite(b).ok, true);
    assert.equal(systems.acceptGuild(b).ok, false);

    assert.equal(systems.requestTrade(a, b).ok, true);
    assert.equal(systems.declineTradeInvite(b).ok, true);
    assert.equal(systems.acceptTrade(b, players).ok, false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('8.5 failed guild creation persistence rolls back both guild state and gold', () => {
  const { dir, systems, a } = setup();
  try {
    const beforeGold = a.gold;
    systems.save = () => false;
    const result = systems.createGuild(a, 'Unsaved Guild');
    assert.equal(result.ok, false);
    assert.equal(a.gold, beforeGold);
    assert.equal(systems.getGuildByMember(a.name), null);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('8.5 failed persisted guild mutations roll back membership motd roles and removals', () => {
  const { dir, systems, a, b } = setup();
  try {
    assert.equal(systems.createGuild(a, 'Rollback Wardens').ok, true);
    assert.equal(systems.inviteGuild(a, b).ok, true);
    const originalSave = systems.save.bind(systems);
    systems.save = () => false;
    assert.equal(systems.acceptGuild(b).ok, false);
    assert.equal(systems.getGuildByMember(b.name), null);
    assert.ok(systems.guildInvites.has('bob'));

    systems.save = originalSave;
    assert.equal(systems.acceptGuild(b).ok, true);
    systems.save = () => false;
    const guildBefore = JSON.parse(JSON.stringify(systems.getGuildByMember(a.name)));
    assert.equal(systems.guildSetMotd(a, 'should rollback').ok, false);
    assert.equal(systems.getGuildByMember(a.name).motd, guildBefore.motd);
    assert.equal(systems.guildRole(a, 'bob', 'officer').ok, false);
    assert.equal(systems.getGuildByMember(b.name).members.bob.role, 'member');
    assert.equal(systems.kickGuild(a, 'bob').ok, false);
    assert.ok(systems.getGuildByMember(b.name));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('8.5 social snapshot publishes UI limits and bounded invite TTL without leaking unrelated state', () => {
  const { dir, systems, a, b, players } = setup();
  try {
    systems.inviteParty(a, b, players);
    const snap = systems.snapshot(b, players);
    assert.equal(snap.selfKey, 'bob');
    assert.deepEqual(snap.limits, { partyMax: 5, partyInviteRange: 12, tradeRange: 3, tradeMaxItems: 8, guildMax: 100 });
    assert.equal(snap.partyInvite.fromName, 'Alice');
    assert.ok(snap.partyInvite.expiresInMs > 0 && snap.partyInvite.expiresInMs <= 120_000);
    assert.equal('guilds' in snap, false);
    assert.equal('tradeInvites' in snap, false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('8.5 SocialHub exposes decline actions, leadership transfer and dirty-offer confirmation guard', () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), '..', 'src/components/SocialHub.tsx'), 'utf8');
  for (const action of ['party_decline', 'guild_decline', 'trade_decline', 'party_leader']) assert.match(source, new RegExp(action));
  assert.match(source, /offerDirty/);
  assert.match(source, /Update your offer first/);
  assert.match(source, /inviteSeconds/);
});
''', encoding='utf-8')

DOC.write_text(r'''# Mor'ia 8.5 — Social UX & Durability

## Goals

8.5 improves the existing authoritative party, guild and direct-trade stack rather than creating client-owned social state.

## Server integrity

- Guild creation now restores both guild state and the 1000g creation fee if durable persistence fails.
- Guild join, leave, MOTD, role and kick mutations roll back in-memory state when their atomic social save fails.
- Party leadership transfers are validated by the server.
- Party, guild and trade invites can be explicitly declined and are removed server-side.
- Social snapshots publish bounded UI limits and invite TTLs instead of requiring the client to duplicate policy constants.

## Player experience

- Invite cards show remaining lifetime and Accept/Decline controls.
- Party roster shows online level/vocation and HP bars, with explicit leadership transfer.
- Guild members are sorted online-first and leaders can transfer leadership deliberately.
- Trade confirmation is blocked when local offer controls differ from the server-owned offer; the player must update the offer first.

## Authority boundary

The browser renders social state and sends intents only. Membership, permissions, invite validity, trade proximity, item ownership, gold conservation and settlement remain authoritative on the server.
''', encoding='utf-8')

print("Mor'ia 8.5 social UX migration prepared")
