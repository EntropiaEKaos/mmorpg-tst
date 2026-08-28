from pathlib import Path


def read(path): return Path(path).read_text()
def write(path, text): Path(path).write_text(text)
def replace(path, old, new, count=1):
    text = read(path)
    if old not in text:
        raise SystemExit(f'anchor missing in {path}: {old[:120]!r}')
    write(path, text.replace(old, new, count))

# Player nameplates: true sprite-top anchoring with guaranteed head clearance.
replace('src/game/playerAvatar.ts',
"  nameplateShowValues?: boolean;\n}",
"  nameplateShowValues?: boolean;\n  nameplateHeadClearance?: number;\n  nameplateStackGap?: number;\n}")
old = """  // 9.7 compact nameplate policy. Values are map-authored through Content Studio,
  // but bounded here so a bad presentation edit can never explode the renderer.
  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  const manaPct = Math.max(0, Math.min(1, mana / Math.max(1, maxMana)));
  const scale = clampNumber(nameplate?.nameplateScale, 0.55, 1.5, 0.82);
  const offsetY = clampNumber(nameplate?.nameplateOffsetY, -32, 12, -9);
  const barW = Math.round(clampNumber(nameplate?.nameplateBarWidth, 18, 64, 30) * scale);
  const barH = Math.max(2, Math.round(clampNumber(nameplate?.nameplateBarHeight, 2, 8, 3) * scale));
  const fontSize = Math.max(7, Math.round(clampNumber(nameplate?.nameplateFontSize, 7, 14, 8) * scale));
  const showValues = nameplate?.nameplateShowValues === true;
  const barX = Math.round(cx - barW / 2);
  const nameY = Math.round(y + offsetY);
  const hpBarY = nameY + 3;
  const manaBarY = hpBarY + barH + 1;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.strokeStyle = 'rgba(0,0,0,0.95)';
  ctx.lineWidth = Math.max(2, Math.round(scale * 2));
  ctx.strokeText(name, cx, nameY);
  ctx.fillStyle = '#f4e6bd';
  ctx.fillText(name, cx, nameY);

  ctx.fillStyle = '#090a0b';
  ctx.fillRect(barX - 1, hpBarY - 1, barW + 2, barH + 2);
  ctx.fillRect(barX - 1, manaBarY - 1, barW + 2, barH + 2);
  ctx.fillStyle = '#4b171b';
  ctx.fillRect(barX, hpBarY, barW, barH);
  ctx.fillStyle = '#d93643';
  ctx.fillRect(barX, hpBarY, Math.round(barW * hpPct), barH);
  ctx.fillStyle = '#122949';
  ctx.fillRect(barX, manaBarY, barW, barH);
  ctx.fillStyle = '#3781d8';
  ctx.fillRect(barX, manaBarY, Math.round(barW * manaPct), barH);
"""
new = """  // 9.7.1 safe-stack policy: anchor to the authored sprite top, never the tile center.
  const hpPct = Math.max(0, Math.min(1, hp / Math.max(1, maxHp)));
  const manaPct = Math.max(0, Math.min(1, mana / Math.max(1, maxMana)));
  const scale = clampNumber(nameplate?.nameplateScale, 0.55, 1.5, 0.82);
  const offsetY = clampNumber(nameplate?.nameplateOffsetY, -32, 12, 0);
  const barW = Math.round(clampNumber(nameplate?.nameplateBarWidth, 18, 64, 30) * scale);
  const barH = Math.max(2, Math.round(clampNumber(nameplate?.nameplateBarHeight, 2, 8, 3) * scale));
  const fontSize = Math.max(7, Math.round(clampNumber(nameplate?.nameplateFontSize, 7, 14, 8) * scale));
  const headClearance = Math.round(clampNumber(nameplate?.nameplateHeadClearance, 4, 24, 7) * scale);
  const stackGap = Math.max(1, Math.round(clampNumber(nameplate?.nameplateStackGap, 1, 8, 2) * scale));
  const showValues = nameplate?.nameplateShowValues === true;
  const barX = Math.round(cx - barW / 2);
  const humanCell = Math.max(1, Math.round((mounted ? size * 0.84 : size) * PIXEL_SPRITE_SCALE / 24));
  const spriteTop = mounted
    ? Math.round(feetY - cell * 6 - CITIZEN_FRAME.length * humanCell)
    : Math.round(feetY - CITIZEN_FRAME.length * humanCell);
  const nameLineH = fontSize + 2;
  const stackH = nameLineH + stackGap + barH + 1 + barH;
  // Positive legacy offsets cannot lower the plate into the protected head zone.
  const safeBottom = spriteTop - headClearance + Math.min(0, Math.round(offsetY));
  const stackTop = safeBottom - stackH;
  const nameY = stackTop + fontSize;
  const hpBarY = stackTop + nameLineH + stackGap;
  const manaBarY = hpBarY + barH + 1;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.strokeStyle = 'rgba(0,0,0,0.95)';
  ctx.lineWidth = Math.max(2, Math.round(scale * 2));
  ctx.strokeText(name, cx, nameY);
  ctx.fillStyle = '#f4e6bd';
  ctx.fillText(name, cx, nameY);

  ctx.fillStyle = '#090a0b';
  ctx.fillRect(barX - 1, hpBarY - 1, barW + 2, barH + 2);
  ctx.fillRect(barX - 1, manaBarY - 1, barW + 2, barH + 2);
  ctx.fillStyle = '#4b171b';
  ctx.fillRect(barX, hpBarY, barW, barH);
  ctx.fillStyle = '#d93643';
  ctx.fillRect(barX, hpBarY, Math.round(barW * hpPct), barH);
  ctx.fillStyle = '#122949';
  ctx.fillRect(barX, manaBarY, barW, barH);
  ctx.fillStyle = '#3781d8';
  ctx.fillRect(barX, manaBarY, Math.round(barW * manaPct), barH);
"""
replace('src/game/playerAvatar.ts', old, new)

