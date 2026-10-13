import { dispatchIsoAction } from './isoGameplayActions';
import { IsoSpellTooltip } from './IsoTooltip';

type QuestRecord={
  id?:string;questId?:string;name?:string;title?:string;description?:string;
  current?:number;needed?:number;count?:number;levelRequired?:number;
  progress?:Record<string,number>;target?:string;requires?:string[];
};
const asQuestList=(value:unknown):QuestRecord[]=>Array.isArray(value)?value:[];

export function IsoAuthoritativeQuestLog({snapshot}:{snapshot:any}){
  const player=snapshot?.player||{};
  const questState=player.quests;
  const active=asQuestList(questState?.active??player.activeQuests);
  const completed=Array.isArray(questState?.completed)?questState.completed:[];
  // Quest catalog arrives once via authenticated content_sync. Do not invent
  // client quests, progression, NPC distance or successful server rewards.
  const catalog=asQuestList(snapshot?.quests);
  const activeIds=new Set(active.map(q=>q.questId||q.id));
  const completedIds=new Set(completed);
  const available=catalog.filter(q=>{
    const id=q.id||q.questId;
    return id&&!activeIds.has(id)&&!completedIds.has(id);
  });
  return <div data-testid="iso-authoritative-quest-log" style={{padding:12}}>
    <b>📜 Diário de Aventuras</b>
    <div style={{fontSize:11,opacity:.7,margin:'3px 0 10px'}}>
      Missões, progresso e recompensas validados pelo servidor. Para aceitar ou entregar, aproxime-se do NPC responsável.
    </div>
    <small data-testid="iso-quest-active-count">ATIVAS · {active.length}</small>
    {active.map((q,i)=>{
      const id=q.questId||q.id||'';
      const current=Math.max(0,Number(q.current??q.progress?.[q.target||'']??0));
      const needed=Math.max(1,Number(q.needed??q.count??1));
      const ready=current>=needed;
      return <div key={id||i} data-testid="iso-quest-active" style={{padding:9,marginTop:6,border:'1px solid rgba(238,203,126,.15)',borderRadius:9}}>
        <b>{q.title||q.name||id}</b>
        {q.description&&<div style={{fontSize:11,opacity:.7}}>{q.description}</div>}
        <div style={{fontSize:11,marginTop:4}}>{current}/{needed} · {ready?'Objetivo concluído':'Em andamento'}</div>
        <button data-testid="iso-quest-complete" data-quest-id={id} disabled={!id||!ready}
          onClick={()=>dispatchIsoAction({kind:'quest-complete',questId:id})}>
          {ready?'Entregar ao NPC':'Complete o objetivo para entregar'}
        </button>
      </div>;
    })}
    {!active.length&&<div style={{opacity:.6,fontSize:12,padding:'7px 0'}}>Nenhuma missão ativa.</div>}
    <small style={{display:'block',marginTop:12}} data-testid="iso-quest-available-count">DISPONÍVEIS · {available.length}</small>
    {available.slice(0,16).map((q,i)=>{
      const id=q.id||q.questId||'',required=Math.max(1,Number(q.levelRequired||1));
      const locked=Number(player.level||1)<required;
      return <div key={id||i} data-testid="iso-quest-available" style={{padding:9,marginTop:6,border:'1px solid rgba(105,206,147,.18)',borderRadius:9}}>
        <b>{q.title||q.name||id}</b>{q.description&&<div style={{fontSize:11,opacity:.7}}>{q.description}</div>}
        <div style={{fontSize:11,marginTop:3,opacity:.72}}>Nível {required} · Aceitação depende de proximidade e pré-requisitos no servidor</div>
        <button data-testid="iso-quest-accept" data-quest-id={id} disabled={!id||locked}
          onClick={()=>dispatchIsoAction({kind:'quest-accept',questId:id})}>
          {locked?`Requer nível ${required}`:'Aceitar com NPC próximo'}
        </button>
      </div>;
    })}
    {!catalog.length&&<div style={{opacity:.65,fontSize:12,marginTop:8}}>Catálogo de missões aguardando sincronização do servidor.</div>}
    {Boolean(catalog.length)&&!available.length&&<div style={{opacity:.65,fontSize:12,marginTop:8}}>Nenhuma nova missão disponível.</div>}
    {completed.length>0&&<small style={{display:'block',marginTop:12}}>CONCLUÍDAS · {completed.length}</small>}
  </div>;
}

export function IsoAuthoritativeSpellbook({snapshot,targetId}:{snapshot:any;targetId?:string}){const p=snapshot?.player||{};const spells=Array.isArray(p.spells)?p.spells:Array.isArray(snapshot?.spells)?snapshot.spells:[];return <div style={{padding:12}}><b>✨ Spellbook</b><div style={{fontSize:11,opacity:.6,margin:'3px 0 10px'}}>Clique para conjurar · servidor valida mana, cooldown e alvo</div><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7}}>{spells.map((spell:any,index:number)=>{const button=<button onClick={()=>dispatchIsoAction({kind:'cast',spellIndex:index,targetId})} style={{minHeight:76,borderRadius:10,border:'1px solid rgba(112,204,255,.2)',background:'rgba(42,93,145,.08)',color:'inherit'}}><div style={{fontSize:24}}>{spell.icon||'✦'}</div><b style={{fontSize:10}}>{spell.name||spell.id||`Spell ${index+1}`}</b><div style={{fontSize:9,opacity:.6}}>{spell.manaCost!=null?`${spell.manaCost} MP`:''}</div></button>;return <IsoSpellTooltip key={spell.id||index} spell={spell} player={p} index={index}>{button}</IsoSpellTooltip>})}</div>{!spells.length&&<div style={{opacity:.55,padding:12}}>Nenhuma magia no snapshot autoritativo.</div>}</div>}
