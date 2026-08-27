# Mor'ia 8.6 — Studio / Admin

## Content Health
- New Studio Content Health center audits every authoritative content record against the same reference rules used during writes.
- Errors and warnings are separated; errors mark the publish state as blocked.
- Studio can export a timestamped JSON backup of the entire server-owned content database.

## Authoring parity
- Item editor now exposes crit chance, lifesteal, thorns, movement speed, XP bonus, gold bonus and damage reduction.
- Quest editor now exposes structured prerequisite IDs (`requires`) as a validated JSON array.
- NPC role, biome and vocation datalists reflect values understood by the runtime while remaining free-text inputs for future-compatible values.

## Player safety
- The live Players view is explicitly read-only. The Studio no longer renders fake generic mutation controls that the API cannot honor.
