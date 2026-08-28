from pathlib import Path

for name in ['server/engine/World.mjs','src/game/maps.ts']:
    p=Path(name); text=p.read_text(encoding='utf-8')
    old="  const northGate=y===minY&&Math.abs(x-cx)<=2;\n  if(portalGate||northGate)return {type:'path',walkable:true,blocksSight:false};"
    new="  const northGate=y===minY&&Math.abs(x-cx)<=2;\n  const eastGate=x===maxX&&Math.abs(y-cy)<=2;\n  if(portalGate||northGate||eastGate)return {type:'path',walkable:true,blocksSight:false};"
    if new not in text:
        if old not in text: raise SystemExit(f'Shadowfen gate anchor missing in {name}')
        text=text.replace(old,new,1)
    p.write_text(text,encoding='utf-8')
