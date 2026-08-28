from pathlib import Path
import json

def repl(path, old, new):
    p=Path(path); t=p.read_text()
    if old not in t: raise SystemExit(f'marker missing: {path}')
    p.write_text(t.replace(old,new,1))

for rel in ['package.json','package-lock.json','server/package.json','server/package-lock.json']:
    p=Path(rel); data=json.loads(p.read_text())
    if 'version' in data: data['version']='9.29.0'
    if rel.endswith('package-lock.json') and data.get('packages',{}).get('') is not None: data['packages']['']['version']='9.29.0'
    p.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')

# Rebuild the dominant city path into irregular, less repetitive cobbles.
old=r'''  tileCache.set(`path_${size}`, createTileCanvas((ctx, s) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#816b4f';
    ctx.fillRect(0, 0, s, s);
    const u = Math.max(1, Math.round(s / 16));
    for (let row = 0; row < 5; row++) {
      const yy = row * Math.max(u*3, Math.floor(s/5));
      const offset = row % 2 ? u*3 : 0;
      for (let xx = -offset; xx < s; xx += u*6) {
        const tone = hash(xx + row, row, 7) > .5 ? '#967b58' : '#755e45';
        ctx.fillStyle = '#5d4937';
        ctx.fillRect(xx, yy, u*5, u*3);
        ctx.fillStyle = tone;
        ctx.fillRect(xx+u, yy+u, u*4-1, u*2-1);
        ctx.fillStyle = 'rgba(226,199,151,.16)';
        ctx.fillRect(xx+u, yy+u, u*3, 1);
      }
    }
  }, size));'''
new=r'''  tileCache.set(`path_${size}`, createTileCanvas((ctx, s) => {
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#514a3d';
    ctx.fillRect(0, 0, s, s);
    const u = Math.max(1, Math.round(s / 32));
    const rows = 7;
    const rowH = Math.max(4, Math.floor(s / rows));
    for (let row = 0; row < rows; row++) {
      const yy = row * rowH;
      let xx = row % 2 ? -Math.floor(s * .09) : -Math.floor(s * .02);
      let col = 0;
      while (xx < s) {
        const r = hash(row * 31 + col, row + 7, 29);
        const stoneW = Math.max(5, Math.round(s * (.17 + r * .11)));
        const stoneH = Math.max(3, rowH - (r > .67 ? 2 : 1));
        const tones = ['#776b56','#887a61','#6c6252','#96866a','#7d715d'];
        const tone = tones[Math.floor(hash(row, col, 13) * tones.length)];
        ctx.fillStyle = '#39352f';
        ctx.fillRect(xx, yy, stoneW, rowH);
        ctx.fillStyle = tone;
        ctx.fillRect(xx + 1, yy + 1, Math.max(1, stoneW - 2), stoneH);
        ctx.fillStyle = 'rgba(231,213,178,.18)';
        ctx.fillRect(xx + 2, yy + 1, Math.max(1, stoneW - 4), 1);
        ctx.fillStyle = 'rgba(26,24,22,.22)';
        ctx.fillRect(xx + stoneW - 2, yy + 2, 1, Math.max(1, stoneH - 2));
        if (hash(row, col, 44) > .78) {
          ctx.fillStyle = '#4e6242';
          ctx.fillRect(xx + 1, yy + stoneH, Math.max(1, Math.round(stoneW * .35)), u);
        }
        if (hash(row, col, 61) > .83) {
          ctx.fillStyle = 'rgba(35,31,27,.55)';
          ctx.fillRect(xx + Math.floor(stoneW*.45), yy + 2, u, Math.max(1, Math.floor(stoneH*.55)));
          ctx.fillRect(xx + Math.floor(stoneW*.45), yy + Math.floor(stoneH*.55), Math.max(1,Math.floor(stoneW*.22)), u);
        }
        xx += stoneW + 1;
        col++;
      }
    }
    ctx.fillStyle = 'rgba(30,27,24,.12)';
    for (let i=0;i<9;i++) ctx.fillRect(Math.floor(hash(i,91)*s),Math.floor(hash(i,73)*s),u,u);
  }, size));'''
