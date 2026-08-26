from pathlib import Path


def patch_file(path: str, replacements):
    p = Path(path)
    s = p.read_text()
    changed = False
    for old, new, required in replacements:
        if new in s:
            continue
        if old in s:
            s = s.replace(old, new, 1)
            changed = True
        elif required:
            raise SystemExit(f'pattern not found in {path}: {old[:70]}')
    if changed:
        p.write_text(s)

patch_file('src/components/Inventory.tsx', [
    ('''    <div\n      className="absolute inset-0 flex items-center justify-center p-4 z-20"\n      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}\n      onClick={onClose}\n    >''', '''    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" onClick={onClose}>''', True),
    ('''      <div\n        onClick={(e) => e.stopPropagation()}\n        className="rounded-lg border-2 p-4 max-w-2xl w-full max-h-[85vh] overflow-y-auto"\n        style={{\n          background: 'linear-gradient(180deg, rgba(60,40,20,0.98) 0%, rgba(30,20,10,0.98) 100%)',\n          borderColor: '#8b6914',\n          boxShadow: '0 0 40px rgba(255,150,50,0.2)',\n        }}\n      >''', '''      <div onClick={(e) => e.stopPropagation()} className="moria-panel moria-scrollbar moria-fade-up max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-amber-200/20 p-4 sm:p-5">''', True),
    ('''        <div className="flex items-center justify-between mb-3">''', '''        <div className="mb-4 flex items-center justify-between gap-3">''', False),
    ('''          <button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-xl">✕</button>''', '''          <button onClick={onClose} className="moria-button flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm text-slate-400" aria-label="Close inventory">✕</button>''', False),
    ('''        <div className="grid grid-cols-8 gap-1.5">''', '''        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">''', True),
    ('''                      background: isEquipment\n                        ? `linear-gradient(180deg, ${RARITY_COLORS[item.equipment!.rarity]}30 0%, rgba(20,10,5,0.9) 100%)`\n                        : 'linear-gradient(180deg, rgba(40,30,15,0.8) 0%, rgba(20,10,5,0.9) 100%)',\n                      borderColor: isEquipment ? RARITY_COLORS[item.equipment!.rarity] : '#8b6914',''', '''                      background: isEquipment\n                        ? `linear-gradient(180deg, ${RARITY_COLORS[item.equipment!.rarity]}24 0%, rgba(7,11,18,0.96) 100%)`\n                        : 'linear-gradient(180deg, rgba(25,34,48,0.86) 0%, rgba(7,11,18,0.96) 100%)',\n                      borderColor: isEquipment ? RARITY_COLORS[item.equipment!.rarity] : 'rgba(229,196,119,0.22)',''', False),
    ('''            <div className="text-xs text-amber-300 tracking-widest mb-2">🛒 {shopName}'S SHOP</div>''', '''            <div className="moria-eyebrow mb-2">🛒 {shopName || 'MERCHANT'} · SHOP</div>''', True),
    ('''                    const mPct = (mastery.progress / (mastery.level * 10)) * 100;''', '''                    const mPct = Math.max(0, Math.min(100, (mastery.progress / Math.max(1, mastery.level * 10)) * 100));''', False),
])

