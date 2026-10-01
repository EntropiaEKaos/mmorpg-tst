import { Container, Graphics } from 'pixi.js';
import type { RoadVisualSegment } from '../world/moriaRoadVisuals';
import { getWorldVisualProfile } from './worldVisualProfiles';

export interface RoadJourneyVisualPack { root:Container; update:(time:number)=>void; }

export function createRoadJourneyVisuals(width:number,height:number,segment:RoadVisualSegment):RoadJourneyVisualPack {
 const root=new Container(),profile=getWorldVisualProfile(segment.profile);
 const road=new Graphics();
 road.moveTo(width*.34,height).lineTo(width*.44,height*.54).lineTo(width*.56,height*.54).lineTo(width*.72,height).closePath().fill({color:0x5b5145,alpha:.34});
 road.moveTo(width*.39,height).lineTo(width*.47,height*.55).stroke({width:2,color:profile.mote,alpha:.14});
 road.moveTo(width*.66,height).lineTo(width*.53,height*.55).stroke({width:2,color:profile.mote,alpha:.14});root.addChild(road);
 const cliff=new Graphics();if(segment.features.includes('cliff')){cliff.moveTo(0,height*.48).lineTo(width*.18,height*.34).lineTo(width*.28,height*.5).lineTo(width*.24,height).lineTo(0,height).closePath().fill({color:0x252b31,alpha:.38});cliff.moveTo(width*.04,height*.52).lineTo(width*.16,height*.4).lineTo(width*.23,height*.53).stroke({width:2,color:profile.mist,alpha:.16});root.addChild(cliff)}
 const river=new Graphics();if(segment.features.includes('river')||segment.features.includes('waterfall')){river.moveTo(width*.05,height*.76).bezierCurveTo(width*.28,height*.69,width*.52,height*.83,width*.95,height*.72).lineTo(width,height*.88).bezierCurveTo(width*.62,height*.95,width*.28,height*.83,0,height*.92).closePath().fill({color:profile.accent,alpha:.18});root.addChild(river)}
 const bridge=new Graphics();if(segment.features.includes('bridge')){bridge.roundRect(width*.35,height*.69,width*.3,18,4).fill({color:0x6f5338,alpha:.72}).stroke({width:2,color:0xd6b47c,alpha:.35});for(let i=0;i<7;i++)bridge.moveTo(width*.37+i*width*.04,height*.69).lineTo(width*.37+i*width*.04,height*.69+18).stroke({width:1,color:0x2b2118,alpha:.35});root.addChild(bridge)}
 const landmark=new Graphics();const lx=width*.76,ly=height*.35;if(segment.features.includes('watchtower')){landmark.roundRect(lx-8,ly-34,16,42,3).fill({color:0x39424b,alpha:.58});landmark.moveTo(lx-13,ly-34).lineTo(lx,ly-47).lineTo(lx+13,ly-34).closePath().fill({color:profile.accent,alpha:.48})}else if(segment.features.includes('ruin')){landmark.roundRect(lx-18,ly-20,10,28,2).fill({color:0x4b4a45,alpha:.48});landmark.roundRect(lx+5,ly-31,10,39,2).fill({color:0x4b4a45,alpha:.48});landmark.moveTo(lx-8,ly-17).lineTo(lx+5,ly-27).stroke({width:4,color:0x4b4a45,alpha:.45})}else{landmark.moveTo(lx-22,ly+8).lineTo(lx,ly-35).lineTo(lx+24,ly+8).closePath().fill({color:profile.accent,alpha:.28})}root.addChild(landmark);
 const guides=Array.from({length:14},(_,i)=>{const g=new Graphics().circle(0,0,1+i%2).fill({color:profile.mote,alpha:.2});g.x=(i*137+43)%width;g.y=height*.4+((i*73)%Math.max(1,height*.55));root.addChild(g);return g});
 return {root,update:(time:number)=>{landmark.alpha=.72+.18*Math.sin(time*.001);for(let i=0;i<guides.length;i++){const g=guides[i];g.x+=Math.sin(time*.001+i)*.04;g.y+=Math.cos(time*.0007+i)*.025;g.alpha=.1+.18*(.5+.5*Math.sin(time*.0015+i));}if(river.parent){river.alpha=.75+.12*Math.sin(time*.002);river.x=Math.sin(time*.0014)*2;}}};
}
