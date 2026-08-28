from pathlib import Path

# Fifth/final art pass: authored city lights react to presentation darkness.
# No authoritative state is changed.

p = Path('src/game/cityPresentation.ts')
s = p.read_text(encoding='utf-8')
needle = "function drawPropGlyph(ctx: CanvasRenderingContext2D, prop: CityProp, x: number, y: number, size: number, time: number, accent: string) {"
replacement = "function drawPropGlyph(ctx: CanvasRenderingContext2D, prop: CityProp, x: number, y: number, size: number, time: number, accent: string, darkness = 0) {"
assert needle in s, 'drawPropGlyph signature not found'
s = s.replace(needle, replacement, 1)

needle = """  const pulse = 0.72 + Math.sin(time / 450 + prop.x) * 0.08;\n  ctx.save();"""
replacement = """  const pulse = 0.72 + Math.sin(time / 450 + prop.x) * 0.08;\n  const lightDarkness = Math.max(0, Math.min(1, darkness));\n  const emissiveScale = .55 + lightDarkness * 2.5;\n  ctx.save();"""
assert needle in s, 'pulse insertion point not found'
s = s.replace(needle, replacement, 1)

needle = """  ctx.fillStyle = 'rgba(30,35,27,.13)';\n  ctx.fillRect(x + size*.31, y + size*.75, size*.38, Math.max(1, size*.04));\n\n  switch (prop.kind) {"""
replacement = """  ctx.fillStyle = 'rgba(30,35,27,.13)';\n  ctx.fillRect(x + size*.31, y + size*.75, size*.38, Math.max(1, size*.04));\n\n  // Night-sensitive floor bounce anchors authored emissive props to nearby masonry.\n  if (lightDarkness > .06 && (prop.kind === 'lamp' || prop.kind === 'brazier' || prop.kind === 'crystal')) {\n    const warm = prop.kind === 'crystal' ? '151,143,255' : prop.kind === 'brazier' ? '255,112,48' : '255,205,105';\n    ctx.save();\n    ctx.globalCompositeOperation = 'lighter';\n    const floorAlpha = Math.min(.18, .035 + lightDarkness * .22);\n    ctx.fillStyle = `rgba(${warm},${floorAlpha})`;\n    ctx.fillRect(x + size*.25, y + size*.79, size*.50, Math.max(1, size*.04));\n    ctx.fillStyle = `rgba(${warm},${floorAlpha*.42})`;\n    ctx.fillRect(x + size*.34, y + size*.84, size*.32, Math.max(1, size*.03));\n    ctx.restore();\n  }\n\n  switch (prop.kind) {"""
assert needle in s, 'floor bounce insertion point not found'
s = s.replace(needle, replacement, 1)

s = s.replace("drawLocalEmissiveHalo(ctx,cx,y+size*.32,size*.50,'255,205,105',.16 + pulse*.07);", "drawLocalEmissiveHalo(ctx,cx,y+size*.32,size*(.46 + lightDarkness*.16),'255,205,105',(.16 + pulse*.07)*emissiveScale);")
s = s.replace("drawLocalEmissiveHalo(ctx,cx,cy-u*4,size*.58,'255,118,48',.14 + pulse*.09);", "drawLocalEmissiveHalo(ctx,cx,cy-u*4,size*(.52 + lightDarkness*.20),'255,118,48',(.14 + pulse*.09)*emissiveScale);")
s = s.replace("drawLocalEmissiveHalo(ctx,cx,y+size*.43,size*.53,'151,143,255',.11 + pulse*.07);", "drawLocalEmissiveHalo(ctx,cx,y+size*.43,size*(.48 + lightDarkness*.18),'151,143,255',(.11 + pulse*.07)*emissiveScale);")

needle = """export function drawCityDecor(\n  ctx: CanvasRenderingContext2D,\n  map: GameMap,\n  camera: { x: number; y: number },\n  tileSize: number,\n  time: number,\n) {"""
replacement = """export function drawCityDecor(\n  ctx: CanvasRenderingContext2D,\n  map: GameMap,\n  camera: { x: number; y: number },\n  tileSize: number,\n  time: number,\n  darkness = 0,\n) {"""
assert needle in s, 'drawCityDecor signature not found'
s = s.replace(needle, replacement, 1)
needle = "drawPropGlyph(ctx, prop, sx, sy, tileSize, time, palette.accent);"
replacement = "drawPropGlyph(ctx, prop, sx, sy, tileSize, time, palette.accent, darkness);"
assert needle in s, 'drawPropGlyph call not found'
s = s.replace(needle, replacement, 1)
p.write_text(s, encoding='utf-8')

p = Path('src/components/GameScreen.tsx')
s = p.read_text(encoding='utf-8')
needle = "drawCityDecor(ctx, MAPS[currentMapIdRef.current] || MAPS.eldoria, cam, TILE_SIZE, now);"
replacement = "drawCityDecor(ctx, MAPS[currentMapIdRef.current] || MAPS.eldoria, cam, TILE_SIZE, now, legacyOverrideDarkness(dayTimeOverrideRef.current, worldClockRef.current.darkness));"
assert needle in s, 'GameScreen drawCityDecor call not found'
s = s.replace(needle, replacement, 1)
p.write_text(s, encoding='utf-8')

p = Path('server/test/visual-revamp-9-27.test.mjs')
s = p.read_text(encoding='utf-8')
s += r'''

test('9.27 final lighting pass strengthens authored lights only when presentation is dark', () => {
  const city = read('src/game/cityPresentation.ts');
  const game = read('src/components/GameScreen.tsx');
  assert.match(city, /emissiveScale = \.55 \+ lightDarkness \* 2\.5/);
  assert.match(city, /Night-sensitive floor bounce/);
  assert.match(city, /darkness = 0/);
  assert.match(game, /drawCityDecor\([^;]+legacyOverrideDarkness\(dayTimeOverrideRef\.current, worldClockRef\.current\.darkness\)\)/);
  assert.doesNotMatch(city, /serverSync|sendOfficial|fetch\(|WebSocket/);
});
'''
p.write_text(s, encoding='utf-8')
print("Applied Mor'ia 9.27 night-sensitive authored lighting")
