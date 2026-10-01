import { MORIA_ROAD_SEGMENTS } from './moriaRoadVisuals';

export interface JourneyBeat { id:string; title:string; roadSegmentId:string; progress:number; presentation:string[]; }

export const ELDORIA_IRONWOOD_JOURNEY:JourneyBeat[]=[
 {id:'eldoria-west-gate',title:'Portão de Eldoria',roadSegmentId:'greenway-01',progress:0,presentation:['city-gate','distant-forest','road-sign','warm-city-backlight']},
 {id:'first-walker-stone',title:'Pedra do Primeiro Caminhante',roadSegmentId:'greenway-01',progress:.28,presentation:['landmark','crossroads','camp-smoke','forest-canopy']},
 {id:'greenway-deep',title:'Estrada Verde',roadSegmentId:'greenway-01',progress:.48,presentation:['dense-forest','road-depth','wildlife-motes','enemy-presence']},
 {id:'two-falls-approach',title:'Ponte das Duas Quedas',roadSegmentId:'greenway-02',progress:.68,presentation:['river','waterfall','bridge','cliff-depth']},
 {id:'ironwood-edge',title:'Fronteira de Ironwood',roadSegmentId:'greenway-02',progress:.88,presentation:['forest-wall','watch-lights','ironwood-silhouette','road-rise']},
 {id:'ironwood-gate',title:'Portões de Ironwood',roadSegmentId:'greenway-02',progress:1,presentation:['capital-gate','forest-rings','arrival-lighting','city-activity']}
];

export function journeyBeatAt(progress:number){const p=Math.max(0,Math.min(1,progress));return [...ELDORIA_IRONWOOD_JOURNEY].reverse().find(beat=>p>=beat.progress)||ELDORIA_IRONWOOD_JOURNEY[0];}
export function validateJourneySegments(){const known=new Set(MORIA_ROAD_SEGMENTS.map(s=>s.id));return ELDORIA_IRONWOOD_JOURNEY.every(beat=>known.has(beat.roadSegmentId));}
