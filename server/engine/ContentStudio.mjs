// ===================================================================
// MOR'IA 8.6 — AUTHORITATIVE CONTENT STUDIO DOMAIN
// Declarative schemas, semantic validation and non-mutating diagnostics.
// ===================================================================

import { VOCATIONS } from './Vocations.mjs';
import { MAP_CONFIG, BIOMES, MAP_WIDTH, MAP_HEIGHT, MIN_MAP_DIMENSION, MAX_MAP_DIMENSION, SETTLEMENT_CLASSES, URBAN_PLANS } from './World.mjs';
import { validateContentReferences } from './ContentIntegrity.mjs';
import { extendStudioSchemaWithIsoInteractions, isoInteractionOptions, validateIsoStudioInteraction } from './IsoInteractionStudio.mjs';

const ID_RE = /^[A-Za-z0-9_-]{2,100}$/;
const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;
const RARITIES = Object.freeze(['common', 'uncommon', 'rare', 'epic', 'legendary']);
const ITEM_SLOTS = Object.freeze(['weapon', 'armor', 'helmet', 'legs', 'boots', 'shield', 'ring', 'ring2', 'amulet', 'cloak', 'belt', 'gloves', 'relic']);
const MAP_ACCESS = Object.freeze(['public', 'gm']);
const EVENT_TYPES = Object.freeze(['invasion','world_boss','caravan','city_defense','weather','region','boss','hunt','defense']);
const MONSTER_TYPES = Object.freeze(['normal', 'elite', 'boss']);
const NPC_ROLES = Object.freeze(['merchant', 'banker', 'innkeeper', 'trainer', 'guard', 'healer', 'quest', 'taskmaster', 'stablemaster', 'outfitter', 'realtor']);
const SPELL_TYPES = Object.freeze(['attack', 'heal', 'aoe', 'buff']);
const BUFF_TYPES = Object.freeze(['shield', 'haste', 'invisible', 'frenzy']);
const SPELL_TARGET_MODES = Object.freeze(['smart', 'self', 'target', 'area']);
const DAMAGE_SCHOOLS = Object.freeze(['physical','magic','arcane','fire','water','earth','lightning','ice','death','holy','nature','poison','shadow']);
const SCALING_STATS = Object.freeze(['attack','magic','hybrid']);
const ALLY_EFFECTS = Object.freeze(['none', 'heal', 'buff']);
const ENEMY_EFFECTS = Object.freeze(['none', 'damage', 'drain']);
const CITY_STYLES = Object.freeze(['royal','harbor','ironwood','alpine','marsh','forge','crystal','storm','void','nightfall','sanctum']);
const CITY_LANDMARK_KINDS = new Set(['keep','market','temple','depot','gate','forge','dock','arena','obelisk','library','graveyard','lodge','tower','house']);
const CITY_PROP_KINDS = new Set(['banner','lamp','statue','brazier','crystal','grave','tent','sign','barrel','cart','pine','mushroom','anchor','rune']);
const NAMEPLATE_MODES = Object.freeze(['nearby','always','hidden']);
const NODE_SPECIALIZATIONS = Object.freeze(['military','commercial','arcane','religious','industrial','wild','neutral']);
const TAME_RARITIES = Object.freeze(['common','uncommon','rare','epic','legendary','mythical']);

const field = (id, label = id, kind = 'text', extra = {}) => Object.freeze({ id, label, kind, ...extra });

