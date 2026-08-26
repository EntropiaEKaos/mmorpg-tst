from pathlib import Path

p = Path('src/game/network.ts')
s = p.read_text()
old = "        'talent_reset' | 'quest_accept' | 'quest_complete';"
new = "        'talent_reset' | 'quest_accept' | 'quest_complete' |\n        'adventure_start' | 'adventure_abandon' | 'adventure_claim';"
if old in s:
    s = s.replace(old, new, 1)
elif "'adventure_start' | 'adventure_abandon' | 'adventure_claim'" not in s:
    raise SystemExit('Intent union marker not found')
p.write_text(s)
print('Adventure intent types patched')
