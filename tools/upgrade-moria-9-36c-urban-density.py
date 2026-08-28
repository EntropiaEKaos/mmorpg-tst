from pathlib import Path


def replace_once(path: str, old: str, new: str, marker: str):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    if marker in text:
        return
    if old not in text:
        raise SystemExit(f'{path}: anchor not found for {marker}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')

# ---- Grand Eldoria v2: authoritative residential fabric ----
p = Path('server/engine/GrandEldoria.mjs')
text = p.read_text(encoding='utf-8')
text = text.replace('export const GRAND_ELDORIA_VERSION = 1;', 'export const GRAND_ELDORIA_VERSION = 2;')
res_marker = 'export const GRAND_ELDORIA_RESIDENTIAL = Object.freeze(['
if res_marker not in text:
    anchor = "  { id:'eldoria_royal_stables', name:'Estábulos Reais', kind:'lodge', icon:'♞', x:98, y:108, w:14, h:10 },\n]);\n"
    residential = r'''  { id:'eldoria_royal_stables', name:'Estábulos Reais', kind:'lodge', icon:'♞', x:98, y:108, w:14, h:10 },
]);

export const GRAND_ELDORIA_RESIDENTIAL = Object.freeze([
  { id:'eldoria_residence_01', name:'Residência da Coroa I', kind:'house', icon:'⌂', x:54, y:42, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_02', name:'Residência da Coroa II', kind:'house', icon:'⌂', x:62, y:42, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_03', name:'Vila dos Escribas I', kind:'house', icon:'⌂', x:54, y:56, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_04', name:'Vila dos Escribas II', kind:'house', icon:'⌂', x:62, y:56, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_05', name:'Vila dos Escribas III', kind:'house', icon:'⌂', x:70, y:56, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_06', name:'Casario da Vigília', kind:'house', icon:'⌂', x:44, y:58, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_07', name:'Solar dos Sábios I', kind:'house', icon:'⌂', x:84, y:54, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_08', name:'Solar dos Sábios II', kind:'house', icon:'⌂', x:92, y:54, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_09', name:'Casario da Aurora I', kind:'house', icon:'⌂', x:110, y:56, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_10', name:'Casario da Aurora II', kind:'house', icon:'⌂', x:86, y:66, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_11', name:'Casario da Aurora III', kind:'house', icon:'⌂', x:88, y:72, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_12', name:'Vila Mercantil I', kind:'house', icon:'⌂', x:54, y:88, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_13', name:'Vila Mercantil II', kind:'house', icon:'⌂', x:54, y:96, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_14', name:'Vila Mercantil III', kind:'house', icon:'⌂', x:62, y:96, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_15', name:'Casario dos Artesãos I', kind:'house', icon:'⌂', x:44, y:114, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_16', name:'Casario dos Artesãos II', kind:'house', icon:'⌂', x:52, y:116, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_17', name:'Casario dos Artesãos III', kind:'house', icon:'⌂', x:62, y:118, w:6, h:3, showOnMinimap:false },
  { id:'eldoria_residence_18', name:'Residência Nobre I', kind:'house', icon:'⌂', x:90, y:100, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_19', name:'Residência Nobre II', kind:'house', icon:'⌂', x:110, y:100, w:6, h:5, showOnMinimap:false },
  { id:'eldoria_residence_20', name:'Residência dos Jardins', kind:'house', icon:'⌂', x:90, y:116, w:6, h:5, showOnMinimap:false },
]);
'''
    if anchor not in text:
        raise SystemExit('GrandEldoria residential insertion anchor missing')
    text = text.replace(anchor, residential, 1)
