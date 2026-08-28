import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const output = 'artifacts/moria-9.34-screenshots';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

const forbidden = {
  talents: ['TALENT TREE', 'Points:', 'Reset (500', 'Requires:', 'MAXED', 'TIER 1', 'talent point(s)', 'You have'],
  actionbar: ['Action Bar', 'Hotkey:', 'Required Level:', 'Mana Cost:', 'Base Damage', 'Cooldown:', 'Range:', 'Reactive combos'],
  castbar: ['CASTING', 'Fierce Berserk'],
  dps: ['Combat analytics', 'DPS Meter', 'Duration', 'Total Damage', 'Total Healing', 'Crit Rate', 'RECENT COMBAT', 'physical'],
};

for (const panel of ['talents', 'actionbar', 'castbar', 'dps']) {
  await page.goto(`http://127.0.0.1:4173/visual-qa.html?panel=${panel}`, { waitUntil: 'networkidle' });
  await page.locator(`[data-visual-qa-ready="${panel}"]`).waitFor({ state: 'visible' });
  if (panel === 'actionbar') {
    const hud = page.locator('[data-hud-window="action-bar"]');
    await hud.waitFor({ state: 'visible' });
    const box = await hud.boundingBox();
    if (!box || box.width < 500 || box.height < 60 || box.x < 0 || box.y < 0 || box.x + box.width > 1440 || box.y + box.height > 1000) {
      throw new Error(`Mor'ia 9.34 Action Bar is not visibly framed: ${JSON.stringify(box)}`);
    }
    const hudText = await hud.innerText();
    if (!hudText.toLocaleUpperCase('pt-BR').includes('BARRA DE AÇÕES')) throw new Error(`Mor'ia 9.34 Action Bar title missing: ${hudText}`);
    const tooltipTrigger = hud.locator('[data-tooltip-trigger="true"]').first();
    await tooltipTrigger.waitFor({ state: 'visible', timeout: 3000 });
    const spellSlot = tooltipTrigger.locator('.moria-hotbar-slot').first();
    await spellSlot.waitFor({ state: 'visible', timeout: 3000 });
    const triggerClass = await tooltipTrigger.getAttribute('class');
    const triggerQa = await tooltipTrigger.getAttribute('data-tooltip-trigger');
    if (!triggerClass?.includes('inline-flex') || triggerQa !== 'true') throw new Error(`Mor'ia 9.34 tooltip trigger wrapper not found: ${triggerClass} / ${triggerQa}`);
    if (await spellSlot.isDisabled()) throw new Error("Mor'ia 9.34 spell proof slot is unexpectedly disabled");
    await tooltipTrigger.hover();
    await page.waitForTimeout(320);
    const tooltipState = await page.evaluate(() => {
      const hudNode = document.querySelector('[data-hud-window="action-bar"]');
      const trigger = hudNode?.querySelector('[data-tooltip-trigger="true"]');
      const portal = document.querySelector('body > [data-tooltip-portal="true"]');
      return {
        triggerFound: Boolean(trigger),
        openState: trigger?.getAttribute('data-tooltip-open') || null,
        portalFound: Boolean(portal),
        tooltipText: portal?.textContent || '',
        hudText: hudNode?.textContent || '',
      };
    });
    if (!tooltipState.triggerFound || tooltipState.openState !== 'true') {
      throw new Error(`Mor'ia 9.34 Tooltip local state did not open after real hover: ${JSON.stringify(tooltipState)}`);
    }
    const portal = page.locator('body > [data-tooltip-portal="true"]');
    await portal.waitFor({ state: 'visible', timeout: 3000 });
    const portalBox = await portal.boundingBox();
    const viewport = page.viewportSize();
    if (!portalBox || !viewport || portalBox.x < 3 || portalBox.y < 3 || portalBox.x + portalBox.width > viewport.width - 3 || portalBox.y + portalBox.height > viewport.height - 3) {
      throw new Error(`Mor'ia 9.34.2 Tooltip escapes viewport: ${JSON.stringify({ portalBox, viewport })}`);
    }
    const tooltipText = await portal.innerText();
    for (const required of ['Fúria', 'ATALHO:', 'Custo de Mana:', 'Recarga:', 'COMBOS REATIVOS']) {
      if (!tooltipText.includes(required)) throw new Error(`Mor'ia 9.34 Action Bar tooltip missing ${required}: ${tooltipText}`);
    }
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
