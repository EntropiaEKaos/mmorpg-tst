from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

def write(path, content):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding='utf-8')

def replace_once(path, old, new):
    target = ROOT / path
    text = target.read_text(encoding='utf-8')
    if old not in text:
        raise SystemExit(f'anchor missing in {path}: {old[:100]!r}')
    target.write_text(text.replace(old, new, 1), encoding='utf-8')

def regex_once(path, pattern, repl):
    target = ROOT / path
    text = target.read_text(encoding='utf-8')
    next_text, count = re.subn(pattern, repl, text, count=1, flags=re.S)
    if count != 1:
        raise SystemExit(f'regex anchor missing in {path}: {pattern[:100]!r}')
    target.write_text(next_text, encoding='utf-8')

write('server/engine/AlphaSystemsContent.mjs', r'''// ===================================================================
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
''')

write('server/engine/AppearanceSystem.mjs', r'''const HEX = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_COLORS = Object.freeze({ head:'#d7a06b', primary:'#506aa6', secondary:'#343f59', detail:'#d9c271' });

const cleanId = value => typeof value === 'string' ? value.trim().slice(0,100) : '';
const cleanColor = (value, fallback) => HEX.test(String(value || '')) ? String(value) : fallback;

function defaultOwned(contentDB) {
  const defaults = contentDB.get('outfits').filter(entry => entry?.defaultUnlocked).map(entry => entry.id).filter(Boolean);
  if (!defaults.includes('citizen') && contentDB.get('outfits').some(entry => entry.id === 'citizen')) defaults.unshift('citizen');
  return defaults.slice(0,100);
}

function ensure(player, contentDB) {
  const raw = player.appearanceState && typeof player.appearanceState === 'object' && !Array.isArray(player.appearanceState)
    ? player.appearanceState : {};
  const known = new Set(contentDB.get('outfits').map(entry => entry.id));
  const owned = new Set(Array.isArray(raw.ownedOutfits) ? raw.ownedOutfits.filter(id => typeof id === 'string' && known.has(id)) : []);
  for (const id of defaultOwned(contentDB)) owned.add(id);
  const fallback = [...owned][0] || contentDB.get('outfits')[0]?.id || 'citizen';
  const selectedOutfitId = known.has(raw.selectedOutfitId) && owned.has(raw.selectedOutfitId) ? raw.selectedOutfitId : fallback;
  const ownedAddons = {};
  if (raw.ownedAddons && typeof raw.ownedAddons === 'object' && !Array.isArray(raw.ownedAddons)) {
    for (const [id, list] of Object.entries(raw.ownedAddons)) {
      if (!known.has(id) || !Array.isArray(list)) continue;
      ownedAddons[id] = [...new Set(list.map(Number).filter(n => n === 1 || n === 2))];
    }
  }
  const addonMasks = {};
  if (raw.addonMasks && typeof raw.addonMasks === 'object' && !Array.isArray(raw.addonMasks)) {
    for (const [id, value] of Object.entries(raw.addonMasks)) addonMasks[id] = Math.max(0, Math.min(3, Math.floor(Number(value) || 0)));
  }
  player.appearanceState = {
    selectedOutfitId,
    ownedOutfits:[...owned].slice(0,100),
    ownedAddons,
    addonMasks,
    colors:{
      head:cleanColor(raw.colors?.head, DEFAULT_COLORS.head),
      primary:cleanColor(raw.colors?.primary, DEFAULT_COLORS.primary),
      secondary:cleanColor(raw.colors?.secondary, DEFAULT_COLORS.secondary),
      detail:cleanColor(raw.colors?.detail, DEFAULT_COLORS.detail),
    },
  };
  return player.appearanceState;
}

function catalogEntry(raw) {
  return {
    id:raw.id, name:raw.name, icon:raw.icon || '🧑', style:raw.style || 'citizen',
    price:Math.max(0,Math.floor(Number(raw.price)||0)), levelRequired:Math.max(1,Math.floor(Number(raw.levelRequired)||1)),
    addon1Name:raw.addon1Name || '', addon2Name:raw.addon2Name || '', addonPrice:Math.max(0,Math.floor(Number(raw.addonPrice)||0)),
  };
}

class AppearanceSystem {
  initializePlayer(player, contentDB) { player.appearanceState = null; return ensure(player, contentDB); }
  restorePlayer(player, saved, contentDB) { player.appearanceState = saved && typeof saved === 'object' ? saved : null; return ensure(player, contentDB); }
  exportState(player, contentDB) { const state=ensure(player,contentDB); return JSON.parse(JSON.stringify(state)); }

  publicAppearance(player, contentDB) {
    const state = ensure(player, contentDB);
    const outfit = contentDB.get('outfits').find(entry => entry.id === state.selectedOutfitId);
    return { outfit: outfit ? catalogEntry(outfit) : { id:state.selectedOutfitId, name:state.selectedOutfitId, icon:'🧑', style:'citizen' }, colors:{...state.colors}, addonMask:state.addonMasks[state.selectedOutfitId] || 0 };
  }

  snapshot(player, contentDB) {
    const state=ensure(player,contentDB);
    return {
      selectedOutfitId:state.selectedOutfitId, ownedOutfits:[...state.ownedOutfits], ownedAddons:JSON.parse(JSON.stringify(state.ownedAddons)), addonMasks:{...state.addonMasks}, colors:{...state.colors},
      catalog:contentDB.get('outfits').map(catalogEntry),
      public:this.publicAppearance(player,contentDB),
    };
  }

  handle(player, payload, contentDB) {
    const state=ensure(player,contentDB);
    const action=cleanId(payload?.action);
    const outfitId=cleanId(payload?.outfitId);
    const outfit=contentDB.get('outfits').find(entry=>entry.id===outfitId);
    if (action==='select') {
      if (!outfit || !state.ownedOutfits.includes(outfitId)) return {ok:false,error:'Outfit is not unlocked.'};
      state.selectedOutfitId=outfitId; return {ok:true,action,outfitId};
    }
    if (action==='buy') {
      if (!outfit) return {ok:false,error:'Unknown outfit.'};
      if (state.ownedOutfits.includes(outfitId)) return {ok:false,error:'Outfit already unlocked.'};
      const level=Math.max(1,Math.floor(Number(outfit.levelRequired)||1));
      const price=Math.max(0,Math.floor(Number(outfit.price)||0));
      if (player.level<level) return {ok:false,error:`Requires level ${level}.`};
      if (player.gold<price) return {ok:false,error:'Not enough gold.'};
      player.gold-=price; state.ownedOutfits.push(outfitId); state.selectedOutfitId=outfitId; return {ok:true,action,outfitId,spent:price};
    }
    if (action==='colors') {
      const colors=payload?.colors && typeof payload.colors==='object' ? payload.colors : {};
      for (const key of ['head','primary','secondary','detail']) {
        if (colors[key] !== undefined && !HEX.test(String(colors[key]))) return {ok:false,error:'Invalid outfit color.'};
      }
      state.colors={
        head:cleanColor(colors.head,state.colors.head), primary:cleanColor(colors.primary,state.colors.primary),
        secondary:cleanColor(colors.secondary,state.colors.secondary), detail:cleanColor(colors.detail,state.colors.detail),
      };
      return {ok:true,action};
    }
    if (action==='buy_addon') {
      const addon=Math.floor(Number(payload?.addon));
      if (!outfit || !state.ownedOutfits.includes(outfitId) || (addon!==1&&addon!==2)) return {ok:false,error:'Invalid outfit addon.'};
      const label=addon===1?outfit.addon1Name:outfit.addon2Name;
      if (!label) return {ok:false,error:'This outfit has no such addon.'};
      const owned=state.ownedAddons[outfitId] || [];
      if (owned.includes(addon)) return {ok:false,error:'Addon already unlocked.'};
      const price=Math.max(0,Math.floor(Number(outfit.addonPrice)||0));
      if (player.gold<price) return {ok:false,error:'Not enough gold.'};
      player.gold-=price; state.ownedAddons[outfitId]=[...owned,addon]; state.addonMasks[outfitId]=(state.addonMasks[outfitId]||0)|(addon===1?1:2);
      return {ok:true,action,outfitId,addon,spent:price};
    }
    if (action==='toggle_addon') {
      const addon=Math.floor(Number(payload?.addon));
      if (!outfit || state.selectedOutfitId!==outfitId || (addon!==1&&addon!==2)) return {ok:false,error:'Invalid addon selection.'};
      if (!(state.ownedAddons[outfitId]||[]).includes(addon)) return {ok:false,error:'Addon is not unlocked.'};
      const bit=addon===1?1:2; state.addonMasks[outfitId]=(state.addonMasks[outfitId]||0)^bit;
      return {ok:true,action,outfitId,addon};
    }
    return {ok:false,error:'Unknown appearance action.'};
  }
}

export const appearanceSystem = new AppearanceSystem();
export { AppearanceSystem, DEFAULT_COLORS };
''')

