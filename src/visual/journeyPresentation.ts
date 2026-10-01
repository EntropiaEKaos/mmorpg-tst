import type { JourneyBeat } from '../world/eldoriaIronwoodJourney';
import { journeyBeatAt } from '../world/eldoriaIronwoodJourney';

export interface JourneyPresentationState {
  beat:JourneyBeat;
  roadSegmentId:string;
  title:string;
  showGate:boolean;
  showCampSmoke:boolean;
  showDenseForest:boolean;
  showEnemyPresence:boolean;
  showRiver:boolean;
  showWaterfall:boolean;
  showBridge:boolean;
  showCliffDepth:boolean;
  showIronwoodSilhouette:boolean;
  showArrivalLighting:boolean;
}

export function journeyPresentationAt(progress:number):JourneyPresentationState {
  const beat=journeyBeatAt(progress), has=(token:string)=>beat.presentation.includes(token);
  return {
    beat,
    roadSegmentId:beat.roadSegmentId,
    title:beat.title,
    showGate:has('city-gate')||has('capital-gate'),
    showCampSmoke:has('camp-smoke'),
    showDenseForest:has('dense-forest')||has('forest-canopy')||has('forest-wall'),
    showEnemyPresence:has('enemy-presence'),
    showRiver:has('river'),
    showWaterfall:has('waterfall'),
    showBridge:has('bridge'),
    showCliffDepth:has('cliff-depth'),
    showIronwoodSilhouette:has('ironwood-silhouette'),
    showArrivalLighting:has('arrival-lighting')||has('warm-city-backlight')
  };
}
