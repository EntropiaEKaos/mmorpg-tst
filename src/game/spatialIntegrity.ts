import type { NPC, Tile } from './types';

type HouseBounds = { x?: number; y?: number; width?: number; height?: number };

function walkable(world: Tile[][], x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && Boolean(world[y]?.[x]?.walkable);
}
function insideHouse(houses: HouseBounds[], x: number, y: number): boolean {
  return houses.some((house) => {
    const hx=Number(house?.x), hy=Number(house?.y), w=Number(house?.width), h=Number(house?.height);
    return Number.isFinite(hx)&&Number.isFinite(hy)&&Number.isFinite(w)&&Number.isFinite(h)&&x>=hx&&x<hx+w&&y>=hy&&y<hy+h;
  });
}

export function nearestPublicWalkableTile(world: Tile[][], origin: {x:number;y:number}, houses: HouseBounds[] = [], maxRadius = 14) {
  const ox=Math.round(Number(origin?.x)||0), oy=Math.round(Number(origin?.y)||0);
  if (walkable(world,ox,oy)&&!insideHouse(houses,ox,oy)) return {x:ox,y:oy};
  for (let radius=1;radius<=maxRadius;radius++) {
    for (let dy=-radius;dy<=radius;dy++) {
      const dx=radius-Math.abs(dy);
      for (const x of dx===0?[ox]:[ox-dx,ox+dx]) {
        const y=oy+dy;
        if (walkable(world,x,y)&&!insideHouse(houses,x,y)) return {x,y};
      }
    }
  }
  return null;
}

export function enforceNpcSpatialIntegrity(npcs: NPC[], world: Tile[][], houses: HouseBounds[] = []): number {
  let repaired=0;
  for (const npc of npcs) {
    if (!npc?.pos) continue;
    if (walkable(world,npc.pos.x,npc.pos.y)&&!insideHouse(houses,npc.pos.x,npc.pos.y)) continue;
    const safe=nearestPublicWalkableTile(world,npc.pos,houses);
    if (!safe) continue;
    npc.pos={...safe}; repaired++;
  }
  return repaired;
}
