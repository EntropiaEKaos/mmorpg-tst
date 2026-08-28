from pathlib import Path
from collections import Counter
import re, json, sys

ROOT=Path('src')
CATALOG_PATH=ROOT/'i18n'/'pt-BR.928.json'
SKIP={'src/i18n/index.ts'}
# Human-facing clues; excludes code identifiers/paths and tiny implementation strings.
PATTERNS=[
    re.compile(r">([^<>{}\n][^<>{}\n]{2,120})<"),
    re.compile(r"(?:label|title|placeholder|subtitle|description|message|text|heading|name)\s*=\s*[\"']([^\"']{3,140})[\"']"),
    re.compile(r"(?:label|title|placeholder|subtitle|description|message|text|heading)\s*:\s*[\"']([^\"']{3,140})[\"']"),
]
IGNORE_RE=re.compile(r"^(?:[a-z0-9_./:@#%+\-]+|https?://|rgba?\(|linear-gradient|radial-gradient|Bearer |data:|[A-Z0-9_]+)$")
EN_HINT=re.compile(r"\b(the|and|with|for|your|you|from|to|of|in|on|new|create|save|open|close|select|choose|level|damage|attack|defense|quest|monster|item|skill|world|player|server|account|password|character|inventory|craft|guild|party|house|node|faction|war|news|reward|requires|available|active|settings|search|buy|sell|edit|add|remove)\b",re.I)
SOURCE_FALSE_POSITIVES={
    '!m.dead && Math.hypot(m.pos.x - player.pos.x, m.pos.y - player.pos.y)',
}
UNCHANGED_OK={
    'Road to 10 · 9.26',
    'ROAD TO 10 · 9.26',
    '✦ Road to 10 · 9.26',
}

catalog=json.loads(CATALOG_PATH.read_text(encoding='utf-8'))
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

seen=set(); unique=[]
for row in rows:
    key=(row['file'],row['text'])
    if key in seen: continue
    seen.add(key); unique.append(row)
unique.sort(key=lambda r:(r['file'],r['line'],r['text']))

missing=[]
unchanged=[]
for row in unique:
    source=row['text']
    if source in SOURCE_FALSE_POSITIVES:
        continue
    if source not in catalog:
        missing.append(row)
        continue
    target=str(catalog[source]).strip()
    if target == source and source not in UNCHANGED_OK:
        unchanged.append({**row,'translation':target})

report={
    'candidate_occurrences':len(unique),
    'catalog_entries':len(catalog),
    'covered_occurrences':len(unique)-len(missing)-len(unchanged)-sum(1 for r in unique if r['text'] in SOURCE_FALSE_POSITIVES),
    'source_false_positives':sorted(SOURCE_FALSE_POSITIVES),
    'missing':missing,
    'unchanged_not_allowed':unchanged,
}
Path('i18n-visible-audit.json').write_text(json.dumps(unique,ensure_ascii=False,indent=2),encoding='utf-8')
Path('i18n-coverage-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
Path('i18n-visible-audit.txt').write_text('\n'.join(f"{r['file']}:{r['line']}: {r['text']}" for r in unique),encoding='utf-8')

print(f"candidate visible English occurrences: {len(unique)}")
print(f"PT-BR release catalog entries: {len(catalog)}")
print(f"missing translations: {len(missing)}")
print(f"unchanged translations not allowlisted: {len(unchanged)}")
for file,count in Counter(r['file'] for r in unique).most_common(20): print(f'{count:4} {file}')
if missing:
    print('\nMISSING:')
    for r in missing: print(f"{r['file']}:{r['line']}: {r['text']}")
if unchanged:
    print('\nUNCHANGED:')
    for r in unchanged: print(f"{r['file']}:{r['line']}: {r['text']}")
if missing or unchanged:
    sys.exit(1)
print('PT-BR source-candidate coverage gate: PASS')
