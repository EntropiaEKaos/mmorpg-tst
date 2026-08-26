from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# ---------------------------------------------------------------------
# Persisted custom content: add map ownership and normalize legacy data.
# ---------------------------------------------------------------------
p = Path('src/game/content.ts')
s = p.read_text()
s = replace_once(s,
'''  dialogueText: string;\n  createdAt: number;\n}\n\nconst NPC_KEY''',
'''  dialogueText: string;\n  mapId?: string;\n  createdAt: number;\n}\n\nconst NPC_KEY''', 'custom npc map field')
s = replace_once(s,
'''export function getCustomNPCs(): CustomNPC[] {\n  try {\n    return JSON.parse(localStorage.getItem(NPC_KEY) || '[]');\n  } catch { return []; }\n}\n''',
'''export function getCustomNPCs(): CustomNPC[] {\n  try {\n    const data = JSON.parse(localStorage.getItem(NPC_KEY) || '[]');\n    if (!Array.isArray(data)) return [];\n    return data\n      .filter((npc): npc is CustomNPC => Boolean(npc && typeof npc === 'object' && typeof npc.id === 'string' && typeof npc.name === 'string'))\n      .map((npc) => ({ ...npc, mapId: typeof npc.mapId === 'string' && npc.mapId ? npc.mapId : 'eldoria' }));\n  } catch { return []; }\n}\n''', 'custom npc normalization')
s = replace_once(s,
'''  posY: number;\n  createdAt: number;\n}\n\nconst MONSTER_KEY''',
'''  posY: number;\n  mapId?: string;\n  createdAt: number;\n}\n\nconst MONSTER_KEY''', 'custom monster map field')
s = replace_once(s,
'''export function getCustomMonsters(): CustomMonster[] {\n  try {\n    return JSON.parse(localStorage.getItem(MONSTER_KEY) || '[]');\n  } catch { return []; }\n}\n''',
'''export function getCustomMonsters(): CustomMonster[] {\n  try {\n    const data = JSON.parse(localStorage.getItem(MONSTER_KEY) || '[]');\n    if (!Array.isArray(data)) return [];\n    return data\n      .filter((monster): monster is CustomMonster => Boolean(monster && typeof monster === 'object' && typeof monster.id === 'string' && typeof monster.name === 'string'))\n      .map((monster) => ({ ...monster, mapId: typeof monster.mapId === 'string' && monster.mapId ? monster.mapId : 'eldoria' }));\n  } catch { return []; }\n}\n''', 'custom monster normalization')
p.write_text(s)

# ---------------------------------------------------------------------
# Admin panel: derived ceilings, real blessing helper, no legacy accounts export.
# ---------------------------------------------------------------------
p = Path('src/components/AdminPanel.tsx')
s = p.read_text()
s = replace_once(s,
"import type { Player, Monster, Item } from '../game/types';\n",
"import type { Player, Monster, Item } from '../game/types';\nimport { computeDerivedStats } from '../game/types';\nimport { grantAllBlessings } from '../game/systems';\n", 'admin imports')
s = replace_once(s,
'''      p.hp = p.maxHp;\n      p.mana = p.maxMana;\n      p.stats.levelUps++;\n''',
'''      const derived = computeDerivedStats(p);\n      p.hp = derived.totalMaxHp;\n      p.mana = derived.totalMaxMana;\n      p.stats.levelUps++;\n''', 'admin xp derived heal')
s = replace_once(s,
'''  const healFull = () => {\n    const p = { ...player };\n    p.hp = p.maxHp;\n    p.mana = p.maxMana;\n    setPlayer(p);\n''',
'''  const healFull = () => {\n    const p = { ...player };\n    const derived = computeDerivedStats(p);\n    p.hp = derived.totalMaxHp;\n    p.mana = derived.totalMaxMana;\n    setPlayer(p);\n''', 'admin full heal derived')
s = replace_once(s,
'''                const p = { ...player };\n                p.blessings = 5;\n                p.aol = true;\n                setPlayer(p);\n                addMessage('Admin', 'All 5 Blessings + AOL activated!', '#f4e04d', 'system');\n''',
'''                const p = { ...player };\n                grantAllBlessings(p);\n                setPlayer(p);\n                addMessage('Admin', 'All 5 Blessings + AOL activated!', '#f4e04d', 'system');\n''', 'admin blessing helper')
s = replace_once(s,
'''                const data = {\n                  player: player,\n                  inventory: inventoryRef.current,\n                  accounts: JSON.parse(localStorage.getItem('tibia_accounts') || '[]'),\n                };\n''',
'''                const data = {\n                  version: 1,\n                  exportedAt: Date.now(),\n                  player,\n                  inventory: inventoryRef.current,\n                };\n''', 'remove legacy account export')
s = replace_once(s,
'''                      const data = JSON.parse(ev.target?.result as string);\n                      if (data.player) setPlayer(data.player);\n                      if (data.inventory) { inventoryRef.current = data.inventory; setInventory(data.inventory); }\n                      addMessage('Admin', 'Save imported', '#ff00ff', 'system');\n''',
'''                      const data = JSON.parse(ev.target?.result as string);\n                      if (!data || typeof data !== 'object' || !data.player || typeof data.player !== 'object') throw new Error('Invalid save');\n                      if (typeof data.player.name !== 'string' || data.player.name !== player.name) throw new Error('Save belongs to another character');\n                      if (!Array.isArray(data.inventory)) throw new Error('Invalid inventory');\n                      setPlayer({ ...player, ...data.player, name: player.name });\n                      inventoryRef.current = data.inventory;\n                      setInventory(data.inventory);\n                      addMessage('Admin', 'Save imported', '#ff00ff', 'system');\n''', 'validate admin import')
p.write_text(s)

