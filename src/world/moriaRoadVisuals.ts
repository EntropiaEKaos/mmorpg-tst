import type { WorldVisualProfileId } from '../visual/worldVisualProfiles';

export type RoadFeature='bridge'|'river'|'village'|'ruin'|'camp'|'cave'|'cliff'|'valley'|'forest'|'waterfall'|'watchtower'|'crossroads';
export interface RoadVisualSegment { id:string; routeId:string; profile:WorldVisualProfileId; width:number; elevation:number; features:RoadFeature[]; landmark:string; encounterDensity:number; }

export const MORIA_ROAD_SEGMENTS:RoadVisualSegment[]=[
 {id:'greenway-01',routeId:'eldoria-ironwood',profile:'forest',width:1,elevation:.16,features:['forest','crossroads','camp'],landmark:'Pedra do Primeiro Caminhante',encounterDensity:.35},
 {id:'greenway-02',routeId:'eldoria-ironwood',profile:'forest',width:.9,elevation:.28,features:['river','bridge','waterfall'],landmark:'Ponte das Duas Quedas',encounterDensity:.42},
 {id:'pine-pass-01',routeId:'ironwood-frostpeak',profile:'snow',width:.72,elevation:.62,features:['forest','cliff','cave'],landmark:'Portão de Pedra do Norte',encounterDensity:.55},
 {id:'high-pass-01',routeId:'ironwood-frostpeak',profile:'snow',width:.58,elevation:.88,features:['cliff','valley','watchtower'],landmark:'Mirante das Nuvens',encounterDensity:.62},
 {id:'fen-road-01',routeId:'eldoria-shadowfen',profile:'swamp',width:.78,elevation:.08,features:['river','bridge','ruin'],landmark:'Santuário Afundado',encounterDensity:.58},
 {id:'ashen-01',routeId:'eldoria-emberhold',profile:'volcanic',width:.82,elevation:.46,features:['cliff','ruin','camp'],landmark:'Arco das Cinzas',encounterDensity:.64},
 {id:'crystal-road-01',routeId:'emberhold-crystal-deep',profile:'crystal',width:.68,elevation:.7,features:['cave','cliff','ruin'],landmark:'Galeria dos Ecos Prismáticos',encounterDensity:.6},
 {id:'storm-coast-01',routeId:'sunreach-stormwatch',profile:'storm',width:.88,elevation:.22,features:['river','bridge','watchtower'],landmark:'Farol da Última Costa',encounterDensity:.5}
];

export const ROAD_PRESENTATION_RULES={
 roadsAreExplorationSpace:true,
 noEmptyLoadingCorridors:true,
 distantLandmarksGuideTravel:true,
 visualElevationDoesNotChangeCollision:true,
 preserveLegacyGateCoordinates:true,
 transitionChunksWithoutPortalFantasy:true,
 minimumLandmarkPerSegment:1
} as const;

export function roadSegmentsFor(routeId:string){return MORIA_ROAD_SEGMENTS.filter(segment=>segment.routeId===routeId);}
