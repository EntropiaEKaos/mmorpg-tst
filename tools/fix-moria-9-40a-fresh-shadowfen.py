from pathlib import Path

p=Path('server/engine/ContentDB.mjs')
text=p.read_text(encoding='utf-8')
needle="    migrateGrandFrostpeakData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;"
patched="    migrateGrandFrostpeakData(this.data);\n    migrateGrandShadowfenData(this.data);\n    this.data.grandCapitalVersion = GRAND_CAPITAL_SCHEMA_VERSION;"
if text.count('migrateGrandShadowfenData(this.data);') < 2:
    if needle not in text:
        raise SystemExit('fresh Grand Capital seed chain anchor missing')
    text=text.replace(needle,patched,1)
p.write_text(text,encoding='utf-8')
