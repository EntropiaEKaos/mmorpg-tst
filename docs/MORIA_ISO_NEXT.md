# Mor'ia ISO Next — Visual Revamp

## Objective
Transform the player-facing world renderer into a stylized dark-cartoon isometric 2.5D presentation while preserving the existing authoritative server, gameplay rules, persistence, economy, combat outcomes and React-based product surfaces.

## Non-negotiable architecture

- The server remains authoritative for movement, collision, combat, loot, quests, economy, PvP and world state.
- The new renderer consumes authoritative snapshots/intents; it never becomes a source of gameplay truth.
- The legacy renderer remains available until ISO Next reaches functional parity.
- React remains responsible for HUD, menus, inventory, chat and administrative/product UI during the first migration phases.
- PixiJS is the target renderer for the world layer, with WebGL/WebGPU acceleration where supported.
- Visual changes must not silently alter tile collision, ranges, targeting, line-of-sight or simulation timing.

## Renderer boundary

```text
Authoritative Mor'ia Server
        |
        v
Authoritative snapshot/events
        |
        v
Client world-state adapter
        |
        +--------------------+
        |                    |
        v                    v
RendererLegacy          RendererIsoNext
                             |
                             v
                    PixiJS scene graph
```

## Isometric projection

The logical world keeps its existing coordinates. ISO Next projects them for presentation:

```text
screenX = (worldX - worldY) * tileWidth / 2
screenY = (worldX + worldY) * tileHeight / 2 - elevation
```

Projection and elevation are presentation concerns. The authoritative coordinate remains the existing world coordinate.

## Target visual language

- Dark Cartoon Fantasy rather than photorealism.
- Strong readable silhouettes and exaggerated armor/weapons.
- Isometric 2.5D terrain with apparent elevation, cliffs, bridges and foreground occlusion.
- Layered characters: body, equipment, weapon, shadow, aura and FX.
- Material response through normal/emissive maps where practical.
- Dynamic point-light presentation for torches, spells and environmental emitters.
- Weather and day/night should change presentation without changing authoritative gameplay unless a gameplay system explicitly owns that rule.
- Combat presentation should support trails, particles, decals, impact flashes and bounded camera shake.

## Asset Pipeline 2.0

Preferred production flow:

```text
Blender / authored 2D source
        -> isometric directional renders
        -> spritesheets / atlases
        -> visual metadata
        -> Content Studio
        -> RendererIsoNext
```

The pipeline must support idle, walk, run, attack, cast, hit and death animation families without requiring gameplay logic to know how an asset was produced.

## Delivery phases

### Phase 0 — Foundation
- Freeze current master SHA as the ISO Next baseline.
- Add PixiJS without replacing the existing renderer.
- Establish `RendererIsoNext` and projection/camera primitives.
- Add an internal prototype entry point for Eldoria.
- Establish deterministic screenshot evidence.

### Phase 1 — Eldoria vertical slice
- Ground tiles and biome material language.
- Elevation/depth sorting.
- Buildings, roofs, props and foreground occlusion.
- Player and NPC projection.
- Camera pan/follow/zoom.

### Phase 2 — Character pipeline
- Directional animation sets.
- Equipment layers.
- Shadows and contact grounding.
- Monster/NPC authoring contract.

### Phase 3 — Lighting and atmosphere
- Day/night presentation.
- Point lights and emissive surfaces.
- Weather response.
- Normal-map/material experiments with strict performance budgets.

### Phase 4 — Combat spectacle
- Projectile/trail system.
- Cast and impact FX.
- Damage-event presentation sourced only from authoritative resolution.
- Decals and bounded camera effects.

### Phase 5 — Parity and migration
- Feature parity matrix against RendererLegacy.
- Desktop and narrow-viewport browser E2E.
- Performance/load measurements.
- Only after parity and gates: make ISO Next the default renderer.

## Quality gates for every visual milestone

Every milestone must include:

1. TypeScript/build gate.
2. Existing server regression suite unchanged/green.
3. Browser launch with zero uncaught page/console errors for the tested route.
4. At least one real Chromium screenshot generated from the implemented build.
5. Screenshot committed under `docs/screenshots/iso-next/` and referenced by documentation before milestone promotion.
6. A short changelog explaining what changed visually and what authoritative behavior was intentionally untouched.
7. No merge to `master` solely on the basis of mocked screenshots or concept art.

## Screenshot matrix

The initial vertical slice will maintain these deterministic views:

- `iso-next-eldoria-day.png`
- `iso-next-eldoria-night.png`
- `iso-next-eldoria-combat.png`
- `iso-next-eldoria-occlusion.png`
- `iso-next-character-equipment.png`

Additional cities/biomes get their own evidence only after Eldoria establishes the visual grammar.

## Baseline

ISO Next starts from master commit `f45809a098540a3a7293fa8c81596a9e9e231c48` (Mor'ia 9.27–9.43 Grand Capitals checkpoint). Development branch: `feat/moria-iso-next`.

## Promotion rule

Do not remove or bypass RendererLegacy until ISO Next has functional parity, browser evidence, performance measurements and regression certification. The visual revamp is intentionally incremental and reversible.
