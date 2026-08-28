from pathlib import Path
import json

ROOT=Path('.')

def replace(path, old, new):
    p=ROOT/path
    text=p.read_text()
    if old not in text:
        raise SystemExit(f'marker missing in {path}: {old[:100]}')
    p.write_text(text.replace(old,new,1))

# versions
for rel in ['package.json','package-lock.json','server/package.json','server/package-lock.json']:
    p=ROOT/rel
    data=json.loads(p.read_text())
    if 'version' in data: data['version']='9.27.0'
    if rel.endswith('package-lock.json'):
        if data.get('packages',{}).get('') is not None:
            data['packages']['']['version']='9.27.0'
    p.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

# Deep atmosphere replacement: stronger depth, color grading, sun/moon shafts, fog bands and filmic vignette.
Path('src/game/worldAtmosphere.ts').write_text(r'''import type { BiomeType } from './maps';

export type WorldWeather = 'clear' | 'rain' | 'snow' | 'storm';

type AtmosphereProfile = {
  name: string;
  accent: string;
  overlay: string;
  overlayAlpha: number;
  mote: string;
  moteCount: number;
  vignette: number;
  haze: string;
  shadow: string;
  highlight: string;
};

export const ATMOSPHERE_PROFILES: Record<BiomeType, AtmosphereProfile> = {
  plains: { name: 'Verdant Frontier', accent: '#71d8ac', overlay: '35,78,58', overlayAlpha: 0.055, mote: '#d8ffb0', moteCount: 14, vignette: 0.46, haze: '122,168,130', shadow: '8,18,18', highlight: '255,223,158' },
  snow: { name: 'Frozen Expanse', accent: '#9bd4ff', overlay: '176,216,255', overlayAlpha: 0.10, mote: '#ffffff', moteCount: 20, vignette: 0.42, haze: '190,222,255', shadow: '12,27,45', highlight: '235,249,255' },
  swamp: { name: 'Rotfen Mists', accent: '#9ed06f', overlay: '18,43,15', overlayAlpha: 0.24, mote: '#c8ff71', moteCount: 19, vignette: 0.58, haze: '83,112,58', shadow: '7,14,8', highlight: '198,222,132' },
  desert: { name: 'Ashen Reach', accent: '#ffb55f', overlay: '142,74,26', overlayAlpha: 0.10, mote: '#ffc879', moteCount: 19, vignette: 0.48, haze: '224,160,92', shadow: '35,16,8', highlight: '255,225,154' },
  shadow: { name: 'The Black Verge', accent: '#b398ff', overlay: '13,0,28', overlayAlpha: 0.39, mote: '#c8a0ff', moteCount: 24, vignette: 0.71, haze: '82,52,124', shadow: '3,0,8', highlight: '195,156,255' },
};

function hashText(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function weatherForMap(mapId: string, biome: BiomeType, now = Date.now()): WorldWeather {
  const windowId = Math.floor(now / 90_000);
  const roll = (hashText(`${mapId}:${windowId}`) % 100) / 100;
  switch (biome) {
    case 'snow': return roll < 0.58 ? 'snow' : roll < 0.72 ? 'storm' : 'clear';
    case 'swamp': return roll < 0.48 ? 'rain' : roll < 0.62 ? 'storm' : 'clear';
    case 'shadow': return roll < 0.34 ? 'storm' : roll < 0.52 ? 'rain' : 'clear';
    case 'desert': return roll < 0.14 ? 'storm' : 'clear';
    default: return roll < 0.18 ? 'rain' : roll < 0.22 ? 'storm' : 'clear';
  }
}

function drawAmbientMotes(ctx: CanvasRenderingContext2D,width:number,height:number,biome:BiomeType,now:number):void {
  const p=ATMOSPHERE_PROFILES[biome];
  ctx.save();
  for(let i=0;i<p.moteCount;i++){
    const seed=(i*977+biome.charCodeAt(0)*131)%997;
    const speed=biome==='snow'?0.013:biome==='desert'?0.022:0.008;
    const phase=now*speed+seed*12.3;
    const x=((seed*43.7+phase*(biome==='desert'?1.7:.35))%(width+60))-30;
    const y=((seed*19.1+phase*(biome==='snow'?1.1:.22))%(height+60))-30;
    const pulse=.22+(Math.sin(phase*.04)+1)*.16;
    ctx.globalAlpha=(biome==='shadow'||biome==='swamp')?pulse:pulse*.6;
    ctx.fillStyle=p.mote;
    if(biome==='desert') ctx.fillRect(x,y,6,1);
    else { ctx.beginPath(); ctx.arc(x,y,biome==='shadow'?1.9:biome==='snow'?1.45:1.15,0,Math.PI*2); ctx.fill(); }
  }
  ctx.restore();
}

function drawDepthHaze(ctx:CanvasRenderingContext2D,width:number,height:number,biome:BiomeType,now:number){
  const p=ATMOSPHERE_PROFILES[biome];
  ctx.save();
  const horizon=ctx.createLinearGradient(0,0,0,height);
  horizon.addColorStop(0,`rgba(${p.haze},.13)`);
  horizon.addColorStop(.32,`rgba(${p.haze},.045)`);
  horizon.addColorStop(.72,'rgba(0,0,0,0)');
  horizon.addColorStop(1,`rgba(${p.shadow},.10)`);
  ctx.fillStyle=horizon; ctx.fillRect(0,0,width,height);
  ctx.globalAlpha=.055;
  const drift=Math.sin(now/7000)*width*.04;
  for(let i=0;i<3;i++){
    const y=height*(.24+i*.18);
    const g=ctx.createLinearGradient(-width*.2+drift,y,width*1.2+drift,y+20);
    g.addColorStop(0,'rgba(255,255,255,0)');
    g.addColorStop(.5,`rgba(${p.haze},.65)`);
    g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g; ctx.fillRect(0,y,width,Math.max(18,height*.07));
  }
  ctx.restore();
}

function drawLightShafts(ctx:CanvasRenderingContext2D,width:number,height:number,biome:BiomeType,nightAlpha:number,now:number){
  if(nightAlpha>.38 || biome==='shadow') return;
  const p=ATMOSPHERE_PROFILES[biome];
  ctx.save();
  ctx.globalCompositeOperation='screen';
  const alpha=.025+(1-nightAlpha)*.025;
  const sway=Math.sin(now/5000)*width*.025;
  for(let i=0;i<3;i++){
    const x=width*(.14+i*.30)+sway;
    const grad=ctx.createLinearGradient(x,0,x+width*.16,height*.65);
    grad.addColorStop(0,`rgba(${p.highlight},${alpha*1.8})`);
    grad.addColorStop(1,`rgba(${p.highlight},0)`);
    ctx.fillStyle=grad;
    ctx.beginPath();
    ctx.moveTo(x-width*.045,0); ctx.lineTo(x+width*.055,0); ctx.lineTo(x+width*.22,height*.72); ctx.lineTo(x+width*.04,height*.72); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

export function drawWorldAtmosphere(ctx:CanvasRenderingContext2D,canvas:HTMLCanvasElement,biome:BiomeType,nightAlpha:number,playerPos:{x:number;y:number},camera:{x:number;y:number},tileSize:number,now:number):void {
  const p=ATMOSPHERE_PROFILES[biome];
  ctx.save();
  if(p.overlayAlpha>0){ctx.fillStyle=`rgba(${p.overlay},${p.overlayAlpha})`;ctx.fillRect(0,0,canvas.width,canvas.height);}
  drawDepthHaze(ctx,canvas.width,canvas.height,biome,now);
  drawLightShafts(ctx,canvas.width,canvas.height,biome,nightAlpha,now);
  drawAmbientMotes(ctx,canvas.width,canvas.height,biome,now);

  const nightAmt=biome==='shadow'?.68:Math.max(0,Math.min(.65,nightAlpha*1.35));
  if(nightAmt>.12){
    const px=(playerPos.x-camera.x+.5)*tileSize, py=(playerPos.y-camera.y+.5)*tileSize;
    const halo=ctx.createRadialGradient(px,py,tileSize*.2,px,py,tileSize*6.7);
    halo.addColorStop(0,`rgba(255,225,164,${.12+nightAmt*.06})`);
    halo.addColorStop(.26,`rgba(255,178,82,${nightAmt*.18})`);
    halo.addColorStop(.7,`rgba(92,82,120,${nightAmt*.035})`);
    halo.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalCompositeOperation='screen';ctx.fillStyle=halo;ctx.fillRect(px-tileSize*7,py-tileSize*7,tileSize*14,tileSize*14);ctx.globalCompositeOperation='source-over';
  }

  if(biome==='swamp'){
    const fog=ctx.createLinearGradient(0,canvas.height*.30,0,canvas.height);fog.addColorStop(0,'rgba(42,70,32,0)');fog.addColorStop(.72,'rgba(20,34,18,.12)');fog.addColorStop(1,'rgba(14,28,15,.31)');ctx.fillStyle=fog;ctx.fillRect(0,0,canvas.width,canvas.height);
  }else if(biome==='shadow'){
    const glow=ctx.createRadialGradient(canvas.width*.5,canvas.height*.42,20,canvas.width*.5,canvas.height*.42,canvas.width*.62);glow.addColorStop(0,'rgba(137,82,218,.08)');glow.addColorStop(.48,'rgba(55,20,88,.06)');glow.addColorStop(1,'rgba(0,0,0,.29)');ctx.fillStyle=glow;ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  if(nightAlpha>.04&&nightAlpha<.5){const t=Math.max(0,1-Math.abs(nightAlpha-.275)/.275);ctx.fillStyle=`rgba(228,125,66,${.07*t})`;ctx.fillRect(0,0,canvas.width,canvas.height);}

  // filmic edge treatment: cool lower shadows and warm optical center.
  const bloom=ctx.createRadialGradient(canvas.width*.48,canvas.height*.42,0,canvas.width*.48,canvas.height*.42,Math.min(canvas.width,canvas.height)*.55);
  bloom.addColorStop(0,`rgba(${p.highlight},.026)`);bloom.addColorStop(1,'rgba(255,255,255,0)');ctx.globalCompositeOperation='screen';ctx.fillStyle=bloom;ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-over';
  const vignette=ctx.createRadialGradient(canvas.width/2,canvas.height/2,Math.min(canvas.width,canvas.height)/3.2,canvas.width/2,canvas.height/2,Math.max(canvas.width,canvas.height)/1.18);
  vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(.72,'rgba(0,0,0,.035)');vignette.addColorStop(1,`rgba(${p.shadow},${p.vignette})`);ctx.fillStyle=vignette;ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.restore();
}
''')

