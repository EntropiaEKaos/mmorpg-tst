import type { Monster, NPC, Player } from '../game/types';
import type { LegacyEldoriaVisualEntity } from './LegacyEldoriaHybridOverlay';

export interface VisualCamera { x: number; y: number }
export interface VisualWorldPoint { x: number; y: number }
export interface LiveServerPlayer {
  id?: string;
  name?: string;
  vocation?: string;
  pos?: VisualWorldPoint;
  x?: number;
  y?: number;
}

export interface BuildLiveEntityVisualsInput {
  player: Player;
  monsters: Monster[];
  npcs: NPC[];
  serverPlayers?: LiveServerPlayer[];
  camera: VisualCamera;
  tileSize: number;
  width: number;
  height: number;
}

function toViewport(pos: VisualWorldPoint, camera: VisualCamera, tileSize: number) {
  return {
    x: (pos.x - camera.x) * tileSize + tileSize / 2,
    y: (pos.y - camera.y) * tileSize + tileSize / 2,
  };
}

function inVisualRange(x: number, y: number, width: number, height: number, margin = 72) {
  return x >= -margin && y >= -margin && x <= width + margin && y <= height + margin;
}

export function buildLiveEntityVisuals({
  player,
  monsters,
  npcs,
  serverPlayers = [],
  camera,
  tileSize,
  width,
  height,
}: BuildLiveEntityVisualsInput): LegacyEldoriaVisualEntity[] {
  const entities: LegacyEldoriaVisualEntity[] = [];
  const add = (entity: LegacyEldoriaVisualEntity) => {
    if (inVisualRange(entity.x, entity.y, width, height)) entities.push(entity);
  };

  const playerScreen = toViewport(player.pos, camera, tileSize);
  add({
    id: `player:${player.name}`,
    kind: 'player',
    x: playerScreen.x,
    y: playerScreen.y,
    name: player.name,
    vocation: player.vocation,
  });

  for (const npc of npcs) {
    const screen = toViewport(npc.pos, camera, tileSize);
    add({ id: `npc:${npc.id}`, kind: 'npc', x: screen.x, y: screen.y, name: npc.name });
  }

  for (const monster of monsters) {
    if (monster.dead) continue;
    const screen = toViewport(monster.pos, camera, tileSize);
    add({
      id: `monster:${monster.id}`,
      kind: 'monster',
      x: screen.x,
      y: screen.y,
      name: monster.name,
      hostile: true,
    });
  }

  for (const remote of serverPlayers) {
    const pos = remote.pos || (typeof remote.x === 'number' && typeof remote.y === 'number'
      ? { x: remote.x, y: remote.y }
      : null);
    if (!pos) continue;
    const screen = toViewport(pos, camera, tileSize);
    add({
      id: `online:${remote.id || remote.name || `${pos.x}:${pos.y}`}`,
      kind: 'player',
      x: screen.x,
      y: screen.y,
      name: remote.name,
      vocation: remote.vocation,
    });
  }

  return entities;
}
