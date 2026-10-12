import { Graphics } from 'pixi.js';
import { projectIso } from './projection';
import type { IsoLandmark, IsoTerrainPatch } from './terrainPresentation';

const intColor = (value: string | undefined, fallback: number): number =>
  value && /^#[a-f0-9]{6}$/i.test(value) ? Number.parseInt(value.slice(1), 16) : fallback;
const shade = (hex: number, multiplier: number): number => {
  const channel = (offset: number) => Math.min(255, Math.max(0, Math.round(((hex >> offset) & 255) * multiplier)));
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
};
type XY = { x: number; y: number };
const plus = (p: XY, dy: number): XY => ({ x: p.x, y: p.y + dy });
const flat = (...points: readonly XY[]): number[] => points.flatMap(p => [p.x, p.y]);
const midpoint = (a: XY, b: XY): XY => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const THEMES: Record<string, { roof: number; stone: number; trim: number }> = {
  royal:{roof:0x8a3c46,stone:0xb9a787,trim:0xe0c47c},
  harbor:{roof:0x38677c,stone:0xb4b6a5,trim:0x79cade},
  ironwood:{roof:0x58402e,stone:0x948977,trim:0xc9a163},
  alpine:{roof:0x415a75,stone:0xb4c4d1,trim:0xdcecff},
  marsh:{roof:0x414c35,stone:0x808271,trim:0x94b86e},
  forge:{roof:0x7c3828,stone:0x9f735b,trim:0xffb46c},
  crystal:{roof:0x5a588b,stone:0x8b93b5,trim:0x8be6ff},
  storm:{roof:0x455c78,stone:0x97abb5,trim:0x97cfff},
  void:{roof:0x302039,stone:0x514a62,trim:0xb889e8},
  nightfall:{roof:0x392535,stone:0x615461,trim:0xe38ba0},
};

export function visibleLandmarks(patch: IsoTerrainPatch, cx: number, cy: number, radius = 19): IsoLandmark[] {
  return (patch.landmarks || []).filter(l =>
    l.x <= cx + radius && l.x + l.w >= cx - radius &&
    l.y <= cy + radius && l.y + l.h >= cy - radius);
}

