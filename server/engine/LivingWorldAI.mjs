// MOR'IA 9.8 — authoritative living-world AI policy.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const DIRS=Object.freeze([{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}]);
const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
function seededChoice(id,tick,list){return list[(hash(id)+tick)%list.length]}
function normalizePoint(p,fallback={x:40,y:40}){return {x:Math.floor(Number(p?.x)||fallback.x),y:Math.floor(Number(p?.y)||fallback.y)}}
function hourOf(snapshot){return Number.isFinite(Number(snapshot?.hour))?Number(snapshot.hour):new Date().getUTCHours()}
function isOpen(npc,hour){const open=clamp(npc?.openHour??0,0,23), close=clamp(npc?.closeHour??24,1,24);return open<close?hour>=open&&hour<close:hour>=open||hour<close}
function walkable(map,x,y,occupied=new Set()){return Boolean(map?.tiles?.[y]?.[x]?.walkable&&!occupied.has(`${x},${y}`))}
function stepToward(from,to,map,occupied){const dx=Math.sign(to.x-from.x),dy=Math.sign(to.y-from.y);const primary=Math.abs(to.x-from.x)>=Math.abs(to.y-from.y)?[{x:dx,y:0},{x:0,y:dy}]:[{x:0,y:dy},{x:dx,y:0}];for(const d of primary){if((d.x||d.y)&&walkable(map,from.x+d.x,from.y+d.y,occupied))return {x:from.x+d.x,y:from.y+d.y}}return from}
function stepAway(from,threat,map,occupied){const choices=DIRS.map(d=>({x:from.x+d.x,y:from.y+d.y})).filter(p=>walkable(map,p.x,p.y,occupied)).sort((a,b)=>dist(b,threat)-dist(a,threat));return choices[0]||from}

