export const ISO_DIRECTIONS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] as const;
export type IsoDirection = (typeof ISO_DIRECTIONS)[number];

export const CHARACTER_ANIMATIONS = [
  'idle', 'walk', 'run', 'attack-1', 'attack-2', 'attack-3', 'heavy-attack',
  'cast', 'channel', 'block', 'dodge', 'hit', 'stun', 'interact', 'loot', 'death', 'respawn',
] as const;
export type CharacterAnimation = (typeof CHARACTER_ANIMATIONS)[number];

export const CHARACTER_LAYER_ORDER = [
  'shadow', 'body', 'skin', 'boots', 'armor', 'gloves', 'hair', 'helmet',
  'offhand', 'mainhand', 'aura', 'status-fx',
] as const;
export type CharacterLayer = (typeof CHARACTER_LAYER_ORDER)[number];

export type CharacterVisualState = {
  entityId: string;
  direction: IsoDirection;
  animation: CharacterAnimation;
  layers: Partial<Record<CharacterLayer, string>>;
};