write('server/engine/MountSystem.mjs', r'''const cleanId = value => typeof value === 'string' ? value.trim().slice(0,100) : '';

function ensure(player, contentDB) {
  const known=new Set(contentDB.get('mounts').map(entry=>entry.id));
  const raw=player.mountState && typeof player.mountState==='object' && !Array.isArray(player.mountState) ? player.mountState : {};
  const owned=new Set(Array.isArray(raw.ownedMounts)?raw.ownedMounts.filter(id=>typeof id==='string'&&known.has(id)):[]);
  // Legacy compatibility: a character that was saved mounted before 9.2 keeps a horse.
  if (player.mounted && owned.size===0 && known.has('horse')) owned.add('horse');
  let selectedId=known.has(raw.selectedId)&&owned.has(raw.selectedId)?raw.selectedId:'';
  if (!selectedId && player.mountId && known.has(player.mountId) && owned.has(player.mountId)) selectedId=player.mountId;
  if (!selectedId && owned.size) selectedId=[...owned][0];
  if (player.mounted && !selectedId) player.mounted=false;
  player.mountState={ownedMounts:[...owned].slice(0,100),selectedId};
  player.mountId=selectedId || undefined;
  return player.mountState;
}

function publicMountRecord(raw) {
  if (!raw) return null;
  return { id:raw.id,name:raw.name,icon:raw.icon||'🐎',color:raw.color||'#8b6f47',speedBonus:Math.max(0,Math.min(50,Number(raw.speedBonus)||0)),levelRequired:Math.max(1,Math.floor(Number(raw.levelRequired)||1)),price:Math.max(0,Math.floor(Number(raw.price)||0)),description:raw.description||'' };
}

class MountSystem {
  initializePlayer(player, contentDB){ player.mountState=null; player.mountId=undefined; player.mounted=false; return ensure(player,contentDB); }
  restorePlayer(player,saved,contentDB){ player.mountState=saved&&typeof saved==='object'?saved:null; return ensure(player,contentDB); }
  exportState(player,contentDB){ const state=ensure(player,contentDB); return {ownedMounts:[...state.ownedMounts],selectedId:state.selectedId}; }
  selected(player,contentDB){ const state=ensure(player,contentDB); return contentDB.get('mounts').find(entry=>entry.id===state.selectedId)||null; }
  speedBonus(player,contentDB){ if(!player.mounted) return 0; return publicMountRecord(this.selected(player,contentDB))?.speedBonus||0; }
  publicMount(player,contentDB){ if(!player.mounted) return null; return publicMountRecord(this.selected(player,contentDB)); }
  snapshot(player,contentDB){ const state=ensure(player,contentDB); return {ownedMounts:[...state.ownedMounts],selectedId:state.selectedId,mounted:Boolean(player.mounted),catalog:contentDB.get('mounts').map(publicMountRecord)}; }

  handle(player,payload,contentDB){
    const state=ensure(player,contentDB); const action=cleanId(payload?.action)||'toggle'; const mountId=cleanId(payload?.mountId)||state.selectedId;
    const mount=contentDB.get('mounts').find(entry=>entry.id===mountId); const pub=publicMountRecord(mount);
    if(action==='buy'){
      if(!pub) return {ok:false,error:'Unknown mount.'};
      if(state.ownedMounts.includes(pub.id)) return {ok:false,error:'Mount already owned.'};
      if(player.level<pub.levelRequired) return {ok:false,error:`Requires level ${pub.levelRequired}.`};
      if(player.gold<pub.price) return {ok:false,error:'Not enough gold.'};
      player.gold-=pub.price; state.ownedMounts.push(pub.id); state.selectedId=pub.id; player.mountId=pub.id; return {ok:true,action,mount:pub,spent:pub.price};
    }
    if(action==='select'){
      if(!pub||!state.ownedMounts.includes(pub.id)) return {ok:false,error:'Mount is not owned.'};
      if(player.level<pub.levelRequired) return {ok:false,error:`Requires level ${pub.levelRequired}.`};
      state.selectedId=pub.id; player.mountId=pub.id; return {ok:true,action,mount:pub};
    }
    if(action==='toggle'){
      const selected=publicMountRecord(this.selected(player,contentDB));
      if(!player.mounted){
        if(!selected||!state.ownedMounts.includes(selected.id)) return {ok:false,error:'Select an owned mount first.'};
        if(player.level<selected.levelRequired) return {ok:false,error:`Requires level ${selected.levelRequired}.`};
        player.mounted=true; player.mountId=selected.id; return {ok:true,action,mounted:true,mount:selected};
      }
      player.mounted=false; return {ok:true,action,mounted:false,mount:selected};
    }
    return {ok:false,error:'Unknown mount action.'};
  }
}

export const mountSystem=new MountSystem();
export { MountSystem, publicMountRecord };
''')

write('server/engine/TibiaTaskEngine.mjs', r'''import { objectiveKey } from './ContentIntegrity.mjs';

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
''')

