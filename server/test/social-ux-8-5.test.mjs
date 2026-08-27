import test from 'node:test';
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
