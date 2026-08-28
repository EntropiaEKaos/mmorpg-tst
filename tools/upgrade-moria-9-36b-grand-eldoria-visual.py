from pathlib import Path

ROOT = Path('.')

component = r'''import { useEffect, useRef } from 'react';
import { MAPS, generateMap, getMapDimensions } from '../game/maps';
import { drawBuilding, drawTile, type Building } from '../game/render';

const KIND_TO_BUILDING: Record<string, Building['type']> = {
  keep: 'castle', market: 'market', temple: 'temple', depot: 'shop', gate: 'tower',
  forge: 'forge', dock: 'dock', arena: 'arena', obelisk: 'obelisk', library: 'library',
  graveyard: 'graveyard', lodge: 'inn', tower: 'tower', house: 'house',
};

export default function GrandEldoriaPanorama() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const map = MAPS.eldoria;
  const { width, height } = getMapDimensions(map);
  const bounds = map.urbanBounds || { x: 0, y: 0, width, height };
  const tileSize = 6;
  const canvasWidth = bounds.width * tileSize;
  const canvasHeight = bounds.height * tileSize;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const tiles = generateMap('eldoria');

    for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
      for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        const tile = tiles[y]?.[x];
        if (!tile) continue;
        drawTile(ctx, tile, (x - bounds.x) * tileSize, (y - bounds.y) * tileSize, tileSize, x, y, 0);
      }
    }

    for (const district of map.districts) {
      const cx = (district.x - bounds.x) * tileSize;
      const cy = (district.y - bounds.y) * tileSize;
      if (cx < 0 || cy < 0 || cx > canvasWidth || cy > canvasHeight) continue;
      ctx.save();
      ctx.globalAlpha = 0.13;
      ctx.fillStyle = district.color;
      ctx.beginPath();
      ctx.arc(cx, cy, district.radius * tileSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = district.color;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    for (const landmark of map.landmarks) {
      const sx = (landmark.x - bounds.x) * tileSize;
      const sy = (landmark.y - bounds.y) * tileSize;
      if (sx + landmark.w * tileSize < 0 || sy + landmark.h * tileSize < 0 || sx > canvasWidth || sy > canvasHeight) continue;
      drawBuilding(ctx, sx, sy, {
        x: landmark.x, y: landmark.y, w: landmark.w, h: landmark.h,
        type: KIND_TO_BUILDING[landmark.kind] || 'house',
        roofColor: map.roofColor, wallColor: map.wallColor, accentColor: map.cityAccent,
        icon: landmark.icon,
      }, tileSize, 0);
    }

    ctx.save();
    for (const portal of map.portals) {
      if (portal.pos.x < bounds.x || portal.pos.y < bounds.y || portal.pos.x >= bounds.x + bounds.width || portal.pos.y >= bounds.y + bounds.height) continue;
      const px = (portal.pos.x - bounds.x) * tileSize;
      const py = (portal.pos.y - bounds.y) * tileSize;
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(px - 3, py - 3, 7, 7);
      ctx.strokeStyle = '#f8fafc';
      ctx.strokeRect(px - 4, py - 4, 9, 9);
    }
    const spawnX = (map.spawnPoint.x - bounds.x) * tileSize;
    const spawnY = (map.spawnPoint.y - bounds.y) * tileSize;
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(spawnX - 4, spawnY - 4, 9, 9);
    ctx.strokeStyle = '#111827';
    ctx.strokeRect(spawnX - 5, spawnY - 5, 11, 11);
    ctx.restore();
  }, [bounds.height, bounds.width, bounds.x, bounds.y, canvasHeight, canvasWidth, map, tileSize]);

  const major = map.landmarks.filter((landmark) => [
    'eldoria_sunspire_keep', 'eldoria_grand_market', 'eldoria_dawn_temple',
    'eldoria_grand_arena', 'eldoria_royal_stables', 'eldoria_royal_library',
  ].includes(landmark.id));

  return <section data-grand-eldoria-panorama="true" data-map-width={width} data-map-height={height} data-landmark-count={map.landmarks.length} data-district-count={map.districts.length} className="w-fit max-w-full rounded-xl border border-amber-300/30 bg-[#090806]/95 p-4 shadow-2xl">
    <header className="mb-3 flex flex-wrap items-end justify-between gap-3 border-b border-amber-200/15 pb-3">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[.28em] text-amber-300/70">VISÃO URBANA AUTORITATIVA</div>
        <h2 className="mt-1 text-xl font-black tracking-wide text-amber-100">GRAND ELDORIA</h2>
        <div className="mt-1 text-[11px] text-amber-100/55">Renderer de produção · área urbana {bounds.width}×{bounds.height} · mapa {width}×{height}</div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-[9px] uppercase tracking-wider text-amber-100/60">
        <div className="rounded border border-amber-200/15 bg-black/35 px-3 py-2"><b className="block text-sm text-amber-100">{map.districts.length}</b>distritos</div>
        <div className="rounded border border-amber-200/15 bg-black/35 px-3 py-2"><b className="block text-sm text-amber-100">{map.landmarks.length}</b>marcos</div>
        <div className="rounded border border-amber-200/15 bg-black/35 px-3 py-2"><b className="block text-sm text-amber-100">{map.portals.length}</b>portões</div>
      </div>
    </header>
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="overflow-hidden rounded border-2 border-[#7e6946] bg-black shadow-[0_0_45px_rgba(216,180,90,.12)]">
        <canvas ref={canvasRef} data-grand-eldoria-canvas="true" className="block h-auto max-w-full [image-rendering:pixelated]" />
      </div>
      <aside className="w-full space-y-2 lg:w-64">
        <div className="rounded border border-amber-200/15 bg-amber-950/10 p-3">
          <div className="text-[9px] font-black uppercase tracking-[.2em] text-amber-300/65">Marcos principais</div>
          <div className="mt-2 space-y-1.5">
            {major.map((landmark) => <div key={landmark.id} data-panorama-landmark={landmark.id} className="flex items-center justify-between gap-2 border-b border-white/5 pb-1 text-[10px] text-amber-50/80"><span>{landmark.icon} {landmark.name}</span><span className="shrink-0 text-amber-100/35">{landmark.x},{landmark.y}</span></div>)}
          </div>
        </div>
        <div className="rounded border border-cyan-300/15 bg-cyan-950/10 p-3 text-[10px] leading-relaxed text-cyan-50/60">Os quadrados ciano são portões autoritativos. O marcador dourado indica o ponto de chegada da capital. Muralhas, avenidas, pisos e colisões vêm da mesma geração usada pelo jogo.</div>
      </aside>
    </div>
  </section>;
}
'''
Path('src/components/GrandEldoriaPanorama.tsx').write_text(component, encoding='utf-8')

