import type { Monster, NPC, Player } from '../game/types';
import type { LegacyEldoriaVisualEntity } from './LegacyEldoriaHybridOverlay';

export interface LegacyCameraPoint { x: number; y: number }

/**
 * Pure presentation adapter: projects authoritative legacy world positions into
 * the existing camera viewport. It never mutates player/NPC/monster state.
 */
export function projectLegacyEldoriaEntities(
  player: Player,
  npcs: NPC[],
  monsters: Monster[],
  camera: LegacyCameraPoint,
  tileSize: number,
): LegacyEldoriaVisualEntity[] {
  const project = (x: number, y: number) => ({
    x: (x - camera.x) * tileSize + tileSize / 2,
    y: (y - camera.y) * tileSize + tileSize / 2,
  });

  const playerPoint = project(player.pos.x, player.pos.y);
  const result: LegacyEldoriaVisualEntity[] = [{
    id: 'player:local',
    kind: 'player',
    x: playerPoint.x,
    y: playerPoint.y,
    name: player.name,
    vocation: player.vocation,
  }];

  for (const npc of npcs) {
    const point = project(npc.pos.x, npc.pos.y);
    result.push({
      id: `npc:${npc.id}`,
      kind: 'npc',
      x: point.x,
      y: point.y,
      name: npc.name,
    });
  }

  for (const monster of monsters) {
    const point = project(monster.pos.x, monster.pos.y);
    result.push({
      id: `monster:${monster.id}`,
      kind: 'monster',
      x: point.x,
      y: point.y,
      name: monster.name,
      hostile: true,
    });
  }

  return result;
}