patch_file('src/components/CharacterPanel.tsx', [
    ('''  const vocation = VOCATIONS[player.vocation];\n  const hpPct = (player.hp / player.maxHp) * 100;\n  const mpPct = (player.mana / player.maxMana) * 100;\n  const xpPct = (player.xp / player.xpNext) * 100;\n  const derived = computeDerivedStats(player);''', '''  const vocation = VOCATIONS[player.vocation];\n  const derived = computeDerivedStats(player);\n  const hpPct = Math.max(0, Math.min(100, (player.hp / Math.max(1, derived.totalMaxHp)) * 100));\n  const mpPct = Math.max(0, Math.min(100, (player.mana / Math.max(1, derived.totalMaxMana)) * 100));\n  const xpPct = Math.max(0, Math.min(100, (player.xp / Math.max(1, player.xpNext)) * 100));''', True),
    ('''    <div\n      className="absolute inset-0 flex items-center justify-center p-4 z-20"\n      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}\n      onClick={onClose}\n    >''', '''    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/68 p-4 backdrop-blur-md" onClick={onClose}>''', True),
    ('''      <div\n        onClick={(e) => e.stopPropagation()}\n        className="rounded-xl border-2 p-5 max-w-5xl w-full max-h-[92vh] overflow-y-auto"\n        style={{\n          background: 'linear-gradient(180deg, rgba(60,40,20,0.98) 0%, rgba(30,20,10,0.99) 100%)',\n          borderColor: vocation?.color || '#8b6914',\n          boxShadow: `0 0 50px ${vocation?.color || '#8b6914'}30`,\n        }}\n      >''', '''      <div onClick={(e) => e.stopPropagation()} className="moria-panel moria-scrollbar moria-fade-up max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-3xl border p-4 sm:p-6" style={{ borderColor: `${vocation?.color || '#e5c477'}55`, boxShadow: `0 30px 90px rgba(0,0,0,.55), 0 0 45px ${vocation?.color || '#e5c477'}14` }}>''', True),
    ('''        <div className="grid grid-cols-12 gap-4">''', '''        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">''', True),
    ('''          <div className="col-span-5">''', '''          <div className="xl:col-span-5">''', True),
    ('''          <div className="col-span-3 space-y-3">''', '''          <div className="space-y-3 xl:col-span-3">''', True),
    ('''          <div className="col-span-4 space-y-3 max-h-[70vh] overflow-y-auto pr-1">''', '''          <div className="moria-scrollbar max-h-[70vh] space-y-3 overflow-y-auto pr-1 xl:col-span-4">''', True),
    ('''            <div className="rounded-lg p-3 border border-amber-900/40" style={{ background: 'rgba(0,0,0,0.3)' }}>''', '''            <div className="moria-card rounded-2xl p-3">''', True),
    ('''                            ? `linear-gradient(180deg, ${RARITY_COLORS[eq.rarity]}40 0%, rgba(20,10,5,0.95) 100%)`\n                            : 'linear-gradient(180deg, rgba(40,30,15,0.5) 0%, rgba(15,8,4,0.8) 100%)',\n                          borderColor: eq ? RARITY_COLORS[eq.rarity] : 'rgba(139,105,20,0.3)',''', '''                            ? `linear-gradient(180deg, ${RARITY_COLORS[eq.rarity]}28 0%, rgba(7,11,18,0.96) 100%)`\n                            : 'linear-gradient(180deg, rgba(25,34,48,0.72) 0%, rgba(7,11,18,0.96) 100%)',\n                          borderColor: eq ? RARITY_COLORS[eq.rarity] : 'rgba(150,170,202,0.18)',''', False),
    ('''              <Bar label="❤ HP" value={player.hp} max={player.maxHp} color="red" pct={hpPct} />\n              <Bar label="✦ MP" value={player.mana} max={player.maxMana} color="blue" pct={mpPct} />''', '''              <Bar label="❤ HP" value={player.hp} max={derived.totalMaxHp} color="red" pct={hpPct} />\n              <Bar label="✦ MP" value={player.mana} max={derived.totalMaxMana} color="blue" pct={mpPct} />''', True),
    ('''          <button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-2xl">✕</button>''', '''          <button onClick={onClose} className="moria-button flex h-9 w-9 items-center justify-center rounded-xl text-sm text-slate-400" aria-label="Close character panel">✕</button>''', False),
])

