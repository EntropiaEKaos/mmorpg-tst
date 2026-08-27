from pathlib import Path

ROOT = Path('.')
def read(path): return (ROOT / path).read_text(encoding='utf-8')
def write(path, text): (ROOT / path).write_text(text, encoding='utf-8')
def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return text.replace(old, new, 1)

DOMAIN = r'''// ===================================================================
// MOR'IA — OFFICIAL PVP DOMAIN
// Encapsulates opt-in PvP, aggression/skulls, damage, cooldowns and death.
// ===================================================================

const clamp = (value, min, max, fallback = min) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
};

export const PVP_RULES = Object.freeze({
  attackCooldownMs: 900,
  maxRange: 2,
  aggressionDecayMs: 5 * 60_000,
  respawn: Object.freeze({ mapId: 'eldoria', x: 40, y: 40 }),
});

export function skullForAggression(value) {
  if (value >= 80) return 'black';
  if (value >= 55) return 'red';
  if (value >= 35) return 'orange';
  if (value >= 15) return 'yellow';
  if (value > 0) return 'white';
  return 'none';
}

function state(host, player) {
  if (!host || typeof host.ensurePlayer !== 'function') throw new TypeError('OfficialPvpDomain requires an OfficialSystems-compatible host.');
  return host.ensurePlayer(player);
}

export class OfficialPvpDomain {
  toggle(host, player) {
    const s = state(host, player);
    s.pvp.enabled = !s.pvp.enabled;
    return s.pvp.enabled;
  }

  attack(host, player, target, getDerivedStats = null, now = Date.now()) {
    const s = state(host, player);
    const ts = target ? state(host, target) : null;
    if (!target || target.id === player.id || !s.pvp.enabled || !ts.pvp.enabled || target.mapId !== player.mapId) return null;
    if (now - s.lastPvpAttack < PVP_RULES.attackCooldownMs) return null;
    if (Math.abs(target.x - player.x) + Math.abs(target.y - player.y) > PVP_RULES.maxRange) return null;

    s.lastPvpAttack = now;
    const attacker = typeof getDerivedStats === 'function' ? getDerivedStats(player) : null;
    const defender = typeof getDerivedStats === 'function' ? getDerivedStats(target) : null;
    const attack = Number(attacker?.totalAttack) || player.attack || 0;
    const defense = Number(defender?.totalDefense) || target.defense || 0;
    const reduction = clamp(defender?.damageReduction, 0, 80, 0);
    const raw = Math.max(1, (attack + player.level * 0.8 - defense * 0.5) * 0.65);
    const damage = Math.max(1, Math.floor(raw * (1 - reduction / 100)));

    target.hp -= damage;
    player.stats.damageDealt = (player.stats.damageDealt || 0) + damage;
    target.stats.damageTaken = (target.stats.damageTaken || 0) + damage;
    s.pvp.aggression = Math.min(100, s.pvp.aggression + 2);
    s.pvp.lastAggression = now;
    s.pvp.skull = skullForAggression(s.pvp.aggression);

    let killed = false;
    if (target.hp <= 0) {
      killed = true;
      target.hp = Number(defender?.totalMaxHp) || target.maxHp;
      target.mana = Number(defender?.totalMaxMana) || target.maxMana;
      target.mapId = PVP_RULES.respawn.mapId;
      target.x = PVP_RULES.respawn.x;
      target.y = PVP_RULES.respawn.y;
      target.stats.deaths = (target.stats.deaths || 0) + 1;
      s.pvp.aggression = Math.min(100, s.pvp.aggression + 18);
      s.pvp.skull = skullForAggression(s.pvp.aggression);
    }
    return { damage, killed, skull: s.pvp.skull };
  }

  tick(host, player, now = Date.now()) {
    const s = state(host, player);
    if (s.pvp.aggression <= 0 || now - s.pvp.lastAggression <= PVP_RULES.aggressionDecayMs) return false;
    s.pvp.aggression = Math.max(0, s.pvp.aggression - 1);
    s.pvp.lastAggression = now;
    s.pvp.skull = skullForAggression(s.pvp.aggression);
    return true;
  }

  publicState(host, player) {
    const s = state(host, player);
    return { enabled: s.pvp.enabled, skull: s.pvp.skull, title: s.titles.active };
  }
}

export const officialPvpDomain = new OfficialPvpDomain();
'''
write('server/engine/OfficialPvpDomain.mjs', DOMAIN)

