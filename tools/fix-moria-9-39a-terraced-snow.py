from pathlib import Path

ROOT=Path('.')

def replace(path,old,new,label):
    p=ROOT/path; text=p.read_text(encoding='utf-8')
    if new in text: return
    if old not in text: raise SystemExit(f'{label} anchor missing in {path}')
    p.write_text(text.replace(old,new,1),encoding='utf-8')

def replace_all(path,old,new):
    p=ROOT/path; text=p.read_text(encoding='utf-8')
    if old not in text: return
    p.write_text(text.replace(old,new),encoding='utf-8')

# Canonical plan name promised by the 9.39 architecture.
for path in ['server/engine/GrandFrostpeak.mjs','server/engine/World.mjs','src/game/maps.ts','server/test/grand-frostpeak-9-39.test.mjs','docs/MORIA_9_39_GRAND_FROSTPEAK.md']:
    replace_all(path,'alpine-terraces','terraced-bastion')
for path in ['server/engine/World.mjs','src/game/maps.ts','server/test/grand-frostpeak-9-39.test.mjs']:
    replace_all(path,'alpineCapitalTile','terracedBastionTile')

# Correct two legacy monster coordinates from the authoritative AlphaContent formula.
replace_all('server/engine/GrandFrostpeak.mjs',"frostpeak_glacier_golem:{from:[42,20]","frostpeak_glacier_golem:{from:[42,62]")
replace_all('server/engine/GrandFrostpeak.mjs',"frostpeak_yeti_warmaster:{from:[50,27]","frostpeak_yeti_warmaster:{from:[50,69]")
replace_all('server/test/grand-frostpeak-9-39.test.mjs',"frostpeak_glacier_golem',mapId:'frostpeak',posX:42,posY:20","frostpeak_glacier_golem',mapId:'frostpeak',posX:42,posY:62")
replace_all('server/test/grand-frostpeak-9-39.test.mjs',"frostpeak_yeti_warmaster',mapId:'frostpeak',posX:50,posY:27","frostpeak_yeti_warmaster',mapId:'frostpeak',posX:50,posY:69")

# A real fourth travel gate makes the Ironwood/Frostpeak road symmetric.
replace('server/engine/GrandFrostpeak.mjs',
"    {x:80,y:18,targetMap:'crystal_deep',targetX:40,targetY:70,label:'💎 Descida do Cristal'},\n  ]),",
"    {x:80,y:18,targetMap:'crystal_deep',targetX:40,targetY:70,label:'💎 Descida do Cristal'},\n    {x:80,y:139,targetMap:'ironwood',targetX:80,targetY:24,label:'🌲 Estrada de Ironwood'},\n  ]),",
'Frostpeak Ironwood portal')
replace('server/engine/GrandFrostpeak.mjs',
"portal.targetMap==='eldoria'||portal.targetMap==='emberhold'",
"portal.targetMap==='eldoria'||portal.targetMap==='emberhold'||portal.targetMap==='ironwood'",
'Frostpeak built-in Ironwood portal')
replace_all('server/test/grand-frostpeak-9-39.test.mjs','assert.equal(map.portals.length,3);','assert.equal(map.portals.length,4);')

# Built-in/offline Emberhold must arrive at the new eastern Frostpeak gate too.
for path in ['server/engine/World.mjs','src/game/maps.ts']:
    replace(path,
    "targetMap: 'frostpeak', targetSpawn: { x: 12, y: 70 }, label: '❄ To Frostpeak'",
    "targetMap: 'frostpeak', targetSpawn: { x: 130, y: 112 }, label: '❄ To Frostpeak'",
    f'{path} Emberhold arrival')

# Off-road capital courtyards are snow, not generic brown floor.
for path in ['server/engine/World.mjs','src/game/maps.ts']:
    replace(path,
    "return {type:(vertical||terraceRoad||highCourt||forgeCourt||expeditionCourt||lowerCourt)?'path':'floor',walkable:true,blocksSight:false};",
    "return {type:(vertical||terraceRoad||highCourt||forgeCourt||expeditionCourt||lowerCourt)?'path':'snow',walkable:true,blocksSight:false};",
    f'{path} snowy courtyards')

