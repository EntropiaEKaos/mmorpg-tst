// MOR'IA 9.8 — deterministic world-event scheduler/director.
export const EVENT_98_TYPES=Object.freeze(['invasion','world_boss','caravan','city_defense','weather','region','hunt','boss','defense']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
export class WorldEventDirector{
 constructor(){this.active=new Map();this.lastActivation=new Map()}
 candidates(contentDB){const current=contentDB?.get?.('worldEvents')||[];const legacy=contentDB?.get?.('events')||[];const source=current.length?current:legacy;return source.filter(e=>e&&EVENT_98_TYPES.includes(String(e.type||'hunt')))}
 shouldStart(event,now,clock){if(event.enabled===false)return false;const every=clamp(event.repeatEveryMs??0,0,7*24*3600e3);const last=this.lastActivation.get(event.id)||0;if(every&&now-last<every)return false;const hour=Number(clock?.hour);if(Number.isFinite(Number(event.startHour))&&Number.isFinite(hour)&&hour!==Number(event.startHour))return false;return Boolean(event.autoStart)||Boolean(every&&now-last>=every)}
 start(event,now=Date.now()){const duration=clamp(event.durationMs??600000,10000,6*3600e3);const state={id:event.id,name:event.name,type:event.type||'hunt',mapId:event.mapId||null,startedAt:now,endsAt:now+duration,phase:0,progress:0,needed:Math.max(1,Math.floor(Number(event.count)||1)),target:event.target||null,rewardGold:Math.max(0,Math.floor(Number(event.rewardGold)||0)),rewardXp:Math.max(0,Math.floor(Number(event.rewardXp)||0)),rewardCoins:Math.max(0,Math.floor(Number(event.rewardCoins)||0)),weather:event.weather||null,route:Array.isArray(event.route)?event.route:[],bossId:event.bossId||null};this.active.set(state.id,state);this.lastActivation.set(state.id,now);return state}
 stop(id){return this.active.delete(id)}
 tick({contentDB,clock,now=Date.now()}={}){for(const [id,state] of this.active)if(now>=state.endsAt)this.active.delete(id);for(const event of this.candidates(contentDB)){if(!this.active.has(event.id)&&this.shouldStart(event,now,clock))this.start(event,now)}for(const state of this.active.values()){const ratio=(now-state.startedAt)/Math.max(1,state.endsAt-state.startedAt);state.phase=Math.min(3,Math.floor(ratio*4))}return this.snapshot()}
 recordKill(mapId,monster){const updates=[];for(const state of this.active.values()){if(state.mapId&&state.mapId!==mapId)continue;if(state.target&&state.target!==monster?.name&&state.target!==monster?.contentId)continue;state.progress=Math.min(state.needed,state.progress+1);updates.push({...state,complete:state.progress>=state.needed})}return updates}
 snapshot(mapId=null){return [...this.active.values()].filter(e=>!mapId||!e.mapId||e.mapId===mapId).map(e=>({...e,route:e.route.map(p=>({...p}))}))}
}
export const worldEventDirector=new WorldEventDirector();