path = 'server/engine/OfficialSystems.mjs'
text = read(path)
anchor = "import { officialProgressionDomain } from './OfficialProgressionDomain.mjs';\n"
text = replace_once(text, anchor, anchor + "import { officialPvpDomain } from './OfficialPvpDomain.mjs';\n", 'pvp import')
old_skull = r'''function skullForAggression(value) {
  if (value >= 80) return 'black';
  if (value >= 55) return 'red';
  if (value >= 35) return 'orange';
  if (value >= 15) return 'yellow';
  if (value > 0) return 'white';
  return 'none';
}

'''
text = replace_once(text, old_skull, '', 'legacy skull helper')
old_tick = r'''  tickPlayer(player, now = Date.now()) {
    const s = this.ensurePlayer(player);
    officialProgressionDomain.tickStamina(this, player, now);
    if (s.pvp.aggression > 0 && now - s.pvp.lastAggression > 5 * 60_000) {
      s.pvp.aggression = Math.max(0, s.pvp.aggression - 1);
      s.pvp.lastAggression = now;
      s.pvp.skull = skullForAggression(s.pvp.aggression);
    }
    this.ensureWorldEvent(now);
  }
'''
new_tick = r'''  tickPlayer(player, now = Date.now()) {
    officialProgressionDomain.tickStamina(this, player, now);
    officialPvpDomain.tick(this, player, now);
    this.ensureWorldEvent(now);
  }
'''
text = replace_once(text, old_tick, new_tick, 'pvp decay tick')
old_pvp = r'''  pvpToggle(player) {
    const s = this.ensurePlayer(player); s.pvp.enabled = !s.pvp.enabled; return s.pvp.enabled;
  }

  pvpAttack(player, target, getDerivedStats = null) {
    const now = Date.now();
    const s = this.ensurePlayer(player);
    const ts = target ? this.ensurePlayer(target) : null;
    if (!target || target.id === player.id || !s.pvp.enabled || !ts.pvp.enabled || target.mapId !== player.mapId) return null;
    if (now - s.lastPvpAttack < 900) return null;
    if (Math.abs(target.x - player.x) + Math.abs(target.y - player.y) > 2) return null;
    s.lastPvpAttack = now;
    const attacker = typeof getDerivedStats === 'function' ? getDerivedStats(player) : null;
    const defender = typeof getDerivedStats === 'function' ? getDerivedStats(target) : null;
    const attack = Number(attacker?.totalAttack) || player.attack || 0;
    const defense = Number(defender?.totalDefense) || target.defense || 0;
    const reduction = clamp(defender?.damageReduction, 0, 80, 0);
    const raw = Math.max(1, (attack + player.level * 0.8 - defense * 0.5) * 0.65);
    const damage = Math.max(1, Math.floor(raw * (1 - reduction / 100)));
    target.hp -= damage;
    player.stats.damageDealt = (player.stats.damageDealt || 0) + damage;
    target.stats.damageTaken = (target.stats.damageTaken || 0) + damage;
    s.pvp.aggression = Math.min(100, s.pvp.aggression + 2);
    s.pvp.lastAggression = now;
    s.pvp.skull = skullForAggression(s.pvp.aggression);
    let killed = false;
    if (target.hp <= 0) {
      killed = true;
      target.hp = Number(defender?.totalMaxHp) || target.maxHp;
      target.mana = Number(defender?.totalMaxMana) || target.maxMana;
      target.mapId = 'eldoria'; target.x = 40; target.y = 40;
      target.stats.deaths = (target.stats.deaths || 0) + 1;
      s.pvp.aggression = Math.min(100, s.pvp.aggression + 18); s.pvp.skull = skullForAggression(s.pvp.aggression);
    }
    return { damage, killed, skull: s.pvp.skull };
  }

  publicPvp(player) {
    const s = this.ensurePlayer(player);
    return { enabled: s.pvp.enabled, skull: s.pvp.skull, title: s.titles.active };
  }
'''
new_pvp = r'''  pvpToggle(player) {
    return officialPvpDomain.toggle(this, player);
  }

  pvpAttack(player, target, getDerivedStats = null) {
    return officialPvpDomain.attack(this, player, target, getDerivedStats);
  }

  publicPvp(player) {
    return officialPvpDomain.publicState(this, player);
  }
'''
text = replace_once(text, old_pvp, new_pvp, 'pvp methods')
write(path, text)

TEST = r'''import test from 'node:test';
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
'''
write('server/test/official-pvp-domain.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.7 — PvP Domain

Foundation 7.7 isolates authoritative PvP into `OfficialPvpDomain`.

The domain owns mutual opt-in validation, same-map/range requirements, attack cooldown, derived-stat damage, aggression, skull tiers, death/respawn handling and aggression decay. `OfficialSystems` keeps compatibility wrappers, so action names and snapshots remain unchanged.

The rule constants now live in one place, giving later expansions a stable base for arenas, war zones, guild wars, safe zones, bounty systems and map-specific PvP policies.
'''
write('docs/FOUNDATION_7_7_PVP_DOMAIN.md', DOC)
print('Foundation 7.7 PvP domain extraction applied')
