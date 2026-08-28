from pathlib import Path

path = Path('tools/capture-moria-9-37b.mjs')
text = path.read_text(encoding='utf-8')
old = "const pt=await panorama.innerText(); for(const required of ['Cidadela Tidewatch','Grande Mercado do Sal','Grande Estaleiro','Farol de Sunreach','4','píeres','Renderer de produção'])if(!pt.includes(required))throw new Error(`Sunreach panorama proof missing ${required}`);"
new = "const pt=(await panorama.innerText()).toLocaleLowerCase('pt-BR'); for(const required of ['cidadela tidewatch','grande mercado do sal','grande estaleiro','farol de sunreach','4','píeres','renderer de produção'])if(!pt.includes(required))throw new Error(`Sunreach panorama proof missing ${required}`);"
if new not in text:
    if old not in text:
        raise SystemExit('9.37B panorama text proof anchor missing')
    text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')
print("Mor'ia 9.37B panorama text proof normalized for rendered CSS casing")