# Avatar grounding + silhouette separation.
replace(Path('src/game/playerAvatar.ts'), "  ctx.fillStyle = 'rgba(0,0,0,0.42)';\n  ctx.beginPath();\n  ctx.ellipse(cx, y + size - 1, size * (mounted ? 0.42 : 0.32), Math.max(2, size * 0.065), 0, 0, Math.PI * 2);\n  ctx.fill();", "  // 9.27 layered contact shadow makes the sprite feel planted in the world.\n  const shadowY = y + size - 1;\n  ctx.fillStyle = 'rgba(0,0,0,0.18)';\n  ctx.beginPath();\n  ctx.ellipse(cx + size * 0.035, shadowY + 1, size * (mounted ? 0.48 : 0.38), Math.max(3, size * 0.095), -0.06, 0, Math.PI * 2);\n  ctx.fill();\n  ctx.fillStyle = 'rgba(0,0,0,0.46)';\n  ctx.beginPath();\n  ctx.ellipse(cx, shadowY, size * (mounted ? 0.37 : 0.285), Math.max(2, size * 0.052), 0, 0, Math.PI * 2);\n  ctx.fill();\n  // Warm micro-rim under the feet separates silhouettes from dark cobbles without smoothing pixels.\n  ctx.fillStyle = 'rgba(244,210,138,0.075)';\n  ctx.fillRect(Math.round(cx - size * .22), Math.round(shadowY - 2), Math.max(2, Math.round(size * .44)), 1);")

