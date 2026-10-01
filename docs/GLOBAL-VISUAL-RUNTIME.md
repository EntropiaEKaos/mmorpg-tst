# Global Visual Runtime

## Goal
Make the PixiJS + Three.js presentation perceptible across the whole playable world in both quick/local and online flows without changing gameplay authority.

## Runtime rollout
- `RegionBanner` is mounted for every active map and now boots the hybrid visual overlay outside Eldoria.
- Eldoria keeps the dedicated GameScreen overlay already present.
- Map IDs and biome fallbacks select regional visual profiles for Sunreach, Ironwood, Frostpeak, Shadowfen, Emberhold, Crystal Deep, Stormwatch, Voidlands and Nightfall.
- Weather is forwarded to the hybrid renderer for rain/storm presentation.
- Regional accent lighting is layered globally so a map change is immediately perceptible.

## Safety
- Pointer events remain disabled on visual layers.
- Gameplay, collisions, map coordinates, combat and server authority are unchanged.
- The legacy canvas remains the structural gameplay renderer.

## Next character pass
Character/NPC/monster state already lives in `GameScreen`; the next pass must bind those real runtime entities to the Pixi entity layer rather than creating decorative/fake actors. This is intentionally documented as a separate integration gate so production never claims entity replacement before it is wired to real gameplay state.
