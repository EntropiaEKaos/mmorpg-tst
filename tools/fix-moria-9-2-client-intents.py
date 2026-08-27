from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / 'src/game/network.ts'
text = path.read_text(encoding='utf-8')
old = "        'adventure_start' | 'adventure_abandon' | 'adventure_claim' | 'official' | 'social';"
new = "        'adventure_start' | 'adventure_abandon' | 'adventure_claim' | 'official' | 'social' |\n        'appearance' | 'task' | 'housing';"
if new in text:
    print('9.2 client intent contract already upgraded')
elif old in text:
    path.write_text(text.replace(old, new, 1), encoding='utf-8')
    print('9.2 client intent contract upgraded')
else:
    raise SystemExit('network Intent anchor missing')