write('server/engine/HousingSystem.mjs', r'''import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { contentDB as defaultContentDB } from './ContentDB.mjs';
import { isGmCharacter } from './ContentAccess.mjs';

const __filename=fileURLToPath(import.meta.url); const __dirname=path.dirname(__filename);
const DEFAULT_FILE=process.env.MORIA_HOUSING_DB||path.join(__dirname,'..','moria-housing.json');
const WEEK=7*24*60*60*1000; const GRACE=14*24*60*60*1000;
const cleanName=value=>typeof value==='string'?value.trim().slice(0,80):''; const keyName=value=>cleanName(value).toLowerCase();
const cleanId=value=>typeof value==='string'?value.trim().slice(0,100):'';

function blank(){return{version:1,houses:{}};}
function inside(def,x,y){return Number.isInteger(x)&&Number.isInteger(y)&&x>=Number(def.x)&&x<Number(def.x)+Number(def.width)&&y>=Number(def.y)&&y<Number(def.y)+Number(def.height);}
function publicDef(def){return{id:def.id,name:def.name,mapId:def.mapId,x:Number(def.x),y:Number(def.y),width:Number(def.width),height:Number(def.height),entranceX:Number(def.entranceX),entranceY:Number(def.entranceY),price:Math.max(0,Math.floor(Number(def.price)||0)),weeklyRent:Math.max(0,Math.floor(Number(def.weeklyRent)||0)),levelRequired:Math.max(1,Math.floor(Number(def.levelRequired)||1)),style:def.style||'cottage'};}

export class HousingSystem{
  constructor(contentDB=defaultContentDB,file=DEFAULT_FILE){this.contentDB=contentDB;this.file=file;this.state=blank();this.load();}
  load(){if(!fs.existsSync(this.file))return false;try{const raw=JSON.parse(fs.readFileSync(this.file,'utf8'));if(raw&&typeof raw==='object'&&!Array.isArray(raw)){this.state={version:1,houses:raw.houses&&typeof raw.houses==='object'&&!Array.isArray(raw.houses)?raw.houses:{}};return true;}}catch(e){console.warn('⚠ Housing DB load failed:',e.message);}return false;}
  save(){const tmp=`${this.file}.tmp`;try{fs.mkdirSync(path.dirname(this.file),{recursive:true});fs.writeFileSync(tmp,JSON.stringify(this.state,null,2));fs.renameSync(tmp,this.file);return true;}catch(e){try{fs.rmSync(tmp,{force:true});}catch{}console.warn('⚠ Housing DB save failed:',e.message);return false;}}
  defs(contentDB=this.contentDB){return contentDB.get('houses');}
  record(id){const key=cleanId(id);return this.state.houses[key]||null;}
  ownedBy(name){const wanted=keyName(name);for(const [id,record] of Object.entries(this.state.houses))if(keyName(record?.ownerName)===wanted)return id;return '';}
  houseAt(mapId,x,y,contentDB=this.contentDB){return this.defs(contentDB).find(def=>def.mapId===mapId&&inside(def,x,y))||null;}
  hasAccess(player,def,contentDB=this.contentDB){if(!def)return true;if(isGmCharacter(contentDB,player))return true;const rec=this.record(def.id);if(!rec?.ownerName)return false;const name=keyName(player?.name);if(name===keyName(rec.ownerName))return true;return [...(rec.subowners||[]),...(rec.guests||[])].some(entry=>keyName(entry)===name);}
  canStep(player,mapId,x,y,contentDB=this.contentDB){const def=this.houseAt(mapId,x,y,contentDB);return !def||this.hasAccess(player,def,contentDB);}
  nearEntrance(player,def){return player?.mapId===def?.mapId&&Math.abs(Number(player.x)-Number(def.entranceX))+Math.abs(Number(player.y)-Number(def.entranceY))<=2;}
  maintainPlayer(player,contentDB=this.contentDB,now=Date.now()){const id=this.ownedBy(player?.name);if(!id)return false;const rec=this.record(id);if(rec&&Number(rec.rentDueAt)>0&&now>Number(rec.rentDueAt)+GRACE){delete this.state.houses[id];this.save();return true;}return false;}
  buy(player,houseId,contentDB=this.contentDB,now=Date.now()){const def=this.defs(contentDB).find(entry=>entry.id===cleanId(houseId));if(!def)return{ok:false,error:'Unknown house.'};if(this.record(def.id)?.ownerName)return{ok:false,error:'House already owned.'};if(this.ownedBy(player.name))return{ok:false,error:'A character may own only one house.'};if(!this.nearEntrance(player,def))return{ok:false,error:'Stand near the house door to buy it.'};const d=publicDef(def);if(player.level<d.levelRequired)return{ok:false,error:`Requires level ${d.levelRequired}.`};if(player.gold<d.price)return{ok:false,error:'Not enough gold.'};player.gold-=d.price;this.state.houses[d.id]={ownerName:player.name,purchasedAt:now,rentDueAt:now+WEEK,guests:[],subowners:[],decor:[]};this.save();return{ok:true,action:'buy',house:d,spent:d.price};}
  release(player,houseId,contentDB=this.contentDB){const id=cleanId(houseId),rec=this.record(id);if(!rec||keyName(rec.ownerName)!==keyName(player.name))return{ok:false,error:'Only the owner can release this house.'};delete this.state.houses[id];this.save();return{ok:true,action:'release',houseId:id};}
  payRent(player,houseId,contentDB=this.contentDB,now=Date.now()){const def=this.defs(contentDB).find(entry=>entry.id===cleanId(houseId)),rec=def?this.record(def.id):null;if(!def||!rec||keyName(rec.ownerName)!==keyName(player.name))return{ok:false,error:'Only the owner can pay rent.'};const rent=Math.max(0,Math.floor(Number(def.weeklyRent)||0));const total=Math.max(0,Number(player.bankGold)||0)+Math.max(0,Number(player.gold)||0);if(total<rent)return{ok:false,error:'Not enough gold for rent.'};const fromBank=Math.min(Math.max(0,Number(player.bankGold)||0),rent);player.bankGold-=fromBank;player.gold-=rent-fromBank;rec.rentDueAt=Math.max(now,Number(rec.rentDueAt)||now)+WEEK;this.save();return{ok:true,action:'pay_rent',houseId:def.id,spent:rent,rentDueAt:rec.rentDueAt};}
  guest(player,houseId,name,add=true){const id=cleanId(houseId),rec=this.record(id);if(!rec||keyName(rec.ownerName)!==keyName(player.name))return{ok:false,error:'Only the owner can edit the guest list.'};const guest=cleanName(name);if(!guest||keyName(guest)===keyName(player.name))return{ok:false,error:'Invalid guest name.'};const list=Array.isArray(rec.guests)?rec.guests:[];const filtered=list.filter(entry=>keyName(entry)!==keyName(guest));if(add){if(filtered.length>=30)return{ok:false,error:'Guest list is full.'};filtered.push(guest);}rec.guests=filtered;this.save();return{ok:true,action:add?'guest_add':'guest_remove',houseId:id,guest};}
  decorate(player,payload,contentDB=this.contentDB){const id=cleanId(payload?.houseId),rec=this.record(id),def=this.defs(contentDB).find(entry=>entry.id===id);if(!def||!rec||!this.hasAccess(player,def,contentDB))return{ok:false,error:'You cannot decorate this house.'};const owner=keyName(rec.ownerName)===keyName(player.name),sub=(rec.subowners||[]).some(name=>keyName(name)===keyName(player.name));if(!owner&&!sub)return{ok:false,error:'Guests cannot move furniture.'};if(payload?.action==='decor_remove'){const placementId=cleanId(payload?.placementId);const before=(rec.decor||[]).length;rec.decor=(rec.decor||[]).filter(entry=>entry.id!==placementId);if(rec.decor.length===before)return{ok:false,error:'Decoration not found.'};this.save();return{ok:true,action:'decor_remove',placementId};}
    const decor=contentDB.get('housingDecor').find(entry=>entry.id===cleanId(payload?.decorId));if(!decor)return{ok:false,error:'Unknown decoration.'};const x=Math.floor(Number(payload?.x)),y=Math.floor(Number(payload?.y));if(player.mapId!==def.mapId||!inside(def,x,y))return{ok:false,error:'Decoration must be placed inside the house.'};if((rec.decor||[]).length>=50)return{ok:false,error:'House decoration limit reached.'};const price=Math.max(0,Math.floor(Number(decor.price)||0));if(player.gold<price)return{ok:false,error:'Not enough gold.'};player.gold-=price;const placement={id:`decor_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`,decorId:decor.id,x,y};rec.decor=[...(rec.decor||[]),placement];this.save();return{ok:true,action:'decor_add',placement,spent:price};}
  handle(player,payload,contentDB=this.contentDB){const action=cleanId(payload?.action);if(action==='buy')return this.buy(player,payload?.houseId,contentDB);if(action==='release')return this.release(player,payload?.houseId,contentDB);if(action==='pay_rent')return this.payRent(player,payload?.houseId,contentDB);if(action==='guest_add')return this.guest(player,payload?.houseId,payload?.name,true);if(action==='guest_remove')return this.guest(player,payload?.houseId,payload?.name,false);if(action==='decor_add'||action==='decor_remove')return this.decorate(player,payload,contentDB);return{ok:false,error:'Unknown housing action.'};}
  snapshot(player,contentDB=this.contentDB){this.maintainPlayer(player,contentDB);const mapId=player?.mapId;const ownedId=this.ownedBy(player?.name);const houses=this.defs(contentDB).filter(def=>def.mapId===mapId).map(def=>{const d=publicDef(def),rec=this.record(d.id);const own=keyName(rec?.ownerName)===keyName(player?.name);return{...d,ownerName:rec?.ownerName||'',rentDueAt:Number(rec?.rentDueAt)||0,access:this.hasAccess(player,def,contentDB),guests:own?[...(rec?.guests||[])]:undefined,decor:(rec?.decor||[]).map(place=>{const item=contentDB.get('housingDecor').find(entry=>entry.id===place.decorId);return{...place,name:item?.name||place.decorId,icon:item?.icon||'📦',color:item?.color||'#d9bd7a'};})};});return{ownedHouseId:ownedId,houses,decorCatalog:contentDB.get('housingDecor').map(entry=>({id:entry.id,name:entry.name,icon:entry.icon||'📦',kind:entry.kind||'decor',color:entry.color||'#d9bd7a',price:Math.max(0,Math.floor(Number(entry.price)||0))}))};}
}

export const housingSystem=new HousingSystem(defaultContentDB);
export { WEEK as HOUSING_RENT_PERIOD_MS, GRACE as HOUSING_RENT_GRACE_MS };
''')

