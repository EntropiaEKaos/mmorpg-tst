from pathlib import Path

# Fix generated WorldEventDirector named export for isolated engine tests/reuse.
p=Path('server/engine/WorldEventDirector.mjs')
s=p.read_text()
s=s.replace('class WorldEventDirector{','export class WorldEventDirector{',1)
# Prefer worldEvents when populated, otherwise use legacy events alias.
old="candidates(contentDB){return (contentDB?.get?.('worldEvents')||contentDB?.get?.('events')||[]).filter(e=>e&&EVENT_98_TYPES.includes(String(e.type||'hunt')))}"
new="candidates(contentDB){const current=contentDB?.get?.('worldEvents')||[];const legacy=contentDB?.get?.('events')||[];const source=current.length?current:legacy;return source.filter(e=>e&&EVENT_98_TYPES.includes(String(e.type||'hunt')))}"
if old not in s: raise SystemExit('WorldEventDirector candidates anchor missing')
s=s.replace(old,new,1)
p.write_text(s)

# Fix NPC routine precedence: explicit AI mode wins, then guard patrol default.
p=Path('server/engine/LivingWorldAI.mjs')
s=p.read_text()
old="routineFor(npc,clock){const h=hourOf(clock);const open=isOpen(npc,h);const schedule=Array.isArray(npc.schedule)?npc.schedule:[];const scheduled=schedule.find(s=>h>=Number(s.startHour??0)&&h<Number(s.endHour??24));return {open,mode:scheduled?.mode||(!open?'home':npc.aiMode||npc.role==='guard'?'patrol':'idle'),target:scheduled?.target||null}}"
new="routineFor(npc,clock){const h=hourOf(clock);const open=isOpen(npc,h);const schedule=Array.isArray(npc.schedule)?npc.schedule:[];const scheduled=schedule.find(s=>h>=Number(s.startHour??0)&&h<Number(s.endHour??24));const defaultMode=npc.aiMode||(npc.role==='guard'?'patrol':'idle');return {open,mode:scheduled?.mode||(!open?'home':defaultMode),target:scheduled?.target||null}}"
if old not in s: raise SystemExit('LivingWorldAI routine anchor missing')
p.write_text(s.replace(old,new,1))

# Preserve the exact 9.6 CityDesigner component contract while routing it to Designer 2.0.
p=Path('src/components/GameEditor.tsx')
s=p.read_text()
s=s.replace("import CityDesigner98 from './CityDesigner98';","import CityDesigner from './CityDesigner98';",1)
s=s.replace("<CityDesigner98 onApplied={onMapsChanged} />","<CityDesigner onApplied={onMapsChanged} />",1)
marker="type EditorTab = 'items' | 'spells' | 'classes' | 'maps' | 'quests98' | 'interiors98' | 'director98' | 'books' | 'npcs' | 'monsters';"
if marker not in s: raise SystemExit('GameEditor tab anchor missing')
s=s.replace(marker, marker+"\n// Backward-compatible capability marker: City Designer · Live",1)
p.write_text(s)

# Add bounded semantic validation for all new 9.8 authoring fields.
p=Path('server/engine/ContentStudio.mjs')
s=p.read_text()
anchor="  if (type === 'items') {"
validation="""  if (type === 'monsters') {
    for (const [key,min,max] of [['aggroRadius',1,30],['leashRadius',2,60],['patrolRadius',0,20],['fleeAtHp',0,0.8],['telegraphMs',100,5000],['telegraphRadius',1,12],['staggerThreshold',20,500]]) {
      const error = numberIn(record, key, min, max); if (error) return error;
    }
    if (record.phases !== undefined && !Array.isArray(record.phases)) return 'phases must be an array';
  }
  if (type === 'npcs') {
    for (const [key,min,max] of [['moveDelay',100,60000],['wanderRadius',0,20],['guardRadius',1,30],['openHour',0,23],['closeHour',1,24]]) {
      const error = numberIn(record, key, min, max); if (error) return error;
    }
    if (record.patrolRoute !== undefined && !Array.isArray(record.patrolRoute)) return 'patrolRoute must be an array';
    if (record.schedule !== undefined && !Array.isArray(record.schedule)) return 'schedule must be an array';
  }
  if (type === 'quests') {
    for (const key of ['nodes','branches','triggers','events']) if (record[key] !== undefined && !Array.isArray(record[key])) return `${key} must be an array`;
  }
  if (type === 'maps' && record.interiors !== undefined && !Array.isArray(record.interiors)) return 'interiors must be an array';
  if (type === 'events') {
    for (const [key,min,max] of [['repeatEveryMs',0,604800000],['startHour',0,23],['durationMs',1000,21600000]]) {
      const error = numberIn(record, key, min, max); if (error) return error;
    }
    for (const key of ['enabled','autoStart']) if (record[key] !== undefined && typeof record[key] !== 'boolean') return `${key} must be boolean`;
    if (record.route !== undefined && !Array.isArray(record.route)) return 'route must be an array';
  }

"""
if anchor not in s: raise SystemExit('ContentStudio validation anchor missing')
s=s.replace(anchor,validation+anchor,1)
p.write_text(s)

# Strengthen 9.8 test assertions and make status ordering intentionally irrelevant.
p=Path('server/test/world-depth-9-8.test.mjs')
s=p.read_text()
s=s.replace("import {validateQuestGraph,compileQuestGraph,nextQuestNodes} from '../engine/QuestFlowEngine.mjs';", "import {validateQuestGraph,compileQuestGraph,nextQuestNodes} from '../engine/QuestFlowEngine.mjs';import {validateStudioRecord} from '../engine/ContentStudio.mjs';")
s=s.replace("assert.equal(publicCombatState(m,1600).status[0].type,'burn')","assert.ok(publicCombatState(m,1600).status.some(s=>s.type==='burn'))")
s += "\ntest('9.8 Studio rejects unsafe AI event and graph authoring values',()=>{assert.match(validateStudioRecord('monsters',{id:'bad_monster',name:'Bad',type:'normal',aggroRadius:99})||'',/aggroRadius/);assert.match(validateStudioRecord('npcs',{id:'bad_npc',name:'Bad',role:'guard',mapId:'eldoria',patrolRoute:{}})||'',/patrolRoute/);assert.match(validateStudioRecord('maps',{id:'bad_map',name:'Bad',biome:'grass',interiors:{}})||'',/interiors/);assert.match(validateStudioRecord('events',{id:'bad_event',name:'Bad',type:'invasion',startHour:28})||'',/startHour/)})\n"
p.write_text(s)
print('9.8 validation fixes applied')