text = text.replace("  residentialRingEnabled:true, residentialRingDensity:5,", "  residentialRingEnabled:false, residentialRingDensity:0,")
text = text.replace("  districts, landmarks, props:Object.freeze(buildProps()), access:'public',", "  districts, landmarks:Object.freeze([...landmarks, ...GRAND_ELDORIA_RESIDENTIAL]), props:Object.freeze(buildProps()), access:'public',")
if 'const untouchedV1Architecture =' not in text:
    anchor = "  let changed = patchMap(eldoria);\n"
    upgrade = r'''  let changed = patchMap(eldoria);

  // 9.36C density upgrade. Only the untouched 9.36A/B landmark set is
  // expanded; administrator-authored architecture is never auto-filled.
  const currentLandmarks = Array.isArray(eldoria.landmarks) ? eldoria.landmarks : [];
  const untouchedV1Architecture = currentLandmarks.length === landmarks.length
    && currentLandmarks.every((entry, index) => JSON.stringify(entry) === JSON.stringify(landmarks[index]));
  if (untouchedV1Architecture) {
    eldoria.landmarks = [...currentLandmarks, ...clone(GRAND_ELDORIA_RESIDENTIAL)];
    if (eldoria.residentialRingEnabled === true && Number(eldoria.residentialRingDensity) === 5) {
      eldoria.residentialRingEnabled = false;
      eldoria.residentialRingDensity = 0;
    }
    changed = true;
  }
'''
    if anchor not in text:
        raise SystemExit('GrandEldoria migration density anchor missing')
    text = text.replace(anchor, upgrade, 1)
p.write_text(text, encoding='utf-8')

# ---- Preserve minimap visibility metadata through the client type/normalizer ----
p = Path('src/game/cityIdentity.ts')
text = p.read_text(encoding='utf-8')
if 'showOnMinimap?: boolean;' not in text:
    text = text.replace('  h: number;\n}', '  h: number;\n  showOnMinimap?: boolean;\n}', 1)
p.write_text(text, encoding='utf-8')

p = Path('src/game/maps.ts')
text = p.read_text(encoding='utf-8')
old = "    x: cityCoord(entry.x, Math.floor(width / 2), width), y: cityCoord(entry.y, Math.floor(height / 2), height), w: Math.max(1, Math.min(landmarkSizeLimit, Math.round(Number(entry.w) || 4))), h: Math.max(1, Math.min(landmarkSizeLimit, Math.round(Number(entry.h) || 4))),\n  }));"
new = "    x: cityCoord(entry.x, Math.floor(width / 2), width), y: cityCoord(entry.y, Math.floor(height / 2), height), w: Math.max(1, Math.min(landmarkSizeLimit, Math.round(Number(entry.w) || 4))), h: Math.max(1, Math.min(landmarkSizeLimit, Math.round(Number(entry.h) || 4))),\n    ...(entry.showOnMinimap === false ? { showOnMinimap: false } : {}),\n  }));"
if 'entry.showOnMinimap === false' not in text:
    if old not in text:
        raise SystemExit('maps.ts landmark normalizer anchor missing')
    text = text.replace(old, new, 1)
p.write_text(text, encoding='utf-8')

# ---- Preserve visibility metadata through authoritative server normalization ----
p = Path('server/engine/World.mjs')
text = p.read_text(encoding='utf-8')
old = "const landmarks = sourceLandmarks.filter(x=>x&&typeof x==='object').slice(0,landmarkLimit).map((x,index)=>({id:String(x.id||`${id}_landmark_${index+1}`).slice(0,60),name:String(x.name||`Landmark ${index+1}`).slice(0,60),kind:String(x.kind||'market').slice(0,20),icon:String(x.icon||'◆').slice(0,8),x:cityCoord(x.x,townCenter.x,width),y:cityCoord(x.y,townCenter.y,height),w:integer(x.w,1,landmarkSizeLimit,4),h:integer(x.h,1,landmarkSizeLimit,4)}));"
new = "const landmarks = sourceLandmarks.filter(x=>x&&typeof x==='object').slice(0,landmarkLimit).map((x,index)=>({id:String(x.id||`${id}_landmark_${index+1}`).slice(0,60),name:String(x.name||`Landmark ${index+1}`).slice(0,60),kind:String(x.kind||'market').slice(0,20),icon:String(x.icon||'◆').slice(0,8),x:cityCoord(x.x,townCenter.x,width),y:cityCoord(x.y,townCenter.y,height),w:integer(x.w,1,landmarkSizeLimit,4),h:integer(x.h,1,landmarkSizeLimit,4),...(x.showOnMinimap===false?{showOnMinimap:false}:{})}));"
if 'x.showOnMinimap===false' not in text:
    if old not in text:
        raise SystemExit('World.mjs landmark normalizer anchor missing')
    text = text.replace(old, new, 1)
