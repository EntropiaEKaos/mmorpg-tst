# Mor'ia 8.3 — Living World

## Goal

Make every region feel like a place rather than a palette swap while preserving server authority.

## Changes

- World atmosphere rendering moved out of `GameScreen` into a biome-aware renderer.
- Plains, snow, swamp, desert and shadow now have distinct overlay, vignette, ambient motes and light treatment.
- Swamps gain layered ground fog; Voidlands gain a subtle void glow; night torch lighting remains player-centered.
- Region arrival banners communicate realm name, biome identity, description, danger and recommended level.
- Weather is deterministic from map + shared time window, so clients in the same region converge on the same cosmetic weather without trusting weather for gameplay.
- Weather particles are deterministic, lighter than the old implementation and respect reduced-motion preferences.

No weather or atmosphere effect changes damage, movement, loot, visibility authority, encounters or progression.
