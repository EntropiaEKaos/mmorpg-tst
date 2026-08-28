// ===================================================================
// MOR'IA 9.1 — ALPHA LAUNCH CONTENT PACK
// Materialized into ContentDB on a fresh server. Once seeded, every record is
// editable through the authoritative Admin/Content Studio.
// ===================================================================

import { GRAND_ELDORIA_MAP } from './GrandEldoria.mjs';
import { GRAND_SUNREACH_MAP } from './GrandSunreach.mjs';
import { GRAND_IRONWOOD_MAP } from './GrandIronwood.mjs';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const REGIONS = Object.freeze([
  { id:'eldoria', name:'Eldoria Heartlands', biome:'plains', level:1, seed:42, theme:'Verdant', giver:'Archivist Mira' },
  { id:'sunreach_coast', name:'Sunreach Coast', biome:'plains', level:5, seed:2048, theme:'Tide', giver:'Captain Lys' },
  { id:'ironwood', name:'Ironwood March', biome:'plains', level:10, seed:31415, theme:'Ironbark', giver:'Warden Harl' },
  { id:'frostpeak', name:'Frostpeak', biome:'snow', level:15, seed:1337, theme:'Frost', giver:'Thane Yrsa' },
  { id:'shadowfen', name:'Shadowfen', biome:'swamp', level:20, seed:7, theme:'Bog', giver:'Seer Vael' },
  { id:'emberhold', name:'Emberhold', biome:'desert', level:28, seed:999, theme:'Cinder', giver:'Smith Kora' },
  { id:'crystal_deep', name:'Crystal Deep', biome:'shadow', level:36, seed:7777, theme:'Crystal', giver:'Delver Oryn' },
  { id:'stormwatch_isle', name:'Stormwatch Isle', biome:'snow', level:44, seed:8888, theme:'Storm', giver:'Admiral Thessa' },
  { id:'voidlands', name:'Voidlands', biome:'shadow', level:52, seed:666, theme:'Void', giver:'Oracle Nhex' },
  { id:'nightfall_citadel', name:'Nightfall Citadel', biome:'shadow', level:60, seed:90909, theme:'Nightfall', giver:'Marshal Ilyr' },
]);

const SCHOOL_BY_REGION = Object.freeze({ eldoria:'nature',sunreach_coast:'water',ironwood:'earth',frostpeak:'ice',shadowfen:'poison',emberhold:'fire',crystal_deep:'arcane',stormwatch_isle:'lightning',voidlands:'shadow',nightfall_citadel:'death' });
const OPPOSING_SCHOOL = Object.freeze({ nature:'fire',water:'lightning',earth:'arcane',ice:'fire',poison:'holy',fire:'water',arcane:'physical',lightning:'earth',shadow:'holy',death:'holy' });

const MONSTER_THEMES = Object.freeze({
  eldoria: [['Field Rat','🐀'],['Briar Wolf','🐺'],['Mossback Boar','🐗'],['Bandit Scout','🗡️'],['Verdant Marauder','🧟'],['Old Grove Colossus','🌳']],
  sunreach_coast: [['Reef Crab','🦀'],['Saltfang Serpent','🐍'],['Corsair Deckhand','🏴‍☠️'],['Tide Wisp','💧'],['Drowned Reaver','🧟'],['Leviathan Spawn','🐙']],
  ironwood: [['Ironwood Stag','🦌'],['Timber Wolf','🐺'],['Barkhide Brute','🪵'],['Poacher','🏹'],['Ancient Ent','🌲'],['Ironbark Behemoth','🌳']],
  frostpeak: [['Snow Stalker','🐆'],['Icefang Wolf','🐺'],['Frost Cultist','🧙'],['Glacier Golem','🧊'],['Yeti Warmaster','👹'],['Skadi the White','🐉']],
  shadowfen: [['Bog Leech','🪱'],['Rotcap Fungus','🍄'],['Fen Witch','🧙‍♀️'],['Drowned Knight','💀'],['Plague Abomination','🧟'],['Miremother','🐊']],
  emberhold: [['Ash Scorpion','🦂'],['Cinder Jackal','🐕'],['Lava Imp','👿'],['Ashen Raider','🗡️'],['Magma Golem','🗿'],['Pyroclast Tyrant','🌋']],
  crystal_deep: [['Shardling','💎'],['Cave Lurker','🕷️'],['Resonant Bat','🦇'],['Crystal Sentinel','🗿'],['Prismatic Horror','👁️'],['The Faceted One','💠']],
  stormwatch_isle: [['Gale Harpy','🦅'],['Storm Hound','🐺'],['Sea Raider','🏴‍☠️'],['Thunder Elemental','⚡'],['Tempest Champion','🛡️'],['Maelstrom Drake','🐉']],
  voidlands: [['Voidling','👾'],['Shadow Stalker','👤'],['Abyssal Cultist','🧙'],['Rift Beast','🦑'],['Void Reaver','☠️'],['Nhexus Unbound','🕳️']],
  nightfall_citadel: [['Nightguard','🛡️'],['Blood Raven','🐦‍⬛'],['Dread Mage','🧙‍♂️'],['Blacksteel Knight','⚔️'],['Soul Warden','💀'],['The Night Regent','👑']],
});

