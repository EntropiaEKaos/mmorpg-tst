import { Container, Graphics } from 'pixi.js';
const W=96,H=48;const iso=(x:number,y:number)=>({x:(x-y)*W/2,y:(x+y)*H/2});
const put=(l:Container,g:Graphics,x:number,y:number,dy=0)=>{const p=iso(x,y);g.position.set(p.x,p.y+dy);l.addChild(g);};

function stall(color:number,trim:number){return new Graphics().ellipse(0,8,36,10).fill({color:0,alpha:.2}).rect(-28,-25,56,29).fill(0x5b4633).poly([-34,-26,0,-43,34,-26,0,-12]).fill(color).stroke({width:2,color:trim}).rect(-24,-18,48,4).fill(0x8d6b45).circle(-13,-21,4).fill(0xd3a75b).circle(0,-20,4).fill(0x8aaa62).circle(13,-21,4).fill(0xb95f65);}
function cart(){return new Graphics().ellipse(0,10,39,10).fill({color:0,alpha:.2}).poly([-31,-7,20,-7,29,11,-23,11]).fill(0x6c4b32).stroke({width:2,color:0x36291f}).circle(-20,13,10).stroke({width:4,color:0x493526}).circle(20,13,10).stroke({width:4,color:0x493526}).moveTo(28,-2).lineTo(48,-15).stroke({width:4,color:0x60452f}).circle(-10,-9,5).fill(0x88a75c).circle(3,-10,5).fill(0xd1a856).circle(15,-8,5).fill(0x9d5d63);}
function fence(){const g=new Graphics();for(const x of[-27,-9,9,27])g.rect(x-2,-20,4,26).fill(0x5d4935);g.moveTo(-31,-13).lineTo(31,-8).moveTo(-31,-1).lineTo(31,4).stroke({width:4,color:0x755b3e});return g;}
function shrine(){return new Graphics().ellipse(0,7,25,8).fill({color:0,alpha:.2}).poly([-17,2,0,-8,17,2,0,10]).fill(0x555d56).rect(-5,-39,10,35).fill(0x626c62).poly([-11,-39,0,-56,11,-39]).fill(0x53665a).stroke({width:2,color:0xb99a59}).circle(0,-37,5).fill(0x7dd0bd).circle(0,-37,13).fill({color:0x7dd0bd,alpha:.06});}
function critter(kind:'bird'|'cat'|'rabbit',phase:number){const g=new Graphics();if(kind==='bird'){g.moveTo(-10,0).quadraticCurveTo(-4,-7,0,-1).quadraticCurveTo(5,-7,11,0).stroke({width:2,color:0xc7c3ad});g.circle(0,0,2).fill(0xe5d27d);}if(kind==='cat'){g.ellipse(0,2,10,6).fill(0x6c6259).circle(8,-3,5).fill(0x766a60).poly([5,-7,7,-13,10,-7,13,-12,13,-5]).fill(0x766a60);g.moveTo(-9,1).quadraticCurveTo(-18,-8,-12,-13).stroke({width:3,color:0x6c6259});}if(kind==='rabbit'){g.ellipse(0,2,9,6).fill(0xa7a090).circle(7,-4,5).fill(0xb4ad9b).ellipse(5,-12,3,8).fill(0xb4ad9b).ellipse(10,-12,3,8).fill(0xb4ad9b).circle(10,-5,1.3).fill(0x242322);}g.y=Math.sin(phase)*2;return g;}
/** Presentation-only ambient life. Deterministic motion; no authoritative NPC or collision state. */
export function drawEldoriaLife(layer:Container,elapsedMs:number):void{
 const t=elapsedMs/1000;
 put(layer,stall(0x873c56,0xe0b65e),3.7,9.1,-4);put(layer,stall(0x4f7458,0xd4bc72),5.1,9.8,-3);put(layer,cart(),5.8,7.4,0);
 put(layer,fence(),2.8,6.2);put(layer,fence(),13.5,12.7);put(layer,fence(),6.1,14.2);
 put(layer,shrine(),12.9,5.1,-4);put(layer,shrine(),5.4,12.8,-2);
 // Small garden clusters and mushrooms at the Old Grove edge.
 for(const [x,y,c] of [[3.2,6.7,0xd8b85c],[4.2,12.3,0xb96d75],[13.4,11.7,0x88b96b],[14.1,7.2,0x9f78c5],[6.4,14.4,0x78b9aa]] as const){const g=new Graphics().circle(-7,0,3).fill(c).circle(0,-4,3).fill(c).circle(7,1,3).fill(c).moveTo(-7,2).lineTo(-7,8).moveTo(0,-1).lineTo(0,8).moveTo(7,3).lineTo(7,8).stroke({width:1.5,color:0x477047});put(layer,g,x,y);}
 // Ambient creatures follow tiny deterministic loops so screenshots and CI stay stable enough.
 const actors=[{k:'cat' as const,x:4.9,y:8.8,p:.2},{k:'rabbit' as const,x:13.1,y:10.9,p:1.4},{k:'bird' as const,x:7.2,y:6.3,p:2.1},{k:'bird' as const,x:10.5,y:7.0,p:3.3}];
 actors.forEach((a,i)=>{const g=critter(a.k,t*1.2+a.p);const p=iso(a.x,a.y);const drift=a.k==='bird'?18:7;g.position.set(p.x+Math.sin(t*.45+a.p)*drift,p.y-(a.k==='bird'?58:4)+Math.cos(t*.5+a.p)*3);g.alpha=.78+i*.04;layer.addChild(g);});
 // Chimney smoke implies occupied buildings without adding gameplay entities.
 for(const [x,y,phase] of [[4,8,0],[12,8,1.7],[8,13,3.1]] as const){const p=iso(x,y);for(let i=0;i<4;i++){const age=(t*.18+i*.23+phase)%1;const g=new Graphics().circle(0,0,6+age*12).fill({color:0xb9c0b7,alpha:(1-age)*.055});g.position.set(p.x-18+Math.sin(t*.35+i)*5,p.y-125-age*52);layer.addChild(g);}}
}
