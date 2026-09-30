# Mor'ia ISO Next — Euphoria Vertical Slice

## Definition of done

The Euphoria slice is complete when a real player can enter Eldoria through the real client, move through the authoritative world, pass behind foreground geometry, change visible equipment, interact with an NPC, leave town, encounter a monster, execute a server-resolved ability, receive damage, kill/loot and return — while RendererLegacy remains available as fallback.

## Visual target

Dark Cartoon Fantasy with strong silhouettes, readable 2.5D elevation, exaggerated equipment, atmospheric lighting and high-impact but bounded combat presentation.

## Character contract

Eight facing directions. Animation families: idle, walk, run, three basic attacks, heavy attack, cast, channel, block, dodge, hit, stun, interact, loot, death and respawn. Visual composition is layered: shadow -> body/skin -> clothing/equipment -> hair/helmet -> weapons -> aura/status FX.

## World renderer layers

`terrain -> structures -> entities -> foreground -> lighting -> fx`

Simulation authority does not live in any of these layers.

## Performance budgets (initial targets)

Desktop target: 60 FPS / 16.7 ms frame budget, 24 dynamic lights, 1,800 active particles, 300 visible entities.

Mobile target: 30 FPS / 33.4 ms frame budget, 8 dynamic lights, 500 active particles, 120 visible entities.

These are targets to validate and tune with browser evidence; they are not certified performance claims yet.

## Production pipeline

Blender or authored 2D source -> standardized ISO camera -> directional renders -> spritesheet/atlas -> metadata -> Content Studio -> ISO renderer.

Content Studio expansion should expose scale, pivot, animation mapping, shadow, equipment slots, emissive/material metadata, FX and sound references rather than hardcoding those choices into gameplay code.

## Euphoria work packages

1. CI/security dependency unblock.
2. PixiJS runtime + RendererIsoNext implementation.
3. Eldoria terrain/structures/occlusion vertical slice.
4. Hero-v1 eight-direction character and equipment layers.
5. Authoritative movement interpolation and reconciliation presentation.
6. Camera follow/zoom/look-ahead/controlled shake.
7. Day/night, emissive, point-light and weather presentation.
8. NPC/monster visual pipeline.
9. Combat FX framework: projectile, trail, beam, lightning, fire, ice, poison, shadow, holy, necromancy, decals, impacts and status FX.
10. Material-aware footsteps and spatial ambience/combat audio.
11. Content Studio visual authoring contract.
12. Culling, pooling, atlases, lazy loading/chunk streaming and quality tiers.
13. Chromium desktop+narrow viewport evidence, console gate and screenshot matrix.
14. Gameplay parity and fallback certification.

## Evidence rule

A feature is not visually certified until it runs from the tested SHA in Chromium with console evidence and committed screenshot/video evidence where applicable. No concept image counts as implementation evidence.
