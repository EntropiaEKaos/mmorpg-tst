import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveInteraction, interactionAcceptedEvent, interactionDeniedEvent } from './interactionResolver.mjs';

const player={id:'p1',mapId:'eldoria',x:10,y:10};
const merchant={id:'npc:merchant:1',mapId:'eldoria',x:11,y:10,type:'npc',name:'Lysa',interactionKinds:['talk','trade']};

function resolve(payload,targets=[merchant],maxDistance=3){return resolveInteraction({player,payload,targets,maxDistance});}

test('accepts an allowed nearby authoritative target',()=>{const result=resolve({targetEntityId:merchant.id,kind:'trade'});assert.equal(result.ok,true);assert.deepEqual(result.interaction,{targetEntityId:merchant.id,kind:'trade',targetType:'npc',targetName:'Lysa'});});

test('rejects spoofed or missing target ids',()=>{assert.deepEqual(resolve({targetEntityId:'ambient:fake',kind:'talk'}),{ok:false,reason:'target_not_found'});});

test('rejects cross-map targets',()=>{const target={...merchant,mapId:'dungeon'};assert.deepEqual(resolve({targetEntityId:target.id,kind:'talk'},[target]),{ok:false,reason:'wrong_map'});});

test('rejects out-of-range interactions',()=>{const target={...merchant,x:30,y:30};assert.deepEqual(resolve({targetEntityId:target.id,kind:'talk'},[target]),{ok:false,reason:'out_of_range'});});

test('rejects client-selected interaction kinds not allowed by target',()=>{assert.deepEqual(resolve({targetEntityId:merchant.id,kind:'hostile'}),{ok:false,reason:'kind_not_allowed'});});

test('rejects unknown interaction kinds before target resolution',()=>{assert.deepEqual(resolve({targetEntityId:merchant.id,kind:'admin_grant'}),{ok:false,reason:'invalid_request'});});

test('ignores client supplied position and metadata',()=>{const result=resolve({targetEntityId:merchant.id,kind:'trade',x:11,y:10,targetName:'Forged',reward:{gold:999999}});assert.equal(result.ok,true);assert.equal(result.interaction.targetName,'Lysa');assert.equal('reward' in result.interaction,false);});

test('builds bounded server feedback events',()=>{assert.deepEqual(interactionDeniedEvent('out_of_range'),{type:'interaction_denied',reason:'out_of_range'});const interaction={targetEntityId:merchant.id,kind:'trade',targetType:'npc',targetName:'Lysa'};assert.deepEqual(interactionAcceptedEvent(interaction),{type:'interaction_accepted',interaction});});
