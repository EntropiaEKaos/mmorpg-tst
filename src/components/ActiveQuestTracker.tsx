import type { ActiveQuest, Quest } from '../game/types';
import { t as tr } from '../i18n';

interface Props {
  activeQuests: ActiveQuest[];
  questCatalog: Quest[];
}

export default function ActiveQuestTracker({ activeQuests, questCatalog }: Props) {
  if (activeQuests.length === 0) return null;
  return (
    <div className="moria-panel absolute right-3 top-3 max-w-[270px] rounded-2xl border border-amber-200/20 p-3">
      <div className="moria-eyebrow mb-2 text-[9px] text-amber-200/80">📜 {tr('ACTIVE QUESTS')}</div>
      {activeQuests.slice(0, 3).map((activeQuest) => {
        const quest = questCatalog.find((candidate) => candidate.id === activeQuest.questId);
        if (!quest) return null;
        return (
          <div key={activeQuest.questId} className="mb-1 last:mb-0">
            <div className="text-xs font-bold text-slate-100">{tr(quest.name)}</div>
            {activeQuest.objectives.map((objective, index) => (
              <div key={index} className="text-[10px] text-slate-400">
                {objective.current >= objective.count ? '✅' : '○'} {tr(objective.targetName)}: {objective.current}/{objective.count}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
