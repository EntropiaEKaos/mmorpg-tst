from pathlib import Path

path = Path('src/components/CityDesigner.tsx')
text = path.read_text(encoding='utf-8')
old = "<div className=\"grid grid-cols-4 gap-1\">{(['select','landmark','district','prop'] as Tool[]).map((entry) => <button key={entry} onClick={() => setTool(entry)} className={`rounded px-1 py-2 text-[8px] font-black uppercase ${tool === entry ? 'bg-purple-600 text-white' : 'bg-purple-950/50 text-purple-300'}`}>{TOOL_LABELS[entry]}</button>)}</div>"
new = "<div data-city-tool-grid=\"true\" className=\"grid grid-cols-2 gap-2\">{(['select','landmark','district','prop'] as Tool[]).map((entry) => <button key={entry} data-city-tool={entry} onClick={() => setTool(entry)} className={`min-h-9 rounded border px-2 py-2 text-[9px] font-black uppercase tracking-wide ${tool === entry ? 'border-purple-300/65 bg-purple-600 text-white' : 'border-purple-500/20 bg-purple-950/50 text-purple-300'}`}>{TOOL_LABELS[entry]}</button>)}</div>"
if new not in text:
    if old not in text:
        raise SystemExit('City Designer toolbar anchor not found')
    text = text.replace(old, new, 1)
path.write_text(text, encoding='utf-8')

doc_path = Path('docs/MORIA_9_36_GRAND_ELDORIA.md')
doc = doc_path.read_text(encoding='utf-8')
section = r'''

### 9.36C.1 — acabamento do City Designer

A revisão humana da prova 9.36C aprovou a densidade urbana, mas detectou compressão no rótulo **CONSTRUIR** da barra de ferramentas. A barra foi reorganizada de quatro colunas estreitas para uma grade 2×2, com alvos maiores, borda de estado e tipografia legível. A alteração é exclusivamente de apresentação do editor; IDs, ferramentas e autoridade do mapa permanecem inalterados.
'''
if '### 9.36C.1 — acabamento do City Designer' not in doc:
    doc += section
doc_path.write_text(doc, encoding='utf-8')

print("Mor'ia 9.36C.1 City Designer toolbar polish prepared")