# ContentDB v3 collections and seed/migration.
replace_once('server/engine/ContentDB.mjs', "import { ALPHA_CONTENT } from './AlphaContent.mjs';", "import { ALPHA_CONTENT } from './AlphaContent.mjs';\nimport { ALPHA_SYSTEMS_CONTENT } from './AlphaSystemsContent.mjs';")
replace_once('server/engine/ContentDB.mjs', "const COLLECTION_KEYS = Object.freeze(['items', 'monsters', 'npcs', 'quests', 'spells', 'maps', 'worldEvents', 'shops', 'lootTables', 'gmRoster']);", "const COLLECTION_KEYS = Object.freeze(['items', 'monsters', 'npcs', 'quests', 'spells', 'maps', 'worldEvents', 'shops', 'lootTables', 'gmRoster', 'taskQuests', 'houses', 'housingDecor', 'outfits', 'mounts']);")
replace_once('server/engine/ContentDB.mjs', "worldEvents: [], shops: [], lootTables: [], gmRoster: [],", "worldEvents: [], shops: [], lootTables: [], gmRoster: [], taskQuests: [], houses: [], housingDecor: [], outfits: [], mounts: [],")
replace_once('server/engine/ContentDB.mjs', "if (!this.load()) this.seedDefaults();\n    else this.migrateAlphaV2();", "if (!this.load()) this.seedDefaults();\n    else { this.migrateAlphaV2(); this.migrateAlphaV3(); }")
replace_once('server/engine/ContentDB.mjs', "  save() {", r'''  migrateAlphaV3() {
    if (Number(this.data.version) >= 3) return false;
    const hasExistingContent = COLLECTION_KEYS.some(key => Array.isArray(this.data[key]) && this.data[key].length > 0);
    if (hasExistingContent) {
      this.data.npcs = mergeById(ALPHA_SYSTEMS_CONTENT.npcs, this.data.npcs);
      this.data.taskQuests = mergeById(ALPHA_SYSTEMS_CONTENT.taskQuests, this.data.taskQuests);
      this.data.houses = mergeById(ALPHA_SYSTEMS_CONTENT.houses, this.data.houses);
      this.data.housingDecor = mergeById(ALPHA_SYSTEMS_CONTENT.housingDecor, this.data.housingDecor);
      this.data.outfits = mergeById(ALPHA_SYSTEMS_CONTENT.outfits, this.data.outfits);
      this.data.mounts = mergeById(ALPHA_SYSTEMS_CONTENT.mounts, this.data.mounts);
    }
    this.data.version = 3;
    this.save();
    return true;
  }

  save() {''')
replace_once('server/engine/ContentDB.mjs', "    this.data.gmRoster = mergeById(this.data.gmRoster, ALPHA_CONTENT.gmRoster);\n    this.data.version = 2;", "    this.data.gmRoster = mergeById(this.data.gmRoster, ALPHA_CONTENT.gmRoster);\n    this.data.npcs = mergeById(this.data.npcs, ALPHA_SYSTEMS_CONTENT.npcs);\n    this.data.taskQuests = mergeById(this.data.taskQuests, ALPHA_SYSTEMS_CONTENT.taskQuests);\n    this.data.houses = mergeById(this.data.houses, ALPHA_SYSTEMS_CONTENT.houses);\n    this.data.housingDecor = mergeById(this.data.housingDecor, ALPHA_SYSTEMS_CONTENT.housingDecor);\n    this.data.outfits = mergeById(this.data.outfits, ALPHA_SYSTEMS_CONTENT.outfits);\n    this.data.mounts = mergeById(this.data.mounts, ALPHA_SYSTEMS_CONTENT.mounts);\n    this.data.version = 3;")

