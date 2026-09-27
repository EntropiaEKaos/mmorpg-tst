import { buildIsoWorldPresentation, type IsoWorldPresentation } from '../isoNext/presentationAdapter';
import type { AuthoritativeVisualEntity } from './worldAdapter';

export interface IsoServerPresentationFrame {
  world: IsoWorldPresentation;
  entities: readonly AuthoritativeVisualEntity[];
  playerId?: string;
}

/**
 * Bridges server-owned snapshot data into the existing ISO renderer contract.
 * No simulation or authority is introduced here: coordinates, HP, class and
 * interaction state originate from the authoritative snapshot.
 */
export function bridgeServerSnapshot(snapshot: unknown): IsoServerPresentationFrame | null {
  const world = buildIsoWorldPresentation(snapshot);
  if (!world) return null;

  const entities: AuthoritativeVisualEntity[] = world.actors.map((actor) => ({
    id: actor.id,
    kind: actor.kind,
    world: { x: actor.position.x, y: actor.position.y },
    visualId: visualIdFor(actor.kind, actor.classId),
  }));

  return {
    world,
    entities,
    playerId: world.actors.find((actor) => actor.kind === 'player')?.id,
  };
}

function visualIdFor(kind: 'player' | 'npc' | 'monster', classId?: string): string {
  if (kind === 'player') return classId ? `hero-${classId}` : 'hero-v1';
  if (kind === 'npc') return 'npc-villager';
  return 'shadow-wolf';
}
