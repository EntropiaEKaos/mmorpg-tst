from pathlib import Path


def replace_once(text: str, old: str, new: str, marker: str) -> str:
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'pattern not found: {marker}')
    return text.replace(old, new, 1)

# App: DPS meter is a normal browser ESM dependency.
p = Path('src/App.tsx')
s = p.read_text()
s = replace_once(
    s,
    "import { logoutSession, resumeSession } from './game/auth';\n",
    "import { logoutSession, resumeSession } from './game/auth';\nimport { dpsMeter } from './game/dpsMeter';\n",
    'App dps import',
)
s = replace_once(
    s,
    """try {\n  const { dpsMeter } = require('./game/dpsMeter');\n  dpsMeter.start();\n} catch { /* ignore */ }\n""",
    """dpsMeter.start();\n""",
    'App dps require',
)
p.write_text(s)

# Admin panel: use the same imported singleton for start/stop/clear controls.
p = Path('src/components/AdminPanel.tsx')
s = p.read_text()
s = replace_once(
    s,
    "import { VOCATIONS } from '../game/classes';\n",
    "import { VOCATIONS } from '../game/classes';\nimport { dpsMeter } from '../game/dpsMeter';\n",
    'Admin dps import',
)
needle = "                const { dpsMeter } = require('../game/dpsMeter');\n"
count = s.count(needle)
if count not in (0, 3):
    raise SystemExit(f'unexpected AdminPanel dps require count: {count}')
s = s.replace(needle, '')
p.write_text(s)

print('App and AdminPanel ESM cleanup applied')