# Map contract and client normalization.
replace('src/game/maps.ts',
"  nameplateShowValues?: boolean;\n  residentialRingEnabled?: boolean;",
"  nameplateShowValues?: boolean;\n  nameplateHeadClearance?: number;\n  nameplateStackGap?: number;\n  residentialRingEnabled?: boolean;")
replace('src/game/maps.ts',
"      nameplateShowValues: typeof raw.nameplateShowValues === 'boolean' ? raw.nameplateShowValues : base?.nameplateShowValues,\n      residentialRingEnabled:",
"      nameplateShowValues: typeof raw.nameplateShowValues === 'boolean' ? raw.nameplateShowValues : base?.nameplateShowValues,\n      nameplateHeadClearance: Number.isFinite(Number(raw.nameplateHeadClearance)) ? Math.max(4, Math.min(24, Number(raw.nameplateHeadClearance))) : base?.nameplateHeadClearance,\n      nameplateStackGap: Number.isFinite(Number(raw.nameplateStackGap)) ? Math.max(1, Math.min(8, Number(raw.nameplateStackGap))) : base?.nameplateStackGap,\n      residentialRingEnabled:")

# Smart world labels: sprite-aware height and less noisy common-monster HP.
replace('src/game/worldNameplates.ts',
"  size: number;\n  distance: number;",
"  size: number;\n  visualHeight?: number;\n  distance: number;")
replace('src/game/worldNameplates.ts',
"  const showBar=request.distance<=options.monsterBarDistance||boss||request.targeted;",
"  const damaged=hp<maxHp;\n  const showBar=boss||request.targeted===true||(elite&&request.distance<=options.monsterBarDistance)||(damaged&&request.distance<=options.monsterBarDistance);")
replace('src/game/worldNameplates.ts',
"    const preferredY=request.y-Math.round(request.size*(boss?.58:.40))-height;",
"    const visualHeight=Math.max(request.size*.55,request.visualHeight??request.size*.86);\n    const spriteTop=request.y+request.size-visualHeight;\n    const preferredY=Math.round(spriteTop-5-height);")
replace('src/game/worldNameplates.ts',
"      size,distance:dist(playerPos,n.pos),entity:{name:n.name,role:n.role},",
"      size,visualHeight:size*.88,distance:dist(playerPos,n.pos),entity:{name:n.name,role:n.role},")
replace('src/game/worldNameplates.ts',
"      kind:'monster',x:sx,y:sy,size,distance:dist(playerPos,{x:mx,y:my}),targeted:String(targetId||'')===String(m.id||''),",
"      kind:'monster',x:sx,y:sy,size,visualHeight:size*Math.max(.68,Math.min(1.55,.72+Number(m.size??m.msSize??1)*.32)),distance:dist(playerPos,{x:mx,y:my}),targeted:String(targetId||'')===String(m.id||''),")

