import { useState } from 'react';
import type { Player } from '../game/types';
import { getWorldEvents, contributeToWorldEvent, type WorldEvent } from '../game/worldEvents';

interface Props {
  player: Player;
  onClose: () => void;
  onContribute: (goldReward: number, xpReward: number) => void;
}

export default function WorldEvents({ player, onClose, onContribute }: Props) {
  const [events, setEvents] = useState<WorldEvent[]>(getWorldEvents());
  const refresh = () => setEvents(getWorldEvents());

  const handleContribute = (event: WorldEvent, amount: number) => {
    const result = contributeToWorldEvent(event.id, player.name, amount);
    if (result.completed) {
      onContribute(event.rewardGold, event.rewardXp);
    } else if (result.contribution > 0) {
      // partial contribution reward
      onContribute(Math.floor(event.rewardGold * 0.1), Math.floor(event.rewardXp * 0.1));
    }
    refresh();
  };

  const fmtTime = (ms: number) => {
    const min = Math.max(0, Math.floor(ms / 60000));
    if (min > 60) return `${Math.floor(min / 60)}h ${min % 60}m`;
    return `${min}m`;
  };

  const activeEvents = events.filter((e) => e.status === 'active');
  const completedEvents = events.filter((e) => e.status === 'completed').slice(0, 5);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 z-20"
         style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="rounded-xl border-2 p-5 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
           style={{ background: 'linear-gradient(180deg, rgba(50,20,20,0.98) 0%, rgba(25,10,10,0.98) 100%)', borderColor: '#ff6a00', boxShadow: '0 0 50px rgba(255,106,0,0.3)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-2xl font-black tracking-widest text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(180deg, #ff6a00 0%, #8b3000 100%)' }}>🌍 WORLD EVENTS</h2>
          <div className="flex items-center gap-2">
            <button onClick={refresh} className="px-2 py-1 text-xs rounded bg-black/40 text-orange-200 border border-orange-900/50">🔄</button>
            <button onClick={onClose} className="text-orange-200/60 hover:text-orange-100 text-2xl">✕</button>
          </div>
        </div>
        <div className="text-xs text-orange-200/60 mb-3">Global missions shared by all adventurers. Contribute to earn rewards!</div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {activeEvents.length === 0 && (
            <div className="text-center text-orange-200/40 py-8">
              <div className="text-5xl mb-3">🌍</div>
              <div>No active world events. Check back later or ask an admin to create one!</div>
            </div>
          )}
          {activeEvents.map((event) => {
            const pct = (event.progress.current / event.progress.required) * 100;
            const myContribution = event.contributors[player.name] || 0;
            const timeLeft = event.endTime - Date.now();
            return (
              <div key={event.id} className="p-3 rounded-lg border-2 border-orange-600/50 bg-black/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">{event.icon}</span>
                  <div className="flex-1">
                    <div className="font-bold text-base text-orange-200">{event.name}</div>
                    <div className="text-[10px] text-orange-200/60 italic">{event.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-orange-300">⏱ {fmtTime(timeLeft)} left</div>
                    <div className="text-[10px] text-amber-300">💰 {event.rewardGold}g · ✦ {event.rewardXp}XP</div>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-[10px] text-orange-200/70 mb-0.5">
                    <span>Progress: {event.progress.current}/{event.progress.required}</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <div className="h-2 bg-black/60 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #ff6a00, #ffd700)' }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-[10px] text-orange-200/50">
                    📍 {event.targetMap} · {event.type}
                    {myContribution > 0 && <span className="text-green-400 ml-2">Your contribution: {myContribution}</span>}
                  </div>
                  <div className="flex gap-1">
                    {event.type === 'invasion' || event.type === 'bounty' || event.type === 'worldboss' ? (
                      <span className="text-[10px] text-orange-300/70">Kill target monsters to contribute!</span>
                    ) : (
                      <button onClick={() => handleContribute(event, 1)} className="px-2 py-0.5 text-[10px] rounded bg-orange-700/50 text-orange-100 border border-orange-600">Contribute</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {completedEvents.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] text-green-300 tracking-widest mb-1.5">✅ RECENTLY COMPLETED</div>
              {completedEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-2 p-1.5 rounded border border-green-700/40 bg-green-900/10 text-xs">
                  <span className="text-lg opacity-60">{event.icon}</span>
                  <span className="flex-1 text-green-200/70">{event.name}</span>
                  <span className="text-[10px] text-green-400">Completed</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
