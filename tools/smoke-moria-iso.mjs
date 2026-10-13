import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = (process.env.MORIA_SMOKE_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const output = 'artifacts/moria-iso-smoke';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--enable-webgl', '--enable-unsafe-swiftshader'] });
// Faster desktop development loop. Mobile behavior remains frozen and its
// COMPLETE existing journey is retained for workflow_dispatch/regression use.
const desktopOnly = process.env.MORIA_DESKTOP_ONLY === '1';
const report = [desktopOnly
  ? 'Desktop release track: mobile frozen at Visual 2.7 (full mobile QA available on workflow_dispatch)'
  : 'Full desktop + mobile regression'];
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

  if (!desktopOnly) {
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    instrument(mobile, 'mobile');
    await demo(mobile, 'mobile');
  }

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
  // Observe real outbound WebSocket frames WITHOUT mocking, intercepting or
  // changing any server traffic. This distinguishes an intent from a reward.
  const desktopIntents=[];
  const serverContent=[];
  online.on('websocket',socket=>{
    socket.on('framereceived',frame=>{
      try{
        const packet=JSON.parse(String(frame.payload));
        if(packet.kind==='content_sync')serverContent.push(packet.payload);
      }catch{}
    });
    socket.on('framesent',frame=>{
    try {
      const packet=JSON.parse(String(frame.payload));
      if(packet.kind==='intent')desktopIntents.push(packet.payload);
    }catch{}
    });
  });
  const waitForIntent=async(type,start,timeout=12000)=>{
    const began=Date.now();
    while(Date.now()-began<timeout){
      const intent=desktopIntents.slice(start).find(x=>x?.type===type);
      if(intent)return intent;
      await new Promise(resolve=>setTimeout(resolve,130));
    }
    throw new Error(`No server-bound ${type} intent sent from desktop UI`);
  };
  await online.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await online.locator('[autocomplete="username"]').fill(username);
  await online.locator('[autocomplete="current-password"]').fill(password);
  await online.locator('button.moria-button-primary').last().click();
  await readyIso(online);
  await online.getByText('Servidor autoritativo • LIVE').waitFor({ state: 'visible', timeout: 16000 });
  await online.locator('[data-testid="iso-player-hud"]').waitFor({ state: 'visible' });
  await online.locator('[data-testid="iso-authoritative-stats"]').waitFor({state:'visible'});
  await online.locator('[data-hud-window="chat"]').waitFor({state:'visible'});
  const playerHudRect=await online.locator('[data-testid="iso-player-hud"]').boundingBox();
  const statsHudRect=await online.locator('[data-testid="iso-authoritative-stats"]').boundingBox();
  const chatHudRect=await online.locator('[data-hud-window="chat"]').boundingBox();
  const hotbarRect=await online.locator('[data-iso-window="authoritative-action-bar"]').boundingBox();
  const overlaps=(a,b)=>Boolean(a&&b&&Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>4
    &&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>4);
  assert.ok(playerHudRect&&statsHudRect&&chatHudRect&&hotbarRect,
    'Desktop HUD geometry must be measurable in the real browser');
  for(const [first,a,second,b] of [
    ['player HUD',playerHudRect,'stats',statsHudRect],
    ['player HUD',playerHudRect,'chat',chatHudRect],
    ['stats',statsHudRect,'chat',chatHudRect],
    ['hotbar',hotbarRect,'chat',chatHudRect]
  ]){
    assert.equal(overlaps(a,b),false,`Desktop ${first} must not overlap ${second}`);
  }
  report.push('Desktop HUD: player vitals, authoritative stats, hotbar and chat occupy separate default regions');
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
  assert.equal(await online.locator('canvas[data-testid="iso-pixi-canvas"]')
    .getAttribute('data-city-detail-level'),'full',
    'Desktop must use complete medieval roof and facade geometry');
  report.push('Visual 2.6 desktop: detailed roofs, doors, parapets and masonry render at full geometry');
  assert.equal(await online.locator('canvas[data-testid="iso-pixi-canvas"]')
    .getAttribute('data-terrain-material-level'),'full',
    'Desktop must retain full terrain material detail');
  const desktopGeometry=await online.locator('canvas[data-testid="iso-pixi-canvas"]').evaluate(c=>({
    visible:Number(c.dataset.terrainVisibleTiles),buildMs:Number(c.dataset.terrainBuildMs),
    total:Number(c.dataset.terrainTiles)
  }));
  assert.ok(desktopGeometry.visible>0&&desktopGeometry.visible<=desktopGeometry.total,
    'Desktop tile geometry must be bounded by authoritative terrain patch');
  assert.ok(Number.isFinite(desktopGeometry.buildMs));
  report.push(`Visual 2.7 desktop: ${desktopGeometry.visible} visible server tiles; material detail full`);
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
  await online.locator('canvas[data-testid="iso-pixi-canvas"]')
    .screenshot({path:`${output}/online-city-canvas.png`});
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
  // Desktop gameplay contract: quest progress is owned by player.quests,
  // catalog by content_sync. The UI must use these real data sources.
  await online.waitForFunction(()=>{
    const q=window.__MORIA_AUTHORITATIVE_SNAPSHOT__?.player?.quests;
    return q&&Array.isArray(q.active)&&Array.isArray(q.completed);
  },null,{timeout:12000});
  await online.locator('[data-testid="iso-hotbar-slots"][data-desktop-hotkeys="enabled"]').waitFor({state:'visible'});
  await online.keyboard.press('i');
  await online.locator('[data-iso-window="inventory-equipment-loot"]').waitFor({state:'visible'});
  const inventoryPanel=online.locator('[data-iso-window="inventory-equipment-loot"] [data-testid="iso-gameplay-panel"]');
  await inventoryPanel.waitFor({state:'visible'});
  const inventoryShellBounds=await online.locator('[data-iso-window="inventory-equipment-loot"]').boundingBox();
  const inventoryInnerBounds=await inventoryPanel.boundingBox();
  assert.ok(inventoryShellBounds&&inventoryInnerBounds&&
    inventoryInnerBounds.x>=inventoryShellBounds.x&&
    inventoryInnerBounds.x+inventoryInnerBounds.width<=inventoryShellBounds.x+inventoryShellBounds.width+2,
    'Inventory must fit inside its draggable desktop window');
  await online.screenshot({path:`${output}/online-desktop-inventory.png`,fullPage:false});
  await online.keyboard.press('i');
  await online.locator('[data-iso-window="inventory-equipment-loot"]').waitFor({state:'hidden'});
  await online.keyboard.press('q');
  const questLog=online.locator('[data-iso-window="legacy-quests"] [data-testid="iso-authoritative-quest-log"]');
  await questLog.waitFor({state:'visible'});
  await online.waitForFunction(()=>{
    const e=document.querySelector('[data-testid="iso-quest-available-count"]');
    return e&&Number(e.textContent?.split('·').pop())>0;
  },null,{timeout:12000});
  const questButton=online.locator('[data-testid="iso-quest-accept"]:not([disabled])').first();
  await questButton.waitFor({state:'visible'});
  const questId=await questButton.getAttribute('data-quest-id');
  assert.ok(questId,'Server quest catalog must expose a stable quest ID');
  const rawQuest=serverContent.flatMap(c=>c.quests||[]).find(q=>q.id===questId);
  const questNpc=serverContent.flatMap(c=>c.npcs||[]).find(n=>n.id===rawQuest?.npcId);
  assert.ok(questNpc,'Visible quest must link to a server-supplied NPC');
  const giver=questLog.locator(`[data-testid="iso-quest-giver"][data-quest-id="${questId}"]`);
  await giver.waitFor({state:'visible'});
  const guideText=await giver.innerText();
  assert.ok(guideText.includes(questNpc.name),'Journal must identify its authoritative NPC');
  assert.ok(guideText.includes(`(${questNpc.posX}, ${questNpc.posY})`),
    'Journal must display current server NPC coordinates, not a client fixture');
  const questBounds=await online.locator('[data-iso-window="legacy-quests"]').boundingBox();
  const statsBounds=await online.locator('[data-testid="iso-authoritative-stats"]').boundingBox();
  assert.ok(questBounds&&statsBounds&&questBounds.y+questBounds.height+8<=statsBounds.y,
    'Desktop quest journal must scroll internally and never cover HP/mana HUD');
  const questScroll=await online.locator('[data-iso-window="legacy-quests"] [data-window-scroll="quest-journal"]')
    .evaluate(el=>({total:el.scrollHeight,visible:el.clientHeight}));
  assert.ok(questScroll.total>questScroll.visible,'Long quest catalog must remain independently scrollable');
  report.push('Desktop quest layout: scrollable log does not overlap authoritative HP/mana HUD');
  report.push(`Desktop quest navigation: ${questNpc.name} at (${questNpc.posX},${questNpc.posY}) from authenticated server content`);
  await online.screenshot({path:`${output}/online-desktop-quests.png`,fullPage:false});
  const questStart=desktopIntents.length;
  await questButton.click();
  const acceptedIntent=await waitForIntent('quest_accept',questStart);
  assert.equal(acceptedIntent.payload.questId,questId,
    'Quest UI must route to quest_accept, not the unrelated Tibia task channel');
  report.push(`Desktop quest diary: authenticated server catalog, player.quests state and official quest_accept intent (${questId})`);
  await online.keyboard.press('q');
  await questLog.waitFor({state:'hidden'});
  // Spells use the SAME authoritative cast intent through mouse and 1..0 keys.
  const enabledSpell=online.locator('[data-testid^="iso-spell-slot-"]:not([disabled])').first();
  await enabledSpell.waitFor({state:'visible'});
  const slot=Number((await enabledSpell.getAttribute('data-testid')).split('-').pop());
  assert.ok(Number.isInteger(slot)&&slot>=0&&slot<10);
  const castStart=desktopIntents.length;
  await online.keyboard.press(slot===9?'0':String(slot+1));
  const cast=await waitForIntent('cast',castStart);
  assert.equal(cast.payload.spellIndex,slot);
  report.push(`Desktop numbered hotbar: keyboard slot ${slot+1} sent official server-bound cast intent`);
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
  if (!desktopOnly) {
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
  assert.equal(mobileShader.state,'css-fallback','Mobile must avoid a second GPU WebGL context');
  assert.equal(mobileShader.profile,'mobile-css','Mobile atmosphere should use cheap biome CSS tint');
  report.push('Mobile atmosphere: real authoritative biome tint with no extra WebGL shader context');
  const beforeTouchPaint=Number(await mobileOnline.locator('canvas[data-testid="iso-pixi-canvas"]').getAttribute('data-drawn-frames'));
  assert.ok(beforeTouchPaint>0,'Mobile online scene must submit at least one GPU draw');
  assert.equal(await mobileOnline.locator('canvas[data-testid="iso-pixi-canvas"]')
    .getAttribute('data-city-detail-level'),'compact',
    'Mobile should keep the server buildings with cheaper medieval facade geometry');
  report.push('Visual 2.6 mobile: compact city mesh detail with identical server footprint');
  assert.equal(await mobileOnline.locator('canvas[data-testid="iso-pixi-canvas"]')
    .getAttribute('data-terrain-material-level'),'compact',
    'Mobile terrain decorative details must respect the compact budget');
  const mobileGeometry=await mobileOnline.locator('canvas[data-testid="iso-pixi-canvas"]').evaluate(c=>({
    visible:Number(c.dataset.terrainVisibleTiles),buildMs:Number(c.dataset.terrainBuildMs),
    total:Number(c.dataset.terrainTiles)
  }));
  assert.ok(mobileGeometry.visible>0&&mobileGeometry.visible<=mobileGeometry.total,
    'Mobile terrain tile count must stay bounded');
  assert.ok(Number.isFinite(mobileGeometry.buildMs));
  report.push(`Visual 2.7 mobile: ${mobileGeometry.visible} visible server tiles; material detail compact`);
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
    try{
      await mobileOnline.waitForFunction(y=>
        Number(window.__MORIA_AUTHORITATIVE_SNAPSHOT__?.player?.y)<y,firstY,{timeout:16000});
    }catch(error){
      const debug=await mobileOnline.evaluate(()=>{
        const p=window.__MORIA_AUTHORITATIVE_SNAPSHOT__?.player;
        const pixi=document.querySelector('canvas[data-testid="iso-pixi-canvas"]');
        return {player:{x:p?.x,y:p?.y,mapId:p?.mapId},touchActive:document.querySelector('[data-testid="iso-touch-dpad"]')?.getAttribute('data-touch-active'),gpuFrames:pixi?.dataset.drawnFrames,scheduler:pixi?.dataset.presentationScheduler};
      });
      await mobileOnline.screenshot({path:`${output}/touch-movement-failure.png`,fullPage:false});
      throw new Error(`Touchscreen authoritative movement timeout: ${JSON.stringify({firstY,debug,error:String(error)})}`);
    }
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
  }
  if (desktopOnly)report.push('Mobile tests intentionally deferred; frozen feature branch retained');

  if (issues.length) throw new Error(`Browser runtime errors:\n${issues.join('\n')}`);
  console.log('MOR\'IA ISO SMOKE PASS:\n' + report.join('\n'));
} catch (error) {
  console.error('MOR\'IA ISO SMOKE FAILED:', error);
  await writeFile(`${output}/failure.json`, JSON.stringify({ message: String(error), issues, report }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