# Public NPC projection. NPCs may not occupy blocked architecture or private housing interiors.
write('src/game/spatialIntegrity.ts', """import type { NPC, Tile } from './types';

type HouseBounds = { x?: number; y?: number; width?: number; height?: number };

function walkable(world: Tile[][], x: number, y: number): boolean {
  return Number.isInteger(x) && Number.isInteger(y) && Boolean(world[y]?.[x]?.walkable);
}
function insideHouse(houses: HouseBounds[], x: number, y: number): boolean {
  return houses.some((house) => {
    const hx=Number(house?.x), hy=Number(house?.y), w=Number(house?.width), h=Number(house?.height);
    return Number.isFinite(hx)&&Number.isFinite(hy)&&Number.isFinite(w)&&Number.isFinite(h)&&x>=hx&&x<hx+w&&y>=hy&&y<hy+h;
  });
}

export function nearestPublicWalkableTile(world: Tile[][], origin: {x:number;y:number}, houses: HouseBounds[] = [], maxRadius = 14) {
  const ox=Math.round(Number(origin?.x)||0), oy=Math.round(Number(origin?.y)||0);
  if (walkable(world,ox,oy)&&!insideHouse(houses,ox,oy)) return {x:ox,y:oy};
  for (let radius=1;radius<=maxRadius;radius++) {
    for (let dy=-radius;dy<=radius;dy++) {
      const dx=radius-Math.abs(dy);
      for (const x of dx===0?[ox]:[ox-dx,ox+dx]) {
        const y=oy+dy;
        if (walkable(world,x,y)&&!insideHouse(houses,x,y)) return {x,y};
      }
    }
  }
  return null;
}

export function enforceNpcSpatialIntegrity(npcs: NPC[], world: Tile[][], houses: HouseBounds[] = []): number {
  let repaired=0;
  for (const npc of npcs) {
    if (!npc?.pos) continue;
    if (walkable(world,npc.pos.x,npc.pos.y)&&!insideHouse(houses,npc.pos.x,npc.pos.y)) continue;
    const safe=nearestPublicWalkableTile(world,npc.pos,houses);
    if (!safe) continue;
    npc.pos={...safe}; repaired++;
  }
  return repaired;
}
""")
replace('src/components/GameScreen.tsx',
"import { createWorldLabelQueue } from '../game/worldNameplates';",
"import { createWorldLabelQueue } from '../game/worldNameplates';\nimport { enforceNpcSpatialIntegrity } from '../game/spatialIntegrity';")
replace('src/components/GameScreen.tsx',
"    const worldLabels=createWorldLabelQueue(p.pos,p.targetId);\n    // NPCs",
"    // Project ambient NPCs into public walkable space before draw/interaction presentation.\n    enforceNpcSpatialIntegrity(npcsRef.current, world, Array.isArray(p.housing?.houses) ? p.housing.houses : []);\n    const worldLabels=createWorldLabelQueue(p.pos,p.targetId);\n    // NPCs")

