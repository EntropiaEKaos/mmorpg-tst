import type { IsoVisualEntity } from './worldAdapter';

export const ISO_LAYER_ORDER = ['terrain', 'structures', 'entities', 'foreground', 'lighting', 'fx'] as const;
export type IsoLayerName = (typeof ISO_LAYER_ORDER)[number];

export type IsoSceneNode = {
  id: string;
  layer: IsoLayerName;
  depth: number;
  x: number;
  y: number;
  visualId?: string;
  opacity?: number;
};

export type IsoSceneFrame = Record<IsoLayerName, IsoSceneNode[]>;

export function createEmptyIsoSceneFrame(): IsoSceneFrame {
  return {
    terrain: [], structures: [], entities: [], foreground: [], lighting: [], fx: [],
  };
}

export function buildEntitySceneFrame(entities: readonly IsoVisualEntity[]): IsoSceneFrame {
  const frame = createEmptyIsoSceneFrame();
  frame.entities = entities.map((entity) => ({
    id: entity.id,
    layer: 'entities',
    depth: entity.screen.depth,
    x: entity.screen.x,
    y: entity.screen.y,
    visualId: entity.visualId,
  }));
  return frame;
}

export function sortIsoSceneFrame(frame: IsoSceneFrame): IsoSceneFrame {
  for (const layer of ISO_LAYER_ORDER) {
    frame[layer].sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id));
  }
  return frame;
}
