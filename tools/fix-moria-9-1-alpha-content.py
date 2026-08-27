from pathlib import Path
p = Path(__file__).resolve().parents[1] / 'server/engine/AlphaContent.mjs'
s = p.read_text(encoding='utf-8')
s = s.replace("death_knight:['Grave Slash','Frozen Resolve']", "deathknight:['Grave Slash','Frozen Resolve']")
p.write_text(s, encoding='utf-8')
print('9.1 vocation ids normalized')
