// ===================================================================
// MOR'IA 9.2 — ALPHA LIFE SYSTEMS CONTENT
// Admin-editable defaults for Tibia-style tasks, housing, outfits and mounts.
// ===================================================================

const task = (id, name, npcId, mapId, target, targetName, count, minLevel, repeatLimit, taskPoints, rewardGold, rewardXp, bossUnlock = '') => ({
  id, name, npcId, mapId, target, targetName, count, minLevel, maxLevel: 9999, repeatLimit,
  taskPoints, rewardGold, rewardXp, bossUnlock,
  description: `Defeat ${count} ${targetName} and report back to the task master.`,
});

export const ALPHA_SYSTEMS_CONTENT = Object.freeze({
  npcs: Object.freeze([
    { id:'task_master_eldoria', name:'Grizzly Rowan', emoji:'📜', color:'#d4a85c', role:'taskmaster', posX:42, posY:43, mapId:'eldoria', dialogue:'Choose your prey carefully. A hunter earns rank through completed tasks.' },
    { id:'stablemaster_eldoria', name:'Stablemaster Bronn', emoji:'🐎', color:'#b7834f', role:'stablemaster', posX:44, posY:38, mapId:'eldoria', dialogue:'A good mount is earned, trained and cared for.' },
    { id:'outfitter_eldoria', name:'Mirielle the Tailor', emoji:'🧵', color:'#d49bc8', role:'outfitter', posX:46, posY:38, mapId:'eldoria', dialogue:'Style is another kind of armor.' },
    { id:'realtor_eldoria', name:'Magistrate Oren', emoji:'🏠', color:'#d9bd7a', role:'realtor', posX:48, posY:38, mapId:'eldoria', dialogue:'Property in Mor\'ia is recorded by the realm, not by rumor.' },
    { id:'task_master_frostpeak', name:'Hilda Frostmark', emoji:'📜', color:'#9bd4ff', role:'taskmaster', posX:64, posY:42, mapId:'frostpeak', dialogue:'The mountain remembers every beast you bring down.' },
    { id:'task_master_shadowfen', name:'Mire Warden Kesh', emoji:'📜', color:'#80c98a', role:'taskmaster', posX:39, posY:63, mapId:'shadowfen', dialogue:'Cull what festers in the fog.' },
    { id:'task_master_emberhold', name:'Ash Hunter Varo', emoji:'📜', color:'#ff8a55', role:'taskmaster', posX:63, posY:17, mapId:'emberhold', dialogue:'Only proven hunters are sent against the fireborn.' },
    { id:'task_master_voidlands', name:'Seer Nhal', emoji:'📜', color:'#ba8cff', role:'taskmaster', posX:42, posY:40, mapId:'voidlands', dialogue:'Count the dead. The void counts you in return.' },
  ]),

  taskQuests: Object.freeze([
    task('task_rat_catcher','Rat Catcher','task_master_eldoria','eldoria','rat','Rats',25,1,5,2,180,260),
    task('task_snake_charmer','Snake Charmer','task_master_eldoria','eldoria','snake','Snakes',20,2,5,2,220,320),
    task('task_wolf_hunter','Wolf Hunter','task_master_frostpeak','frostpeak','wolf','Wolves',30,7,5,3,450,700),
    task('task_bear_tracker','Bear Tracker','task_master_frostpeak','frostpeak','bear','Bears',18,9,5,4,620,950),
    task('task_orc_culler','Orc Culler','task_master_shadowfen','shadowfen','orc','Orcs',35,10,5,4,760,1150),
    task('task_bone_breaker','Bone Breaker','task_master_shadowfen','shadowfen','skeleton','Skeletons',35,9,5,4,700,1050),
    task('task_demon_bane','Demon Bane','task_master_emberhold','emberhold','demon','Demons',20,20,4,6,1400,2200),
    task('task_dragon_trial','Dragon Trial','task_master_emberhold','emberhold','dragon_lord','Dragon Lords',6,25,3,10,3600,5200,'dragon_lord'),
    task('task_ghost_silencer','Ghost Silencer','task_master_voidlands','voidlands','ghost','Ghosts',35,25,5,6,1800,2700),
    task('task_orc_king_hunt','Kingbreaker','task_master_shadowfen','shadowfen','orc_king','Orc Kings',3,25,2,12,4200,6000,'orc_king'),
    task('task_rat_exterminator','Vermin Exterminator','task_master_eldoria','eldoria','rat','Rats',100,8,3,8,900,1400),
    task('task_demon_crusade','Demon Crusade','task_master_emberhold','emberhold','demon','Demons',60,30,2,14,6000,9000,'dragon_lord'),
  ]),

  houses: Object.freeze([
    { id:'house_oakhearth', name:'Oakhearth Cottage', mapId:'eldoria', x:27, y:31, width:5, height:4, entranceX:29, entranceY:35, price:12000, weeklyRent:600, levelRequired:8, style:'cottage' },
    { id:'house_goldleaf', name:'Goldleaf Residence', mapId:'eldoria', x:52, y:31, width:5, height:4, entranceX:54, entranceY:35, price:18000, weeklyRent:900, levelRequired:12, style:'noble' },
    { id:'house_riverside', name:'Riverside Nook', mapId:'eldoria', x:27, y:45, width:5, height:4, entranceX:29, entranceY:44, price:15000, weeklyRent:750, levelRequired:10, style:'wood' },
    { id:'house_frostwatch', name:'Frostwatch Cabin', mapId:'frostpeak', x:58, y:31, width:5, height:4, entranceX:60, entranceY:35, price:22000, weeklyRent:1100, levelRequired:15, style:'frost' },
    { id:'house_snowpine', name:'Snowpine Lodge', mapId:'frostpeak', x:68, y:46, width:5, height:4, entranceX:70, entranceY:45, price:26000, weeklyRent:1300, levelRequired:18, style:'frost' },
    { id:'house_mirelight', name:'Mirelight Hut', mapId:'shadowfen', x:30, y:58, width:5, height:4, entranceX:32, entranceY:57, price:24000, weeklyRent:1200, levelRequired:18, style:'swamp' },
    { id:'house_fenwarden', name:'Fenwarden Home', mapId:'shadowfen', x:47, y:60, width:5, height:4, entranceX:49, entranceY:59, price:30000, weeklyRent:1500, levelRequired:22, style:'swamp' },
    { id:'house_ashstone', name:'Ashstone House', mapId:'emberhold', x:56, y:19, width:5, height:4, entranceX:58, entranceY:18, price:36000, weeklyRent:1800, levelRequired:25, style:'ember' },
    { id:'house_cinderhall', name:'Cinderhall Residence', mapId:'emberhold', x:66, y:22, width:5, height:4, entranceX:68, entranceY:21, price:44000, weeklyRent:2200, levelRequired:30, style:'ember' },
    { id:'house_voidspire', name:'Voidspire Cell', mapId:'voidlands', x:34, y:34, width:5, height:4, entranceX:36, entranceY:33, price:60000, weeklyRent:3000, levelRequired:35, style:'void' },
    { id:'house_starless', name:'Starless Refuge', mapId:'voidlands', x:45, y:44, width:5, height:4, entranceX:47, entranceY:43, price:75000, weeklyRent:3750, levelRequired:40, style:'void' },
  ]),

  housingDecor: Object.freeze([
    { id:'decor_bed_oak', name:'Oak Bed', icon:'🛏️', kind:'bed', color:'#8b6f47', price:900 },
    { id:'decor_bed_royal', name:'Royal Bed', icon:'🛏️', kind:'bed', color:'#7b4ab8', price:2600 },
    { id:'decor_table', name:'Dining Table', icon:'🪵', kind:'furniture', color:'#7a5030', price:450 },
    { id:'decor_chair', name:'Carved Chair', icon:'🪑', kind:'furniture', color:'#8a6040', price:220 },
    { id:'decor_chest', name:'Display Chest', icon:'🧰', kind:'storage', color:'#a67832', price:700 },
    { id:'decor_armor_stand', name:'Armor Stand', icon:'🛡️', kind:'display', color:'#aeb6c2', price:1400 },
    { id:'decor_weapon_rack', name:'Weapon Rack', icon:'⚔️', kind:'display', color:'#c1c7d0', price:1200 },
    { id:'decor_fireplace', name:'Stone Fireplace', icon:'🔥', kind:'light', color:'#e06b32', price:1800 },
    { id:'decor_candle', name:'Candle Cluster', icon:'🕯️', kind:'light', color:'#f2d77f', price:180 },
    { id:'decor_rug_red', name:'Crimson Rug', icon:'🟥', kind:'rug', color:'#9c3038', price:600 },
    { id:'decor_rug_blue', name:'Azure Rug', icon:'🟦', kind:'rug', color:'#315d9c', price:600 },
    { id:'decor_plant', name:'Potted Fern', icon:'🪴', kind:'plant', color:'#4f9a5d', price:300 },
    { id:'decor_skull', name:'Trophy Skull', icon:'💀', kind:'trophy', color:'#d9d3c3', price:850 },
    { id:'decor_dragon_trophy', name:'Dragon Trophy', icon:'🐉', kind:'trophy', color:'#ba3f32', price:5000 },
    { id:'decor_bookshelf', name:'Bookshelf', icon:'📚', kind:'furniture', color:'#6d4930', price:800 },
    { id:'decor_clock', name:'Realm Clock', icon:'🕰️', kind:'furniture', color:'#c59c52', price:950 },
  ]),

  outfits: Object.freeze([
    { id:'citizen', name:'Citizen', icon:'🧑', style:'citizen', price:0, levelRequired:1, defaultUnlocked:true, addon1Name:'Backpack', addon2Name:'Feathered Hat', addonPrice:1200 },
    { id:'adventurer', name:'Adventurer', icon:'🧭', style:'adventurer', price:700, levelRequired:3, defaultUnlocked:false, addon1Name:'Travel Pack', addon2Name:'Torch Strap', addonPrice:900 },
    { id:'knight_regalia', name:'Knight Regalia', icon:'🛡️', style:'knight', price:2200, levelRequired:10, defaultUnlocked:false, addon1Name:'Pauldrons', addon2Name:'Plumed Helm', addonPrice:1800 },
    { id:'arcane_robes', name:'Arcane Robes', icon:'🧙', style:'mage', price:2200, levelRequired:10, defaultUnlocked:false, addon1Name:'Runic Mantle', addon2Name:'High Hat', addonPrice:1800 },
    { id:'ranger_garb', name:'Ranger Garb', icon:'🏹', style:'ranger', price:2200, levelRequired:10, defaultUnlocked:false, addon1Name:'Quiver', addon2Name:'Forest Hood', addonPrice:1800 },
    { id:'shadow_weave', name:'Shadow Weave', icon:'🥷', style:'assassin', price:3600, levelRequired:18, defaultUnlocked:false, addon1Name:'Face Wrap', addon2Name:'Twin Blades', addonPrice:2400 },
    { id:'noble_court', name:'Noble Court', icon:'👑', style:'noble', price:5000, levelRequired:20, defaultUnlocked:false, addon1Name:'Royal Cape', addon2Name:'Crown', addonPrice:3200 },
    { id:'bone_caller', name:'Bone Caller', icon:'💀', style:'necromancer', price:6200, levelRequired:25, defaultUnlocked:false, addon1Name:'Bone Mantle', addon2Name:'Skull Hood', addonPrice:4000 },
    { id:'ember_raider', name:'Ember Raider', icon:'🔥', style:'barbarian', price:6500, levelRequired:25, defaultUnlocked:false, addon1Name:'Fur Mantle', addon2Name:'Horned Helm', addonPrice:4200 },
    { id:'storm_shaman', name:'Storm Shaman', icon:'🔱', style:'shaman', price:7000, levelRequired:28, defaultUnlocked:false, addon1Name:'Totem Pack', addon2Name:'Antler Crown', addonPrice:4400 },
    { id:'void_walker', name:'Void Walker', icon:'🌌', style:'warlock', price:10000, levelRequired:35, defaultUnlocked:false, addon1Name:'Void Mantle', addon2Name:'Demon Horns', addonPrice:6500 },
    { id:'dawn_templar', name:'Dawn Templar', icon:'☀️', style:'templar', price:9000, levelRequired:32, defaultUnlocked:false, addon1Name:'Sun Cape', addon2Name:'Halo Crest', addonPrice:5600 },
  ]),

  mounts: Object.freeze([
    { id:'horse', name:'War Horse', icon:'🐎', color:'#8b6f47', speedBonus:20, price:500, levelRequired:5, description:'Reliable realm-bred war horse.' },
    { id:'wolf', name:'Tamed Wolf', icon:'🐺', color:'#68717c', speedBonus:24, price:1600, levelRequired:10, description:'Fast over broken ground.' },
    { id:'boar', name:'Ironhide Boar', icon:'🐗', color:'#6f4c35', speedBonus:22, price:2200, levelRequired:12, description:'Stubborn and surprisingly swift.' },
    { id:'tiger', name:'Saber Tiger', icon:'🐅', color:'#d88932', speedBonus:28, price:4200, levelRequired:15, description:'A predator trained to carry hunters.' },
    { id:'bear_mount', name:'Frost Bear', icon:'🐻‍❄️', color:'#dce8f0', speedBonus:26, price:5200, levelRequired:18, description:'A Frostpeak beast with immense endurance.' },
    { id:'unicorn', name:'Moon Unicorn', icon:'🦄', color:'#e1b7ff', speedBonus:30, price:7000, levelRequired:20, description:'A rare mount touched by moonlight.' },
    { id:'raptor', name:'Ash Raptor', icon:'🦖', color:'#a85532', speedBonus:34, price:9500, levelRequired:25, description:'Bred near Emberhold vents.' },
    { id:'drake', name:'Ember Drake', icon:'🐉', color:'#b9362d', speedBonus:38, price:16000, levelRequired:30, description:'A young drake strong enough for a rider.' },
    { id:'nightmare', name:'Void Nightmare', icon:'🐴', color:'#6f45a8', speedBonus:40, price:22000, levelRequired:35, description:'Hooves that barely touch the mortal world.' },
    { id:'astral_lion', name:'Astral Lion', icon:'🦁', color:'#d9bd68', speedBonus:42, price:30000, levelRequired:40, description:'An alpha prestige mount of the Astra Sanctum.' },
  ]),
});

export const ALPHA_SYSTEMS_COUNTS = Object.freeze(Object.fromEntries(
  Object.entries(ALPHA_SYSTEMS_CONTENT).map(([key, value]) => [key, value.length])
));
