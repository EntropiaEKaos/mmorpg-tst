import test from 'node:test';
import assert from 'node:assert/strict';
import { OfficialPvpDomain, PVP_RULES, skullForAggression } from '../engine/OfficialPvpDomain.mjs';

function player(id, x = 10, y = 10) {
  return {
    id, name: id, level: 10, mapId: 'eldoria', x, y, attack: 20, defense: 5,
    hp: 100, maxHp: 100, mana: 50, maxMana: 50,
    stats: { damageDealt: 0, damageTaken: 0, deaths: 0 },
    official: { pvp: { enabled: false, skull: 'none', aggression: 0, lastAggression: 0 }, lastPvpAttack: 0, titles: { active: null } },
  };
}
const host = { ensurePlayer(p) { return p.official; } };

test('pvp domain requires mutual opt-in, same map, range and cooldown', () => {
  const domain = new OfficialPvpDomain();
  const a = player('a');
  const b = player('b', 11, 10);
  const now = 10_000;
  assert.equal(domain.attack(host, a, b, null, now), null);
  domain.toggle(host, a);
  domain.toggle(host, b);
  b.mapId = 'frostpeak';
  assert.equal(domain.attack(host, a, b, null, now), null);
  b.mapId = 'eldoria'; b.x = 20;
  assert.equal(domain.attack(host, a, b, null, now), null);
  b.x = 11;
  const hit = domain.attack(host, a, b, null, now);
  assert.ok(hit?.damage > 0);
  assert.equal(domain.attack(host, a, b, null, now + PVP_RULES.attackCooldownMs - 1), null);
});

test('pvp domain uses authoritative derived combat stats', () => {
  const domain = new OfficialPvpDomain();
  const a = player('a'); const b = player('b', 11, 10);
  domain.toggle(host, a); domain.toggle(host, b);
  const result = domain.attack(host, a, b, p => p.id === 'a'
    ? { totalAttack: 100 }
    : { totalDefense: 20, damageReduction: 25, totalMaxHp: 120, totalMaxMana: 70 }, 20_000);
  assert.ok(result.damage > 0);
  assert.equal(a.stats.damageDealt, result.damage);
  assert.equal(b.stats.damageTaken, result.damage);
  assert.equal(a.official.pvp.aggression, 2);
});

test('pvp lethal hit respawns target and escalates attacker skull', () => {
  const domain = new OfficialPvpDomain();
  const a = player('a'); const b = player('b', 11, 10);
  b.hp = 1;
  domain.toggle(host, a); domain.toggle(host, b);
  const result = domain.attack(host, a, b, p => p.id === 'a'
    ? { totalAttack: 1000 }
    : { totalDefense: 0, damageReduction: 0, totalMaxHp: 150, totalMaxMana: 80 }, 30_000);
  assert.equal(result.killed, true);
  assert.equal(b.mapId, PVP_RULES.respawn.mapId);
  assert.equal(b.x, PVP_RULES.respawn.x);
  assert.equal(b.y, PVP_RULES.respawn.y);
  assert.equal(b.hp, 150);
  assert.equal(b.mana, 80);
  assert.equal(b.stats.deaths, 1);
  assert.equal(a.official.pvp.aggression, 20);
  assert.equal(result.skull, 'yellow');
});

test('pvp aggression decay and skull thresholds are deterministic', () => {
  const domain = new OfficialPvpDomain();
  const a = player('a');
  a.official.pvp.aggression = 80;
  a.official.pvp.skull = 'black';
  a.official.pvp.lastAggression = 1000;
  assert.equal(domain.tick(host, a, 1000 + PVP_RULES.aggressionDecayMs), false);
  assert.equal(domain.tick(host, a, 1001 + PVP_RULES.aggressionDecayMs), true);
  assert.equal(a.official.pvp.aggression, 79);
  assert.equal(a.official.pvp.skull, 'red');
  assert.equal(skullForAggression(0), 'none');
  assert.equal(skullForAggression(15), 'yellow');
  assert.equal(skullForAggression(100), 'black');
});

test('pvp public state exposes only opt-in skull and cosmetic title', () => {
  const domain = new OfficialPvpDomain();
  const a = player('a');
  a.official.pvp.enabled = true;
  a.official.pvp.skull = 'orange';
  a.official.titles.active = 'Shadow Walker';
  assert.deepEqual(domain.publicState(host, a), { enabled: true, skull: 'orange', title: 'Shadow Walker' });
});