const PORTALS = Object.freeze({
  eldoria: [
    {x:10,y:40,targetMap:'frostpeak',targetX:70,targetY:40,label:'❄ Frostpeak Pass'},
    {x:70,y:10,targetMap:'shadowfen',targetX:40,targetY:70,label:'🍄 Shadowfen Road'},
    {x:40,y:10,targetMap:'sunreach_coast',targetX:40,targetY:68,label:'🌊 Sunreach Gate'},
    {x:70,y:40,targetMap:'ironwood',targetX:10,targetY:40,label:'🌲 Ironwood Gate'},
    {x:40,y:70,targetMap:'gm_sanctum',targetX:40,targetY:40,label:'🔒 Astral GM Gate'},
  ],
  sunreach_coast: [
    {x:40,y:72,targetMap:'eldoria',targetX:40,targetY:12,label:'🏰 Eldoria'},
    {x:72,y:40,targetMap:'ironwood',targetX:12,targetY:40,label:'🌲 Ironwood Trail'},
  ],
  ironwood: [
    {x:8,y:40,targetMap:'eldoria',targetX:68,targetY:40,label:'🏰 Eldoria'},
    {x:40,y:8,targetMap:'frostpeak',targetX:68,targetY:40,label:'❄ Frostpeak Ascent'},
  ],
  frostpeak: [
    {x:75,y:40,targetMap:'eldoria',targetX:12,targetY:40,label:'🏰 Eldoria'},
    {x:10,y:70,targetMap:'emberhold',targetX:70,targetY:10,label:'🌋 Emberhold Rift'},
    {x:40,y:10,targetMap:'crystal_deep',targetX:40,targetY:70,label:'💎 Crystal Descent'},
  ],
  shadowfen: [
    {x:40,y:75,targetMap:'eldoria',targetX:68,targetY:12,label:'🏰 Eldoria'},
    {x:10,y:10,targetMap:'voidlands',targetX:70,targetY:70,label:'☠ Voidlands Breach'},
    {x:70,y:40,targetMap:'crystal_deep',targetX:10,targetY:40,label:'💎 Crystal Sinkhole'},
  ],
  emberhold: [
    {x:75,y:10,targetMap:'frostpeak',targetX:12,targetY:70,label:'❄ Frostpeak'},
    {x:40,y:70,targetMap:'stormwatch_isle',targetX:40,targetY:10,label:'⚡ Stormwatch Ferry'},
  ],
  crystal_deep: [
    {x:40,y:75,targetMap:'frostpeak',targetX:40,targetY:12,label:'❄ Frostpeak'},
    {x:8,y:40,targetMap:'shadowfen',targetX:68,targetY:40,label:'🍄 Shadowfen'},
    {x:72,y:40,targetMap:'stormwatch_isle',targetX:10,targetY:40,label:'⚡ Stormwatch Lift'},
  ],
  stormwatch_isle: [
    {x:40,y:8,targetMap:'emberhold',targetX:40,targetY:68,label:'🌋 Emberhold'},
    {x:8,y:40,targetMap:'crystal_deep',targetX:70,targetY:40,label:'💎 Crystal Deep'},
    {x:70,y:70,targetMap:'nightfall_citadel',targetX:10,targetY:10,label:'🌑 Nightfall Causeway'},
  ],
  voidlands: [
    {x:75,y:75,targetMap:'shadowfen',targetX:12,targetY:12,label:'🍄 Shadowfen'},
    {x:10,y:10,targetMap:'nightfall_citadel',targetX:70,targetY:70,label:'🌑 Nightfall Gate'},
  ],
  nightfall_citadel: [
    {x:8,y:8,targetMap:'stormwatch_isle',targetX:68,targetY:68,label:'⚡ Stormwatch Isle'},
    {x:72,y:72,targetMap:'voidlands',targetX:12,targetY:12,label:'☠ Voidlands'},
  ],
  gm_sanctum: [
    {x:40,y:72,targetMap:'eldoria',targetX:40,targetY:68,label:'🏰 Return to Eldoria'},
  ],
});

