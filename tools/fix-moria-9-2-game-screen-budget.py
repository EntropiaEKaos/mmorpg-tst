from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
screen_path = root / 'src/components/GameScreen.tsx'
screen = screen_path.read_text(encoding='utf-8')

component_path = root / 'src/components/ActiveQuestTracker.tsx'
component_path.write_text(r'''import type { ActiveQuest, Quest } from '../game/types';

interface Props {
  activeQuests: ActiveQuest[];
  questCatalog: Quest[];
}

export default function ActiveQuestTracker({ activeQuests, questCatalog }: Props) {
  if (activeQuests.length === 0) return null;
  return (
    <div className="moria-panel absolute right-3 top-3 max-w-[270px] rounded-2xl border border-amber-200/20 p-3">
      <div className="moria-eyebrow mb-2 text-[9px] text-amber-200/80">📜 ACTIVE QUESTS</div>
      {activeQuests.slice(0, 3).map((activeQuest) => {
        const quest = questCatalog.find((candidate) => candidate.id === activeQuest.questId);
        if (!quest) return null;
        return (
          <div key={activeQuest.questId} className="mb-1 last:mb-0">
            <div className="text-xs font-bold text-slate-100">{quest.name}</div>
            {activeQuest.objectives.map((objective, index) => (
              <div key={index} className="text-[10px] text-slate-400">
                {objective.current >= objective.count ? '✅' : '○'} {objective.targetName}: {objective.current}/{objective.count}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
''', encoding='utf-8')

import_anchor = "import CombatTargetFrame from './CombatTargetFrame';"
import_line = "import ActiveQuestTracker from './ActiveQuestTracker';"
if import_line not in screen:
    if import_anchor not in screen:
        raise SystemExit('ActiveQuestTracker import anchor missing')
    screen = screen.replace(import_anchor, import_anchor + '\n' + import_line, 1)

pattern = re.compile(r'''\n          \{/\* Active Quest Tracker \*/\}\n          \{player\.activeQuests\.length > 0 && \(.*?\n          \)\}\n\n          \{/\* Overlays \*/\}''', re.S)
replacement = '''
          {/* Active Quest Tracker is extracted to keep GameScreen an orchestrator. */}
          <ActiveQuestTracker activeQuests={player.activeQuests} questCatalog={questCatalog} />

          {/* Overlays */}'''
if 'Active Quest Tracker is extracted to keep GameScreen an orchestrator.' not in screen:
    screen, count = pattern.subn(replacement, screen, count=1)
    if count != 1:
        raise SystemExit(f'Active Quest Tracker extraction anchor mismatch ({count})')

screen_path.write_text(screen, encoding='utf-8')
print(f'GameScreen architecture extraction applied ({screen_path.stat().st_size} bytes)')
