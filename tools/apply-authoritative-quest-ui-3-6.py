from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# ---------------------------------------------------------------------
# QuestLog: accept a runtime quest catalog and never crash on unknown metadata.
# ---------------------------------------------------------------------
p = Path('src/components/QuestLog.tsx')
s = p.read_text()
s = replace_once(s,
'''  onCompleteQuest?: (questId: string) => void;\n}\n\nexport default function QuestLog({ activeQuests, completedQuests, availableQuests, achievements, stats, onClose, onAcceptQuest, onCompleteQuest }: Props) {\n''',
'''  onCompleteQuest?: (questId: string) => void;\n  questCatalog?: Quest[];\n}\n\nexport default function QuestLog({ activeQuests, completedQuests, availableQuests, achievements, stats, onClose, onAcceptQuest, onCompleteQuest, questCatalog = QUESTS }: Props) {\n''', 'quest catalog prop')
s = s.replace('const quest = QUESTS.find((q) => q.id === aq.questId);', 'const quest = questCatalog.find((q) => q.id === aq.questId);')
s = replace_once(s,
'''                  if (!quest) return null;\n                  const objectiveTotal = aq.objectives.reduce((sum, objective) => sum + objective.count, 0);\n''',
'''                  const objectiveTotal = aq.objectives.reduce((sum, objective) => sum + objective.count, 0);\n''', 'keep unknown active quest visible')
s = replace_once(s,
'''                          <div className="text-amber-100 font-bold">{quest.name}</div>\n                          <div className="text-amber-200/70 text-xs italic mt-0.5">{quest.description}</div>\n''',
'''                          <div className="text-amber-100 font-bold">{quest?.name || aq.questId}</div>\n                          <div className="text-amber-200/70 text-xs italic mt-0.5">{quest?.description || 'Authoritative server quest'}</div>\n''', 'active quest metadata fallback')
s = replace_once(s,
'''                          <div>+{quest.rewards.xp} XP</div>\n                          <div>+{quest.rewards.gold} 🪙</div>\n''',
'''                          <div>+{quest?.rewards.xp ?? 0} XP</div>\n                          <div>+{quest?.rewards.gold ?? 0} 🪙</div>\n''', 'active quest reward fallback')
s = replace_once(s,
'''                const q = QUESTS.find((qq) => qq.id === qid);\n                return q ? (\n                  <div key={qid} className="p-1.5 rounded border border-green-700/40 bg-green-900/10 text-xs text-green-300">\n                    ✅ {q.name}\n                  </div>\n                ) : null;\n''',
'''                const q = questCatalog.find((qq) => qq.id === qid);\n                return (\n                  <div key={qid} className="p-1.5 rounded border border-green-700/40 bg-green-900/10 text-xs text-green-300">\n                    ✅ {q?.name || qid}\n                  </div>\n                );\n''', 'completed quest metadata fallback')
p.write_text(s)

