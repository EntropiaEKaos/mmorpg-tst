export type MoriaTravelMode='walk'|'road'|'bridge'|'mountain-pass'|'ferry'|'fast-travel';
export interface MoriaRegionNode { id:string; label:string; kind:'capital'|'town'|'wilds'|'landmark'|'pass'; visualProfile:string; status?:'approved'|'roadmap'; urbanPlan?:string; }
export interface MoriaRoute { id:string; from:string; to:string; modes:MoriaTravelMode[]; journey:string[]; seamlessGoal:boolean; }

// Mirrors the authoritative Grand Capitals checkpoint. Roadmap capitals are included
// so the continent graph can grow without inventing replacements for legacy cities.
export const MORIA_REGIONS:MoriaRegionNode[]=[
 {id:'eldoria',label:'Eldoria',kind:'capital',visualProfile:'eldoria',status:'approved',urbanPlan:'royal-grid'},
 {id:'sunreach_coast',label:'Sunreach Coast',kind:'capital',visualProfile:'coast',status:'approved',urbanPlan:'harbor-crescent'},
 {id:'ironwood',label:'Ironwood',kind:'capital',visualProfile:'forest',status:'approved',urbanPlan:'forest-rings'},
 {id:'frostpeak',label:'Frostpeak',kind:'capital',visualProfile:'snow',status:'approved',urbanPlan:'terraced-bastion'},
 {id:'shadowfen',label:'Shadowfen',kind:'capital',visualProfile:'swamp',status:'approved',urbanPlan:'marsh-wards'},
 {id:'emberhold',label:'Emberhold',kind:'capital',visualProfile:'volcanic',status:'approved',urbanPlan:'caldera-radials'},
 {id:'crystal_deep',label:'Crystal Deep',kind:'capital',visualProfile:'capital',status:'approved',urbanPlan:'geode-chambers'},
 {id:'stormwatch_isle',label:'Stormwatch Isle',kind:'capital',visualProfile:'coast',status:'approved',urbanPlan:'tempest-archipelago'},
 {id:'voidlands',label:'Grand Voidlands',kind:'capital',visualProfile:'desert',status:'roadmap'},
 {id:'nightfall_citadel',label:'Grand Nightfall Citadel',kind:'capital',visualProfile:'capital',status:'roadmap'},
 {id:'eldoria-greenway',label:'Estrada Verde de Eldoria',kind:'wilds',visualProfile:'forest'},
 {id:'sunreach-road',label:'Estrada Solar',kind:'wilds',visualProfile:'coast'},
 {id:'high-pass',label:'Passo das Alturas',kind:'pass',visualProfile:'snow'},
 {id:'ashen-road',label:'Estrada das Cinzas',kind:'wilds',visualProfile:'volcanic'},
 {id:'fen-crossing',label:'Travessia do Brejo',kind:'wilds',visualProfile:'swamp'},
 {id:'crystal-road',label:'Caminho das Geodas',kind:'wilds',visualProfile:'capital'},
 {id:'storm-coast',label:'Costa das Tempestades',kind:'wilds',visualProfile:'coast'}
];

export const MORIA_ROUTES:MoriaRoute[]=[
 {id:'eldoria-sunreach',from:'eldoria',to:'sunreach_coast',modes:['walk','road','bridge'],journey:['west-gate','sunreach-road','coastal-approach'],seamlessGoal:true},
 {id:'eldoria-ironwood',from:'eldoria',to:'ironwood',modes:['walk','road','bridge'],journey:['eldoria-greenway','river-bridge','ironwood-edge'],seamlessGoal:true},
 {id:'ironwood-frostpeak',from:'ironwood',to:'frostpeak',modes:['walk','road','mountain-pass'],journey:['pine-road','high-pass','frostpeak-edge'],seamlessGoal:true},
 {id:'eldoria-shadowfen',from:'eldoria',to:'shadowfen',modes:['walk','road','bridge'],journey:['south-road','fen-crossing','shadowfen-edge'],seamlessGoal:true},
 {id:'eldoria-emberhold',from:'eldoria',to:'emberhold',modes:['walk','road','mountain-pass'],journey:['east-road','ashen-road','emberhold-edge'],seamlessGoal:true},
 {id:'emberhold-crystal-deep',from:'emberhold',to:'crystal_deep',modes:['walk','road','mountain-pass'],journey:['caldera-gate','crystal-road','geode-mouth'],seamlessGoal:true},
 {id:'sunreach-stormwatch',from:'sunreach_coast',to:'stormwatch_isle',modes:['walk','road','ferry'],journey:['harbor-road','storm-coast','stormwatch-landing'],seamlessGoal:true},
 {id:'crystal-nightfall',from:'crystal_deep',to:'nightfall_citadel',modes:['walk','road','mountain-pass'],journey:['deep-gate','twilight-road','nightfall-edge'],seamlessGoal:true},
 {id:'emberhold-voidlands',from:'emberhold',to:'voidlands',modes:['walk','road'],journey:['ash-gate','waste-road','voidlands-edge'],seamlessGoal:true}
];

export const MORIA_OPEN_WORLD_RULES={
 preserveExistingCities:true,
 portalsBecomeFastTravel:true,
 portsRemainForSeaTravel:true,
 roadsArePlayableContent:true,
 authoritativeMapsRemainChunked:true,
 hideChunkTransitionsFromPlayer:true,
 visualElevationFirst:true,
 preserveAuthoritativeUrbanPlans:true,
 connectExistingCityGatesBeforeAddingNewCityGeometry:true
} as const;

export function routesFrom(regionId:string){return MORIA_ROUTES.filter(route=>route.from===regionId||route.to===regionId);}
export function approvedCapitals(){return MORIA_REGIONS.filter(region=>region.kind==='capital'&&region.status==='approved');}
