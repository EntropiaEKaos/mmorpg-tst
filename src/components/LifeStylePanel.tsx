import { useMemo, useState } from 'react';
import type { Player } from '../game/types';

type Tab = 'tasks' | 'housing' | 'outfits' | 'mounts';
type Action = (action: string, payload?: Record<string, unknown>) => void;

interface Props {
  player: Player;
  onTask: Action;
  onHousing: Action;
  onAppearance: Action;
  onMount: Action;
  onClose: () => void;
}

const money = (value: unknown) => Math.max(0, Number(value) || 0).toLocaleString();
const dateLabel = (value: unknown) => Number(value) > 0 ? new Date(Number(value)).toLocaleString() : '—';

export default function LifeStylePanel({ player, onTask, onHousing, onAppearance, onMount, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('tasks');
  const [guestName, setGuestName] = useState('');
  const [colors, setColors] = useState(() => ({
    head: player.appearance?.colors?.head || '#d7a06b',
    primary: player.appearance?.colors?.primary || '#506aa6',
    secondary: player.appearance?.colors?.secondary || '#343f59',
    detail: player.appearance?.colors?.detail || '#d9c271',
  }));

  const ownedHouse = useMemo(() => player.housing?.houses?.find(h => h.id === player.housing?.ownedHouseId), [player.housing]);
  const tabs: Array<{ id: Tab; icon: string; label: string }> = [
    { id:'tasks', icon:'🎯', label:'Tasks' }, { id:'housing', icon:'🏠', label:'Housing' },
    { id:'outfits', icon:'🧥', label:'Outfits' }, { id:'mounts', icon:'🐎', label:'Mounts' },
  ];

  return (
    <div className="moria-overlay absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-5" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="moria-panel flex h-[min(760px,92vh)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-amber-200/20 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="moria-eyebrow text-[9px] text-amber-200/60">ALPHA LIFE SYSTEMS</div>
            <h2 className="text-xl font-black tracking-[0.16em] text-amber-100">🏠 LIFE & STYLE</h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400"><span>🪙 {money(player.gold)}</span><button onClick={onClose} className="moria-button rounded-xl px-3 py-2 text-lg">✕</button></div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 px-4 py-2">
          {tabs.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`moria-button shrink-0 rounded-xl px-4 py-2 text-xs font-black ${tab===item.id?'text-amber-100 ring-1 ring-amber-300/30':'text-slate-400'}`}>{item.icon} {item.label}</button>)}
        </div>
        <div className="moria-scrollbar flex-1 overflow-y-auto p-4 sm:p-5">
          {tab === 'tasks' && <TasksTab player={player} onTask={onTask} />}
          {tab === 'housing' && <HousingTab player={player} ownedHouse={ownedHouse} guestName={guestName} setGuestName={setGuestName} onHousing={onHousing} />}
          {tab === 'outfits' && <OutfitsTab player={player} colors={colors} setColors={setColors} onAppearance={onAppearance} />}
          {tab === 'mounts' && <MountsTab player={player} onMount={onMount} />}
        </div>
      </div>
    </div>
  );
}

