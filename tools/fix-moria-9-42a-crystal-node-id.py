from pathlib import Path

ROOT=Path('.')

def replace_all(path,old,new,label):
    p=ROOT/path;text=p.read_text(encoding='utf-8')
    if old not in text and new in text:return
    if old not in text:raise SystemExit(f'{label} anchor missing in {path}')
    p.write_text(text.replace(old,new),encoding='utf-8')

# The Living Realm canonical seed is node_crystaldeep (without the extra
# underscore). Keep the capital migration aligned with existing persistent data
# instead of inventing a new node identity.
replace_all('tools/upgrade-moria-9-42a-grand-crystal-deep.py','node_crystal_deep','node_crystaldeep','canonical Crystal Deep node id in applicator')
