import type { IsoSceneNode } from './sceneModel';

export type InteractionKind='talk'|'trade'|'inspect'|'hostile';
export type InteractionCandidate={entityId:string;visualId:string;kind:InteractionKind;label:string;distance:number;priority:number};
export type InteractionState={candidate:InteractionCandidate|null;inRange:boolean};

const INTERACTION_RANGE=112;
const META:Record<string,{kind:InteractionKind;label:string;priority:number}>={
 'npc-villager':{kind:'talk',label:'Conversar',priority:30},
 'npc-guard':{kind:'talk',label:'Falar com Guarda',priority:40},
 'npc-merchant':{kind:'trade',label:'Negociar',priority:60},
 'forest-wisp':{kind:'inspect',label:'Observar Wisp',priority:10},
 'moss-boar':{kind:'inspect',label:'Observar criatura',priority:5},
 'shadow-wolf':{kind:'hostile',label:'Criatura hostil',priority:1},
};

/** Selects presentation candidates only. Interaction authority remains on the server. */
export function selectInteractionCandidate(focus:Pick<IsoSceneNode,'id'|'x'|'y'>|null,entities:readonly IsoSceneNode[]):InteractionState{
 if(!focus)return{candidate:null,inRange:false};let best:InteractionCandidate|null=null;
 for(const entity of entities){if(entity.id===focus.id||!entity.visualId)continue;const meta=META[entity.visualId];if(!meta)continue;const distance=Math.hypot(entity.x-focus.x,entity.y-focus.y);if(distance>INTERACTION_RANGE)continue;const candidate={entityId:entity.id,visualId:entity.visualId,kind:meta.kind,label:meta.label,distance,priority:meta.priority};if(!best||candidate.priority>best.priority||(candidate.priority===best.priority&&candidate.distance<best.distance))best=candidate;}
 return{candidate:best,inRange:best!==null};
}

export type InteractionRequest={targetEntityId:string;kind:InteractionKind};
export function buildInteractionRequest(state:InteractionState):InteractionRequest|null{return state.candidate?{targetEntityId:state.candidate.entityId,kind:state.candidate.kind}:null;}