patch_file('src/components/QuestLog.tsx', [
    ('''    <div\n      className="absolute inset-0 flex items-center justify-center p-4 z-20"\n      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}\n      onClick={onClose}\n    >''', '''    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" onClick={onClose}>''', True),
    ('''      <div\n        onClick={(e) => e.stopPropagation()}\n        className="rounded-lg border-2 p-4 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"\n        style={{\n          background: 'linear-gradient(180deg, rgba(60,40,20,0.98) 0%, rgba(30,20,10,0.98) 100%)',\n          borderColor: '#8b6914',\n          boxShadow: '0 0 40px rgba(255,150,50,0.2)',\n        }}\n      >''', '''      <div onClick={(e) => e.stopPropagation()} className="moria-panel moria-fade-up flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-amber-200/20 p-4 sm:p-5">''', True),
    ('''          <h2\n            className="text-xl font-bold tracking-widest text-transparent bg-clip-text"\n            style={{ backgroundImage: 'linear-gradient(180deg, #f4e04d 0%, #8b6914 100%)' }}\n          >\n            📜 QUEST LOG\n          </h2>''', '''          <div><div className="moria-eyebrow">Adventure journal</div><h2 className="moria-title mt-1 text-2xl font-black">📜 Quest Log</h2></div>''', True),
    ('''          <button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-xl">✕</button>''', '''          <button onClick={onClose} className="moria-button flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-400" aria-label="Close quest log">✕</button>''', False),
    ('''        <div className="flex-1 overflow-y-auto space-y-4 pr-2">''', '''        <div className="moria-scrollbar flex-1 space-y-5 overflow-y-auto pr-2">''', True),
    ('''                  const progress = aq.objectives.reduce((s, o) => s + o.current, 0) /\n                                   aq.objectives.reduce((s, o) => s + o.count, 0);''', '''                  const objectiveTotal = aq.objectives.reduce((sum, objective) => sum + objective.count, 0);\n                  const progress = objectiveTotal > 0\n                    ? aq.objectives.reduce((sum, objective) => sum + objective.current, 0) / objectiveTotal\n                    : 0;''', True),
    ('''              <div className="grid grid-cols-2 gap-2">''', '''              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">''', True),
    ('''            <div className="grid grid-cols-3 gap-1.5">''', '''            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">''', False),
    ('''            <div className="grid grid-cols-4 gap-1.5">''', '''            <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">''', False),
])

patch_file('src/components/TalentTree.tsx', [
    ('''  const availablePoints = totalPoints - spentPoints;''', '''  const availablePoints = Math.max(0, totalPoints - spentPoints);''', True),
    ('''    <div\n      className="absolute inset-0 flex items-center justify-center p-4 z-20"\n      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}\n      onClick={onClose}\n    >''', '''    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md" onClick={onClose}>''', True),
    ('''      <div\n        onClick={(e) => e.stopPropagation()}\n        className="rounded-lg border-2 p-5 max-w-3xl w-full max-h-[90vh] overflow-y-auto"\n        style={{\n          background: 'linear-gradient(180deg, rgba(50,25,10,0.98) 0%, rgba(25,12,5,0.98) 100%)',\n          borderColor: vocation?.color || '#8b6914',\n          boxShadow: `0 0 40px ${vocation?.color || '#8b6914'}30`,\n        }}\n      >''', '''      <div onClick={(e) => e.stopPropagation()} className="moria-panel moria-scrollbar moria-fade-up max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl border p-4 sm:p-6" style={{ borderColor: `${vocation?.color || '#e5c477'}55`, boxShadow: `0 30px 90px rgba(0,0,0,.55), 0 0 40px ${vocation?.color || '#e5c477'}12` }}>''', True),
    ('''              className="px-3 py-1 text-xs rounded bg-red-900/40 hover:bg-red-700/60 text-red-200 border border-red-700/50 disabled:opacity-40"''', '''              className="moria-button rounded-lg px-3 py-1.5 text-[10px] font-bold text-rose-200 disabled:opacity-40"''', False),
    ('''            <button onClick={onClose} className="text-amber-200/60 hover:text-amber-100 text-xl">✕</button>''', '''            <button onClick={onClose} className="moria-button flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-400" aria-label="Close talent tree">✕</button>''', False),
    ('''              <div className="grid grid-cols-4 gap-2">''', '''              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">''', True),
])
