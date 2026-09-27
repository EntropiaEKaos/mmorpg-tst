import type { IsoSceneNode } from './sceneModel';

export type OcclusionBand = {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  fadeTo: number;
};

/** Presentation-only occlusion zones. They never affect collision or targeting. */
export const ELDORIA_OCCLUSION_BANDS: readonly OcclusionBand[] = [
  { id: 'south-tree-line', minX: -520, maxX: -40, minY: 250, maxY: 520, fadeTo: 0.42 },
  { id: 'east-tree-line', minX: 120, maxX: 570, minY: 240, maxY: 540, fadeTo: 0.42 },
  { id: 'guildhall-front', minX: -130, maxX: 150, minY: 365, maxY: 535, fadeTo: 0.56 },
];

export function resolveOcclusionAlpha(node: Readonly<IsoSceneNode>): number {
  let alpha = node.opacity ?? 1;
  for (const band of ELDORIA_OCCLUSION_BANDS) {
    if (node.x >= band.minX && node.x <= band.maxX && node.y >= band.minY && node.y <= band.maxY) {
      alpha = Math.min(alpha, band.fadeTo);
    }
  }
  return alpha;
}

export function depthScale(depth: number): number {
  return Math.max(0.92, Math.min(1.06, 0.96 + depth * 0.00008));
}
