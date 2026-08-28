from pathlib import Path
p=Path('src/game/maps.ts')
text=p.read_text(encoding='utf-8')
old="  const cx=map.townCenter.x,cy=map.townCenter.y;"
new="  const cx=map.townCenter.x;"
if new not in text:
    if old not in text: raise SystemExit('Frostpeak client center anchor missing')
    text=text.replace(old,new,1)
    p.write_text(text,encoding='utf-8')
print("Mor'ia 9.39A unused client coordinate removed")
