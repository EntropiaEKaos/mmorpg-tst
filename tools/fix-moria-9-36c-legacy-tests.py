from pathlib import Path

path = Path('server/test/grand-eldoria-9-36.test.mjs')
text = path.read_text(encoding='utf-8')

old_floor = "  assert.equal(map.tiles[60][70].type,'floor'); assert.equal(map.tiles[60][70].walkable,true);"
new_floor = "  assert.equal(map.tiles[64][72].type,'floor'); assert.equal(map.tiles[64][72].walkable,true);"
if new_floor not in text:
    if old_floor not in text:
        raise SystemExit('9.36A urban-floor legacy anchor not found')
    text = text.replace(old_floor, new_floor, 1)

old_version = "  assert.equal(GRAND_ELDORIA_VERSION,1);"
new_version = "  assert.equal(GRAND_ELDORIA_VERSION,2);"
if new_version not in text:
    if old_version not in text:
        raise SystemExit('9.36A migration-version legacy anchor not found')
    text = text.replace(old_version, new_version, 1)

path.write_text(text, encoding='utf-8')
print("Mor'ia 9.36C legacy Grand Eldoria contracts aligned")
