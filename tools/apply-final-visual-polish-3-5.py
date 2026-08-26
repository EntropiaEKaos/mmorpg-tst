from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# ---------------------------------------------------------------------
# Game shell: derived lifesteal ceiling + remaining in-game modal polish.
# ---------------------------------------------------------------------
p = Path('src/components/GameScreen.tsx')
s = p.read_text()
s = replace_once(s,
'''      p.hp = Math.min(p.maxHp, p.hp + heal);
      addFloatingText(`+${heal}`, p.pos, '#ff5599');
''',
'''      p.hp = Math.min(derived.totalMaxHp, p.hp + heal);
      addFloatingText(`+${heal}`, p.pos, '#ff5599');
''', 'lifesteal derived hp')

# Connect modal.
s = s.replace('''            <div className="absolute inset-0 flex items-center justify-center p-4 z-50"
                 style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}
                 onClick={() => setShowConnect(false)}>''', '''            <div className="moria-overlay absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
                 onClick={() => setShowConnect(false)}>''', 1)
s = replace_once(s,
'''              <div onClick={(e) => e.stopPropagation()}
                   className="rounded-xl border-2 p-6 max-w-md w-full"
                   style={{ background: 'linear-gradient(180deg, rgba(20,30,20,0.98) 0%, rgba(10,15,10,0.98) 100%)', borderColor: netMode === 'online' ? '#2ecc71' : '#9bd4ff', boxShadow: `0 0 50px ${netMode === 'online' ? 'rgba(46,204,113,0.4)' : 'rgba(155,212,255,0.3)'}` }}>
''',
'''              <div onClick={(e) => e.stopPropagation()}
                   className="moria-panel w-full max-w-md rounded-3xl border p-5 sm:p-6"
                   style={{ borderColor: netMode === 'online' ? 'rgba(46,204,113,.35)' : 'rgba(125,211,252,.25)', boxShadow: `0 30px 90px rgba(0,0,0,.6), 0 0 45px ${netMode === 'online' ? 'rgba(46,204,113,.10)' : 'rgba(56,189,248,.08)'}` }}>
''', 'connect panel')
s = s.replace('className="w-full px-3 py-2 rounded bg-black/60 border border-blue-700/50 text-blue-100 text-sm mb-2 focus:outline-none focus:border-blue-500"', 'className="moria-input mb-2 w-full rounded-xl px-3 py-2 text-sm text-sky-100"', 1)
s = s.replace('className="w-full py-2.5 rounded bg-gradient-to-b from-blue-500 to-blue-700 text-white font-bold text-sm mb-2"', 'className="moria-button-primary mb-2 w-full rounded-xl py-2.5 text-sm font-bold"', 1)
s = s.replace('className="w-full mt-2 py-1.5 rounded bg-black/40 text-blue-200/60 text-xs border border-blue-900/50"', 'className="moria-button mt-2 w-full rounded-lg py-1.5 text-xs text-sky-200"', 1)

# Food modal.
s = s.replace('''            <div className="absolute inset-0 flex items-center justify-center p-4 z-20"
                 style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
                 onClick={() => setShowFoodShop(false)}>''', '''            <div className="moria-overlay absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-5"
                 onClick={() => setShowFoodShop(false)}>''', 1)
s = replace_once(s,
'''              <div onClick={(e) => e.stopPropagation()}
                   className="rounded-lg border-2 p-4 max-w-lg w-full"
                   style={{ background: 'linear-gradient(180deg, rgba(60,40,20,0.98) 0%, rgba(30,20,10,0.98) 100%)', borderColor: '#ff9bcc' }}>
''',
'''              <div onClick={(e) => e.stopPropagation()}
                   className="moria-panel w-full max-w-lg rounded-3xl border border-pink-300/20 p-4 sm:p-5">
''', 'food panel')
s = s.replace('className="grid grid-cols-2 gap-2"', 'className="grid grid-cols-1 gap-2 sm:grid-cols-2"', 1)

# Dungeon status chip.
s = replace_once(s,
'''            <div className="absolute top-14 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full border-2 z-10 pointer-events-none animate-pulse"
                 style={{ background: 'linear-gradient(180deg, rgba(80,20,80,0.9) 0%, rgba(30,5,30,0.95) 100%)', borderColor: '#c832ff', boxShadow: '0 0 20px rgba(200,50,255,0.6)' }}>
''',
'''            <div className="moria-panel pointer-events-none absolute left-1/2 top-14 z-10 -translate-x-1/2 animate-pulse rounded-full border border-violet-300/40 px-4 py-1.5"
                 style={{ boxShadow: '0 0 28px rgba(168,85,247,.18)' }}>
''', 'dungeon chip')
p.write_text(s)

