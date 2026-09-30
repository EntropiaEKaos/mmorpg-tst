# Mor'ia ISO Next — Legacy Parity Manifesto

## Status

This document is a migration contract for `feat/moria-iso-next`. It exists to prevent the new PixiJS + Three.js client from becoming a visually attractive but functionally poorer rewrite of the legacy Mor'ia client.

The legacy client remains the functional and informational reference until the ISO client proves parity through code, browser evidence, and authoritative integration.

## Prime directive

**Parity before replacement. Everything the Legacy client knows how to show, the ISO client must also know how to show — with the new visual finish.**

This rule applies to gameplay systems, information density, tooltips, states, warnings, comparisons, interaction affordances, accessibility-relevant information, and authoritative server outcomes.

A feature is not considered migrated merely because an ISO window with the same name exists.

## Architecture contract

The new client is a presentation layer over the existing authoritative MMORPG:

`authoritative server -> snapshots/events -> adapters -> ISO Next -> PixiJS + Three.js + React HUD`

- The server owns gameplay truth.
- PixiJS owns the scalable isometric world presentation: tiles, sprites, entities, depth sorting, camera and high-volume 2D effects.
- Three.js is presentation-only and owns premium atmospheric/3D effects such as shaders, fog, lighting, water, portals and selected VFX.
- React/DOM owns information-dense interfaces such as inventory, equipment, merchant, bank, depot, journal, chat and tooltips.
- Visual code must not silently redefine collision, range, targeting, line of sight, damage, cooldowns, economy or simulation timing.

## Renderer isolation

PixiJS and Three.js must not compete for the same mutable renderer host. Their lifecycle, canvas ownership, resize and cleanup are isolated so one renderer cannot remove or invalidate the other.

Every visual HEAD must be independently certified. A green result from an older SHA is not evidence for a newer SHA.

## Tooltip parity contract

The legacy tooltip system is a shared information system, not disposable decoration. ISO Next must reuse its domain knowledge instead of creating simplified parallel logic.

### ItemTooltip

ISO item presentation must preserve, when present:

- name, icon, description and value;
- rarity, required/equipment level and slot;
- attack, defense, armor, HP, mana and magic;
- critical chance, lifesteal, thorns and movement speed;
- XP bonus, gold bonus and damage reduction;
- elemental/school damage bonuses;
- resistances and weaknesses;
- skill bonuses and resistance penetration;
- spell/physical power where applicable;
- affixes and their descriptions;
- comparison-relevant information required by inventory/equipment workflows.

### SpellTooltip

ISO spell presentation must preserve, when present:

- name, icon, type and hotkey;
- mana cost, cooldown, damage and range;
- level requirement and locked state;
- insufficient-mana and cooldown state;
- damage school/type and scaling source;
- scaling coefficient/breakdown;
- critical chance/multiplier;
- lifesteal, variance, hit count and penetration;
- target mode and ally/enemy/self effects;
- contextual multipliers such as day/night where supported;
- elemental reaction hints derived from the shared combat domain.

### StatTooltip

ISO stat presentation must preserve the semantic value of the legacy stat tooltip, including description and breakdown (for example base value plus bonuses), rather than displaying only a final number.

## Reuse before duplication

ISO Next should wrap and reuse the existing tooltip/domain components and calculations whenever they are compatible. Domain calculations must not be copied into an ISO-only fork without a documented technical reason.

The preferred model is:

`shared domain data/calculation -> shared tooltip content -> ISO trigger/presentation integration`

This prevents a future item, spell, affix, elemental or stat change from producing two contradictory clients.

## Visual evidence contract

The browser evidence gate must evolve with the migration. Tooltip parity requires dedicated evidence for at least:

- item tooltip;
- spell tooltip;
- stat tooltip;
- viewport-safe placement;
- representative disabled/locked/cooldown/no-mana states where applicable.

Evidence belongs to the exact HEAD being certified.

## Definition of migrated

A legacy feature is considered ISO-migrated only when all applicable conditions are true:

1. the user can perform the equivalent workflow in ISO Next;
2. important legacy information is still visible or discoverable;
3. authoritative actions still go through the server contract;
4. the ISO client does not introduce a competing local source of gameplay truth;
5. responsive/browser behavior is validated where relevant;
6. visual evidence exists for visual-critical flows;
7. no known legacy capability is silently dropped.

## Migration order

Current priority sequence:

1. maintain certified PixiJS + Three.js foundation;
2. ItemTooltip parity;
3. SpellTooltip parity;
4. StatTooltip parity;
5. inventory/equipment/action-bar integration;
6. Character Visual System;
7. recognizable Eldoria NPCs and regional identity;
8. combat/VFX presentation;
9. living-world atmosphere;
10. quests/journal and crafting/professions;
11. party/guild/social/mail/auction/economy parity;
12. mounts/pets/housing/achievements/bestiary/events;
13. remaining settings, accessibility and secondary legacy surfaces;
14. final parity audit before any legacy replacement decision.

## Final migration principle

The goal is not to build “the same Mor'ia with an isometric camera.” The goal is to preserve the mature authoritative MMORPG and all of the useful information already earned by the legacy client, while replacing its presentation with a recognizable, rich and scalable ISO world.

**Parity before replacement: everything the Legacy client knows how to show, the ISO client must also know how to show — only with the new visual finish.**
