// ===================================================================
// MOR'IA — OFFICIAL RUNTIME COORDINATOR
// Application-level orchestration across official domains. Individual domains
// keep their own rules; this coordinator owns deterministic cross-domain flow.
// ===================================================================

import { officialCombatAugmentationDomain } from './OfficialCombatAugmentationDomain.mjs';
import { officialDungeonDomain } from './OfficialDungeonDomain.mjs';
import { officialProgressionDomain } from './OfficialProgressionDomain.mjs';
import { officialPvpDomain } from './OfficialPvpDomain.mjs';
import { officialWorldEventDomain } from './OfficialWorldEventDomain.mjs';

export class OfficialRuntimeCoordinator {
  constructor({
    combatAugmentation = officialCombatAugmentationDomain,
    dungeon = officialDungeonDomain,
    progression = officialProgressionDomain,
    pvp = officialPvpDomain,
    worldEvent = officialWorldEventDomain,
  } = {}) {
    this.combatAugmentation = combatAugmentation;
    this.dungeon = dungeon;
    this.progression = progression;
    this.pvp = pvp;
    this.worldEvent = worldEvent;
  }

  onMonsterKill(host, player, monster) {
    if (!host || !player || !monster) {
      return {
        xpMultiplier: 1,
        bonusLoot: [],
        nextDungeonWave: null,
        dungeonComplete: null,
        worldEventProgress: null,
        achievements: [],
      };
    }

    const key = this.combatAugmentation.recordBestiaryKill(host, player, monster);
    const result = {
      xpMultiplier: this.progression.getXpMultiplier(host, player),
      bonusLoot: [],
      nextDungeonWave: null,
      dungeonComplete: null,
      worldEventProgress: null,
      achievements: [],
    };

    const gem = this.combatAugmentation.maybeGemDrop(player, monster);
    if (gem) result.bonusLoot.push(gem);

    result.worldEventProgress = this.worldEvent.recordKill(host, player, key);

    const dungeonResult = this.dungeon.onMonsterKill(host, player, monster) || {};
    result.nextDungeonWave = dungeonResult.nextDungeonWave ?? null;
    result.dungeonComplete = dungeonResult.dungeonComplete ?? null;
    result.achievements = this.progression.refreshAchievements(host, player);
    return result;
  }

  tickPlayer(host, player, now = Date.now()) {
    const timestamp = Number.isFinite(Number(now)) ? Number(now) : Date.now();
    const staminaSpent = this.progression.tickStamina(host, player, timestamp);
    const pvpChanged = this.pvp.tick(host, player, timestamp);
    const event = this.worldEvent.ensure(host, timestamp);
    return { staminaSpent, pvpChanged, event };
  }
}

export const officialRuntimeCoordinator = new OfficialRuntimeCoordinator();