# Content Studio catalogs and validation.
replace_once('server/engine/ContentStudio.mjs', "const NPC_ROLES = Object.freeze(['merchant', 'banker', 'innkeeper', 'trainer', 'guard', 'healer', 'quest']);", "const NPC_ROLES = Object.freeze(['merchant', 'banker', 'innkeeper', 'trainer', 'guard', 'healer', 'quest', 'taskmaster', 'stablemaster', 'outfitter', 'realtor']);")
replace_once('server/engine/ContentStudio.mjs', "  gmRoster: Object.freeze([\n    field('id', 'ID'), field('name', 'Character name'), field('note', 'GM note', 'textarea'),\n  ]),", r'''  gmRoster: Object.freeze([
    field('id', 'ID'), field('name', 'Character name'), field('note', 'GM note', 'textarea'),
  ]),
  taskQuests: Object.freeze([
    field('id','ID'), field('name','Name'), field('npcId','Task master','select',{optionKey:'npcs'}), field('mapId','Map','select',{optionKey:'maps'}),
    field('description','Description','textarea'), field('target','Monster target'), field('targetName','Target label'), field('count','Kills','number'),
    field('minLevel','Min level','number'), field('maxLevel','Max level','number'), field('repeatLimit','Repeat limit','number'), field('taskPoints','Task points','number'),
    field('rewardGold','Reward gold','number'), field('rewardXp','Reward XP','number'), field('bossUnlock','Boss unlock ID'),
  ]),
  houses: Object.freeze([
    field('id','ID'), field('name','Name'), field('mapId','Map','select',{optionKey:'maps'}), field('style','Style'),
    field('x','Interior X','number'), field('y','Interior Y','number'), field('width','Width','number'), field('height','Height','number'),
    field('entranceX','Door X','number'), field('entranceY','Door Y','number'), field('price','Purchase price','number'), field('weeklyRent','Weekly rent','number'), field('levelRequired','Required level','number'),
  ]),
  housingDecor: Object.freeze([
    field('id','ID'), field('name','Name'), field('icon','Icon'), field('kind','Kind'), field('color','Color'), field('price','Price','number'),
  ]),
  outfits: Object.freeze([
    field('id','ID'), field('name','Name'), field('icon','Icon'), field('style','Renderer style'), field('price','Price','number'), field('levelRequired','Required level','number'),
    field('defaultUnlocked','Default unlocked','boolean'), field('addon1Name','Addon 1'), field('addon2Name','Addon 2'), field('addonPrice','Addon price','number'),
  ]),
  mounts: Object.freeze([
    field('id','ID'), field('name','Name'), field('icon','Icon'), field('color','Color'), field('description','Description','textarea'),
    field('speedBonus','Speed bonus %','number'), field('price','Price','number'), field('levelRequired','Required level','number'),
  ]),''')
replace_once('server/engine/ContentStudio.mjs', "  if (type === 'maps') {", r'''  if (type === 'taskQuests') {
    if (!String(record.target || '').trim()) return 'target is required';
    for (const [key,min,max] of [['count',1,1000000],['minLevel',1,100000],['maxLevel',1,100000],['repeatLimit',1,1000],['taskPoints',0,100000],['rewardGold',0,100000000],['rewardXp',0,100000000]]) {
      const error=numberIn(record,key,min,max,{required:true,integer:true}); if(error)return error;
    }
    if (Number(record.maxLevel) < Number(record.minLevel)) return 'maxLevel cannot be lower than minLevel';
    return null;
  }

  if (type === 'houses') {
    for (const key of ['x','y','entranceX','entranceY']) { const error=playableCoord(record,key); if(error)return error; }
    for (const [key,min,max] of [['width',2,12],['height',2,12],['price',0,100000000],['weeklyRent',0,10000000],['levelRequired',1,100000]]) { const error=numberIn(record,key,min,max,{required:true,integer:true}); if(error)return error; }
    if (Number(record.x)+Number(record.width)>MAP_WIDTH-1 || Number(record.y)+Number(record.height)>MAP_HEIGHT-1) return 'house interior exceeds map bounds';
    return null;
  }

  if (type === 'housingDecor') { const e=numberIn(record,'price',0,100000000,{required:true,integer:true}); return e||optionalColor(record); }
  if (type === 'outfits') {
    let e=numberIn(record,'price',0,100000000,{required:true,integer:true}); if(e)return e;
    e=numberIn(record,'levelRequired',1,100000,{required:true,integer:true}); if(e)return e;
    return numberIn(record,'addonPrice',0,100000000,{required:true,integer:true});
  }
  if (type === 'mounts') {
    let e=numberIn(record,'speedBonus',0,50,{required:true}); if(e)return e;
    e=numberIn(record,'price',0,100000000,{required:true,integer:true}); if(e)return e;
    e=numberIn(record,'levelRequired',1,100000,{required:true,integer:true}); if(e)return e;
    return optionalColor(record);
  }

  if (type === 'maps') {''')
replace_once('server/engine/ContentStudio.mjs', "    gmRoster: 'Characters listed here may enter maps whose access is set to gm. This is server-enforced.',", "    gmRoster: 'Characters listed here may enter maps whose access is set to gm. This is server-enforced.',\n    taskQuests: 'Tibia-style tasks are persistent, repeatable, award task points/rank and progress only from authoritative monster kills.',\n    houses: 'House geometry, price and rent are admin content; ownership, guests and decoration are global server state.',\n    housingDecor: 'Decor can be purchased and placed only inside an accessible owned house.',\n    outfits: 'Outfits and addons are unlockable appearance content rendered for nearby players.',\n    mounts: 'Mount ownership, selection and speed are server authoritative; this catalog controls stable inventory.',")

# Reference integrity.
replace_once('server/engine/ContentIntegrity.mjs', "  if (type === 'spells') {", r'''  if (type === 'taskQuests') {
    const npcId=typeof record.npcId==='string'?record.npcId.trim():'';
    if(!contentDB.get('npcs').some(npc=>npc.id===npcId)) return `Task references unknown NPC: ${npcId || '(empty)'}`;
    const mapId=typeof record.mapId==='string'?record.mapId.trim():'';
    if(!hasMap(contentDB,mapId)) return `Task references unknown map: ${mapId || '(empty)'}`;
    const wanted=objectiveKey(record.target); const match=contentDB.get('monsters').some(monster=>objectiveKey(monster.id)===wanted||objectiveKey(monster.name)===wanted);
    if(!match) return `Task references unknown monster target: ${record.target || '(empty)'}`;
  }

  if (type === 'houses') {
    const mapId=typeof record.mapId==='string'?record.mapId.trim():'';
    if(!hasMap(contentDB,mapId)) return `House references unknown map: ${mapId || '(empty)'}`;
  }

  if (type === 'spells') {''')