class LivingWorldAI {
  constructor(){this.npcState=new Map();this.lastNpcTick=0}
  sync(contentDB){
    const seen=new Set();
    for(const npc of contentDB?.get?.('npcs')||[]){if(!npc?.id)continue;seen.add(npc.id);const prev=this.npcState.get(npc.id);const home={x:Number(npc.posX)||40,y:Number(npc.posY)||40};this.npcState.set(npc.id,{id:npc.id,mapId:npc.mapId,x:prev?.x??home.x,y:prev?.y??home.y,home,mode:prev?.mode||'idle',routeIndex:prev?.routeIndex||0,open:true,lastMove:prev?.lastMove||0})}
    for(const id of this.npcState.keys())if(!seen.has(id))this.npcState.delete(id);
  }
  routineFor(npc,clock){const h=hourOf(clock);const open=isOpen(npc,h);const schedule=Array.isArray(npc.schedule)?npc.schedule:[];const scheduled=schedule.find(s=>h>=Number(s.startHour??0)&&h<Number(s.endHour??24));const defaultMode=npc.aiMode||(npc.role==='guard'?'patrol':'idle');return {open,mode:scheduled?.mode||(!open?'home':defaultMode),target:scheduled?.target||null}}
  tickNpcs({contentDB,world,clock,players=[],monstersByMap=new Map(),now=Date.now()}){
    if(now-this.lastNpcTick<350)return;this.lastNpcTick=now;this.sync(contentDB);
    const npcDefs=new Map((contentDB.get('npcs')||[]).map(n=>[n.id,n]));
    for(const state of this.npcState.values()){
      const npc=npcDefs.get(state.id);const map=world.getMap(state.mapId);if(!npc||!map)continue;const r=this.routineFor(npc,clock);state.open=r.open;state.mode=r.mode;
      const delay=clamp(npc.moveDelay??1100,250,10000);if(now-state.lastMove<delay)continue;
      const occupied=new Set();for(const p of players)if(p.mapId===state.mapId)occupied.add(`${p.x},${p.y}`);for(const m of monstersByMap.get(state.mapId)||[])if(!m.dead)occupied.add(`${m.x},${m.y}`);
      let next={x:state.x,y:state.y};
      if(npc.role==='guard'){
        const threat=(monstersByMap.get(state.mapId)||[]).filter(m=>!m.dead&&dist(state,m)<=clamp(npc.guardRadius??7,2,16)).sort((a,b)=>dist(state,a)-dist(state,b))[0];if(threat){state.mode='guard';next=stepToward(state,threat,map,occupied)}
      }
      if(next.x===state.x&&next.y===state.y){
        const route=Array.isArray(npc.patrolRoute)?npc.patrolRoute:[];
        if((state.mode==='patrol'||state.mode==='work')&&route.length){const target=normalizePoint(route[state.routeIndex%route.length],state.home);if(dist(state,target)===0)state.routeIndex=(state.routeIndex+1)%route.length;next=stepToward(state,target,map,occupied)}
        else if(state.mode==='home'&&!r.open)next=stepToward(state,state.home,map,occupied);
        else if(state.mode==='wander'){const d=seededChoice(state.id,Math.floor(now/delay),DIRS),p={x:state.x+d.x,y:state.y+d.y};if(walkable(map,p.x,p.y,occupied)&&dist(p,state.home)<=clamp(npc.wanderRadius??4,1,10))next=p}
      }
      if(walkable(map,next.x,next.y,occupied)){state.x=next.x;state.y=next.y}state.lastMove=now;
    }
  }
  publicNpcs(mapId,contentDB){const defs=new Map((contentDB.get('npcs')||[]).map(n=>[n.id,n]));return [...this.npcState.values()].filter(s=>s.mapId===mapId).map(s=>{const n=defs.get(s.id)||{};return {id:s.id,name:n.name,emoji:n.emoji,color:n.color,role:n.role,x:s.x,y:s.y,mode:s.mode,open:s.open}})}
  decideMonsterMove(monster,target,{map,occupied=new Set(),now=Date.now(),allies=[]}={}){
    const home={x:Number(monster.spawnX)||monster.x,y:Number(monster.spawnY)||monster.y};const leash=clamp(monster.leashRadius??12,4,30);const aggro=clamp(monster.aggroRadius??8,2,20);const d=target?dist(monster,target):Infinity;
    if(dist(monster,home)>leash)return {...stepToward(monster,home,map,occupied),mode:'return'};
    const hpRatio=(Number(monster.hp)||0)/Math.max(1,Number(monster.maxHp)||1);const archetype=monster.aiArchetype||monster.type||'normal';
    if(target&&hpRatio<=clamp(monster.fleeAtHp??(archetype==='normal'?0.12:0),0,0.8))return {...stepAway(monster,target,map,occupied),mode:'flee'};
    if(target&&d<=aggro){if(archetype==='pack'||monster.packId){const friend=allies.filter(a=>a.id!==monster.id&&!a.dead&&(a.packId===monster.packId||a.name===monster.name)).sort((a,b)=>dist(a,target)-dist(b,target))[0];if(friend&&dist(friend,target)>d+2)return {...stepToward(monster,friend,map,occupied),mode:'pack'}}return {...stepToward(monster,target,map,occupied),mode:'chase'}}
    const radius=clamp(monster.patrolRadius??3,0,8);if(radius>0){const d0=seededChoice(monster.id,Math.floor(now/Math.max(400,monster.speed||900)),DIRS),p={x:monster.x+d0.x,y:monster.y+d0.y};if(walkable(map,p.x,p.y,occupied)&&dist(p,home)<=radius)return {...p,mode:'patrol'}}return {x:monster.x,y:monster.y,mode:'idle'};
  }
  phase(monster){if(monster.type!=='boss')return 0;const ratio=(Number(monster.hp)||0)/Math.max(1,Number(monster.maxHp)||1);return ratio<=.25?3:ratio<=.5?2:ratio<=.75?1:0}
}
export const livingWorldAI=new LivingWorldAI();
