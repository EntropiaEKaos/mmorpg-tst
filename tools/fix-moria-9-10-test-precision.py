from pathlib import Path
p=Path('server/test/elemental-reactions-9-10.test.mjs')
s=p.read_text()
old="assert.equal(r.damageMultiplier,1.8); assert.equal(r.defenseMultiplier,.75);"
new="assert.ok(Math.abs(r.damageMultiplier-1.8)<1e-12); assert.equal(r.defenseMultiplier,.75);"
if old not in s: raise SystemExit('9.10 precision assertion anchor missing')
p.write_text(s.replace(old,new,1))
print('9.10 floating-point assertion made tolerance-safe')
