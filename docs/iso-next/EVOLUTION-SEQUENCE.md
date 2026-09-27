# Mor'ia ISO Next — Evolution Sequence

This sequence is additive and parity-first. RendererLegacy remains available until ISO Next has certified equivalent behavior.

## Phase 1 — Authoritative Interaction Complete
- GameState dispatcher bridge for `interaction`.
- Server-owned NPC lookup and public-position resolution.
- accepted/denied feedback exposed to client without leaking authority.
- Context HUD state: idle / available / pending / accepted / denied.
- Browser tests for valid talk/trade, spoofed target, wrong map, excessive distance, unsupported kind.

### Exit gate
Real player presses E near a real server NPC and receives deterministic server feedback. CI + Bootstrap + Visual Evidence green on same HEAD.

## Phase 2 — NPC / Dialog / Merchant / Quest Vertical Slice
- Dialog panel driven by authoritative NPC/quest state.
- Merchant shop with server-owned price, stock, currency and transaction result.
- Quest giver markers and states: available / active / objective / turn-in / complete.
- No client-authored rewards, completion or prices.
- Keyboard/gamepad-friendly interaction flow.

### Exit gate
In ISO Next: approach NPC -> talk -> accept quest -> interact with merchant/quest flow -> server snapshot reflects result.

## Phase 3 — Character Controller 2.0
- 8-direction presentation over authoritative coordinates.
- idle/walk/run/attack/cast/hit/death animation state machine.
- depth sorting and occlusion behind props/buildings.
- smooth camera follow, bounded zoom, optional shake.
- collision feedback without moving collision authority client-side.

## Phase 4 — World Rendering 2.0
- declarative WorldManifest / MapDefinition pipeline.
- terrain variants and detail decals to reduce repetition.
- layered props, roofs, vegetation, bridges and foreground occluders.
- time-of-day lighting presets.
- local lights for torches/windows/spells.
- ambient particles: leaves, ash, rain, snow, fog.
- animated water and lightweight reflection treatment.
- quality tiers and effect budgets for weaker devices.

## Phase 5 — Combat Vertical Slice
- authoritative target selection and combat intents.
- telegraphs, projectiles and impact feedback from server outcomes.
- damage/heal/status floaters are presentation only.
- hit flash, camera impulse, death and loot presentation.
- no client-authored damage, cooldown, resource cost, drop or kill state.

### Exit gate
Real monster: acquire target -> skill -> authoritative damage -> death -> authoritative loot -> inventory snapshot.

## Phase 6 — Classes / Skills Identity
- preserve all existing class/skill definitions.
- per-class visual language for cast, projectile, impact, aura and status.
- cooldown/resource HUD sourced from server state.
- scalable FX registry keyed by semantic effect rather than hard-coded per screen.

## Phase 7 — Character / Inventory / Equipment / Progression
- ISO inventory and equipment UI.
- drag/drop is request UI only; server confirms mutation.
- character sheet, stats, progression, talents where supported.
- responsive desktop/narrow layouts.

## Phase 8 — World Migration
- migrate every existing city/map through MapDefinition instead of one-off renderer code.
- portals/travel/interiors/dungeons.
- NPCs, monsters, quest markers and ambient populations from content/server data.
- per-region lighting/weather/audio profiles.
- parity checklist per map before marking migrated.

## Phase 9 — Advanced MMORPG Domains
- crafting and profession specializations.
- economy and shops.
- factions/diplomacy and dynamic-world presentation.
- housing.
- social/chat/groups where present.
- dungeons, bosses, siege/world events where present.
- persistent-world chronicles/consequences surfaced visually.

## Phase 10 — World Studio
Admin/editor tooling for declarative content, not a second game engine:
- map metadata and layers;
- props/spawn anchors;
- NPC placement references;
- portals;
- lighting/time-of-day profiles;
- weather/ambient FX;
- audio zones;
- preview and validation;
- publish only content that passes schema/server validation.

## Phase 11 — Full Parity Certification
For every legacy domain:
- feature inventory reconciled;
- server authority verified;
- reconnect/snapshot verified;
- automated tests green;
- real-browser evidence captured;
- desktop + narrow viewport checked;
- no console/runtime errors;
- performance budget checked.

Only then may ISO Next become the default renderer. Legacy removal is a later, separate, reversible cleanup after a rollback window.

# Visual North Star
Dark-fantasy stylized 2.5D: readable silhouettes, rich environmental depth, warm/cold lighting contrast, restrained bloom, strong spell silhouettes, layered cities, animated ambience and premium UI motion. Beauty must never reduce combat readability or hide interaction state.

# Performance guardrails
- pooled particles and transient objects;
- texture atlases and bounded texture sizes;
- culling for off-camera actors/props;
- effect LOD and quality presets;
- avoid allocations in hot render loops;
- deterministic cleanup on map/renderer teardown;
- track frame time and memory in browser evidence runs.

# Promotion discipline
Every code-changing HEAD starts uncertified. Never reuse green checks from a previous SHA. Do not promote while parity-critical regressions, browser errors or missing required evidence remain.