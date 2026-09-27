import type { IsoVisualEntity } from './worldAdapter';
import type { AmbientPopulationRuntime } from './ambientPopulationRuntime';

export const ISO_LAYER_ORDER = ['terrain', 'structures', 'entities', 'foreground', 'lighting', 'fx'] as const;
export type IsoLayerName = (typeof ISO_LAYER_ORDER)[number];
export type IsoMotionState = 'idle' | 'walk';
export type IsoFacing = 'nw' | 'ne' | 'sw' | 'se';
export type IsoCombatCue = 'none' | 'windup' | 'attack' | 'hit' | 'cast';
export type IsoSceneNode = {id:string;layer:IsoLayerName;depth:number;x:number;y:number;visualId?:string;opacity?:number;motion?:IsoMotionState;facing?:IsoFacing;animationPhase?:number;combatCue?:IsoCombatCue;combatPhase?:number;};
export type IsoSceneFrame = Record<IsoLayerName,IsoSceneNode[]>;
export function createEmptyIsoSceneFrame():IsoSceneFrame{return{terrain:[],structures:[],entities:[],foreground:[],lighting:[],fx:[]};}
export function buildEntitySceneFrame(entities:readonly IsoVisualEntity[]):IsoSceneFrame{const frame=createEmptyIsoSceneFrame();frame.entities=entities.map(entity=>({id:entity.id,layer:'entities',depth:entity.screen.depth,x:entity.screen.x,y:entity.screen.y,visualId:entity.visualId,motion:'idle',facing:'se',animationPhase:0,combatCue:'none',combatPhase:0}));return frame;}
/** Adds presentation-only ambient population without mutating authoritative world entities. */
export function composeAmbientPopulation(frame:IsoSceneFrame,runtime:AmbientPopulationRuntime,elapsedMs:number,camera:{x:number;y:number},renderDistance=760,focus:{x:number;y:number}|null=null):{frame:IsoSceneFrame;active:number;culled:number}{const sampled=runtime.sample(elapsedMs,camera,renderDistance,focus);frame.entities.push(...sampled.entities);sortIsoSceneFrame(frame);return{frame,active:sampled.active,culled:sampled.culled};}
export function sortIsoSceneFrame(frame:IsoSceneFrame):IsoSceneFrame{for(const layer of ISO_LAYER_ORDER)frame[layer].sort((a,b)=>a.depth-b.depth||a.id.localeCompare(b.id));return frame;}