# Monster depth and elite/boss aura.
replace(Path('src/game/classicEntityPresentation.ts'), "  ctx.save();\n  ctx.imageSmoothingEnabled = false;\n\n  if (/rat|wolf|boar|hound|tiger|lion/.test(id)) {", "  ctx.save();\n  ctx.imageSmoothingEnabled = false;\n\n  // 9.27 visual hierarchy: every creature gets a contact shadow; elites/bosses gain restrained world-space aura.\n  ctx.fillStyle = 'rgba(0,0,0,.38)';\n  ctx.beginPath(); ctx.ellipse(cx, feetY, size * .31, Math.max(2,size*.055), 0, 0, Math.PI*2); ctx.fill();\n  if (monster.type === 'elite' || monster.type === 'boss') {\n    const radius = size * (monster.type === 'boss' ? .72 : .58);\n    const aura = ctx.createRadialGradient(cx, cy, size*.10, cx, cy, radius);\n    aura.addColorStop(0, monster.type === 'boss' ? 'rgba(232,181,72,.16)' : 'rgba(184,93,235,.12)');\n    aura.addColorStop(1, 'rgba(0,0,0,0)');\n    ctx.fillStyle = aura; ctx.fillRect(cx-radius, cy-radius, radius*2, radius*2);\n  }\n\n  if (/rat|wolf|boar|hound|tiger|lion/.test(id)) {")

