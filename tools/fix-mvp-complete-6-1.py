from pathlib import Path

p = Path('server/test/hardening.test.mjs')
s = p.read_text(encoding='utf-8')
old = "    player.official.lastGatherAt = 0;\n"
if old not in s:
    raise SystemExit('Expected fishing fixture line not found')
p.write_text(s.replace(old, '', 1), encoding='utf-8')
print('MVP Complete 6.1 fishing fixture normalized')
