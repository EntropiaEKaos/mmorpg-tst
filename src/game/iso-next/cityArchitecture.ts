import { Graphics } from 'pixi.js';
import { projectIso } from './projection';
import type { IsoLandmark, IsoTerrainPatch } from './terrainPresentation';

type XY = { x: number; y: number };
export type CityDetailLevel = 'full' | 'compact';
const idSeed=(id:string)=>[...id].reduce((sum,c)=>(Math.imul(sum,33)+c.charCodeAt(0))>>>0,5381);
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
export function buildIsoLandmark(l:IsoLandmark,patch:IsoTerrainPatch,detail:CityDetailLevel='full'):Graphics{
  const compact=detail==='compact';
  const seed=idSeed(l.id);
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
  // Quiet courtyard highlights live inside the SERVER-owned footprint.
  // There are no client-created obstacles or decorative entities with gameplay state.
  if(!compact){
    const courtyard=between(n,s);
    g.ellipse(courtyard.x,courtyard.y-1,Math.max(10,Math.min(l.w*18,110)),Math.max(7,Math.min(l.h*9,55)))
      .fill({color:0xe9c88d,alpha:.045});
    for(let step=0;step<3;step++){
      const t=(step+1)/4;
      const a=between(n,w,t),b=between(e,s,t);
      g.moveTo(a.x*.91,a.y*.91).lineTo(b.x*.91,b.y*.91)
        .stroke({width:1,color:shade(wall,.55),alpha:.13});
    }
  }
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
  // Real server footprint remains intact. Only the decorative modules vary,
  // with courtyards between structures instead of a uniform sea of roofs.
  const renderModules=modules.length>=7
    ?modules.filter((_,i)=>(i+seed)%11!==4&&(!compact||(i+seed)%5!==2))
    :modules;
  renderModules.forEach((m,i)=>{
    // Spend ornate geometry only on the first prominent buildings per compound.
    // Repeated roof modules retain their silhouette without expensive detailing.
    const ornate=!compact&&i<7;
    const height=(isKeep?62:isSacred?55:isMarket?29:isArena?24:44)+(i%3)*8;
    const rn=at(m.x,m.y),re=at(m.x+m.w,m.y),rs=at(m.x+m.w,m.y+m.h),rw=at(m.x,m.y+m.h);
    const tn=down(rn,-height),te=down(re,-height),ts=down(rs,-height),tw=down(rw,-height);
    const variant=shade(roof,[.84,.94,1.12,1.03][i%4]);
    g.poly(coords(re,rs,ts,te)).fill(shade(wall,.69)).stroke({width:1.3,color:shade(wall,.42)});
    g.poly(coords(rs,rw,tw,ts)).fill(shade(wall,.88)).stroke({width:1.3,color:shade(wall,.48)});
    // Light catching the southwest facade makes the walls readable from above.
    g.moveTo(tw.x,tw.y+1).lineTo(rw.x,rw.y)
      .stroke({width:2.4,color:shade(wall,1.32),alpha:.24});
    if(ornate){
      // Structural timber beams and handcrafted masonry, all within the cached Graphic.
      for(let beam=1;beam<=2;beam++){
        const t=beam/3;
        const upper=between(ts,tw,t),lower=between(rs,rw,t);
        g.moveTo(upper.x,upper.y).lineTo(lower.x,lower.y)
          .stroke({width:2.1,color:shade(wall,.41),alpha:.55});
      }
      const a=between(ts,tw,.25),b=between(rs,rw,.75);
      g.moveTo(a.x,a.y+2).lineTo(b.x,b.y-2)
        .stroke({width:1.25,color:shade(wall,.45),alpha:.27});
      g.moveTo(ts.x,ts.y-8).lineTo(tw.x,tw.y-8)
        .stroke({width:.85,color:shade(wall,1.25),alpha:.36});
    }
    // Distinct gabled roofs, slate/tile planes and open-air market awnings.
    // Depth never changes collision: these are cached presentation polygons.
    const pitched=!isArena&&(!isMarket||(i+seed)%3!==0);
    const ridgeLift=(isKeep?22:isSacred?19:14)+((seed+i)%3)*3;
    const ridgeA=down(between(tn,te),-ridgeLift);
    const ridgeB=down(between(tw,ts),-ridgeLift);
    if(pitched){
      g.poly(coords(tn,ridgeA,ridgeB,tw))
        .fill(shade(variant,.91)).stroke({width:1.4,color:shade(roof,.46)});
      g.poly(coords(ridgeA,te,ts,ridgeB))
        .fill(shade(variant,1.08)).stroke({width:1.4,color:shade(roof,.51)});
    }else{
      g.poly(coords(tn,te,ts,tw)).fill(variant)
        .stroke({width:1.6,color:shade(roof,.47)});
    }
    if(ornate){
      // Sparse roof-slate brush strokes produce a material impression without
      // allocating textures or adding more children to Pixi's display list.
      for(let tile=0;tile<3;tile++){
        const t=(tile+1)/4;
        const a=between(tn,tw,t),b=between(ridgeA,ridgeB,t);
        g.moveTo(a.x*.82+b.x*.18,a.y*.82+b.y*.18)
          .lineTo(a.x*.42+b.x*.58,a.y*.42+b.y*.58)
          .stroke({width:.8,color:shade(roof,1.42),alpha:.22});
      }
    }
    if(!compact){
      const courses=pitched?2:3;
      for(let course=1;course<=courses;course++){
        const t=course/(courses+1);
        const a=between(tn,tw,t),b=between(te,ts,t);
        if(pitched){
          const ridge=between(ridgeA,ridgeB,t);
          g.moveTo(a.x,a.y).lineTo(ridge.x,ridge.y).lineTo(b.x,b.y)
            .stroke({width:1.05,color:shade(roof,.53),alpha:.42});
        }else{
          g.moveTo(a.x,a.y).lineTo(b.x,b.y)
            .stroke({width:1.05,color:shade(roof,.53),alpha:.37});
        }
      }
      for(let course=1;course<=2;course++){
        const t=course/3;
        const a=between(rs,rw,t),b=between(ts,tw,t);
        g.moveTo(a.x,a.y-3).lineTo(b.x,b.y+3)
          .stroke({width:1,color:shade(wall,.52),alpha:.22});
      }
    }

    g.moveTo(ridgeA.x,ridgeA.y).lineTo(ridgeB.x,ridgeB.y)
      .stroke({width:pitched?2.6:1.2,color:trim,alpha:pitched?.73:.3});
    // Lit windows draw a readable miniature townscape at game camera scale.
    if(!isArena&&(!compact||i%2===0)){
      const window=between(rs,rw);
      g.poly([window.x-7,window.y-height*.68,window.x+7,window.y-height*.68,
        window.x+7,window.y-height*.34,window.x-7,window.y-height*.34])
        .fill({color:isForge?0xff934d:isSacred?0x9fdaeb:0xf9d89c,alpha:.76})
        .stroke({width:2,color:shade(wall,.45)});
    }
    if(isKeep&&(i===0||i===renderModules.length-1)){
      g.rect(tn.x-10,tn.y-24,20,26).fill(shade(wall,.75)).stroke({width:1.4,color:trim,alpha:.5});
      g.poly([tn.x-15,tn.y-23,tn.x,tn.y-39,tn.x+15,tn.y-23]).fill(variant);
    }
    if(isSacred&&i===Math.floor(modules.length/2)){
      const cross=between(tn,ts);
      g.moveTo(cross.x,cross.y-6).lineTo(cross.x,cross.y-29).stroke({width:3,color:trim});
      g.moveTo(cross.x-9,cross.y-19).lineTo(cross.x+9,cross.y-19).stroke({width:3,color:trim});
    }
    // Window trim and restrained illumination: no dynamic shadows or bloom pass.
    if(ornate&&!isArena&&i%3===0){
      const light=between(rs,rw,.64);
      const ly=light.y-height*.55;
      g.circle(light.x,ly,15).fill({color:isForge?0xfaa05a:0xffdf91,alpha:.07});
      g.rect(light.x-6,ly-7,12,14)
        .fill({color:0xffe3a1,alpha:.50})
        .stroke({width:1.4,color:shade(wall,.40)});
      g.moveTo(light.x,ly-7).lineTo(light.x,ly+7)
        .stroke({width:1.5,color:shade(wall,.45)});
    }
    // Carved ground-floor entries make buildings legible at play scale.
    if((i+seed)%4===0&&!isArena){
      const door=between(rs,rw,.35);
      g.roundRect(door.x-8,door.y-23,16,23,2)
        .fill(shade(wall,.30)).stroke({width:1.3,color:trim,alpha:.68});
      if(ornate){
        g.circle(door.x+4,door.y-10,1.6).fill(trim);
        // Wall-mounted lantern frames the entrance without runtime particles.
        const lampX=door.x+12,lampY=door.y-31;
        g.moveTo(lampX,lampY-10).lineTo(lampX,lampY)
          .stroke({width:2,color:shade(wall,.44)});
        g.circle(lampX,lampY+3,12)
          .fill({color:0xffc677,alpha:.09});
        g.roundRect(lampX-4,lampY-2,8,11,2)
          .fill({color:0xf5cb86,alpha:.76})
          .stroke({width:1.2,color:shade(wall,.37)});
      }
    }
    if(!compact&&isKeep&&i===0){
      const flag=down(ridgeA,-43);
      g.moveTo(flag.x,flag.y+47).lineTo(flag.x,flag.y).stroke({width:2,color:trim});
      g.poly([flag.x,flag.y+1,flag.x+21,flag.y+8,flag.x,flag.y+16])
        .fill(shade(roof,1.25));
    }
    if(isForge&&i===0){
      g.rect(tn.x-12,tn.y-28,24,32).fill(shade(wall,.55));
      g.circle(tn.x,tn.y-34,10).fill({color:0xffa86a,alpha:.26});
    }
    if(isMarket){
      g.poly([tw.x,tw.y,ts.x,ts.y,ts.x,ts.y+11,tw.x,tw.y+11])
        .fill({color:i%2?trim:0xf0dfac,alpha:.77});
      if(!compact){
        // Hanging merchant sign is part of the existing cached landmark.
        const sign=between(ts,tw,.55);
        g.moveTo(sign.x,sign.y+5).lineTo(sign.x,sign.y+19)
          .stroke({width:1.5,color:shade(wall,.4)});
        g.roundRect(sign.x-12,sign.y+18,24,14,2)
          .fill(shade(wall,.52)).stroke({width:1.4,color:trim});
        g.circle(sign.x,sign.y+25,3).fill(trim);
      }
    }
  });
  g.position.set(center.x,center.y);
  return g;
}