function TasksTab({ player, onTask }: { player: Player; onTask: Action }) {
  const state = player.tasks;
  if (!state) return <Empty text="Tasks are available when connected to the authoritative alpha server." />;
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat icon="🏹" label="Hunter Rank" value={state.rank || 'Novice'} />
      <Stat icon="✦" label="Task Points" value={String(state.points || 0)} />
      <Stat icon="📋" label="Active Slots" value={`${state.active?.length || 0}/${state.maxActive || 3}`} />
    </div>
    <section><SectionTitle>ACTIVE TASKS</SectionTitle>
      <div className="grid gap-3 lg:grid-cols-2">{(state.active || []).map(task => <div key={task.id} className="rounded-2xl border border-sky-300/15 bg-sky-950/20 p-4">
        <div className="flex items-start justify-between gap-3"><div><div className="font-black text-slate-100">{task.name}</div><div className="mt-1 text-[11px] text-slate-400">{task.targetName} · Lv {task.minLevel}+</div></div><span className={`rounded-full px-2 py-1 text-[9px] font-black ${task.ready?'bg-amber-300/15 text-amber-200':'bg-sky-300/10 text-sky-200'}`}>{task.ready?'READY':'HUNTING'}</span></div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/50"><div className={`h-full ${task.ready?'bg-amber-300':'bg-sky-400'}`} style={{width:`${Math.min(100,(task.progress/Math.max(1,task.count))*100)}%`}} /></div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-400"><span>{task.progress}/{task.count}</span><span>+{task.taskPoints} pts · {money(task.rewardGold)}g · {money(task.rewardXp)} XP</span></div>
        <div className="mt-3 flex gap-2"><button disabled={!task.ready} onClick={() => onTask('claim',{taskId:task.id})} className="moria-button-primary flex-1 rounded-lg py-2 text-[10px] font-black disabled:opacity-30">🏆 CLAIM AT MASTER</button><button onClick={() => onTask('abandon',{taskId:task.id})} className="moria-button rounded-lg px-3 text-[10px] text-rose-300">ABANDON</button></div>
      </div>)}</div>
      {(state.active || []).length===0&&<Empty text="No active hunting tasks. Visit the task master associated with a task to accept it." />}
    </section>
    <section><SectionTitle>TASK BOARD</SectionTitle><div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">{(state.catalog || []).map(task => {
      const active=(state.active||[]).some(item=>item.id===task.id); const done=task.completedCount>=task.repeatLimit;
      return <div key={task.id} className={`rounded-xl border p-3 ${task.locked||done?'border-white/5 bg-black/20 opacity-55':'border-white/10 bg-white/[0.025]'}`}><div className="flex justify-between gap-2"><div className="font-bold text-slate-100">{task.name}</div><span className="text-[9px] text-amber-200">{task.completedCount}/{task.repeatLimit} runs</span></div><div className="mt-1 text-[10px] leading-relaxed text-slate-400">{task.description}</div><div className="mt-2 text-[10px] text-slate-500">🎯 {task.count} {task.targetName} · Lv {task.minLevel}–{task.maxLevel}</div><button disabled={task.locked||done||active} onClick={()=>onTask('accept',{taskId:task.id})} className="moria-button mt-3 w-full rounded-lg py-2 text-[10px] font-black disabled:opacity-30">{active?'ACTIVE':done?'COMPLETE':task.locked?'LEVEL LOCKED':'ACCEPT AT TASK MASTER'}</button></div>;
    })}</div></section>
  </div>;
}

