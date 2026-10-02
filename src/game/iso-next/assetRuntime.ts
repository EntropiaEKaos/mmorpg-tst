import type { IsoCombatCue, IsoFacing, IsoMotionState, IsoSceneNode } from './sceneModel';
import { findIsoAsset, type IsoAssetAnimation, type IsoAssetDefinition, type IsoAssetDirection, type IsoAssetKind } from './assetPipeline';

export type IsoResolvedAsset = {
  asset?: IsoAssetDefinition;
  fallback: boolean;
  kind: IsoAssetKind;
  animation: IsoAssetAnimation;
  direction: IsoAssetDirection;
};

function visualKind(visualId?: string): IsoAssetKind {
  if (visualId === 'hero-v1') return 'hero';
  if (visualId === 'shadow-wolf') return 'creature';
  return 'creature';
}

function animationFor(motion?: IsoMotionState, combatCue?: IsoCombatCue): IsoAssetAnimation {
  if (combatCue && combatCue !== 'none') return combatCue;
  return motion === 'walk' ? 'walk' : 'idle';
}

function directionFor(facing?: IsoFacing): IsoAssetDirection {
  return facing ?? 'se';
}

/** Resolve presentation art without changing simulation or authoritative entity state. */
export function resolveIsoAsset(node: Readonly<IsoSceneNode>): IsoResolvedAsset {
  const kind = visualKind(node.visualId);
  const animation = animationFor(node.motion, node.combatCue);
  const direction = directionFor(node.facing);
  const exact = findIsoAsset(kind, animation, direction);
  const seFallback = exact ?? findIsoAsset(kind, animation, 'se');
  const idleFallback = seFallback ?? findIsoAsset(kind, 'idle', direction) ?? findIsoAsset(kind, 'idle', 'se');
  return { asset: idleFallback, fallback: !exact, kind, animation, direction };
}

export function assetFrameIndex(asset: IsoAssetDefinition, phase: number): number {
  const normalized = Math.max(0, Math.min(1, phase));
  if (asset.frames.loop) return Math.floor((normalized % 1) * asset.frames.frames) % asset.frames.frames;
  return Math.min(asset.frames.frames - 1, Math.floor(normalized * asset.frames.frames));
}

export function assetPhaseForNode(node: Readonly<IsoSceneNode>): number {
  if (node.combatCue && node.combatCue !== 'none') return node.combatPhase ?? 0;
  return node.animationPhase ?? 0;
}