# HUD/UI material language and canvas framing.
css=Path('src/index.css')
css.write_text(css.read_text()+r'''

/* Mor'ia 9.27 — Visual Rebirth: deep material hierarchy and cinematic world frame */
:root {
  --moria-obsidian: #050609;
  --moria-iron: #171b22;
  --moria-brass: #b99148;
  --moria-parchment: #e8dcc2;
  --moria-rune: #8cc8ff;
}

.moria-world-canvas {
  filter: saturate(1.08) contrast(1.055) brightness(.985);
  box-shadow: inset 0 0 80px rgba(0,0,0,.34), 0 0 0 1px rgba(222,190,118,.08);
}

.moria-panel {
  border-color: rgba(176,151,101,.22);
  background:
    linear-gradient(180deg, rgba(18,21,27,.94), rgba(6,8,12,.975)),
    radial-gradient(circle at 12% 0%, rgba(214,183,116,.065), transparent 28%),
    radial-gradient(circle at 100% 20%, rgba(87,136,184,.075), transparent 34%);
  box-shadow: 0 26px 76px rgba(0,0,0,.56), inset 0 1px rgba(255,244,214,.055), inset 0 -1px rgba(0,0,0,.65);
}

.moria-panel::after {
  content: "";
  pointer-events: none;
  position: absolute;
  inset: 2px;
  border-radius: inherit;
  border: 1px solid rgba(255,255,255,.018);
  box-shadow: inset 0 0 28px rgba(0,0,0,.18);
}

.moria-card {
  background:
    linear-gradient(135deg, rgba(255,255,255,.045), transparent 38%),
    linear-gradient(180deg, rgba(24,28,35,.68), rgba(7,9,13,.84));
  border-color: rgba(176,151,101,.16);
}

.moria-topbar-95 {
  box-shadow: 0 10px 34px rgba(0,0,0,.58), inset 0 -1px rgba(214,183,116,.18) !important;
}

.moria-button {
  border-color: rgba(185,145,72,.38);
  background: linear-gradient(180deg, rgba(40,43,48,.98), rgba(13,15,19,.99));
  box-shadow: inset 0 1px rgba(255,244,214,.07), inset 0 -1px rgba(0,0,0,.65), 0 7px 18px rgba(0,0,0,.28);
}

.moria-slot {
  background:
    radial-gradient(circle at 50% 20%, rgba(140,200,255,.075), transparent 38%),
    linear-gradient(145deg, rgba(35,39,47,.96), rgba(7,9,13,.99));
  border-color: rgba(185,145,72,.26);
  box-shadow: inset 0 0 15px rgba(0,0,0,.42), inset 0 1px rgba(255,255,255,.055), 0 8px 20px rgba(0,0,0,.30);
}

.moria-title {
  text-shadow: 0 2px 2px rgba(0,0,0,.9), 0 0 22px rgba(214,183,116,.09);
}

@keyframes moria-visual-breathe {
  0%,100% { box-shadow: inset 0 0 80px rgba(0,0,0,.34), 0 0 0 1px rgba(222,190,118,.08); }
  50% { box-shadow: inset 0 0 72px rgba(0,0,0,.29), 0 0 0 1px rgba(222,190,118,.115); }
}

@media (prefers-reduced-motion: no-preference) {
  .moria-world-canvas { animation: moria-visual-breathe 7s ease-in-out infinite; }
}
''')

# Add release documentation.
Path('docs/MORIA_9_27_VISUAL_REBIRTH.md').write_text(r'''# Mor'ia 9.27 — Visual Rebirth

## Goal

9.27 freezes feature expansion temporarily and rebuilds the visual hierarchy of Mor'ia without moving gameplay authority into the client.

## Phase 1 — shipped by this branch

- deeper biome-specific color grading and atmospheric haze;
- subtle screen-space light shafts during brighter day phases;
- stronger night/player light halo with warm/cool falloff;
- layered filmic vignette and optical-center bloom;
- increased ambient particle density per biome;
- layered contact shadows for players, mounts and monsters;
- restrained elite/boss world-space aura for combat hierarchy;
- richer obsidian/brass HUD material language;
- upgraded world-canvas contrast/saturation treatment while retaining pixel crispness;
- no server authority or gameplay calculations changed.

## Visual roadmap before 10.0

### 9.28 — Terrain & Environment Materials
Tile-edge blending, richer water/lava animation, biome prop silhouettes, vegetation variation, roofs/walls and environmental decals.

### 9.29 — Character & Creature Art Pass
More vocation silhouettes, directional variation, attack/cast/hit/death frames, monster-family silhouettes, boss scale and readability.

### 9.30 — Combat VFX & Animation
School-specific impact language, trails, hit-stop presentation, telegraphs, status VFX, reaction bursts and damage-number hierarchy.

### 9.31 — Cities, Interiors & Lighting
Distinct architectural kits, interiors with material sets, emissive windows/torches, landmarks, market/crafting visual identity and siege damage states.

### 9.32 — UI/HUD Cinematic Polish
Final iconography, typography hierarchy, window chrome, tooltips, inventory readability, responsive layouts and accessibility/reduced-motion review.

### 9.33 — Visual Release Gate
Cross-biome browser capture, desktop/mobile responsive E2E, console-clean proof, visual-regression baselines and README gallery before merging the full visual line.
''')

print('Mor\'ia 9.27 visual rebirth applied')
