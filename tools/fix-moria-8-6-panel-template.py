from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PANEL = ROOT / 'server/adminPanel.mjs'

source = PANEL.read_text(encoding='utf-8')
needle = '${data.diagnostics'
count = source.count(needle)
if count != 2:
    raise SystemExit(f'expected exactly 2 Studio dashboard template interpolations, got {count}')
source = source.replace(needle, r'\${data.diagnostics')
PANEL.write_text(source, encoding='utf-8')
print("Mor'ia 8.6 dashboard browser interpolations escaped")
