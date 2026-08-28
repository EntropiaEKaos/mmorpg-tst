// Mor'ia 9.11-9.16 — editable seed content for the Living Realm.
const node=(id,name,mapId,specialization,x=40,y=40)=>({id,name,mapId,specialization,x,y,radius:12,enabled:true,maxHp:5000,stageThresholds:[0,150,450,1100,2400,4800,9000],taxRate:5});
export const LIVING_REALM_CONTENT=Object.freeze({
  nodes:Object.freeze([
    node('node_eldoria','Eldoria Crownlands','eldoria','commercial'),
    node('node_sunreach','Sunreach Free Port','sunreach_coast','commercial',40,58),
    node('node_ironwood','Ironwood Wild March','ironwood','wild',20,40),
    node('node_frostpeak','Frostpeak Bastion','frostpeak','military',65,40),
    node('node_shadowfen','Shadowfen Covenant','shadowfen','religious',40,65),
    node('node_emberhold','Emberhold Forge March','emberhold','industrial',65,15),
    node('node_crystaldeep','Crystal Deep Conclave','crystal_deep','arcane',40,60),
    node('node_stormwatch','Stormwatch Conduit','stormwatch_isle','arcane',40,22),
    node('node_voidlands','Voidlands Warfront','voidlands','military'),
    node('node_nightfall','Nightfall Veil','nightfall_citadel','religious'),
    node('node_astra','Astra Sanctum','gm_sanctum','arcane'),
  ]),
  factions:Object.freeze([
    {id:'crown_eldoria',name:'Crown of Eldoria',icon:'♛',color:'#e8c76a',ideology:'Order, cities and protected trade.',hqMapId:'eldoria',bonuses:{commerce:10,defense:5},enemies:['red_pact']},
    {id:'red_pact',name:'Red Pact',icon:'⚔',color:'#dc5a5a',ideology:'Strength, conquest and martial honor.',hqMapId:'voidlands',bonuses:{siege:10,attack:5},enemies:['crown_eldoria']},
    {id:'arcane_conclave',name:'Arcane Conclave',icon:'✦',color:'#9b7cff',ideology:'Knowledge, relics and dangerous discovery.',hqMapId:'crystal_deep',bonuses:{arcane:10,craftQuality:3},enemies:['order_veil']},
    {id:'order_veil',name:'Order of the Veil',icon:'☾',color:'#8a6ba8',ideology:'Death, shadows and forbidden truths.',hqMapId:'nightfall_citadel',bonuses:{death:10,shadow:10},enemies:['arcane_conclave']},
    {id:'children_wild',name:'Children of the Wild',icon:'❧',color:'#63b66c',ideology:'Beasts, wilderness and natural balance.',hqMapId:'ironwood',bonuses:{taming:12,nature:8},enemies:[]},
    {id:'free_league',name:'Free League',icon:'⚓',color:'#56b8cf',ideology:'Trade, exploration and political independence.',hqMapId:'sunreach_coast',bonuses:{commerce:12,craftQuality:2},enemies:[]},
  ]),
  materials:Object.freeze([
    {id:'ore',name:'Ore',icon:'⛏',category:'ore',tier:1,baseQuality:35},{id:'wood',name:'Wood',icon:'🪵',category:'wood',tier:1,baseQuality:35},{id:'herb',name:'Herb',icon:'🌿',category:'herb',tier:1,baseQuality:35},{id:'fish',name:'Fish',icon:'🐟',category:'food',tier:1,baseQuality:35},{id:'beast_hide',name:'Beast Hide',icon:'◩',category:'hide',tier:1,baseQuality:42},
    {id:'verdant_fiber',name:'Verdant Fiber',icon:'🌱',category:'fiber',tier:2,baseQuality:50},{id:'frost_crystal',name:'Frost Crystal',icon:'❄',category:'crystal',tier:2,baseQuality:55},{id:'bog_essence',name:'Bog Essence',icon:'🧪',category:'essence',tier:2,baseQuality:52},{id:'cinder_ore',name:'Cinder Ore',icon:'🔥',category:'ore',tier:3,baseQuality:62},{id:'void_shard',name:'Void Shard',icon:'💠',category:'essence',tier:4,baseQuality:75},
    {id:'tide_pearl',name:'Tide Pearl',icon:'◉',category:'reagent',tier:2,baseQuality:55},{id:'ironbark_resin',name:'Ironbark Resin',icon:'◆',category:'resin',tier:2,baseQuality:58},{id:'mana_crystal',name:'Mana Crystal',icon:'◇',category:'arcane',tier:3,baseQuality:68},{id:'storm_core',name:'Storm Core',icon:'⚡',category:'arcane',tier:3,baseQuality:70},{id:'night_essence',name:'Night Essence',icon:'☾',category:'essence',tier:4,baseQuality:76},{id:'dragon_scale',name:'Dragon Scale',icon:'⬙',category:'monster',tier:4,baseQuality:75},
    {id:'steel_ingot',name:'Steel Ingot',icon:'▰',category:'metal',tier:2,baseQuality:55},{id:'treated_lumber',name:'Treated Lumber',icon:'▤',category:'wood',tier:2,baseQuality:55},{id:'cured_leather',name:'Cured Leather',icon:'▱',category:'leather',tier:2,baseQuality:55},
  ]),
  craftingRecipes:Object.freeze([
    {id:'process_steel',name:'Smelt Steel',profession:'smelting',stationType:'forge',difficulty:15,levelRequired:1,inputs:[{name:'Ore',quantity:3},{name:'Cinder Ore',quantity:1}],output:{name:'Steel Ingot',icon:'▰',type:'material',quantity:1}},
    {id:'process_lumber',name:'Treat Lumber',profession:'carpentry',stationType:'sawmill',difficulty:12,levelRequired:1,inputs:[{name:'Wood',quantity:3},{name:'Ironbark Resin',quantity:1}],output:{name:'Treated Lumber',icon:'▤',type:'material',quantity:1}},
    {id:'process_leather',name:'Cure Leather',profession:'leatherworking',stationType:'tannery',difficulty:12,levelRequired:1,inputs:[{name:'Beast Hide',quantity:3}],output:{name:'Cured Leather',icon:'▱',type:'material',quantity:1}},
    {id:'steel_longblade',name:'Steel Longblade',profession:'weaponsmithing',stationType:'forge',difficulty:35,levelRequired:8,inputs:[{name:'Steel Ingot',quantity:4},{name:'Treated Lumber',quantity:1}],output:{name:'Crafted Steel Longblade',icon:'⚔',type:'equipment',slot:'weapon',attack:18,rarity:'uncommon',level:8,value:450}},
    {id:'dragon_plate',name:'Dragon Scale Plate',profession:'armorsmithing',stationType:'forge',difficulty:70,levelRequired:25,inputs:[{name:'Steel Ingot',quantity:6},{name:'Dragon Scale',quantity:4},{name:'Cured Leather',quantity:2}],output:{name:'Dragon Scale Plate',icon:'🛡',type:'equipment',slot:'armor',armor:34,defense:8,rarity:'epic',level:25,value:5000,resistances:{fire:15}}},
    {id:'moon_elixir',name:'Moon Elixir',profession:'alchemy',stationType:'alchemy',difficulty:30,levelRequired:5,inputs:[{name:'Herb',quantity:3},{name:'Mana Crystal',quantity:1}],output:{name:'Moon Elixir',icon:'🧪',type:'potion',quantity:2,value:180}},
    {id:'arcane_focus',name:'Arcane Focus',profession:'enchanting',stationType:'enchanter',difficulty:55,levelRequired:15,inputs:[{name:'Mana Crystal',quantity:3},{name:'Void Shard',quantity:1}],output:{name:'Arcane Focus',icon:'🔮',type:'equipment',slot:'relic',magic:12,rarity:'rare',level:15,value:1800,damageBonuses:{arcane:12}}},
    {id:'storm_rune',name:'Storm Rune',profession:'runecrafting',stationType:'enchanter',difficulty:58,levelRequired:18,inputs:[{name:'Storm Core',quantity:2},{name:'Mana Crystal',quantity:1}],output:{name:'Storm Rune',icon:'⚡',type:'relic',quantity:1,value:1000}},
    {id:'siege_ram',name:'Reinforced Battering Ram Kit',profession:'siege_engineering',stationType:'siegeworks',difficulty:60,levelRequired:20,inputs:[{name:'Treated Lumber',quantity:8},{name:'Steel Ingot',quantity:6},{name:'Cured Leather',quantity:2}],output:{name:'Battering Ram Kit',icon:'🛠',type:'siege',quantity:1,value:2500}},
  ]),
  tamingSpecies:Object.freeze([
    {id:'timber_wolf',name:'Timber Wolf',icon:'🐺',monsterId:'ironwood_timber_wolf',rarity:'common',levelRequired:10,mapId:'ironwood',temperament:35,favoriteFood:'Meat',breedable:true,roles:['combat','scout'],baseTraits:{strength:48,speed:62,endurance:50,intelligence:35,loyalty:45,wildness:60}},
    {id:'ironwood_stag',name:'Ironwood Stag',icon:'🦌',monsterId:'ironwood_ironwood_stag',rarity:'uncommon',levelRequired:10,mapId:'ironwood',temperament:45,favoriteFood:'Herb',breedable:true,roles:['mount','pack'],baseTraits:{strength:55,speed:68,endurance:70,intelligence:42,loyalty:55,wildness:58}},
    {id:'icefang_wolf',name:'Icefang Wolf',icon:'❄',monsterId:'frostpeak_icefang_wolf',rarity:'rare',levelRequired:18,mapId:'frostpeak',temperament:68,favoriteFood:'Fish',breedable:true,roles:['mount','combat','scout'],baseTraits:{strength:62,speed:78,endurance:66,intelligence:52,loyalty:45,wildness:78}},
    {id:'storm_hound',name:'Storm Hound',icon:'⚡',monsterId:'stormwatch_isle_storm_hound',rarity:'epic',levelRequired:44,mapId:'stormwatch_isle',temperament:78,favoriteFood:'Meat',breedable:true,roles:['mount','combat'],baseTraits:{strength:72,speed:90,endurance:60,intelligence:62,loyalty:40,wildness:88}},
    {id:'blood_raven',name:'Blood Raven',icon:'🐦‍⬛',monsterId:'nightfall_citadel_blood_raven',rarity:'legendary',levelRequired:60,mapId:'nightfall_citadel',temperament:88,favoriteFood:'Meat',breedable:false,roles:['combat','scout'],baseTraits:{strength:60,speed:94,endurance:58,intelligence:84,loyalty:35,wildness:94}},
  ]),
});
