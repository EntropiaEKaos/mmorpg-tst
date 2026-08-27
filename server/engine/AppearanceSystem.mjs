const HEX = /^#[0-9a-fA-F]{6}$/;
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
