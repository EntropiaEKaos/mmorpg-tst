from pathlib import Path

# Preserve read-compatibility with legacy classes that still author `energy`.
p=Path('src/game/types.ts')
s=p.read_text()
old="export type DamageSchool = 'physical' | 'magic' | 'arcane' | 'fire' | 'water' | 'earth' | 'lightning' | 'ice' | 'death' | 'holy' | 'nature' | 'poison' | 'shadow';"
new="export type DamageSchool = 'physical' | 'magic' | 'arcane' | 'fire' | 'water' | 'earth' | 'lightning' | 'energy' | 'ice' | 'death' | 'holy' | 'nature' | 'poison' | 'shadow'; // energy is a read-compatible legacy alias; runtime normalizes it to lightning"
if old not in s: raise SystemExit('DamageSchool anchor missing')
p.write_text(s.replace(old,new,1))

# AlphaContent exports the frozen catalog directly; fix the generated regression harness.
p=Path('server/test/elemental-scaling-9-9.test.mjs')
s=p.read_text()
s=s.replace("import {buildAlphaContent} from '../engine/AlphaContent.mjs';", "import {ALPHA_CONTENT} from '../engine/AlphaContent.mjs';",1)
s=s.replace(" const content=buildAlphaContent();", " const content=ALPHA_CONTENT;",1)
p.write_text(s)
print('legacy energy alias and alpha regression import fixed')
