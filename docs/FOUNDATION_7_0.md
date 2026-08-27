# MOR'IA Foundation 7.0 — Expandable World Runtime

This foundation pass removes a major expansion bottleneck: maps are no longer a read-only catalog disconnected from the authoritative game world.

## Authoritative map content

- The server overlays built-in map defaults with `ContentDB.maps` and can create additional procedural maps at runtime.
- Map terrain is deterministic from `biome + seed`, and client/server use the same generator contract.
- Admin map fields include spawn point, town center/range, level requirement, seed and JSON portal definitions.
- Portal sources, destination arrival tiles and spawn points are forced walkable on both runtimes.
- Map level gates are server-enforced from content data.
- Existing five built-in maps remain protected from deletion so account spawns and legacy travel cannot be orphaned.
- Custom maps can be deleted only when no NPCs, monsters, events, portals or online players still reference them.
- Live map edits reconcile player/monster positions and immediately re-sync content monsters.
- `/health` now reports the authoritative runtime map count.

## Expansion contract

A new region can now be introduced from Admin by creating a map, assigning seed/biome/spawn/town metadata, linking portals, then placing ContentDB monsters and NPCs on the new `mapId`. No source-code change to `World.mjs` is required for new procedural regions.

Built-in maps still supply safe fallback metadata for old databases that predate these fields.
