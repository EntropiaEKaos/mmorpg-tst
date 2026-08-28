from pathlib import Path
p=Path('src/game/types.ts')
s=p.read_text()
old="export type DamageSchool = 'physical' | 'magic' | 'arcane' | 'fire' | 'water' | 'earth' | 'lightning' | 'ice' | 'death' | 'holy' | 'nature' | 'poison' | 'shadow';"
new="export type DamageSchool = 'physical' | 'magic' | 'arcane' | 'fire' | 'water' | 'earth' | 'lightning' | 'energy' | 'ice' | 'death' | 'holy' | 'nature' | 'poison' | 'shadow'; // energy is a read-compatible legacy alias; runtime normalizes it to lightning"
if old not in s: raise SystemExit('DamageSchool anchor missing')
p.write_text(s.replace(old,new,1))
print('legacy energy alias preserved')
