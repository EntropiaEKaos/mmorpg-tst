from pathlib import Path
p=Path('README.md')
t=p.read_text()
t=t.replace("Versão atual: Mor'ia 9.26.1 — Road to 10 Candidate","Versão atual: Mor'ia 9.33 — Visual Rebirth Candidate",1)
anchor="## ✦ Mor'ia 9.17–9.26.1 — Road to 10"
section="""## 🎨 Mor'ia 9.27–9.33 — Visual Rebirth\n\nAntes do hardening final da 10.0, Mor'ia recebeu uma reconstrução gráfica profunda sem alterar a autoridade do servidor. A linha **Visual Rebirth** introduz color grading e atmosfera por bioma, haze e shafts de luz, contact shadows, terreno urbano menos repetitivo, escala/silhueta melhor de personagens, famílias visuais próprias para monstros importantes, VFX de combate por escola elemental/reação, emissivos em cidades e uma linguagem de HUD obsidiana/brass mais consistente.\n\nO revamp é deliberadamente **presentation-only**: dano, colisão, movimento, economia, persistência e regras continuam server-authoritative. A suíte de regressão e o budget arquitetural continuam bloqueando qualquer polish que altere gameplay.\n\n### Gameplay diurno — 9.33\n\n![Mor'ia 9.33 Visual Rebirth day](docs/screenshots/moria-9-33-visual-rebirth-day.png)\n\n### Atmosfera escura / iluminação — 9.33\n\n![Mor'ia 9.33 Visual Rebirth night](docs/screenshots/moria-9-33-visual-rebirth-night.png)\n\n### Character UI — 9.33\n\n![Mor'ia 9.33 Visual Rebirth Character UI](docs/screenshots/moria-9-33-visual-rebirth-character-ui.png)\n\nA revisão final foi executada em Chromium real a **1600×1000**, com os três estados versionados e **0 erros de console/página**. A captura escura usa o override de apresentação do Debug para validar contraste/legibilidade; o relógio autoritativo do mundo permanece independente desse override visual.\n\nDetalhes: **[Visual Rebirth 9.27](docs/MORIA_9_27_VISUAL_REBIRTH.md)** · **[Terrain & Characters 9.28–9.29](docs/MORIA_9_28_9_29_TERRAIN_CHARACTERS.md)** · **[VFX, Lighting & HUD 9.30–9.32](docs/MORIA_9_30_9_32_VFX_LIGHTING_UI.md)**.\n\n---\n\n"""
if section not in t:
    if anchor not in t: raise SystemExit('README anchor missing')
    t=t.replace(anchor,section+anchor,1)
p.write_text(t)
print('README visual rebirth section updated')
