import { Graphics } from 'pixi.js';
import type { IsoAssetAnimation, IsoAssetDirection } from './assetPipeline';
import type { IsoSceneNode } from './sceneModel';
import { SHADOW_WOLF_ART_PROFILE, sampleShadowWolfPose } from './shadowWolfArtDirection';

function animationOf(node:Readonly<IsoSceneNode>):IsoAssetAnimation{if(node.combatCue&&node.combatCue!=='none')return node.combatCue;return node.motion==='walk'?'walk':'idle';}
function directionOf(node:Readonly<IsoSceneNode>):Exclude<IsoAssetDirection,'omni'>{return node.facing??'se';}

/** Art-directed procedural Shadow Wolf until its matching production atlas is available. */
export function drawShadowWolfProcedural(g:Graphics,node:Readonly<IsoSceneNode>):void{
 const animation=animationOf(node),direction=directionOf(node),phase=node.combatCue&&node.combatCue!=='none'?(node.combatPhase??0):(node.animationPhase??0),pose=sampleShadowWolfPose(animation,phase,direction),p=SHADOW_WOLF_ART_PROFILE,side=direction==='nw'||direction==='sw'?-1:1;
 const bx=pose.bodyX,by=pose.bodyY+pose.crouch,body=p.silhouette.bodyLength/2;
 g.ellipse(bx,15+by,31*pose.squash,9).fill({color:0,alpha:.36});
 g.poly([(-body)*side+bx,-2+by,(-14)*side+bx,-15+by,(10)*side+bx,-16+by,(body)*side+bx,-7+by,(body+3)*side+bx,5+by,(8)*side+bx,10+by,(-13)*side+bx,11+by]).fill(p.palette.body).stroke({width:2,color:p.palette.shadow});
 const hx=(21+pose.headX)*side+bx,hy=-14+by;
 g.poly([hx-8*side,hy-3,hx+10*side,hy-10-pose.jaw*.2,hx+13*side,hy+4+pose.jaw,hx-3*side,hy+7]).fill(p.palette.body).stroke({width:2,color:p.palette.shadow});
 g.poly([hx-5*side,hy-8,hx+1*side,hy-20,hx+6*side,hy-7]).fill(p.palette.highlight);
 g.circle(hx+5*side,hy-4,5+pose.glow*3).fill({color:p.palette.energy,alpha:.06+pose.glow*.14});g.circle(hx+5*side,hy-4,2.6).fill({color:p.palette.eye,alpha:.72+pose.glow*.25});
 const stride=pose.stride;
 g.poly([(-14+stride*.35)*side+bx,7+by,(-11+stride)*side+bx,22+by,(-5+stride)*side+bx,22+by,-5*side+bx,7+by]).fill(p.palette.shadow);
 g.poly([(8-stride*.35)*side+bx,7+by,(11-stride)*side+bx,22+by,(17-stride)*side+bx,22+by,14*side+bx,5+by]).fill(p.palette.shadow);
 const tailBase=(-body+3)*side+bx,tailY=-2+by,tailX=tailBase-(p.silhouette.tail+pose.tail)*side;
 g.moveTo(tailBase,tailY).quadraticCurveTo(tailBase-15*side,tailY-15-pose.tail*.25,tailX,tailY-5-pose.tail*.12).stroke({width:8,color:p.palette.body}).moveTo(tailBase,tailY).quadraticCurveTo(tailBase-15*side,tailY-15-pose.tail*.25,tailX,tailY-5-pose.tail*.12).stroke({width:2,color:p.palette.highlight,alpha:.45});
 if(pose.glow>.55)g.ellipse(bx,-4+by,body+8,18).stroke({width:2,color:p.palette.energy,alpha:(pose.glow-.5)*.45});
}
