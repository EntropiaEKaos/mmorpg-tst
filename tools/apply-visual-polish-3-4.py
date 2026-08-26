from pathlib import Path

p = Path('src/components/GameScreen.tsx')
s = p.read_text()


def replace_once(old: str, new: str, marker: str):
    global s
    if new in s:
        return
    if old not in s:
        raise SystemExit(f'pattern not found: {marker}')
    s = s.replace(old, new, 1)

replace_once(
'''    <div className="w-screen h-screen flex flex-col bg-black text-amber-100 overflow-hidden select-none">''',
'''    <div className="w-screen h-screen flex flex-col bg-[#05070c] text-slate-100 overflow-hidden select-none">''',
'root shell')

replace_once(
'''      <div
        className="flex items-center justify-between px-3 py-1 border-b-2 text-xs"
        style={{
          background: 'linear-gradient(180deg, #3a2a1a 0%, #1a0f05 100%)',
          borderColor: '#8b6914',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold tracking-widest" style={{ fontFamily: 'serif' }}>MOR'IA</span>
          <span className="text-amber-200/50">· {VOCATIONS[player.vocation]?.name} Lv{player.level} ·</span>
          <span className="px-2 py-0.5 rounded text-[10px] border" style={{ color: MAPS[currentMapId]?.biome === 'snow' ? '#9bd4ff' : MAPS[currentMapId]?.biome === 'shadow' ? '#9b59ff' : '#2ecc71', borderColor: 'currentColor' }}>🌍 {MAPS[currentMapId]?.name}</span>
        </div>
        <div className="flex items-center gap-1">''',
'''      <div className="moria-panel relative z-40 flex min-h-12 shrink-0 items-center gap-3 rounded-none border-x-0 border-t-0 px-3 py-1.5 text-xs">
        <div className="flex shrink-0 items-center gap-3 pr-2">
          <span className="moria-title text-base font-black tracking-[0.16em] text-amber-100">MOR'IA</span>
          <span className="hidden text-slate-500 md:inline">{VOCATIONS[player.vocation]?.name} · Lv {player.level}</span>
          <span className="moria-chip rounded-lg px-2 py-1 text-[9px] font-bold tracking-wider" style={{ color: MAPS[currentMapId]?.biome === 'snow' ? '#9bd4ff' : MAPS[currentMapId]?.biome === 'shadow' ? '#b398ff' : '#71d8ac', borderColor: 'currentColor' }}>◆ {MAPS[currentMapId]?.name}</span>
        </div>
        <div className="moria-scrollbar flex min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto pb-0.5">''',
'top bar')

replace_once(
'''            className="px-2 py-0.5 text-xs rounded bg-purple-900/50 hover:bg-purple-800/60 text-purple-100 border border-purple-700/50 flex items-center gap-1"''',
'''            className="moria-button flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-violet-200"''',
'admin button')

replace_once(
'''            className={`px-2 py-0.5 text-xs rounded border ${muted ? 'bg-gray-800/50 text-gray-500 border-gray-600' : 'bg-blue-900/50 text-blue-200 border-blue-600'}`}''',
'''            className={`moria-button shrink-0 rounded-lg px-2 py-1 text-[10px] ${muted ? 'text-slate-600' : 'text-sky-200'}`}''',
'audio button')

replace_once(
'''            className={`px-2 py-0.5 text-xs rounded border flex items-center gap-1 ${netMode === 'online' ? 'bg-green-900/50 text-green-200 border-green-600' : netMode === 'local' ? 'bg-yellow-900/50 text-yellow-200 border-yellow-600' : 'bg-gray-800/50 text-gray-400 border-gray-600'}`}''',
'''            className={`moria-button flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] ${netMode === 'online' ? 'text-emerald-200' : netMode === 'local' ? 'text-amber-200' : 'text-slate-500'}`}''',
'network button')

replace_once(
'''            className="px-2 py-0.5 text-xs rounded bg-red-900/50 hover:bg-red-800/60 text-red-100 border border-red-700/50"''',
'''            className="moria-button shrink-0 rounded-lg px-2 py-1 text-[10px] text-rose-200"''',
'logout button')

replace_once(
'''        <div className="flex-1 flex items-center justify-center bg-black relative">
          <canvas''',
'''        <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-[#03060a]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(70,100,140,0.10),transparent_44%),linear-gradient(180deg,rgba(8,12,19,0.2),rgba(0,0,0,0.72))]" />
          <div className="pointer-events-none absolute inset-x-[8%] top-0 h-px bg-gradient-to-r from-transparent via-amber-200/20 to-transparent" />
          <canvas''',
'canvas shell')

replace_once(
'''              transition: 'transform 0.2s ease-out',
            }}''',
'''              transition: 'transform 0.2s ease-out',
              borderRadius: '16px',
              background: '#05080d',
              boxShadow: '0 28px 90px rgba(0,0,0,0.58), 0 0 0 1px rgba(164,184,216,0.10), 0 0 55px rgba(110,168,255,0.05)',
            }}''',
'canvas style')