export function buildIsoLandmark(landmark: IsoLandmark, patch: IsoTerrainPatch): Graphics {
  const theme = THEMES[patch.cityStyle || ''] || THEMES.royal;
  const stone = intColor(patch.wallColor, theme.stone);
  const roof = intColor(patch.roofColor, theme.roof);
  const trim = theme.trim;
  const isKeep = ['keep','tower','gate'].includes(landmark.kind);
  const isSacred = ['temple','obelisk','library'].includes(landmark.kind);
  const isMarket = landmark.kind === 'market';
  const isForge = landmark.kind === 'forge';
  const isArena = landmark.kind === 'arena';
  const height = isKeep ? 92 : isSacred ? 74 : isMarket ? 38 : isArena ? 31 : 58;
  const centerX = landmark.x + landmark.w / 2;
  const centerY = landmark.y + landmark.h / 2;
  const origin = projectIso({ x: centerX, y: centerY });
  const rel = (x: number, y: number): XY => {
    const p = projectIso({ x, y });
    return { x: p.x - origin.x, y: p.y - origin.y };
  };
  const north = rel(landmark.x, landmark.y);
  const east = rel(landmark.x + landmark.w, landmark.y);
  const south = rel(landmark.x + landmark.w, landmark.y + landmark.h);
  const west = rel(landmark.x, landmark.y + landmark.h);
  const n = plus(north, -height), e = plus(east, -height), s = plus(south, -height), w = plus(west, -height);
  const g = new Graphics();
  g.poly(flat(north,east,south,west)).fill({ color:0x08090c,alpha:.38 });
  // South-facing stone/wood walls and roofs use the *exact* WorldManager footprint.
  g.poly(flat(east,south,s,e)).fill(shade(stone,.71)).stroke({ width:2,color:shade(stone,.46),alpha:.9 });
  g.poly(flat(south,west,w,s)).fill(shade(stone,.9)).stroke({ width:2,color:shade(stone,.47),alpha:.9 });
  if (isArena) {
    g.poly(flat(n,e,s,w)).fill(shade(stone,.56)).stroke({width:6,color:trim,alpha:.75});
    g.poly(flat(plus(n,10),plus(e,10),plus(s,10),plus(w,10))).fill(0x252b32).stroke({width:4,color:shade(stone,1.22)});
  } else {
    g.poly(flat(n,e,s,w)).fill(shade(roof,.8)).stroke({width:3,color:shade(roof,.48),alpha:.95});
    const ridgeA = midpoint(n,e),ridgeB = midpoint(w,s);
    g.poly(flat(n,ridgeA,midpoint(e,s),s)).fill({color:shade(roof,1.2),alpha:.45});
    g.moveTo(ridgeA.x,ridgeA.y-11).lineTo(ridgeB.x,ridgeB.y-11).stroke({width:3,color:trim,alpha:.56});
    // Small ridges/panels make the structure read as a multi-roof medieval complex.
    for(let step=1;step<Math.min(8,landmark.w);step++){
      const t=step/Math.min(8,landmark.w);
      const q1={x:n.x+(e.x-n.x)*t,y:n.y+(e.y-n.y)*t};
      const q2={x:w.x+(s.x-w.x)*t,y:w.y+(s.y-w.y)*t};
      g.moveTo(q1.x,q1.y).lineTo(q2.x,q2.y).stroke({width:1.5,color:shade(roof,.52),alpha:.42});
    }
  }
  // Windows/archways on exposed facade, kept decorative (never passability).
  for(let i=1;i<=3;i++){
    const t=i/4;
    const face={x:south.x+(west.x-south.x)*t,y:south.y+(west.y-south.y)*t};
    const light= isForge?0xff914b:isSacred?0xa1dcff:0xf9d994;
    g.poly([face.x-10,face.y-height*.62,face.x+10,face.y-height*.62,face.x+10,face.y-height*.29,face.x-10,face.y-height*.29])
      .fill({color:light,alpha:.68}).stroke({width:3,color:shade(stone,.38)});
  }
  if(isKeep){
    for(const corner of [n,e,w]){
      g.rect(corner.x-13,corner.y-44,26,46).fill(shade(stone,.8)).stroke({width:2,color:shade(stone,.4)});
      g.poly([corner.x-20,corner.y-43,corner.x,corner.y-60,corner.x+20,corner.y-43]).fill(shade(roof,1.1));
    }
  }else if(isSacred){
    const top=midpoint(n,s);
    g.moveTo(top.x,top.y-6).lineTo(top.x,top.y-49).stroke({width:5,color:trim,alpha:.84});
    g.moveTo(top.x-13,top.y-36).lineTo(top.x+13,top.y-36).stroke({width:4,color:trim,alpha:.84});
  }else if(isMarket){
    g.poly([west.x,west.y-height-4,south.x,south.y-height-4,south.x,south.y-height+14,west.x,west.y-height+14])
      .fill({color:trim,alpha:.66});
    for(let i=0;i<7;i++){
      const t=i/7;
      const wx=west.x+(south.x-west.x)*t,wy=west.y+(south.y-west.y)*t-height;
      g.moveTo(wx,wy).lineTo(wx,wy+14).stroke({width:5,color:i%2?shade(roof,1.4):0xf6deb8,alpha:.85});
    }
  }else if(isForge){
    const chimney=midpoint(n,e);
    g.rect(chimney.x-18,chimney.y-55,36,58).fill(shade(stone,.7)).stroke({width:3,color:shade(stone,.42)});
    g.circle(chimney.x,chimney.y-67,13).fill({color:0xf98c49,alpha:.32});
  }
  // Camera/painter uses the furthest south ground edge as occlusion depth.
  g.position.set(origin.x,origin.y);
  return g;
}
