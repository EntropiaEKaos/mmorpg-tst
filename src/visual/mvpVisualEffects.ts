import { Container, Graphics } from 'pixi.js';
import type { WorldVisualProfile } from './worldVisualProfiles';

export interface MvpVisualPack { water:Container; cityLights:Container; foliage:Container; update:(time:number,daylight:number)=>void; }

export function createMvpVisualPack(width:number,height:number,profile:WorldVisualProfile):MvpVisualPack {
 const water=new Container(),cityLights=new Container(),foliage=new Container();
 const waterBands=Array.from({length:7},(_,i)=>{const g=new Graphics().roundRect(0,0,width*.34,5+i%2,4).fill({color:profile.accent,alpha:.035+profile.water*.035});g.x=width*(.03+(i%3)*.31);g.y=height*(.72+(i%3)*.055);water.addChild(g);return g});
 const glints=Array.from({length:18},(_,i)=>{const g=new Graphics().moveTo(-7,0).lineTo(7,0).stroke({width:1,color:0xe9fbff,alpha:.18+profile.water*.18});g.x=(i*113)%width;g.y=height*.72+((i*37)%Math.max(1,height*.22));water.addChild(g);return g});
 const windows=Array.from({length:22},(_,i)=>{const g=new Graphics().roundRect(-2,-3,4,6,1).fill({color:profile.warmWindows,alpha:.4});g.x=(i*149+61)%width;g.y=height*.22+((i*83)%Math.max(1,height*.42));cityLights.addChild(g);return g});
 const leaves=Array.from({length:20},(_,i)=>{const g=new Graphics().ellipse(0,0,3,1.4).fill({color:profile.mote,alpha:.14+profile.foliage*.12});g.x=(i*173)%width;g.y=(i*67)%height;foliage.addChild(g);return g});
 return {water,cityLights,foliage,update:(time,daylight)=>{water.visible=profile.water>.05;water.alpha=.45+profile.water*.5;for(let i=0;i<waterBands.length;i++){const g=waterBands[i];g.x=(width*(.03+(i%3)*.31)+Math.sin(time*.0011+i)*10)%width;g.scale.x=.88+.12*Math.sin(time*.0017+i)}for(let i=0;i<glints.length;i++){const g=glints[i];g.x=(g.x+.12+i%3*.025)%width;g.alpha=(.08+.25*(.5+.5*Math.sin(time*.003+i)))*profile.water}cityLights.alpha=Math.max(.08,1-daylight)*.92;for(let i=0;i<windows.length;i++)windows[i].alpha=.22+.38*(.5+.5*Math.sin(time*.0015+i*1.9));foliage.visible=profile.foliage>.05;for(let i=0;i<leaves.length;i++){const g=leaves[i];g.x+=Math.sin(time*.001+i)*.09;g.y+=.05+profile.foliage*.035;if(g.y>height+5)g.y=-5;g.rotation=Math.sin(time*.0014+i)*.7}}};
}