# Server nearest-walkable primitive.
replace('server/engine/World.mjs',
"  findWalkableSpawn(map, preferred) {\n    if (preferred && map?.tiles?.[preferred.y]?.[preferred.x]?.walkable) return { ...preferred };",
"  findNearestWalkable(map, preferred, maxRadius = 14, reject = null) {\n    const ox = Math.round(Number(preferred?.x) || 0), oy = Math.round(Number(preferred?.y) || 0);\n    const ok = (x, y) => Boolean(map?.tiles?.[y]?.[x]?.walkable) && !(typeof reject === 'function' && reject(x, y));\n    if (ok(ox, oy)) return { x: ox, y: oy };\n    for (let radius = 1; radius <= maxRadius; radius++) {\n      for (let dy = -radius; dy <= radius; dy++) {\n        const dx = radius - Math.abs(dy);\n        const xs = dx === 0 ? [ox] : [ox - dx, ox + dx];\n        for (const x of xs) { const y = oy + dy; if (ok(x, y)) return { x, y }; }\n      }\n    }\n    return null;\n  }\n\n  findWalkableSpawn(map, preferred) {\n    const nearest = preferred ? this.findNearestWalkable(map, preferred, 14) : null;\n    if (nearest) return nearest;")
replace('server/engine/World.mjs',
"    nameplateOffsetY: boundedNumber(record?.nameplateOffsetY, -32, 12, base?.nameplateOffsetY ?? -9),",
"    nameplateOffsetY: boundedNumber(record?.nameplateOffsetY, -32, 12, base?.nameplateOffsetY ?? 0),")
replace('server/engine/World.mjs',
"    nameplateShowValues: typeof record?.nameplateShowValues === 'boolean' ? record.nameplateShowValues : (base?.nameplateShowValues ?? false),",
"    nameplateShowValues: typeof record?.nameplateShowValues === 'boolean' ? record.nameplateShowValues : (base?.nameplateShowValues ?? false),\n    nameplateHeadClearance: boundedNumber(record?.nameplateHeadClearance, 4, 24, base?.nameplateHeadClearance ?? 7),\n    nameplateStackGap: boundedNumber(record?.nameplateStackGap, 1, 8, base?.nameplateStackGap ?? 2),")
replace('server/engine/World.mjs',
"      nameplateBarHeight: config.nameplateBarHeight, nameplateFontSize: config.nameplateFontSize, nameplateShowValues: config.nameplateShowValues,",
"      nameplateBarHeight: config.nameplateBarHeight, nameplateFontSize: config.nameplateFontSize, nameplateShowValues: config.nameplateShowValues,\n      nameplateHeadClearance: config.nameplateHeadClearance, nameplateStackGap: config.nameplateStackGap,")

