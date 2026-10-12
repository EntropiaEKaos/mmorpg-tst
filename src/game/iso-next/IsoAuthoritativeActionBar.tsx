import { useEffect, useState } from 'react';
import { DraggableIsoWindow } from './DraggableIsoWindow';
import { IsoSpellTooltip, IsoTooltip } from './IsoTooltip';
import { dispatchIsoAction } from './isoGameplayActions';
import { serverSync } from '../ServerSync';
const SLOTS=10;
export function IsoAuthoritativeActionBar({snapshot}:{snapshot:any}){const mobile=window.innerWidth<720;const player=snapshot?.player||{};const spells=Array.isArray(player.spells)?player.spells:Array.isArray(snapshot?.spells)?snapshot.spells:[];const potions=player.potions||snapshot?.potions||{};const[targetId,setTargetId]=useState(snapshot?.interaction?.targetId);const[now,setNow]=useState(()=>Date.now());useEffect(()=>{setTargetId(snapshot?.interaction?.targetId);},[snapshot?.interaction?.targetId]);useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),100);return()=>window.clearInterval(timer);},[]);
useEffect(()=>{
  // Desktop first: numbered spell hotkeys mirror the authoritative hotbar.
  // Do not hijack keys while typing in chat, search, admin input, or a dialog.
  if(mobile)return;
  const onKey=(event:KeyboardEvent)=>{
    if(event.repeat||event.altKey||event.ctrlKey||event.metaKey||event.isComposing)return;
    const target=event.target;
    if(target instanceof Element&&target.closest('input,textarea,select,[contenteditable="true"],[role="textbox"]'))return;
    if(!/^Digit[0-9]$/.test(event.code))return;
    const number=Number(event.code.slice(-1)),index=number===0?9:number-1;
    const spell=spells[index];
    if(!spell||!serverSync.isActive())return;
    const elapsed=Date.now()-Number(spell.lastCast||0);
    if(Number(spell.cooldown||0)>elapsed)return;
    if(Number(player.mana||0)<Number(spell.mana??spell.manaCost??0))return;
    if(Number(spell.levelRequired||1)>Number(player.level||1))return;
    if(dispatchIsoAction({kind:'cast',spellIndex:index,targetId}))event.preventDefault();
  };
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
},[mobile,spells,player.mana,player.level,targetId]);
return <DraggableIsoWindow id="authoritative-action-bar" title="Action Bar" initial={{x:mobile?12:Math.max(12,(window.innerWidth-760)/2),y:Math.max(90,window.innerHeight-(mobile?105:155))}} width={760}><div data-testid="iso-hotbar-slots" data-desktop-hotkeys={mobile?'frozen':'enabled'} style={{display:'flex',gap:mobile?3:5,padding:mobile?5:8,overflowX:'auto'}}>{Array.from({length:SLOTS},(_,index)=>{const spell=spells[index];const key=index===9?'0':String(index+1);if(!spell)return <div key={index} style={{width:mobile?46:58,height:mobile?52:62,flexShrink:0,border:'1px solid rgba(238,203,126,.12)',borderRadius:8,display:'grid',placeItems:'center',opacity:.35}}>+<small>{key}</small></div>;const elapsed=now-Number(spell.lastCast||0);const cooldown=Number(spell.cooldown||0);const remaining=Math.max(0,cooldown-elapsed);const onCd=remaining>0;const manaCost=Number(spell.mana??spell.manaCost??0);const noMana=Number(player.mana||0)<manaCost;const locked=Number(spell.levelRequired||1)>Number(player.level||1);return <IsoSpellTooltip key={spell.id||index} spell={spell} player={player} index={index} noMana={noMana} onCd={onCd} locked={locked}><button data-testid={`iso-spell-slot-${index}`} aria-label={`Spell ${index+1}: ${spell.name||'unknown'}`} disabled={onCd||noMana||locked} onClick={()=>dispatchIsoAction({kind:'cast',spellIndex:index,targetId})} style={{position:'relative',width:mobile?46:58,height:mobile?52:62,flexShrink:0,borderRadius:8,border:`1px solid ${spell.color||'rgba(238,203,126,.3)'}`,background:'rgba(4,8,14,.92)',color:'#fff',opacity:locked?.55:1}}><span style={{fontSize:mobile?20:25}}>{locked?'🔒':spell.icon||'✦'}</span><b style={{position:'absolute',left:3,top:2,fontSize:9}}>{key}</b><small style={{position:'absolute',right:3,bottom:2,color:'#9ec5ff'}}>{manaCost}</small>{onCd&&<strong style={{position:'absolute',inset:0,display:'grid',placeItems:'center',background:'rgba(0,0,0,.68)',borderRadius:8}}>{remaining>=1000?(remaining/1000).toFixed(1):Math.ceil(remaining)}</strong>}</button></IsoSpellTooltip>})}<span style={{width:1,background:'rgba(238,203,126,.18)'}}/>{[['P','🧪','hp'],['M','🧴','mp'],['G','🍷','hpg']].map(([key,icon,type])=><IsoTooltip key={type} content={<div><b>{type.toUpperCase()} Potion</b><br/>Quantidade: {Number(potions[type]||0)}</div>} position="top"><button disabled={!Number(potions[type]||0)} onClick={()=>serverSync.sendOfficial('use_potion',{type})} style={{position:'relative',width:mobile?46:52,height:mobile?52:62,flexShrink:0,borderRadius:8,border:'1px solid rgba(238,203,126,.2)',background:'rgba(4,8,14,.92)',color:'#fff'}}><span style={{fontSize:25}}>{icon}</span><b style={{position:'absolute',left:3,top:2,fontSize:9}}>{key}</b><small style={{position:'absolute',right:3,bottom:2}}>{Number(potions[type]||0)}</small></button></IsoTooltip>)}</div></DraggableIsoWindow>}
