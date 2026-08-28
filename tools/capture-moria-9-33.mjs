import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const output = 'artifacts/moria-9.33-screenshots';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

const forbidden = {
  inventory: ['Drop here to throw on ground', 'Click potions to use', 'Rarity:', 'Common ·'],
  depot: ['DEPOT CHEST', 'Safe storage for your items', 'BACKPACK', 'Click an item to withdraw', 'Click an item to deposit'],
  auction: ['AUCTION HOUSE', 'Browse', 'My Listings', 'Search items...', 'All Rarities', 'Buyout', 'by Merchant Guild'],
  coinshop: ['COIN SHOP', 'Roadmap preview', 'Coming soon', 'GET MORE COINS', 'Claim one-time 500 Coin Demo Grant'],
};

for (const panel of ['inventory', 'depot', 'auction', 'coinshop']) {
  await page.goto(`http://127.0.0.1:4173/visual-qa.html?panel=${panel}`, { waitUntil: 'networkidle' });
  await page.locator(`[data-visual-qa-ready="${panel}"]`).waitFor({ state: 'visible' });
  await page.waitForTimeout(180);
  const bodyText = await page.locator('body').innerText();
  const leaks = forbidden[panel].filter((label) => bodyText.includes(label));
  if (leaks.length) throw new Error(`Mor'ia 9.33 PT-BR visual leak in ${panel}: ${leaks.join(', ')}`);
  await page.screenshot({ path: `${output}/${panel}.png`, fullPage: true });
}

await browser.close();
console.log(`Captured Mor'ia 9.33 screenshots in ${output}`);
