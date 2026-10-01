# Mor'ia — Visual MVP & Open World Evolution

## Status
Working branch: `visual/legacy-eldoria-hybrid-pixi-three`

This document is cumulative. It records the decisions and implementation direction for revitalizing the legacy MMORPG without discarding the existing cities, rules, camera, collisions, combat, or authoritative server model.

## Core rule
The legacy game remains authoritative. PixiJS and Three.js are presentation layers unless a later, separately certified milestone explicitly changes gameplay.

## Visual stack
- Existing legacy renderer remains the structural foundation.
- PixiJS: characters, monsters, weather, particles, animated water, foliage, city activity, regional FX and 2D combat/environment FX.
- Three.js: atmosphere, lighting, depth cues, night/rain/lightning treatment and advanced environmental composition.
- Visual layers must not silently alter collision, pathfinding, combat coordinates or server state.

## Implemented visual foundations
- Hybrid PixiJS + Three.js overlay.
- Day/night atmosphere.
- Rain, lightning, mist, ambient motes and fireflies.
- Regional profiles for Eldoria, forest, coast, desert, snow, swamp, volcanic, crystal, storm, void and nightfall environments.
- Grand-capital-to-visual-profile mapping.
- Non-authoritative visual elevation model: flat, hill, ridge, cliff and mountain.
- Hostile monster presence and visual threat treatment.
- Character differentiation by vocation direction.
- MVP animated water/glints.
- Night city-light treatment.
- Ambient foliage movement.
- Regional snow, ember, dust, crystal and storm particle foundations.

## Grand Capitals
The continental plan now preserves the approved legacy capitals instead of replacing them:
- Eldoria
- Sunreach Coast
- Ironwood
- Frostpeak
- Shadowfen
- Emberhold
- Crystal Deep
- Stormwatch Isle

Roadmap slots are also reserved for Grand Voidlands and Grand Nightfall Citadel. Existing urban plans and city gates are to be preserved and connected before new city geometry is invented.

## Character direction
Characters must become visually distinct while retaining authoritative positions and gameplay. Warrior/Knight, Mage/Sorcerer and Rogue/Ladino already have an initial visual differentiation path. Future passes should expand silhouette, equipment, animation, class FX and NPC/monster identity.

## Elevation direction
Phase 1 is visual elevation only. Mountains, cliffs, ridges, valleys and objects at different apparent heights may use lift, shadows, contour, occlusion and parallax. These values must not feed movement, collision, combat or pathfinding until a dedicated gameplay-elevation milestone exists.

## Mor'ia open-world directive
Mor'ia is evolving from isolated cities into a traversable continent.

Existing cities are preserved. The player should eventually be able to leave a city through its gates and physically travel through roads and wilderness to another city. Portals become fast travel rather than the only connection. Ports remain useful for sea travel, islands and future continents.

The server may retain authoritative chunked maps. Chunk boundaries should eventually be hidden from the player so the journey feels continuous.

### Continental route foundation
- Eldoria → Sunreach Coast
- Eldoria → Ironwood
- Ironwood → Frostpeak
- Eldoria → Shadowfen
- Eldoria → Emberhold
- Emberhold → Crystal Deep
- Sunreach Coast → Stormwatch Isle
- Crystal Deep → future Nightfall Citadel
- Emberhold → future Voidlands

## Playable roads
Roads are playable content, not loading corridors. `src/world/moriaRoadVisuals.ts` establishes the first road-segment presentation plan.

Initial road features include:
- bridges and rivers
- waterfalls
- forests and valleys
- caves and cliffs
- ruins and camps
- watchtowers and crossroads
- distant landmarks for navigation

Initial named landmarks include Pedra do Primeiro Caminhante, Ponte das Duas Quedas, Portão de Pedra do Norte, Mirante das Nuvens, Santuário Afundado, Arco das Cinzas, Galeria dos Ecos Prismáticos and Farol da Última Costa.

Rules: no empty loading corridors; at least one meaningful landmark per segment; preserve legacy gate coordinates; visual elevation cannot silently change collision; chunk transitions should eventually lose the portal/loading fantasy.

## Journey tone
The intended feeling is an epic long-form fantasy journey: distant landmarks, changing biomes, roads disappearing into forests, mountain silhouettes, valleys, settlements and danger between destinations. This is a tonal reference only; Mor'ia must retain its own original world, lore, locations and visual identity.

## Investor MVP priority
For the current MVP, prioritize what communicates the project immediately:
1. A recognizable, alive city.
2. Animated and readable water.
3. Distinct player/NPC/monster silhouettes.
4. Day/night and weather atmosphere.
5. Visible depth/elevation cues.
6. Regional identity that is obvious at a glance.
7. A credible continental/open-world roadmap grounded in existing cities.

## Next implementation targets
1. Render the first playable-road visual primitives for Eldoria → Ironwood.
2. Add bridge, river edge, cliff face and distant landmark layers without changing authoritative collision.
3. Expand class/NPC/monster silhouettes and readable animation states.
4. Validate the newest HEAD in CI before promotion.
5. Capture real rendered screenshot evidence when the preview/browser path is available.

## Safety / regression policy
- Do not delete legacy cities to achieve the visual upgrade.
- Do not change camera behavior merely to demonstrate Three.js.
- Do not alter collision or authoritative coordinates from visual elevation.
- Do not merge visual work to the main branch solely because it looks promising.
- New HEADs must be revalidated; do not reuse green results from an older HEAD as proof for a newer commit.
- Prefer modular visual systems over large invasive changes to GameScreen.

## Documentation policy
Every significant implementation round should update this document or add a focused document under `docs/`. Important visual milestones should include the commit/PR state, validation status, known limitations and screenshot evidence when real rendered screenshots are available.
