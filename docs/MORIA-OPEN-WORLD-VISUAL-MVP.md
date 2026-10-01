# Mor'ia — Visual MVP & Open World Evolution

## Status
Working branch: `visual/legacy-eldoria-hybrid-pixi-three`

This document is cumulative. It records the decisions and implementation direction for revitalizing the legacy MMORPG without discarding the existing cities, rules, camera, collisions, combat, or authoritative server model.

## Core rule
The legacy game remains authoritative. PixiJS and Three.js are presentation layers unless a later, separately certified milestone explicitly changes gameplay.

## Visual stack
- Existing legacy renderer remains the structural foundation.
- PixiJS: characters, monsters, weather, particles, animated water, foliage, city activity and 2D FX.
- Three.js: atmosphere, lighting, depth cues, night/rain/lightning treatment and later advanced environmental composition.
- Visual layers must not silently alter collision, pathfinding, combat coordinates or server state.

## Implemented visual foundations
- Hybrid PixiJS + Three.js overlay.
- Day/night atmosphere.
- Rain, lightning, mist, ambient motes and fireflies.
- Regional visual profiles: Eldoria, capital, forest, coast, desert, snow, swamp and volcanic.
- Non-authoritative visual elevation model: flat, hill, ridge, cliff and mountain.
- Hostile monster presence and visual threat treatment.
- Character differentiation by vocation direction.
- MVP animated water/glints.
- Night city-light treatment.
- Ambient foliage movement.

## Character direction
Characters must become visually distinct while retaining authoritative positions and gameplay. Warrior/Knight, Mage/Sorcerer and Rogue/Ladino already have an initial visual differentiation path. Future passes should expand silhouette, equipment, animation, class FX and NPC/monster identity.

## Elevation direction
Phase 1 is visual elevation only. Mountains, cliffs, ridges, valleys and objects at different apparent heights may use lift, shadows, contour, occlusion and parallax. These values must not feed movement, collision, combat or pathfinding until a dedicated gameplay-elevation milestone exists.

## Mor'ia open-world directive
Mor'ia is evolving from isolated cities into a traversable continent.

Existing cities are preserved. The player should eventually be able to leave a city through its gates and physically travel through roads and wilderness to another city. Portals become fast travel rather than the only connection. Ports remain useful for sea travel, islands and future continents.

The server may retain authoritative chunked maps. Chunk boundaries should eventually be hidden from the player so the journey feels continuous.

### Initial continental anchors
- Eldoria
- Ironwood
- Frostpeak
- Shadowfen
- Emberhold

### Initial route fantasy
- Eldoria → Greenway → bridge/river region → Ironwood
- Ironwood → pine road → mountain pass → Frostpeak
- Eldoria → southern road → wetland crossing → Shadowfen
- Eldoria → eastern road → Ashen Road → Emberhold

Roads are playable content, not loading corridors. They should contain landmarks, wilderness, enemies, encounters, villages, ruins, caves, bridges, rivers, elevation changes and discoveries.

## Journey tone
The intended feeling is an epic long-form fantasy journey: distant landmarks, changing biomes, roads disappearing into forests, mountain silhouettes, valleys, settlements and danger between destinations. This is a tonal reference only; Mor'ia must retain its own original world, lore, locations and visual identity.

## Investor MVP priority
For the current MVP, prioritize what communicates the project immediately:
1. A recognizable, alive city.
2. Animated and readable water.
3. Distinct player/NPC/monster silhouettes.
4. Day/night and weather atmosphere.
5. Visible depth/elevation cues.
6. A credible continental/open-world roadmap grounded in existing cities.

## Safety / regression policy
- Do not delete legacy cities to achieve the visual upgrade.
- Do not change camera behavior merely to demonstrate Three.js.
- Do not alter collision or authoritative coordinates from visual elevation.
- Do not merge visual work to the main branch solely because it looks promising.
- New HEADs must be revalidated; do not reuse green results from an older HEAD as proof for a newer commit.
- Prefer modular visual systems over large invasive changes to GameScreen.

## Documentation policy
Every significant implementation round should update this document or add a focused document under `docs/`. Important visual milestones should include the commit/PR state, validation status, known limitations and screenshot evidence when real rendered screenshots are available.
