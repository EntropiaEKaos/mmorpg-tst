export type ElevationLandform='flat'|'hill'|'ridge'|'mountain'|'cliff';
export interface VisualElevationSample { x:number; y:number; elevation:number; landform:ElevationLandform; }
export interface VisualElevationStyle { lift:number; shadow:number; parallax:number; contourAlpha:number; }
export function elevationStyle(elevation:number):VisualElevationStyle { const e=Math.max(0,Math.min(1,elevation)); return {lift:e*22,shadow:.12+e*.3,parallax:e*.16,contourAlpha:.06+e*.18}; }
export function inferLandform(elevation:number):ElevationLandform { if(elevation>.82)return'mountain';if(elevation>.62)return'cliff';if(elevation>.42)return'ridge';if(elevation>.18)return'hill';return'flat'; }
export function visualElevationAt(x:number,y:number,seed=17):VisualElevationSample { const a=Math.sin((x+seed*11)*.008),b=Math.cos((y-seed*7)*.011),c=Math.sin((x+y+seed*19)*.004);const raw=(a*.42+b*.34+c*.24+1)/2;const elevation=Math.max(0,Math.min(1,raw));return{x,y,elevation,landform:inferLandform(elevation)}; }
// Presentation only. Never feed these values into movement, collision, combat, pathfinding or server state.