replace_once('server/engine/ContentIntegrity.mjs', "    for (const shop of contentDB.get('shops')) if (shop.npcId === canonicalId) blockers.push({ type: 'shop', id: shop.id, field: 'npcId' });", "    for (const shop of contentDB.get('shops')) if (shop.npcId === canonicalId) blockers.push({ type: 'shop', id: shop.id, field: 'npcId' });\n    for (const task of contentDB.get('taskQuests')) if (task.npcId === canonicalId) blockers.push({ type: 'taskQuest', id: task.id, field: 'npcId' });")
replace_once('server/engine/ContentIntegrity.mjs', "      for (const quest of contentDB.get('quests')) if (targetKeys.has(objectiveKey(quest.target))) blockers.push({ type: 'quest', id: quest.id, field: 'target' });", "      for (const quest of contentDB.get('quests')) if (targetKeys.has(objectiveKey(quest.target))) blockers.push({ type: 'quest', id: quest.id, field: 'target' });\n      for (const task of contentDB.get('taskQuests')) if (targetKeys.has(objectiveKey(task.target))) blockers.push({ type: 'taskQuest', id: task.id, field: 'target' });")
replace_once('server/engine/ContentIntegrity.mjs', "    for (const event of contentDB.get('events')) if (event.mapId === canonicalId) blockers.push({ type: 'event', id: event.id, field: 'mapId' });", "    for (const event of contentDB.get('events')) if (event.mapId === canonicalId) blockers.push({ type: 'event', id: event.id, field: 'mapId' });\n    for (const task of contentDB.get('taskQuests')) if (task.mapId === canonicalId) blockers.push({ type: 'taskQuest', id: task.id, field: 'mapId' });\n    for (const house of contentDB.get('houses')) if (house.mapId === canonicalId) blockers.push({ type: 'house', id: house.id, field: 'mapId' });")
replace_once('server/engine/ContentIntegrity.mjs', "const AUDIT_TYPES = Object.freeze(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events', 'shops', 'lootTables', 'gmRoster']);", "const AUDIT_TYPES = Object.freeze(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events', 'shops', 'lootTables', 'gmRoster', 'taskQuests', 'houses', 'housingDecor', 'outfits', 'mounts']);")

# GameState system integration.
replace_once('server/engine/GameState.mjs', "import { canAccessMap, explainMapAccess } from './ContentAccess.mjs';", "import { canAccessMap, explainMapAccess } from './ContentAccess.mjs';\nimport { tibiaTaskEngine } from './TibiaTaskEngine.mjs';\nimport { appearanceSystem } from './AppearanceSystem.mjs';\nimport { mountSystem } from './MountSystem.mjs';\nimport { housingSystem } from './HousingSystem.mjs';")
replace_once('server/engine/GameState.mjs', "      mounted: false, professions: {}, reputation: { town: 0 }, talents: {},\n      adventure: createAdventureState(),", "      mounted: false, mountId: undefined, mountState: null, appearanceState: null, taskState: null, professions: {}, reputation: { town: 0 }, talents: {},\n      adventure: createAdventureState(),")
replace_once('server/engine/GameState.mjs', "    this.players.set(id, player);\n    return player;", "    appearanceSystem.initializePlayer(player, contentDB);\n    mountSystem.initializePlayer(player, contentDB);\n    tibiaTaskEngine.initializePlayer(player, contentDB);\n    housingSystem.maintainPlayer(player, contentDB);\n    this.players.set(id, player);\n    return player;")
replace_once('server/engine/GameState.mjs', "  getPlayersOnMap(mapId) {\n    const result = [];\n    for (const p of this.players.values()) if (p.mapId === mapId) result.push(p);\n    return result;\n  }", r'''  getPlayersOnMap(mapId) {
    const result = [];
    for (const p of this.players.values()) if (p.mapId === mapId) result.push(p);
    return result;
  }

  isNearContentNpc(player, idOrRole, range = 2) {
    const wanted = typeof idOrRole === 'string' ? idOrRole.trim() : '';
    if (!wanted) return false;
    return contentDB.get('npcs').some(npc => npc && npc.mapId === player.mapId
      && (npc.id === wanted || npc.role === wanted)
      && Number.isFinite(Number(npc.posX)) && Number.isFinite(Number(npc.posY))
      && Math.abs(Number(npc.posX) - player.x) + Math.abs(Number(npc.posY) - player.y) <= range);
  }''')
replace_once('server/engine/GameState.mjs', "      case 'mount': return this.handleMount(player);", "      case 'mount': return this.handleMount(player, payload);\n      case 'appearance': return this.handleAppearance(player, payload);\n      case 'task': return this.handleTask(player, payload);\n      case 'housing': return this.handleHousing(player, payload);")
replace_once('server/engine/GameState.mjs', "    const moveBonus = boundedNumber(movementStats.moveSpeed, 0, 50, 0);\n    const moveCooldown = Math.max(50, Math.floor(100 * (1 - moveBonus / 100)));", "    const moveBonus = boundedNumber(movementStats.moveSpeed + mountSystem.speedBonus(player, contentDB), 0, 70, 0);\n    const moveCooldown = Math.max(35, Math.floor(100 * (1 - moveBonus / 100)));")
replace_once('server/engine/GameState.mjs', "    if (!map.tiles?.[ny]?.[nx]?.walkable) return false;", "    if (!map.tiles?.[ny]?.[nx]?.walkable) return false;\n    if (!housingSystem.canStep(player, player.mapId, nx, ny, contentDB)) return false;")
regex_once('server/engine/GameState.mjs', r"  handleMount\(player\) \{.*?\n  \}\n\n  handleTalent\(player, payload\)", r'''  handleMount(player, payload = {}) {
    const action = typeof payload.action === 'string' ? payload.action : 'toggle';
    if (action === 'buy' && !this.isNearContentNpc(player, 'stablemaster')) {
      this.emitEvent(player.mapId, { kind:'system', targetId:player.id, text:'Visit a stablemaster to buy mounts.', color:'#d9bd7a' });
      return false;
    }
    const result = mountSystem.handle(player, { ...payload, action }, contentDB);
    if (!result.ok) {
      this.emitEvent(player.mapId, { kind:'system', targetId:player.id, text:result.error || 'Mount action rejected.', color:'#ff9090' });
      return false;
    }
    this.emitEvent(player.mapId, { kind:'mount_update', targetId:player.id, text: result.mounted === false ? 'Dismounted.' : result.mount ? `${result.mount.name} ready.` : 'Mount updated.', color:result.mount?.color || '#d9bd7a' });
    return true;
  }

  handleAppearance(player, payload) {
    const action = typeof payload.action === 'string' ? payload.action : '';
    if ((action === 'buy' || action === 'buy_addon') && !this.isNearContentNpc(player, 'outfitter')) {
      this.emitEvent(player.mapId, { kind:'system', targetId:player.id, text:'Visit an outfitter to unlock outfits and addons.', color:'#d49bc8' });
      return false;
    }
    const result = appearanceSystem.handle(player, payload, contentDB);
    if (!result.ok) { this.emitEvent(player.mapId, { kind:'system', targetId:player.id, text:result.error || 'Appearance action rejected.', color:'#ff9090' }); return false; }
    this.emitEvent(player.mapId, { kind:'appearance_update', targetId:player.id, text:'Outfit updated.', color:'#d49bc8' });
    return true;
  }

  handleTask(player, payload) {
    const result = tibiaTaskEngine.handle(player, payload, contentDB, npcId => this.isNearContentNpc(player, npcId));
    if (!result.ok) { this.emitEvent(player.mapId, { kind:'system', targetId:player.id, text:result.error || 'Task action rejected.', color:'#ff9090' }); return false; }
    if (result.reward) {
      player.gold += result.reward.gold;
      player.xp += result.reward.xp;
      const voc = VOCATIONS[player.vocation];
      while (player.xp >= player.xpNext && voc) {
        player.xp -= player.xpNext; player.level++; player.xpNext = Math.floor(player.xpNext * 1.4);
        player.maxHp += voc.hpPerLevel; player.hp = player.maxHp; player.maxMana += voc.manaPerLevel; player.mana = player.maxMana;
        player.attack += voc.atkPerLevel; player.defense += voc.defPerLevel; player.magic += voc.magPerLevel; player.stats.levelUps++;
        this.emitEvent(player.mapId, { kind:'levelup', targetId:player.id, text:`LEVEL ${player.level}!`, color:'#f4e04d', pos:{x:player.x,y:player.y} });
      }
    }
    const text = result.action === 'claim' ? `${result.task.name} complete · +${result.reward.points} task points` : result.action === 'accept' ? `Task accepted: ${result.task.name}` : 'Task abandoned.';
    this.emitEvent(player.mapId, { kind:'task_update', targetId:player.id, text, color:'#d9bd7a' });
    return true;
  }

  handleHousing(player, payload) {
    const result = housingSystem.handle(player, payload, contentDB);
    if (!result.ok) { this.emitEvent(player.mapId, { kind:'system', targetId:player.id, text:result.error || 'Housing action rejected.', color:'#ff9090' }); return false; }
    this.emitEvent(player.mapId, { kind:'housing_update', targetId:player.id, text:'Housing updated.', color:'#d9bd7a' });
    return true;
  }

  handleTalent(player, payload)''')
