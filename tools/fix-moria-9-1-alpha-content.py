from pathlib import Path
p = Path(__file__).resolve().parents[1] / 'server/engine/AlphaContent.mjs'
s = p.read_text(encoding='utf-8')
s = s.replace("death_knight:['Grave Slash','Frozen Resolve']", "deathknight:['Grave Slash','Frozen Resolve']")
anchor = "const maps = REGIONS.map(region => {\n  const [townX,townY] = mapCenters[region.id];"
replacement = "const LEGACY_MAP_GATES = Object.freeze({ eldoria:1, frostpeak:1, shadowfen:1, emberhold:1, voidlands:25 });\n\nconst maps = REGIONS.map(region => {\n  const [townX,townY] = mapCenters[region.id];"
if anchor not in s:
    raise SystemExit('alpha map gate anchor missing')
s = s.replace(anchor, replacement, 1)
s = s.replace("    levelRequired:region.level, seed:region.seed, spawnX:townX, spawnY:townY, townX, townY, townRange:8,", "    levelRequired:LEGACY_MAP_GATES[region.id] ?? region.level, seed:region.seed, spawnX:townX, spawnY:townY, townX, townY, townRange:8,", 1)
p.write_text(s, encoding='utf-8')
print('9.1 vocation ids and legacy map gates normalized')
