import { Graphics } from 'pixi.js';
import type { IsoSceneNode } from './sceneModel';

type CharacterProfile={body:number;cloth:number;accent:number;skin:number;hair:number;scale:number;headwear?:'hood'|'helm'|'hat';weapon?:'sword'|'staff'|'spear'|'pack'};

const PROFILES:Record<string,CharacterProfile>={
 'npc-villager':{body:0x6f5844,cloth:0x9b7655,accent:0xd4b477,skin:0xd7a07b,hair:0x4a3024,scale:.94,headwear:'hood',weapon:'pack'},
 'npc-guard':{body:0x58646d,cloth:0x293d56,accent:0xd6b15d,skin:0xd3a07e,hair:0x3b2b25,scale:1.03,headwear:'helm',weapon:'spear'},
 'npc-merchant':{body:0x6d3655,cloth:0x9a5a43,accent:0xe4c06c,skin:0xe0aa82,hair:0x5b3729,scale:.98,headwear:'hat',weapon:'pack'},
};

const sideOf=(n:Readonly<IsoSceneNode>)=>n.facing==='nw'||n.facing==='sw'?-1:1;

/** Presentation-only identity pass for recurring humanoids. Server DTOs remain untouched. */
export function drawCharacterVisual(g:Graphics,node:Readonly<IsoSceneNode>):boolean{
 const p=PROFILES[node.visualId||''];if(!p)return false;
 const side=sideOf(node),phase=(node.animationPhase||0)*Math.PI*2,bob=node.motion==='walk'?Math.sin(phase)*2:Math.sin(phase*.35)*.7,arm=node.motion==='walk'?Math.sin(phase)*5:0;
 g.ellipse(0,19,24*p.scale,8*p.scale).fill({color:0,alpha:.3});
 g.poly([-11,-7-bob,11,-7-bob,9,24-bob,-9,24-bob]).fill(p.cloth).stroke({width:2,color:p.body});
 g.poly([-14,-7-bob,0,-20-bob,14,-7-bob,9,2-bob,-9,2-bob]).fill(p.body).stroke({width:2,color:0x272326});
 g.circle(0,-24-bob,10).fill(p.skin).stroke({width:2,color:0x694735});
 if(p.headwear==='hood')g.poly([-12,-26-bob,0,-39-bob,12,-26-bob,8,-18-bob,-8,-18-bob]).fill(p.body).stroke({width:2,color:0x352c29});
 if(p.headwear==='helm'){g.arc(0,-25-bob,11,Math.PI,0).stroke({width:7,color:0x87939a});g.rect(-12,-27-bob,24,4).fill(p.accent);}
 if(p.headwear==='hat'){g.poly([-15,-31-bob,0,-40-bob,15,-31-bob,9,-27-bob,-9,-27-bob]).fill(0x513149);g.rect(-18,-28-bob,36,3).fill(p.accent);}
 g.poly([-7,-34-bob,0,-39-bob,8,-34-bob,5,-31-bob,-5,-31-bob]).fill(p.hair);
 const handX=12*side,handY=-4-bob+arm;
 if(p.weapon==='spear'){g.moveTo(handX,handY).lineTo(handX+16*side,-58-bob).stroke({width:3,color:0x9a7547});g.poly([handX+16*side,-64-bob,handX+21*side,-54-bob,handX+11*side,-56-bob]).fill(0xc5d0d4);}
 if(p.weapon==='pack'){g.roundRect(-17*side,-6-bob,12*side,21,4).fill(0x6d4c32).stroke({width:2,color:p.accent});}
 g.circle(-6*side,-22-bob,1.3).fill(p.accent);g.circle(5*side,-22-bob,1.3).fill(0x2a211d);
 return true;
}