repl('src/game/render.ts',old,new)

# Give every building a cast/contact shadow and facade grounding before its authored material pass.
repl('src/game/render.ts', "  ctx.save();\n  ctx.imageSmoothingEnabled = false;\n\n  if (building.type === 'tree_deco') {", "  ctx.save();\n  ctx.imageSmoothingEnabled = false;\n\n  // 9.28 environment depth: buildings cast a short directional shadow plus a hard contact edge.\n  if (building.type !== 'tree_deco') {\n    ctx.fillStyle = 'rgba(0,0,0,.16)';\n    ctx.fillRect(Math.round(sx + tileSize*.18), Math.round(sy + h*.18), Math.max(3,Math.round(w*.92)), Math.max(3,Math.round(h*.76)));\n    ctx.fillStyle = 'rgba(0,0,0,.30)';\n    ctx.fillRect(Math.round(sx + w*.08), Math.round(sy + h*.86), Math.max(2,Math.round(w*.88)), Math.max(2,Math.round(h*.055)));\n  }\n\n  if (building.type === 'tree_deco') {")

# Scale authored humanoids slightly up and improve high-frequency material highlight.
repl('src/game/playerAvatar.ts','export const PIXEL_SPRITE_SCALE = 1.30;','export const PIXEL_SPRITE_SCALE = 1.42;')
repl('src/game/playerAvatar.ts', "  drawSpriteMatrix(ctx, cx, feetY + idle, size, frame, palette, direction === 'left');\n\n  // Tiny addon pixels", "  drawSpriteMatrix(ctx, cx, feetY + idle, size, frame, palette, direction === 'left');\n\n  // 9.29 one-pixel material glint: keeps larger silhouettes crisp rather than blurry.\n  const glint = Math.max(1, Math.round(size * PIXEL_SPRITE_SCALE / 32));\n  ctx.fillStyle = 'rgba(255,239,196,.20)';\n  ctx.fillRect(Math.round(cx - glint*2), Math.round(feetY - size*1.02 + idle), glint*2, glint);\n\n  // Tiny addon pixels")

