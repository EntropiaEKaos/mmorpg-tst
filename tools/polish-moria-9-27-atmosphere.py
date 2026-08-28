from pathlib import Path

# Fourth visual pass: weather-reactive world surfaces + grounded local emissive props.
# Presentation only; no gameplay state or server authority is touched.

p = Path('src/game/worldVisualRevamp927.ts')
s = p.read_text(encoding='utf-8')
needle = """  // Cinematic vignette and subtle inner frame improve focus/readability.\n  const vignette = ctx.createRadialGradient(w * .50, h * .46, Math.min(w, h) * .20, w * .50, h * .48, Math.max(w, h) * .69);"""
replacement = """  // Weather-reactive wet surface response: rain changes the material read, not gameplay.\n  if (weather === 'rain' || weather === 'storm') {\n    ctx.globalCompositeOperation = 'soft-light';\n    const wet = ctx.createLinearGradient(0, 0, w, h);\n    wet.addColorStop(0, weather === 'storm' ? 'rgba(126,154,188,.16)' : 'rgba(150,178,202,.10)');\n    wet.addColorStop(.46, 'rgba(88,117,146,.035)');\n    wet.addColorStop(1, weather === 'storm' ? 'rgba(18,31,50,.18)' : 'rgba(26,43,61,.08)');\n    ctx.fillStyle = wet;\n    ctx.fillRect(0, 0, w, h);\n    ctx.globalCompositeOperation = 'lighter';\n    const glintCount = weather === 'storm' ? 22 : 13;\n    for (let i = 0; i < glintCount; i++) {\n      const gx = Math.round(hash(i * 17 + 41) * w);\n      const gy = Math.round(h * (.48 + hash(i * 13 + 29) * .47));\n      const gw = 5 + Math.round(hash(i * 19 + 7) * 22);\n      const pulse = .025 + Math.max(0, Math.sin(time * .0012 + i * 1.7)) * .035;\n      ctx.fillStyle = `rgba(188,215,235,${pulse})`;\n      ctx.fillRect(gx, gy, gw, 1);\n      if ((i & 3) === 0) ctx.fillRect(gx + Math.round(gw * .25), gy + 2, Math.max(2, Math.round(gw * .42)), 1);\n    }\n    ctx.globalCompositeOperation = 'source-over';\n  }\n\n  // Storm pressure and rare lightning exposure give weather visual consequence.\n  if (weather === 'storm') {\n    const stormShade = ctx.createLinearGradient(0, 0, 0, h);\n    stormShade.addColorStop(0, 'rgba(16,27,46,.16)');\n    stormShade.addColorStop(.62, 'rgba(20,30,42,.035)');\n    stormShade.addColorStop(1, 'rgba(7,13,22,.10)');\n    ctx.fillStyle = stormShade;\n    ctx.fillRect(0, 0, w, h);\n    const lightningWave = Math.max(0, Math.sin(time * .0067 + 2.4));\n    const lightning = lightningWave > .985 ? Math.pow((lightningWave - .985) / .015, 2) * .16 : 0;\n    if (lightning > 0) {\n      ctx.globalCompositeOperation = 'screen';\n      ctx.fillStyle = `rgba(200,220,255,${lightning})`;\n      ctx.fillRect(0, 0, w, h);\n      ctx.globalCompositeOperation = 'source-over';\n    }\n  }\n\n  // Cinematic vignette and subtle inner frame improve focus/readability.\n  const vignette = ctx.createRadialGradient(w * .50, h * .46, Math.min(w, h) * .20, w * .50, h * .48, Math.max(w, h) * .69);"""
assert needle in s, 'world cinematic insertion point not found'
s = s.replace(needle, replacement, 1)
p.write_text(s, encoding='utf-8')

p = Path('src/game/cityPresentation.ts')
s = p.read_text(encoding='utf-8')
needle = """function drawPropGlyph(ctx: CanvasRenderingContext2D, prop: CityProp, x: number, y: number, size: number, time: number, accent: string) {"""
helper = """function drawLocalEmissiveHalo(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, rgb: string, alpha: number) {\n  // Local emissive halo is presentation-only; the crisp pixel prop remains the visual anchor.\n  ctx.save();\n  ctx.globalCompositeOperation = 'lighter';\n  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);\n  halo.addColorStop(0, `rgba(${rgb},${alpha})`);\n  halo.addColorStop(.36, `rgba(${rgb},${alpha * .38})`);\n  halo.addColorStop(1, `rgba(${rgb},0)`);\n  ctx.fillStyle = halo;\n  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);\n  ctx.restore();\n}\n\nfunction drawPropGlyph(ctx: CanvasRenderingContext2D, prop: CityProp, x: number, y: number, size: number, time: number, accent: string) {"""
assert needle in s, 'prop glyph insertion point not found'
s = s.replace(needle, helper, 1)

