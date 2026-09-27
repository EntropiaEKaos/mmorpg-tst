import { ISO_ENTITY_ARCHETYPES, ambientBehaviorAt, type IsoAmbientBehavior, type IsoEntityArchetypeId } from './entityArchetypes';
import type { IsoFacing, IsoSceneNode } from './sceneModel';

export type AmbientSpawnZone={id:string;center:{x:number;y:number};radius:number;archetypes:readonly IsoEntityArchetypeId[];budget:number};
export type AmbientPopulationEntity={id:string;archetypeId:IsoEntityArchetypeId;behavior:IsoAmbientBehavior;origin:{x:number;y:number};phase:number;speed:number};
export type AmbientPopulationFrame={entities:IsoSceneNode[];active:number;culled:number};

const DEFAULT_ZONES:readonly AmbientSpawnZone[]=[
 {id:'eldoria-square',center:{x:0,y:360},radius:260,archetypes:['eldoria-villager','eldoria-guard','eldoria-merchant'],budget:9},
 {id:'eldoria-grove',center:{x:-330,y:390},radius:250,archetypes:['forest-wisp','moss-boar'],budget:7},
 {id:'eldoria-edge',center:{x:350,y:330},radius:280,archetypes:['moss-boar','shadow-wolf'],budget:6},
];
function hash(text:string):number{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function unit(seed:number):number{return((seed%10000)+.5)/10000;}
function facing(dx:number,dy:number):IsoFacing{return Math.abs(dx)>Math.abs(dy)?(dx<0?'sw':'ne'):(dy<0?'nw':'se');}

export class AmbientPopulationRuntime{
 private population:AmbientPopulationEntity[]=[];
 constructor(private readonly zones:readonly AmbientSpawnZone[]=DEFAULT_ZONES){this.population=this.buildPopulation();}
 sample(elapsedMs:number,camera:{x:number;y:number},renderDistance=760):AmbientPopulationFrame{
  const t=elapsedMs/1000,out:IsoSceneNode[]=[];let culled=0;
  for(const e of this.population){const a=ISO_ENTITY_ARCHETYPES.find(v=>v.id===e.archetypeId);if(!a)continue;const motion=this.motion(e,t),x=e.origin.x+motion.x,y=e.origin.y+motion.y,dx=x-camera.x,dy=y-camera.y;if(dx*dx+dy*dy>renderDistance*renderDistance){culled++;continue;}out.push({id:e.id,layer:'entities',visualId:a.visualId,x,y,depth:y,facing:facing(motion.dx,motion.dy),motion:motion.walk?'walk':'idle',animationPhase:(t*e.speed+e.phase)%1,combatCue:'none'});}
  return{entities:out,active:out.length,culled};
 }
 private buildPopulation():AmbientPopulationEntity[]{const out:AmbientPopulationEntity[]=[];for(const zone of this.zones)for(let i=0;i<zone.budget;i++){const seed=hash(`${zone.id}:${i}`),angle=unit(seed)*Math.PI*2,radius=Math.sqrt(unit(seed>>>3))*zone.radius*.78,archetypeId=zone.archetypes[seed%zone.archetypes.length],a=ISO_ENTITY_ARCHETYPES.find(v=>v.id===archetypeId)!;out.push({id:`ambient:${zone.id}:${i}`,archetypeId,behavior:ambientBehaviorAt(a,seed>>>5),origin:{x:zone.center.x+Math.cos(angle)*radius,y:zone.center.y+Math.sin(angle)*radius*.55},phase:unit(seed>>>7),speed:.16+unit(seed>>>11)*.22});}return out;}
 private motion(e:AmbientPopulationEntity,t:number){const p=t*e.speed+e.phase*Math.PI*2;if(e.behavior==='patrol')return{x:Math.sin(p)*85,y:Math.cos(p*.5)*24,dx:Math.cos(p),dy:-Math.sin(p*.5)*.25,walk:true};if(e.behavior==='wander')return{x:Math.sin(p*.73)*54,y:Math.cos(p*.51)*32,dx:Math.cos(p*.73),dy:-Math.sin(p*.51),walk:true};if(e.behavior==='graze')return{x:Math.sin(p*.3)*18,y:Math.cos(p*.25)*10,dx:Math.cos(p*.3),dy:-Math.sin(p*.25),walk:Math.sin(p*.7)>.45};if(e.behavior==='hover')return{x:Math.sin(p)*24,y:Math.cos(p*1.3)*16-10,dx:Math.cos(p),dy:-Math.sin(p*1.3),walk:true};if(e.behavior==='watch')return{x:0,y:0,dx:Math.sin(p),dy:Math.cos(p),walk:false};return{x:0,y:0,dx:1,dy:1,walk:false};}
}
