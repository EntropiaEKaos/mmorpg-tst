type AnyRecord=Record<string,any>;
const text=(v:unknown)=>String(v||'').trim().toLowerCase();
const equipped=(player:AnyRecord,slot:string)=>player?.equipment?.[slot]||{};
export type CharacterVisualIdentity={visualId:'hero-warrior'|'hero-mage'|'hero-ranger';classKey:'warrior'|'mage'|'ranger';weaponKind:'sword'|'staff'|'spear';signature:string};
/** Converts authoritative character data into presentation identity only. It never mutates gameplay DTOs. */
export function resolveCharacterVisualIdentity(player:AnyRecord={}):CharacterVisualIdentity{
 const vocation=text(player.vocation||player.class||player.job||player.archetype);const weapon=equipped(player,'weapon');const weaponText=text(`${weapon.name||''} ${weapon.type||''} ${weapon.weaponType||''}`);const magic=Number(player.magic||player.spellPower||0),attack=Number(player.attack||player.attackPower||0);
 let classKey:CharacterVisualIdentity['classKey']='warrior';
 if(/mage|wizard|sorc|warlock|arcan|druid|shaman|priest|cleric/.test(vocation)||/staff|wand|tome|orb/.test(weaponText)||magic>attack*1.2)classKey='mage';
 else if(/ranger|hunter|archer|rogue|assassin|scout/.test(vocation)||/bow|crossbow|spear|dagger/.test(weaponText))classKey='ranger';
 const visualId=`hero-${classKey}` as CharacterVisualIdentity['visualId'];const weaponKind=classKey==='mage'?'staff':classKey==='ranger'?'spear':'sword';
 const signature=[visualId,text(equipped(player,'helmet').rarity||equipped(player,'helmet').name),text(weapon.rarity||weapon.name),text(equipped(player,'armor').rarity||equipped(player,'armor').name)].filter(Boolean).join(':');
 return{visualId,classKey,weaponKind,signature};
}
export function resolveNamedNpcVisual(npc:AnyRecord={}):string|undefined{const id=text(npc.id),name=text(npc.name);if(id.includes('maelis')||name==='maelis')return'npc-maelis';if(id.includes('orwin')||name==='orwin')return'npc-orwin';const role=text(npc.role||npc.type);if(role.includes('merchant')||role.includes('vendor'))return'npc-merchant';if(role.includes('guard'))return'npc-guard';if(role.includes('villager')||role.includes('citizen'))return'npc-villager';return undefined;}
