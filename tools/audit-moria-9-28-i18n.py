from pathlib import Path
import re, json

ROOT=Path('src')
SKIP={'src/i18n/index.ts'}
# Human-facing clues; excludes code identifiers/paths and tiny implementation strings.
PATTERNS=[
    re.compile(r">([^<>{}\n][^<>{}\n]{2,120})<"),
    re.compile(r"(?:label|title|placeholder|subtitle|description|message|text|heading|name)\s*=\s*[\"']([^\"']{3,140})[\"']"),
    re.compile(r"(?:label|title|placeholder|subtitle|description|message|text|heading)\s*:\s*[\"']([^\"']{3,140})[\"']"),
]
IGNORE_RE=re.compile(r"^(?:[a-z0-9_./:@#%+\-]+|https?://|rgba?\(|linear-gradient|radial-gradient|Bearer |data:|[A-Z0-9_]+)$")
EN_HINT=re.compile(r"\b(the|and|with|for|your|you|from|to|of|in|on|new|create|save|open|close|select|choose|level|damage|attack|defense|quest|monster|item|skill|world|player|server|account|password|character|inventory|craft|guild|party|house|node|faction|war|news|reward|requires|available|active|settings|search|buy|sell|edit|add|remove)\b",re.I)
rows=[]
for p in ROOT.rglob('*'):
    if p.suffix not in {'.ts','.tsx'} or p.as_posix() in SKIP: continue
    text=p.read_text(encoding='utf-8',errors='ignore')
    for rx in PATTERNS:
        for m in rx.finditer(text):
            value=' '.join(m.group(1).split())
            if len(value)<3 or len(value)>140 or IGNORE_RE.match(value) or not EN_HINT.search(value): continue
            line=text.count('\n',0,m.start())+1
            rows.append({'file':p.as_posix(),'line':line,'text':value})
# De-duplicate same file/text.
seen=set(); unique=[]
for row in rows:
    key=(row['file'],row['text'])
    if key in seen: continue
    seen.add(key); unique.append(row)
unique.sort(key=lambda r:(r['file'],r['line'],r['text']))
Path('i18n-visible-audit.json').write_text(json.dumps(unique,ensure_ascii=False,indent=2),encoding='utf-8')
Path('i18n-visible-audit.txt').write_text('\n'.join(f"{r['file']}:{r['line']}: {r['text']}" for r in unique),encoding='utf-8')
print(f'candidate visible English strings: {len(unique)}')
from collections import Counter
for file,count in Counter(r['file'] for r in unique).most_common(20): print(f'{count:4} {file}')
