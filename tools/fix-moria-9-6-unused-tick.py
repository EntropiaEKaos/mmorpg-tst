from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'src/components/HUD.tsx'
text = path.read_text(encoding='utf-8')
old = "export default function HUD({ player, spells, onCastSpell, monsters, tick, official, mapId }: Props) {"
new = "export default function HUD({ player, spells, onCastSpell, monsters, official, mapId }: Props) {"
if old not in text:
    raise SystemExit('generated HUD signature anchor missing')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
print('9.6 HUD obsolete tick binding removed')