replace_once(
'''          <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
            <button onClick={() => { const nz = Math.min(2.5, zoomRef.current + 0.25); zoomRef.current = nz; setZoom(nz); }}
                    className="w-9 h-9 rounded-lg border border-amber-700/50 bg-black/70 text-amber-200 text-lg font-bold hover:bg-amber-900/50">+</button>
            <div className="text-center text-[9px] text-amber-200/60 bg-black/70 rounded py-0.5">{Math.round(zoom * 100)}%</div>
            <button onClick={() => { const nz = Math.max(0.6, zoomRef.current - 0.25); zoomRef.current = nz; setZoom(nz); }}
                    className="w-9 h-9 rounded-lg border border-amber-700/50 bg-black/70 text-amber-200 text-lg font-bold hover:bg-amber-900/50">−</button>
            <button onClick={() => { zoomRef.current = 1; setZoom(1); }}
                    className="w-9 h-9 rounded-lg border border-amber-700/50 bg-black/70 text-amber-200 text-xs hover:bg-amber-900/50" title="Reset zoom">⊙</button>
          </div>''',
'''          <div className="moria-panel absolute bottom-4 right-4 z-20 flex flex-col gap-1 rounded-xl p-1.5">
            <button onClick={() => { const nz = Math.min(2.5, zoomRef.current + 0.25); zoomRef.current = nz; setZoom(nz); }} className="moria-button flex h-8 w-8 items-center justify-center rounded-lg text-base font-black">+</button>
            <div className="text-center font-mono text-[8px] text-slate-400">{Math.round(zoom * 100)}%</div>
            <button onClick={() => { const nz = Math.max(0.6, zoomRef.current - 0.25); zoomRef.current = nz; setZoom(nz); }} className="moria-button flex h-8 w-8 items-center justify-center rounded-lg text-base font-black">−</button>
            <button onClick={() => { zoomRef.current = 1; setZoom(1); }} className="moria-button flex h-8 w-8 items-center justify-center rounded-lg text-xs" title="Reset zoom">⊙</button>
          </div>''',
'zoom controls')

replace_once(
'''              <div
                className="absolute top-2 left-2 rounded border-2 p-2 backdrop-blur-sm min-w-[220px]"
                style={{
                  background: 'linear-gradient(180deg, rgba(60,20,20,0.9) 0%, rgba(30,10,10,0.95) 100%)',
                  borderColor: t.type === 'boss' ? '#ffd700' : t.type === 'elite' ? '#c832ff' : '#8b2020',
                }}
              >''',
'''              <div className="moria-panel absolute left-3 top-3 min-w-[230px] rounded-2xl border p-3" style={{ borderColor: t.type === 'boss' ? 'rgba(255,216,123,.62)' : t.type === 'elite' ? 'rgba(184,138,255,.56)' : 'rgba(255,100,116,.42)' }}>
                <div className="moria-eyebrow mb-2" style={{ color: t.type === 'boss' ? '#ffd87b' : t.type === 'elite' ? '#b88aff' : '#ff818d' }}>{t.type === 'boss' ? 'BOSS TARGET' : t.type === 'elite' ? 'ELITE TARGET' : 'TARGET'}</div>''',
'target frame')

replace_once(
'''              <div
              className="absolute top-2 right-2 rounded border-2 p-2 backdrop-blur-sm max-w-[260px]"
              style={{
                background: 'linear-gradient(180deg, rgba(40,30,10,0.9) 0%, rgba(20,15,5,0.95) 100%)',
                borderColor: '#8b6914',
              }}
            >''',
'''            <div className="moria-panel absolute right-3 top-3 max-w-[270px] rounded-2xl border border-amber-200/20 p-3">''',
'quest tracker')

# The source indentation around the quest tracker may differ; fall back to a literal compact replacement.
if "background: 'linear-gradient(180deg, rgba(40,30,10,0.9) 0%, rgba(20,15,5,0.95) 100%)'" in s:
    s = s.replace('''            <div
              className="absolute top-2 right-2 rounded border-2 p-2 backdrop-blur-sm max-w-[260px]"
              style={{
                background: 'linear-gradient(180deg, rgba(40,30,10,0.9) 0%, rgba(20,15,5,0.95) 100%)',
                borderColor: '#8b6914',
              }}
            >''', '''            <div className="moria-panel absolute right-3 top-3 max-w-[270px] rounded-2xl border border-amber-200/20 p-3">''', 1)

replace_once(
'''              <div className="text-[10px] text-amber-200/60 tracking-widest mb-1">📜 ACTIVE QUESTS</div>''',
'''              <div className="moria-eyebrow mb-2 text-[9px] text-amber-200/80">📜 ACTIVE QUESTS</div>''',
'quest tracker heading')

replace_once(
'''                    <div className="text-xs text-amber-200 font-semibold">{quest.name}</div>''',
'''                    <div className="text-xs font-bold text-slate-100">{quest.name}</div>''',
'quest name')

replace_once(
'''                      <div key={i} className="text-[10px] text-amber-200/70">''',
'''                      <div key={i} className="text-[10px] text-slate-400">''',
'quest objective')

replace_once(
'''      className="px-2 py-0.5 text-xs rounded bg-amber-900/50 hover:bg-amber-800/60 text-amber-100 border border-amber-700/50 flex items-center gap-1"''',
'''      className="moria-button flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] text-slate-300"''',
'top button helper')

replace_once(
'''      <span className="text-[9px] text-amber-400/70">({hotkey})</span>''',
'''      {hotkey && <span className="text-[8px] text-amber-200/45">{hotkey}</span>}''',
'top button hotkey')

p.write_text(s)
