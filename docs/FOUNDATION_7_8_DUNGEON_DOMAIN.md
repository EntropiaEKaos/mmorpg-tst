# MOR'IA Foundation 7.8 — Dungeon Domain

Foundation 7.8 extracts dungeon lifecycle and reward rules into `OfficialDungeonDomain`.

The domain owns deterministic wave scaling, supported run lengths, level gates, active-run lifecycle, per-wave kill targets, run ownership isolation, final rewards, reputation reward, abandon/fail behavior and historical clear/highest-wave preservation.

`OfficialSystems` remains the compatibility façade and delegates dungeon calls. The network action names and persisted dungeon history remain unchanged.

This boundary is the base for instanced dungeon templates, dungeon modifiers, parties, bosses, raid sizes, keystones, leaderboards and seasonal dungeon rotations.
