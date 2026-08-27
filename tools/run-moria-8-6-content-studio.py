from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / 'tools/apply-moria-8-6-content-studio.py'
SERVER = ROOT / 'server/server.js'

source = MAIN.read_text(encoding='utf-8')
old_guard = "if server.count(sync_lines) != 2: raise SystemExit(f'expected 2 runtime sync blocks, got {server.count(sync_lines)}')\nserver = server.replace(sync_lines, \"      syncContentRuntime(type);\", 2)"
new_guard = "if server.count(sync_lines) < 1: raise SystemExit('runtime sync block missing')\nserver = server.replace(sync_lines, \"      syncContentRuntime(type);\")"
if old_guard not in source:
    raise SystemExit('8.6 migrator runtime-sync guard not found')
source = source.replace(old_guard, new_guard, 1)
exec(compile(source, str(MAIN), 'exec'), {'__name__': '__main__', '__file__': str(MAIN)})

# Centralize any remaining equivalent runtime-sync block independent of spacing.
server = SERVER.read_text(encoding='utf-8')
pattern = re.compile(
    r"(?P<indent>[ \t]*)if \(type === 'maps'\) \{ engine\.syncContentMaps\(contentDB\.get\('maps'\)\); engine\.syncContentMonsters\(contentDB\.get\('monsters'\)\); \}\s*"
    r"(?P=indent)if \(type === 'items'\) engine\.syncContentItems\(contentDB\.get\('items'\)\);\s*"
    r"(?P=indent)if \(type === 'spells'\) engine\.syncContentSpells\(contentDB\.get\('spells'\)\);\s*"
    r"(?P=indent)if \(type === 'monsters'\) engine\.syncContentMonsters\(contentDB\.get\('monsters'\)\);\s*"
    r"(?P=indent)if \(type === 'events'\) officialSystems\.syncWorldEvents\(contentDB\.get\('events'\)\);"
)
server, count = pattern.subn(lambda m: f"{m.group('indent')}syncContentRuntime(type);", server)
SERVER.write_text(server, encoding='utf-8')
print(f"Mor'ia 8.6 robust runner completed; centralized {count} additional runtime sync block(s)")