replace_once('server/engine/GameState.mjs', "    const adventureKill = adventureEngine.onMonsterKill(player, monster);\n    const officialKill = officialSystems.onMonsterKill(player, monster);", "    const adventureKill = adventureEngine.onMonsterKill(player, monster);\n    const taskUpdates = tibiaTaskEngine.onMonsterKill(player, monster, contentDB);\n    for (const update of taskUpdates) {\n      this.emitEvent(player.mapId, { kind:update.ready ? 'task_ready' : 'task_progress', targetId:player.id, text:`${update.name}: ${update.current}/${update.needed}${update.ready ? ' · return to task master' : ''}`, color:update.ready ? '#f4e04d' : '#9bd4ff' });\n    }\n    const officialKill = officialSystems.onMonsterKill(player, monster);")
replace_once('server/engine/GameState.mjs', "      adventure: adventureEngine.serialize(player),", "      adventure: adventureEngine.serialize(player),\n      tasks: tibiaTaskEngine.snapshot(player, contentDB),\n      appearance: appearanceSystem.snapshot(player, contentDB),\n      mounts: mountSystem.snapshot(player, contentDB),\n      housing: housingSystem.snapshot(player, contentDB),")
replace_once('server/engine/GameState.mjs', "nearbyPlayers.push({ id: p.id, name: p.name, vocation: p.vocation, level: p.level, x: p.x, y: p.y, direction: p.direction, hp: p.hp, maxHp: pDerived.totalMaxHp, mounted: p.mounted, icon: voc?.icon, color: voc?.color, ...officialSystems.publicPvp(p) });", "nearbyPlayers.push({ id: p.id, name: p.name, vocation: p.vocation, level: p.level, x: p.x, y: p.y, direction: p.direction, hp: p.hp, maxHp: pDerived.totalMaxHp, mounted: p.mounted, mountId: p.mountId, mount: mountSystem.publicMount(p, contentDB), appearance: appearanceSystem.publicAppearance(p, contentDB), icon: voc?.icon, color: voc?.color, ...officialSystems.publicPvp(p) });")
replace_once('server/engine/GameState.mjs', "const privateKinds = new Set(['system', 'quest_progress', 'quest_complete', 'death', 'heal', 'xp', 'levelup', 'adventure_combo', 'adventure_progress', 'adventure_ready', 'adventure_claimed']);", "const privateKinds = new Set(['system', 'quest_progress', 'quest_complete', 'death', 'heal', 'xp', 'levelup', 'adventure_combo', 'adventure_progress', 'adventure_ready', 'adventure_claimed', 'task_update', 'task_progress', 'task_ready', 'housing_update', 'appearance_update', 'mount_update']);")

# Server persistence / admin types.
replace_once('server/server.js', "import { adventureEngine } from './engine/AdventureEngine.mjs';", "import { adventureEngine } from './engine/AdventureEngine.mjs';\nimport { tibiaTaskEngine } from './engine/TibiaTaskEngine.mjs';\nimport { appearanceSystem } from './engine/AppearanceSystem.mjs';\nimport { mountSystem } from './engine/MountSystem.mjs';\nimport { housingSystem } from './engine/HousingSystem.mjs';")
replace_once('server/server.js', "const ALLOWED_ADMIN_TYPES = new Set(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events', 'shops', 'lootTables', 'gmRoster']);", "const ALLOWED_ADMIN_TYPES = new Set(['items', 'monsters', 'npcs', 'spells', 'quests', 'maps', 'events', 'shops', 'lootTables', 'gmRoster', 'taskQuests', 'houses', 'housingDecor', 'outfits', 'mounts']);")
replace_once('server/server.js', "    adventure: adventureEngine.exportState(p),\n    official: officialSystems.exportPlayer(p),", "    adventure: adventureEngine.exportState(p),\n    tasks: tibiaTaskEngine.exportState(p, contentDB),\n    appearance: appearanceSystem.exportState(p, contentDB),\n    mounts: mountSystem.exportState(p, contentDB),\n    official: officialSystems.exportPlayer(p),")
replace_once('server/server.js', "  adventureEngine.restorePlayer(p, saved.adventure);", "  adventureEngine.restorePlayer(p, saved.adventure);\n  tibiaTaskEngine.restorePlayer(p, saved.tasks, contentDB);\n  appearanceSystem.restorePlayer(p, saved.appearance, contentDB);\n  mountSystem.restorePlayer(p, saved.mounts, contentDB);\n  housingSystem.maintainPlayer(p, contentDB);")

# Tests.
write('server/test/alpha-systems-9-2.test.mjs', r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ContentDB } from '../engine/ContentDB.mjs';
import { CONTENT_STUDIO_SCHEMAS, validateStudioRecord } from '../engine/ContentStudio.mjs';
import { TibiaTaskEngine } from '../engine/TibiaTaskEngine.mjs';
import { AppearanceSystem } from '../engine/AppearanceSystem.mjs';
import { MountSystem } from '../engine/MountSystem.mjs';
import { HousingSystem } from '../engine/HousingSystem.mjs';