# ---------------------------------------------------------------------
# World event creator: responsive admin surface + sanitized event data.
# ---------------------------------------------------------------------
p = Path('src/components/WorldEventCreator.tsx')
s = p.read_text()
s = s.replace("import { MAPS } from '../game/maps';", "import { MAPS, MAP_WIDTH, MAP_HEIGHT } from '../game/maps';", 1)
s = replace_once(s,
'''  const [events, setEvents] = useState<WorldEvent[]>(getWorldEvents());
  const [form, setForm] = useState({
''',
'''  const [events, setEvents] = useState<WorldEvent[]>(getWorldEvents());
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
''', 'world creator notice')
s = replace_once(s,
'''  const create = () => {
    if (!form.name.trim()) return;
    const now = Date.now();
    const event: WorldEvent = {
      id: `we_${now}_${Math.random()}`,
      name: form.name, icon: form.icon, description: form.description || 'A world event!',
      type: form.type as WorldEvent['type'],
      targetMap: form.targetMap, targetPos: { x: form.posX, y: form.posY },
      monsterTemplate: {
        name: form.monsterName, emoji: form.monsterEmoji, color: form.monsterColor,
        hp: form.monsterHp, attack: form.monsterAttack, defense: form.monsterDefense,
        xp: form.monsterXp, level: form.monsterLevel, count: form.monsterCount, size: form.monsterSize,
      },
      rewardGold: form.rewardGold, rewardXp: form.rewardXp,
      startTime: now, endTime: now + form.duration * 60000,
      progress: { current: 0, required: form.required },
      contributors: {}, status: 'active', createdBy: 'Admin',
    };
    addWorldEvent(event);
    setEvents(getWorldEvents());
    setForm({ ...form, name: '' });
    alert(`🌍 World Event "${event.name}" created and broadcast to all players!`);
  };
''',
'''  const create = () => {
    const name = form.name.trim().slice(0, 80);
    const targetMap = MAPS[form.targetMap] ? form.targetMap : 'eldoria';
    if (!name) {
      setNotice('Event name is required.');
      return;
    }
    const finiteInt = (value: number, fallback: number, min: number, max: number) => {
      const safe = Number.isFinite(value) ? Math.floor(value) : fallback;
      return Math.max(min, Math.min(max, safe));
    };
    const now = Date.now();
    const duration = finiteInt(form.duration, 30, 1, 24 * 60);
    const required = finiteInt(form.required, 1, 1, 100000);
    const event: WorldEvent = {
      id: `we_${now}_${Math.random()}`,
      name,
      icon: form.icon.trim().slice(0, 8) || '🌍',
      description: form.description.trim().slice(0, 240) || 'A world event!',
      type: form.type as WorldEvent['type'],
      targetMap,
      targetPos: {
        x: finiteInt(form.posX, 35, 0, MAP_WIDTH - 1),
        y: finiteInt(form.posY, 50, 0, MAP_HEIGHT - 1),
      },
      monsterTemplate: {
        name: form.monsterName.trim().slice(0, 80) || 'Boss',
        emoji: form.monsterEmoji.trim().slice(0, 8) || '👹',
        color: /^#[0-9a-f]{6}$/i.test(form.monsterColor) ? form.monsterColor : '#c13030',
        hp: finiteInt(form.monsterHp, 100, 1, 10000000),
        attack: finiteInt(form.monsterAttack, 10, 0, 100000),
        defense: finiteInt(form.monsterDefense, 0, 0, 100000),
        xp: finiteInt(form.monsterXp, 100, 0, 10000000),
        level: finiteInt(form.monsterLevel, 1, 1, 10000),
        count: finiteInt(form.monsterCount, 1, 1, 500),
        size: Number.isFinite(form.monsterSize) ? Math.max(0.5, Math.min(4, form.monsterSize)) : 1,
      },
      rewardGold: finiteInt(form.rewardGold, 0, 0, 100000000),
      rewardXp: finiteInt(form.rewardXp, 0, 0, 100000000),
      startTime: now,
      endTime: now + duration * 60000,
      progress: { current: 0, required },
      contributors: {}, status: 'active', createdBy: 'Admin',
    };
    addWorldEvent(event);
    setEvents(getWorldEvents());
    setForm({ ...form, name: '' });
    setNotice(`Created ${event.name} on ${MAPS[targetMap]?.name || targetMap}.`);
  };
''', 'world event sanitation')
s = s.replace('className="absolute inset-0 flex items-center justify-center p-4 z-50"\n         style={{ background: \'rgba(0,0,0,0.92)\', backdropFilter: \'blur(8px)\' }} onClick={onClose}', 'className="moria-overlay absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-5" onClick={onClose}', 1)
s = replace_once(s,
'''           className="rounded-lg border-2 p-4 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
           style={{ background: 'linear-gradient(180deg, rgba(80,40,0,0.95) 0%, rgba(30,15,0,0.98) 100%)', borderColor: '#ff6a00', boxShadow: '0 0 50px rgba(255,106,0,0.4)' }}>
''',
'''           className="moria-panel moria-scrollbar w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-orange-300/20 p-4 sm:p-5"
           style={{ boxShadow: '0 30px 90px rgba(0,0,0,.6), 0 0 45px rgba(249,115,22,.08)' }}>
''', 'world creator panel')
s = replace_once(s,
'''        <div className="text-xs text-orange-200/60 mb-3">Create global events that appear for ALL players. Monsters spawn at the target location and killing them contributes to the event.</div>
''',
'''        <div className="text-xs text-orange-200/60 mb-3">Create validated local world events. Coordinates, duration, progression and rewards are clamped to safe ranges before persistence.</div>
        {notice && <div className="mb-3 rounded-lg border border-orange-300/20 bg-orange-950/25 px-3 py-2 text-xs text-orange-100">{notice}</div>}
''', 'world creator notice render')
s = s.replace('className="grid grid-cols-4 gap-2 text-xs"', 'className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4"')
s = s.replace('className="col-span-2"', 'className="sm:col-span-2"')
s = s.replace('className="col-span-4"', 'className="sm:col-span-2 lg:col-span-4"')
s = s.replace('className="space-y-1 max-h-32 overflow-y-auto"', 'className="moria-scrollbar max-h-32 space-y-1 overflow-y-auto pr-1"', 1)
s = s.replace('className="w-full py-1.5 rounded bg-gradient-to-b from-orange-500 to-orange-700 text-white font-bold"', 'className="moria-button-primary w-full rounded-lg py-1.5 font-bold"', 1)
p.write_text(s)

print('final visual polish 3.5 applied')