# Snow is a first-class tile and the default open ground of snow biomes.
replace('src/game/types.ts',"  | 'sand'\n  | 'path'","  | 'sand'\n  | 'snow'\n  | 'path'",'snow tile type')
for path,prefix in [('server/engine/World.mjs','config'),('src/game/maps.ts','biome')]:
    if path.endswith('World.mjs'):
        replace(path,"          if (config.biome === 'snow') {\n            if (r < 0.15)","          if (config.biome === 'snow') {\n            type = 'snow';\n            if (r < 0.15)",'server snow ground')
    else:
        replace(path,"        if (biome === 'snow') {\n          if (r < 0.15)","        if (biome === 'snow') {\n          type = 'snow';\n          if (r < 0.15)",'client snow ground')

snow_cache=r'''
  tileCache.set(`snow_${size}`, createTileCanvas((ctx, s) => {
    ctx.imageSmoothingEnabled = false;
    const grad = ctx.createLinearGradient(0, 0, s, s);
    grad.addColorStop(0, '#eef7fb'); grad.addColorStop(.55, '#dcecf4'); grad.addColorStop(1, '#bfd3df');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, s, s);
    const px = Math.max(1, Math.round(s / 32));
    for (let i = 0; i < 24; i++) {
      const xx = Math.floor(hash(i, 71) * s / px) * px, yy = Math.floor(hash(i, 79) * s / px) * px;
      ctx.fillStyle = hash(i,83) > .45 ? 'rgba(255,255,255,.48)' : 'rgba(126,161,181,.18)';
      ctx.fillRect(xx, yy, px * (hash(i,89) > .78 ? 2 : 1), px);
    }
    ctx.fillStyle='rgba(255,255,255,.34)'; ctx.fillRect(0,0,s,px);
    ctx.fillStyle='rgba(90,126,148,.10)'; ctx.fillRect(0,s-px,s,px);
  }, size));

'''
replace('src/game/render.ts',"\n  tileCache.set(`path_${size}`, createTileCanvas((ctx, s) => {","\n"+snow_cache+"  tileCache.set(`path_${size}`, createTileCanvas((ctx, s) => {",'snow renderer')
replace('src/game/render.ts',
"  } else if (type === 'grass' || type === 'sand') {\n    ctx.fillStyle = type === 'grass' ? 'rgba(210,228,144,.08)' : 'rgba(255,235,174,.11)';",
"  } else if (type === 'grass' || type === 'sand' || type === 'snow') {\n    ctx.fillStyle = type === 'grass' ? 'rgba(210,228,144,.08)' : type === 'snow' ? 'rgba(255,255,255,.16)' : 'rgba(255,235,174,.11)';",
'snow material finish')

# The old sample was inside a minor residence; test a real open snowy courtyard.
replace_all('server/test/grand-frostpeak-9-39.test.mjs',"assert.equal(map.tiles[58][70].type,'path');assert.equal(map.tiles[52][70].type,'floor');","assert.equal(map.tiles[58][70].type,'path');assert.equal(map.tiles[60][90].type,'snow');")

p=ROOT/'server/test/grand-frostpeak-9-39.test.mjs'; text=p.read_text(encoding='utf-8')
marker="test('9.39A snow is a real shared tile instead of green fallback'"
if marker not in text:
    text += r'''

test('9.39A snow is a real shared tile instead of green fallback',()=>{
  const map=new WorldManager().getMap('frostpeak');assert.equal(map.tiles[60][90].type,'snow');
  const types=fs.readFileSync(new URL('../../src/game/types.ts',import.meta.url),'utf8');const render=fs.readFileSync(new URL('../../src/game/render.ts',import.meta.url),'utf8');
  assert.match(types,/\| 'snow'/);assert.match(render,/tileCache\.set\(`snow_/);
});
'''
    p.write_text(text,encoding='utf-8')

p=ROOT/'docs/MORIA_9_39_GRAND_FROSTPEAK.md'; text=p.read_text(encoding='utf-8')
if '### Neve como terreno real' not in text:
    text += "\n### Neve como terreno real\n\nA 9.39 também transforma `snow` em tile de terreno caminhável de primeira classe no cliente e no renderer. Biomas nevados deixam de herdar grama verde como piso aberto; pátios de Frostpeak e áreas externas agora usam neve real, mantendo servidor e cliente em paridade.\n"
    p.write_text(text,encoding='utf-8')

print("Mor'ia 9.39A terraced-bastion + snow hardening prepared")
