from pathlib import Path

path = Path('tools/apply-foundation-7-0-maps.py')
text = path.read_text(encoding='utf-8')

needle = "replace_once('server/server.js', sync_block, sync_new)"
if text.count(needle) != 2:
    raise SystemExit(f'expected two legacy sync migration calls, found {text.count(needle)}')
text = text.replace(needle, '', 2)

anchor = "replace_once('server/server.js',\n\"    const blockers = findBlockingContentReferences(contentDB, type, id);\","
insert = '''text_server = read('server/server.js')
post_item_sync = "\\n      if (type === 'items') engine.syncContentItems(contentDB.get('items'));"
delete_item_sync = "\\n    if (type === 'items') engine.syncContentItems(contentDB.get('items'));"
post_map_sync = "\\n      if (type === 'maps') { engine.syncContentMaps(contentDB.get('maps')); engine.syncContentMonsters(contentDB.get('monsters')); }"
delete_map_sync = "\\n    if (type === 'maps') { engine.syncContentMaps(contentDB.get('maps')); engine.syncContentMonsters(contentDB.get('monsters')); }"
if text_server.count(post_item_sync) != 1:
    raise SystemExit(f'server/server.js: expected one POST item sync anchor, found {text_server.count(post_item_sync)}')
if text_server.count(delete_item_sync) != 1:
    raise SystemExit(f'server/server.js: expected one DELETE item sync anchor, found {text_server.count(delete_item_sync)}')
text_server = text_server.replace(post_item_sync, post_map_sync + post_item_sync, 1)
text_server = text_server.replace(delete_item_sync, delete_map_sync + delete_item_sync, 1)
map_core = "if (type === 'maps') { engine.syncContentMaps(contentDB.get('maps')); engine.syncContentMonsters(contentDB.get('monsters')); }"
if text_server.count(map_core) != 2:
    raise SystemExit(f'server/server.js: expected two final map sync paths, found {text_server.count(map_core)}')
write('server/server.js', text_server)

replace_once('server/server.js',
"    const blockers = findBlockingContentReferences(contentDB, type, id);",'''
if text.count(anchor) != 1:
    raise SystemExit(f'expected one blockers migration anchor, found {text.count(anchor)}')
text = text.replace(anchor, insert, 1)

# MVP 6.1 inserted progressSkill between getPlayersOnMap and syncContentItems.
skill_anchor = "\\n\\n  syncContentItems(itemContent = []) {"
if text.count(skill_anchor) != 2:
    raise SystemExit(f'expected two GameState syncContentItems anchors in migration source, found {text.count(skill_anchor)}')
text = text.replace(skill_anchor, "\\n\\n  progressSkill(player, skillId, amount = 1) {", 2)

path.write_text(text, encoding='utf-8')
print('Foundation 7.0 map migration script normalized')
