from pathlib import Path
import json

catalog_path=Path('src/i18n/pt-BR.928.json')
catalog=json.loads(catalog_path.read_text(encoding='utf-8'))
catalog.update({
    'Logout':'Sair',
    '🚪 Logout':'🚪 Sair',
    "Connect to Mor'ia server for real online play":"Conectar ao servidor de Mor'ia para jogar online de verdade",
    'Reset default order':'Restaurar ordem padrão',
    '↺ Reset default order':'↺ Restaurar ordem padrão',
})
catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2,sort_keys=True)+'\n',encoding='utf-8')

p=Path('src/components/GameScreen.tsx')
s=p.read_text(encoding='utf-8')
import_line="import { translateGameText as tr } from '../i18n';\n"
anchor="import { drawWorldCinematicPass } from '../game/worldVisualRevamp927';\n"
if import_line not in s:
    if anchor not in s: raise SystemExit('GameScreen import anchor missing')
    s=s.replace(anchor,anchor+import_line,1)
old='            🚪 Logout\n'
new="            {tr('🚪 Logout')}\n"
if old in s:
    s=s.replace(old,new,1)
elif new not in s:
    raise SystemExit('GameScreen logout anchor missing')
old2='className="moria-button mb-3 w-full rounded-lg py-2 text-xs text-sky-200">↺ Reset default order</button>'
new2='className="moria-button mb-3 w-full rounded-lg py-2 text-xs text-sky-200">{tr(\'↺ Reset default order\')}</button>'
if old2 in s:
    s=s.replace(old2,new2,1)
elif new2 not in s:
    raise SystemExit('GameScreen reset order anchor missing')
p.write_text(s,encoding='utf-8')
print('HUD PT-BR direct localization applied')
