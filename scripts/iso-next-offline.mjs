import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const port = Number(process.env.ISO_PORT || 4173);
const base = `http://127.0.0.1:${port}`;
const route = `${base}/prototype/isometric`;
const evidenceDir = 'docs/screenshots/iso-next';

await mkdir(evidenceDir, { recursive: true });

const server = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env },
  detached: process.platform !== 'win32',
});

const waitForServer = async () => {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await fetch(base);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`ISO preview did not become ready at ${base}`);
};

const stopServer = async () => {
  if (server.exitCode !== null) return;
  if (process.platform === 'win32') {
    server.kill('SIGTERM');
  } else {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      server.kill('SIGTERM');
    }
  }
  await Promise.race([
    new Promise(resolve => server.once('exit', resolve)),
    new Promise(resolve => setTimeout(resolve, 3000)),
  ]);
  if (server.exitCode === null) {
    if (process.platform === 'win32') server.kill('SIGKILL');
    else {
      try { process.kill(-server.pid, 'SIGKILL'); } catch { server.kill('SIGKILL'); }
    }
  }
};

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  desktop.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  desktop.on('pageerror', error => errors.push(error.message));
  await desktop.goto(route, { waitUntil: 'networkidle' });
  await desktop.locator('[data-testid="iso-next-canvas"] canvas').waitFor({ state: 'visible' });
  await desktop.screenshot({ path: `${evidenceDir}/iso-next-eldoria-day.png`, fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 });
  mobile.on('console', message => { if (message.type() === 'error') errors.push(`[mobile] ${message.text()}`); });
  mobile.on('pageerror', error => errors.push(`[mobile] ${error.message}`));
  await mobile.goto(route, { waitUntil: 'networkidle' });
  await mobile.locator('[data-testid="iso-next-canvas"] canvas').waitFor({ state: 'visible' });
  await mobile.screenshot({ path: `${evidenceDir}/iso-next-eldoria-narrow.png`, fullPage: true });

  const report = {
    testedAt: new Date().toISOString(),
    route,
    desktop: '1440x900',
    narrow: '430x932',
    canvasVisible: true,
    consoleErrors: errors,
    passed: errors.length === 0,
  };
  await writeFile(`${evidenceDir}/offline-report.json`, `${JSON.stringify(report, null, 2)}\n`);
  if (errors.length) throw new Error(`ISO browser gate found ${errors.length} console/page error(s)`);
  console.log('ISO Next offline visual gate passed.');
} finally {
  await browser?.close();
  await stopServer();
}