p.write_text(text, encoding='utf-8')

# ---- Fix remaining 80x80 presentation clamps and keep residences off minimap ----
p = Path('src/game/cityPresentation.ts')
text = p.read_text(encoding='utf-8')
text = text.replace("import type { GameMap } from './maps';", "import { getMapDimensions, type GameMap } from './maps';")
if 'const { width: mapWidth, height: mapHeight } = getMapDimensions(map);' not in text:
    text = text.replace("  const tc = map.townCenter;\n  const homes:", "  const tc = map.townCenter;\n  const { width: mapWidth, height: mapHeight } = getMapDimensions(map);\n  const homes:", 1)
text = text.replace("    const x = Math.max(1, Math.min(78 - w, tc.x + dx));\n    const y = Math.max(1, Math.min(78 - h, tc.y + dy));", "    const x = Math.max(1, Math.min(mapWidth - w - 2, tc.x + dx));\n    const y = Math.max(1, Math.min(mapHeight - h - 2, tc.y + dy));")
text = text.replace("    ...map.landmarks.map((entry) => ({ id: entry.id, name: entry.name, icon: entry.icon, x: entry.x + entry.w / 2, y: entry.y + entry.h / 2, color: palette.accent, kind: 'landmark' as const })),", "    ...map.landmarks.filter((entry) => entry.showOnMinimap !== false).map((entry) => ({ id: entry.id, name: entry.name, icon: entry.icon, x: entry.x + entry.w / 2, y: entry.y + entry.h / 2, color: palette.accent, kind: 'landmark' as const })),")
if "const { width: ambientWidth, height: ambientHeight } = getMapDimensions(map);" not in text:
    text = text.replace("export function getAmbientCityProps(map: GameMap): CityProp[] {\n  const kinds = ambientKinds(map);", "export function getAmbientCityProps(map: GameMap): CityProp[] {\n  const kinds = ambientKinds(map);\n  const { width: ambientWidth, height: ambientHeight } = getMapDimensions(map);")
text = text.replace("    const x = Math.max(2, Math.min(77, Math.round(map.townCenter.x + dx)));\n    const y = Math.max(2, Math.min(77, Math.round(map.townCenter.y + dy)));", "    const x = Math.max(2, Math.min(ambientWidth - 3, Math.round(map.townCenter.x + dx)));\n    const y = Math.max(2, Math.min(ambientHeight - 3, Math.round(map.townCenter.y + dy)));")
p.write_text(text, encoding='utf-8')