# ---------------------------------------------------------------------
# GameScreen: convert server ContentDB quest definitions to client UI shape.
# ---------------------------------------------------------------------
p = Path('src/components/GameScreen.tsx')
s = p.read_text()
s = replace_once(s,
'''  Item, Spell, Account, NPC, Toast, ActiveQuest, Equipment,\n''',
'''  Item, Spell, Account, NPC, Toast, ActiveQuest, Equipment, Quest,\n''', 'Quest type import')
s = replace_once(s,
'''const customContentOnMap = <T extends { mapId?: string }>(content: T[], mapId: string) =>\n  content.filter((entry) => (entry.mapId || 'eldoria') === mapId);\n\nexport default function GameScreen''',
'''const customContentOnMap = <T extends { mapId?: string }>(content: T[], mapId: string) =>\n  content.filter((entry) => (entry.mapId || 'eldoria') === mapId);\n\nfunction serverQuestToClient(raw: any): Quest | null {\n  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id.trim()) return null;\n  const target = typeof raw.target === 'string' && raw.target.trim() ? raw.target.trim() : 'objective';\n  const count = Math.max(1, Math.floor(Number(raw.count) || 1));\n  return {\n    id: raw.id.trim(),\n    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : raw.id.trim(),\n    description: typeof raw.description === 'string' ? raw.description : '',\n    npcId: typeof raw.npcId === 'string' ? raw.npcId : '',\n    objectives: [{ type: 'kill', target, targetName: target, count, current: 0 }],\n    rewards: {\n      xp: Math.max(0, Math.floor(Number(raw.rewardXp) || 0)),\n      gold: Math.max(0, Math.floor(Number(raw.rewardGold) || 0)),\n    },\n    requires: Array.isArray(raw.requires) ? raw.requires.filter((id: unknown): id is string => typeof id === 'string') : [],\n    levelRequired: Math.max(1, Math.floor(Number(raw.levelRequired) || 1)),\n  };\n}\n\nexport default function GameScreen''', 'server quest converter')
s = replace_once(s,
'''  const serverQuestsRef = useRef<{ active: any[]; completed: string[] } | null>(null);\n''',
'''  const serverQuestsRef = useRef<{ active: any[]; completed: string[] } | null>(null);\n  const [serverQuestCatalog, setServerQuestCatalog] = useState<Quest[]>([]);\n''', 'server quest catalog state')
s = replace_once(s,
'''            const content = msg.payload;\n            localStorage.setItem('moria_server_content', JSON.stringify(content));\n            addMessage('System', `📡 Server content synced: ${content.items?.length||0} items, ${content.monsters?.length||0} monsters`, '#9bd4ff', 'system');\n''',
'''            const content = msg.payload;\n            localStorage.setItem('moria_server_content', JSON.stringify(content));\n            const quests = Array.isArray(content.quests)\n              ? content.quests.map(serverQuestToClient).filter((q: Quest | null): q is Quest => Boolean(q))\n              : [];\n            setServerQuestCatalog(quests);\n            addMessage('System', `📡 Server content synced: ${content.items?.length||0} items, ${content.monsters?.length||0} monsters, ${quests.length} quests`, '#9bd4ff', 'system');\n''', 'content sync quest catalog')
s = replace_once(s,
'''  const availableQuests = getAvailableQuests(player.quests, player.level, player.activeQuests.map((a) => a.questId));\n''',
'''  const localAvailableQuests = getAvailableQuests(player.quests, player.level, player.activeQuests.map((a) => a.questId));\n  const questCatalog = serverSync.isActive() && serverQuestCatalog.length > 0 ? serverQuestCatalog : QUESTS;\n  const activeQuestIds = new Set(player.activeQuests.map((quest) => quest.questId));\n  const completedQuestIds = new Set(player.quests);\n  const authoritativeAvailableQuests = questCatalog.filter((quest) =>\n    player.level >= quest.levelRequired\n    && !activeQuestIds.has(quest.id)\n    && !completedQuestIds.has(quest.id)\n    && (quest.requires || []).every((required) => completedQuestIds.has(required))\n  );\n  const availableQuests = serverSync.isActive() ? authoritativeAvailableQuests : localAvailableQuests;\n''', 'authoritative available quests')
s = replace_once(s,
'''              activeQuests={serverSync.isActive() && serverQuestsRef.current ? serverQuestsRef.current.active : player.activeQuests}\n              completedQuests={serverSync.isActive() && serverQuestsRef.current ? serverQuestsRef.current.completed : player.quests}\n              availableQuests={availableQuests}\n''',
'''              activeQuests={player.activeQuests}\n              completedQuests={serverSync.isActive() && serverQuestsRef.current ? serverQuestsRef.current.completed : player.quests}\n              availableQuests={availableQuests}\n              questCatalog={questCatalog}\n''', 'QuestLog authoritative normalized props')
p.write_text(s)

print('authoritative quest UI 3.6 applied')
