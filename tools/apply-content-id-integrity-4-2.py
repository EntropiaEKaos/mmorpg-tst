from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

p = Path('server/engine/ContentDB.mjs')
s = p.read_text()
s = replace_once(s,
'''  add(type, item) {\n    const key = canonicalContentType(type);\n    if (!key || !item || typeof item !== 'object' || Array.isArray(item)) return null;\n    const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim().slice(0, 100) : `${key}_${Date.now()}`;\n    const record = { ...item, id };\n    this.data[key].push(record);\n    this.save();\n    return record;\n  }\n''',
'''  add(type, item) {\n    const key = canonicalContentType(type);\n    if (!key || !item || typeof item !== 'object' || Array.isArray(item)) return null;\n\n    const explicitId = typeof item.id === 'string' && item.id.trim() ? item.id.trim().slice(0, 100) : '';\n    if (explicitId && this.data[key].some(record => record.id === explicitId)) return null;\n\n    let id = explicitId;\n    if (!id) {\n      do {\n        id = `${key}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;\n      } while (this.data[key].some(record => record.id === id));\n    }\n\n    const record = { ...item, id };\n    this.data[key].push(record);\n    this.save();\n    return record;\n  }\n''', 'unique ContentDB add')
p.write_text(s)

p = Path('server/test/content-db.test.mjs')
s = p.read_text()
block = r'''

test('ContentDB enforces unique IDs for runtime additions', () => withTempDir(dir => {
  const file = path.join(dir, 'content.json');
  fs.writeFileSync(file, JSON.stringify({
    version: 1, items: [], monsters: [], npcs: [], quests: [], spells: [], maps: [],
    worldEvents: [], shops: [], lootTables: [],
  }));
  const db = new ContentDB(file);

  const first = db.add('items', { id: 'unique_sword', name: 'First Sword' });
  assert.ok(first);
  assert.equal(db.add('items', { id: 'unique_sword', name: 'Duplicate Sword' }), null);
  assert.equal(db.get('items').length, 1);
  assert.equal(db.get('items')[0].name, 'First Sword');

  const generatedA = db.add('items', { name: 'Generated A' });
  const generatedB = db.add('items', { name: 'Generated B' });
  assert.ok(generatedA?.id);
  assert.ok(generatedB?.id);
  assert.notEqual(generatedA.id, generatedB.id);
  assert.equal(new Set(db.get('items').map(item => item.id)).size, db.get('items').length);
}));
'''
if "ContentDB enforces unique IDs for runtime additions" not in s:
    s += block
p.write_text(s)

print('ContentDB ID integrity 4.2 applied')
