# Foundation 7.18 — Official Runtime Coordinator

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
