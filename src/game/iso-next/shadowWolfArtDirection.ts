import type { IsoAssetAnimation, IsoAssetDirection } from './assetPipeline';

export const SHADOW_WOLF_ART_PROFILE = {
  silhouette: { bodyLength: 58, bodyHeight: 25, head: 18, leg: 22, tail: 31 },
  palette: { body: 0x303541, shadow: 0x171b25, highlight: 0x596273, eye: 0xef4961, energy: 0x9a5cff },
  motion: { stride: 8, shoulderBob: 3.4, tailFollow: .72, recoil: 10 },
} as const;

export type ShadowWolfPose = { bodyX:number; bodyY:number; bodyTilt:number; stride:number; crouch:number; headX:number; tail:number; jaw:number; glow:number; squash:number };

export function sampleShadowWolfPose(animation:IsoAssetAnimation,phase:number,direction:Exclude<IsoAssetDirection,'omni'>):ShadowWolfPose{
 const p=Math.max(0,Math.min(1,phase)),side=direction==='nw'||direction==='sw'?-1:1,cycle=Math.sin(p*Math.PI*2),impact=Math.sin(p*Math.PI);
 switch(animation){
  case 'walk': return {bodyX:cycle*1.4*side,bodyY:Math.abs(cycle)*1.8,bodyTilt:cycle*.04,stride:cycle*8,crouch:0,headX:cycle*1.2*side,tail:-cycle*9,jaw:0,glow:.35,squash:1-Math.abs(cycle)*.025};
  case 'windup': return {bodyX:-5*p*side,bodyY:3*p,bodyTilt:-.08*p*side,stride:-4*p,crouch:7*p,headX:-4*p*side,tail:8*p*side,jaw:3*p,glow:.35+.35*p,squash:1+.05*p};
  case 'attack': return {bodyX:18*impact*side,bodyY:-5*impact,bodyTilt:.12*impact*side,stride:10*impact,crouch:-3*impact,headX:10*impact*side,tail:-13*impact*side,jaw:8*impact,glow:.9,squash:1-.08*impact};
  case 'hit': return {bodyX:-10*(1-p)*side,bodyY:-3*(1-p),bodyTilt:-.16*(1-p)*side,stride:-4*(1-p),crouch:4*(1-p),headX:-7*(1-p)*side,tail:11*(1-p)*side,jaw:2,glow:.18,squash:.9+.1*p};
  case 'cast': return {bodyX:0,bodyY:-3*impact,bodyTilt:0,stride:0,crouch:2*impact,headX:0,tail:Math.sin(p*Math.PI*2)*6,jaw:4*impact,glow:.45+.55*impact,squash:1};
  case 'death': return {bodyX:8*p*side,bodyY:8*p,bodyTilt:.5*p*side,stride:-5*p,crouch:10*p,headX:5*p*side,tail:12*p*side,jaw:2*(1-p),glow:.25*(1-p),squash:1-.28*p};
  default:return {bodyX:0,bodyY:Math.sin(p*Math.PI*2)*.7,bodyTilt:0,stride:0,crouch:0,headX:0,tail:Math.sin(p*Math.PI*2)*2.5,jaw:0,glow:.42,squash:1};
 }
}