# ---------------------------------------------------------------------
# Game Editor: distinguish live vs preview and make NPC/monster map-aware.
# ---------------------------------------------------------------------
p = Path('src/components/GameEditor.tsx')
s = p.read_text()
s = replace_once(s,
"import { MAPS } from '../game/maps';\n",
"import { MAPS, MAP_WIDTH, MAP_HEIGHT } from '../game/maps';\n", 'editor map dimensions import')
s = replace_once(s,
'''    { id: 'items', label: 'Items', icon: '⚔' },\n    { id: 'spells', label: 'Spells', icon: '🔮' },\n    { id: 'classes', label: 'Classes', icon: '👤' },\n    { id: 'maps', label: 'Maps', icon: '🗺' },\n''',
'''    { id: 'items', label: 'Items · Preview', icon: '⚔' },\n    { id: 'spells', label: 'Spells · Preview', icon: '🔮' },\n    { id: 'classes', label: 'Classes · View', icon: '👤' },\n    { id: 'maps', label: 'Maps · Preview', icon: '🗺' },\n''', 'editor tab truth labels')
s = replace_once(s,
'''        </div>\n\n        <div className="flex-1 overflow-y-auto">\n''',
'''        </div>\n\n        {(['items', 'spells', 'classes', 'maps'] as EditorTab[]).includes(tab) && (\n          <div className="mb-3 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-[11px] text-amber-100/80">\n            ⚠ This section is a design preview. Its data is not part of the live gameplay runtime yet, so it will not silently claim to change the active game. Books, NPCs and Monsters are live local content.\n          </div>\n        )}\n\n        <div className="flex-1 overflow-y-auto">\n''', 'editor preview banner')
# Remove the misleading item injection path until custom items are part of the unified runtime.
old_give = '''          {editItem && (\n            <button onClick={() => {\n              const inv = JSON.parse(localStorage.getItem(`tibia_inv_${player.name}`) || '[]');\n              inv.push({ ...editItem, quantity: 1, type: 'equipment' });\n              localStorage.setItem(`tibia_inv_${player.name}`, JSON.stringify(inv));\n              alert('Item given to player!');\n            }} className="px-4 py-2 rounded bg-gradient-to-b from-amber-500 to-amber-700 text-black font-bold text-xs">📦 Give to Player</button>\n          )}\n'''
new_give = '''          {editItem && (\n            <button disabled title="Custom item runtime wiring is pending" className="cursor-not-allowed rounded bg-slate-800/70 px-4 py-2 text-xs font-bold text-slate-500">📦 Runtime wiring pending</button>\n          )}\n'''
s = replace_once(s, old_give, new_give, 'disable fake custom item injection')
# NPC creator: map-aware and sanitized.
s = replace_once(s,
'''  const [form, setForm] = useState({ name: '', emoji: '🧙', color: '#9bd4ff', role: 'guard', posX: 40, posY: 42, dialogueText: 'Greetings, traveler!' });\n\n  const save = () => {\n    if (!form.name.trim()) return;\n    const npc: CustomNPC = { id: `npc_${Date.now()}`, ...form, createdAt: Date.now() };\n    saveCustomNPC(npc);\n    setNpcs(getCustomNPCs());\n    setForm({ name: '', emoji: '🧙', color: '#9bd4ff', role: 'guard', posX: 40, posY: 42, dialogueText: 'Greetings, traveler!' });\n    alert(`🧙 NPC "${npc.name}" created! Reload map to see them.`);\n  };\n''',
'''  const [form, setForm] = useState({ name: '', emoji: '🧙', color: '#9bd4ff', role: 'guard', mapId: 'eldoria', posX: 40, posY: 42, dialogueText: 'Greetings, traveler!' });\n\n  const save = () => {\n    const name = form.name.trim().slice(0, 64);\n    if (!name || !MAPS[form.mapId]) return;\n    const npc: CustomNPC = {\n      id: `npc_${Date.now()}`, ...form, name,\n      emoji: form.emoji.trim().slice(0, 8) || '🧙',\n      posX: Math.max(0, Math.min(MAP_WIDTH - 1, Math.floor(form.posX))),\n      posY: Math.max(0, Math.min(MAP_HEIGHT - 1, Math.floor(form.posY))),\n      dialogueText: form.dialogueText.trim().slice(0, 600) || 'Greetings, traveler!',\n      createdAt: Date.now(),\n    };\n    saveCustomNPC(npc);\n    setNpcs(getCustomNPCs());\n    setForm({ name: '', emoji: '🧙', color: '#9bd4ff', role: 'guard', mapId: form.mapId, posX: 40, posY: 42, dialogueText: 'Greetings, traveler!' });\n    alert(`🧙 NPC "${npc.name}" created in ${MAPS[npc.mapId || 'eldoria']?.name || 'Eldoria'}! Close the editor to refresh the world.`);\n  };\n''', 'npc creator live map')
s = replace_once(s,
'''              <div className="flex-1"><span className="text-purple-200 font-bold">{n.name}</span><span className="text-purple-200/50 text-[10px] ml-2">{n.role} · {n.posX},{n.posY}</span></div>\n''',
'''              <div className="flex-1"><span className="text-purple-200 font-bold">{n.name}</span><span className="text-purple-200/50 text-[10px] ml-2">{MAPS[n.mapId || 'eldoria']?.name || n.mapId || 'Eldoria'} · {n.role} · {n.posX},{n.posY}</span></div>\n''', 'npc list map')
s = replace_once(s,
'''          <SelectField label="Role" value={form.role} options={['guard', 'merchant', 'quest', 'innkeeper', 'banker', 'trainer']} onChange={(v) => setForm({ ...form, role: v })} />\n          <div>\n''',
'''          <SelectField label="Role" value={form.role} options={['guard', 'merchant', 'quest', 'innkeeper', 'banker', 'trainer']} onChange={(v) => setForm({ ...form, role: v })} />\n          <SelectField label="Map" value={form.mapId} options={Object.keys(MAPS)} optionLabels={Object.fromEntries(Object.values(MAPS).map((m) => [m.id, m.name]))} onChange={(v) => setForm({ ...form, mapId: v })} />\n          <div>\n''', 'npc map selector')
# Monster creator: map-aware and sanitized.
s = replace_once(s,
'''  const [form, setForm] = useState({ name: '', emoji: '👹', color: '#c13030', hp: 100, attack: 15, defense: 5, speed: 1100, xp: 50, size: 1, type: 'normal' as 'normal' | 'elite' | 'boss', level: 5, posX: 25, posY: 25 });\n\n  const save = () => {\n    if (!form.name.trim()) return;\n    const m: CustomMonster = { id: `monster_${Date.now()}`, ...form, createdAt: Date.now() };\n    saveCustomMonster(m);\n    setMonsters(getCustomMonsters());\n    setForm({ name: '', emoji: '👹', color: '#c13030', hp: 100, attack: 15, defense: 5, speed: 1100, xp: 50, size: 1, type: 'normal', level: 5, posX: 25, posY: 25 });\n    alert(`👹 Monster "${m.name}" created! Reload map to spawn it.`);\n  };\n''',
'''  const [form, setForm] = useState({ name: '', emoji: '👹', color: '#c13030', hp: 100, attack: 15, defense: 5, speed: 1100, xp: 50, size: 1, type: 'normal' as 'normal' | 'elite' | 'boss', level: 5, mapId: 'eldoria', posX: 25, posY: 25 });\n\n  const save = () => {\n    const name = form.name.trim().slice(0, 64);\n    if (!name || !MAPS[form.mapId]) return;\n    const m: CustomMonster = {\n      id: `monster_${Date.now()}`, ...form, name,\n      emoji: form.emoji.trim().slice(0, 8) || '👹',\n      hp: Math.max(1, Math.min(1_000_000, Math.floor(form.hp))),\n      attack: Math.max(0, Math.min(100_000, Math.floor(form.attack))),\n      defense: Math.max(0, Math.min(100_000, Math.floor(form.defense))),\n      speed: Math.max(100, Math.min(60_000, Math.floor(form.speed))),\n      xp: Math.max(0, Math.min(10_000_000, Math.floor(form.xp))),\n      size: Math.max(0.5, Math.min(4, Number(form.size) || 1)),\n      level: Math.max(1, Math.min(999, Math.floor(form.level))),\n      posX: Math.max(0, Math.min(MAP_WIDTH - 1, Math.floor(form.posX))),\n      posY: Math.max(0, Math.min(MAP_HEIGHT - 1, Math.floor(form.posY))),\n      createdAt: Date.now(),\n    };\n    saveCustomMonster(m);\n    setMonsters(getCustomMonsters());\n    setForm({ name: '', emoji: '👹', color: '#c13030', hp: 100, attack: 15, defense: 5, speed: 1100, xp: 50, size: 1, type: 'normal', level: 5, mapId: form.mapId, posX: 25, posY: 25 });\n    alert(`👹 Monster "${m.name}" created in ${MAPS[m.mapId || 'eldoria']?.name || 'Eldoria'}! Close the editor to refresh the world.`);\n  };\n''', 'monster creator live map')
s = replace_once(s,
'''              <div className="flex-1"><span className="text-purple-200 font-bold">{m.name}</span><span className="text-purple-200/50 text-[10px] ml-2">Lv{m.level} {m.type} · {m.hp}HP {m.attack}ATK · {m.posX},{m.posY}</span></div>\n''',
'''              <div className="flex-1"><span className="text-purple-200 font-bold">{m.name}</span><span className="text-purple-200/50 text-[10px] ml-2">{MAPS[m.mapId || 'eldoria']?.name || m.mapId || 'Eldoria'} · Lv{m.level} {m.type} · {m.hp}HP {m.attack}ATK · {m.posX},{m.posY}</span></div>\n''', 'monster list map')
s = replace_once(s,
'''          <SelectField label="Type" value={form.type} options={['normal', 'elite', 'boss']} onChange={(v) => setForm({ ...form, type: v as 'normal' | 'elite' | 'boss' })} />\n          <Field label="Level" type="number" value={form.level} onChange={(v) => setForm({ ...form, level: parseInt(v) || 1 })} />\n''',
'''          <SelectField label="Type" value={form.type} options={['normal', 'elite', 'boss']} onChange={(v) => setForm({ ...form, type: v as 'normal' | 'elite' | 'boss' })} />\n          <SelectField label="Map" value={form.mapId} options={Object.keys(MAPS)} optionLabels={Object.fromEntries(Object.values(MAPS).map((m) => [m.id, m.name]))} onChange={(v) => setForm({ ...form, mapId: v })} />\n          <Field label="Level" type="number" value={form.level} onChange={(v) => setForm({ ...form, level: parseInt(v) || 1 })} />\n''', 'monster map selector')
# SelectField supports labels for IDs.
s = replace_once(s,
'''function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {\n''',
'''function SelectField({ label, value, options, optionLabels, onChange }: { label: string; value: string; options: string[]; optionLabels?: Record<string, string>; onChange: (v: string) => void }) {\n''', 'select field labels signature')
s = replace_once(s,
'''      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/40 text-purple-100">\n        {options.map((o) => <option key={o} value={o}>{o}</option>)}\n      </select>\n''',
'''      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/40 text-purple-100">\n        {options.map((o) => <option key={o} value={o}>{optionLabels?.[o] || o}</option>)}\n      </select>\n''', 'select field label rendering')
p.write_text(s)