function HousingTab({ player, ownedHouse, guestName, setGuestName, onHousing }: { player: Player; ownedHouse: any; guestName: string; setGuestName:(v:string)=>void; onHousing:Action }) {
  const state=player.housing;
  if(!state)return <Empty text="Housing is available when connected to the authoritative alpha server."/>;
  return <div className="space-y-5">
    {ownedHouse && <section><SectionTitle>YOUR HOUSE</SectionTitle><div className="rounded-2xl border border-amber-300/20 bg-amber-950/10 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-lg font-black text-amber-100">🏠 {ownedHouse.name}</div><div className="text-xs text-slate-400">{ownedHouse.mapId} · rent {money(ownedHouse.weeklyRent)}g/week · due {dateLabel(ownedHouse.rentDueAt)}</div></div><div className="flex gap-2"><button onClick={()=>onHousing('pay_rent',{houseId:ownedHouse.id})} className="moria-button-primary rounded-lg px-3 py-2 text-[10px] font-black">PAY RENT</button><button onClick={()=>onHousing('release',{houseId:ownedHouse.id})} className="moria-button rounded-lg px-3 py-2 text-[10px] text-rose-300">RELEASE</button></div></div>
      <div className="mt-4 grid gap-4 md:grid-cols-2"><div><div className="mb-2 text-[10px] font-black text-slate-300">GUEST LIST</div><div className="flex gap-2"><input value={guestName} onChange={e=>setGuestName(e.target.value)} placeholder="Character name" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs outline-none focus:border-amber-300/40"/><button onClick={()=>{if(guestName.trim()){onHousing('guest_add',{houseId:ownedHouse.id,name:guestName.trim()});setGuestName('');}}} className="moria-button rounded-lg px-3 text-xs">ADD</button></div><div className="mt-2 flex flex-wrap gap-1">{(ownedHouse.guests||[]).map((guest:string)=><button key={guest} onClick={()=>onHousing('guest_remove',{houseId:ownedHouse.id,name:guest})} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] text-slate-300" title="Remove guest">{guest} ✕</button>)}</div></div>
      <div><div className="mb-2 text-[10px] font-black text-slate-300">PLACED DECOR</div><div className="flex flex-wrap gap-1">{(ownedHouse.decor||[]).map((item:any)=><button key={item.id} onClick={()=>onHousing('decor_remove',{houseId:ownedHouse.id,placementId:item.id})} className="rounded-lg border border-white/10 bg-black/25 px-2 py-1 text-[10px]" title="Remove decoration">{item.icon} {item.name} ✕</button>)}</div></div></div>
      <div className="mt-4"><div className="mb-2 text-[10px] font-black text-slate-300">DECOR SHOP · place at your current tile inside the house</div><div className="grid gap-2 grid-cols-2 lg:grid-cols-4">{(state.decorCatalog||[]).map(item=><button key={item.id} onClick={()=>onHousing('decor_add',{houseId:ownedHouse.id,decorId:item.id,x:player.pos.x,y:player.pos.y})} className="moria-button rounded-lg p-2 text-left"><div className="text-lg">{item.icon}</div><div className="text-[10px] font-bold text-slate-200">{item.name}</div><div className="text-[9px] text-amber-300">{money(item.price)}g</div></button>)}</div></div>
    </div></section>}
    <section><SectionTitle>HOUSES ON THIS MAP</SectionTitle><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(state.houses||[]).map(house=><div key={house.id} className={`rounded-xl border p-3 ${house.ownerName?'border-white/10 bg-black/20':'border-emerald-300/20 bg-emerald-950/10'}`}><div className="flex items-start justify-between gap-2"><div className="font-black text-slate-100">{house.name}</div><span className="text-[9px] text-slate-400">Lv {house.levelRequired}+</span></div><div className="mt-1 text-[10px] text-slate-400">{house.ownerName?`Owner: ${house.ownerName}`:`For sale · ${money(house.price)}g`}</div><div className="mt-1 text-[9px] text-slate-500">Interior {house.width}×{house.height} · rent {money(house.weeklyRent)}g</div>{!house.ownerName&&!state.ownedHouseId&&<button onClick={()=>onHousing('buy',{houseId:house.id})} className="moria-button-primary mt-3 w-full rounded-lg py-2 text-[10px] font-black">BUY AT DOOR</button>}{house.ownerName&&<div className={`mt-3 text-[9px] font-black ${house.access?'text-emerald-300':'text-rose-300'}`}>{house.access?'✓ YOU HAVE ACCESS':'🔒 PRIVATE HOUSE'}</div>}</div>)}</div></section>
  </div>;
}

