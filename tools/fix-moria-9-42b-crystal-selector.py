from pathlib import Path

path = Path('tools/capture-moria-9-42b.mjs')
text = path.read_text(encoding='utf-8')
old = "const east=page.getByTitle('Elevador do Leste');"
new = "const east=page.locator('[data-minimap-marker=\"crystaldeep_east_lift_gate\"]');"
if new in text:
    raise SystemExit(0)
if old not in text:
    raise SystemExit('Crystal Deep east lift selector anchor missing')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
