import test from 'node:test';
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
    assert.equal(snap.friends.length, 1); assert.equal(snap.friends[0].online, true); assert.equal(snap.friends[0].player.name, 'Bob');
    const restored = new SocialSystems(db);
    snap = restored.snapshot(a, new Map([[a.id, a]]));
    assert.equal(snap.friends[0].name, 'Bob'); assert.equal(snap.friends[0].online, false); assert.equal(snap.friends[0].player, null);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('8.5 ignore is authoritative for chat and invitations without presence leakage', () => {
  const { dir, systems, players, a, b } = setup();
  try {
    assert.equal(systems.ignorePlayer(b, a).ok, true);
    assert.deepEqual(new Set(systems.chatRecipients(a, 'world', players)), new Set(['a', 'c']));
    assert.equal(systems.inviteParty(a, b, players).ok, false); assert.equal(systems.requestTrade(a, b).ok, false);
    const ignored = systems.snapshot(b, players).ignored[0];
    assert.deepEqual(Object.keys(ignored).sort(), ['addedAt', 'key', 'name']); assert.equal('online' in ignored, false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('8.5 ignoring a friend removes friendship and unignore restores eligibility', () => {
  const { dir, systems, players, a, b } = setup();
  try {
    assert.equal(systems.addFriend(a, b).ok, true); assert.equal(systems.ignorePlayer(a, b).ok, true);
    assert.equal(systems.snapshot(a, players).friends.length, 0); assert.equal(systems.inviteParty(a, b, players).ok, false);
    assert.equal(systems.unignorePlayer(a, 'bob').ok, true); assert.equal(systems.inviteParty(a, b, players).ok, true);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
