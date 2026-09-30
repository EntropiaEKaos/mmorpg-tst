import { Container, Graphics } from 'pixi.js';
const W=96,H=48;const iso=(x:number,y:number)=>({x:(x-y)*W/2,y:(x+y)*H/2});
const put=(l:Container,g:Graphics,x:number,y:number,dy=0)=>{const p=iso(x,y);g.position.set(p.x,p.y+dy);l.addChild(g);};
const pulse=(t:number,phase=0)=>.5+.5*Math.sin(t+phase);

function marketTrade(t:number){const g=new Graphics(),p=pulse(t*1.4);g.ellipse(0,7,26,7).fill({color:0,alpha:.18});g.rect(-23,-15,18,16).fill(0x6a4b35);g.circle(-14,-19,4).fill(0xd1a77f);g.poly([-20,-13,-8,-13,-9,3,-19,3]).fill(0x873c56);g.circle(14,-19,4).fill(0xc59b76);g.poly([8,-13,20,-13,19,3,9,3]).fill(0x536b52);g.circle(p*10-5,-9,3).fill(0xe0b65e);g.moveTo(-6,-8).lineTo(6,-8).stroke({width:2,color:0xd8b76d,alpha:.55});return g;}
function guardChange(t:number){const g=new Graphics(),p=pulse(t*.9);for(const [x,flip] of [[-11,1],[11,-1]] as const){g.circle(x,-24,5).fill(0xcaa37f);g.poly([x-7,-17,x+7,-17,x+6,6,x-6,6]).fill(0x5d4b3b);g.moveTo(x+8*flip,-14).lineTo(x+8*flip,10).stroke({width:2,color:0xb99b65});}g.moveTo(-5,-8-p*5).lineTo(5,-8-p*5).stroke({width:2,color:0xe0a85e,alpha:.5+p*.4});return g;}
function scholarRead(t:number){const g=new Graphics(),p=pulse(t*1.1);g.circle(0,-24,5).fill(0xcaa37f);g.poly([-7,-17,7,-17,6,7,-6,7]).fill(0x425c72);g.poly([-16,-11,-2,-14,-1,-3,-15,0]).fill(0x785b3c).stroke({width:1,color:0xd6c391});g.poly([2,-14,16,-11,15,0,1,-3]).fill(0x785b3c).stroke({width:1,color:0xd6c391});g.circle(-8+p*16,-7,1.5).fill(0x83cbd2);return g;}
function fountainGather(t:number){const g=new Graphics();for(let i=0;i<3;i++){const a=i*Math.PI*2/3+t*.08,r=23,x=Math.cos(a)*r,y=Math.sin(a)*9;g.circle(x,y-17,4).fill(0xcaa37f);g.poly([x-5,y-12,x+5,y-12,x+4,y+5,x-4,y+5]).fill([0x536b52,0x76506d,0x6b5945][i]);}return g;}
function arcaneStudy(t:number){const g=new Graphics(),p=pulse(t*1.7);g.circle(0,-13,15+p*5).stroke({width:2,color:0xb992ff,alpha:.25+p*.35});g.circle(0,-13,5+p*3).fill({color:0x79d7d2,alpha:.12+p*.18});for(let i=0;i<5;i++){const a=i*Math.PI*2/5+t*.35;g.circle(Math.cos(a)*(18+p*5),-13+Math.sin(a)*(9+p*3),2).fill(i%2?0xb992ff:0x79d7d2);}return g;}
function birdsBurst(t:number){const g=new Graphics(),cycle=(t%8);if(cycle>2.2)return g;const rise=cycle/2.2;for(let i=0;i<4;i++){const x=(i-1.5)*13+Math.sin(t*3+i)*5,y=-rise*(45+i*7)-i*3;g.moveTo(x-7,y).quadraticCurveTo(x-3,y-5-Math.sin(t*8+i)*3,x,y).quadraticCurveTo(x+4,y-5-Math.sin(t*8+i)*3,x+8,y).stroke({width:2,color:0xd7d0b7,alpha:1-rise*.45});}return g;}
/** Cyclic presentation-only vignettes. No quest, economy, combat, collision or authoritative NPC state. */
export function drawEldoriaMicroEvents(layer:Container,elapsedMs:number):void{
 const t=elapsedMs/1000;
 // Market transaction, guild shift change, archive reading and arcane research give each district its own rhythm.
 put(layer,marketTrade(t),4.5,9.35,-7);
 put(layer,guardChange(t),12.15,8.7,-5);
 put(layer,scholarRead(t),8.45,5.35,-5);
 put(layer,arcaneStudy(t),8.8,12.55,-18);
 // Residents periodically gather around the Crown while a small flock lifts from the civic square.
 put(layer,fountainGather(t),8.05,8.65,-3);
 put(layer,birdsBurst(t),7.55,7.45,-38);
 // Sparse local sparkles make the arcane quarter feel active without obscuring gameplay silhouettes.
 for(let i=0;i<5;i++){const a=t*.35+i*1.256,r=18+(i%2)*9,p=iso(9.1,12.9),g=new Graphics().circle(0,0,1.5+(i%2)).fill({color:i%2?0xb992ff:0x79d7d2,alpha:.18+.2*pulse(t*2,i)});g.position.set(p.x+Math.cos(a)*r,p.y-35+Math.sin(a)*10);layer.addChild(g);}
}
