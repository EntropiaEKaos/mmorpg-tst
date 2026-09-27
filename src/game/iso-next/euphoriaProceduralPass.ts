import { Graphics } from 'pixi.js';
import type { IsoAssetAnimation, IsoAssetDirection } from './assetPipeline';
import type { IsoSceneNode } from './sceneModel';
import { EUPHORIA_ART_PROFILE, sampleEuphoriaPose } from './euphoriaArtDirection';

function animationOf(node: Readonly<IsoSceneNode>): IsoAssetAnimation {
  if (node.combatCue && node.combatCue !== 'none') return node.combatCue;
  return node.motion === 'walk' ? 'walk' : 'idle';
}
function directionOf(node: Readonly<IsoSceneNode>): Exclude<IsoAssetDirection,'omni'> { return node.facing ?? 'se'; }

/** Art-directed procedural Euphoria used until the matching production atlas is available. */
export function drawEuphoriaProcedural(g: Graphics, node: Readonly<IsoSceneNode>): void {
  const animation=animationOf(node), direction=directionOf(node), phase=node.combatCue&&node.combatCue!=='none'?(node.combatPhase??0):(node.animationPhase??0);
  const pose=sampleEuphoriaPose(animation,phase,direction), p=EUPHORIA_ART_PROFILE, side=direction==='nw'||direction==='sw'?-1:1;
  const lean=pose.lean, lift=pose.lift;
  g.ellipse(0,19,30*pose.squash,10).fill({color:0,alpha:.34});
  g.poly([-22*side+lean,-5-lift,-11*side+lean,-18-lift,(-10+pose.cape)*side+lean,31-lift,(-27+pose.cape*1.2)*side+lean,21-lift]).fill(p.palette.accent).stroke({width:2,color:0x4c1825});
  g.poly([-17*side+lean,-9-lift,lean,-23-lift,17*side+lean,-9-lift,12*side+lean,3-lift,-12*side+lean,3-lift]).fill(p.palette.armor).stroke({width:2,color:0x53606a});
  g.poly([-15*side+lean,-7-lift,15*side+lean,-7-lift,13*side+lean,29-lift,-13*side+lean,29-lift]).fill(p.palette.cloth).stroke({width:2,color:0x162d48});
  g.circle(lean,-25-lift,p.silhouette.head).fill(p.palette.skin).stroke({width:2,color:0x684630});
  g.poly([(-15+pose.hair)*side+lean,-30-lift,(-5+pose.hair)*side+lean,-40-lift,(9+pose.hair)*side+lean,-37-lift,(17+pose.hair)*side+lean,-28-lift,(9+pose.hair)*side+lean,-31-lift,lean,-28-lift]).fill(p.palette.hair);
  const a=pose.weaponArc*Math.PI/180, handX=(15*side)+lean, handY=-5-lift, reach=p.silhouette.weaponReach;
  const tipX=handX+Math.sin(a)*reach, tipY=handY-Math.cos(a)*reach;
  g.moveTo(handX,handY).lineTo(tipX,tipY).stroke({width:5,color:0xded8c4}).moveTo(handX,handY).lineTo(tipX,tipY).stroke({width:1,color:0xffffff,alpha:.7});
  g.circle(lean,4-lift,6+pose.glow*3).fill({color:p.palette.magic,alpha:.18+pose.glow*.42}).stroke({width:2,color:p.palette.magic,alpha:.5+pose.glow*.4});
}
