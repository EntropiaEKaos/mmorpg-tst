from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

p = Path('src/components/GameScreen.tsx')
s = p.read_text()

s = replace_once(s,
'''function serverQuestToClient(raw: any): Quest | null {\n''',
'''function serverNpcToClient(raw: any, quests: Quest[]): { mapId: string; npc: NPC } | null {\n  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id.trim()) return null;\n  const x = Math.floor(Number(raw.posX));\n  const y = Math.floor(Number(raw.posY));\n  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return null;\n  const mapId = typeof raw.mapId === 'string' && MAPS[raw.mapId] ? raw.mapId : 'eldoria';\n  const validRoles: NPC['role'][] = ['merchant', 'quest', 'banker', 'trainer', 'guard', 'innkeeper'];\n  const role: NPC['role'] = validRoles.includes(raw.role as NPC['role']) ? raw.role as NPC['role'] : 'guard';\n  const options: NPC['dialogues'][number]['options'] = quests\n    .filter((quest) => quest.npcId === raw.id)\n    .map((quest) => ({ text: `📜 ${quest.name}`, action: 'quest' as const, questId: quest.id }));\n  options.push({ text: 'Farewell.', action: 'bye' });\n  return {\n    mapId,\n    npc: {\n      id: raw.id.trim(),\n      name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : raw.id.trim(),\n      pos: { x, y },\n      emoji: typeof raw.emoji === 'string' && raw.emoji ? raw.emoji.slice(0, 8) : '🧙',\n      color: typeof raw.color === 'string' && raw.color ? raw.color : '#9bd4ff',\n      role,\n      dialogues: [{\n        text: typeof raw.dialogue === 'string' && raw.dialogue.trim() ? raw.dialogue.trim() : 'Greetings, traveler!',\n        options,\n      }],\n    },\n  };\n}\n\nfunction serverQuestToClient(raw: any): Quest | null {\n''', 'server NPC converter')

s = replace_once(s,
'''  const serverQuestsRef = useRef<{ active: any[]; completed: string[] } | null>(null);\n  const [serverQuestCatalog, setServerQuestCatalog] = useState<Quest[]>([]);\n''',
'''  const serverQuestsRef = useRef<{ active: any[]; completed: string[] } | null>(null);\n  const [serverQuestCatalog, setServerQuestCatalog] = useState<Quest[]>([]);\n  const serverNpcCatalogRef = useRef<Array<{ mapId: string; npc: NPC }>>([]);\n''', 'server NPC catalog ref')

s = replace_once(s,
'''            setServerQuestCatalog(quests);\n            addMessage('System', `📡 Server content synced: ${content.items?.length||0} items, ${content.monsters?.length||0} monsters, ${quests.length} quests`, '#9bd4ff', 'system');\n''',
'''            setServerQuestCatalog(quests);\n            const serverNpcs: Array<{ mapId: string; npc: NPC }> = Array.isArray(content.npcs)\n              ? content.npcs.map((npc: any) => serverNpcToClient(npc, quests)).filter((entry: { mapId: string; npc: NPC } | null): entry is { mapId: string; npc: NPC } => Boolean(entry))\n              : [];\n            serverNpcCatalogRef.current = serverNpcs;\n            npcsRef.current = serverNpcs.filter((entry) => entry.mapId === currentMapIdRef.current).map((entry) => entry.npc);\n            addMessage('System', `📡 Server content synced: ${content.items?.length||0} items, ${content.monsters?.length||0} monsters, ${quests.length} quests, ${serverNpcs.length} NPCs`, '#9bd4ff', 'system');\n''', 'content sync server NPCs')

s = replace_once(s,
'''            worldRef.current = generateMap(sp.mapId);\n            buildingsRef.current = getTownBuildings(MAPS[sp.mapId].biome);\n            audio.teleport();\n''',
'''            worldRef.current = generateMap(sp.mapId);\n            buildingsRef.current = getTownBuildings(MAPS[sp.mapId].biome);\n            if (serverNpcCatalogRef.current.length > 0) {\n              npcsRef.current = serverNpcCatalogRef.current\n                .filter((entry) => entry.mapId === sp.mapId)\n                .map((entry) => entry.npc);\n            }\n            audio.teleport();\n''', 'authoritative map NPC refresh')

s = replace_once(s,
'''      const monster = serverMonstersRef.current.find((m: any) => m.x === tile.x && m.y === tile.y && m.hp > 0);\n      if (monster) { p.targetId = monster.id; serverSync.sendAttack(monster.id); return; }\n      p.targetId = undefined;\n      return;\n''',
'''      const monster = serverMonstersRef.current.find((m: any) => m.x === tile.x && m.y === tile.y && m.hp > 0);\n      if (monster) { p.targetId = monster.id; serverSync.sendAttack(monster.id); return; }\n      const npc = npcsRef.current.find((candidate) => candidate.pos.x === tile.x && candidate.pos.y === tile.y);\n      if (npc && Math.abs(npc.pos.x - p.pos.x) <= 2 && Math.abs(npc.pos.y - p.pos.y) <= 2) {\n        setActiveDialog(npc);\n        return;\n      }\n      p.targetId = undefined;\n      return;\n''', 'authoritative NPC click interaction')

p.write_text(s)
print('authoritative NPC UI 3.6 applied')
