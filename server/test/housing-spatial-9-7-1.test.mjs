import test from 'node:test';
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
