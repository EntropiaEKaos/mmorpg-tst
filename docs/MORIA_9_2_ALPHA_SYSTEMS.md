# Mor'ia 9.2 — Alpha Systems

This phase expands the authoritative MMORPG foundation with classic life systems, a server-owned world clock and contextual skills. The client remains a presentation/intent layer while movement, ownership, combat effects, targeting, multipliers and progression stay server-controlled.

## Housing
- Global persistent ownership, one house per character.
- House interior access is enforced by the movement server.
- Owner guest lists, weekly rent, grace period, decoration placement/removal.
- House definitions and decoration catalog are editable in Content Studio.

## Tibia-style Tasks
- Separate from narrative quests and Adventure Board contracts.
- Up to three active tasks, repeat limits, task points, hunter ranks and boss unlock metadata.
- Accept/claim requires the configured task master; kills progress only on the authoritative server.
- Task definitions are editable in Content Studio.

## Outfits
- Owned outfit collection, selected outfit, four color channels and two optional addons.
- Unlock/purchase and addon ownership are persistent and server-controlled.
- Outfit definitions are editable in Content Studio.

## Mounts
- Owned collection, selection, purchase, mount/dismount and server-derived movement bonus.
- Stable purchase requires a nearby stablemaster.
- Nearby-player snapshots expose the selected public mount.
- Mount catalog is editable in Content Studio.

## Authoritative world clock
- `WorldClock.mjs` owns the realm clock; clients receive a projection in the authoritative snapshot.
- The cycle has four smooth phases: dawn, day, dusk and night.
- The default full in-game day is 24 real minutes and can be configured with `MORIA_DAY_LENGTH_MS` within server-enforced bounds.
- Darkness/daylight values are continuous across dawn and dusk, avoiding abrupt visual or combat-multiplier jumps.
- The clock is derived from server time, so reconnects and server restarts do not let clients choose the phase.
- `GameScreen` renders the server phase and a compact clock badge; local/admin time override remains presentation-only and cannot change online combat math.

## Contextual skills
- `ContextualSkillEngine.mjs` normalizes legacy and data-driven skills without changing existing hotkey indexes or requiring save migration.
- A spell can resolve differently by relation: self, ally or enemy.
- Supported target modes are `smart`, `self`, `target` and `area`.
- Ally behavior supports `none`, `heal` and `buff`; enemy behavior supports `none`, `damage` and `drain`.
- Per-relation multipliers are `allyMultiplier`, `enemyMultiplier` and `selfMultiplier`.
- Time-of-day modifiers are `dayMultiplier` and `nightMultiplier`; dawn/dusk interpolate smoothly between them.
- Drain skills can define `drainPercent`, with the server deriving the returned health from authoritative damage.
- Target relation, range, effect, power, mana use, cooldown and final result are resolved by `GameState.mjs`; the client only sends the spell slot and optional target intent.
- Legacy attack/heal/AOE/buff spells receive compatible defaults. Selected existing skills such as Holy Nova and Soul Drain gain richer dual-purpose presets.
- Spell-vs-player PvP is not implicitly enabled by contextual targeting; hostile player combat continues through the existing authoritative PvP rules instead of bypassing opt-in semantics.

## Content Studio
Contextual spell behavior is editable through the declarative Studio schema. Authors can configure target mode, ally/enemy effects, relation multipliers, day/night multipliers and drain percentage. Semantic validation bounds multipliers and percentages before reference validation or persistence.

## Client presentation and UX
- `LifeStylePanel` provides four player-facing tabs: Tasks, Housing, Outfits and Mounts.
- `playerAvatar.ts` replaces the fixed generic avatar with layered procedural silhouettes, four outfit colors, two addon layers and mount-specific bodies.
- Nearby authoritative players carry their public outfit/addon/color and selected mount projection, so appearance is consistent for every observer.
- `housingPresentation.ts` renders current-map house footprints, ownership/for-sale labels, doors and placed decoration without moving any authority into the renderer.
- Dawn/dusk receive a subtle atmospheric transition tint while the authoritative clock provides darkness.
- Spell tooltips expose contextual ally/enemy behavior and time-of-day multipliers.
- Life-system UI sends intents only; prices, ownership, rewards, speed and access remain server-owned.

## Persistence
ContentDB schema advances to v3. Populated v2 installs receive missing 9.2 defaults without overwriting admin-edited records; intentionally empty databases remain empty. Player task/outfit/mount state lives in the authoritative character save. Housing ownership is global and stored independently so two player saves cannot claim the same property. World time itself is derived from server time and does not require per-player persistence.

## Validation gate
The 9.2 release line is accepted only with zero dependency-audit findings, successful TypeScript typecheck, production client build, server syntax checks and the complete Node test suite. One-shot applicators/workflows used during development are removed before integration so the clean branch is validated by the normal `ci.yml` only.
