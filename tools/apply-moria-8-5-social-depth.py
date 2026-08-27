from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOCIAL = ROOT / 'server/engine/SocialSystems.mjs'
HUB = ROOT / 'src/components/SocialHub.tsx'
TEST = ROOT / 'server/test/social-depth-8-5.test.mjs'
DOC = ROOT / 'docs/MORIA_8_5_SOCIAL_DEPTH.md'

social = SOCIAL.read_text(encoding='utf-8')

old = "function freshPersistentState() {\n  return { version: 1, guilds: {} };\n}"
new = """function freshPersistentState() {
  return { version: 2, guilds: {}, profiles: {} };
}

function normalizeProfile(raw) {
  const profile = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const friends = {};
  for (const [rawKey, entry] of Object.entries(profile.friends || {}).slice(0, 100)) {
    const key = playerKey(rawKey || entry?.name);
    if (!key) continue;
    friends[key] = { name: cleanText(entry?.name || rawKey, 24) || rawKey, addedAt: Number(entry?.addedAt) || Date.now() };
  }
  const ignores = {};
  for (const [rawKey, entry] of Object.entries(profile.ignores || {}).slice(0, 100)) {
    const key = playerKey(rawKey || entry?.name);
    if (!key) continue;
    ignores[key] = { name: cleanText(entry?.name || rawKey, 24) || rawKey, addedAt: Number(entry?.addedAt) || Date.now() };
  }
  return { friends, ignores };
}"
if old not in social: raise SystemExit('freshPersistentState anchor missing')
social = social.replace(old, new, 1)

old = """      this.state = { version: 1, guilds };
      return true;"""
new = """      const profiles = {};
      for (const [rawKey, source] of Object.entries(raw.profiles || {}).slice(0, 5000)) {
        const key = playerKey(rawKey);
        if (!key) continue;
        profiles[key] = normalizeProfile(source);
      }
      this.state = { version: 2, guilds, profiles };
      return true;"""
if old not in social: raise SystemExit('load state anchor missing')
social = social.replace(old, new, 1)

anchor = """  getParty(playerOrName) {
    const key = playerKey(typeof playerOrName === 'string' ? playerOrName : playerOrName?.name);
    const id = this.partyByPlayer.get(key);
    return id ? this.parties.get(id) || null : null;
  }
"""
insert = anchor + """
  getProfile(name, create = false) {
    const key = playerKey(name);
    if (!key) return null;
    if (!this.state.profiles || typeof this.state.profiles !== 'object') this.state.profiles = {};
    if (!this.state.profiles[key] && create) this.state.profiles[key] = normalizeProfile({});
    return this.state.profiles[key] || null;
  }

  isIgnored(ownerName, otherName) {
    const profile = this.getProfile(ownerName, false);
    return Boolean(profile?.ignores?.[playerKey(otherName)]);
  }

  socialInteractionAllowed(a, b) {
    if (!a || !b) return false;
    return !this.isIgnored(a.name, b.name) && !this.isIgnored(b.name, a.name);
  }

  addFriend(player, target) {
    if (!target || target.id === player.id) return { ok: false, error: 'Choose another online player.' };
    if (!this.socialInteractionAllowed(player, target)) return { ok: false, error: 'Social interaction unavailable.' };
    const owner = this.getProfile(player.name, true);
    const targetKey = playerKey(target.name);
    if (owner.friends[targetKey]) return { ok: false, error: 'That player is already on your friends list.' };
    if (Object.keys(owner.friends).length >= 100) return { ok: false, error: 'Friends list is full (100).' };
    owner.friends[targetKey] = { name: cleanText(target.name, 24), addedAt: Date.now() };
    this.save();
    return { ok: true, message: `${target.name} added to friends.` };
  }

  removeFriend(player, targetKey) {
    const owner = this.getProfile(player.name, false);
    const key = playerKey(targetKey);
    if (!owner?.friends?.[key]) return { ok: false, error: 'Friend not found.' };
    delete owner.friends[key];
    this.save();
    return { ok: true, message: 'Friend removed.' };
  }

  ignorePlayer(player, target) {
    if (!target || target.id === player.id) return { ok: false, error: 'Choose another online player.' };
    const owner = this.getProfile(player.name, true);
    const targetKey = playerKey(target.name);
    if (owner.ignores[targetKey]) return { ok: false, error: 'That player is already ignored.' };
    if (Object.keys(owner.ignores).length >= 100) return { ok: false, error: 'Ignore list is full (100).' };
    delete owner.friends[targetKey];
    owner.ignores[targetKey] = { name: cleanText(target.name, 24), addedAt: Date.now() };
    this.partyInvites.delete(playerKey(player.name));
    this.guildInvites.delete(playerKey(player.name));
    this.tradeInvites.delete(playerKey(player.name));
    this.save();
    return { ok: true, message: `${target.name} is now ignored.` };
  }

  unignorePlayer(player, targetKey) {
    const owner = this.getProfile(player.name, false);
    const key = playerKey(targetKey);
    if (!owner?.ignores?.[key]) return { ok: false, error: 'Ignored player not found.' };
    delete owner.ignores[key];
    this.save();
    return { ok: true, message: 'Player removed from ignore list.' };
  }
