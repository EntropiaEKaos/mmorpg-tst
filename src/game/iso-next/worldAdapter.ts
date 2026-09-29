import { projectIso, type ScreenPoint, type WorldPoint } from './projection';

export type AuthoritativeVisualEntity = {
  id: string;
  kind: 'player' | 'npc' | 'monster' | 'prop';
  world: WorldPoint;
  visualId?: string;
  /** Presentation-only fingerprint derived from authoritative equipment. */
  visualSignature?: string;
};

export type IsoVisualEntity = AuthoritativeVisualEntity & {
  screen: ScreenPoint;
};

/** Presentation-only adapter. It never mutates server-owned gameplay data. */
export function adaptAuthoritativeEntities(
  entities: readonly AuthoritativeVisualEntity[],
): IsoVisualEntity[] {
  return entities
    .map((entity) => ({ ...entity, screen: projectIso(entity.world) }))
    .sort((a, b) => a.screen.depth - b.screen.depth || a.id.localeCompare(b.id));
}
