from pathlib import Path
p=Path('src/components/LivingRealmPlayerPanel916.tsx')
s=p.read_text()
s=s.replace("  const faction=(realm?.factions||[]).find((f:any)=>f.id===factionId);\n  const node=(realm?.nodes||[]).find((n:any)=>n.mapId===player.mapId);\n  const localSpecies=(realm?.tamingSpecies||[]).filter((s:any)=>s.mapId===player.mapId);", "  const faction=(realm?.factions||[]).find((f:any)=>f.id===factionId);\n  const mapId=serverSync.getMapId();\n  const node=(realm?.nodes||[]).find((n:any)=>n.mapId===mapId);\n  const localSpecies=(realm?.tamingSpecies||[]).filter((s:any)=>s.mapId===mapId);")
p.write_text(s)
print('Living Realm player panel now reads authoritative map from ServerSync')
