from pathlib import Path

ROOT=Path('.')

def replace_once(path,old,new,label):
    p=ROOT/path; text=p.read_text(encoding='utf-8')
    if old not in text:
        if new in text: return
        raise SystemExit(f'{label} anchor missing in {path}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

def replace_all(path,old,new):
    p=ROOT/path; text=p.read_text(encoding='utf-8')
    if old in text: p.write_text(text.replace(old,new),encoding='utf-8')

# Frostpeak has 20 civic landmarks + 21 minor authored structures = 41 footprints.
replace_all('server/test/grand-frostpeak-9-39.test.mjs',"assert.equal(GRAND_FROSTPEAK_MAP.landmarks.length,40)","assert.equal(GRAND_FROSTPEAK_MAP.landmarks.length,41)")
replace_all('docs/MORIA_9_39_GRAND_FROSTPEAK.md','12 distritos e 40 footprints autoritativos','12 distritos e 41 footprints autoritativos')

# The northern Crystal gate must stay physically open in the built-in subset even
# when Crystal Deep itself is supplied only by content sync.
for path in ['server/engine/World.mjs','src/game/maps.ts']:
    replace_once(path,
        "  const lowerGate=y===maxY&&Math.abs(x-cx)<=2;\n  if(portalGate||lowerGate)return {type:'path',walkable:true,blocksSight:false};",
        "  const verticalGate=(y===minY||y===maxY)&&Math.abs(x-cx)<=2;\n  if(portalGate||verticalGate)return {type:'path',walkable:true,blocksSight:false};",
        f'{path} vertical Frostpeak gates')

# The generic replace helper in the base applicator sees the loaded-DB migration
# chain first. Ensure the distinct fresh-seed block also invokes Frostpeak before
# advancing the marker.
replace_once('server/engine/ContentDB.mjs',
"    this.data.roadToTenVersion = 1;\n    migrateGrandEldoriaData(this.data);\n    migrateGrandSunreachData(this.data);\n    migrateGrandIronwoodData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;",
"    this.data.roadToTenVersion = 1;\n    migrateGrandEldoriaData(this.data);\n    migrateGrandSunreachData(this.data);\n    migrateGrandIronwoodData(this.data);\n    migrateGrandFrostpeakData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;",
'fresh ContentDB Frostpeak migration')

print("Mor'ia 9.39A focused Frostpeak contracts aligned")
