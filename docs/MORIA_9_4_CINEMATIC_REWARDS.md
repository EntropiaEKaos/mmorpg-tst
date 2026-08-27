# Mor'ia 9.4 — Cinematic Rewards

Mor'ia 9.4 turns authoritative progression moments into readable, memorable presentation without moving game truth into the browser.

## Cinematic moments

The server now emits dedicated presentation contracts for:

- **Boss introduction** — emitted once per boss instance/session when the player approaches or engages it; dungeon boss waves introduce themselves as they spawn.
- **Region discovery** — emitted only on first authoritative discovery and persisted in official player state.
- **Achievement unlock** — server-owned achievements use a dedicated unlock event instead of a generic system message.
- **Mount / outfit / addon unlock** — purchase success is the source of truth; selecting or toggling an already-owned cosmetic does not fake an unlock.
- **Reward chest opening** — Hunt equipment caches reveal the exact server-selected item and rarity.

`server/engine/CinematicRewards.mjs` defines the event payloads. These contracts contain presentation metadata only; they never calculate damage, inventory ownership or progression client-side.

## Persistent exploration

`regionsDiscovered` is normalized and exported through `OfficialStateSchema`. Eldoria is the default known region for a fresh character. `OfficialProgressionDomain.discoverRegion(...)` is bounded and idempotent, so revisiting a region does not repeatedly grant discovery cinematics.

## Physical loot beams

Ground loot rendering moved out of `GameScreen.tsx` into `src/game/groundLootPresentation.ts`.

The renderer understands both local corpse records and authoritative server ground items. It derives the highest rarity present and draws a pulsing vertical beam:

- common — subtle neutral marker;
- uncommon — green;
- rare — blue;
- epic — violet;
- legendary — gold with the strongest height and sparkles.

This also closes a presentation gap: authoritative server ground items are now rendered through the same dedicated projection instead of only being available to pickup interaction logic.

## Cinematic host

`RegionBanner.tsx` remains the mounted presentation host. `cinematicRewards.ts` converts approved server events into a browser `CustomEvent`, and the banner temporarily expands into a full cinematic overlay. This avoids adding another state machine to the already large `GameScreen` orchestrator.

`combatPresentation.ts` continues to own particles, screen shake and sound. `rewardPresentation.ts` supplies recipes for the new cinematic event kinds.

## Architecture

9.4 intentionally reduces `GameScreen.tsx` by extracting its inline ground-loot rendering. The architecture guard remains at **155,000 bytes**; it is not relaxed for this release.

The browser remains presentation-only for online play:

1. server confirms the outcome;
2. server emits a cinematic/reward contract;
3. `ServerSync` consumes the immutable snapshot event once;
4. presentation modules render overlay, particles, sound, shake and loot beams;
5. no client presentation callback can grant the underlying reward.

## Validation

The 9.4 release gate covers cinematic builders, region persistence, idempotent discovery ownership, GameState authoritative wiring, all client cinematic event kinds, RegionBanner hosting, physical rarity beams, and the GameScreen architecture budget. The full client/server audit, TypeScript build, server syntax and complete Node suite must remain green before promotion to `master`.