visual_path = Path('src/visualQa.tsx')
visual = visual_path.read_text(encoding='utf-8')
if "import GrandEldoriaPanorama" not in visual:
    visual = visual.replace("import CityDesigner from './components/CityDesigner';", "import CityDesigner from './components/CityDesigner';\nimport GrandEldoriaPanorama from './components/GrandEldoriaPanorama';")
visual = visual.replace("import { syncServerMaps } from './game/maps';", "import { MAPS, syncServerMaps } from './game/maps';")
marker = "function VisualQa() {"
if "function AuthoritativeGrandEldoriaQa" not in visual:
    block = r'''
const ELDORIA_QA_PLAYER = { ...QA_PLAYER, mapId: 'eldoria', pos: { x: 120, y: 120 } } as unknown as Player;
type EldoriaQaMode = 'eldoria-minimap' | 'eldoria-city-designer' | 'eldoria-panorama';

function AuthoritativeGrandEldoriaQa({ mode }: { mode: EldoriaQaMode }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const base = params.get('qaServer') || 'http://127.0.0.1:3000';
    const token = params.get('qaToken') || '';
    fetch(`${base}/admin/api/maps?token=${encodeURIComponent(token)}`, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Servidor de conteúdo respondeu ${response.status}`);
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        const records = Array.isArray(payload?.items) ? payload.items : [];
        const eldoria = records.find((record: any) => record?.id === 'eldoria');
        if (!eldoria || Number(eldoria.width) !== 160 || Number(eldoria.height) !== 160 || eldoria.settlementClass !== 'capital') {
          throw new Error('Grand Eldoria autoritativa 160×160 não foi recebida do servidor');
        }
        syncServerMaps(records);
        setStatus('ready');
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : String(reason));
        setStatus('error');
      });
    return () => { active = false; };
  }, []);

  if (status === 'loading') return <div className="relative z-10 p-8 text-amber-100" data-grand-eldoria-server-loading="true">Sincronizando Grand Eldoria com o servidor autoritativo…</div>;
  if (status === 'error') return <div className="relative z-10 p-8 text-red-200" data-grand-eldoria-server-error="true">{error}</div>;

  const map = MAPS.eldoria;
  if (mode === 'eldoria-minimap') return <div className="relative z-10 flex min-h-screen items-center justify-center p-6"><div data-grand-eldoria-server-ready="minimap" className="rounded-xl border border-amber-300/30 bg-black/70 p-4 shadow-2xl"><div className="mb-3"><div className="text-sm font-black tracking-wider text-amber-100">GRAND ELDORIA · CAPITAL 160×160</div><div className="mt-1 text-[10px] text-amber-100/55">Servidor autoritativo · {map.districts.length} distritos · {map.landmarks.length} marcos · jogador 120,120</div></div><WorldMiniMap player={ELDORIA_QA_PLAYER} monsters={[]} mapId="eldoria" /></div></div>;
  if (mode === 'eldoria-city-designer') return <div className="relative z-10 p-4" data-grand-eldoria-server-ready="designer"><CityDesigner /></div>;
  return <div className="relative z-10 flex min-h-screen items-center justify-center p-5" data-grand-eldoria-server-ready="panorama"><GrandEldoriaPanorama /></div>;
}

'''
    visual = visual.replace(marker, block + marker)
