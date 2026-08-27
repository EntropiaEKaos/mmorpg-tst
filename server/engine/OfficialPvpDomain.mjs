// ===================================================================
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
