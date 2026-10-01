export const LEGACY_HYBRID_VISUAL = Object.freeze({
  enabled: true,
  pilotMap: 'eldoria',
  preserve: Object.freeze([
    'camera', 'map-generation', 'coordinates', 'collisions', 'gameplay',
    'quests', 'combat-authority', 'npc-authority', 'weather-authority', 'day-night-authority',
  ]),
  layers: Object.freeze({
    legacyCanvas: 'structural-world',
    pixi: Object.freeze(['characters', 'npcs', 'monsters', '2d-fx', 'particles']),
    three: Object.freeze(['lighting', 'atmosphere', 'fog', 'rain-depth', 'lightning', 'ambient-depth']),
  }),
  rules: Object.freeze({
    visualOnly: true,
    mayMutateGameplay: false,
    mayMutateCamera: false,
    mayMutateCollision: false,
    fallbackToLegacy: true,
  }),
});

export type LegacyHybridVisualConfig = typeof LEGACY_HYBRID_VISUAL;
