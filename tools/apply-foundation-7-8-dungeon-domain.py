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
'''
write('server/engine/OfficialDungeonDomain.mjs', DOMAIN)

path = 'server/engine/OfficialSystems.mjs'
text = read(path)
anchor = "import { officialPvpDomain } from './OfficialPvpDomain.mjs';\n"
text = replace_once(text, anchor, anchor + "import { officialDungeonDomain } from './OfficialDungeonDomain.mjs';\n", 'dungeon import')

old_kill = r'''    if (monster.dungeonOwnerId === player.id && s.dungeon.active && monster.dungeonRunId === s.dungeon.runId) {
      s.dungeon.killsRemaining = Math.max(0, s.dungeon.killsRemaining - 1);
      if (s.dungeon.killsRemaining === 0) {
        if (s.dungeon.wave < s.dungeon.maxWaves) {
          s.dungeon.wave++;
          s.dungeon.killsRemaining = this.getDungeonWave(s.dungeon.wave, player.level).count;
          result.nextDungeonWave = s.dungeon.wave;
        } else {
          const waves = s.dungeon.maxWaves;
          const reward = { gold: waves * 150 + player.level * 20, xp: waves * 200 + player.level * 25, coins: waves * 2 };
          player.gold += reward.gold;
          player.xp += reward.xp;
          player.stats.goldEarned = (player.stats.goldEarned || 0) + reward.gold;
          s.coins += reward.coins;
          s.dungeon.highestWave = Math.max(s.dungeon.highestWave, waves);
          s.dungeon.clears++;
          this.awardReputation(player, 150);
          s.dungeon.active = false; s.dungeon.runId = null; s.dungeon.killsRemaining = 0;
          result.dungeonComplete = reward;
        }
      }
    }
'''
new_kill = r'''    const dungeonResult = officialDungeonDomain.onMonsterKill(this, player, monster);
    result.nextDungeonWave = dungeonResult.nextDungeonWave;
    result.dungeonComplete = dungeonResult.dungeonComplete;
'''
text = replace_once(text, old_kill, new_kill, 'dungeon kill block')

old_methods = r'''  getDungeonWave(wave, playerLevel) {
    const base = DUNGEON_WAVES[Math.max(0, Math.min(DUNGEON_WAVES.length - 1, wave - 1))];
    const scale = 1 + Math.max(0, playerLevel - 1) * 0.025;
    return { ...base, hp: Math.floor(base.hp * scale), attack: Math.floor(base.attack * scale), defense: Math.floor(base.defense * (0.8 + scale * 0.2)), xp: Math.floor(base.xp * scale), wave };
  }

  startDungeon(player, maxWaves) {
    const s = this.ensurePlayer(player);
    const waves = [3, 5, 10].includes(Number(maxWaves)) ? Number(maxWaves) : 3;
    if (s.dungeon.active) return { ok: false, error: 'A dungeon run is already active.' };
    if (player.level < Math.max(1, waves - 2)) return { ok: false, error: `Level ${Math.max(1, waves - 2)} required.` };
    const runId = `dungeon_${player.id}_${Date.now()}`;
    s.dungeon = { ...s.dungeon, active: true, runId, wave: 1, maxWaves: waves, killsRemaining: this.getDungeonWave(1, player.level).count };
    return { ok: true, runId, wave: 1, maxWaves: waves };
  }

  abandonDungeon(player) {
    const s = this.ensurePlayer(player);
    if (!s.dungeon.active) return false;
    s.dungeon.active = false; s.dungeon.runId = null; s.dungeon.killsRemaining = 0;
    return true;
  }

  failDungeon(player) { return this.abandonDungeon(player); }
'''
new_methods = r'''  getDungeonWave(wave, playerLevel) {
    return officialDungeonDomain.getWave(wave, playerLevel);
  }

  startDungeon(player, maxWaves) {
    return officialDungeonDomain.start(this, player, maxWaves);
  }

  abandonDungeon(player) {
    return officialDungeonDomain.abandon(this, player);
  }

  failDungeon(player) {
    return officialDungeonDomain.fail(this, player);
  }