export const CONTENT_STUDIO_SCHEMAS = Object.freeze({
  items: Object.freeze([field('id','ID'),field('name','Name'),field('icon','Icon'),field('slot','Slot','select',{optionKey:'slots'}),field('attack','Attack','number'),field('defense','Defense','number'),field('armor','Armor','number'),field('hp','HP','number'),field('mana','Mana','number'),field('magic','Magic','number'),field('critChance','Crit %','number'),field('lifesteal','Lifesteal %','number'),field('thorns','Thorns','number'),field('moveSpeed','Move speed %','number'),field('xpBonus','XP bonus %','number'),field('goldBonus','Gold bonus %','number'),field('damageReduction','Damage reduction %','number'),field('damageBonuses','School power %','json'),field('resistances','School resistances %','json'),field('weaknesses','School vulnerabilities %','json'),field('skillBonuses','Skill bonuses','json'),field('resistancePierce','Resistance pierce %','json'),field('spellPower','Generic spell power %','number'),field('physicalPower','Generic physical power %','number'),field('rarity','Rarity','select',{optionKey:'rarities'}),field('level','Required level','number'),field('value','Value','number'),field('description','Description','textarea')]),
  monsters: Object.freeze([field('id','ID'),field('name','Name'),field('emoji','Emoji'),field('hp','HP','number'),field('attack','Attack','number'),field('defense','Defense','number'),field('xp','XP','number'),field('level','Level','number'),field('type','Type','select',{optionKey:'monsterTypes'}),field('color','Color'),field('size','Size','number'),field('goldMin','Gold min','number'),field('goldMax','Gold max','number'),field('mapId','Runtime map','select',{optionKey:'maps',allowEmpty:true}),field('count','Spawn count','number'),field('posX','Spawn X','number'),field('posY','Spawn Y','number'),field('speed','Move delay','number'),field('lootTableId','Loot table','select',{optionKey:'lootTables',allowEmpty:true}),field('aiArchetype','AI archetype'),field('aggroRadius','Aggro radius','number'),field('leashRadius','Leash radius','number'),field('patrolRadius','Patrol radius','number'),field('fleeAtHp','Flee HP ratio','number'),field('packId','Pack ID'),field('damageType','Attack school','select',{optionKey:'damageSchools'}),field('damageBonuses','School power %','json'),field('resistances','School resistances %','json'),field('weaknesses','School vulnerabilities %','json'),field('telegraphMs','Telegraph ms','number'),field('telegraphKind','Telegraph kind'),field('telegraphRadius','Telegraph radius','number'),field('staggerThreshold','Stagger threshold','number'),field('phases','Boss phases','json')]),
  npcs: Object.freeze([field('id','ID'),field('name','Name'),field('emoji','Emoji'),field('color','Color'),field('role','Role','select',{optionKey:'npcRoles'}),field('posX','X','number'),field('posY','Y','number'),field('mapId','Map','select',{optionKey:'maps'}),field('dialogue','Dialogue','textarea'),field('aiMode','AI mode'),field('moveDelay','Move delay','number'),field('wanderRadius','Wander radius','number'),field('guardRadius','Guard radius','number'),field('openHour','Open hour','number'),field('closeHour','Close hour','number'),field('patrolRoute','Patrol route','json'),field('schedule','Daily schedule','json')]),
  spells: Object.freeze([field('id','ID'),field('name','Name'),field('icon','Icon'),field('mana','Mana','number'),field('cooldown','Cooldown ms','number'),field('damage','Base power','number'),field('range','Range','number'),field('color','Color'),field('type','Type','select',{optionKey:'spellTypes'}),field('vocation','Vocation','select',{optionKey:'vocations'}),field('levelRequired','Required level','number'),field('buffType','Buff type','select',{optionKey:'buffTypes',allowEmpty:true}),field('buffDuration','Buff duration ms','number'),field('buffValue','Buff value','number'),field('damageType','Damage school','select',{optionKey:'damageSchools'}),field('scalingStat','Scaling stat','select',{optionKey:'scalingStats'}),field('skillId','Scaling skill'),field('weaponSkill','Weapon skill'),field('skillScaling','Skill multiplier / level','number'),field('scalingCoeff','Stat coefficient','number'),field('targetMode','Target mode','select',{optionKey:'spellTargetModes'}),field('allyEffect','Ally effect','select',{optionKey:'allyEffects'}),field('enemyEffect','Enemy effect','select',{optionKey:'enemyEffects'}),field('allyMultiplier','Ally multiplier','number'),field('enemyMultiplier','Enemy multiplier','number'),field('selfMultiplier','Self multiplier','number'),field('dayMultiplier','Day multiplier','number'),field('nightMultiplier','Night multiplier','number'),field('drainPercent','Drain %','number')]),
  quests: Object.freeze([field('id','ID'),field('name','Name'),field('npcId','Quest NPC','select',{optionKey:'npcs',allowEmpty:true}),field('description','Description','textarea'),field('target','Target'),field('count','Count','number'),field('rewardGold','Reward gold','number'),field('rewardXp','Reward XP','number'),field('levelRequired','Required level','number'),field('requires','Prerequisite quest IDs','json'),field('rewardItem','Reward item','json'),field('nodes','Quest graph nodes','json'),field('startNode','Start node'),field('branches','Quest branches','json'),field('triggers','Quest triggers','json'),field('events','Quest events','json')]),
  maps: Object.freeze([field('id','ID'),field('name','Name'),field('biome','Biome','select',{optionKey:'biomes'}),field('description','Description','textarea'),field('width','Map width','number'),field('height','Map height','number'),field('settlementClass','Settlement class','select',{optionKey:'settlementClasses'}),field('urbanPlan','Urban plan','select',{optionKey:'urbanPlans'}),field('urbanBounds','Urban bounds','json'),field('levelRequired','Required level','number'),field('seed','Seed','number'),field('spawnX','Spawn X','number'),field('spawnY','Spawn Y','number'),field('townX','Town X','number'),field('townY','Town Y','number'),field('townRange','Town range','number')]),
});

