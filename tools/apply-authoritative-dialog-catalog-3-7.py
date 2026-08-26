from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# DialogBox must resolve quest metadata from the active runtime catalog,
# not only the client-compiled QUESTS list.
p = Path('src/components/DialogBox.tsx')
s = p.read_text()
s = replace_once(s,
"import type { NPC, Player } from '../game/types';",
"import type { NPC, Player, Quest } from '../game/types';",
'Quest type import')
s = replace_once(s,
"  player: Player;\n}",
"  player: Player;\n  questCatalog?: Quest[];\n}",
'questCatalog prop')
s = replace_once(s,
"export default function DialogBox({ npc, onAction, onClose, player }: Props) {",
"export default function DialogBox({ npc, onAction, onClose, player, questCatalog = QUESTS }: Props) {",
'questCatalog default')
s = s.replace('QUESTS.find(', 'questCatalog.find(')
p.write_text(s)

# GameScreen already computes the authoritative/local catalog for QuestLog.
# Reuse that exact catalog in NPC dialogue instead of creating another source of truth.
p = Path('src/components/GameScreen.tsx')
s = p.read_text()
s = replace_once(s,
"              player={player}\n            />",
"              player={player}\n              questCatalog={questCatalog}\n            />",
'pass quest catalog to DialogBox')
p.write_text(s)

print('authoritative dialog catalog 3.7 applied')
