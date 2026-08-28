from pathlib import Path

path = Path('src/components/WorldMiniMap.tsx')
text = path.read_text(encoding='utf-8')
old = "import { MAPS, MAP_HEIGHT, MAP_WIDTH, generateMap, getBiomeTint, getMapDimensions } from '../game/maps';"
new = "import { MAPS, generateMap, getBiomeTint, getMapDimensions } from '../game/maps';"
if old not in text:
    raise SystemExit('9.35B minimap legacy import anchor not found')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
print("Mor'ia 9.35B minimap typecheck fix applied")
