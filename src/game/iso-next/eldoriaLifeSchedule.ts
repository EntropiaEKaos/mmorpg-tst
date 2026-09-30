import type { IsoEntityArchetypeId, IsoAmbientBehavior } from './entityArchetypes';

export type EldoriaPointOfInterestId='market'|'fountain'|'guard-post'|'homes'|'grove'|'wild-edge';
export type EldoriaPointOfInterest={id:EldoriaPointOfInterestId;x:number;y:number;radius:number;roles:readonly IsoEntityArchetypeId[]};
export type EldoriaLifeSchedule={archetypeId:IsoEntityArchetypeId;home:EldoriaPointOfInterestId;day:EldoriaPointOfInterestId;night:EldoriaPointOfInterestId;dayBehavior:IsoAmbientBehavior;nightBehavior:IsoAmbientBehavior};

export const ELDORIA_POINTS_OF_INTEREST:readonly EldoriaPointOfInterest[]=[
 {id:'fountain',x:0,y:360,radius:90,roles:['eldoria-villager','eldoria-guard']},
 {id:'market',x:145,y:330,radius:100,roles:['eldoria-merchant','eldoria-villager','eldoria-guard']},
 {id:'guard-post',x:-145,y:330,radius:75,roles:['eldoria-guard']},
 {id:'homes',x:-55,y:485,radius:125,roles:['eldoria-villager','eldoria-merchant']},
 {id:'grove',x:-330,y:390,radius:220,roles:['forest-wisp','moss-boar']},
 {id:'wild-edge',x:350,y:330,radius:250,roles:['moss-boar','shadow-wolf']},
];

export const ELDORIA_LIFE_SCHEDULES:readonly EldoriaLifeSchedule[]=[
 {archetypeId:'eldoria-villager',home:'homes',day:'fountain',night:'homes',dayBehavior:'wander',nightBehavior:'idle'},
 {archetypeId:'eldoria-guard',home:'guard-post',day:'market',night:'guard-post',dayBehavior:'patrol',nightBehavior:'watch'},
 {archetypeId:'eldoria-merchant',home:'homes',day:'market',night:'homes',dayBehavior:'idle',nightBehavior:'idle'},
 {archetypeId:'forest-wisp',home:'grove',day:'grove',night:'grove',dayBehavior:'hover',nightBehavior:'hover'},
 {archetypeId:'moss-boar',home:'grove',day:'grove',night:'wild-edge',dayBehavior:'graze',nightBehavior:'wander'},
 {archetypeId:'shadow-wolf',home:'wild-edge',day:'wild-edge',night:'wild-edge',dayBehavior:'watch',nightBehavior:'wander'},
];

export function eldoriaDayFactor(elapsedMs:number):number{return((elapsedMs/1000)/180)%1;}
export function isEldoriaNight(elapsedMs:number):boolean{const d=eldoriaDayFactor(elapsedMs);return d<.18||d>.78;}
export function pointOfInterest(id:EldoriaPointOfInterestId):EldoriaPointOfInterest{return ELDORIA_POINTS_OF_INTEREST.find(p=>p.id===id)!;}
export function lifeSchedule(archetypeId:IsoEntityArchetypeId):EldoriaLifeSchedule|undefined{return ELDORIA_LIFE_SCHEDULES.find(s=>s.archetypeId===archetypeId);}
