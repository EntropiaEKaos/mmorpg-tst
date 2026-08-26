import { useState } from 'react';
import { getWorldEvents, addWorldEvent, deleteWorldEvent, type WorldEvent } from '../game/worldEvents';
import { MAPS, MAP_WIDTH, MAP_HEIGHT } from '../game/maps';

interface Props {
  onClose: () => void;
}

export default function WorldEventCreator({ onClose }: Props) {
  const [events, setEvents] = useState<WorldEvent[]>(getWorldEvents());
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    name: '', icon: '🌍', description: '', type: 'invasion',
    targetMap: 'eldoria', posX: 35, posY: 50,
    monsterName: 'Boss', monsterEmoji: '👹', monsterColor: '#c13030',
    monsterHp: 2000, monsterAttack: 80, monsterDefense: 25, monsterXp: 5000,
    monsterLevel: 30, monsterCount: 1, monsterSize: 1.5,
    required: 1, rewardGold: 3000, rewardXp: 6000, duration: 30,
  });

  const create = () => {
    const name = form.name.trim().slice(0, 80);
    const targetMap = MAPS[form.targetMap] ? form.targetMap : 'eldoria';
    if (!name) {
      setNotice('Event name is required.');
      return;
    }
    const finiteInt = (value: number, fallback: number, min: number, max: number) => {
      const safe = Number.isFinite(value) ? Math.floor(value) : fallback;
      return Math.max(min, Math.min(max, safe));
    };
    const now = Date.now();
    const duration = finiteInt(form.duration, 30, 1, 24 * 60);
    const required = finiteInt(form.required, 1, 1, 100000);
    const event: WorldEvent = {
      id: `we_${now}_${Math.random()}`,
      name,
      icon: form.icon.trim().slice(0, 8) || '🌍',
      description: form.description.trim().slice(0, 240) || 'A world event!',
      type: form.type as WorldEvent['type'],
      targetMap,
      targetPos: {
        x: finiteInt(form.posX, 35, 0, MAP_WIDTH - 1),
        y: finiteInt(form.posY, 50, 0, MAP_HEIGHT - 1),
      },
      monsterTemplate: {
        name: form.monsterName.trim().slice(0, 80) || 'Boss',
        emoji: form.monsterEmoji.trim().slice(0, 8) || '👹',
        color: /^#[0-9a-f]{6}$/i.test(form.monsterColor) ? form.monsterColor : '#c13030',
        hp: finiteInt(form.monsterHp, 100, 1, 10000000),
        attack: finiteInt(form.monsterAttack, 10, 0, 100000),
        defense: finiteInt(form.monsterDefense, 0, 0, 100000),
        xp: finiteInt(form.monsterXp, 100, 0, 10000000),
        level: finiteInt(form.monsterLevel, 1, 1, 10000),
        count: finiteInt(form.monsterCount, 1, 1, 500),
        size: Number.isFinite(form.monsterSize) ? Math.max(0.5, Math.min(4, form.monsterSize)) : 1,
      },
      rewardGold: finiteInt(form.rewardGold, 0, 0, 100000000),
      rewardXp: finiteInt(form.rewardXp, 0, 0, 100000000),
      startTime: now,
      endTime: now + duration * 60000,
      progress: { current: 0, required },
      contributors: {}, status: 'active', createdBy: 'Admin',
    };
    addWorldEvent(event);
    setEvents(getWorldEvents());
    setForm({ ...form, name: '' });
    setNotice(`Created ${event.name} on ${MAPS[targetMap]?.name || targetMap}.`);
  };

  return (
    <div className="moria-overlay absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="moria-panel moria-scrollbar w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-orange-300/20 p-4 sm:p-5"
           style={{ boxShadow: '0 30px 90px rgba(0,0,0,.6), 0 0 45px rgba(249,115,22,.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-black tracking-widest text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(180deg, #ff6a00 0%, #8b3000 100%)' }}>🌍 WORLD EVENT CREATOR</h2>
          <button onClick={onClose} className="text-orange-200/60 hover:text-white text-xl">✕</button>
        </div>

        <div className="text-xs text-orange-200/60 mb-3">Create validated local world events. Coordinates, duration, progression and rewards are clamped to safe ranges before persistence.</div>
        {notice && <div className="mb-3 rounded-lg border border-orange-300/20 bg-orange-950/25 px-3 py-2 text-xs text-orange-100">{notice}</div>}

        {/* Existing events */}
        <div className="mb-4">
          <div className="text-[10px] text-orange-300 tracking-widest mb-1.5">📋 ALL EVENTS ({events.length})</div>
          <div className="moria-scrollbar max-h-32 space-y-1 overflow-y-auto pr-1">
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
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
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
            <div className="sm:col-span-2 lg:col-span-4">
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
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div><label className="text-[9px] text-orange-200/60 block mb-0.5">Kill Goal</label><input type="number" value={form.required} onChange={(e) => setForm({ ...form, required: parseInt(e.target.value) || 1 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" /></div>
            <div><label className="text-[9px] text-orange-200/60 block mb-0.5">Reward Gold</label><input type="number" value={form.rewardGold} onChange={(e) => setForm({ ...form, rewardGold: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" /></div>
            <div><label className="text-[9px] text-orange-200/60 block mb-0.5">Reward XP</label><input type="number" value={form.rewardXp} onChange={(e) => setForm({ ...form, rewardXp: parseInt(e.target.value) || 0 })} className="w-full px-2 py-1 rounded bg-black/60 border border-orange-700/50 text-orange-100" /></div>
            <div className="flex items-end"><button onClick={create} className="moria-button-primary w-full rounded-lg py-1.5 font-bold">🌍 Create</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
