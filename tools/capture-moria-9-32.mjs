import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const output = 'artifacts/moria-9.32-screenshots';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

for (const panel of ['library', 'mail', 'social']) {
  await page.goto(`http://127.0.0.1:4173/visual-qa.html?panel=${panel}`, { waitUntil: 'networkidle' });
  await page.locator(`[data-visual-qa-ready="${panel}"]`).waitFor({ state: 'visible' });
  await page.waitForTimeout(150);
  const bodyText = await page.locator('body').innerText();
  const forbiddenByPanel = {
    library: ['LIBRARY', 'Back to library', 'Previous', 'Next'],
    mail: ['MAILBOX', 'Compose', 'Refresh', 'Back to inbox', 'Claim Attachments'],
    social: ["AUTHORITATIVE SOCIAL", "MOR'IA SOCIAL HALL", 'FRIENDS', 'NEARBY ADVENTURERS', 'IGNORED', 'Nobody ignored.', 'Guildaa', 'eldoria'],
  };
  const leaks = forbiddenByPanel[panel].filter((label) => bodyText.includes(label));
  if (leaks.length) {
    throw new Error(`PT-BR visual QA leak in ${panel}: ${leaks.join(', ')}`);
  }
  await page.screenshot({ path: `${output}/${panel}.png`, fullPage: true });
}

await browser.close();
console.log(`Captured Mor'ia 9.32 screenshots in ${output}`);
