export type IsoAssetKind = 'hero' | 'creature' | 'structure' | 'prop' | 'fx';
export type IsoAssetDirection = 'nw' | 'ne' | 'sw' | 'se' | 'omni';
export type IsoAssetAnimation = 'idle' | 'walk' | 'windup' | 'attack' | 'hit' | 'cast' | 'death' | 'ambient';

export type IsoAssetFrameSet = {
  atlas: string;
  prefix: string;
  frames: number;
  fps: number;
  loop: boolean;
};

export type IsoAssetDefinition = {
  id: string;
  kind: IsoAssetKind;
  direction: IsoAssetDirection;
  animation: IsoAssetAnimation;
  anchor: { x: number; y: number };
  scale: number;
  shadow?: { width: number; height: number; alpha: number };
  frames: IsoAssetFrameSet;
};

/**
 * Production-facing manifest for cartoon/isometric art. Procedural rendering remains
 * a fallback until a matching atlas is shipped, so LAB can evolve without breaking.
 */
export const ISO_ASSET_MANIFEST: readonly IsoAssetDefinition[] = [
  { id: 'euphoria-idle-se', kind: 'hero', direction: 'se', animation: 'idle', anchor: { x: .5, y: .86 }, scale: 1, shadow: { width: 58, height: 18, alpha: .34 }, frames: { atlas: '/assets/iso-next/euphoria/euphoria.webp', prefix: 'idle_se_', frames: 8, fps: 8, loop: true } },
  { id: 'euphoria-walk-se', kind: 'hero', direction: 'se', animation: 'walk', anchor: { x: .5, y: .86 }, scale: 1, shadow: { width: 58, height: 18, alpha: .34 }, frames: { atlas: '/assets/iso-next/euphoria/euphoria.webp', prefix: 'walk_se_', frames: 10, fps: 12, loop: true } },
  { id: 'euphoria-attack-se', kind: 'hero', direction: 'se', animation: 'attack', anchor: { x: .5, y: .86 }, scale: 1, shadow: { width: 62, height: 19, alpha: .34 }, frames: { atlas: '/assets/iso-next/euphoria/euphoria.webp', prefix: 'attack_se_', frames: 8, fps: 15, loop: false } },
  { id: 'shadow-wolf-idle-se', kind: 'creature', direction: 'se', animation: 'idle', anchor: { x: .5, y: .78 }, scale: 1, shadow: { width: 62, height: 16, alpha: .36 }, frames: { atlas: '/assets/iso-next/creatures/shadow-wolf.webp', prefix: 'idle_se_', frames: 8, fps: 7, loop: true } },
  { id: 'shadow-wolf-walk-se', kind: 'creature', direction: 'se', animation: 'walk', anchor: { x: .5, y: .78 }, scale: 1, shadow: { width: 64, height: 16, alpha: .36 }, frames: { atlas: '/assets/iso-next/creatures/shadow-wolf.webp', prefix: 'walk_se_', frames: 10, fps: 12, loop: true } },
  { id: 'eldoria-lantern', kind: 'prop', direction: 'omni', animation: 'ambient', anchor: { x: .5, y: .95 }, scale: 1, frames: { atlas: '/assets/iso-next/eldoria/props.webp', prefix: 'lantern_', frames: 6, fps: 6, loop: true } },
  { id: 'arcane-pulse', kind: 'fx', direction: 'omni', animation: 'cast', anchor: { x: .5, y: .5 }, scale: 1, frames: { atlas: '/assets/iso-next/fx/arcane.webp', prefix: 'pulse_', frames: 12, fps: 18, loop: false } },
];

export function findIsoAsset(kind: IsoAssetKind, animation: IsoAssetAnimation, direction: IsoAssetDirection): IsoAssetDefinition | undefined {
  return ISO_ASSET_MANIFEST.find((asset) => asset.kind === kind && asset.animation === animation && (asset.direction === direction || asset.direction === 'omni'));
}

export function frameName(asset: IsoAssetDefinition, frame: number): string {
  const safe = Math.max(0, Math.min(asset.frames.frames - 1, Math.floor(frame)));
  return `${asset.frames.prefix}${String(safe).padStart(2, '0')}`;
}
