from pathlib import Path

path = Path('tools/apply-foundation-7-0-maps.py')
text = path.read_text(encoding='utf-8')
needle = "replace_once('server/server.js', sync_block, sync_new)"
if text.count(needle) != 2:
    raise SystemExit(f'expected two sync-block migration calls, found {text.count(needle)}')
replacement = "text = read('server/server.js')\nif text.count(sync_block) != 2:\n    raise SystemExit(f'server/server.js: expected two content sync blocks, found {text.count(sync_block)}')\nwrite('server/server.js', text.replace(sync_block, sync_new))"
text = text.replace(needle, replacement, 1)
text = text.replace(needle, '', 1)
path.write_text(text, encoding='utf-8')
print('Foundation 7.0 map migration script normalized')
