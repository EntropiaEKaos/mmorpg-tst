import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAuthoritativeInteractionTargets } from './authoritativeInteractionTargets.mjs';

const player={mapId:'eldoria',x:10,y:10};
const npcs=[
 {id:'merchant-1',name:'Lysa',role:'merchant',mapId:'eldoria',posX:11,posY:10},
 {id:'guard-1',name:'Aldren',role:'guard',mapId:'eldoria',posX:9,posY:10},
 {id:'other-map',name:'Far Away',role:'merchant',mapId:'dungeon',posX:1,posY:1},
];

test('derives only current-map server-owned NPC targets',()=>{
 const targets=buildAuthoritativeInteractionTargets({player,npcs,resolvePosition:(_map,pos)=>pos});
 assert.equal(targets.length,2);
 assert.deepEqual(targets[0],{id:'merchant-1',mapId:'eldoria',x:11,y:10,type:'npc',name:'Lysa',interactionKinds:['talk','trade']});
 assert.deepEqual(targets[1].interactionKinds,['talk']);
});

test('uses server position resolver and drops invalid positions',()=>{
 const targets=buildAuthoritativeInteractionTargets({player,npcs:[npcs[0]],resolvePosition:()=>({x:20,y:21})});
 assert.equal(targets[0].x,20);assert.equal(targets[0].y,21);
 assert.deepEqual(buildAuthoritativeInteractionTargets({player,npcs:[npcs[0]],resolvePosition:()=>null}),[]);
});

test('honors bounded explicit interaction kinds but ignores unknown kinds',()=>{
 const targets=buildAuthoritativeInteractionTargets({player,npcs:[{...npcs[0],interactionKinds:['inspect','admin_grant','trade','trade']}],resolvePosition:(_map,pos)=>pos});
 assert.deepEqual(targets[0].interactionKinds,['inspect','trade']);
});

test('never consumes client-supplied target metadata',()=>{
 const forgedPlayer={...player,targetEntityId:'fake',interactionKinds:['admin_grant'],reward:{gold:999999}};
 const targets=buildAuthoritativeInteractionTargets({player:forgedPlayer,npcs:[npcs[1]],resolvePosition:(_map,pos)=>pos});
 assert.equal(targets.length,1);assert.equal(targets[0].id,'guard-1');assert.equal('reward' in targets[0],false);
});
