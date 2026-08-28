from pathlib import Path
p=Path('server/test/grand-eldoria-9-36.test.mjs')
text=p.read_text(encoding='utf-8')
old="  assert.match(source,/grandCapitalVersion/); assert.match(source,/migrateGrandCapitalV1/); assert.match(source,/GRAND_ELDORIA_VERSION/);"
new="  assert.match(source,/grandCapitalVersion/); assert.match(source,/migrateGrandCapitalV1/); assert.match(source,/GRAND_CAPITAL_SCHEMA_VERSION/); assert.match(source,/migrateGrandEldoriaData/);"
if new not in text:
    if old not in text: raise SystemExit('9.36 Grand Capital marker assertion anchor missing')
    text=text.replace(old,new,1)
p.write_text(text,encoding='utf-8')
print("Mor'ia 9.38A legacy Grand Capital marker test aligned")
