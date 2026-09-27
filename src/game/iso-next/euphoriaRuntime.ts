import { IsoCamera } from './camera';
import { adaptAuthoritativeEntities, type AuthoritativeVisualEntity } from './worldAdapter';
import { buildEntitySceneFrame, composeAmbientPopulation, sortIsoSceneFrame, type IsoCombatCue, type IsoFacing, type IsoSceneFrame } from './sceneModel';
import { AmbientPopulationRuntime } from './ambientPopulationRuntime';
import type { IsoRenderer, IsoViewport } from './rendererContract';

type PreviousVisual={x:number;y:number;facing:IsoFacing;phase:number};type CombatVisual={cue:IsoCombatCue;phase:number};
/** Presentation coordinator only. It never owns simulation, damage or hit resolution. */
export class EuphoriaPresentationRuntime{
 readonly camera=new IsoCamera();private renderer:IsoRenderer|null=null;private frame:IsoSceneFrame=sortIsoSceneFrame(buildEntitySceneFrame([]));private previous=new Map<string,PreviousVisual>();private combat=new Map<string,CombatVisual>();private ambient=new AmbientPopulationRuntime();private authoritative:readonly AuthoritativeVisualEntity[]=[];private startedAt=0;private ambientTimer:number|null=null;
 async mount(renderer:IsoRenderer,host:HTMLElement,viewport:IsoViewport):Promise<void>{this.renderer=renderer;await renderer.mount(host);renderer.resize(viewport);renderer.setCamera(this.camera.snapshot());this.startedAt=performance.now();this.renderCurrent();this.ambientTimer=window.setInterval(()=>this.renderCurrent(),100);}
 updateAuthoritativeEntities(entities:readonly AuthoritativeVisualEntity[]):void{this.authoritative=entities;this.renderCurrent();}
 private renderCurrent():void{const projected=adaptAuthoritativeEntities(this.authoritative),next=sortIsoSceneFrame(buildEntitySceneFrame(projected));for(const node of next.entities){const prior=this.previous.get(node.id),dx=prior?node.x-prior.x:0,dy=prior?node.y-prior.y:0,moving=Math.hypot(dx,dy)>.35;let facing:IsoFacing=prior?.facing??'se';if(moving){if(Math.abs(dx)>=Math.abs(dy))facing=dx>=0?'se':'nw';else facing=dy>=0?'sw':'ne';}const phase=moving?((prior?.phase??0)+Math.min(.32,Math.hypot(dx,dy)*.035+.08))%1:0,combat=this.combat.get(node.id);node.motion=moving?'walk':'idle';node.facing=facing;node.animationPhase=phase;node.combatCue=combat?.cue??'none';node.combatPhase=combat?.phase??0;this.previous.set(node.id,{x:node.x,y:node.y,facing,phase});}const composed=composeAmbientPopulation(next,this.ambient,Math.max(0,performance.now()-this.startedAt),this.camera.snapshot());this.frame=composed.frame;this.renderer?.render(this.frame);}
 presentCombatCue(entityId:string,cue:Exclude<IsoCombatCue,'none'>,phase=0):boolean{if(!this.frame.entities.some(e=>e.id===entityId))return false;this.combat.set(entityId,{cue,phase:Math.max(0,Math.min(1,phase))});this.renderCurrent();return true;}
 clearCombatCue(entityId:string):void{this.combat.delete(entityId);this.renderCurrent();}
 followEntity(entityId:string):boolean{const entity=this.frame.entities.find(e=>e.id===entityId);if(!entity)return false;this.camera.follow(entity.x,entity.y);this.renderer?.setCamera(this.camera.snapshot());this.renderCurrent();return true;}
 resize(viewport:IsoViewport):void{this.renderer?.resize(viewport);}zoom(value:number):void{this.camera.setZoom(value);this.renderer?.setCamera(this.camera.snapshot());this.renderCurrent();}snapshot():Readonly<IsoSceneFrame>{return this.frame;}
 destroy():void{if(this.ambientTimer!==null)window.clearInterval(this.ambientTimer);this.ambientTimer=null;this.previous.clear();this.combat.clear();this.renderer?.destroy();this.renderer=null;}
}
