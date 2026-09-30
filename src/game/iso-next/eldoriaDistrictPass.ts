import { Container, Graphics } from 'pixi.js';

const TILE_W=96,TILE_H=48;
const iso=(x:number,y:number)=>({x:(x-y)*TILE_W/2,y:(x+y)*TILE_H/2});

function marker(layer:Container,x:number,y:number,kind:'market'|'archive'|'guild'|'arcane'){
 const p=iso(x,y),g=new Graphics();
 const palette={market:[0x8d3f5b,0xf1c86e],archive:[0x35566b,0x8fc8d9],guild:[0x704638,0xe0a85e],arcane:[0x543c76,0xb992ff]}[kind];
 g.ellipse(0,12,34,10).fill({color:0,alpha:.2});
 g.rect(-3,-62,6,65).fill(0x45362a);
 g.moveTo(0,-57).lineTo(24,-67).stroke({width:4,color:0x5b4633});
 g.poly([23,-77,58,-68,23,-56]).fill(palette[0]).stroke({width:3,color:palette[1]});
 if(kind==='market'){g.circle(39,-67,8).stroke({width:3,color:palette[1]});g.moveTo(33,-67).lineTo(45,-67).stroke({width:2,color:palette[1]});}
 if(kind==='archive'){g.rect(31,-74,17,15).stroke({width:3,color:palette[1]});g.moveTo(34,-69).lineTo(45,-69).moveTo(34,-64).lineTo(43,-64).stroke({width:2,color:palette[1]});}
 if(kind==='guild'){g.moveTo(32,-74).lineTo(46,-60).moveTo(46,-74).lineTo(32,-60).stroke({width:4,color:palette[1]});}
 if(kind==='arcane'){g.circle(39,-67,9).stroke({width:2,color:palette[1]});g.circle(39,-67,3).fill(palette[1]);g.moveTo(39,-78).lineTo(39,-56).moveTo(28,-67).lineTo(50,-67).stroke({width:1.5,color:palette[1]});}
 g.position.set(p.x,p.y);layer.addChild(g);
}

/** Presentation-only district readability. No collision, movement or gameplay ownership. */
export function drawEldoriaDistricts(layer:Container):void{
 marker(layer,4,8,'market');marker(layer,8,4,'archive');marker(layer,12,8,'guild');marker(layer,8,13,'arcane');

 // Main civic routes: repeated paving medallions visually connect each district to the Crown.
 for(const [x,y,c] of [[5,8,0xe0b65e],[6,8,0xe0b65e],[7,8,0xd7c784],[9,8,0xd7c784],[10,8,0xd49b67],[11,8,0xd49b67],[8,5,0x83b9c7],[8,6,0x83b9c7],[8,7,0x9bc5c2],[8,9,0xa89ac8],[8,10,0xa89ac8],[8,11,0xb992ff],[8,12,0xb992ff]] as const){
  const p=iso(x,y),g=new Graphics().ellipse(0,4,18,7).fill({color:c,alpha:.11}).ellipse(0,2,9,4).stroke({width:2,color:c,alpha:.34});g.position.set(p.x,p.y);layer.addChild(g);
 }

 // Gate silhouettes establish entrances and make the city feel larger than the visible playfield.
 for(const [x,y,flip,color] of [[1,8,-1,0xd2b35e],[15,8,1,0xb47d55],[8,2,-1,0x83c4cc],[8,15,1,0xaa84d1]] as const){
  const p=iso(x,y),g=new Graphics();
  g.rect(-32,-55,12,61).fill(0x4b514d).stroke({width:2,color:0x282d2b});
  g.rect(20,-55,12,61).fill(0x4b514d).stroke({width:2,color:0x282d2b});
  g.moveTo(-26,-52).quadraticCurveTo(0,-78,26,-52).stroke({width:9,color:0x596159});
  g.poly([-9,-56,0,-68,9,-56,0,-47]).fill({color,alpha:.38}).stroke({width:2,color,alpha:.8});
  g.moveTo(32*flip,-43).lineTo(53*flip,-51).stroke({width:3,color:0x55402d});
  g.poly([52*flip,-58,69*flip,-52,52*flip,-44]).fill(color);
  g.position.set(p.x,p.y);layer.addChild(g);
 }

 // District micro-props: each quadrant receives a distinct readable motif.
 const market=iso(4,9),m=new Graphics().poly([-32,0,0,-17,32,0,0,17]).fill({color:0x8d3f5b,alpha:.18}).stroke({width:2,color:0xe0b65e,alpha:.45}).circle(-13,-3,4).fill(0xe0b65e).circle(0,4,4).fill(0xb96d75).circle(13,-3,4).fill(0x78a96b);m.position.set(market.x,market.y);layer.addChild(m);
 const archive=iso(9,4),a=new Graphics().rect(-21,-34,42,34).fill({color:0x35566b,alpha:.22}).stroke({width:2,color:0x8fc8d9,alpha:.42});for(let i=0;i<4;i++)a.moveTo(-14,-27+i*7).lineTo(14,-27+i*7).stroke({width:2,color:0xc4e2e7,alpha:.5});a.position.set(archive.x,archive.y);layer.addChild(a);
 const guild=iso(12,9),q=new Graphics().circle(0,-4,25).stroke({width:3,color:0xe0a85e,alpha:.34}).moveTo(-18,-22).lineTo(18,14).moveTo(18,-22).lineTo(-18,14).stroke({width:5,color:0xb37a4b,alpha:.7});q.position.set(guild.x,guild.y);layer.addChild(q);
 const arcane=iso(9,13),r=new Graphics().circle(0,-8,27).stroke({width:2,color:0xb992ff,alpha:.35}).circle(0,-8,17).stroke({width:2,color:0x79d7d2,alpha:.28});for(let i=0;i<6;i++){const t=i*Math.PI/3;r.circle(Math.cos(t)*22,-8+Math.sin(t)*14,2.5).fill(i%2?0xb992ff:0x79d7d2);}r.position.set(arcane.x,arcane.y);layer.addChild(r);
}