function temp(){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moria-92-'));return{dir,file:path.join(dir,'content.json'),housing:path.join(dir,'housing.json')}};
function player(name='Alpha Tester'){return{name,level:40,gold:100000,bankGold:50000,mapId:'eldoria',x:42,y:43,mounted:false};}

test('9.2 content migration seeds admin-editable alpha life catalogs',()=>{const t=temp();try{const db=new ContentDB(t.file);assert.equal(db.data.version,3);for(const type of ['taskQuests','houses','housingDecor','outfits','mounts']){assert.ok(db.get(type).length>=10,type);assert.ok(CONTENT_STUDIO_SCHEMAS[type],type);for(const record of db.get(type))assert.equal(validateStudioRecord(type,record),null,`${type}:${record.id}`);}assert.ok(db.get('npcs').some(n=>n.role==='stablemaster'));assert.ok(db.get('npcs').some(n=>n.role==='outfitter'));assert.ok(db.get('npcs').some(n=>n.role==='taskmaster'));}finally{fs.rmSync(t.dir,{recursive:true,force:true});}});

test('Tibia task engine tracks three persistent tasks, points, rank and repeat limits',()=>{const t=temp();try{const db=new ContentDB(t.file),engine=new TibiaTaskEngine(),p=player();engine.initializePlayer(p,db);const near=id=>id==='task_master_eldoria';assert.equal(engine.accept(p,'task_rat_catcher',db,near).ok,true);assert.equal(engine.accept(p,'task_snake_charmer',db,near).ok,true);p.mapId='frostpeak';p.x=64;p.y=42;assert.equal(engine.accept(p,'task_wolf_hunter',db,id=>id==='task_master_frostpeak').ok,true);assert.equal(engine.accept(p,'task_bear_tracker',db,()=>true).ok,false);p.mapId='eldoria';for(let i=0;i<25;i++)engine.onMonsterKill(p,{name:'Rat',contentSourceId:'rat'},db);const snap=engine.snapshot(p,db);assert.equal(snap.active.find(x=>x.id==='task_rat_catcher').ready,true);const claimed=engine.claim(p,'task_rat_catcher',db,near);assert.equal(claimed.ok,true);assert.equal(claimed.reward.points,2);assert.equal(engine.exportState(p,db).points,2);}finally{fs.rmSync(t.dir,{recursive:true,force:true});}});

test('appearance ownership, colors and addons are authoritative and bounded',()=>{const t=temp();try{const db=new ContentDB(t.file),sys=new AppearanceSystem(),p=player();sys.initializePlayer(p,db);assert.ok(sys.snapshot(p,db).ownedOutfits.includes('citizen'));assert.equal(sys.handle(p,{action:'select',outfitId:'void_walker'},db).ok,false);const bought=sys.handle(p,{action:'buy',outfitId:'knight_regalia'},db);assert.equal(bought.ok,true);assert.equal(sys.handle(p,{action:'colors',colors:{primary:'#112233',head:'#d7a06b'}},db).ok,true);assert.equal(sys.handle(p,{action:'buy_addon',outfitId:'knight_regalia',addon:1},db).ok,true);const pub=sys.publicAppearance(p,db);assert.equal(pub.outfit.id,'knight_regalia');assert.equal(pub.colors.primary,'#112233');assert.equal(pub.addonMask&1,1);}finally{fs.rmSync(t.dir,{recursive:true,force:true});}});

test('mount system requires ownership and applies selected authoritative speed bonus',()=>{const t=temp();try{const db=new ContentDB(t.file),sys=new MountSystem(),p=player();sys.initializePlayer(p,db);assert.equal(sys.handle(p,{action:'toggle'},db).ok,false);assert.equal(sys.handle(p,{action:'buy',mountId:'horse'},db).ok,true);assert.equal(sys.handle(p,{action:'toggle'},db).ok,true);assert.equal(p.mounted,true);assert.equal(p.mountId,'horse');assert.equal(sys.speedBonus(p,db),20);assert.equal(sys.handle(p,{action:'select',mountId:'nightmare'},db).ok,false);assert.equal(sys.handle(p,{action:'toggle'},db).mounted,false);}finally{fs.rmSync(t.dir,{recursive:true,force:true});}});

test('housing ownership is global, access-controlled, rentable, decorated and persistent',()=>{const t=temp();try{const db=new ContentDB(t.file),sys=new HousingSystem(db,t.housing),owner=player('Owner'),guest=player('Guest');const def=db.get('houses').find(h=>h.id==='house_oakhearth');owner.x=def.entranceX;owner.y=def.entranceY;assert.equal(sys.buy(owner,def.id,db).ok,true);assert.equal(sys.canStep(guest,def.mapId,def.x,def.y,db),false);assert.equal(sys.guest(owner,def.id,'Guest',true).ok,true);assert.equal(sys.canStep(guest,def.mapId,def.x,def.y,db),true);owner.x=def.x;owner.y=def.y;assert.equal(sys.decorate(owner,{action:'decor_add',houseId:def.id,decorId:'decor_table',x:def.x+1,y:def.y+1},db).ok,true);assert.equal(sys.payRent(owner,def.id,db).ok,true);const reload=new HousingSystem(db,t.housing);assert.equal(reload.record(def.id).ownerName,'Owner');assert.equal(reload.record(def.id).decor.length,1);}finally{fs.rmSync(t.dir,{recursive:true,force:true});}});
''')

write('docs/MORIA_9_2_ALPHA_SYSTEMS.md', r'''# Mor'ia 9.2 — Alpha Life Systems

This phase adds four server-authoritative MMORPG systems inspired by classic Tibia conventions while keeping Mor'ia's own content model.

## Housing
- Global persistent ownership, one house per character.
- House interior access is enforced by the movement server.
- Owner guest lists, weekly rent, grace period, decoration placement/removal.
- House definitions and decoration catalog are editable in Content Studio.

## Tibia-style Tasks
- Separate from narrative quests and Adventure Board contracts.
- Up to three active tasks, repeat limits, task points, hunter ranks and boss unlock metadata.
- Accept/claim requires the configured task master; kills progress only on the authoritative server.
- Task definitions are editable in Content Studio.

## Outfits
- Owned outfit collection, selected outfit, four color channels and two optional addons.
- Unlock/purchase and addon ownership are persistent and server-controlled.
- Outfit definitions are editable in Content Studio.

## Mounts
- Owned collection, selection, purchase, mount/dismount and server-derived movement bonus.
- Stable purchase requires a nearby stablemaster.
- Nearby-player snapshots expose the selected public mount.
- Mount catalog is editable in Content Studio.

## Persistence
ContentDB schema advances to v3. Populated v2 installs receive missing 9.2 defaults without overwriting admin-edited records; intentionally empty databases remain empty. Player task/outfit/mount state lives in the authoritative character save. Housing ownership is global and stored independently so two player saves cannot claim the same property.
''')

print('9.2 alpha server systems applied')
