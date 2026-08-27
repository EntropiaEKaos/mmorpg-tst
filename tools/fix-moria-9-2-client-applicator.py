from pathlib import Path

p = Path(__file__).resolve().parent / 'apply-moria-9-2-alpha-systems-client.py'
s = p.read_text(encoding='utf-8')
old = "replace_once('src/game/render.ts', \"import type { Tile, Monster, NPC } from './types';\", \"import type { Tile, Monster, NPC } from './types';\\nimport { drawAvatar, type AvatarAppearance, type AvatarMount } from './playerAvatar';\")"
new = "replace_once('src/game/render.ts', \"import type { Tile } from './types';\", \"import type { Tile } from './types';\\nimport { drawAvatar, type AvatarAppearance, type AvatarMount } from './playerAvatar';\")"
if old not in s:
    raise SystemExit('client renderer import patch anchor missing')
p.write_text(s.replace(old, new, 1), encoding='utf-8')
print('9.2 client applicator import anchor fixed')
