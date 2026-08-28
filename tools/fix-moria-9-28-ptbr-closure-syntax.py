from pathlib import Path

p=Path('src/components/HUD.tsx')
s=p.read_text(encoding='utf-8')
old="title={`${tr('Minimap')} · ${tr(MAPS[mapId]?.name || mapId)} · ${player.pos.x}, ${player.pos.y}`}`"
new="title={`${tr('Minimap')} · ${tr(MAPS[mapId]?.name || mapId)} · ${player.pos.x}, ${player.pos.y}`}"
if old not in s:
    if new not in s:
        raise SystemExit('Malformed Minimap title anchor not found')
else:
    s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('HUD JSX closure syntax corrected')