const mapCenters = {
  eldoria:[40,40], sunreach_coast:[40,58], ironwood:[20,40], frostpeak:[65,40], shadowfen:[40,65],
  emberhold:[65,15], crystal_deep:[40,60], stormwatch_isle:[40,22], voidlands:[40,40], nightfall_citadel:[40,40], gm_sanctum:[40,40],
};

const LEGACY_MAP_GATES = Object.freeze({ eldoria:1, frostpeak:1, shadowfen:1, emberhold:1, voidlands:25 });
const CITY_STYLE_BY_REGION = Object.freeze({ eldoria:'royal',sunreach_coast:'harbor',ironwood:'ironwood',frostpeak:'alpine',shadowfen:'marsh',emberhold:'forge',crystal_deep:'crystal',stormwatch_isle:'storm',voidlands:'void',nightfall_citadel:'nightfall' });

const maps = REGIONS.map(region => {
  if (region.id === 'eldoria') return { ...GRAND_ELDORIA_MAP, portals: GRAND_ELDORIA_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_ELDORIA_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_ELDORIA_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_ELDORIA_MAP.props.map(entry => ({ ...entry })) };
  if (region.id === 'sunreach_coast') return { ...GRAND_SUNREACH_MAP, portals: GRAND_SUNREACH_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_SUNREACH_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_SUNREACH_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_SUNREACH_MAP.props.map(entry => ({ ...entry })) };
  if (region.id === 'ironwood') return { ...GRAND_IRONWOOD_MAP, portals: GRAND_IRONWOOD_MAP.portals.map(portal => ({ ...portal })), districts: GRAND_IRONWOOD_MAP.districts.map(entry => ({ ...entry })), landmarks: GRAND_IRONWOOD_MAP.landmarks.map(entry => ({ ...entry })), props: GRAND_IRONWOOD_MAP.props.map(entry => ({ ...entry })) };
  const [townX,townY] = mapCenters[region.id];
  return {
    id:region.id, name:region.name, biome:region.biome,
    description:`${region.name} — ${region.theme} frontier for levels ${region.level}+ with its own hunts, boss, quests and economy hooks.`,
    levelRequired:LEGACY_MAP_GATES[region.id] ?? region.level, seed:region.seed, spawnX:townX, spawnY:townY, townX, townY, townRange:8,
    cityStyle:CITY_STYLE_BY_REGION[region.id], access:'public', portals:PORTALS[region.id] || [],
  };
});
maps.push({
  id:'gm_sanctum', name:'Astra Sanctum — GM Island', biome:'plains',
  description:'Restricted operations island for Game Masters: test arena, content review docks, event staging and safe administrative coordination.',
  levelRequired:1, seed:424242, spawnX:40, spawnY:40, townX:40, townY:40, townRange:14,
  cityStyle:'sanctum', access:'gm', portals:PORTALS.gm_sanctum,
});