# Housing spatial integrity. Interiors stay enterable for authorized players; ambient NPCs stay public.
replace('server/engine/HousingSystem.mjs',
"import { isGmCharacter } from './ContentAccess.mjs';",
"import { isGmCharacter } from './ContentAccess.mjs';\nimport { WORLD } from './World.mjs';")
replace('server/engine/HousingSystem.mjs',
"function publicDef(def){return{id:def.id,name:def.name,mapId:def.mapId,x:Number(def.x),y:Number(def.y),width:Number(def.width),height:Number(def.height),entranceX:Number(def.entranceX),entranceY:Number(def.entranceY),price:Math.max(0,Math.floor(Number(def.price)||0)),weeklyRent:Math.max(0,Math.floor(Number(def.weeklyRent)||0)),levelRequired:Math.max(1,Math.floor(Number(def.levelRequired)||1)),style:def.style||'cottage'};}",
"function publicDef(def){return{id:def.id,name:def.name,mapId:def.mapId,x:Number(def.x),y:Number(def.y),width:Number(def.width),height:Number(def.height),entranceX:Number(def.entranceX),entranceY:Number(def.entranceY),price:Math.max(0,Math.floor(Number(def.price)||0)),weeklyRent:Math.max(0,Math.floor(Number(def.weeklyRent)||0)),levelRequired:Math.max(1,Math.floor(Number(def.levelRequired)||1)),style:def.style||'cottage'};}\nfunction overlap(a,b){return Number(a.x)<Number(b.x)+Number(b.width??b.w)&&Number(a.x)+Number(a.width??a.w)>Number(b.x)&&Number(a.y)<Number(b.y)+Number(b.height??b.h)&&Number(a.y)+Number(a.height??a.h)>Number(b.y);}\nfunction protectedPoint(def,p){return p&&inside(def,Number(p.x),Number(p.y));}")
replace('server/engine/HousingSystem.mjs',
"  defs(contentDB=this.contentDB){return contentDB.get('houses');}\n  record(id)",
"  defs(contentDB=this.contentDB){return contentDB.get('houses');}\n  validateDefinition(def,contentDB=this.contentDB){\n    if(!def||typeof def!=='object')return'Invalid house definition.';\n    const map=WORLD.getMap(def.mapId); if(!map)return'House map does not exist.';\n    const d=publicDef(def);\n    if(!Number.isInteger(d.x)||!Number.isInteger(d.y)||!Number.isInteger(d.width)||!Number.isInteger(d.height)||d.width<2||d.height<2||d.x<1||d.y<1||d.x+d.width>=map.width||d.y+d.height>=map.height)return'House footprint is outside playable map bounds.';\n    if(!Number.isInteger(d.entranceX)||!Number.isInteger(d.entranceY)||!map.tiles?.[d.entranceY]?.[d.entranceX]?.walkable)return'House entrance must be on a walkable public tile.';\n    const nearBox=d.entranceX>=d.x-2&&d.entranceX<=d.x+d.width+1&&d.entranceY>=d.y-2&&d.entranceY<=d.y+d.height+1;\n    if(!nearBox)return'House entrance must stay beside its footprint.';\n    if(protectedPoint(d,map.spawnPoint)||(map.portals||[]).some(p=>protectedPoint(d,p.pos)))return'House footprint overlaps a protected spawn or portal tile.';\n    for(const source of WORLD.getDefinitions())for(const portal of source.portals||[])if(portal.targetMap===d.mapId&&protectedPoint(d,{x:portal.targetX,y:portal.targetY}))return'House footprint overlaps a protected portal arrival tile.';\n    if((map.landmarks||[]).some(mark=>overlap(d,{...mark,width:mark.w,height:mark.h})))return'House footprint overlaps authoritative city architecture.';\n    if(this.defs(contentDB).some(other=>other?.id!==d.id&&other?.mapId===d.mapId&&overlap(d,other)))return'House footprint overlaps another housing plot.';\n    return null;\n  }\n  validateMapEdit(record,contentDB=this.contentDB){\n    if(!record||typeof record!=='object'||!record.id)return null;\n    const houses=this.defs(contentDB).filter(h=>h?.mapId===record.id);\n    const landmarks=Array.isArray(record.landmarks)?record.landmarks:[];\n    const spawn={x:Number(record.spawnX??record.spawnPoint?.x),y:Number(record.spawnY??record.spawnPoint?.y)};\n    const portals=Array.isArray(record.portals)?record.portals:[];\n    for(const house of houses){\n      if(landmarks.some(mark=>overlap(house,{...mark,width:mark.w,height:mark.h})))return`Map architecture overlaps housing plot ${house.id}.`;\n      if(protectedPoint(house,spawn)||portals.some(p=>protectedPoint(house,{x:Number(p.x??p.pos?.x),y:Number(p.y??p.pos?.y)})))return`Map spawn/portal overlaps housing plot ${house.id}.`;\n    }\n    return null;\n  }\n  resolvePublicPosition(mapId,origin,contentDB=this.contentDB){\n    const map=WORLD.getMap(mapId); if(!map)return null;\n    const houses=this.defs(contentDB).filter(def=>def?.mapId===mapId&&this.validateDefinition(def,contentDB)===null);\n    return WORLD.findNearestWalkable(map,origin,14,(x,y)=>houses.some(def=>inside(def,x,y)));\n  }\n  record(id)")
replace('server/engine/HousingSystem.mjs',
"  houseAt(mapId,x,y,contentDB=this.contentDB){return this.defs(contentDB).find(def=>def.mapId===mapId&&inside(def,x,y))||null;}",
"  houseAt(mapId,x,y,contentDB=this.contentDB){return this.defs(contentDB).find(def=>def.mapId===mapId&&this.validateDefinition(def,contentDB)===null&&inside(def,x,y))||null;}")
replace('server/engine/HousingSystem.mjs',
"  buy(player,houseId,contentDB=this.contentDB,now=Date.now()){const def=this.defs(contentDB).find(entry=>entry.id===cleanId(houseId));if(!def)return{ok:false,error:'Unknown house.'};",
"  buy(player,houseId,contentDB=this.contentDB,now=Date.now()){const def=this.defs(contentDB).find(entry=>entry.id===cleanId(houseId));if(!def)return{ok:false,error:'Unknown house.'};const spatialError=this.validateDefinition(def,contentDB);if(spatialError)return{ok:false,error:spatialError};")
replace('server/engine/HousingSystem.mjs',
"  snapshot(player,contentDB=this.contentDB){this.maintainPlayer(player,contentDB);const mapId=player?.mapId;const ownedId=this.ownedBy(player?.name);const houses=this.defs(contentDB).filter(def=>def.mapId===mapId).map(def=>",
"  snapshot(player,contentDB=this.contentDB){this.maintainPlayer(player,contentDB);const mapId=player?.mapId;const ownedId=this.ownedBy(player?.name);const houses=this.defs(contentDB).filter(def=>def.mapId===mapId&&this.validateDefinition(def,contentDB)===null).map(def=>")

