from pathlib import Path

path = Path('tools/apply-foundation-7-0-maps.py')
text = path.read_text(encoding='utf-8')

needle = "replace_once('server/server.js', sync_block, sync_new)"
if text.count(needle) != 2:
    raise SystemExit(f'expected two sync-block migration calls, found {text.count(needle)}')
replacement = "text = read('server/server.js')\nif text.count(sync_block) != 2:\n    raise SystemExit(f'server/server.js: expected two content sync blocks, found {text.count(sync_block)}')\nwrite('server/server.js', text.replace(sync_block, sync_new))"
text = text.replace(needle, replacement, 1)
text = text.replace(needle, '', 1)

# MVP 6.1 inserted progressSkill between getPlayersOnMap and syncContentItems.
# Anchor the 7.0 insertion at progressSkill instead of the older 6.0 layout.
skill_anchor = "\\n\\n  syncContentItems(itemContent = []) {"
if text.count(skill_anchor) != 2:
    raise SystemExit(f'expected two GameState syncContentItems anchors in migration source, found {text.count(skill_anchor)}')
text = text.replace(skill_anchor, "\\n\\n  progressSkill(player, skillId, amount = 1) {", 2)

path.write_text(text, encoding='utf-8')
print('Foundation 7.0 map migration script normalized')
