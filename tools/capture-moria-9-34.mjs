import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const output = 'artifacts/moria-9.34-screenshots';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

const forbidden = {
  talents: ['TALENT TREE', 'Points:', 'Reset (500', 'Requires:', 'MAXED', 'TIER 1', 'talent point(s)'],
  actionbar: ['Action Bar', 'Hotkey:', 'Required Level:', 'Mana Cost:', 'Base Damage', 'Cooldown:', 'Range:', 'Reactive combos'],
  castbar: ['CASTING', 'Fierce Berserk'],
  dps: ['Combat analytics', 'DPS Meter', 'Duration', 'Total Damage', 'Total Healing', 'Crit Rate', 'RECENT COMBAT', 'physical'],
};

for (const panel of ['talents', 'actionbar', 'castbar', 'dps']) {
  await page.goto(`http://127.0.0.1:4173/visual-qa.html?panel=${panel}`, { waitUntil: 'networkidle' });
  await page.locator(`[data-visual-qa-ready="${panel}"]`).waitFor({ state: 'visible' });
  if (panel === 'actionbar') {
    await page.locator('[data-qa-actionbar] .moria-hotbar-slot').first().hover();
    await page.waitForTimeout(260);
  } else if (panel === 'castbar') {
    await page.waitForTimeout(180);
  } else {
    await page.waitForTimeout(120);
  }
  const bodyText = await page.locator('body').innerText();
  const leaks = forbidden[panel].filter((label) => bodyText.includes(label));
  if (leaks.length) throw new Error(`Mor'ia 9.34 PT-BR visual leak in ${panel}: ${leaks.join(', ')}`);
  await page.screenshot({ path: `${output}/${panel}.png`, fullPage: true });
}

await browser.close();
console.log(`Captured Mor'ia 9.34 screenshots in ${output}`);
