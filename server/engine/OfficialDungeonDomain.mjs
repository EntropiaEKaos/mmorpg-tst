// ===================================================================
// MOR'IA — OFFICIAL DUNGEON DOMAIN
// Owns dungeon run lifecycle, scaling, wave progress and final rewards.
// ===================================================================

import { DUNGEON_WAVES } from './OfficialCatalogs.mjs';

export const DUNGEON_RUN_LENGTHS = Object.freeze([3, 5, 10]);

function state(host, player) {
  if (!host || typeof host.ensurePlayer !== 'function') throw new TypeError('OfficialDungeonDomain requires an OfficialSystems-compatible host.');
  return host.ensurePlayer(player);
}

export class OfficialDungeonDomain {
  getWave(wave, playerLevel) {
    const normalizedWave = Math.max(1, Math.min(DUNGEON_WAVES.length, Math.floor(Number(wave) || 1)));
    const level = Math.max(1, Math.floor(Number(playerLevel) || 1));
    const base = DUNGEON_WAVES[normalizedWave - 1];
    const scale = 1 + Math.max(0, level - 1) * 0.025;
    return {
      ...base,
      hp: Math.floor(base.hp * scale),
      attack: Math.floor(base.attack * scale),
      defense: Math.floor(base.defense * (0.8 + scale * 0.2)),
      xp: Math.floor(base.xp * scale),
      wave: normalizedWave,
    };
  }

  start(host, player, maxWaves, now = Date.now()) {
    const s = state(host, player);
    const waves = DUNGEON_RUN_LENGTHS.includes(Number(maxWaves)) ? Number(maxWaves) : 3;
    if (s.dungeon.active) return { ok: false, error: 'A dungeon run is already active.' };
    const requiredLevel = Math.max(1, waves - 2);
    if (player.level < requiredLevel) return { ok: false, error: `Level ${requiredLevel} required.` };
    const runId = `dungeon_${player.id}_${now}`;
    s.dungeon = {
      ...s.dungeon,
      active: true,
      runId,
      wave: 1,
      maxWaves: waves,
      killsRemaining: this.getWave(1, player.level).count,
    };
    return { ok: true, runId, wave: 1, maxWaves: waves };
  }

  abandon(host, player) {
    const s = state(host, player);
    if (!s.dungeon.active) return false;
    s.dungeon.active = false;
    s.dungeon.runId = null;
    s.dungeon.killsRemaining = 0;
    return true;
  }

  fail(host, player) {
    return this.abandon(host, player);
  }

  onMonsterKill(host, player, monster) {
    const s = state(host, player);
    if (!s.dungeon.active || monster?.dungeonOwnerId !== player.id || monster?.dungeonRunId !== s.dungeon.runId) {
      return { nextDungeonWave: null, dungeonComplete: null };
    }

    s.dungeon.killsRemaining = Math.max(0, Number(s.dungeon.killsRemaining || 0) - 1);
    if (s.dungeon.killsRemaining > 0) return { nextDungeonWave: null, dungeonComplete: null };

    if (s.dungeon.wave < s.dungeon.maxWaves) {
      s.dungeon.wave++;
      s.dungeon.killsRemaining = this.getWave(s.dungeon.wave, player.level).count;
      return { nextDungeonWave: s.dungeon.wave, dungeonComplete: null };
    }

    const waves = s.dungeon.maxWaves;
    const reward = {
      gold: waves * 150 + player.level * 20,
      xp: waves * 200 + player.level * 25,
      coins: waves * 2,
    };
    player.gold += reward.gold;
    player.xp += reward.xp;
    player.stats.goldEarned = (player.stats.goldEarned || 0) + reward.gold;
    s.coins += reward.coins;
    s.dungeon.highestWave = Math.max(Number(s.dungeon.highestWave || 0), waves);
    s.dungeon.clears = Number(s.dungeon.clears || 0) + 1;
    if (typeof host.awardReputation === 'function') host.awardReputation(player, 150);
    s.dungeon.active = false;
    s.dungeon.runId = null;
    s.dungeon.killsRemaining = 0;
    return { nextDungeonWave: null, dungeonComplete: reward };
  }
}

export const officialDungeonDomain = new OfficialDungeonDomain();
