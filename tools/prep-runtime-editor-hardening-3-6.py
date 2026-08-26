from pathlib import Path

p = Path('src/components/GameEditor.tsx')
s = p.read_text()
old_sig = "function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {\n"
new_sig = "function SelectField({ label, value, options, optionLabels, onChange }: { label: string; value: string; options: string[]; optionLabels?: Record<string, string>; onChange: (v: string) => void }) {\n"
if old_sig in s:
    s = s.replace(old_sig, new_sig, 1)
elif new_sig not in s:
    raise SystemExit('SelectField signature pattern missing')

old_render = '''      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/50 text-purple-100 text-xs focus:outline-none focus:border-purple-500">\n        {options.map((o) => <option key={o} value={o}>{o}</option>)}\n      </select>\n'''
new_render = '''      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 rounded bg-black/60 border border-purple-700/50 text-purple-100 text-xs focus:outline-none focus:border-purple-500">\n        {options.map((o) => <option key={o} value={o}>{optionLabels?.[o] || o}</option>)}\n      </select>\n'''
if old_render in s:
    s = s.replace(old_render, new_render, 1)
elif new_render not in s:
    raise SystemExit('SelectField render pattern missing')

p.write_text(s)
print('3.6 SelectField compatibility prepared')
