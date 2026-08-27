import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SocialSystems } from '../engine/SocialSystems.mjs';

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'moria-social-'));
  const systems = new SocialSystems(path.join(dir, 'social.json'));
  const make = (id, name, x = 10, y = 10) => ({
    id, name, level: 20, vocation: 'knight', mapId: 'eldoria', x, y,
    hp: 300, maxHp: 300, gold: 5000,
    inventory: [
      { id: `${id}_potion`, name: 'Health Potion', icon: '🧪', type: 'potion', quantity: 2, value: 50 },
      { id: `${id}_sword`, name: `${name} Sword`, icon: '⚔', type: 'equipment', quantity: 1, value: 200, equipment: { id: `${id}_sword`, slot: 'weapon', attack: 5 } },
    ],
  });
  const a = make('a', 'Alice'); const b = make('b', 'Bob', 11, 10); const c = make('c', 'Cara', 30, 30);
  const players = new Map([[a.id, a], [b.id, b], [c.id, c]]);
  return { systems, dir, players, a, b, c };
}

function cleanup(dir) { fs.rmSync(dir, { recursive: true, force: true }); }

test('party invites are nearby, capped by membership and party chat is private', () => {
  const { systems, dir, players, a, b, c } = setup();
  try {
    assert.equal(systems.inviteParty(a, c, players).ok, false);
    assert.equal(systems.inviteParty(a, b, players).ok, true);
    assert.equal(systems.acceptParty(b).ok, true);
    const party = systems.getParty(a);
    assert.deepEqual(party.members.sort(), ['alice', 'bob']);
    assert.deepEqual(new Set(systems.chatRecipients(a, 'party', players)), new Set(['a', 'b']));
    assert.equal(systems.leaveParty(b).ok, true);
    assert.deepEqual(systems.chatRecipients(a, 'party', players), ['a']);
  } finally { cleanup(dir); }
});

test('guild membership persists with role permissions and scoped guild chat', () => {
  const { systems, dir, players, a, b, c } = setup();
  try {
    const before = a.gold;
    assert.equal(systems.createGuild(a, 'Wardens of Moria').ok, true);
    assert.equal(a.gold, before - 1000);
    assert.equal(systems.inviteGuild(a, b).ok, true);
    assert.equal(systems.acceptGuild(b).ok, true);
    assert.equal(systems.guildRole(a, 'bob', 'officer').ok, true);
    assert.deepEqual(new Set(systems.chatRecipients(a, 'guild', players)), new Set(['a', 'b']));
    assert.equal(systems.guildSetMotd(b, 'Hold the line').ok, true);

    const restored = new SocialSystems(path.join(dir, 'social.json'));
    const guild = restored.getGuildByMember('Bob');
    assert.equal(guild.name, 'Wardens of Moria');
    assert.equal(guild.members.bob.role, 'officer');
    assert.equal(guild.motd, 'Hold the line');
    assert.equal(restored.getGuildByMember(c.name), null);
  } finally { cleanup(dir); }
});

test('direct trade requires proximity and settles item plus gold atomically', () => {
  const { systems, dir, players, a, b, c } = setup();
  try {
    assert.equal(systems.requestTrade(a, c).ok, false);
    assert.equal(systems.requestTrade(a, b).ok, true);
    assert.equal(systems.acceptTrade(b, players).ok, true);
    assert.equal(systems.setTradeOffer(a, { gold: 125, itemIds: ['a_sword'] }).ok, true);
    assert.equal(systems.setTradeOffer(b, { gold: 25, itemIds: ['b_potion'] }).ok, true);
    const aGold = a.gold; const bGold = b.gold;
    assert.equal(systems.confirmTrade(a, players).completed, undefined);
    const result = systems.confirmTrade(b, players);
    assert.equal(result.completed, true);
    assert.equal(a.gold, aGold - 125 + 25);
    assert.equal(b.gold, bGold - 25 + 125);
    assert.equal(a.inventory.some(item => item.name === 'Health Potion' && item.id.startsWith('trade_')), true);
    assert.equal(b.inventory.some(item => item.name === 'Alice Sword' && item.id.startsWith('trade_')), true);
    assert.equal(systems.tradeByPlayer.size, 0);
  } finally { cleanup(dir); }
});

test('trade confirmation revalidates inventory and cannot duplicate removed items', () => {
  const { systems, dir, players, a, b } = setup();
  try {
    systems.requestTrade(a, b); systems.acceptTrade(b, players);
    systems.setTradeOffer(a, { gold: 0, itemIds: ['a_sword'] });
    systems.setTradeOffer(b, { gold: 0, itemIds: [] });
    systems.confirmTrade(a, players);
    a.inventory = a.inventory.filter(item => item.id !== 'a_sword');
    const result = systems.confirmTrade(b, players);
    assert.equal(result.ok, false);
    assert.match(result.error, /inventory changed/i);
    assert.equal(b.inventory.some(item => item.name === 'Alice Sword'), false);
    assert.equal(systems.tradeByPlayer.size, 0);
  } finally { cleanup(dir); }
});

test('say chat is map-and-range scoped while world and trade channels remain realm-wide', () => {
  const { systems, dir, players, a, b, c } = setup();
  try {
    assert.deepEqual(new Set(systems.chatRecipients(a, 'say', players)), new Set(['a', 'b']));
    assert.deepEqual(new Set(systems.chatRecipients(a, 'world', players)), new Set(['a', 'b', 'c']));
    assert.deepEqual(new Set(systems.chatRecipients(a, 'trade', players)), new Set(['a', 'b', 'c']));
  } finally { cleanup(dir); }
});
