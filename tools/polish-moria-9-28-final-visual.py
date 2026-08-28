from pathlib import Path
import json

catalog_path = Path('src/i18n/pt-BR.928.json')
catalog = json.loads(catalog_path.read_text(encoding='utf-8'))
catalog.update({
    'Berserker': 'Furioso',
    'VERDANT FRONTIER': 'FRONTEIRA VERDEJANTE',
    '10th Fountain': 'Fonte do Décimo',
    'Sunny': 'Ensolarado',
    'Captain Thane': 'Capitão Thane',
    'Master Kai': 'Mestre Kai',
    'Wizard Merlyn': 'Mago Merlyn',
    'Sage Eleanor': 'Sábia Eleanor',
    'PvP OFF': 'PvP DESL.',
    'PvP ON': 'PvP ATIVO',
    'Recommended level': 'Nível recomendado',
})
catalog_path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2, sort_keys=True) + '\n', encoding='utf-8')

# Region banner changes every map/weather tick; translate before rendering instead of waiting for DOM mutation.
p = Path('src/components/RegionBanner.tsx')
s = p.read_text(encoding='utf-8')
if "import { t as tr } from '../i18n';" not in s:
    s = s.replace("import { CINEMATIC_EVENT_NAME, type CinematicRewardDescriptor } from '../game/cinematicRewards';",
                  "import { CINEMATIC_EVENT_NAME, type CinematicRewardDescriptor } from '../game/cinematicRewards';\nimport { t as tr } from '../i18n';", 1)
repls = {
    "{WEATHER_ICON[weather]} {profile.name} {map.dangerLevel ? `· ${map.dangerLevel}` : ''}": "{WEATHER_ICON[weather]} {tr(profile.name)} {map.dangerLevel ? `· ${map.dangerLevel}` : ''}",
    ">{map.name}</div>": ">{tr(map.name)}</div>",
    ">{map.description}</div>": ">{tr(map.description)}</div>",
    ">Recommended level {map.levelRequired}+</div>": ">{tr('Recommended level')} {map.levelRequired}+</div>",
    ">{cinematic.title}</div>": ">{tr(cinematic.title)}</div>",
    ">{cinematic.subtitle}</div>": ">{tr(cinematic.subtitle)}</div>",
    ">{cinematic.description}</div>": ">{tr(cinematic.description)}</div>",
}
for old, new in repls.items():
    if old in s:
        s = s.replace(old, new, 1)
    elif new not in s:
        raise SystemExit(f'RegionBanner anchor missing: {old}')
p.write_text(s, encoding='utf-8')

# The current logo PNG contains a baked checkerboard. Render a native gold wordmark so the login surface is clean.
p = Path('src/components/LoginScreen.tsx')
s = p.read_text(encoding='utf-8')
old = '''            <div className="relative mx-auto mb-2 w-full max-w-[260px]">
              <div className="absolute inset-6 rounded-full bg-amber-200/10 blur-3xl" />
              <img src="/images/logo.png" alt="Mor'ia" className="relative mx-auto w-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.75)]" />
            </div>'''
new = '''            <div className="relative mx-auto mb-4 flex min-h-[150px] w-full max-w-[300px] items-center justify-center overflow-hidden rounded-2xl border border-amber-200/10 bg-[radial-gradient(circle_at_50%_45%,rgba(229,196,119,0.11),transparent_56%)] px-5">
              <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-amber-200/25 to-transparent" />
              <div className="relative text-center drop-shadow-[0_12px_28px_rgba(0,0,0,0.75)]">
                <div className="moria-title bg-gradient-to-b from-amber-100 via-amber-300 to-amber-700 bg-clip-text text-5xl font-black tracking-[0.08em] text-transparent sm:text-6xl">MOR'IA</div>
                <div className="mx-auto mt-3 h-px w-32 bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
              </div>
            </div>'''
if old in s:
    s = s.replace(old, new, 1)
elif new not in s:
    raise SystemExit('Login wordmark anchor missing')
p.write_text(s, encoding='utf-8')

print('Mor\'ia 9.28 final visual polish applied')
