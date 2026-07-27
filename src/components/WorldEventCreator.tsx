import { useState } from 'react';
import { getWorldEvents, addWorldEvent, deleteWorldEvent, type WorldEvent } from '../game/worldEvents';
import { MAPS } from '../game/maps';

interface Props {
  onClose: () => void;
}

export default function WorldEventCreator({ onClose }: Props) {
  const [events, setEvents] = useState<WorldEvent[]>(getWorldEvents());
  const [form, setForm] = useState({
    name: '', icon: '🌍', description: '', type: 'invasion',
    targetMap: 'eldoria', posX: 35, posY: 50,
    monsterName: 'Boss', monsterEmoji: '👹', monsterColor: '#c13030',
    monsterHp: 2000, monsterAttack: 80, monsterDefense: 25, monsterXp: 5000,
    monsterLevel: 30, monsterCount: 1, monsterSize: 1.5,
    required: 1, rewardGold: 3000, rewardXp: 6000, duration: 30,
  });

  const create = () => {
    if (!form.name.trim()) return;
    const now = Date.now();
    const event: WorldEvent = {
      id: `we_${now}_${Math.random()}`,
      name: form.name, icon: form.icon, description: form.description || 'A world event!',
      type: form.type as WorldEvent['type'],
      targetMap: form.targetMap, targetPos: { x: form.posX, y: form.posY },
      monsterTemplate: {
        name: form.monsterName, emoji: form.monsterEmoji, color: form.monsterColor,
        hp: form.monsterHp, attack: form.monsterAttack, defense: form.monsterDefense,
        xp: form.monsterXp, level: form.monsterLevel, count: form.monsterCount, size: form.monsterSize,
      },
      rewardGold: form.rewardGold, rewardXp: form.rewardXp,
      startTime: now, endTime: now + form.duration * 60000,
      progress: { current: 0, required: form.required },
      contributors: {}, status: 'active', createdBy: 'Admin',
    };
    addWorldEvent(event);
    setEvents(getWorldEvents());
    setForm({ ...form, name: '' });
    alert(`🌍 World Event "${event.name}" created and broadcast to all players!`);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 z-50"
         style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="rounded-lg border-2 p-4 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
           style={{ background: 'linear-gradient(180deg, rgba(80,40,0,0.95) 0%, rgba(30,15,0,0.98) 100%)', borderColor: '#ff6a00', boxShadow: '0 0 50px rgba(255,106,0,0.4)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black tracking-widest text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(180deg, #ff6a00 0%, #8b3000 100%)' }}>🌍 WORLD EVENT CREATOR</h2>
          <button onClick={onClose} className="text-orange-200/60 hover:text-white text-xl">✕</button>
        </div>

        <div className="text-xs text-orange-200/60 mb-3">Create global events that appear for ALL players. Monsters spawn at the target location and killing them contributes to the event.</div>

        {/* Existing events */}
        <div className="mb-4">
          <div className="text-[10px] text-orange-300 tracking-widest mb-1.5">📋 ALL EVENTS ({events.length})</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {events.length === 0 && <div className="text-orange-200/40 text-xs italic">No events yet.</div>}
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-2 p-1.5 rounded border border-orange-700/40 bg-black/40 text-xs">
                <span className="text-base">{e.icon}</span>
                <span className="flex-1 text-orange-200 font-bold">{e.name}</span>
                <span className={`text-[9px] px-1 rounded ${e.status === 'active' ? 'bg-green-900/40 text-green-300' : 'bg-gray-800 text-gray-400'}`}>{e.status}</span>
                <button onClick={() => { deleteWorldEvent(e.id); setEvents(getWorldEvents()); }} className="text-red-400 text-[10px] px-1">🗑</button>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="p-3 rounded border-2 border-orange-600/50 bg-black/40 space-y-2">
          <div className="text-[10px] text-orange-300 tracking-widest">➕ CREATE EVENT</div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="col-span-2">
              <label className="text-[9px] text-orange-200/60 block mb-0.5">Event Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" placeholder="Dragon Invasion" />
            </div>
            <div>
              <label className="text-[9px] text-orange-200/60 block mb-0.5">Icon</label>
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} maxLength={2} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100 text-center" />
            </div>
            <div>
              <label className="text-[9px] text-orange-200/60 block mb-0.5">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-1 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100">
                <option value="invasion">Invasion</option>
                <option value="worldboss">World Boss</option>
                <option value="bounty">Bounty</option>
                <option value="gathering">Gathering</option>
              </select>
            </div>
            <div className="col-span-4">
              <label className="text-[9px] text-orange-200/60 block mb-0.5">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" placeholder="Defeat the threat for rewards!" />
            </div>
            <div>
              <label className="text-[9px] text-orange-200/60 block mb-0.5">Target Map</label>
              <select value={form.targetMap} onChange={(e) => setForm({ ...form, targetMap: e.target.value })} className="w-full px-1 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100">
                {Object.values(MAPS).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] text-orange-200/60 block mb-0.5">Spawn X</label>
              <input type="number" value={form.posX} onChange={(e) => setForm({ ...form, posX: parseInt(e.target.value) || 35 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" />
            </div>
            <div>
              <label className="text-[9px] text-orange-200/60 block mb-0.5">Spawn Y</label>
              <input type="number" value={form.posY} onChange={(e) => setForm({ ...form, posY: parseInt(e.target.value) || 50 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" />
            </div>
            <div>
              <label className="text-[9px] text-orange-200/60 block mb-0.5">Duration (min)</label>
              <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 30 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" />
            </div>
          </div>

          <div className="text-[10px] text-orange-300 tracking-widest pt-1">👹 MONSTER TEMPLATE</div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div><label className="text-[9px] text-orange-200/60 block mb-0.5">Name</label><input value={form.monsterName} onChange={(e) => setForm({ ...form, monsterName: e.target.value })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" /></div>
            <div><label className="text-[9px] text-orange-200/60 block mb-0.5">Emoji</label><input value={form.monsterEmoji} onChange={(e) => setForm({ ...form, monsterEmoji: e.target.value })} maxLength={2} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100 text-center" /></div>
            <div><label className="text-[9px] text-orange-200/60 block mb-0.5">HP</label><input type="number" value={form.monsterHp} onChange={(e) => setForm({ ...form, monsterHp: parseInt(e.target.value) || 100 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" /></div>
            <div><label className="text-[9px] text-orange-200/60 block mb-0.5">Attack</label><input type="number" value={form.monsterAttack} onChange={(e) => setForm({ ...form, monsterAttack: parseInt(e.target.value) || 10 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" /></div>
            <div><label className="text-[9px] text-orange-200/60 block mb-0.5">Defense</label><input type="number" value={form.monsterDefense} onChange={(e) => setForm({ ...form, monsterDefense: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" /></div>
            <div><label className="text-[9px] text-orange-200/60 block mb-0.5">XP</label><input type="number" value={form.monsterXp} onChange={(e) => setForm({ ...form, monsterXp: parseInt(e.target.value) || 100 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" /></div>
            <div><label className="text-[9px] text-orange-200/60 block mb-0.5">Level</label><input type="number" value={form.monsterLevel} onChange={(e) => setForm({ ...form, monsterLevel: parseInt(e.target.value) || 1 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" /></div>
            <div><label className="text-[9px] text-orange-200/60 block mb-0.5">Count</label><input type="number" value={form.monsterCount} onChange={(e) => setForm({ ...form, monsterCount: parseInt(e.target.value) || 1 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" /></div>
          </div>

          <div className="text-[10px] text-orange-300 tracking-widest pt-1">🎯 GOAL & REWARDS</div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div><label className="text-[9px] text-orange-200/60 block mb-0.5">Kill Goal</label><input type="number" value={form.required} onChange={(e) => setForm({ ...form, required: parseInt(e.target.value) || 1 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" /></div>
            <div><label className="text-[9px] text-orange-200/60 block mb-0.5">Reward Gold</label><input type="number" value={form.rewardGold} onChange={(e) => setForm({ ...form, rewardGold: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" /></div>
            <div><label className="text-[9px] text-orange-200/60 block mb-0.5">Reward XP</label><input type="number" value={form.rewardXp} onChange={(e) => setForm({ ...form, rewardXp: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" /></div>
            <div className="flex items-end"><button onClick={create} className="w-full py-1.5 rounded bg-gradient-to-b from-orange-500 to-orange-700 text-white font-bold">🌍 Create</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