# Server NPC interaction uses the same public-space projection.
old = """    return contentDB.get('npcs').some(npc => npc && npc.mapId === player.mapId
      && (npc.id === wanted || npc.role === wanted)
      && Number.isFinite(Number(npc.posX)) && Number.isFinite(Number(npc.posY))
      && Math.abs(Number(npc.posX) - player.x) + Math.abs(Number(npc.posY) - player.y) <= range);"""
new = """    return contentDB.get('npcs').some(npc => {
      if (!npc || npc.mapId !== player.mapId || (npc.id !== wanted && npc.role !== wanted)) return false;
      if (!Number.isFinite(Number(npc.posX)) || !Number.isFinite(Number(npc.posY))) return false;
      const safe = housingSystem.resolvePublicPosition(player.mapId, { x: Number(npc.posX), y: Number(npc.posY) }, contentDB);
      return Boolean(safe) && Math.abs(safe.x - player.x) + Math.abs(safe.y - player.y) <= range;
    });"""
replace('server/engine/GameState.mjs', old, new)

# Studio controls + write-time spatial validation.
replace('server/engine/ContentStudio.mjs',
"    field('nameplateShowValues', 'Show HP/Mana values', 'boolean'), field('residentialRingEnabled'",
"    field('nameplateShowValues', 'Show HP/Mana values', 'boolean'), field('nameplateHeadClearance', 'Head clearance px', 'number'), field('nameplateStackGap', 'Name/bar gap px', 'number'), field('residentialRingEnabled'")
replace('server/engine/ContentStudio.mjs',
"['nameplateFontSize',7,14],['residentialRingDensity',0,10]",
"['nameplateFontSize',7,14],['nameplateHeadClearance',4,24],['nameplateStackGap',1,8],['residentialRingDensity',0,10]")
replace('server/engine/ContentStudio.mjs',
"    if (Number(record.x)+Number(record.width)>MAP_WIDTH-1 || Number(record.y)+Number(record.height)>MAP_HEIGHT-1) return 'house interior exceeds map bounds';\n    return null;",
"    if (Number(record.x)+Number(record.width)>MAP_WIDTH-1 || Number(record.y)+Number(record.height)>MAP_HEIGHT-1) return 'house interior exceeds map bounds';\n    const nearBox=Number(record.entranceX)>=Number(record.x)-2&&Number(record.entranceX)<=Number(record.x)+Number(record.width)+1&&Number(record.entranceY)>=Number(record.y)-2&&Number(record.entranceY)<=Number(record.y)+Number(record.height)+1;\n    if(!nearBox)return 'house entrance must stay beside its footprint';\n    return null;")
replace('server/server.js',
"      const referenceError = validateContentReferences(contentDB, type, candidate);\n      if (referenceError) return json(res, 409, { error: referenceError });",
"      const referenceError = validateContentReferences(contentDB, type, candidate);\n      if (referenceError) return json(res, 409, { error: referenceError });\n      const spatialError = type === 'houses' ? housingSystem.validateDefinition(candidate, contentDB) : type === 'maps' ? housingSystem.validateMapEdit(candidate, contentDB) : null;\n      if (spatialError) return json(res, 409, { error: spatialError });")