function numberIn(record,key,min,max,{required=false,integer=false}={}){const raw=record?.[key];if((raw===undefined||raw===null||raw==='')&&!required)return null;const value=Number(raw);if(!Number.isFinite(value))return `${key} must be a number`;if(integer&&!Number.isInteger(value))return `${key} must be an integer`;if(value<min||value>max)return `${key} must be from ${min} to ${max}`;return null;}
function requiredText(record,key,max=100){const value=typeof record?.[key]==='string'?record[key].trim():'';if(!value)return `${key} is required`;if(value.length>max)return `${key} cannot exceed ${max} characters`;return null;}
function optionalColor(record){if(record?.color===undefined||record?.color===null||record.color==='')return null;return COLOR_RE.test(String(record.color))?null:'color must be a CSS hex color';}
function dimensionsForMap(contentDB,mapId){const custom=contentDB?.get?.('maps')?.find?.(entry=>entry?.id===mapId);const base=MAP_CONFIG[mapId];return {width:Number(custom?.width??base?.width??MAP_WIDTH),height:Number(custom?.height??base?.height??MAP_HEIGHT)};}
function playableCoord(record,key,dimension=MAP_WIDTH){return numberIn(record,key,1,dimension-2,{integer:true});}

export function validateStudioRecord(type,record,contentDB=null){
 if(!CONTENT_STUDIO_SCHEMAS[type])return `Unsupported content type: ${type}`;
 if(!record||typeof record!=='object'||Array.isArray(record))return 'Content record must be an object';
 const id=typeof record.id==='string'?record.id.trim():'';if(!ID_RE.test(id))return 'id must be 2-100 letters, numbers, dash or underscore';
 const nameError=requiredText(record,'name',100);if(nameError)return nameError;
 const interactionError=validateIsoStudioInteraction(type,record,contentDB);if(interactionError)return interactionError;
 if(type==='npcs'){
  const dims=dimensionsForMap(contentDB,String(record.mapId||''));for(const [key,dimension] of [['posX',dims.width],['posY',dims.height]]){const e=playableCoord(record,key,dimension);if(e)return e;}
  const role=String(record.role||'');if(role&&!NPC_ROLES.includes(role))return 'NPC role is not supported';
  for(const [key,min,max] of [['moveDelay',100,60000],['wanderRadius',0,20],['guardRadius',1,30],['openHour',0,23],['closeHour',1,24]]){const e=numberIn(record,key,min,max);if(e)return e;}
  if(record.patrolRoute!==undefined&&!Array.isArray(record.patrolRoute))return 'patrolRoute must be an array';if(record.schedule!==undefined&&!Array.isArray(record.schedule))return 'schedule must be an array';return optionalColor(record);
 }
 if(type==='monsters'){
  if(!MONSTER_TYPES.includes(String(record.type||'normal')))return 'monster type is not supported';
  for(const [key,min,max,required,integer] of [['hp',1,10000000,true,true],['attack',0,1000000,true,true],['defense',0,1000000,true,true],['xp',0,100000000,true,true],['level',1,100000,true,true]]){const e=numberIn(record,key,min,max,{required,integer});if(e)return e;}
  const dims=dimensionsForMap(contentDB,String(record.mapId||''));for(const [key,dimension] of [['posX',dims.width],['posY',dims.height]]){const e=playableCoord(record,key,dimension);if(e)return e;}return optionalColor(record);
 }
 if(type==='items'){if(!ITEM_SLOTS.includes(String(record.slot||'')))return 'slot is not supported';if(!RARITIES.includes(String(record.rarity||'')))return 'rarity is not supported';return numberIn(record,'level',1,100000,{required:true,integer:true});}
 return null;
}