# ---- Focused server/source tests ----
test = r'''import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GRAND_ELDORIA_MAP, GRAND_ELDORIA_RESIDENTIAL, GRAND_ELDORIA_VERSION, migrateGrandEldoriaData } from '../engine/GrandEldoria.mjs';
import { WorldManager } from '../engine/World.mjs';

const clone = value => JSON.parse(JSON.stringify(value));
const core = () => clone(GRAND_ELDORIA_MAP.landmarks.filter(entry => !String(entry.id).startsWith('eldoria_residence_')));

test('9.36C Grand Eldoria v2 has dense authoritative residential architecture', () => {
  assert.equal(GRAND_ELDORIA_VERSION, 2);
  assert.equal(GRAND_ELDORIA_RESIDENTIAL.length, 20);
  assert.equal(GRAND_ELDORIA_MAP.landmarks.length, 36);
  assert.ok(GRAND_ELDORIA_RESIDENTIAL.every(entry => entry.kind === 'house' && entry.showOnMinimap === false));
  assert.equal(GRAND_ELDORIA_MAP.residentialRingEnabled, false);
  assert.equal(GRAND_ELDORIA_MAP.residentialRingDensity, 0);
});

test('9.36C untouched v1 architecture upgrades to v2 exactly once', () => {
  const map = clone(GRAND_ELDORIA_MAP);
  map.landmarks = core();
  map.residentialRingEnabled = true;
  map.residentialRingDensity = 5;
  const data = { maps:[map], npcs:[], monsters:[], houses:[], nodes:[] };
  assert.equal(migrateGrandEldoriaData(data), true);
  assert.equal(map.landmarks.length, 36);
  assert.equal(map.residentialRingEnabled, false);
  assert.equal(map.residentialRingDensity, 0);
  assert.equal(migrateGrandEldoriaData(data), false);
  assert.equal(map.landmarks.length, 36);
});

test('9.36C admin-authored v1 architecture is never auto-filled', () => {
  const map = clone(GRAND_ELDORIA_MAP);
  map.landmarks = core();
  map.landmarks[0].x += 1;
  map.residentialRingEnabled = true;
  map.residentialRingDensity = 5;
  const data = { maps:[map], npcs:[], monsters:[], houses:[], nodes:[] };
  migrateGrandEldoriaData(data);
  assert.equal(map.landmarks.length, 16);
  assert.equal(map.landmarks[0].x, 73);
  assert.equal(map.residentialRingEnabled, true);
});

test('9.36C residential footprints are authoritative collision, not decorative ghosts', () => {
  const world = new WorldManager();
  const map = world.getMap('eldoria');
  assert.equal(map.landmarks.length, 36);
  for (const residence of GRAND_ELDORIA_RESIDENTIAL) {
    const tile = map.tiles[residence.y]?.[residence.x];
    assert.ok(tile);
    assert.equal(tile.walkable, false, residence.id);
    assert.equal(tile.blocksSight, true, residence.id);
  }
});

test('9.36C presentation code is dimension-aware and hides minor residences from minimap', () => {
  const source = fs.readFileSync(new URL('../../src/game/cityPresentation.ts', import.meta.url), 'utf8');
  const maps = fs.readFileSync(new URL('../../src/game/maps.ts', import.meta.url), 'utf8');
  const identity = fs.readFileSync(new URL('../../src/game/cityIdentity.ts', import.meta.url), 'utf8');
  assert.match(source, /getMapDimensions\(map\)/);
  assert.match(source, /entry\.showOnMinimap !== false/);
  assert.doesNotMatch(source, /Math\.min\(78 - w/);
  assert.doesNotMatch(source, /Math\.min\(77,/);
  assert.match(maps, /entry\.showOnMinimap === false/);
  assert.match(identity, /showOnMinimap\?: boolean/);
});
'''
Path('server/test/grand-eldoria-density-9-36.test.mjs').write_text(test, encoding='utf-8')

# ---- Update visual proof expectations for the denser authoritative city ----
source_capture = Path('tools/capture-moria-9-36b.mjs').read_text(encoding='utf-8')
capture = source_capture.replace('moria-9.36b-screenshots', 'moria-9.36c-screenshots').replace('9.36B', '9.36C')
capture = capture.replace("'11 distritos', '16 marcos'", "'11 distritos', '36 marcos'")
capture = capture.replace("'16/64 construções'", "'36/64 construções'")
capture = capture.replace("getAttribute('data-landmark-count') !== '16'", "getAttribute('data-landmark-count') !== '36'")
Path('tools/capture-moria-9-36c.mjs').write_text(capture, encoding='utf-8')

# ---- Documentation ----
doc_path = Path('docs/MORIA_9_36_GRAND_ELDORIA.md')
doc = doc_path.read_text(encoding='utf-8')
section = r'''

## 9.36C — densidade urbana autoritativa

A revisão humana do primeiro panorama 9.36B detectou que a geometria monumental estava correta, porém a massa construída ainda parecia esparsa. A correção foi feita no mundo, não no screenshot.

Grand Eldoria v2 passa de 16 para 36 footprints arquitetônicos autoritativos. Vinte residências de bairro são `house` reais: bloqueiam movimento e visão pela mesma geometria consumida pelo servidor, aparecem no City Designer e são renderizadas pelo jogo. Elas usam `showOnMinimap:false` para que o minimapa continue legível.

A antiga camada `residentialRing` de apresentação foi desativada em Eldoria, eliminando casas visuais atravessáveis. A migração v2 só adiciona a malha residencial quando o conjunto 9.36A/B estiver exatamente intacto; qualquer arquitetura editada pelo administrador é preservada. Também foram removidos clamps 77/78 restantes de `cityPresentation.ts`, tornando edifícios e props ambientais dimension-aware para futuras capitais.
'''
if '## 9.36C — densidade urbana autoritativa' not in doc:
    doc += section
doc_path.write_text(doc, encoding='utf-8')

print("Mor'ia 9.36C urban density pass prepared")