const slots = ['weapon','armor','helmet','legs','boots','shield','ring','ring2','amulet','cloak','belt','gloves','relic'];
const itemKinds = ['Blade','Vestments','Crown','Greaves','Treads','Bulwark'];
const items = [];
REGIONS.forEach((region, regionIndex) => {
  for (let i=0;i<6;i++) {
    const level = region.level + i * 2;
    const slot = slots[(regionIndex * 3 + i) % slots.length];
    const rarity = level >= 58 && i >= 4 ? 'legendary' : level >= 38 && i >= 3 ? 'epic' : level >= 16 && i >= 2 ? 'rare' : 'uncommon';
    const scale = 3 + Math.floor(level * 1.35);
    const record = {
      id:`${region.id}_${slug(itemKinds[i])}_${i+1}`, name:`${region.theme} ${itemKinds[i]}`, icon:['⚔️','🥋','👑','🦿','👢','🛡️'][i],
      slot, rarity, level:Math.max(1,level), value:Math.max(40, level * level * 7),
      description:`Forged for ${region.name}. Alpha progression equipment (${region.level}+).`,
    };
    if (slot === 'weapon') { record.attack=scale; if (regionIndex % 3 === 2) record.magic=Math.floor(scale*.35); }
    else if (slot === 'shield') { record.defense=Math.floor(scale*.65); record.armor=Math.floor(scale*.5); }
    else { record.armor=Math.floor(scale*.55); record.hp=Math.floor(level*2.2); }
    if (rarity === 'rare') record.critChance=2;
    if (rarity === 'epic') { record.critChance=3; record.xpBonus=2; }
    if (rarity === 'legendary') { record.critChance=5; record.lifesteal=3; record.goldBonus=4; }
    const school=SCHOOL_BY_REGION[region.id];
    record.damageBonuses={ [school]: rarity==='legendary'?18:rarity==='epic'?12:rarity==='rare'?8:5 };
    if(i===5 || slot==='shield') record.resistances={ [school]: rarity==='legendary'?20:12 };
    if(i===0 || slot==='weapon') record.skillBonuses={ [school]: rarity==='legendary'?5:rarity==='epic'?3:2 };
    items.push(record);
  }
});

const monsters = [];
REGIONS.forEach((region, regionIndex) => {
  const templates = MONSTER_THEMES[region.id];
  templates.forEach(([name,emoji], i) => {
    const level = region.level + [0,1,2,3,5,8][i];
    const elite = i === 4; const boss = i === 5;
    const mult = boss ? 10 : elite ? 3.8 : 1;
    monsters.push({
      id:`${region.id}_${slug(name)}`, name, emoji, mapId:region.id,
      hp:Math.floor((45 + level * 18) * mult), attack:Math.floor((6 + level * 2.2) * (boss?1.7:elite?1.25:1)),
      defense:Math.floor(2 + level * (boss?.8:elite?.55:.32)), xp:Math.floor((12 + level * 15) * (boss?9:elite?3:1)), level,
      color:['#7fbf6a','#9fbf7a','#d0a860','#8ca0b8','#c070d0','#ff8c42'][i], size:boss?1.8:elite?1.25:1,
      type:boss?'boss':elite?'elite':'normal', goldMin:Math.floor(level*(boss?12:elite?4:1)), goldMax:Math.floor(level*(boss?28:elite?9:3)),
      count:boss?1:elite?2:4, posX:clamp(18 + i*8,5,74), posY:clamp(20 + ((regionIndex+i)%6)*7,5,74),
      speed:boss?850:elite?950:1100, lootTableId:`loot_${region.id}`,
      damageType:SCHOOL_BY_REGION[region.id], damageBonuses:{[SCHOOL_BY_REGION[region.id]]:boss?30:elite?15:5},
      resistances:{[SCHOOL_BY_REGION[region.id]]:boss?55:elite?35:20}, weaknesses:{[OPPOSING_SCHOOL[SCHOOL_BY_REGION[region.id]]]:boss?30:elite?22:15},
    });
  });
});
monsters.push(
  {id:'gm_training_dummy',name:'GM Training Dummy',emoji:'🎯',mapId:'gm_sanctum',hp:10000000,attack:0,defense:0,xp:0,level:1,color:'#eeeeee',size:1.2,type:'elite',goldMin:0,goldMax:0,count:3,posX:50,posY:40,speed:10000},
  {id:'gm_boss_simulator',name:'GM Boss Simulator',emoji:'🤖',mapId:'gm_sanctum',hp:5000000,attack:120,defense:45,xp:0,level:60,color:'#ff5577',size:1.8,type:'boss',goldMin:0,goldMax:0,count:1,posX:60,posY:40,speed:1200}
);