# Regression tests.
ref = read('server/test/reference-visual-9-7.test.mjs') + """

test('9.7.1 player plates reserve authored head clearance and world labels respect sprite height', () => {
  const avatar=read('src/game/playerAvatar.ts');
  const labels=read('src/game/worldNameplates.ts');
  const maps=read('src/game/maps.ts');
  const studio=read('server/engine/ContentStudio.mjs');
  assert.match(avatar,/const spriteTop = mounted/);
  assert.match(avatar,/nameplateHeadClearance/);
  assert.match(avatar,/safeBottom = spriteTop - headClearance/);
  assert.match(labels,/visualHeight/);
  assert.match(labels,/const damaged=hp<maxHp/);
  assert.match(maps,/nameplateStackGap/);
  assert.match(studio,/Head clearance px/);
});

test('9.7.1 ambient NPC projection repairs blocked architecture and excludes housing interiors', () => {
  const spatial=read('src/game/spatialIntegrity.ts');
  const screen=read('src/components/GameScreen.tsx');
  assert.match(spatial,/nearestPublicWalkableTile/);
  assert.match(spatial,/insideHouse/);
  assert.match(screen,/enforceNpcSpatialIntegrity/);
});
"""
write('server/test/reference-visual-9-7.test.mjs', ref)

write('server/test/housing-spatial-9-7-1.test.mjs', """import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { HousingSystem } from '../engine/HousingSystem.mjs';
import { ALPHA_SYSTEMS_CONTENT } from '../engine/AlphaSystemsContent.mjs';
import { WORLD } from '../engine/World.mjs';

function dbWith(houses){return{get(type){if(type==='houses')return houses;if(type==='housingDecor')return[];return[];}};}

test('9.7.1 housing rejects protected architecture overlap and projects ambient NPC space outside interiors',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moria-house-spatial-'));
  const houses=ALPHA_SYSTEMS_CONTENT.houses.map(h=>({...h}));
  const db=dbWith(houses); const system=new HousingSystem(db,path.join(dir,'housing.json'));
  const valid=houses.find(h=>system.validateDefinition(h,db)===null);
  assert.ok(valid,'at least one shipped housing plot must be spatially valid');
  const map=WORLD.getMap(valid.mapId); const mark=map.landmarks[0];
  const bad={...valid,id:'bad_architecture',x:mark.x,y:mark.y,width:Math.max(2,Math.min(5,mark.w)),height:Math.max(2,Math.min(4,mark.h)),entranceX:Math.max(1,mark.x-1),entranceY:mark.y};
  assert.ok(system.validateDefinition(bad,db));
  const safe=system.resolvePublicPosition(valid.mapId,{x:valid.x,y:valid.y},db);
  assert.ok(safe); assert.equal(system.houseAt(valid.mapId,safe.x,safe.y,db),null);
  assert.equal(map.tiles[safe.y][safe.x].walkable,true);
  fs.rmSync(dir,{recursive:true,force:true});
});

test('9.7.1 map edits cannot silently place authoritative landmarks over housing plots',()=>{
  const houses=ALPHA_SYSTEMS_CONTENT.houses.map(h=>({...h})); const db=dbWith(houses); const system=new HousingSystem(db,path.join(os.tmpdir(),`moria-housing-${Date.now()}.json`));
  const h=houses[0];
  const error=system.validateMapEdit({id:h.mapId,spawnX:40,spawnY:40,portals:[],landmarks:[{x:h.x,y:h.y,w:h.width,h:h.height}]},db);
  assert.match(error,/housing plot/i);
});
""")
