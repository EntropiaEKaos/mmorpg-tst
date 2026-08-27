const cleanId = value => typeof value === 'string' ? value.trim().slice(0,100) : '';

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
