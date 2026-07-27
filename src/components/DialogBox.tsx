import type { NPC, Player } from '../game/types';
import { QUESTS } from '../game/quests';

interface Props {
  npc: NPC;
  onAction: (action: string, questId?: string) => void;
  onClose: () => void;
  player: Player;
}

export default function DialogBox({ npc, onAction, onClose, player }: Props) {
  const dialogue = npc.dialogues[0];
  const hasActiveQuest = player.activeQuests.some((q) => {
    const quest = QUESTS.find((qq) => qq.id === q.questId);
    return quest?.npcId === npc.id;
  });
  const hasCompletedQuest = player.activeQuests.find((q) => {
    const quest = QUESTS.find((qq) => qq.id === q.questId);
    return quest?.npcId === npc.id && q.objectives.every((o) => o.current >= o.count);
  });

  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-8 z-20"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="rounded-lg border-2 p-5 max-w-lg w-full shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, rgba(60,40,20,0.98) 0%, rgba(30,20,10,0.98) 100%)',
          borderColor: npc.color,
          boxShadow: `0 0 40px ${npc.color}30`,
        }}
      >
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-5xl shrink-0 border-4"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.1), rgba(0,0,0,0.3))',
              borderColor: npc.color,
              boxShadow: `0 0 20px ${npc.color}60`,
            }}
          >
            {npc.emoji}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-amber-100">{npc.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-bold"
                    style={{ background: npc.color + '40', color: npc.color, border: `1px solid ${npc.color}` }}>
                {npc.role}
              </span>
            </div>
            <div className="mt-2 p-3 rounded text-amber-100/90 text-sm italic"
                 style={{ background: 'rgba(0,0,0,0.4)', borderLeft: `3px solid ${npc.color}` }}>
              "{dialogue.text}"
            </div>

            {hasCompletedQuest && (() => {
              const quest = QUESTS.find((q) => q.id === hasCompletedQuest.questId);
              return quest ? (
                <div className="mt-3 p-2 rounded border border-amber-600/50 bg-amber-900/30">
                  <div className="text-amber-300 text-xs font-bold">✨ Quest Complete!</div>
                  <div className="text-amber-100 text-xs">{quest.name}</div>
                  <div className="text-amber-200/70 text-[10px] mt-0.5">
                    Reward: {quest.rewards.xp} XP, {quest.rewards.gold} gold
                  </div>
                </div>
              ) : null;
            })()}

            {hasActiveQuest && !hasCompletedQuest && (() => {
              const aq = player.activeQuests.find((q) => {
                const quest = QUESTS.find((qq) => qq.id === q.questId);
                return quest?.npcId === npc.id;
              });
              const quest = aq ? QUESTS.find((q) => q.id === aq.questId) : null;
              return quest ? (
                <div className="mt-3 p-2 rounded border border-blue-600/50 bg-blue-900/30">
                  <div className="text-blue-300 text-xs font-bold">📜 Active Quest: {quest.name}</div>
                  {aq?.objectives.map((o, i) => (
                    <div key={i} className="text-amber-100/70 text-xs">
                      {o.current >= o.count ? '✅' : '○'} {o.targetName}: {o.current}/{o.count}
                    </div>
                  ))}
                </div>
              ) : null;
            })()}
          </div>
        </div>

        <div className="space-y-1.5">
          {dialogue.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onAction(opt.action || 'bye', opt.questId)}
              className="w-full text-left px-3 py-2 rounded border-2 text-sm transition-all hover:scale-[1.01]"
              style={{
                background: 'linear-gradient(180deg, rgba(80,50,20,0.6) 0%, rgba(40,25,10,0.8) 100%)',
                borderColor: 'rgba(139,105,20,0.5)',
                color: '#f4e04d',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#f4e04d';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,105,20,0.5)';
              }}
            >
              ▸ {opt.text}
            </button>
          ))}
        </div>

        {npc.shop && (
          <div className="mt-4 pt-3 border-t border-amber-900/40">
            <div className="text-[10px] text-amber-200/60 tracking-widest mb-2">🛒 SHOP</div>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
              {npc.shop.map((item, i) => (
                <div
                  key={i}
                  className="p-2 rounded border border-amber-900/50 bg-black/40 text-xs"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-lg">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-amber-100 font-semibold truncate">{item.name}</div>
                      <div className="text-amber-400">{item.price} 🪙</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
