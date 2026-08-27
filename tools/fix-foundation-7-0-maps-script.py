from pathlib import Path

path = Path('tools/apply-foundation-7-0-maps.py')
text = path.read_text(encoding='utf-8')

needle = "replace_once('server/server.js', sync_block, sync_new)"
if text.count(needle) != 2:
    raise SystemExit(f'expected two legacy sync migration calls, found {text.count(needle)}')
# Keep the first historical replacement: it deterministically upgrades one CRUD
# block. Remove the second and then upgrade every remaining item-sync anchor.
text = text.replace(needle, '', 1)

anchor = "replace_once('server/server.js',\n\"    const blockers = findBlockingContentReferences(contentDB, type, id);\","
insert = '''text_server = read('server/server.js')
item_sync = "      if (type === 'items') engine.syncContentItems(contentDB.get('items'));"
map_sync = "      if (type === 'maps') { engine.syncContentMaps(contentDB.get('maps')); engine.syncContentMonsters(contentDB.get('monsters')); }"
remaining = text_server.count(item_sync)
if remaining < 1:
    raise SystemExit('server/server.js: expected at least one remaining Admin item sync anchor')
text_server = text_server.replace(item_sync, map_sync + "\\n" + item_sync)
if text_server.count(map_sync) != 2:
    raise SystemExit(f'server/server.js: expected exactly two final map sync paths, found {text_server.count(map_sync)}')
write('server/server.js', text_server)

replace_once('server/server.js',
"    const blockers = findBlockingContentReferences(contentDB, type, id);",'''
if text.count(anchor) != 1:
    raise SystemExit(f'expected one blockers migration anchor, found {text.count(anchor)}')
text = text.replace(anchor, insert, 1)

# Remove the now-redundant second historical block replacement.
if text.count(needle) != 1:
    raise SystemExit(f'expected one remaining legacy sync migration call, found {text.count(needle)}')
text = text.replace(needle, '', 1)

# MVP 6.1 inserted progressSkill between getPlayersOnMap and syncContentItems.
skill_anchor = "\\n\\n  syncContentItems(itemContent = []) {"
if text.count(skill_anchor) != 2:
    raise SystemExit(f'expected two GameState syncContentItems anchors in migration source, found {text.count(skill_anchor)}')
text = text.replace(skill_anchor, "\\n\\n  progressSkill(player, skillId, amount = 1) {", 2)

path.write_text(text, encoding='utf-8')
print('Foundation 7.0 map migration script normalized')
