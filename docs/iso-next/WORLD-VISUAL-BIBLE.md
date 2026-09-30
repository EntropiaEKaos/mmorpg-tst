# ISO Next — World & Character Visual Bible

This document is the persistent implementation contract for the isolated `feat/moria-iso-next` client. The legacy game remains the functional reference until parity is demonstrated. Gameplay authority remains server-side.

## Core architecture

- Server: authoritative gameplay, movement validation, combat, NPC state, quests, economy, loot and progression.
- PixiJS: primary 2D/isometric world renderer, tiles, sprites, large object populations and efficient 2D particles.
- Three.js: presentation-only GPU/3D layer for lighting, atmosphere, depth, water, fog, weather, shaders, portals and premium spell/environment FX.
- React/DOM: HUD, windows, chat, inventory, dialogue, rich tooltips and accessibility-heavy UI.
- Three.js and PixiJS must consume visual state derived from the same authoritative snapshot. Three.js must never own collision, movement or combat rules.

## 1. World identity

Every biome/region must be recognizable without its map label. Define per region:

- architecture and settlement language;
- vegetation and terrain silhouettes;
- lighting and time-of-day treatment;
- weather and atmosphere;
- fauna and ambient life;
- material vocabulary;
- music/ambient sound identity;
- region palette and landmark silhouettes.

Eldoria is the first vertical slice and reference-quality target.

## 2. Recognizable characters

Characters must stop reading as generic interchangeable sprites. Establish:

- recognizable race/class silhouettes;
- consistent body proportions and scale;
- faces, hair and identity markers;
- layered clothing and visible equipment;
- visually distinct weapons;
- characteristic idle/movement/combat animation language;
- equipment and cosmetic variants that preserve silhouette readability.

## 3. Character Visual System

Player visuals are composed from authoritative character/equipment state:

`body -> face -> hair -> base clothing -> armor -> cape -> weapon -> accessories -> aura/status -> mount`

Equipment changes must be visible on the world character where practical. Cosmetics/skins remain presentation data and must not alter gameplay authority.

Important story/NPC characters should use authored fixed designs rather than generic procedural assembly.

## 4. Memorable NPCs

Important merchants, bankers, quest givers and story characters receive:

- unique visual identity and silhouette;
- name, role and location identity;
- authored outfit/props;
- characteristic poses and micro-animations;
- workplace/environment dressing;
- dialogue portrait where appropriate;
- routines and service presentation when supported by authoritative state.

First target: three emblematic Eldoria NPCs integrated with the already migrated dialogue/quest/merchant/bank services.

## 5. Living world

Progressively implement:

- day/night cycle;
- rain, wind, fog and atmospheric variation;
- reactive/animated water;
- foliage movement;
- birds, insects and ambient creatures;
- chimney smoke, torches and environmental particles;
- NPC work/routine presentation;
- environmental events driven by authoritative state where gameplay-relevant.

## 6. Environmental feedback

Add presentation feedback without duplicating gameplay logic:

- footsteps, dust, splashes and footprints;
- vegetation reaction;
- responsive lighting and shadows;
- spell light affecting nearby scenery;
- impacts, particles and decals;
- portals and magical distortion;
- audio-spatial hooks;
- reactive/destructible presentation only when backed by server state if gameplay-relevant.

Example target: an authoritative Fireball remains server-defined; Pixi presents actor/projectile readability while Three adds temporary light, distortion and premium particles.

## 7. World Visual Bible rules

Before mass-producing assets, lock and maintain:

- tile dimensions and isometric projection;
- character proportions and world scale;
- architecture scale;
- lighting ranges;
- material vocabulary;
- palette per region;
- armor/weapon shape language;
- race silhouette rules;
- VFX language per magic school;
- UI/world readability constraints.

## 8. Recognition quality gate

Primary visual test:

> With HUD, names and text removed from a screenshot, a viewer should still be able to recognize the region, infer the character class/archetype, and distinguish important NPCs.

## 9. Eldoria vertical slice

Build the first reference-quality slice around:

1. Eldoria environment identity;
2. one representative player character with layered visible equipment;
3. three authored emblematic NPCs;
4. Pixi + Three hybrid lighting/atmosphere;
5. fog/weather/water proof points;
6. one premium spell-lighting example;
7. complete legacy-rich ItemTooltip, SpellTooltip and StatTooltip parity;
8. screenshots from the exact certified HEAD.

## 10. Legacy migration scope

Continue systematically migrating the entire legacy game into the isolated ISO client, preserving server authority:

- HUD and rich tooltips;
- inventory/equipment/loot;
- combat, action bar, skills and presentation;
- NPC/dialogue/quests;
- merchant/bank/depot/economy surfaces;
- map/minimap;
- crafting/professions;
- progression/talents/reputation;
- mounts/pets;
- party/guild/social/chat;
- mail/auction;
- housing;
- achievements;
- bestiary;
- events;
- remaining settings and auxiliary legacy interfaces discovered by audit.

## 11. Delivery discipline

- Work remains on `feat/moria-iso-next` until parity/quality gates justify promotion.
- Do not remove the legacy reference while migration is incomplete.
- Do not claim a visual feature complete because code exists: require rendering/build evidence.
- For every materially visual change, add/update Visual Evidence and capture a screenshot from that HEAD whenever feasible.
- Require CI/typecheck/build/bootstrap/visual gates appropriate to the change before calling a slice certified.
- Never reuse an older green result or screenshot to certify a changed HEAD.

## Implementation order

1. Synchronize Three.js dependency tree/lockfile and restore green bootstrap.
2. Mount Three presentation layer over the existing Pixi ISO renderer with resize/cleanup and quality controls.
3. Restore complete legacy rich tooltip parity and capture Item/Spell/Stat tooltip evidence.
4. Establish Eldoria's visual language and environmental layers.
5. Implement Character Visual System and first recognizable player archetype.
6. Author three recognizable Eldoria NPCs and connect existing authoritative services.
7. Add living-world systems and premium environment/spell feedback.
8. Continue legacy system migration until the isolated ISO reaches functional parity.
9. Keep expanding screenshot evidence alongside every visible milestone.
