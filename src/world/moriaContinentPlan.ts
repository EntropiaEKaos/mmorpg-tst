export type MoriaTravelMode='walk'|'road'|'bridge'|'mountain-pass'|'ferry'|'fast-travel';
export interface MoriaRegionNode { id:string; label:string; kind:'capital'|'town'|'wilds'|'landmark'|'pass'; visualProfile:string; }
export interface MoriaRoute { id:string; from:string; to:string; modes:MoriaTravelMode[]; journey:string[]; seamlessGoal:boolean; }

export const MORIA_REGIONS:MoriaRegionNode[]=[
 {id:'eldoria',label:'Eldoria',kind:'capital',visualProfile:'eldoria'},
 {id:'ironwood',label:'Ironwood',kind:'capital',visualProfile:'forest'},
 {id:'frostpeak',label:'Frostpeak',kind:'capital',visualProfile:'snow'},
 {id:'shadowfen',label:'Shadowfen',kind:'capital',visualProfile:'swamp'},
 {id:'emberhold',label:'Emberhold',kind:'capital',visualProfile:'volcanic'},
 {id:'eldoria-greenway',label:'Estrada Verde de Eldoria',kind:'wilds',visualProfile:'forest'},
 {id:'high-pass',label:'Passo das Alturas',kind:'pass',visualProfile:'snow'},
 {id:'ashen-road',label:'Estrada das Cinzas',kind:'wilds',visualProfile:'volcanic'},
 {id:'fen-crossing',label:'Travessia do Brejo',kind:'wilds',visualProfile:'swamp'}
];

export const MORIA_ROUTES:MoriaRoute[]=[
 {id:'eldoria-ironwood',from:'eldoria',to:'ironwood',modes:['walk','road','bridge'],journey:['eldoria-greenway','river-bridge','ironwood-edge'],seamlessGoal:true},
 {id:'ironwood-frostpeak',from:'ironwood',to:'frostpeak',modes:['walk','road','mountain-pass'],journey:['pine-road','high-pass','frostpeak-edge'],seamlessGoal:true},
 {id:'eldoria-shadowfen',from:'eldoria',to:'shadowfen',modes:['walk','road','bridge'],journey:['south-road','fen-crossing','shadowfen-edge'],seamlessGoal:true},
 {id:'eldoria-emberhold',from:'eldoria',to:'emberhold',modes:['walk','road','mountain-pass'],journey:['east-road','ashen-road','emberhold-edge'],seamlessGoal:true}
];

export const MORIA_OPEN_WORLD_RULES={
 preserveExistingCities:true,
 portalsBecomeFastTravel:true,
 portsRemainForSeaTravel:true,
 roadsArePlayableContent:true,
 authoritativeMapsRemainChunked:true,
 hideChunkTransitionsFromPlayer:true,
 visualElevationFirst:true
} as const;

export function routesFrom(regionId:string){return MORIA_ROUTES.filter(route=>route.from===regionId||route.to===regionId);}
