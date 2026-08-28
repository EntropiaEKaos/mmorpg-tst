import { chromium } from 'playwright';
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
