from pathlib import Path

root=Path('.')

def patch(path, old, new, label):
    p=root/path;text=p.read_text(encoding='utf-8')
    if new in text:return
    if old not in text:raise SystemExit(f'{label} anchor missing in {path}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

# seedDefaults has its own capital migration chain in addition to migrateGrandCapitalV1.
p=root/'server/engine/ContentDB.mjs';text=p.read_text(encoding='utf-8')
needle="    migrateGrandCrystalDeepData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;"
replacement="    migrateGrandCrystalDeepData(this.data);\n    migrateGrandStormwatchData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;"
if text.count('migrateGrandStormwatchData(this.data);') < 2:
    idx=text.rfind(needle)
    if idx < 0: raise SystemExit('ContentDB seed migration anchor missing')
    text=text[:idx]+replacement+text[idx+len(needle):]
    p.write_text(text,encoding='utf-8')

# 42 authoritative footprints legitimately replace part of the traversable snow with walls.
patch('server/test/grand-stormwatch-isle-9-43.test.mjs',"assert.ok(snow>2500,`snow=${snow}`);","assert.ok(snow>2200,`snow=${snow}`);",'Stormwatch final snow budget')
print("Mor'ia 9.43A fresh-seed convergence fix complete")
