import { objectiveKey } from './ContentIntegrity.mjs';

const MAX_ACTIVE=3;
const cleanId=value=>typeof value==='string'?value.trim().slice(0,100):'';
const rankFor=points=>points>=100?'Elite Hunter':points>=60?'Slayer':points>=30?'Ranger':points>=10?'Hunter':'Novice';

function ensure(player,contentDB){
  const known=new Set(contentDB.get('taskQuests').map(entry=>entry.id));
  const raw=player.taskState&&typeof player.taskState==='object'&&!Array.isArray(player.taskState)?player.taskState:{};
  const completed={};
  if(raw.completed&&typeof raw.completed==='object'&&!Array.isArray(raw.completed)) for(const [id,value] of Object.entries(raw.completed)) if(known.has(id)) completed[id]=Math.max(0,Math.floor(Number(value)||0));
  const active=[]; const seen=new Set();
  if(Array.isArray(raw.active)) for(const entry of raw.active){
    if(!entry||typeof entry!=='object'||!known.has(entry.taskId)||seen.has(entry.taskId)) continue;
    const def=contentDB.get('taskQuests').find(item=>item.id===entry.taskId); if(!def) continue;
    const progress=Math.max(0,Math.min(Math.max(1,Math.floor(Number(def.count)||1)),Math.floor(Number(entry.progress)||0)));
    active.push({taskId:def.id,progress,ready:progress>=Number(def.count),startedAt:Number(entry.startedAt)>0?Number(entry.startedAt):Date.now()}); seen.add(def.id); if(active.length>=MAX_ACTIVE)break;
  }
  const points=Math.max(0,Math.floor(Number(raw.points)||0));
  player.taskState={active,completed,points,rank:rankFor(points),unlockedBosses:Array.isArray(raw.unlockedBosses)?[...new Set(raw.unlockedBosses.filter(id=>typeof id==='string'))].slice(0,100):[]};
  return player.taskState;
}

function pub(def){return {id:def.id,name:def.name,npcId:def.npcId,mapId:def.mapId,target:def.target,targetName:def.targetName||def.target,count:Math.max(1,Math.floor(Number(def.count)||1)),minLevel:Math.max(1,Math.floor(Number(def.minLevel)||1)),maxLevel:Math.max(1,Math.floor(Number(def.maxLevel)||9999)),repeatLimit:Math.max(1,Math.floor(Number(def.repeatLimit)||1)),taskPoints:Math.max(0,Math.floor(Number(def.taskPoints)||0)),rewardGold:Math.max(0,Math.floor(Number(def.rewardGold)||0)),rewardXp:Math.max(0,Math.floor(Number(def.rewardXp)||0)),bossUnlock:def.bossUnlock||'',description:def.description||''};}

class TibiaTaskEngine{
  initializePlayer(player,contentDB){player.taskState=null;return ensure(player,contentDB);}
  restorePlayer(player,saved,contentDB){player.taskState=saved&&typeof saved==='object'?saved:null;return ensure(player,contentDB);}
  exportState(player,contentDB){const s=ensure(player,contentDB);return {active:s.active.map(v=>({...v})),completed:{...s.completed},points:s.points,unlockedBosses:[...s.unlockedBosses]};}
  snapshot(player,contentDB){const s=ensure(player,contentDB);const defs=contentDB.get('taskQuests').map(pub);return {points:s.points,rank:s.rank,maxActive:MAX_ACTIVE,completed:{...s.completed},unlockedBosses:[...s.unlockedBosses],active:s.active.map(entry=>{const def=defs.find(d=>d.id===entry.taskId);return def?{...def,progress:entry.progress,ready:entry.ready,startedAt:entry.startedAt}:null;}).filter(Boolean),catalog:defs.map(def=>({...def,completedCount:s.completed[def.id]||0,locked:player.level<def.minLevel||player.level>def.maxLevel}))};}

  accept(player,taskId,contentDB,isNearNpc){const s=ensure(player,contentDB);const def=contentDB.get('taskQuests').find(entry=>entry.id===cleanId(taskId));if(!def)return{ok:false,error:'Unknown task.'};const d=pub(def);if(s.active.length>=MAX_ACTIVE)return{ok:false,error:`You can track at most ${MAX_ACTIVE} tasks.`};if(s.active.some(entry=>entry.taskId===d.id))return{ok:false,error:'Task already active.'};if(player.level<d.minLevel||player.level>d.maxLevel)return{ok:false,error:`Task requires level ${d.minLevel}-${d.maxLevel}.`};if((s.completed[d.id]||0)>=d.repeatLimit)return{ok:false,error:'Task repeat limit reached.'};if(typeof isNearNpc==='function'&&!isNearNpc(d.npcId))return{ok:false,error:'Report to the task master to accept this task.'};s.active.push({taskId:d.id,progress:0,ready:false,startedAt:Date.now()});return{ok:true,action:'accept',task:d};}
  abandon(player,taskId,contentDB){const s=ensure(player,contentDB);const id=cleanId(taskId);const index=s.active.findIndex(entry=>entry.taskId===id);if(index<0)return{ok:false,error:'Task is not active.'};s.active.splice(index,1);return{ok:true,action:'abandon',taskId:id};}
  claim(player,taskId,contentDB,isNearNpc){const s=ensure(player,contentDB);const id=cleanId(taskId);const index=s.active.findIndex(entry=>entry.taskId===id);if(index<0)return{ok:false,error:'Task is not active.'};const def=contentDB.get('taskQuests').find(entry=>entry.id===id);if(!def)return{ok:false,error:'Task definition no longer exists.'};const d=pub(def),active=s.active[index];if(!active.ready||active.progress<d.count)return{ok:false,error:'Task is not complete.'};if(typeof isNearNpc==='function'&&!isNearNpc(d.npcId))return{ok:false,error:'Return to the task master for your reward.'};s.active.splice(index,1);s.completed[id]=(s.completed[id]||0)+1;s.points+=d.taskPoints;s.rank=rankFor(s.points);if(d.bossUnlock&&!s.unlockedBosses.includes(d.bossUnlock))s.unlockedBosses.push(d.bossUnlock);return{ok:true,action:'claim',task:d,reward:{gold:d.rewardGold,xp:d.rewardXp,points:d.taskPoints},rank:s.rank};}
  handle(player,payload,contentDB,isNearNpc){const action=cleanId(payload?.action);if(action==='accept')return this.accept(player,payload?.taskId,contentDB,isNearNpc);if(action==='abandon')return this.abandon(player,payload?.taskId,contentDB);if(action==='claim')return this.claim(player,payload?.taskId,contentDB,isNearNpc);return{ok:false,error:'Unknown task action.'};}
  onMonsterKill(player,monster,contentDB){const s=ensure(player,contentDB);const killed=new Set([monster?.name,monster?.contentSourceId,monster?.templateId].map(objectiveKey).filter(Boolean));const updates=[];for(const active of s.active){if(active.ready)continue;const def=contentDB.get('taskQuests').find(entry=>entry.id===active.taskId);if(!def||def.mapId!==player.mapId)continue;const wanted=objectiveKey(def.target);if(!killed.has(wanted)&&objectiveKey(monster?.name)!==wanted)continue;active.progress=Math.min(Math.max(1,Number(def.count)||1),active.progress+1);active.ready=active.progress>=Number(def.count);updates.push({taskId:def.id,name:def.name,current:active.progress,needed:Number(def.count),ready:active.ready});}return updates;}
}

export const tibiaTaskEngine=new TibiaTaskEngine();
export { TibiaTaskEngine, MAX_ACTIVE, rankFor };