const npcs = [];
REGIONS.forEach((region, i) => {
  const [townX,townY] = mapCenters[region.id];
  npcs.push(
    {id:`quest_${region.id}`,name:region.giver,emoji:'📜',color:'#f4e04d',role:'quest',mapId:region.id,posX:townX-2,posY:townY,dialogue:`The ${region.theme.toLowerCase()} frontier needs capable hands. I have a chain of contracts for you.`},
    {id:`merchant_${region.id}`,name:`${region.theme} Quartermaster`,emoji:'🎒',color:'#7dd3fc',role:'merchant',mapId:region.id,posX:townX+2,posY:townY,dialogue:`Supplies and field gear for ${region.name}.`},
    {id:`warden_${region.id}`,name:`${region.theme} Warden`,emoji:'🛡️',color:'#93c5fd',role:'guard',mapId:region.id,posX:townX,posY:townY+2,dialogue:`Stay alert. The strongest creatures hold the outer reaches.`},
  );
});
npcs.push(
  {id:'gm_curator',name:'Astra Curator',emoji:'🧭',color:'#f0abfc',role:'quest',mapId:'gm_sanctum',posX:38,posY:38,dialogue:'GM operations hub: inspect content, stage events and validate encounters here.'},
  {id:'gm_quartermaster',name:'GM Quartermaster',emoji:'🧰',color:'#fbbf24',role:'merchant',mapId:'gm_sanctum',posX:42,posY:38,dialogue:'Administrative testing supplies only.'},
  {id:'gm_event_marshal',name:'Event Marshal',emoji:'📣',color:'#fb7185',role:'guard',mapId:'gm_sanctum',posX:40,posY:36,dialogue:'Use this island as a staging ground before live alpha events.'},
  {id:'gm_observer',name:'Combat Observer',emoji:'🔭',color:'#67e8f9',role:'trainer',mapId:'gm_sanctum',posX:36,posY:42,dialogue:'Training dummies and boss simulator are available north of the plaza.'},
  {id:'gm_gatekeeper',name:'Astral Gatekeeper',emoji:'🔐',color:'#c084fc',role:'guard',mapId:'gm_sanctum',posX:40,posY:44,dialogue:'Only characters listed in the Admin GM Roster may cross this sanctuary.'}
);

const quests = [];
let previousRegionFinal = null;
REGIONS.forEach(region => {
  const mobs = monsters.filter(m => m.mapId === region.id);
  const ids = [`q_${region.id}_1`,`q_${region.id}_2`,`q_${region.id}_3`,`q_${region.id}_4`];
  quests.push(
    {id:ids[0],name:`${region.theme} Patrol`,npcId:`quest_${region.id}`,description:`Thin the common threats around ${region.name}.`,target:mobs[0].id,count:8,rewardGold:region.level*30+80,rewardXp:region.level*55+150,levelRequired:region.level,requires:previousRegionFinal?[previousRegionFinal]:[],rewardItem:null},
    {id:ids[1],name:`${region.theme} Pressure`,npcId:`quest_${region.id}`,description:`Push deeper into ${region.name} and remove a second threat.`,target:mobs[1].id,count:10,rewardGold:region.level*45+120,rewardXp:region.level*75+220,levelRequired:region.level,requires:[ids[0]],rewardItem:null},
    {id:ids[2],name:`${region.theme} Elite Hunt`,npcId:`quest_${region.id}`,description:'Track and defeat the region elite before it rallies the lesser creatures.',target:mobs[4].id,count:4,rewardGold:region.level*80+250,rewardXp:region.level*130+500,levelRequired:region.level+3,requires:[ids[1]],rewardItem:{name:`${region.theme} Sigil`,icon:'🔰',value:region.level*30+100}},
    {id:ids[3],name:`Fall of ${mobs[5].name}`,npcId:`quest_${region.id}`,description:`Defeat ${mobs[5].name}, the alpha boss of ${region.name}.`,target:mobs[5].id,count:1,rewardGold:region.level*180+700,rewardXp:region.level*300+1400,levelRequired:region.level+5,requires:[ids[2]],rewardItem:{name:`${region.theme} Boss Trophy`,icon:'🏆',value:region.level*100+500}},
  );
  previousRegionFinal = ids[3];
});
quests.push(
  {id:'q_gm_dummy_check',name:'GM Combat Calibration',npcId:'gm_curator',description:'Validate the training dummy integration.',target:'gm_training_dummy',count:1,rewardGold:0,rewardXp:0,levelRequired:1,requires:[],rewardItem:null},
  {id:'q_gm_boss_check',name:'GM Boss Calibration',npcId:'gm_curator',description:'Validate the boss simulator in the restricted arena.',target:'gm_boss_simulator',count:1,rewardGold:0,rewardXp:0,levelRequired:1,requires:['q_gm_dummy_check'],rewardItem:null}
);