# More monster families instead of funneling dragons/demons/ghosts into generic humanoids.
marker=r'''  } else if (/slime|ooze|blob/.test(id)) {
    drawPixelOutline(ctx, left + 2 * u, top + 8 * u, 10 * u, 8 * u, body);
    ctx.fillStyle = light;
    ctx.fillRect(left + 4 * u, top + 8 * u, 4 * u, u);
    ctx.fillStyle = '#111';
    ctx.fillRect(left + 4 * u, top + 11 * u, u, u);
    ctx.fillRect(left + 8 * u, top + 11 * u, u, u);
  } else {
'''
replacement=r'''  } else if (/slime|ooze|blob/.test(id)) {
    drawPixelOutline(ctx, left + 2 * u, top + 8 * u, 10 * u, 8 * u, body);
    ctx.fillStyle = light;
    ctx.fillRect(left + 4 * u, top + 8 * u, 4 * u, u);
    ctx.fillStyle = '#111';
    ctx.fillRect(left + 4 * u, top + 11 * u, u, u);
    ctx.fillRect(left + 8 * u, top + 11 * u, u, u);
  } else if (/dragon|wyrm|drake/.test(id)) {
    // Long reptilian silhouette with wing planes and horned head.
    ctx.fillStyle = dark;
    ctx.fillRect(left, top + 7*u, 5*u, 2*u);
    ctx.fillRect(left + 8*u, top + 6*u, 5*u, 2*u);
    drawPixelOutline(ctx, left + 3*u, top + 6*u, 8*u, 9*u, body);
    drawPixelOutline(ctx, left + 9*u, top + 4*u, 5*u, 6*u, body);
    ctx.fillStyle = shade(body,.66);
    ctx.fillRect(left + 2*u, top + 3*u, 4*u, 6*u);
    ctx.fillRect(left + 6*u, top + 2*u, 4*u, 5*u);
    ctx.fillStyle = light;
    ctx.fillRect(left + 10*u, top + 5*u, 2*u, u);
    ctx.fillStyle = '#ffd36b';
    ctx.fillRect(left + 12*u, top + 6*u, u, u);
    ctx.fillStyle = dark;
    ctx.fillRect(left + 4*u, top + 15*u, 2*u, 3*u);
    ctx.fillRect(left + 9*u, top + 15*u, 2*u, 3*u);
  } else if (/ghost|wraith|spirit|spect/.test(id)) {
    const fade = ctx.createLinearGradient(0,top+5*u,0,top+18*u);
    fade.addColorStop(0,light); fade.addColorStop(1,'rgba(130,160,180,.12)');
    ctx.fillStyle=fade;
    ctx.fillRect(left+3*u,top+5*u,8*u,10*u);
    ctx.fillRect(left+2*u,top+8*u,10*u,5*u);
    ctx.fillStyle='#0d151b';
    ctx.fillRect(left+5*u,top+8*u,u,u);ctx.fillRect(left+8*u,top+8*u,u,u);
    ctx.fillStyle='rgba(205,236,255,.35)';
    ctx.fillRect(left+4*u,top+5*u,4*u,u);
  } else if (/demon|fiend|devil/.test(id)) {
    drawPixelOutline(ctx,left+3*u,top+4*u,7*u,11*u,body);
    ctx.fillStyle=dark;
    ctx.fillRect(left+2*u,top+1*u,2*u,5*u);ctx.fillRect(left+9*u,top+1*u,2*u,5*u);
    ctx.fillRect(left,top+7*u,3*u,8*u);ctx.fillRect(left+10*u,top+7*u,3*u,8*u);
    ctx.fillStyle='#ff9a45';
    ctx.fillRect(left+5*u,top+7*u,u,u);ctx.fillRect(left+8*u,top+7*u,u,u);
    ctx.fillStyle=light;ctx.fillRect(left+5*u,top+11*u,3*u,u);
  } else if (/lich|necromancer/.test(id)) {
    drawPixelOutline(ctx,left+3*u,top+3*u,7*u,6*u,'#b9c4b5');
    drawPixelOutline(ctx,left+2*u,top+9*u,9*u,7*u,body);
    ctx.fillStyle='#73d9ff';
    ctx.fillRect(left+5*u,top+5*u,u,u);ctx.fillRect(left+8*u,top+5*u,u,u);
    ctx.fillStyle=dark;ctx.fillRect(left,top+8*u,2*u,9*u);ctx.fillRect(left+11*u,top+8*u,2*u,9*u);
    ctx.fillStyle=light;ctx.fillRect(left+5*u,top+10*u,3*u,u);
  } else {
'''
repl('src/game/classicEntityPresentation.ts',marker,replacement)

Path('docs/MORIA_9_28_9_29_TERRAIN_CHARACTERS.md').write_text('''# Mor\'ia 9.28–9.29 — Terrain Materials & Character Readability\n\n## 9.28 Terrain / environment\n- irregular multi-tone city cobbles replace the repeating brick carpet;\n- cracks, moss seams and randomized stone widths create material variation;\n- buildings gain directional cast shadows and a harder grounding/contact edge;\n- environment depth remains presentation-only.\n\n## 9.29 Characters / creatures\n- authored humanoid sprite scale increases from 1.30 to 1.42 for stronger world readability;\n- pixel glints preserve crisp material separation at the larger silhouette;\n- dragons/wyrms, ghosts/wraiths, demons and lich/necromancers now have dedicated procedural silhouettes;\n- elite/boss aura and contact-shadow language from 9.27 remains intact.\n''')
print('9.28/9.29 applied')
