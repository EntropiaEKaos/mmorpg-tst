import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const output = 'artifacts/moria-9.35b-screenshots';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 });

await page.goto('http://127.0.0.1:4173/visual-qa.html?panel=grand-minimap', { waitUntil: 'networkidle' });
await page.locator('[data-visual-qa-ready="grand-minimap"]').waitFor({ state: 'visible' });
const minimap = page.locator('[data-minimap-map="qa_grand_capital"]');
await minimap.waitFor({ state: 'visible' });
if (await minimap.getAttribute('data-map-width') !== '160' || await minimap.getAttribute('data-map-height') !== '160') throw new Error('9.35B minimap did not preserve 160x160 dimensions');
const minimapBox = await minimap.boundingBox();
const farMarker = page.getByTitle('Bastião do Horizonte');
const farBox = await farMarker.boundingBox();
const playerBox = await page.locator('[data-minimap-player="true"]').boundingBox();
if (!minimapBox || !farBox || !playerBox) throw new Error('9.35B minimap proof elements are missing');
if (farBox.x + farBox.width / 2 <= minimapBox.x + minimapBox.width / 2) throw new Error('9.35B far landmark collapsed into legacy 80-tile half on minimap');
if (playerBox.x + playerBox.width / 2 <= minimapBox.x + minimapBox.width / 2 || playerBox.y + playerBox.height / 2 <= minimapBox.y + minimapBox.height / 2) throw new Error('9.35B far-side player is not mapped into the expected minimap quadrant');
const minimapProof = page.locator('[data-grand-minimap-proof="true"]');
await minimapProof.screenshot({ path: `${output}/grand-minimap.png` });

await page.goto('http://127.0.0.1:4173/visual-qa.html?panel=grand-city-designer', { waitUntil: 'networkidle' });
await page.locator('[data-visual-qa-ready="grand-city-designer"]').waitFor({ state: 'visible' });
const select = page.locator('[data-city-designer-map-select="true"]');
await select.waitFor({ state: 'visible' });
await select.selectOption('qa_grand_capital');
await page.waitForFunction(() => document.querySelector('[data-city-designer-preview="true"]')?.getAttribute('data-map-width') === '160');
const preview = page.locator('[data-city-designer-preview="true"]');
if (await preview.getAttribute('data-map-height') !== '160') throw new Error('9.35B City Designer height did not follow the selected capital');
if (await preview.getAttribute('data-settlement-class') !== 'capital' || await preview.getAttribute('data-landmark-limit') !== '64') throw new Error('9.35B City Designer did not load capital authoring budgets');
const previewBox = await preview.boundingBox();
const farBuilding = page.locator('[data-city-landmark-id="qa_far_keep"]');
await farBuilding.waitFor({ state: 'visible' });
const buildingBox = await farBuilding.boundingBox();
if (!previewBox || !buildingBox) throw new Error('9.35B City Designer visual proof elements are missing');
if (buildingBox.x + buildingBox.width / 2 <= previewBox.x + previewBox.width / 2) throw new Error('9.35B City Designer placed x=124 landmark on the legacy half of the map');
const designerRoot = page.locator('[data-city-designer-root="true"]');
const designerText = await designerRoot.innerText();
for (const forbidden of ['CITY DESIGNER', 'DIRECT MANIPULATION', 'City style', 'RESET LOCAL', 'Select and drag', 'buildings', 'blocked tiles', 'SELECTED BUILDING', 'DUPLICATE', 'DELETE', 'Royal Capital', 'nearby']) {
  if (designerText.includes(forbidden)) throw new Error(`9.35B.1 City Designer English visual leak: ${forbidden}`);
}
for (const required of ['DESIGNER DE CIDADE', 'ESTILO DA CIDADE', 'Capital Real', 'Próximo', '160×160', 'CAPITAL', '3/64 construções']) {
  if (!designerText.includes(required)) throw new Error(`9.35B.1 City Designer PT-BR proof missing: ${required}`);
}
await designerRoot.screenshot({ path: `${output}/grand-city-designer.png` });

await browser.close();
console.log(`Captured Mor'ia 9.35B grand-capital client screenshots in ${output}`);