function mapOptions(contentDB){const ids=new Set(Object.keys(MAP_CONFIG));for(const map of contentDB.get('maps'))if(typeof map?.id==='string'&&map.id.trim())ids.add(map.id.trim());return [...ids].sort();}
export function getContentStudioSchema(type,contentDB){
 const schema=extendStudioSchemaWithIsoInteractions(type,CONTENT_STUDIO_SCHEMAS[type]||[]);
 const options={rarities:[...RARITIES],slots:[...ITEM_SLOTS],monsterTypes:[...MONSTER_TYPES],npcRoles:[...NPC_ROLES],spellTypes:[...SPELL_TYPES],buffTypes:[...BUFF_TYPES],spellTargetModes:[...SPELL_TARGET_MODES],allyEffects:[...ALLY_EFFECTS],enemyEffects:[...ENEMY_EFFECTS],vocations:Object.keys(VOCATIONS).sort(),biomes:[...BIOMES].sort(),maps:mapOptions(contentDB),mapAccess:[...MAP_ACCESS],cityStyles:[...CITY_STYLES],settlementClasses:[...SETTLEMENT_CLASSES],urbanPlans:[...URBAN_PLANS],eventTypes:[...EVENT_TYPES],nameplateModes:[...NAMEPLATE_MODES],npcs:contentDB.get('npcs').map(e=>e.id).filter(Boolean).sort(),quests:contentDB.get('quests').map(e=>e.id).filter(Boolean).sort(),items:contentDB.get('items').map(e=>e.id).filter(Boolean).sort(),lootTables:contentDB.get('lootTables').map(e=>e.id).filter(Boolean).sort(),...isoInteractionOptions()};
 const runtimeNotes={items:'Published item stats feed the authoritative loot pool.',monsters:'Monsters publish authoritative ISO target/inspect/combat behavior.',npcs:'NPCs publish authoritative ISO talk/trade/inspect behavior.',spells:'Published spells execute server-side.',quests:'Quest NPCs and prerequisites are server validated.',maps:'Map edits rebuild authoritative world terrain.'};
 return {schema,fields:schema.map(entry=>entry.id),options,runtimeNote:runtimeNotes[type]||''};
}

export function collectContentDiagnostics(contentDB){const issues=[];const push=(severity,type,id,message)=>{if(issues.length<250)issues.push({severity,type,id,message});};for(const type of Object.keys(CONTENT_STUDIO_SCHEMAS)){const records=contentDB.get(type);const seen=new Set();for(const record of records){const id=typeof record?.id==='string'?record.id:'(missing)';if(seen.has(id))push('error',type,id,'Duplicate content id');seen.add(id);const semantic=validateStudioRecord(type,record,contentDB);if(semantic)push('error',type,id,semantic);const reference=validateContentReferences(contentDB,type,record);if(reference)push('error',type,id,reference);}}const byType={};for(const issue of issues)byType[issue.type]=(byType[issue.type]||0)+1;return {ok:issues.every(issue=>issue.severity!=='error'),total:issues.length,byType,issues};}