old_tail = "      {panel === 'grand-city-designer' && <div className=\"relative z-10 p-4\"><CityDesigner /></div>}"
new_tail = old_tail + "\n      {panel === 'eldoria-minimap' && <AuthoritativeGrandEldoriaQa mode=\"eldoria-minimap\" />}\n      {panel === 'eldoria-city-designer' && <AuthoritativeGrandEldoriaQa mode=\"eldoria-city-designer\" />}\n      {panel === 'eldoria-panorama' && <AuthoritativeGrandEldoriaQa mode=\"eldoria-panorama\" />}"
if "panel === 'eldoria-panorama'" not in visual:
    if old_tail not in visual:
        raise SystemExit('visualQa panel anchor not found')
    visual = visual.replace(old_tail, new_tail)
visual_path.write_text(visual, encoding='utf-8')

capture = r'''import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const output = 'artifacts/moria-9.36b-screenshots';
const base = 'http://127.0.0.1:4173/visual-qa.html';
const auth = '&qaServer=http://127.0.0.1:3000&qaToken=moria-visual-qa';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1680, height: 1180 }, deviceScaleFactor: 1 });

async function open(panel) {
  await page.goto(`${base}?panel=${panel}${auth}`, { waitUntil: 'networkidle' });
  await page.locator(`[data-grand-eldoria-server-ready]`).waitFor({ state: 'visible', timeout: 15000 });
  const error = page.locator('[data-grand-eldoria-server-error="true"]');
  if (await error.count()) throw new Error(`9.36B server sync failed: ${await error.innerText()}`);
}

await open('eldoria-minimap');
const minimap = page.locator('[data-minimap-map="eldoria"]');
await minimap.waitFor({ state: 'visible' });
if (await minimap.getAttribute('data-map-width') !== '160' || await minimap.getAttribute('data-map-height') !== '160') throw new Error('9.36B real Eldoria minimap is not 160x160');
const minimapBox = await minimap.boundingBox();
const magistracy = page.getByTitle('Magistratura Real');
const magistracyBox = await magistracy.boundingBox();
const playerBox = await page.locator('[data-minimap-player="true"]').boundingBox();
if (!minimapBox || !magistracyBox || !playerBox) throw new Error('9.36B minimap proof geometry is missing');
if (magistracyBox.x + magistracyBox.width / 2 <= minimapBox.x + minimapBox.width / 2) throw new Error('9.36B east-side Eldoria landmark collapsed into legacy half');
if (playerBox.x + playerBox.width / 2 <= minimapBox.x + minimapBox.width / 2 || playerBox.y + playerBox.height / 2 <= minimapBox.y + minimapBox.height / 2) throw new Error('9.36B player at 120,120 is not in southeast minimap quadrant');
const minimapProof = page.locator('[data-grand-eldoria-server-ready="minimap"]');
const minimapText = await minimapProof.innerText();
for (const required of ['GRAND ELDORIA', 'CAPITAL 160×160', '11 distritos', '16 marcos']) if (!minimapText.includes(required)) throw new Error(`9.36B minimap proof missing: ${required}`);
await minimapProof.screenshot({ path: `${output}/eldoria-minimap.png` });

await open('eldoria-city-designer');
const select = page.locator('[data-city-designer-map-select="true"]');
await select.waitFor({ state: 'visible' });
await select.selectOption('eldoria');
await page.waitForFunction(() => document.querySelector('[data-city-designer-preview="true"]')?.getAttribute('data-map-width') === '160');
const preview = page.locator('[data-city-designer-preview="true"]');
if (await preview.getAttribute('data-map-height') !== '160') throw new Error('9.36B City Designer did not load real Eldoria height');
if (await preview.getAttribute('data-settlement-class') !== 'capital' || await preview.getAttribute('data-landmark-limit') !== '64') throw new Error('9.36B City Designer lost capital budgets');
await page.locator('[data-city-landmark-id="eldoria_sunspire_keep"]').waitFor({ state: 'visible' });
await page.locator('[data-city-landmark-id="eldoria_grand_arena"]').waitFor({ state: 'visible' });
const designer = page.locator('[data-city-designer-root="true"]');
const designerText = await designer.innerText();
for (const required of ['DESIGNER DE CIDADE', '160×160', 'CAPITAL', '16/64 construções']) if (!designerText.includes(required)) throw new Error(`9.36B designer proof missing: ${required}`);
await designer.screenshot({ path: `${output}/eldoria-city-designer.png` });

await open('eldoria-panorama');
const panorama = page.locator('[data-grand-eldoria-panorama="true"]');
await panorama.waitFor({ state: 'visible' });
if (await panorama.getAttribute('data-map-width') !== '160' || await panorama.getAttribute('data-map-height') !== '160') throw new Error('9.36B panorama did not use real 160x160 Eldoria');
if (await panorama.getAttribute('data-landmark-count') !== '16' || await panorama.getAttribute('data-district-count') !== '11') throw new Error('9.36B panorama counts differ from authoritative Eldoria');
for (const id of ['eldoria_sunspire_keep','eldoria_grand_market','eldoria_grand_arena','eldoria_royal_stables']) await page.locator(`[data-panorama-landmark="${id}"]`).waitFor({ state: 'visible' });
const canvas = page.locator('[data-grand-eldoria-canvas="true"]');
const canvasStats = await canvas.evaluate((node) => {
  const c = node;
  const ctx = c.getContext('2d');
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  let opaque = 0, bright = 0;
  for (let i = 0; i < data.length; i += 64) {
    if (data[i + 3] > 0) opaque++;
    if (data[i] + data[i + 1] + data[i + 2] > 300) bright++;
  }
  return { width: c.width, height: c.height, opaque, bright };
});
if (canvasStats.width < 600 || canvasStats.height < 650 || canvasStats.opaque < 10000 || canvasStats.bright < 1000) throw new Error(`9.36B panorama canvas appears blank or undersized: ${JSON.stringify(canvasStats)}`);
const panoramaText = await panorama.innerText();
for (const required of ['Fortaleza Pináculo Solar','Grande Mercado de Eldoria','Grande Arena','Estábulos Reais','Renderer de produção']) if (!panoramaText.includes(required)) throw new Error(`9.36B panorama proof missing: ${required}`);
await panorama.screenshot({ path: `${output}/eldoria-panorama.png` });

await browser.close();
console.log(`Captured Mor'ia 9.36B authoritative Grand Eldoria screenshots in ${output}`);
'''
Path('tools/capture-moria-9-36b.mjs').write_text(capture, encoding='utf-8')

doc_path = Path('docs/MORIA_9_36_GRAND_ELDORIA.md')
doc = doc_path.read_text(encoding='utf-8') if doc_path.exists() else '# Mor\'ia 9.36 — Grand Eldoria\n'
section = r'''

## 9.36B — prova visual autoritativa

A aceitação visual de Grand Eldoria não usa uma cidade sintética. O `visual-qa.html` consulta o catálogo de mapas do servidor por uma sessão administrativa efêmera exclusiva do CI, sincroniza o mesmo registro usado pelo cliente e então produz três provas:

- minimapa real de Eldoria em 160×160, com geometria além do antigo limite 80;
- City Designer carregando os 16 marcos autoritativos e o orçamento de capital;
- panorama urbano renderizado com `generateMap`, `drawTile` e `drawBuilding` de produção, recortado pelos `urbanBounds` reais.

O workflow usa banco de conteúdo temporário para que a prova comece de uma instalação limpa, roda a suíte completa antes do navegador e publica os PNGs somente depois das asserções geométricas e de conteúdo.
'''
if '## 9.36B — prova visual autoritativa' not in doc:
    doc += section
doc_path.write_text(doc, encoding='utf-8')

print("Mor'ia 9.36B authoritative visual proof prepared")
