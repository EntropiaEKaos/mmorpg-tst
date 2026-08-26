from pathlib import Path


def replace(path, old, new, marker):
    p = Path(path)
    s = p.read_text()
    if new in s:
        return
    if old not in s:
        raise SystemExit(f'pattern not found: {marker}')
    p.write_text(s.replace(old, new, 1))

# Server keeps validated combat target as authoritative state.
replace(
    'server/engine/GameState.mjs',
    '''    const monster = monsters.find(m => m.id === monsterId && !m.dead);\n    if (!monster) return false;\n\n    const dist = Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y);\n    if (dist > 2) return false;\n    player.lastAttack = now;''',
    '''    const monster = monsters.find(m => m.id === monsterId && !m.dead);\n    if (!monster) return false;\n\n    const dist = Math.abs(monster.x - player.x) + Math.abs(monster.y - player.y);\n    if (dist > 2) return false;\n    player.targetId = monster.id;\n    player.lastAttack = now;''',
    'authoritative attack target',
)

# React HUD refresh is decoupled from the 60fps canvas loop.
replace(
    'src/components/GameScreen.tsx',
    '''  const lastBroadcastRef = useRef(0);\n  const [onlineCount, setOnlineCount] = useState(1);''',
    '''  const lastBroadcastRef = useRef(0);\n  const lastHudTickRef = useRef(0);\n  const [onlineCount, setOnlineCount] = useState(1);''',
    'hud throttle ref',
)
replace(
    'src/components/GameScreen.tsx',
    '''      render(now);\n      setHudTick((t) => (t + 1) % 100000);\n      rafId = requestAnimationFrame(loop);''',
    '''      render(now);\n      // Keep the canvas at display refresh rate without forcing a full React\n      // reconciliation every frame. 10fps is ample for cooldown/HUD text.\n      if (now - lastHudTickRef.current >= 100) {\n        lastHudTickRef.current = now;\n        setHudTick((t) => (t + 1) % 100000);\n      }\n      rafId = requestAnimationFrame(loop);''',
    'hud throttle loop',
)

replace(
    'src/components/GameScreen.tsx',
    '''            const t = monstersRef.current.find((m) => m.id === player.targetId);\n            if (!t || t.dead) return null;''',
    '''            const t = serverSync.isActive()\n              ? serverMonstersRef.current.find((m: any) => m.id === player.targetId && m.hp > 0)\n              : monstersRef.current.find((m) => m.id === player.targetId && !m.dead);\n            if (!t) return null;''',
    'online target frame source',
)
replace(
    'src/components/GameScreen.tsx',
    '''                      <div className="h-full bg-gradient-to-r from-red-600 to-red-400" style={{ width: `${(t.hp / t.maxHp) * 100}%` }} />''',
    '''                      <div className="h-full bg-gradient-to-r from-rose-700 to-rose-400" style={{ width: `${Math.max(0, Math.min(100, (t.hp / Math.max(1, t.maxHp)) * 100))}%` }} />''',
    'target hp clamp',
)

# Regression coverage for target persistence.
test_path = Path('server/test/hardening.test.mjs')
t = test_path.read_text()
marker = "test('successful authoritative attacks persist the selected target'"
if marker not in t:
    t += '''\n\ntest('successful authoritative attacks persist the selected target', () => {\n  const { id, player } = makePlayer();\n  const monsters = engine.monstersByMap.get(player.mapId);\n  const monster = {\n    id: `target_${Date.now()}_${Math.random()}`, name: 'Target Dummy', emoji: '🎯',\n    x: player.x + 1, y: player.y, spawnX: player.x + 1, spawnY: player.y,\n    hp: 9999, maxHp: 9999, attack: 0, defense: 0, xp: 0, level: 1, type: 'normal',\n    dead: false, lastAttack: 0, lastMove: 0, speed: 9999, respawnAt: 0,\n  };\n  monsters.push(monster);\n  try {\n    player.lastAttack = 0;\n    assert.equal(engine.processIntent(id, { type: 'attack', payload: { monsterId: monster.id } }), true);\n    assert.equal(player.targetId, monster.id);\n  } finally {\n    const idx = monsters.indexOf(monster);\n    if (idx >= 0) monsters.splice(idx, 1);\n    cleanup(id);\n  }\n});\n'''
    test_path.write_text(t)