needle = """  ctx.save();\n  ctx.imageSmoothingEnabled = false;\n\n  switch (prop.kind) {"""
replacement = """  ctx.save();\n  ctx.imageSmoothingEnabled = false;\n\n  // Ground every prop before drawing the authored pixel silhouette.\n  ctx.fillStyle = 'rgba(13,15,13,.24)';\n  ctx.fillRect(x + size*.22, y + size*.78, size*.56, Math.max(2, size*.075));\n  ctx.fillStyle = 'rgba(30,35,27,.13)';\n  ctx.fillRect(x + size*.31, y + size*.75, size*.38, Math.max(1, size*.04));\n\n  switch (prop.kind) {"""
assert needle in s, 'prop grounding insertion point not found'
s = s.replace(needle, replacement, 1)

needle = """    case 'lamp':\n      pixelRect(ctx,cx-u,y+size*.31,u*2,size*.52,'#42392d');\n      ctx.fillStyle=`rgba(255,211,104,${pulse*.25})`;ctx.fillRect(cx-u*5,y+size*.17,u*10,u*10);\n      pixelRect(ctx,cx-u*2,y+size*.21,u*4,u*5,'#e7bd5c');\n      ctx.fillStyle='#fff0a7';ctx.fillRect(cx-u,y+size*.23,u*2,u*2); break;"""
replacement = """    case 'lamp':\n      drawLocalEmissiveHalo(ctx,cx,y+size*.32,size*.50,'255,205,105',.16 + pulse*.07);\n      pixelRect(ctx,cx-u,y+size*.31,u*2,size*.52,'#42392d');\n      ctx.fillStyle=`rgba(255,211,104,${pulse*.25})`;ctx.fillRect(cx-u*5,y+size*.17,u*10,u*10);\n      pixelRect(ctx,cx-u*2,y+size*.21,u*4,u*5,'#e7bd5c');\n      ctx.fillStyle='#fff0a7';ctx.fillRect(cx-u,y+size*.23,u*2,u*2); break;"""
assert needle in s, 'lamp case not found'
s = s.replace(needle, replacement, 1)

needle = """    case 'brazier':\n      pixelRect(ctx,cx-u*4,cy,u*8,u*3,'#524438');\n      ctx.fillStyle='#8f3926';ctx.fillRect(cx-u*3,cy-u*3,u*6,u*3);\n      ctx.fillStyle='#ff9737';ctx.fillRect(cx-u*2,cy-u*6,u*4,u*4);ctx.fillStyle='#ffd15e';ctx.fillRect(cx-u,cy-u*7,u*2,u*4); break;"""
replacement = """    case 'brazier':\n      drawLocalEmissiveHalo(ctx,cx,cy-u*4,size*.58,'255,118,48',.14 + pulse*.09);\n      pixelRect(ctx,cx-u*4,cy,u*8,u*3,'#524438');\n      ctx.fillStyle='#8f3926';ctx.fillRect(cx-u*3,cy-u*3,u*6,u*3);\n      ctx.fillStyle='#ff9737';ctx.fillRect(cx-u*2,cy-u*6,u*4,u*4);ctx.fillStyle='#ffd15e';ctx.fillRect(cx-u,cy-u*7,u*2,u*4); break;"""
assert needle in s, 'brazier case not found'
s = s.replace(needle, replacement, 1)

needle = """    case 'crystal':\n      ctx.fillStyle=prop.color || accent;ctx.fillRect(cx-u*2,y+size*.28,u*4,u*8);ctx.fillRect(cx-u,y+size*.18,u*2,u*12);\n      ctx.fillStyle='rgba(255,255,255,.52)';ctx.fillRect(cx-u,y+size*.22,u,u*5); break;"""
replacement = """    case 'crystal':\n      drawLocalEmissiveHalo(ctx,cx,y+size*.43,size*.53,'151,143,255',.11 + pulse*.07);\n      ctx.fillStyle=prop.color || accent;ctx.fillRect(cx-u*2,y+size*.28,u*4,u*8);ctx.fillRect(cx-u,y+size*.18,u*2,u*12);\n      ctx.fillStyle='rgba(255,255,255,.52)';ctx.fillRect(cx-u,y+size*.22,u,u*5); break;"""
assert needle in s, 'crystal case not found'
s = s.replace(needle, replacement, 1)
p.write_text(s, encoding='utf-8')

p = Path('server/test/visual-revamp-9-27.test.mjs')
s = p.read_text(encoding='utf-8')
s += r'''

test('9.27 fourth pass makes weather and authored lights visually reactive only', () => {
  const fx = read('src/game/worldVisualRevamp927.ts');
  const city = read('src/game/cityPresentation.ts');
  assert.match(fx, /Weather-reactive wet surface response/);
  assert.match(fx, /weather === 'rain' \|\| weather === 'storm'/);
  assert.match(fx, /Storm pressure and rare lightning exposure/);
  assert.match(city, /drawLocalEmissiveHalo/);
  assert.match(city, /Ground every prop/);
  assert.doesNotMatch(fx + city, /sendOfficial|serverSync|fetch\(|WebSocket/);
});
'''
p.write_text(s, encoding='utf-8')
print("Applied Mor'ia 9.27 fourth-pass reactive atmosphere polish")
