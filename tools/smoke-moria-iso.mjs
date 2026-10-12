import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = (process.env.MORIA_SMOKE_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const output = 'artifacts/moria-iso-smoke';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--enable-unsafe-swiftshader'] });
const report = [];
const issues = [];

function instrument(page, label) {
  page.on('pageerror', error => issues.push(`${label}: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') issues.push(`${label}: console: ${message.text()}`);
  });
}
async function readyIso(page) {
  await page.locator('[data-testid="iso-next-root"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => document.querySelector('[data-testid="iso-next-canvas"]')?.getAttribute('data-pixi-mount') === 'active', null, { timeout: 15000 }).catch(async error => {
    const details = await page.locator('[data-testid="iso-next-canvas"]').evaluate(node => ({ lifecycle: node.dataset.isoLifecycle, pixiMount: node.dataset.pixiMount, pixiError: node.dataset.pixiError, threeMount: node.dataset.threeMount }));
    throw new Error(`ISO Pixi mount failed: ${JSON.stringify(details)}; ${error.message}`);
  });
  await page.locator('canvas[data-testid="iso-pixi-canvas"]').waitFor({ state: 'visible' });
}
async function demo(page, suffix) {
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  if (suffix === 'desktop') await page.screenshot({ path: `${output}/login-desktop.png`, fullPage: false });
  await page.getByRole('button', { name: /JOGO RÁPIDO OFFLINE/i }).click();
  await readyIso(page);
  await page.locator('[data-testid="iso-authoritative-stats"]').waitFor({ state: 'visible' });
  if (suffix === 'desktop') await page.locator('[data-testid="iso-player-hud"]').waitFor({ state: 'visible' });
  if (suffix === 'mobile') {
    await page.locator('[data-testid="iso-shortcuts-toggle"]').waitFor({ state: 'visible' });
    assert.equal(await page.locator('[data-iso-window="authoritative-minimap"]').count(), 0, 'Mobile minimap should begin collapsed');
    assert.equal(await page.locator('[data-testid="iso-player-hud"]').count(), 0, 'Mobile should show one status HUD');
  }
  await page.getByText('Jogo Rápido • LOCAL').waitFor({ state: 'visible' });
  const initial = await page.evaluate(() => window.__MORIA_AUTHORITATIVE_SNAPSHOT__?.player?.pos);
  assert.ok(initial && typeof initial.x === 'number', 'Quick Play authoritative-shaped snapshot must expose a position');
  await page.evaluate(() => {
    window.__moriaSmokeKeys = [];
    window.addEventListener('keydown', event => window.__moriaSmokeKeys.push(event.code), { capture: true });
  });
  await page.keyboard.down('ArrowUp');
  try {
    await page.waitForFunction(prev => window.__MORIA_AUTHORITATIVE_SNAPSHOT__?.player?.pos?.y < prev, initial.y, { timeout: 12000 });
  } catch (error) {
    await page.screenshot({ path: `${output}/movement-failure-${suffix}.png`, fullPage: false });
    const debug = await page.evaluate(() => ({
      keys: window.__moriaSmokeKeys,
      pos: window.__MORIA_AUTHORITATIVE_SNAPSHOT__?.player?.pos,
      lifecycle: document.querySelector('[data-testid="iso-next-canvas"]')?.dataset.isoLifecycle,
      focused: document.activeElement?.tagName,
      label: document.querySelector('[data-testid="iso-next-root"]')?.textContent?.slice(0, 140)
    }));
    throw new Error(`Keyboard movement did not update Quick Play snapshot: ${JSON.stringify({ initial, debug, underlying: String(error) })}`);
  } finally {
    await page.keyboard.up('ArrowUp');
  }
  assert.equal(await page.locator('[data-testid="iso-action-bar"]').count(), 0, 'Inert duplicate action bar must not return');
  if (suffix === 'mobile') {
    const dpad=page.locator('[data-testid="iso-touch-dpad"]');
    await dpad.waitFor({state:'visible'});
    const before=await page.evaluate(()=>window.__MORIA_AUTHORITATIVE_SNAPSHOT__?.player?.pos);
    const left=await page.locator('[data-testid="iso-touch-ArrowLeft"]').boundingBox();
    assert.ok(left,'Offline mobile must expose an accessible pointer D-pad');
    await page.mouse.move(left.x+left.width/2,left.y+left.height/2);
    await page.mouse.down();
    try {
      await page.waitForFunction(x=>window.__MORIA_AUTHORITATIVE_SNAPSHOT__?.player?.pos?.x<x,before.x,{timeout:12000});
      assert.equal(await dpad.getAttribute('data-touch-active'),'ArrowLeft','Touch input should become active while held');
    }finally{
      await page.mouse.up();
    }
    await page.waitForFunction(()=>document.querySelector('[data-testid="iso-touch-dpad"]')?.getAttribute('data-touch-active')==='none');
    await page.locator('[data-testid="iso-touch-interact"]').waitFor({state:'visible'});
    report.push('Quick Play mobile: pointer-held D-pad moves character and stops on release');
  }
  await page.screenshot({ path: `${output}/quick-play-${suffix}.png`, fullPage: false });
  report.push(`Quick Play ${suffix}: renderer mounted, hero visible, keyboard movement worked`);
}

try {
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  const status = await health.json();
  assert.equal(status.status, 'online');

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  instrument(desktop, 'desktop');
  await demo(desktop, 'desktop');
  await desktop.getByRole('button', { name: 'Sair', exact: true }).click();
  await desktop.getByRole('button', { name: /JOGO RÁPIDO OFFLINE/i }).waitFor({ state: 'visible' });
  report.push('Logout: clickable and returns to login screen');

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  instrument(mobile, 'mobile');
  await demo(mobile, 'mobile');

  const legacy = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  instrument(legacy, 'legacy');
  await legacy.goto(`${base}/legacy`, { waitUntil: 'domcontentloaded' });
  await legacy.getByRole('button', { name: /JOGO RÁPIDO OFFLINE/i }).click();
  await legacy.locator('canvas.moria-world-canvas').waitFor({ state: 'visible', timeout: 12000 });
  await legacy.screenshot({ path: `${output}/legacy.png`, fullPage: false });
  report.push('Legacy: separate route and offline renderer available');

  const stamp = Date.now().toString().slice(-9);
  const username = `smoke_${stamp}`;
  const characterName = `SmokeHero${stamp.slice(-6)}`;
  const password = `MoriaSmokeStrong-${stamp}`;
  const registered = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
  if (registered.status !== 201) throw new Error(`register ${registered.status}: ${await registered.text()}`);
  const registration = await registered.json();
  const created = await fetch(`${base}/api/characters`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${registration.sessionToken}` }, body: JSON.stringify({ name: characterName, vocation: 'knight' }) });
  assert.equal(created.status, 201, `character creation: ${await created.text()}`);

  const online = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  instrument(online, 'online');
  await online.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await online.locator('[autocomplete="username"]').fill(username);
  await online.locator('[autocomplete="current-password"]').fill(password);
  await online.locator('button.moria-button-primary').last().click();
  await readyIso(online);
  await online.getByText('Servidor autoritativo • LIVE').waitFor({ state: 'visible', timeout: 16000 });
  await online.locator('[data-testid="iso-player-hud"]').waitFor({ state: 'visible' });
  await online.waitForFunction(() => {
    const player = window.__MORIA_AUTHORITATIVE_SNAPSHOT__?.player;
    const center = document.querySelector('canvas[data-testid="iso-pixi-canvas"]')?.getAttribute('data-ground-center');
    if (!player || !center) return false;
    // The authoritative presentation adapter reads top-level x/y; "pos" is legacy.
    const playerX = Number.isFinite(player.x) ? player.x : player.pos?.x;
    const playerY = Number.isFinite(player.y) ? player.y : player.pos?.y;
    if (!Number.isFinite(playerX) || !Number.isFinite(playerY)) return false;
    const [x, y] = center.split(',').map(Number);
    return Math.abs(x - playerX) <= 1 && Math.abs(y - playerY) <= 1;
  }, null, { timeout: 10000 });
  await online.waitForFunction(() => {
    const canvas = document.querySelector('canvas[data-testid="iso-pixi-canvas"]');
    return canvas?.getAttribute('data-terrain-mode') === 'authoritative'
      && canvas?.getAttribute('data-terrain-map') === 'eldoria'
      && Number(canvas?.getAttribute('data-terrain-tiles')) > 0;
  }, null, { timeout: 10000 });
  // Patches are deltas; the terrain must survive later snapshots without one.
  await online.waitForTimeout(400);
  assert.equal(await online.locator('canvas[data-testid="iso-pixi-canvas"]').getAttribute('data-terrain-mode'), 'authoritative');
  report.push('Online: terrain is rendered from bounded authoritative server tiles');
  await online.waitForFunction(() => {
    const canvas = document.querySelector('canvas[data-testid="iso-pixi-canvas"]');
    return Number(canvas?.getAttribute('data-city-landmarks')) > 0
      && canvas?.getAttribute('data-city-style') === 'royal';
  }, null, { timeout: 12000 });
  const buildings = Number(await online.locator('canvas[data-testid="iso-pixi-canvas"]').getAttribute('data-city-landmarks'));
  assert.ok(buildings >= 1 && buildings <= 24, `Landmark count must be bounded, got ${buildings}`);
  report.push(`Online architecture: ${buildings} server-owned buildings depth-sorted with actors`);
  assert.equal(
    await online.locator('canvas[data-testid="iso-pixi-canvas"]').getAttribute('data-entity-update-mode'),
    'snapshot-driven',
    'Online actors must update on authoritative presentation changes, not 60Hz ticker allocation'
  );
  await online.waitForFunction(() => {
    const terrain = document.querySelector('canvas[data-testid="iso-pixi-canvas"]');
    const three = document.querySelector('canvas[data-testid="iso-three-atmosphere"]');
    return terrain?.dataset.terrainBiome === 'plains'
      && (!three || three.dataset.rendererState !== 'active'
        || (three.dataset.biome === 'plains' && three.dataset.worldAtmosphere === 'server-biome'));
  }, null, {timeout:10000});
  report.push('Online Visual 2.2: material and atmospheric shader follow authoritative plains biome');
  await online.waitForFunction(()=>{
    const canvas=document.querySelector('canvas[data-testid="iso-pixi-canvas"]');
    return canvas?.dataset.presentationScheduler==='snapshot-on-demand'
      && Number(canvas.dataset.drawnFrames)>0;
  },null,{timeout:12000});
  const desktopCounters=await online.evaluate(()=>{
    const pixi=document.querySelector('canvas[data-testid="iso-pixi-canvas"]');
    const three=document.querySelector('canvas[data-testid="iso-three-atmosphere"]');
    return {mode:pixi?.dataset.presentationScheduler,pixiFrames:Number(pixi?.dataset.drawnFrames),
      shaderProfile:three?.dataset.shaderProfile,scale:three?.dataset.renderScale};
  });
  assert.ok(desktopCounters.pixiFrames>=1,'Online renderer must submit GPU frames on demand');
  if(desktopCounters.shaderProfile)assert.equal(desktopCounters.shaderProfile,'desktop-full');
  report.push(`Visual 2.5 desktop: Pixi snapshot-on-demand (${desktopCounters.pixiFrames} manual frames), Three ${desktopCounters.shaderProfile}`);
  await online.screenshot({ path: `${output}/online.png`, fullPage: false });
  // Diagnostic-only FPS sample. CI software WebGL is slower than real GPUs,
  // so retain actual statistics rather than imposing a misleading hard FPS gate.
  const frameSample = await online.evaluate(async () => new Promise(resolve => {
    const frames = [];
    let start = 0;
    let last = 0;
    const measure = time => {
      if (!start) start = time;
      if (last) frames.push(time - last);
      last = time;
      if (time - start < 1100) requestAnimationFrame(measure);
      else {
        const sorted = frames.slice().sort((a, b) => a - b);
        resolve({ samples:frames.length,
          avgFrameMs:frames.reduce((sum,v)=>sum+v,0)/Math.max(1,frames.length),
          p95FrameMs:sorted[Math.floor(sorted.length*.95)]||0,
          estimatedFps:1000/(frames.reduce((sum,v)=>sum+v,0)/Math.max(1,frames.length)) });
      }
    };
    requestAnimationFrame(measure);
  }));
  await writeFile(`${output}/render-performance.json`,JSON.stringify({engine:'CI Chromium software WebGL',frameSample},null,2));
  report.push(`Visual performance sample: ${frameSample.samples} frames, ~${frameSample.estimatedFps.toFixed(1)} FPS (CI software renderer)`);
  report.push('Online: real HTTP login, character ownership, WebSocket auth, server snapshot, Pixi mount');
  await online.getByRole('button', { name: 'Sair', exact: true }).click();
  await online.getByRole('button', { name: /JOGO RÁPIDO OFFLINE/i }).waitFor({ state: 'visible' });
  const afterLogout = await online.evaluate(() => ({
    token: localStorage.getItem('moria_session_token'),
    snapshot: window.__MORIA_AUTHORITATIVE_SNAPSHOT__
  }));
  assert.equal(afterLogout.token, null, 'Logout must clear stored session');
  assert.equal(afterLogout.snapshot, undefined, 'Logout must clear stale authoritative snapshot');
  report.push('Online logout: session and cached world snapshot cleared');

  // Crucial mobile parity proof: the earlier quick-play-mobile.png captures
  // the OFFLINE Eldoria fixture, not the online server-authored 160x160 city.
  // Use the SAME persisted account and character as the desktop online case.
  const mobileOnline = await browser.newPage({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 1,
    isMobile: true, hasTouch: true
  });
  instrument(mobileOnline, 'online-mobile');
  await mobileOnline.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await mobileOnline.locator('[autocomplete="username"]').fill(username);
  await mobileOnline.locator('[autocomplete="current-password"]').fill(password);
  await mobileOnline.locator('button.moria-button-primary').last().click();
  await readyIso(mobileOnline);
  await mobileOnline.getByText('Servidor autoritativo • LIVE').waitFor({ state: 'visible', timeout: 18000 });
  await mobileOnline.locator('[data-testid="iso-shortcuts-toggle"]').waitFor({ state: 'visible' });
  assert.equal(await mobileOnline.locator('[data-testid="iso-player-hud"]').count(), 0,
    'Mobile online must not duplicate the player HUD');
  assert.equal(await mobileOnline.locator('[data-iso-window="authoritative-minimap"]').count(), 0,
    'Mobile online minimap should begin collapsed');
  await mobileOnline.waitForFunction(() => {
    const snap = window.__MORIA_AUTHORITATIVE_SNAPSHOT__;
    const pixi = document.querySelector('canvas[data-testid="iso-pixi-canvas"]');
    const sky = document.querySelector('canvas[data-testid="iso-three-atmosphere"]');
    return snap?.player?.mapId === 'eldoria'
      && pixi?.dataset.terrainMap === 'eldoria'
      && pixi?.dataset.terrainMode === 'authoritative'
      && pixi?.dataset.terrainBiome === 'plains'
      && Number(pixi?.dataset.cityLandmarks) > 0
      && (sky?.dataset.rendererState !== 'active'
        || (sky.dataset.biome === 'plains' && sky.dataset.worldAtmosphere === 'server-biome'));
  }, null, { timeout: 16000 });
  const mobileParity = await mobileOnline.evaluate(() => {
    const snap = window.__MORIA_AUTHORITATIVE_SNAPSHOT__;
    const c = document.querySelector('canvas[data-testid="iso-pixi-canvas"]');
    const [cx, cy] = (c?.dataset.groundCenter || '').split(',').map(Number);
    return { mapId:snap?.player?.mapId, biome:c?.dataset.terrainBiome,
      cityLandmarks:Number(c?.dataset.cityLandmarks), cx, cy,
      heroX:snap?.player?.x, heroY:snap?.player?.y,
      width:innerWidth, pageWidth:document.documentElement.scrollWidth };
  });
  assert.equal(await mobileOnline.locator('canvas[data-testid="iso-pixi-canvas"]').getAttribute('data-frame-cap'), '30',
    'Mobile Pixi ticker should cap redraw at 30fps while authoritative simulation stays unchanged');
  assert.equal(await mobileOnline.locator('canvas[data-testid="iso-pixi-canvas"]').getAttribute('data-presentation-scheduler'),
    'snapshot-on-demand','Mobile Pixi must not redraw scene blindly on every ticker');
  const mobileShader=await mobileOnline.locator('canvas[data-testid="iso-three-atmosphere"]').evaluate(canvas=>({
    state:canvas.dataset.rendererState,profile:canvas.dataset.shaderProfile,scale:Number(canvas.dataset.renderScale)
  }));
  if(mobileShader.state==='active'){
    assert.equal(mobileShader.profile,'mobile-lite','Mobile must render reduced-cost atmosphere');
    assert.ok(mobileShader.scale<=.7&&mobileShader.scale>=.5);
  }
  const beforeTouchPaint=Number(await mobileOnline.locator('canvas[data-testid="iso-pixi-canvas"]').getAttribute('data-drawn-frames'));
  assert.ok(beforeTouchPaint>0,'Mobile online scene must submit at least one GPU draw');
  assert.equal(mobileParity.mapId, 'eldoria');
  assert.equal(mobileParity.biome, 'plains');
  assert.ok(mobileParity.cityLandmarks >= 1);
  assert.ok(Math.abs(mobileParity.heroX-mobileParity.cx) <= 1 && Math.abs(mobileParity.heroY-mobileParity.cy) <= 1,
    'Mobile camera must follow the actual authoritative character');
  assert.ok(mobileParity.pageWidth <= mobileParity.width + 2,
    'Online mobile layout must not overflow the viewport');
  const mobileBoxes = await mobileOnline.evaluate(() => {
    const rect = selector => { const r=document.querySelector(selector)?.getBoundingClientRect();
      return r?{top:r.top,bottom:r.bottom,left:r.left,right:r.right}:null; };
    return {
      header:rect('[data-testid="iso-status-header"]'),
      menu:rect('[data-testid="iso-shortcuts-toggle"]'),
      stats:rect('[data-testid="iso-authoritative-stats"]'),
      bar:rect('[data-iso-window="authoritative-action-bar"]'),
      height:innerHeight
    };
  });
  assert.ok(mobileBoxes.header&&mobileBoxes.menu&&mobileBoxes.stats&&mobileBoxes.bar,
    'Mobile must show status header, menu, compact stats and action bar');
  assert.ok(mobileBoxes.header.bottom+3<=mobileBoxes.menu.top,
    'Mobile menu must not cover the status header');
  assert.ok(mobileBoxes.stats.bottom+3<=mobileBoxes.bar.top,
    'Mobile stats must not cover the action bar');
  assert.ok(mobileBoxes.bar.bottom<=mobileBoxes.height+3,
    'Mobile action bar must stay inside the viewport');
  await mobileOnline.screenshot({ path:`${output}/online-mobile.png`, fullPage:false });
  // Native touch (not synthesized keyboard) must use the authoritative movement
  // path; release on finger-up and never leave the character walking forever.
  const touchDpad=mobileOnline.locator('[data-testid="iso-touch-ArrowUp"]');
  const touchRect=await touchDpad.boundingBox();
  assert.ok(touchRect,'Online mobile needs a visible D-pad');
  const point={x:touchRect.x+touchRect.width/2,y:touchRect.y+touchRect.height/2};
  const touchSession=await mobileOnline.context().newCDPSession(mobileOnline);
  const firstY=mobileParity.heroY;
  await touchSession.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  try{
    await mobileOnline.waitForFunction(y=>
      Number(window.__MORIA_AUTHORITATIVE_SNAPSHOT__?.player?.y)<y,firstY,{timeout:16000});
    assert.equal(await mobileOnline.locator('[data-testid="iso-touch-dpad"]').getAttribute('data-touch-active'),'ArrowUp');
    await mobileOnline.screenshot({path:`${output}/online-mobile-moving.png`,fullPage:false});
  }finally{
    await touchSession.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await touchSession.detach();
  }
  await mobileOnline.waitForFunction(()=>
    document.querySelector('[data-testid="iso-touch-dpad"]')?.getAttribute('data-touch-active')==='none');
  const afterTouchPaint=Number(await mobileOnline.locator('canvas[data-testid="iso-pixi-canvas"]').getAttribute('data-drawn-frames'));
  assert.ok(afterTouchPaint>beforeTouchPaint,'Authoritative touch movement must submit new GPU scene frames');
  report.push(`Online mobile: touch moves authoritative player with ${afterTouchPaint-beforeTouchPaint} new on-demand scene draws and clean release`);
  await writeFile(`${output}/online-mobile-parity.json`, JSON.stringify(mobileParity,null,2));
  report.push(`Online mobile: same character/server city as desktop, ${mobileParity.cityLandmarks} real buildings, HUD fit and camera tracked`);
  await mobileOnline.getByRole('button', { name:'Sair', exact:true }).click();
  await mobileOnline.getByRole('button', { name:/JOGO RÁPIDO OFFLINE/i }).waitFor({state:'visible'});

  if (issues.length) throw new Error(`Browser runtime errors:\n${issues.join('\n')}`);
  console.log('MOR\'IA ISO SMOKE PASS:\n' + report.join('\n'));
} catch (error) {
  console.error('MOR\'IA ISO SMOKE FAILED:', error);
  await writeFile(`${output}/failure.json`, JSON.stringify({ message: String(error), issues, report }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