const spellNames = {
  knight:['Lionheart Cleave','Iron Oath'], paladin:['Sunlance','Radiant Aegis'], sorcerer:['Starfire Lance','Arcane Surge'], druid:['Thornburst','Ancient Renewal'],
  warlock:['Soul Bolt','Dread Pact'], rogue:['Shadowstep Strike','Killer Instinct'], priest:['Smite','Sanctuary'], deathknight:['Grave Slash','Frozen Resolve'],
  monk:['Palm of Thunder','Flow State'], ranger:['Storm Arrow','Predator Focus'], necromancer:['Bone Spear','Death Shroud'], berserker:['Ruin Axe','Blood Frenzy'],
  shaman:['Chain Spark','Spirit Ward'], templar:['Judgment','Bulwark of Dawn'],
};
const spells = [];
Object.entries(spellNames).forEach(([vocation,names], idx) => {
  const base = 28 + idx * 3;
  spells.push(
    {id:`alpha_${vocation}_attack`,name:names[0],icon:'✨',mana:18+idx,cooldown:1900,damage:70+base,range:['knight','rogue','death_knight','monk','berserker','templar'].includes(vocation)?2:6,color:'#7dd3fc',type:'attack',vocation,levelRequired:12+Math.floor(idx/2),scalingCoeff:1.15},
    {id:`alpha_${vocation}_utility`,name:names[1],icon:'🔷',mana:24+idx,cooldown:7000,damage:0,range:0,color:'#c084fc',type:'buff',vocation,levelRequired:18+Math.floor(idx/2),buffType:idx%2===0?'shield':'frenzy',buffDuration:8000,buffValue:22+idx%4,scalingCoeff:0},
  );
});

const lootTables = REGIONS.map((region, index) => ({
  id:`loot_${region.id}`, name:`${region.name} Field Loot`, rolls:index>=7?2:1,
  description:`Authoritative supplementary loot for ${region.name}.`,
  entries:[
    {itemId:items[index*6].id,chance:.08,min:1,max:1},
    {itemId:items[index*6+1].id,chance:.06,min:1,max:1},
    {name:`${region.theme} Token`,icon:'🪙',type:'misc',chance:.28,min:1,max:index>=5?3:2,value:region.level*4+10},
    {name:`${region.theme} Essence`,icon:'✨',type:'misc',chance:.12,min:1,max:1,value:region.level*8+25},
  ],
}));

const shops = REGIONS.map((region,index) => ({
  id:`shop_${region.id}`, name:`${region.name} Quartermaster`, npcId:`merchant_${region.id}`,
  description:`Admin-editable alpha merchant catalog for ${region.name}.`,
  entries:items.slice(index*6,index*6+6).map(item => ({itemId:item.id,price:Math.max(50,Math.floor(item.value*1.15))})),
}));

const events = REGIONS.map((region,index) => {
  const boss = monsters.filter(m => m.mapId === region.id && m.type === 'boss')[0];
  const normal = monsters.filter(m => m.mapId === region.id && m.type === 'normal')[0];
  return {
    id:`event_${region.id}`, name:`${region.theme} Crisis`, icon:index%2?'⚔️':'🌍',
    description:`Alpha world event in ${region.name}: rally players against the regional threat.`, type:index%3===0?'boss':'invasion',
    target:index%3===0?boss.id:normal.id, count:index%3===0?1:25, rewardGold:600+region.level*70, rewardXp:900+region.level*120,
    rewardCoins:2+Math.floor(region.level/12), mapId:region.id, durationMs:900000,
  };
});

const gmRoster = [];

export const ALPHA_CONTENT = Object.freeze({
  items:Object.freeze(items), monsters:Object.freeze(monsters), npcs:Object.freeze(npcs), quests:Object.freeze(quests),
  spells:Object.freeze(spells), maps:Object.freeze(maps), events:Object.freeze(events), shops:Object.freeze(shops),
  lootTables:Object.freeze(lootTables), gmRoster:Object.freeze(gmRoster),
});

export const ALPHA_CONTENT_COUNTS = Object.freeze(Object.fromEntries(Object.entries(ALPHA_CONTENT).map(([key,value]) => [key,value.length])));