'''
text = replace_once(text, old_methods, new_methods, 'dungeon lifecycle methods')
write(path, text)

TEST = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import { OfficialDungeonDomain, DUNGEON_RUN_LENGTHS } from '../engine/OfficialDungeonDomain.mjs';

function makePlayer(level = 10) {
  return {
    id: 'player-1', level, gold: 0, xp: 0, reputation: { town: 0 }, stats: { goldEarned: 0 },
    official: { coins: 0, dungeon: { active: false, runId: null, wave: 0, maxWaves: 0, killsRemaining: 0, highestWave: 0, clears: 0 } },
  };
}
const host = {
  ensurePlayer(player) { return player.official; },
  awardReputation(player, amount) { player.reputation.town += amount; return player.reputation.town; },
};

test('dungeon wave scaling is deterministic and clamps invalid wave numbers', () => {
  const domain = new OfficialDungeonDomain();
  const low = domain.getWave(1, 1);
  const high = domain.getWave(1, 20);
  assert.equal(low.wave, 1);
  assert.ok(high.hp > low.hp);
  assert.ok(high.attack > low.attack);
  assert.equal(domain.getWave(999, 1).wave >= 1, true);
  assert.equal(domain.getWave(-50, 1).wave, 1);
});

test('dungeon start validates run length, level gates and duplicate active runs', () => {
  const domain = new OfficialDungeonDomain();
  const low = makePlayer(1);
  assert.equal(DUNGEON_RUN_LENGTHS.includes(10), true);
  assert.equal(domain.start(host, low, 10, 1000).ok, false);
  const player = makePlayer(10);
  const run = domain.start(host, player, 5, 1000);
  assert.equal(run.ok, true);
  assert.equal(run.runId, 'dungeon_player-1_1000');
  assert.equal(player.official.dungeon.maxWaves, 5);
  assert.equal(player.official.dungeon.killsRemaining, domain.getWave(1, 10).count);
  assert.equal(domain.start(host, player, 3, 2000).ok, false);
});

test('dungeon kills are isolated by owner and active run id', () => {
  const domain = new OfficialDungeonDomain();
  const player = makePlayer(10);
  domain.start(host, player, 3, 1000);
  const before = player.official.dungeon.killsRemaining;
  domain.onMonsterKill(host, player, { dungeonOwnerId: 'someone-else', dungeonRunId: player.official.dungeon.runId });
  assert.equal(player.official.dungeon.killsRemaining, before);
  domain.onMonsterKill(host, player, { dungeonOwnerId: player.id, dungeonRunId: 'stale-run' });
  assert.equal(player.official.dungeon.killsRemaining, before);
});

test('dungeon wave completion advances exactly one wave and resets kill target', () => {
  const domain = new OfficialDungeonDomain();
  const player = makePlayer(10);
  domain.start(host, player, 3, 1000);
  player.official.dungeon.killsRemaining = 1;
  const result = domain.onMonsterKill(host, player, { dungeonOwnerId: player.id, dungeonRunId: player.official.dungeon.runId });
  assert.equal(result.nextDungeonWave, 2);
  assert.equal(result.dungeonComplete, null);
  assert.equal(player.official.dungeon.wave, 2);
  assert.equal(player.official.dungeon.killsRemaining, domain.getWave(2, 10).count);
});

test('dungeon final kill grants rewards once and closes the run', () => {
  const domain = new OfficialDungeonDomain();
  const player = makePlayer(10);
  domain.start(host, player, 3, 1000);
  player.official.dungeon.wave = 3;
  player.official.dungeon.killsRemaining = 1;
  const runId = player.official.dungeon.runId;
  const result = domain.onMonsterKill(host, player, { dungeonOwnerId: player.id, dungeonRunId: runId });
  assert.deepEqual(result.dungeonComplete, { gold: 650, xp: 850, coins: 6 });
  assert.equal(player.gold, 650);
  assert.equal(player.xp, 850);
  assert.equal(player.official.coins, 6);
  assert.equal(player.official.dungeon.highestWave, 3);
  assert.equal(player.official.dungeon.clears, 1);
  assert.equal(player.reputation.town, 150);
  assert.equal(player.official.dungeon.active, false);
  assert.equal(player.official.dungeon.runId, null);
  const again = domain.onMonsterKill(host, player, { dungeonOwnerId: player.id, dungeonRunId: runId });
  assert.equal(again.dungeonComplete, null);
  assert.equal(player.gold, 650);
});

test('dungeon abandon and fail clear transient run state without erasing history', () => {
  const domain = new OfficialDungeonDomain();
  const player = makePlayer(10);
  player.official.dungeon.highestWave = 5;
  player.official.dungeon.clears = 2;
  domain.start(host, player, 3, 1000);
  assert.equal(domain.fail(host, player), true);
  assert.equal(player.official.dungeon.active, false);
  assert.equal(player.official.dungeon.highestWave, 5);
  assert.equal(player.official.dungeon.clears, 2);
  assert.equal(domain.abandon(host, player), false);
});
'''
write('server/test/official-dungeon-domain.test.mjs', TEST)

DOC = r'''# MOR'IA Foundation 7.8 — Dungeon Domain

Foundation 7.8 extracts dungeon lifecycle and reward rules into `OfficialDungeonDomain`.

The domain owns deterministic wave scaling, supported run lengths, level gates, active-run lifecycle, per-wave kill targets, run ownership isolation, final rewards, reputation reward, abandon/fail behavior and historical clear/highest-wave preservation.

`OfficialSystems` remains the compatibility façade and delegates dungeon calls. The network action names and persisted dungeon history remain unchanged.

This boundary is the base for instanced dungeon templates, dungeon modifiers, parties, bosses, raid sizes, keystones, leaderboards and seasonal dungeon rotations.
'''
write('docs/FOUNDATION_7_8_DUNGEON_DOMAIN.md', DOC)
print('Foundation 7.8 dungeon domain extraction applied')
