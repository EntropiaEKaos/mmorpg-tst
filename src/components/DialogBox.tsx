import type { NPC, Player, Quest } from '../game/types';
import { QUESTS } from '../game/quests';
import { t as tr } from '../i18n';

interface Props {
  npc: NPC;
  onAction: (action: string, questId?: string) => void;
  onClose: () => void;
  player: Player;
  questCatalog?: Quest[];
}

export default function DialogBox({ npc, onAction, onClose, player, questCatalog = QUESTS }: Props) {
  const dialogue = npc.dialogues?.[0] || { text: '...', options: [{ text: 'Farewell.', action: 'bye' }] };
  const hasActiveQuest = player.activeQuests.some((q) => {
    const quest = questCatalog.find((qq) => qq.id === q.questId);
    return quest?.npcId === npc.id;
  });
  const hasCompletedQuest = player.activeQuests.find((q) => {
    const quest = questCatalog.find((qq) => qq.id === q.questId);
    return quest?.npcId === npc.id && q.objectives.every((o) => o.current >= o.count);
  });

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-5 backdrop-blur-md" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="moria-panel moria-fade-up relative w-full max-w-xl overflow-hidden rounded-3xl border p-5 sm:p-6" style={{ borderColor: `${npc.color}66`, boxShadow: `0 30px 90px rgba(0,0,0,.55), 0 0 42px ${npc.color}18` }}>
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full blur-3xl" style={{ background: `${npc.color}18` }} />
        <button onClick={onClose} className="moria-button absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-400" aria-label={tr('Close dialogue')}>✕</button>

        <div className="relative flex items-start gap-4 pr-10">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border bg-black/30 text-5xl" style={{ borderColor: `${npc.color}77`, boxShadow: `inset 0 1px rgba(255,255,255,.06), 0 0 26px ${npc.color}20` }}>
            <span style={{ filter: `drop-shadow(0 0 10px ${npc.color}99)` }}>{npc.emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="moria-eyebrow" style={{ color: npc.color }}>{tr(npc.role || 'Wanderer')}</div>
            <h2 className="moria-title mt-1 truncate text-2xl font-black">{tr(npc.name)}</h2>
            <div className="mt-3 rounded-2xl border border-white/[0.06] bg-black/25 p-3 text-sm italic leading-6 text-slate-300">
              <span className="mr-1 text-xl leading-none" style={{ color: npc.color }}>“</span>{tr(dialogue.text)}<span className="ml-1 text-xl leading-none" style={{ color: npc.color }}>”</span>
            </div>
          </div>
        </div>

        {hasCompletedQuest && (() => {
          const quest = questCatalog.find((q) => q.id === hasCompletedQuest.questId);
          return quest ? (
            <div className="moria-card relative mt-4 rounded-2xl border-amber-200/25 p-3">
              <div className="moria-eyebrow mb-1">{tr('Quest ready')}</div>
              <div className="text-sm font-bold text-slate-100">{tr(quest.name)}</div>
              <div className="mt-1 text-[10px] text-slate-400">{tr('Reward')} · {quest.rewards.xp} XP · {quest.rewards.gold} {tr('gold')}</div>
            </div>
          ) : null;
        })()}

        {hasActiveQuest && !hasCompletedQuest && (() => {
          const aq = player.activeQuests.find((q) => {
            const quest = questCatalog.find((qq) => qq.id === q.questId);
            return quest?.npcId === npc.id;
          });
          const quest = aq ? questCatalog.find((q) => q.id === aq.questId) : null;
          return quest ? (
            <div className="moria-card relative mt-4 rounded-2xl border-sky-300/20 p-3">
              <div className="moria-eyebrow mb-1 text-sky-300">{tr('Active quest')} · {tr(quest.name)}</div>
              <div className="space-y-1">
                {aq?.objectives.map((o, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{o.current >= o.count ? '✓' : '○'} {tr(o.targetName)}</span>
                    <span className="font-mono text-sky-200/80">{o.current}/{o.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        <div className="relative mt-5 space-y-2">
          {(dialogue.options || []).map((opt, i) => (
            <button key={`${opt.text}-${i}`} onClick={() => onAction(opt.action || 'bye', opt.questId)} className="moria-button group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm">
              <span className="text-amber-200/45 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-200">›</span>
              <span className="font-semibold text-slate-200">{tr(opt.text)}</span>
            </button>
          ))}
        </div>

        {npc.shop && npc.shop.length > 0 && (
          <div className="relative mt-5 border-t border-white/[0.06] pt-4">
            <div className="moria-eyebrow mb-2">{tr('Merchant stock')}</div>
            <div className="moria-scrollbar grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1">
              {npc.shop.map((item, i) => (
                <div key={`${item.name}-${i}`} className="moria-card flex items-center gap-2 rounded-xl p-2.5 text-xs">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-black/25 text-xl">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-slate-100">{tr(item.name)}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-amber-200">{item.price} 🪙</div>
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
