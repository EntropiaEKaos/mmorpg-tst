from pathlib import Path

ROOT = Path('.')
SYSTEMS = ROOT / 'server/engine/OfficialSystems.mjs'
DOC = ROOT / 'docs/FOUNDATION_7_18_RUNTIME_COORDINATOR.md'

text = SYSTEMS.read_text(encoding='utf-8')

def replace_once(source, old, new, label):
    count = source.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
    return source.replace(old, new, 1)

text = replace_once(
    text,
    "import { officialSnapshotReadModel } from './OfficialSnapshotReadModel.mjs';\n",
    "import { officialSnapshotReadModel } from './OfficialSnapshotReadModel.mjs';\nimport { officialRuntimeCoordinator } from './OfficialRuntimeCoordinator.mjs';\n",
    'runtime coordinator import',
)

old_kill = r'''  onMonsterKill(player, monster) {
    const key = officialCombatAugmentationDomain.recordBestiaryKill(this, player, monster);
    const result = { xpMultiplier: this.getXpMultiplier(player), bonusLoot: [], nextDungeonWave: null, dungeonComplete: null, worldEventProgress: null, achievements: [] };
    const gem = officialCombatAugmentationDomain.maybeGemDrop(player, monster);
    if (gem) result.bonusLoot.push(gem);

    result.worldEventProgress = officialWorldEventDomain.recordKill(this, player, key);

    const dungeonResult = officialDungeonDomain.onMonsterKill(this, player, monster);
    result.nextDungeonWave = dungeonResult.nextDungeonWave;
    result.dungeonComplete = dungeonResult.dungeonComplete;

    result.achievements = this.refreshAchievements(player);
    return result;
  }
'''
new_kill = r'''  onMonsterKill(player, monster) {
    return officialRuntimeCoordinator.onMonsterKill(this, player, monster);
  }
'''
text = replace_once(text, old_kill, new_kill, 'monster-kill coordinator facade')

old_tick = r'''  tickPlayer(player, now = Date.now()) {
    officialProgressionDomain.tickStamina(this, player, now);
    officialPvpDomain.tick(this, player, now);
    this.ensureWorldEvent(now);
  }
'''
new_tick = r'''  tickPlayer(player, now = Date.now()) {
    return officialRuntimeCoordinator.tickPlayer(this, player, now);
  }
'''
text = replace_once(text, old_tick, new_tick, 'player tick coordinator facade')

SYSTEMS.write_text(text, encoding='utf-8')

DOC.write_text("""# Foundation 7.18 — Official Runtime Coordinator

Cross-domain runtime orchestration now lives in `OfficialRuntimeCoordinator`.

## Monster kill pipeline

1. Canonical bestiary progress.
2. XP multiplier read.
3. Optional authoritative gem drop.
4. World-event progress.
5. Dungeon progression.
6. Achievement refresh.

## Player tick pipeline

A single normalized timestamp is propagated through stamina, PvP decay and world-event lifecycle checks.

The coordinator is dependency-injectable for deterministic tests. `OfficialSystems.onMonsterKill()` and `tickPlayer()` remain compatibility delegates.
""", encoding='utf-8')

print('Foundation 7.18 runtime coordinator wired into OfficialSystems')
