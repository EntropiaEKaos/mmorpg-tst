from pathlib import Path


def ensure_import(text: str, anchor: str, imported: str, marker: str) -> str:
    if imported in text:
        return text
    if anchor not in text:
        raise SystemExit(f'import anchor not found: {marker}')
    return text.replace(anchor, anchor + imported, 1)


def replace_required(text: str, old: str, new: str, marker: str) -> str:
    if old in text:
        return text.replace(old, new, 1)
    if new in text:
        return text
    raise SystemExit(f'pattern not found: {marker}')

# App: DPS meter is a normal browser ESM dependency.
p = Path('src/App.tsx')
s = p.read_text()
s = ensure_import(
    s,
    "import { logoutSession, resumeSession } from './game/auth';\n",
    "import { dpsMeter } from './game/dpsMeter';\n",
    'App dps import',
)
s = replace_required(
    s,
    """try {\n  const { dpsMeter } = require('./game/dpsMeter');\n  dpsMeter.start();\n} catch { /* ignore */ }\n""",
    """dpsMeter.start();\n""",
    'App dps require',
)
p.write_text(s)

# Admin panel: use the imported singleton for start/stop/clear controls.
p = Path('src/components/AdminPanel.tsx')
s = p.read_text()
s = ensure_import(
    s,
    "import { VOCATIONS } from '../game/classes';\n",
    "import { dpsMeter } from '../game/dpsMeter';\n",
    'Admin dps import',
)
needle = "                const { dpsMeter } = require('../game/dpsMeter');\n"
count = s.count(needle)
if count not in (0, 3):
    raise SystemExit(f'unexpected AdminPanel dps require count: {count}')
s = s.replace(needle, '')
p.write_text(s)

# Mail compose must use its regular ESM import.
p = Path('src/components/MailBox.tsx')
s = p.read_text()
s = s.replace(
    "import { getMail, markMailRead, claimMail, deleteMail, type MailItem } from '../game/content';",
    "import { getMail, markMailRead, claimMail, deleteMail, sendMail, type MailItem } from '../game/content';",
    1,
)
s = replace_required(
    s,
    """    const { sendMail } = require('../game/content');\n    sendMail({ from: player.name, to: to.trim(), subject: subject.trim(), body: body.trim() });\n""",
    """    sendMail({ from: player.name, to: to.trim(), subject: subject.trim(), body: body.trim() });\n""",
    'MailBox sendMail require',
)
p.write_text(s)

# GameScreen: loot, crafting and UI layout utilities are browser ESM dependencies.
p = Path('src/components/GameScreen.tsx')
s = p.read_text()
s = s.replace(
    "import { createCorpse, rollLoot, CORPSE_LIFETIME, type GroundItem, type LootItem } from '../game/loot';",
    "import { createCorpse, createLootBag, rollLoot, CORPSE_LIFETIME, type GroundItem, type LootItem } from '../game/loot';",
    1,
)
s = s.replace(
    "import { randomGemDrop, GEMS } from '../game/itemSets';",
    "import { randomGemDrop, GEMS } from '../game/itemSets';\nimport { RECIPES, canCraft } from '../game/crafting';",
    1,
)
s = s.replace(
    "import { getCustomNPCs, getCustomMonsters, getMail, sendSystemMail, type CustomNPC, type CustomMonster } from '../game/content';",
    "import { getCustomNPCs, getCustomMonsters, getMail, sendSystemMail, getUILayout, saveUILayout, type CustomNPC, type CustomMonster } from '../game/content';",
    1,
)
s = replace_required(
    s,
    """    const { createLootBag } = require('../game/loot');\n    groundItemsRef.current.push(createLootBag({ ...p.pos }, bagItems));\n""",
    """    groundItemsRef.current.push(createLootBag({ ...p.pos }, bagItems));\n""",
    'GameScreen loot require',
)
s = replace_required(
    s,
    """    const { RECIPES: recipes, canCraft } = require('../game/crafting');\n    const recipe = recipes.find((r: any) => r.result.name === name);\n""",
    """    const recipe = RECIPES.find((r) => r.result.name === name);\n""",
    'GameScreen crafting require',
)
s = replace_required(
    s,
    """  const { getUILayout, saveUILayout } = require('../game/content');\n  const [layout, setLayout] = useState(getUILayout(player.name));\n""",
    """  const [layout, setLayout] = useState(getUILayout(player.name));\n""",
    'GameScreen layout require',
)
p.write_text(s)

print('browser ESM cleanup applied')