"""
if anchor not in social: raise SystemExit('getParty anchor missing')
social = social.replace(anchor, insert, 1)

for old_line, new_line in [
("    if (!target || target.id === player.id) return { ok: false, error: 'Choose another online player.' };\n    if (!nearby(player, target, 12)) return { ok: false, error: 'Party invite target must be nearby.' };",
 "    if (!target || target.id === player.id) return { ok: false, error: 'Choose another online player.' };\n    if (!this.socialInteractionAllowed(player, target)) return { ok: false, error: 'Social interaction unavailable.' };\n    if (!nearby(player, target, 12)) return { ok: false, error: 'Party invite target must be nearby.' };") ,
("    if (!target || target.id === player.id) return { ok: false, error: 'Choose another online player.' };\n    if (this.getGuildByMember(target.name)) return { ok: false, error: 'That player is already in a guild.' };",
 "    if (!target || target.id === player.id) return { ok: false, error: 'Choose another online player.' };\n    if (!this.socialInteractionAllowed(player, target)) return { ok: false, error: 'Social interaction unavailable.' };\n    if (this.getGuildByMember(target.name)) return { ok: false, error: 'That player is already in a guild.' };") ,
("    if (!target || target.id === player.id || !nearby(player, target, 3)) return { ok: false, error: 'Trade target must be within 3 tiles.' };",
 "    if (!target || target.id === player.id || !nearby(player, target, 3)) return { ok: false, error: 'Trade target must be within 3 tiles.' };\n    if (!this.socialInteractionAllowed(player, target)) return { ok: false, error: 'Social interaction unavailable.' };")
]:
    if old_line not in social: raise SystemExit(f'interaction guard anchor missing: {old_line[:40]}')
    social = social.replace(old_line, new_line, 1)

old = """  chatRecipients(player, channel, players) {
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
"""
new = """  chatRecipients(player, channel, players) {
    const all = Array.from(players.values());
    const visibleTo = (recipient) => recipient?.id === player.id || !this.isIgnored(recipient?.name, player.name);
    if (channel === 'world' || channel === 'trade') return all.filter(visibleTo).map(p => p.id);
    if (channel === 'say') return all.filter(p => visibleTo(p) && p.mapId === player.mapId && Math.abs(p.x - player.x) + Math.abs(p.y - player.y) <= 10).map(p => p.id);
    if (channel === 'party') {
      const party = this.getParty(player); return party ? party.members.map(key => onlineByKey(players, key)).filter(visibleTo).map(p => p.id) : [player.id];
    }
    if (channel === 'guild') {
      const guild = this.getGuildByMember(player.name); return guild ? Object.keys(guild.members).map(key => onlineByKey(players, key)).filter(visibleTo).map(p => p.id) : [player.id];
    }
    return [player.id];
  }
"""
if old not in social: raise SystemExit('chatRecipients anchor missing')
social = social.replace(old, new, 1)

old = """    return {
      party: party ? {"""
new = """    const profile = this.getProfile(player.name, false) || normalizeProfile({});
    const friends = Object.entries(profile.friends).map(([friendKey, friend]) => {
      const online = onlineByKey(players, friendKey);
      return { key: friendKey, name: friend.name, online: Boolean(online), player: online ? publicPlayer(online) : null, addedAt: friend.addedAt };
    }).sort((a, b) => Number(b.online) - Number(a.online) || a.name.localeCompare(b.name));
    const ignored = Object.entries(profile.ignores).map(([ignoredKey, entry]) => ({ key: ignoredKey, name: entry.name, addedAt: entry.addedAt }));
    return {
      friends,
      ignored,
      party: party ? {"""
if old not in social: raise SystemExit('snapshot return anchor missing')
social = social.replace(old, new, 1)

old = """      case 'party_create': result = this.createParty(player); break;"""
new = """      case 'friend_add': result = this.addFriend(player, target); break;
      case 'friend_remove': result = this.removeFriend(player, payload.targetKey); break;
      case 'ignore_add': result = this.ignorePlayer(player, target); break;
      case 'ignore_remove': result = this.unignorePlayer(player, payload.targetKey); break;
      case 'party_create': result = this.createParty(player); break;"""
if old not in social: raise SystemExit('handle action anchor missing')
social = social.replace(old, new, 1)
SOCIAL.write_text(social, encoding='utf-8')

hub = HUB.read_text(encoding='utf-8')
hub = hub.replace("type Tab = 'party' | 'guild' | 'trade';", "type Tab = 'friends' | 'party' | 'guild' | 'trade';", 1)
hub = hub.replace("const [tab, setTab] = useState<Tab>('party');", "const [tab, setTab] = useState<Tab>('friends');", 1)
old_tabs = "{(['party', 'guild', 'trade'] as const).map(id => <button key={id} onClick={() => setTab(id)} className={`${button} ${tab === id ? 'border-cyan-300/50 text-cyan-100' : 'border-slate-700 text-slate-400'}`}>{id === 'party' ? '👥 Party' : id === 'guild' ? '🛡 Guild' : '🤝 Trade'}</button>)}"
new_tabs = "{(['friends', 'party', 'guild', 'trade'] as const).map(id => <button key={id} onClick={() => setTab(id)} className={`${button} ${tab === id ? 'border-cyan-300/50 text-cyan-100' : 'border-slate-700 text-slate-400'}`}>{id === 'friends' ? '⭐ Friends' : id === 'party' ? '👥 Party' : id === 'guild' ? '🛡 Guild' : '🤝 Trade'}</button>)}"
if old_tabs not in hub: raise SystemExit('SocialHub tabs anchor missing')
hub = hub.replace(old_tabs, new_tabs, 1)
anchor = """        <div className=\"moria-scrollbar flex-1 overflow-y-auto p-4 text-sm\">
          {tab === 'party' &&"""
friends_ui = """        <div className=\"moria-scrollbar flex-1 overflow-y-auto p-4 text-sm\">
          {tab === 'friends' && <div className=\"grid gap-4 lg:grid-cols-3\">
            <div className={card}>
              <div className=\"moria-eyebrow text-amber-300\">FRIENDS</div>
              <div className=\"mt-3 space-y-2\">{Array.isArray(social?.friends) && social.friends.length ? social.friends.map((friend: any) => <div key={friend.key} className=\"rounded-xl border border-slate-800 bg-slate-950/55 p-2\"><div className=\"flex items-center justify-between gap-2\"><span><b>{friend.online ? '🟢' : '⚫'} {friend.name}</b>{friend.online && friend.player ? <small className=\"ml-2 text-slate-400\">Lv {friend.player.level} · {friend.player.mapId}</small> : null}</span><button onClick={() => act('friend_remove', { targetKey: friend.key })} className={button}>Remove</button></div></div>) : <span className=\"text-slate-500\">Your friends list is empty.</span>}</div>
            </div>
            <div className={card}>
              <div className=\"moria-eyebrow text-cyan-300\">NEARBY ADVENTURERS</div>
              <div className=\"mt-3 space-y-2\">{nearby.length ? nearby.map((p: any) => <div key={p.id} className=\"rounded-xl bg-slate-900/60 p-2\"><div className=\"flex items-center justify-between gap-2\"><span><b>{p.name}</b> · Lv {p.level}</span><div className=\"flex gap-1\"><button onClick={() => act('friend_add', { targetId: p.id })} className={button}>Add</button><button onClick={() => act('ignore_add', { targetId: p.id })} className={`${button} border-rose-500/40 text-rose-200`}>Ignore</button></div></div></div>) : <span className=\"text-slate-500\">No nearby players.</span>}</div>
            </div>
            <div className={card}>
              <div className=\"moria-eyebrow text-rose-300\">IGNORED</div>
              <p className=\"mt-2 text-[11px] text-slate-500\">Ignored players cannot reach you through social invitations or chat. Their online presence is intentionally hidden.</p>
              <div className=\"mt-3 space-y-2\">{Array.isArray(social?.ignored) && social.ignored.length ? social.ignored.map((entry: any) => <div key={entry.key} className=\"flex items-center justify-between rounded-xl bg-slate-900/60 p-2\"><span>🚫 {entry.name}</span><button onClick={() => act('ignore_remove', { targetKey: entry.key })} className={button}>Unignore</button></div>) : <span className=\"text-slate-500\">Nobody ignored.</span>}</div>
            </div>
          </div>}

          {tab === 'party' &&"""
if anchor not in hub: raise SystemExit('SocialHub content anchor missing')
hub = hub.replace(anchor, friends_ui, 1)
HUB.write_text(hub, encoding='utf-8')

TEST.write_text(r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SocialSystems } from '../engine/SocialSystems.mjs';

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-social-85-'));
  const db = path.join(dir, 'social.json');
  const systems = new SocialSystems(db);
  const make = (id, name, x = 10) => ({ id, name, level: 20, vocation: 'knight', mapId: 'eldoria', x, y: 10, hp: 100, maxHp: 100, gold: 5000, inventory: [] });
  const a = make('a', 'Alice'); const b = make('b', 'Bob', 11); const c = make('c', 'Cara', 12);
  const players = new Map([[a.id, a], [b.id, b], [c.id, c]]);
  return { dir, db, systems, players, a, b, c };
}

test('8.5 friends persist and expose presence only for online friends', () => {
  const { dir, db, systems, players, a, b } = setup();
  try {
    assert.equal(systems.addFriend(a, b).ok, true);
    let snap = systems.snapshot(a, players);
    assert.equal(snap.friends.length, 1);
    assert.equal(snap.friends[0].online, true);
    assert.equal(snap.friends[0].player.name, 'Bob');
    const restored = new SocialSystems(db);
    const offlinePlayers = new Map([[a.id, a]]);
    snap = restored.snapshot(a, offlinePlayers);
    assert.equal(snap.friends[0].name, 'Bob');
    assert.equal(snap.friends[0].online, false);
    assert.equal(snap.friends[0].player, null);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('8.5 ignore is authoritative for chat and social invitations without presence leakage', () => {
  const { dir, systems, players, a, b } = setup();
  try {
    assert.equal(systems.ignorePlayer(b, a).ok, true);
    assert.deepEqual(new Set(systems.chatRecipients(a, 'world', players)), new Set(['a', 'c']));
    assert.equal(systems.inviteParty(a, b, players).ok, false);
    assert.equal(systems.requestTrade(a, b).ok, false);
    const snap = systems.snapshot(b, players);
    assert.deepEqual(snap.ignored.map(entry => Object.keys(entry).sort()), [['addedAt', 'key', 'name']]);
    assert.equal('online' in snap.ignored[0], false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('8.5 ignoring a friend removes the friendship and unignore restores interaction eligibility', () => {
  const { dir, systems, players, a, b } = setup();
  try {
    assert.equal(systems.addFriend(a, b).ok, true);
    assert.equal(systems.ignorePlayer(a, b).ok, true);
    assert.equal(systems.snapshot(a, players).friends.length, 0);
    assert.equal(systems.inviteParty(a, b, players).ok, false);
    assert.equal(systems.unignorePlayer(a, 'bob').ok, true);
    assert.equal(systems.inviteParty(a, b, players).ok, true);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
''', encoding='utf-8')

DOC.write_text("""# Mor'ia 8.5 — Social Depth

## Persistent social graph
- Friends and ignore lists are server-persisted per character.
- Friend presence is derived only from the authoritative online roster.
- Ignore entries never disclose online status, map, coordinates or level.

## Ignore enforcement
- Ignore is enforced server-side for world/trade/say/party/guild chat delivery.
- Party, guild and direct-trade invitations fail when either side ignores the other.
- Adding an ignored player as a friend is rejected; ignoring an existing friend removes that friendship.

## Limits
- Friends: 100 per character.
- Ignore list: 100 per character.
- Legacy social databases migrate from version 1 guild-only state to version 2 without deleting guild data.
""", encoding='utf-8')

print("Mor'ia 8.5 social depth prepared")