# ---------------------------------------------------------------------
# Game runtime: offline-only debug admin + live custom NPCs/monsters.
# ---------------------------------------------------------------------
p = Path('src/components/GameScreen.tsx')
s = p.read_text()
s = replace_once(s,
'''const VIEW_W = 19;\nconst VIEW_H = 13;\n\nexport default function GameScreen''',
'''const VIEW_W = 19;\nconst VIEW_H = 13;\n\nfunction customNpcToRuntime(npc: CustomNPC): NPC {\n  const validRoles: NPC['role'][] = ['merchant', 'quest', 'banker', 'trainer', 'guard', 'innkeeper'];\n  const role: NPC['role'] = validRoles.includes(npc.role as NPC['role']) ? npc.role as NPC['role'] : 'guard';\n  const options: NPC['dialogues'][number]['options'] = [{ text: 'Farewell.', action: 'bye' }];\n  if (role === 'banker') options.unshift({ text: 'Bank & depot', action: 'bank' });\n  if (role === 'trainer') options.unshift({ text: 'Train me', action: 'train' });\n  if (role === 'innkeeper') {\n    options.unshift({ text: 'Food & drinks', action: 'food' });\n    options.unshift({ text: 'Rest (50 gold)', action: 'heal' });\n  }\n  return {\n    id: npc.id, name: npc.name, pos: { x: npc.posX, y: npc.posY },\n    emoji: npc.emoji, color: npc.color, role,\n    dialogues: [{ text: npc.dialogueText || 'Greetings, traveler!', options }],\n  };\n}\n\nfunction customMonsterToRuntime(monster: CustomMonster): Monster {\n  const pos = { x: monster.posX, y: monster.posY };\n  return {\n    id: monster.id, name: monster.name, pos: { ...pos }, hp: monster.hp, maxHp: monster.hp,\n    attack: monster.attack, defense: monster.defense, speed: monster.speed, xp: monster.xp,\n    color: monster.color, emoji: monster.emoji, lastMove: 0, lastAttack: 0,\n    respawnPos: { ...pos }, dead: false, respawnAt: 0, size: monster.size,\n    level: monster.level, type: monster.type,\n  };\n}\n\nconst customContentOnMap = <T extends { mapId?: string }>(content: T[], mapId: string) =>\n  content.filter((entry) => (entry.mapId || 'eldoria') === mapId);\n\nexport default function GameScreen''', 'runtime custom content helpers')
s = replace_once(s,
'''  const canvasRef = useRef<HTMLCanvasElement>(null);\n  const onlineAccount = Boolean(account.sessionToken && !account.offline);\n''',
'''  const canvasRef = useRef<HTMLCanvasElement>(null);\n  const onlineAccount = Boolean(account.sessionToken && !account.offline);\n  const allowLocalAdmin = account.offline === true;\n''', 'offline admin gate')
s = replace_once(s,
'''  const refreshCustomContent = () => {\n    customNpcsRef.current = getCustomNPCs();\n    customMonstersRef.current = getCustomMonsters();\n  };\n''',
'''  const refreshCustomContent = () => {\n    const previousNpcIds = new Set(customNpcsRef.current.map((npc) => npc.id));\n    const previousMonsterIds = new Set(customMonstersRef.current.map((monster) => monster.id));\n    customNpcsRef.current = getCustomNPCs();\n    customMonstersRef.current = getCustomMonsters();\n    const mapId = currentMapIdRef.current;\n    npcsRef.current = [\n      ...npcsRef.current.filter((npc) => !previousNpcIds.has(npc.id)),\n      ...customContentOnMap(customNpcsRef.current, mapId).map(customNpcToRuntime),\n    ];\n    monstersRef.current = [\n      ...monstersRef.current.filter((monster) => !previousMonsterIds.has(monster.id)),\n      ...customContentOnMap(customMonstersRef.current, mapId).map(customMonsterToRuntime),\n    ];\n  };\n''', 'live custom content refresh')
s = replace_once(s,
'''  const monstersRef = useRef<Monster[]>(spawnInitialMonsters());\n  const npcsRef = useRef<NPC[]>(spawnNPCs());\n''',
'''  const monstersRef = useRef<Monster[]>([\n    ...spawnInitialMonsters(),\n    ...customContentOnMap(customMonstersRef.current, 'eldoria').map(customMonsterToRuntime),\n  ]);\n  const npcsRef = useRef<NPC[]>([\n    ...spawnNPCs(),\n    ...customContentOnMap(customNpcsRef.current, 'eldoria').map(customNpcToRuntime),\n  ]);\n''', 'initial live custom content')
s = replace_once(s,
'''    // Reset monsters and NPCs for the new map\n    monstersRef.current = spawnInitialMonsters();\n    npcsRef.current = spawnNPCs();\n''',
'''    // Reset monsters and NPCs for the new map, including local admin-created content.\n    customNpcsRef.current = getCustomNPCs();\n    customMonstersRef.current = getCustomMonsters();\n    monstersRef.current = [\n      ...spawnInitialMonsters(),\n      ...customContentOnMap(customMonstersRef.current, targetMapId).map(customMonsterToRuntime),\n    ];\n    npcsRef.current = [\n      ...spawnNPCs(),\n      ...customContentOnMap(customNpcsRef.current, targetMapId).map(customNpcToRuntime),\n    ];\n''', 'travel live custom content')
s = replace_once(s,
'''    // Custom NPCs (from admin creator)\n    for (const n of customNpcsRef.current) {\n      const sx = (n.posX - cam.x) * TILE_SIZE;\n      const sy = (n.posY - cam.y) * TILE_SIZE;\n      if (sx < -TILE_SIZE || sx > canvas.width || sy < -TILE_SIZE || sy > canvas.height) continue;\n      drawNPC(ctx, sx, sy, TILE_SIZE, { name: n.name, emoji: n.emoji, color: n.color, role: n.role }, now);\n    }\n\n''', '', 'remove duplicate custom npc draw loop')
s = replace_once(s,
'''      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {\n''',
'''      if (allowLocalAdmin && e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {\n''', 'admin hotkey gate')
old_admin_button = '''          <button\n            onClick={() => setShowAdmin((s) => !s)}\n            className="moria-button flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-violet-200"\n            title="Admin Panel (Ctrl+Shift+A)"\n          >\n            <span>⚡</span><span className="hidden lg:inline">Admin</span>\n          </button>\n'''
new_admin_button = '''          {allowLocalAdmin && (\n            <button\n              onClick={() => setShowAdmin((s) => !s)}\n              className="moria-button flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-violet-200"\n              title="Offline Debug Admin (Ctrl+Shift+A)"\n            >\n              <span>⚡</span><span className="hidden lg:inline">Debug</span>\n            </button>\n          )}\n'''
s = replace_once(s, old_admin_button, new_admin_button, 'admin topbar gate')
s = replace_once(s, '{showEditor && (\n            <GameEditor', '{allowLocalAdmin && showEditor && (\n            <GameEditor', 'editor render gate')
s = replace_once(s, '{showAdmin && (\n            <AdminPanel', '{allowLocalAdmin && showAdmin && (\n            <AdminPanel', 'admin render gate')
s = replace_once(s, '{showQuestCreator && (\n            <QuestCreator', '{allowLocalAdmin && showQuestCreator && (\n            <QuestCreator', 'quest creator render gate')
s = replace_once(s, '{showWorldEventCreator && (\n            <WorldEventCreator', '{allowLocalAdmin && showWorldEventCreator && (\n            <WorldEventCreator', 'world event creator render gate')
p.write_text(s)

print('runtime editor hardening 3.6 applied')