function OutfitsTab({ player, colors, setColors, onAppearance }: { player:Player; colors:Record<string,string>; setColors:(v:any)=>void; onAppearance:Action }) {
  const state=player.appearance;
  if(!state)return <Empty text="Outfits are available when connected to the authoritative alpha server."/>;
  const selected=state.catalog?.find(item=>item.id===state.selectedOutfitId);
  return <div className="space-y-5"><div className="rounded-2xl border border-violet-300/20 bg-violet-950/10 p-4"><div className="flex items-center gap-3"><div className="text-4xl">{selected?.icon||'🧑'}</div><div><div className="text-lg font-black text-violet-100">{selected?.name||state.selectedOutfitId}</div><div className="text-xs text-slate-400">Layered colors and addons are visible to nearby players.</div></div></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{(['head','primary','secondary','detail'] as const).map(key=><label key={key} className="rounded-xl border border-white/10 bg-black/25 p-2 text-[10px] uppercase text-slate-400"><span>{key}</span><div className="mt-1 flex items-center gap-2"><input type="color" value={colors[key]} onChange={e=>setColors({...colors,[key]:e.target.value})} className="h-8 w-10 cursor-pointer border-0 bg-transparent"/><span className="font-mono text-[9px]">{colors[key]}</span></div></label>)}</div><button onClick={()=>onAppearance('colors',{colors})} className="moria-button-primary mt-3 rounded-lg px-4 py-2 text-[10px] font-black">APPLY COLORS</button></div>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(state.catalog||[]).map(outfit=>{const owned=state.ownedOutfits.includes(outfit.id);const selectedNow=state.selectedOutfitId===outfit.id;const addons=state.ownedAddons[outfit.id]||[];const mask=state.addonMasks[outfit.id]||0;return <div key={outfit.id} className={`rounded-2xl border p-4 ${selectedNow?'border-violet-300/40 bg-violet-950/20':'border-white/10 bg-black/20'}`}><div className="flex items-start gap-3"><div className="text-3xl">{outfit.icon}</div><div className="min-w-0 flex-1"><div className="font-black text-slate-100">{outfit.name}</div><div className="text-[10px] text-slate-500">Lv {outfit.levelRequired}+ · {outfit.style}</div></div>{selectedNow&&<span className="text-[9px] font-black text-violet-200">EQUIPPED</span>}</div><button disabled={selectedNow||(!owned&&player.level<outfit.levelRequired)} onClick={()=>owned?onAppearance('select',{outfitId:outfit.id}):onAppearance('buy',{outfitId:outfit.id})} className="moria-button-primary mt-3 w-full rounded-lg py-2 text-[10px] font-black disabled:opacity-30">{owned?(selectedNow?'SELECTED':'SELECT'):`UNLOCK · ${money(outfit.price)}g`}</button>{owned&&<div className="mt-3 grid grid-cols-2 gap-2">{[1,2].map(addon=>{const label=addon===1?outfit.addon1Name:outfit.addon2Name;if(!label)return <div key={addon}/>;const has=addons.includes(addon);const visible=(mask&(addon===1?1:2))!==0;return <button key={addon} onClick={()=>has?onAppearance('toggle_addon',{outfitId:outfit.id,addon}):onAppearance('buy_addon',{outfitId:outfit.id,addon})} className={`moria-button rounded-lg p-2 text-[9px] ${visible?'text-amber-200 ring-1 ring-amber-300/25':'text-slate-300'}`}>{has?(visible?'✓ ':'○ '):'🔒 '}{label}{!has&&` · ${money(outfit.addonPrice)}g`}</button>})}</div>}</div>})}</div></div>;
}

function MountsTab({ player, onMount }: { player:Player; onMount:Action }) {
  const state=player.mounts;
  if(!state)return <Empty text="Mounts are available when connected to the authoritative alpha server."/>;
  return <div className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/20 bg-amber-950/10 p-4"><div><div className="font-black text-amber-100">{state.mounted?'🐎 MOUNTED':'🚶 ON FOOT'}</div><div className="text-xs text-slate-400">Selected: {state.catalog.find(m=>m.id===state.selectedId)?.name||'none'} · server-authoritative movement speed</div></div><button disabled={!state.selectedId} onClick={()=>onMount('toggle',{})} className="moria-button-primary rounded-xl px-5 py-2 text-xs font-black disabled:opacity-30">{state.mounted?'DISMOUNT':'MOUNT'}</button></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{state.catalog.map(mount=>{const owned=state.ownedMounts.includes(mount.id);const selected=state.selectedId===mount.id;return <div key={mount.id} className={`rounded-2xl border p-4 ${selected?'border-amber-300/40 bg-amber-950/15':'border-white/10 bg-black/20'}`}><div className="flex gap-3"><div className="text-4xl">{mount.icon}</div><div className="min-w-0 flex-1"><div className="font-black text-slate-100">{mount.name}</div><div className="text-[10px] text-slate-400">+{mount.speedBonus}% speed · Lv {mount.levelRequired}+</div><div className="mt-1 text-[9px] leading-relaxed text-slate-500">{mount.description}</div></div></div><button disabled={selected||(!owned&&player.level<mount.levelRequired)} onClick={()=>owned?onMount('select',{mountId:mount.id}):onMount('buy',{mountId:mount.id})} className="moria-button mt-3 w-full rounded-lg py-2 text-[10px] font-black disabled:opacity-30">{owned?(selected?'SELECTED':'SELECT'):`BUY AT STABLE · ${money(mount.price)}g`}</button></div>})}</div></div>;
}

function SectionTitle({children}:{children:React.ReactNode}){return <div className="moria-eyebrow mb-2 text-[9px] text-amber-200/60">{children}</div>}
function Stat({icon,label,value}:{icon:string;label:string;value:string}){return <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><div className="text-xl">{icon}</div><div className="mt-1 text-[9px] uppercase tracking-wider text-slate-500">{label}</div><div className="font-black text-slate-100">{value}</div></div>}
function Empty({text}:{text:string}){return <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">{text}</div>}
