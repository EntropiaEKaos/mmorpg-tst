import { Graphics } from 'pixi.js';
import { projectIso } from './projection';
import type { IsoLandmark, IsoTerrainPatch } from './terrainPresentation';

type XY = { x: number; y: number };
const color = (hex: string | undefined, fallback: number) =>
  hex && /^#[0-9a-f]{6}$/i.test(hex) ? Number.parseInt(hex.slice(1),16) : fallback;
const shade = (hex: number, multiplier: number) => {
  const c=(shift:number)=>Math.min(255,Math.max(0,Math.round(((hex>>shift)&255)*multiplier)));
  return (c(16)<<16)|(c(8)<<8)|c(0);
};
const down = (p:XY, delta:number):XY => ({x:p.x,y:p.y+delta});
const coords=(...points:XY[])=>points.flatMap(p=>[p.x,p.y]);
const between=(a:XY,b:XY,t=.5):XY=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

const THEMES: Record<string,{roof:number;stone:number;trim:number}>={
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

export function visibleLandmarks(patch:IsoTerrainPatch,cx:number,cy:number,radius=19):IsoLandmark[]{
  return (patch.landmarks||[]).filter(l=>
    l.x<=cx+radius&&l.x+l.w>=cx-radius&&l.y<=cy+radius&&l.y+l.h>=cy-radius);
}

/** Presentation art only. The compound's base uses the exact server footprint.
 * Large 10x14 areas become smaller buildings/courtyards rather than a screen-sized roof.
 */
export function buildIsoLandmark(l:IsoLandmark,patch:IsoTerrainPatch):Graphics{
  const theme=THEMES[patch.cityStyle||'']||THEMES.royal;
  const wall=color(patch.wallColor,theme.stone);
  const roof=color(patch.roofColor,theme.roof);
  const trim=theme.trim;
  const isKeep=['keep','tower','gate'].includes(l.kind);
  const isSacred=['temple','library','obelisk'].includes(l.kind);
  const isMarket=l.kind==='market';
  const isForge=l.kind==='forge';
  const isArena=l.kind==='arena';
  const center=projectIso({x:l.x+l.w/2,y:l.y+l.h/2});
  const at=(x:number,y:number):XY=>{
    const p=projectIso({x,y});return{x:p.x-center.x,y:p.y-center.y};
  };
  const g=new Graphics();
  const n=at(l.x,l.y),e=at(l.x+l.w,l.y),s=at(l.x+l.w,l.y+l.h),w=at(l.x,l.y+l.h);
  // Walled courtyard marks the full collision footprint; it adds no walkable tiles.
  g.poly(coords(n,e,s,w)).fill({color:0x05090e,alpha:.38});
  g.poly(coords(down(e,-14),down(s,-14),s,e)).fill(shade(wall,.76));
  g.poly(coords(down(s,-14),down(w,-14),w,s)).fill(shade(wall,.94));
  g.poly(coords(down(n,-14),down(e,-14),down(s,-14),down(w,-14)))
    .fill({color:shade(wall,.82),alpha:.5}).stroke({width:3,color:trim,alpha:.42});
  // A building is composed of small roofs placed inside its actual footprint.
  // This preserves visual streets and the character's silhouette at normal zoom.
  const modules:Array<{x:number;y:number;w:number;h:number}>= [];
  for(let dx=.35;dx<l.w-.4;dx+=3.5)for(let dy=.35;dy<l.h-.4;dy+=3.5){
    const mw=Math.min(2.75,l.w-.7-dx);
    const mh=Math.min(2.75,l.h-.7-dy);
    if(mw>=.65&&mh>=.65)modules.push({x:l.x+dx,y:l.y+dy,w:mw,h:mh});
  }
  if(!modules.length)modules.push({x:l.x+.15,y:l.y+.15,w:Math.max(.7,l.w-.3),h:Math.max(.7,l.h-.3)});
  modules.sort((a,b)=>(a.x+a.y)-(b.x+b.y));
  modules.forEach((m,i)=>{
    const height=(isKeep?62:isSacred?55:isMarket?29:isArena?24:44)+(i%3)*8;
    const rn=at(m.x,m.y),re=at(m.x+m.w,m.y),rs=at(m.x+m.w,m.y+m.h),rw=at(m.x,m.y+m.h);
    const tn=down(rn,-height),te=down(re,-height),ts=down(rs,-height),tw=down(rw,-height);
    const variant=shade(roof,[.84,.94,1.12,1.03][i%4]);
    g.poly(coords(re,rs,ts,te)).fill(shade(wall,.69)).stroke({width:1.3,color:shade(wall,.42)});
    g.poly(coords(rs,rw,tw,ts)).fill(shade(wall,.88)).stroke({width:1.3,color:shade(wall,.48)});
    g.poly(coords(tn,te,ts,tw)).fill(variant).stroke({width:1.8,color:shade(roof,.47)});
    const ridgeA=between(tn,te),ridgeB=between(tw,ts);
    g.moveTo(ridgeA.x,ridgeA.y-5).lineTo(ridgeB.x,ridgeB.y-5)
      .stroke({width:2,color:trim,alpha:.62});
    // Lit windows draw a readable miniature townscape at game camera scale.
    if(!isArena){
      const window=between(rs,rw);
      g.poly([window.x-7,window.y-height*.68,window.x+7,window.y-height*.68,
        window.x+7,window.y-height*.34,window.x-7,window.y-height*.34])
        .fill({color:isForge?0xff934d:isSacred?0x9fdaeb:0xf9d89c,alpha:.76})
        .stroke({width:2,color:shade(wall,.45)});
    }
    if(isKeep&&(i===0||i===modules.length-1)){
      g.rect(tn.x-10,tn.y-24,20,26).fill(shade(wall,.75)).stroke({width:1.4,color:trim,alpha:.5});
      g.poly([tn.x-15,tn.y-23,tn.x,tn.y-39,tn.x+15,tn.y-23]).fill(variant);
    }
    if(isSacred&&i===Math.floor(modules.length/2)){
      const cross=between(tn,ts);
      g.moveTo(cross.x,cross.y-6).lineTo(cross.x,cross.y-29).stroke({width:3,color:trim});
      g.moveTo(cross.x-9,cross.y-19).lineTo(cross.x+9,cross.y-19).stroke({width:3,color:trim});
    }
    if(isForge&&i===0){
      g.rect(tn.x-12,tn.y-28,24,32).fill(shade(wall,.55));
      g.circle(tn.x,tn.y-34,10).fill({color:0xffa86a,alpha:.26});
    }
    if(isMarket){
      g.poly([tw.x,tw.y,ts.x,ts.y,ts.x,ts.y+11,tw.x,tw.y+11])
        .fill({color:i%2?trim:0xf0dfac,alpha:.7});
    }
  });
  g.position.set(center.x,center.y);
  return g;
}
