import type { IsoEntityArchetypeId } from './entityArchetypes';

export type AmbientAwarenessReaction='none'|'look'|'alert'|'avoid'|'hostile';
export type AmbientAwarenessSample={reaction:AmbientAwarenessReaction;weight:number;offsetX:number;offsetY:number};

const RADII:Record<IsoEntityArchetypeId,number>={
 'eldoria-villager':120,'eldoria-guard':175,'eldoria-merchant':105,'forest-wisp':150,'moss-boar':145,'shadow-wolf':210,
};
function reactionFor(id:IsoEntityArchetypeId):AmbientAwarenessReaction{if(id==='eldoria-guard'||id==='moss-boar')return'alert';if(id==='forest-wisp')return'avoid';if(id==='shadow-wolf')return'hostile';return'look';}
/** Presentation-only awareness. It never starts combat or mutates authoritative simulation. */
export function sampleAmbientAwareness(archetypeId:IsoEntityArchetypeId,entity:{x:number;y:number},focus:{x:number;y:number}|null):AmbientAwarenessSample{
 if(!focus)return{reaction:'none',weight:0,offsetX:0,offsetY:0};const dx=focus.x-entity.x,dy=focus.y-entity.y,d=Math.max(1,Math.hypot(dx,dy)),radius=RADII[archetypeId],weight=Math.max(0,Math.min(1,1-d/radius));if(weight<=0)return{reaction:'none',weight:0,offsetX:0,offsetY:0};const reaction=reactionFor(archetypeId),nx=dx/d,ny=dy/d,escape=reaction==='avoid'?-30*weight:reaction==='hostile'?18*weight:reaction==='alert'?-5*weight:0;return{reaction,weight,offsetX:nx*escape,offsetY:ny*escape};
}
