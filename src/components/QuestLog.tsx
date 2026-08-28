import type { ActiveQuest, Quest } from '../game/types';
import { QUESTS } from '../game/quests';
import { ACHIEVEMENTS } from '../game/achievements';
import { t as tr } from '../i18n';

interface Props {
  activeQuests: ActiveQuest[];
  completedQuests: string[];
  availableQuests: Quest[];
  achievements: string[];
  stats: {
    monstersKilled: number;
    bossesKilled: number;
    damageDealt: number;
    damageTaken: number;
    healingDone: number;
    goldEarned: number;
    distanceWalked: number;
    spellsCast: number;
    deaths: number;
    levelUps: number;
  };
  onClose: () => void;
  onAcceptQuest?: (questId: string) => void;
  onCompleteQuest?: (questId: string) => void;
  questCatalog?: Quest[];
}

export default function QuestLog({ activeQuests, completedQuests, availableQuests, achievements, stats, onClose, onAcceptQuest, onCompleteQuest, questCatalog = QUESTS }: Props) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="moria-panel moria-fade-up flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-amber-200/20 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div><div className="moria-eyebrow">{tr('Adventure journal')}</div><h2 className="moria-title mt-1 text-2xl font-black">📜 {tr('Quest Log')}</h2></div>
          <button onClick={onClose} className="moria-button flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-400" aria-label={tr('Close quest log')}>✕</button>
        </div>

        <div className="moria-scrollbar flex-1 space-y-5 overflow-y-auto pr-2">
          {/* Active Quests */}
          <section>
            <h3 className="text-amber-300 font-bold text-sm mb-2 tracking-wider">🔥 {tr('ACTIVE')} ({activeQuests.length})</h3>
            {activeQuests.length === 0 ? (
              <div className="text-amber-200/40 text-xs italic p-2">{tr('No active quests. Talk to NPCs!')}</div>
            ) : (
              <div className="space-y-2">
                {activeQuests.map((aq) => {
                  const quest = questCatalog.find((q) => q.id === aq.questId);
                  const objectiveTotal = aq.objectives.reduce((sum, objective) => sum + objective.count, 0);
                  const progress = objectiveTotal > 0
                    ? aq.objectives.reduce((sum, objective) => sum + objective.current, 0) / objectiveTotal
                    : 0;
                  return (
                    <div key={aq.questId} className="p-3 rounded border border-amber-700/50 bg-amber-900/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-amber-100 font-bold">{tr(quest?.name || aq.questId)}</div>
                          <div className="text-amber-200/70 text-xs italic mt-0.5">{tr(quest?.description || 'Authoritative server quest')}</div>
                        </div>
                        <div className="text-right text-[10px] text-amber-300">
                          <div>+{quest?.rewards.xp ?? 0} XP</div>
                          <div>+{quest?.rewards.gold ?? 0} 🪙</div>
                        </div>
                      </div>
                      <div className="mt-2 space-y-1">
                        {aq.objectives.map((o, i) => (
                          <div key={i} className="text-xs flex justify-between">
                            <span className={o.current >= o.count ? 'text-green-400' : 'text-amber-200/80'}>
                              {o.current >= o.count ? '✅' : '○'} {tr(o.targetName)}
                            </span>
                            <span className="text-amber-300 font-mono">{o.current}/{o.count}</span>
                          </div>
                        ))}
                      </div>
                      <div className="h-1 bg-black/60 rounded mt-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                             style={{ width: `${Math.min(100, progress * 100)}%` }} />
                      </div>
                      {onCompleteQuest && aq.objectives.every((o: any) => o.current >= o.count) && (
                        <button onClick={() => onCompleteQuest(aq.questId)}
                                className="mt-2 px-3 py-1 text-xs rounded bg-green-700/50 text-green-200 border border-green-600">
                          ✅ Complete Quest
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Available */}
          <section>
            <h3 className="text-blue-300 font-bold text-sm mb-2 tracking-wider">📋 {tr('AVAILABLE')} ({availableQuests.length})</h3>
            {availableQuests.length === 0 ? (
              <div className="text-amber-200/40 text-xs italic p-2">{tr('No quests available right now.')}</div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {availableQuests.map((q) => (
                  <div key={q.id} className="p-2 rounded border border-blue-700/40 bg-blue-900/10 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="text-amber-100 font-bold">{tr(q.name)}</div>
                      {onAcceptQuest && (
                        <button onClick={() => onAcceptQuest(q.id)}
                                className="px-2 py-0.5 text-[9px] rounded bg-blue-700/50 text-blue-200 border border-blue-600">
                          ✓ Accept
                        </button>
                      )}
                    </div>
                    <div className="text-amber-200/60 text-[10px] mt-0.5">{tr('Lv')} {q.levelRequired}+</div>
                    <div className="text-amber-200/80 text-[10px] mt-1">{tr(q.description)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Completed */}
          <section>
            <h3 className="text-green-300 font-bold text-sm mb-2 tracking-wider">✅ {tr('COMPLETED')} ({completedQuests.length})</h3>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {completedQuests.map((qid) => {
                const q = questCatalog.find((qq) => qq.id === qid);
                return (
                  <div key={qid} className="p-1.5 rounded border border-green-700/40 bg-green-900/10 text-xs text-green-300">
                    ✅ {tr(q?.name || qid)}
                  </div>
                );
              })}
              {completedQuests.length === 0 && <div className="text-amber-200/40 text-xs italic">{tr('None yet')}</div>}
            </div>
          </section>

          {/* Achievements */}
          <section>
            <h3 className="text-orange-300 font-bold text-sm mb-2 tracking-wider">🏆 {tr('ACHIEVEMENTS')} ({achievements.length}/{ACHIEVEMENTS.length})</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {ACHIEVEMENTS.map((a) => {
                const unlocked = achievements.includes(a.id);
                return (
                  <div
                    key={a.id}
                    className={`p-1.5 rounded border text-xs ${unlocked ? 'border-orange-500/60 bg-orange-900/20' : 'border-gray-700/40 bg-black/40 opacity-50'}`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-base">{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={unlocked ? 'text-orange-200 font-bold' : 'text-gray-400 font-bold truncate'}>
                          {tr(a.name)}
                        </div>
                        <div className="text-amber-200/60 text-[10px] truncate">{tr(a.description)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Stats */}
          <section>
            <h3 className="text-purple-300 font-bold text-sm mb-2 tracking-wider">📊 {tr('STATISTICS')}</h3>
            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
              {[
                { label: 'Monsters Killed', value: stats.monstersKilled, icon: '🗡' },
                { label: 'Bosses Killed', value: stats.bossesKilled, icon: '👑' },
                { label: 'Damage Dealt', value: stats.damageDealt, icon: '💥' },
                { label: 'Damage Taken', value: stats.damageTaken, icon: '🩸' },
                { label: 'Healing Done', value: stats.healingDone, icon: '💚' },
                { label: 'Gold Earned', value: stats.goldEarned, icon: '🪙' },
                { label: 'Distance', value: stats.distanceWalked, icon: '🥾' },
                { label: 'Spells Cast', value: stats.spellsCast, icon: '🔮' },
                { label: 'Deaths', value: stats.deaths, icon: '☠' },
                { label: 'Level Ups', value: stats.levelUps, icon: '⭐' },
              ].map((s) => (
                <div key={s.label} className="p-1.5 rounded border border-purple-700/40 bg-purple-900/10 text-xs">
                  <div className="text-amber-200/60 text-[10px]">{s.icon} {tr(s.label)}</div>
                  <div className="text-purple-200 font-bold">{s.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
