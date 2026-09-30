import test from 'node:test';
import assert from 'node:assert/strict';
import { handleAuthoritativeInteraction } from './authoritativeInteractionHandler.mjs';

const player={id:'p1',mapId:'eldoria',x:10,y:10};
const npcs=[{id:'merchant-1',name:'Lysa',role:'merchant',mapId:'eldoria',posX:11,posY:10}];
const resolvePosition=(_map,pos)=>pos;

test('accepts a server-owned nearby interaction and returns bounded feedback',()=>{
 const result=handleAuthoritativeInteraction({player,payload:{targetEntityId:'merchant-1',kind:'trade'},npcs,resolvePosition});
 assert.equal(result.ok,true);
 assert.equal(result.event.type,'interaction_accepted');
 assert.deepEqual(result.interaction,{targetEntityId:'merchant-1',kind:'trade',targetType:'npc',targetName:'Lysa'});
});

test('denies spoofed targets without echoing forged metadata',()=>{
 const result=handleAuthoritativeInteraction({player,payload:{targetEntityId:'fake',kind:'trade',reward:{gold:999999}},npcs,resolvePosition});
 assert.deepEqual(result,{ok:false,event:{type:'interaction_denied',reason:'target_not_found'}});
});

test('denies out-of-range server-owned targets',()=>{
 const far=[{...npcs[0],posX:40,posY:40}];
 const result=handleAuthoritativeInteraction({player,payload:{targetEntityId:'merchant-1',kind:'talk'},npcs:far,resolvePosition,maxDistance:3});
 assert.equal(result.ok,false);assert.equal(result.event.reason,'out_of_range');
});

test('denies interaction kinds not granted by authoritative content',()=>{
 const result=handleAuthoritativeInteraction({player,payload:{targetEntityId:'merchant-1',kind:'hostile'},npcs,resolvePosition});
 assert.equal(result.ok,false);assert.equal(result.event.reason,'kind_not_allowed');
});
