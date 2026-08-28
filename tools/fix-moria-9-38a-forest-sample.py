from pathlib import Path
p=Path('server/test/grand-ironwood-9-38.test.mjs')
text=p.read_text(encoding='utf-8')
old="  assert.equal(map.tiles[62][90].type, 'grass');"
new="  assert.equal(map.tiles[58][90].type, 'grass');"
if new not in text:
    if old not in text: raise SystemExit('9.38A forest grass sample anchor missing')
    text=text.replace(old,new,1)
p.write_text(text,encoding='utf-8')
print("Mor'ia 9.38A forest sample corrected")
